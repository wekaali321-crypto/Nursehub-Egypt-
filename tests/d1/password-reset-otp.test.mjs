// E-mail OTP password reset (functions/_lib/sbauth.js otp/*), the Gmail SMTP client (functions/_lib/mailer.js) and the e-mail.
import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { Duplex } from 'node:stream';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1, sqlFile } from './helpers.mjs';

const imp = (f) => import(pathToFileURL(join(ROOT, f)).href);
const { handleAuth, newOtp } = await imp('functions/_lib/sbauth.js');
const { sendGmail, buildMessage } = await imp('functions/_lib/mailer.js');
const { resetEmail } = await imp('functions/_lib/resetEmail.js');

let clock = 0; const realNow = Date.now; Date.now = () => realNow() + clock;
let ipN = 0;
function setup({ mail = true } = {}) {
  clock = 0;
  const { db } = newDb();
  db.exec(sqlFile('0003_password_resets.sql'));
  db.exec(sqlFile('0003_password_resets.sql')); // idempotent
  const env = { DB: mockD1(db), JWT_SECRET: 'test-secret', ADMIN_EMAIL: 'owner@test.local', ADMIN_PASSWORD: 'right-pass-1', PBKDF2_ITER: '1000' };
  if (mail) Object.assign(env, { GMAIL_USER: 'sender@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' });
  const sent = [];
  const ctx = { mailer: async (_env, m) => { sent.push(m); } };
  const ip = `10.0.0.${++ipN}`;
  const call = async (path, body, from = ip) => {
    const r = await handleAuth(new Request(`https://x.test/auth/v1/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': from }, body: JSON.stringify(body) }), env, path.split('?')[0].split('/'), ctx);
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const codeOf = (m) => /رمز التحقق الخاص بك: (\d{6})/.exec(m.text)[1];
  const signup = (email, password = 'oldpass1') => call('signup', { email, password }, `20.0.${ipN}.1`);
  const login = (email, password) => call('token?grant_type=password', { email, password }, `30.0.${ipN}.${Math.floor(Math.random() * 250)}`);
  return { db, env, sent, call, codeOf, signup, login };
}
async function verified(t, email) {
  const r = await t.call('otp/request', { email });
  const v = await t.call('otp/verify', { email, request_id: r.body.request_id, code: t.codeOf(t.sent.at(-1)) });
  return { id: r.body.request_id, token: v.body.reset_token };
}

test('1. unknown e-mail: same answer as a real one, no e-mail sent', async () => {
  const t = setup(); await t.signup('real@test.local');
  const a = await t.call('otp/request', { email: 'real@test.local' });
  const b = await t.call('otp/request', { email: 'nobody@test.local' });
  assert.equal(a.status, 200); assert.equal(b.status, 200);
  assert.deepEqual(Object.keys(a.body).sort(), Object.keys(b.body).sort());
  assert.equal(a.body.expires_in, b.body.expires_in);
  assert.equal(t.sent.length, 1, 'only the real account gets an e-mail');
  assert.equal(t.sent[0].to, 'real@test.local');
  const w = await t.call('otp/verify', { email: 'nobody@test.local', request_id: b.body.request_id, code: '123456' });
  assert.equal(w.body.error_code, 'otp_invalid', 'a fake request answers like a real wrong code');
});

test('2. the code is 6 digits, sent in the e-mail, stored only as a hash', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'M@Test.local ' });
  const code = t.codeOf(t.sent[0]);
  assert.match(code, /^\d{6}$/);
  const row = t.db.prepare('SELECT * FROM password_resets WHERE id = ?').get(r.body.request_id);
  assert.equal(row.email, 'm@test.local');
  assert.ok(!JSON.stringify(row).includes(code), 'plain code not in the database');
  assert.match(row.otp_hash, /^[0-9a-f]{64}$/);
  assert.equal(row.expires_at - row.created_at, 10 * 60e3);
  const codes = new Set(Array.from({ length: 2000 }, newOtp));
  assert.ok(codes.size > 1900 && [...codes].every((c) => /^\d{6}$/.test(c)), 'random 6-digit codes');
});

test('3. right code → new password works, old one does not, all sessions signed out', async () => {
  const t = setup(); await t.signup('m@test.local');
  const s = await t.login('m@test.local', 'oldpass1');
  assert.equal(s.status, 200);
  const { id, token } = await verified(t, 'm@test.local');
  assert.ok(token);
  const ok = await t.call('otp/reset', { request_id: id, reset_token: token, password: 'newpass99' });
  assert.equal(ok.status, 200);
  assert.equal((await t.login('m@test.local', 'oldpass1')).status, 400);
  assert.equal((await t.login('m@test.local', 'newpass99')).status, 200);
  const refresh = await t.call('token?grant_type=refresh_token', { refresh_token: s.body.refresh_token });
  assert.equal(refresh.status, 400, 'old refresh token no longer works');
  const pw = t.db.prepare("SELECT password_hash FROM auth_users WHERE email='m@test.local'").get().password_hash;
  assert.match(pw, /^pbkdf2\$1000\$/, 'hashed with the existing PBKDF2 scheme');
});

test('4. wrong code: attempts counted; after 5 the request is locked even for the right code', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'm@test.local' });
  const code = t.codeOf(t.sent[0]);
  const wrong = code === '000000' ? '111111' : '000000';
  const left = [];
  for (let i = 0; i < 4; i++) left.push((await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code: wrong })).body.attempts_left);
  assert.deepEqual(left, [4, 3, 2, 1]);
  assert.equal((await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code: wrong })).body.error_code, 'otp_locked');
  assert.equal((await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code })).body.error_code, 'otp_locked');
  assert.equal((await t.call('otp/resend', { email: 'm@test.local', request_id: r.body.request_id })).body.error_code, 'otp_request_invalid', 'locked: start again');
});

test('5. expired code (after 10 minutes) is refused', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'm@test.local' });
  clock += 10 * 60e3 + 1000;
  const v = await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code: t.codeOf(t.sent[0]) });
  assert.equal(v.body.error_code, 'otp_expired');
});

test('6. a used code / reset token cannot be used again', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'm@test.local' });
  const code = t.codeOf(t.sent[0]);
  const v = await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code });
  assert.equal(v.status, 200);
  assert.equal((await t.call('otp/verify', { email: 'm@test.local', request_id: r.body.request_id, code })).body.error_code, 'otp_request_invalid');
  assert.equal((await t.call('otp/reset', { request_id: r.body.request_id, reset_token: v.body.reset_token, password: 'newpass99' })).status, 200);
  const again = await t.call('otp/reset', { request_id: r.body.request_id, reset_token: v.body.reset_token, password: 'other-pass-1' });
  assert.equal(again.body.error_code, 'reset_invalid');
  assert.equal((await t.login('m@test.local', 'newpass99')).status, 200);
});

test('7. resend: not before 60 s; new code replaces the old; at most 3 e-mails per request', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'm@test.local' });
  const id = r.body.request_id;
  const early = await t.call('otp/resend', { email: 'm@test.local', request_id: id });
  assert.equal(early.status, 429); assert.equal(early.body.error_code, 'otp_resend_wait'); assert.ok(early.body.retry_after > 50);
  clock += 61e3;
  assert.equal((await t.call('otp/resend', { email: 'm@test.local', request_id: id })).status, 200);
  assert.equal(t.sent.length, 2);
  const [old, cur] = [t.codeOf(t.sent[0]), t.codeOf(t.sent[1])];
  if (old !== cur) assert.equal((await t.call('otp/verify', { email: 'm@test.local', request_id: id, code: old })).body.error_code, 'otp_invalid', 'old code refused');
  clock += 61e3;
  assert.equal((await t.call('otp/resend', { email: 'm@test.local', request_id: id })).status, 200);
  clock += 61e3;
  const over = await t.call('otp/resend', { email: 'm@test.local', request_id: id });
  assert.equal(over.body.error_code, 'otp_resend_limit');
  assert.equal(t.sent.length, 3);
  assert.equal((await t.call('otp/verify', { email: 'm@test.local', request_id: id, code: t.codeOf(t.sent[2]) })).status, 200, 'latest code works');
});

test('8. a code from another request (or another e-mail) is refused; a new request cancels the old one', async () => {
  const t = setup(); await t.signup('a@test.local'); await t.signup('b@test.local');
  const ra = await t.call('otp/request', { email: 'a@test.local' }); const codeA = t.codeOf(t.sent[0]);
  const rb = await t.call('otp/request', { email: 'b@test.local' });
  assert.equal((await t.call('otp/verify', { email: 'b@test.local', request_id: rb.body.request_id, code: codeA })).body.error_code, 'otp_invalid');
  assert.equal((await t.call('otp/verify', { email: 'b@test.local', request_id: ra.body.request_id, code: codeA })).body.error_code, 'otp_request_invalid', 'request bound to its e-mail');
  const ra2 = await t.call('otp/request', { email: 'a@test.local' });
  assert.equal((await t.call('otp/verify', { email: 'a@test.local', request_id: ra.body.request_id, code: codeA })).body.error_code, 'otp_request_invalid', 'old request cancelled');
  assert.equal((await t.call('otp/verify', { email: 'a@test.local', request_id: ra2.body.request_id, code: t.codeOf(t.sent.at(-1)) })).status, 200);
});

test('9. owner (ADMIN_EMAIL), admin and superadmin: same answer, no e-mail, password unchanged', async () => {
  const t = setup();
  await t.signup('adm@test.local'); await t.signup('sup@test.local');
  t.db.exec("UPDATE profiles SET role='admin' WHERE email='adm@test.local'; UPDATE profiles SET role='superadmin' WHERE email='sup@test.local';");
  await t.login('owner@test.local', 'right-pass-1'); // creates the owner row
  for (const email of ['owner@test.local', 'adm@test.local', 'sup@test.local']) {
    const r = await t.call('otp/request', { email });
    assert.equal(r.status, 200, email);
    assert.ok(r.body.request_id);
  }
  assert.equal(t.sent.length, 0, 'no code ever sent to a staff account');
  assert.equal((await t.login('adm@test.local', 'oldpass1')).status, 200);
});

test('10. no password change without a verified code; wrong reset token refused', async () => {
  const t = setup(); await t.signup('m@test.local');
  const r = await t.call('otp/request', { email: 'm@test.local' });
  assert.equal((await t.call('otp/reset', { request_id: r.body.request_id, reset_token: 'x'.repeat(64), password: 'newpass99' })).body.error_code, 'reset_invalid');
  const { id } = await verified(t, 'm@test.local');
  assert.equal((await t.call('otp/reset', { request_id: id, reset_token: 'f'.repeat(64), password: 'newpass99' })).body.error_code, 'reset_invalid');
  assert.equal((await t.login('m@test.local', 'oldpass1')).status, 200, 'password unchanged');
});

test('11. new password: at least 8 characters; reset token expires after 15 minutes', async () => {
  const t = setup(); await t.signup('m@test.local');
  const { id, token } = await verified(t, 'm@test.local');
  assert.equal((await t.call('otp/reset', { request_id: id, reset_token: token, password: 'short7c' })).body.error_code, 'weak_password');
  clock += 15 * 60e3 + 1000;
  assert.equal((await t.call('otp/reset', { request_id: id, reset_token: token, password: 'longenough1' })).body.error_code, 'reset_invalid');
});

test('12. rate limits: e-mails per address per hour, requests per IP', async () => {
  const t = setup(); await t.signup('m@test.local');
  const st = [];
  for (let i = 0; i < 7; i++) st.push((await t.call('otp/request', { email: 'm@test.local' }, `40.0.0.${i}`)).status);
  assert.deepEqual(st, [200, 200, 200, 200, 200, 429, 429]);
  assert.equal(t.sent.length, 5);
  const ip = [];
  for (let i = 0; i < 8; i++) ip.push((await t.call('otp/request', { email: `x${i}@test.local` }, '50.0.0.1')).status);
  assert.deepEqual(ip, [200, 200, 200, 200, 200, 200, 429, 429]);
});

test('13. no e-mail credentials configured → clear 503 for everyone (nothing pretends to be sent)', async () => {
  const t = setup({ mail: false });
  const { handleAuth: h } = await imp('functions/_lib/sbauth.js');
  const r = await h(new Request('https://x.test/auth/v1/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@test.local' }) }), t.env, ['otp', 'request'], {});
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error_code, 'email_not_configured');
});

test('14. codes, tokens and passwords never reach the logs; login / signup / old recover route unchanged', async () => {
  const t = setup(); await t.signup('m@test.local');
  const logs = []; const keep = { ...console };
  for (const k of ['log', 'info', 'warn', 'error', 'debug']) console[k] = (...a) => logs.push(a.map(String).join(' '));
  try {
    const failing = { mailer: async () => { const { MailError } = await imp('functions/_lib/mailer.js'); throw new MailError('auth', 535); } };
    await handleAuth(new Request('https://x.test/auth/v1/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'm@test.local' }) }), t.env, ['otp', 'request'], failing);
    const { id, token } = await verified(t, 'm@test.local');
    await t.call('otp/reset', { request_id: id, reset_token: token, password: 'newpass99' });
    const all = logs.join('\n');
    assert.ok(logs.some((l) => l.includes('smtp_auth_535')), 'a failed send is logged by category');
    for (const secret of [t.codeOf(t.sent[0]), token, 'newpass99', 'abcd efgh ijkl mnop', 'abcdefghijklmnop']) assert.ok(!all.includes(secret), 'secret not logged');
  } finally { Object.assign(console, keep); }
  assert.equal((await t.call('recover', { email: 'm@test.local' })).status, 200, 'old GoTrue recover route still answers');
  assert.equal((await t.login('m@test.local', 'newpass99')).status, 200);
});

test('e-mail: Arabic text, brand colours, code shown, plain-text part, mobile-friendly', () => {
  const m = resetEmail('482913');
  assert.equal(m.subject, 'NurseHub Egypt — Password Reset');
  for (const s of ['مرحبًا بك في NurseHub Egypt.', 'تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.', 'رمز التحقق الخاص بك:', 'ويستخدم مرة واحدة فقط.', 'إذا لم تطلب إعادة تعيين كلمة المرور، فتجاهل هذه الرسالة ولا تشارك الرمز مع أي شخص.', 'كل ما يحتاجه الممرض في مكان واحد.', '482913', '#153448', '#168C91', '#FFFFFF', '#F1F4F6', 'dir="rtl"', 'name="viewport"', 'max-width:560px']) assert.ok(m.html.includes(s), s);
  assert.ok(m.text.includes('رمز التحقق الخاص بك: 482913'));
  assert.ok(!/<style|<script|class=/.test(m.html), 'inline styles only (Gmail strips <style> in some clients)');
  const msg = buildMessage({ from: 's@gmail.com', fromName: 'NurseHub Egypt', to: 'a@b.c', ...m });
  assert.match(msg, /^Subject: NurseHub Egypt — Password Reset|^Subject: =\?UTF-8\?B\?/m);
  assert.match(msg, /Content-Type: multipart\/alternative/);
  assert.ok(msg.split('\r\n').every((l) => l.length <= 998), 'SMTP line length');
});

// --- SMTP client against a local stand-in server (the same dialog Gmail uses on port 465 after TLS) ---
function fakeSmtp({ authOk = true } = {}) {
  const got = { lines: [], data: '' };
  const server = net.createServer((sock) => {
    let buf = ''; let inData = false;
    sock.write('220 smtp.test ESMTP ready\r\n');
    sock.on('data', (d) => {
      buf += d.toString('utf8');
      for (;;) {
        if (inData) {
          const end = buf.indexOf('\r\n.\r\n'); if (end < 0) return;
          got.data = buf.slice(0, end); buf = buf.slice(end + 5); inData = false; sock.write('250 2.0.0 OK queued\r\n'); continue;
        }
        const i = buf.indexOf('\r\n'); if (i < 0) return;
        const l = buf.slice(0, i); buf = buf.slice(i + 2); got.lines.push(l);
        if (/^EHLO/.test(l)) sock.write('250-smtp.test\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n');
        else if (/^AUTH PLAIN/.test(l)) sock.write(authOk ? '235 2.7.0 Accepted\r\n' : '535-5.7.8 Username and Password not accepted.\r\n535 5.7.8 https://support.google.com/mail/?p=BadCredentials\r\n');
        else if (/^MAIL FROM/.test(l) || /^RCPT TO/.test(l)) sock.write('250 OK\r\n');
        else if (l === 'DATA') { inData = true; sock.write('354 Go ahead\r\n'); }
        else if (l === 'QUIT') { sock.write('221 bye\r\n'); sock.end(); }
      }
    });
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res({ server, got, port: server.address().port })));
}
const nodeConnect = (port, seen) => async (address, options) => {
  seen.push({ address, options });
  const s = net.connect(port, '127.0.0.1');
  await new Promise((r) => s.once('connect', r));
  const { readable, writable } = Duplex.toWeb(s);
  return { readable, writable, opened: Promise.resolve(), close: async () => s.destroy() };
};

test('SMTP: Gmail host/port with TLS, AUTH PLAIN with the App Password (spaces removed), message accepted', async () => {
  const { server, got, port } = await fakeSmtp();
  const seen = [];
  try {
    const env = { GMAIL_USER: 'sender@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' };
    await sendGmail(env, { to: 'member@test.local', ...resetEmail('135790') }, { connect: nodeConnect(port, seen) });
    assert.deepEqual(seen[0].address, { hostname: 'smtp.gmail.com', port: 465 });
    assert.equal(seen[0].options.secureTransport, 'on');
    const auth = got.lines.find((l) => l.startsWith('AUTH PLAIN ')).slice(11);
    assert.equal(Buffer.from(auth, 'base64').toString(), '\0sender@gmail.com\0abcdefghijklmnop');
    assert.ok(got.lines.includes('MAIL FROM:<sender@gmail.com>') && got.lines.includes('RCPT TO:<member@test.local>'));
    const html = Buffer.from(/text\/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n([\s\S]+?)\r\n--/.exec(got.data)[1].replace(/\r\n/g, ''), 'base64').toString();
    assert.ok(html.includes('135790') && html.includes('مرحبًا بك في NurseHub Egypt.'));
  } finally { server.close(); }
});

test('SMTP: wrong App Password → MailError smtp_auth_535 (no secret in the message); not configured → refused', async () => {
  const { server, port } = await fakeSmtp({ authOk: false });
  try {
    await assert.rejects(sendGmail({ GMAIL_USER: 's@gmail.com', GMAIL_APP_PASSWORD: 'wrongwrongwrongw' }, { to: 'a@test.local', ...resetEmail('111111') }, { connect: nodeConnect(port, []) }),
      (e) => e.message === 'smtp_auth_535' && !e.message.includes('wrong'));
  } finally { server.close(); }
  await assert.rejects(sendGmail({}, { to: 'a@test.local', ...resetEmail('111111') }), (e) => e.message === 'smtp_not_configured');
});

test('table not created yet (migration not applied) → 503 email_not_configured, not a crash', async () => {
  const { db } = newDb();
  const env = { DB: mockD1(db), JWT_SECRET: 's', GMAIL_USER: 'a@gmail.com', GMAIL_APP_PASSWORD: 'x' };
  const r = await handleAuth(new Request('https://x.test/auth/v1/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@test.local' }) }), env, ['otp', 'request'], { mailer: async () => {} });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error_code, 'email_not_configured');
});

test('mail status row: "sent" or the error category only (no address, code or password)', async () => {
  const t = setup(); await t.signup('m@test.local');
  await t.call('otp/request', { email: 'm@test.local' });
  let row = t.db.prepare("SELECT * FROM password_resets WHERE id = 'mail_status'").get();
  assert.equal(row.otp_hash, 'sent'); assert.equal(row.email, '-'); assert.equal(row.user_id, null);
  const { MailError } = await imp('functions/_lib/mailer.js');
  const keep = console.error; console.error = () => {};
  try {
    await handleAuth(new Request('https://x.test/auth/v1/otp/request', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '77.0.0.1' }, body: JSON.stringify({ email: 'm@test.local' }) }), t.env, ['otp', 'request'], { mailer: async () => { throw new MailError('auth', 535); } });
  } finally { console.error = keep; }
  row = t.db.prepare("SELECT * FROM password_resets WHERE id = 'mail_status'").get();
  assert.equal(row.otp_hash, 'smtp_auth_535');
  assert.equal(t.db.prepare("SELECT COUNT(*) n FROM password_resets WHERE email = 'm@test.local' AND status = 'pending'").get().n, 1, 'the diag row never mixes with requests');
});
