// Outgoing e-mail through Gmail SMTP (smtp.gmail.com:465, implicit TLS) with a Google App Password.
// Credentials come only from Cloudflare secrets: GMAIL_USER (the Gmail address) and GMAIL_APP_PASSWORD (16-letter App Password).
// Nothing secret is ever logged: errors carry only a short category and the SMTP status code.
// The socket comes from `cloudflare:sockets` in production; tests pass their own `connect` (same interface).

const HOST = 'smtp.gmail.com';
const PORT = 465;
const TIMEOUT_MS = 20000;

export const mailConfigured = (env) => !!(env?.GMAIL_USER && env?.GMAIL_APP_PASSWORD);

export class MailError extends Error {
  constructor(stage, code = 0) { super(`smtp_${stage}${code ? `_${code}` : ''}`); this.stage = stage; this.code = code; }
}

const enc = new TextEncoder();
const b64 = (s) => { const bytes = enc.encode(s); let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); };
const wrap76 = (s) => s.replace(/.{1,76}/g, '$&\r\n').trimEnd();
const encWord = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const cleanHeader = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();

/** RFC 5322 message: multipart/alternative (plain text + HTML), UTF-8, base64 bodies (no line-length / dot issues). */
export function buildMessage({ from, fromName, to, subject, text, html, domain = 'nursehubegypt.com' }) {
  const boundary = `nh_${crypto.randomUUID().replace(/-/g, '')}`;
  const id = `<${crypto.randomUUID()}@${domain}>`;
  return [
    `From: ${encWord(cleanHeader(fromName))} <${cleanHeader(from)}>`,
    `To: <${cleanHeader(to)}>`,
    `Subject: ${encWord(cleanHeader(subject))}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: ${id}`,
    'MIME-Version: 1.0',
    'Auto-Submitted: auto-generated',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(text)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(html)),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/** Line reader over a ReadableStream of bytes; reply() returns { code, text } for single- and multi-line SMTP replies. */
function replyReader(readable) {
  const reader = readable.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const line = async () => {
    for (;;) {
      const i = buf.indexOf('\r\n');
      if (i >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); return l; }
      const { value, done } = await reader.read();
      if (done) throw new MailError('closed');
      buf += dec.decode(value, { stream: true });
    }
  };
  return {
    async reply() {
      const lines = [];
      for (;;) {
        const l = await line();
        lines.push(l);
        if (!/^\d{3}-/.test(l)) return { code: Number(l.slice(0, 3)) || 0, text: lines.join('\n') };
      }
    },
    release() { try { reader.releaseLock(); } catch { /* ignore */ } },
  };
}

async function defaultConnect(address, options) {
  let connect;
  try { ({ connect } = await import('cloudflare:sockets')); } catch { throw new MailError('no_sockets'); }
  return connect(address, options);
}

/**
 * Send one e-mail through Gmail SMTP. Resolves when Gmail accepted it (250 after DATA); throws MailError otherwise.
 * `connect` defaults to cloudflare:sockets; tests pass a stand-in.
 */
export async function sendGmail(env, { to, subject, text, html }, { connect = defaultConnect, timeoutMs = TIMEOUT_MS } = {}) {
  if (!mailConfigured(env)) throw new MailError('not_configured');
  const user = String(env.GMAIL_USER).trim();
  const pass = String(env.GMAIL_APP_PASSWORD).replace(/\s+/g, ''); // Google shows it in 4 groups of 4 letters
  const fromName = env.MAIL_FROM_NAME || 'NurseHub Egypt';
  if (!/^[^@\s<>]+@[^@\s<>]+$/.test(to)) throw new MailError('bad_recipient');

  let socket;
  try {
    socket = await connect({ hostname: HOST, port: PORT }, { secureTransport: 'on', allowHalfOpen: false });
    await socket.opened; // TLS connection to Gmail is up (cloudflare:sockets resolves this after the handshake)
  } catch (e) {
    try { await socket?.close(); } catch { /* ignore */ }
    throw e instanceof MailError ? e : new MailError('connect');
  }
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new MailError('timeout')), timeoutMs); });
  const writer = socket.writable.getWriter();
  const rd = replyReader(socket.readable);
  const send = (s) => writer.write(enc.encode(s));
  const expect = async (stage, ok) => {
    const r = await rd.reply();
    if (!ok.includes(r.code)) throw new MailError(stage, r.code);
    return r;
  };
  const dialog = (async () => {
    await expect('greeting', [220]);
    await send('EHLO nursehubegypt.com\r\n');
    await expect('ehlo', [250]);
    await send(`AUTH PLAIN ${b64(`\0${user}\0${pass}`)}\r\n`);
    await expect('auth', [235]);
    await send(`MAIL FROM:<${user}>\r\n`);
    await expect('mail_from', [250]);
    await send(`RCPT TO:<${to}>\r\n`);
    await expect('rcpt_to', [250, 251]);
    await send('DATA\r\n');
    await expect('data', [354]);
    // base64 bodies never start a line with "."; header lines are escaped anyway (dot-stuffing)
    const msg = buildMessage({ from: user, fromName, to, subject, text, html }).replace(/\r\n\./g, '\r\n..');
    await send(`${msg}\r\n.\r\n`);
    await expect('send', [250]);
    try { await send('QUIT\r\n'); await rd.reply(); } catch { /* the message is already accepted */ }
  })();
  dialog.catch(() => {}); // when the timeout wins, the dialog's own later failure is not an unhandled rejection
  try {
    await Promise.race([dialog, timeout]);
  } catch (e) {
    throw e instanceof MailError ? e : new MailError('io');
  } finally {
    clearTimeout(timer);
    rd.release();
    try { writer.releaseLock(); } catch { /* ignore */ }
    try { await socket.close(); } catch { /* ignore */ }
  }
}
