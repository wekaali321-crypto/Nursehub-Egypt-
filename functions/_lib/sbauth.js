// GoTrue-compatible auth subset on D1 (email/password, Google OAuth, PKCE, refresh tokens).
import { respond, perr, CORS, signJwt, verifyJwt, identify } from './sb.js';
import { lockedFor, hit, reset, ipOf, LIMITS as RL } from './ratelimit.js';
import { sendGmail, mailConfigured } from './mailer.js';
import { resetEmail } from './resetEmail.js';

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rid = () => hex(crypto.getRandomValues(new Uint8Array(16)));
const TTL = 3600;

async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256));
}
async function hashPassword(env, password) {
  const iter = Number(env.PBKDF2_ITER || 15000);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${hex(salt)}$${await pbkdf2(password, salt, iter)}`;
}
async function checkPassword(stored, password) {
  const [kind, iter, saltHex, h] = String(stored || '').split('$');
  if (kind !== 'pbkdf2') return false;
  const salt = Uint8Array.from(saltHex.match(/../g).map((x) => parseInt(x, 16)));
  const got = await pbkdf2(password, salt, Number(iter));
  let d = got.length ^ h.length;
  for (let i = 0; i < got.length; i++) d |= got.charCodeAt(i) ^ (h.charCodeAt(i) || 0);
  return d === 0;
}
const userJson = (u) => ({
  id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at,
  app_metadata: { provider: u.provider || 'email', providers: [u.provider || 'email'] },
  user_metadata: { ...(u.meta ? JSON.parse(u.meta) : {}), name: u.name || undefined, email: u.email },
  created_at: u.created_at, updated_at: u.created_at,
});
async function session(env, u) {
  const access = await signJwt(env, { sub: u.id, role: 'authenticated', email: u.email, user_metadata: { name: u.name } }, TTL);
  const refresh = rid() + rid();
  await env.DB.prepare('INSERT INTO auth_refresh (token,user_id,expires_at) VALUES (?,?,?)').bind(refresh, u.id, Date.now() + 60 * 86400e3).run();
  return { access_token: access, token_type: 'bearer', expires_in: TTL, expires_at: Math.floor(Date.now() / 1000) + TTL, refresh_token: refresh, user: userJson(u) };
}
async function ensureProfile(env, u, role = null) {
  await env.DB.prepare('INSERT INTO profiles (id,name,email,role) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(u.id, u.name || null, u.email, role).run();
}
const getUserByEmail = (env, email) => env.DB.prepare('SELECT * FROM auth_users WHERE email = ?').bind(email.toLowerCase()).first();

async function passwordLogin(env, email, password) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) return null;
  // The site owner signs in with the existing ADMIN_PASSWORD secret (no hash to migrate, no CPU-heavy hashing).
  const adminEmails = String(env.ADMIN_EMAIL || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (env.ADMIN_PASSWORD && adminEmails.includes(email)) {
    const a = enc.encode(password), b = enc.encode(env.ADMIN_PASSWORD);
    let d = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
    if (d !== 0) return null;
    let u = await getUserByEmail(env, email);
    if (!u) {
      await env.DB.prepare('INSERT INTO auth_users (email,name,provider) VALUES (?,?,?)').bind(email, 'Admin', 'email').run();
      u = await getUserByEmail(env, email);
    }
    await ensureProfile(env, u, 'superadmin');
    await env.DB.prepare("UPDATE profiles SET role='superadmin' WHERE id=? AND (role IS NULL OR role NOT IN ('admin','superadmin'))").bind(u.id).run();
    return u;
  }
  const u = await getUserByEmail(env, email);
  if (!u || !(await checkPassword(u.password_hash, password))) return null;
  return u;
}

/** Admin-only (checked by the caller): give a member a new temporary password and sign them out everywhere.
 *  Staff accounts (admin / superadmin) are refused: the owner signs in with ADMIN_PASSWORD, not a stored hash. */
export async function adminSetPassword(env, emailIn) {
  const email = String(emailIn || '').trim().toLowerCase();
  const u = email ? await getUserByEmail(env, email) : null;
  if (!u) return { ok: false, error: 'not_found' };
  const p = await env.DB.prepare('SELECT role FROM profiles WHERE id = ?').bind(u.id).first();
  if (p && ['admin', 'superadmin'].includes(p.role)) return { ok: false, error: 'staff_account' };
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const temp = [...crypto.getRandomValues(new Uint8Array(10))].map((b) => abc[b % abc.length]).join('');
  await env.DB.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').bind(await hashPassword(env, temp), u.id).run();
  await env.DB.prepare('DELETE FROM auth_refresh WHERE user_id = ?').bind(u.id).run();
  return { ok: true, email, temp_password: temp };
}

/* ---------- e-mail OTP password reset ---------- */
const OTP = { ttlMs: 10 * 60e3, resendMs: 60e3, maxAttempts: 5, maxSends: 3, lifeMs: 30 * 60e3, resetTtlMs: 15 * 60e3, minPassword: 8 };
const sha256Hex = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function otpHash(env, id, code) {
  const k = await crypto.subtle.importKey('raw', enc.encode(`password-reset-otp:${env.JWT_SECRET}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(`${id}:${code}`)));
}
const sameText = (a, b) => {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
};
/** 6 digits, uniform (rejection sampling over crypto.getRandomValues). */
export function newOtp() {
  const buf = new Uint32Array(1);
  const lim = 2 ** 32 - (2 ** 32 % 1e6);
  for (;;) { crypto.getRandomValues(buf); if (buf[0] < lim) return String(buf[0] % 1e6).padStart(6, '0'); }
}
const adminEmailList = (env) => String(env.ADMIN_EMAIL || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
/** Owner / admin / superadmin accounts never change their password through the e-mail flow. */
async function isStaff(env, u) {
  if (adminEmailList(env).includes(String(u.email).toLowerCase())) return true;
  const p = await env.DB.prepare('SELECT role FROM profiles WHERE id = ?').bind(u.id).first();
  return !!p && ['admin', 'superadmin'].includes(p.role);
}
/** Send the code; in the background when the platform allows it (same answer time whether or not an e-mail goes out). */
/** Result of the latest send, for the owner's "mail status" check (GitHub workflow). Only a short category and a time:
 *  never the address, the code or a password. Kept in the private password_resets table (row id 'mail_status'). */
async function noteMail(env, result) {
  const now = Date.now();
  try {
    await env.DB.prepare(`INSERT INTO password_resets (id,email,otp_hash,status,attempts,sends,created_at,expires_at,last_sent_at) VALUES ('mail_status','-',?, 'diag',0,1,?,?,?)
      ON CONFLICT(id) DO UPDATE SET otp_hash = excluded.otp_hash, created_at = excluded.created_at, last_sent_at = excluded.last_sent_at, sends = sends + 1`)
      .bind(String(result).slice(0, 60), now, now, now).run();
  } catch { /* diagnostics only */ }
}
function deliverOtp(env, ctx, email, code) {
  const mail = resetEmail(code, { siteUrl: env.SITE_URL || 'https://nursehubegypt.com' });
  const job = (async () => {
    await noteMail(env, 'sending');
    try {
      await (ctx.mailer || sendGmail)(env, { to: email, ...mail });
      await noteMail(env, 'sent');
    } catch (e) {
      const why = String(e?.message || 'error').slice(0, 60);
      console.error('password reset e-mail not sent:', why); // never the code / password
      await noteMail(env, why);
    }
  })();
  if (ctx.waitUntil) ctx.waitUntil(job); else return job;
}

async function handleOtp(route, env, body, ip, ctx, { bad, tooMany }) {
  const now = Date.now();
  const T = 'password_resets';
  const fail = (code, msg, status = 400, extra = {}) => respond({ code: status, error_code: code, msg, ...extra }, status);
  const email = String(body.email || '').trim().toLowerCase();
  const id = String(body.request_id || '');
  const row = async () => (/^[0-9a-f]{32}$/.test(id) ? env.DB.prepare(`SELECT * FROM ${T} WHERE id = ?`).bind(id).first() : null);

  if (route === 'otp/request') {
    if (!mailConfigured(env) && !ctx.mailer) return fail('email_not_configured', 'Password reset by e-mail is not available yet', 503);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return bad('validation_failed', 'Invalid email', 422);
    const wait = Math.max(await lockedFor(env, `otpr:${ip}`, RL.otpRequestIp), await lockedFor(env, `otps:${email}`, RL.otpSendEmail));
    if (wait) return tooMany(wait);
    if (await lockedFor(env, 'otp:daily', RL.otpDaily)) return fail('email_daily_limit', 'Daily e-mail limit reached', 503);
    await hit(env, `otpr:${ip}`, RL.otpRequestIp);
    await hit(env, `otps:${email}`, RL.otpSendEmail);
    // a new request replaces every older one for this address (their codes / reset tokens stop working)
    await env.DB.prepare(`UPDATE ${T} SET status = 'cancelled', reset_hash = NULL WHERE email = ? AND status IN ('pending','verified')`).bind(email).run();
    if (Math.random() < 0.05) await env.DB.prepare(`DELETE FROM ${T} WHERE created_at < ? AND id != 'mail_status'`).bind(now - 7 * 86400e3).run();
    const u = await getUserByEmail(env, email);
    const eligible = !!u && !(await isStaff(env, u));
    const rqId = rid();
    const code = newOtp();
    // no eligible account: the same row and answer, but the stored hash is of a code nobody ever receives
    await env.DB.prepare(`INSERT INTO ${T} (id,email,user_id,otp_hash,status,attempts,sends,created_at,expires_at,last_sent_at) VALUES (?,?,?,?, 'pending',0,1,?,?,?)`)
      .bind(rqId, email, eligible ? u.id : null, await otpHash(env, rqId, eligible ? code : newOtp() + rid()), now, now + OTP.ttlMs, now).run();
    if (eligible) { await hit(env, 'otp:daily', RL.otpDaily); await deliverOtp(env, ctx, email, code); }
    return respond({ ok: true, request_id: rqId, expires_in: OTP.ttlMs / 1000, resend_after: OTP.resendMs / 1000 });
  }

  if (route === 'otp/resend') {
    const r = await row();
    if (!r || r.email !== email || r.status !== 'pending') return fail('otp_request_invalid', 'Start again');
    if (now - r.created_at > OTP.lifeMs) {
      await env.DB.prepare(`UPDATE ${T} SET status = 'cancelled' WHERE id = ?`).bind(r.id).run();
      return fail('otp_request_expired', 'Start again');
    }
    const gap = r.last_sent_at + OTP.resendMs - now;
    if (gap > 0) return respond({ code: 429, error_code: 'otp_resend_wait', msg: 'Wait before asking again', retry_after: Math.ceil(gap / 1000) }, 429, { 'retry-after': String(Math.ceil(gap / 1000)) });
    if (r.sends >= OTP.maxSends) return fail('otp_resend_limit', 'Start again', 429);
    const wait = await lockedFor(env, `otps:${email}`, RL.otpSendEmail);
    if (wait) return tooMany(wait);
    if (r.user_id && await lockedFor(env, 'otp:daily', RL.otpDaily)) return fail('email_daily_limit', 'Daily e-mail limit reached', 503);
    await hit(env, `otps:${email}`, RL.otpSendEmail);
    const code = newOtp();
    // the previous code stops working; attempts are NOT reset (5 in total per request)
    const up = await env.DB.prepare(`UPDATE ${T} SET otp_hash = ?, expires_at = ?, last_sent_at = ?, sends = sends + 1 WHERE id = ? AND status = 'pending' AND last_sent_at = ?`)
      .bind(await otpHash(env, r.id, r.user_id ? code : newOtp() + rid()), now + OTP.ttlMs, now, r.id, r.last_sent_at).run();
    if (!up.meta?.changes) return fail('otp_resend_wait', 'Wait before asking again', 429);
    if (r.user_id) { await hit(env, 'otp:daily', RL.otpDaily); await deliverOtp(env, ctx, email, code); }
    return respond({ ok: true, expires_in: OTP.ttlMs / 1000, resend_after: OTP.resendMs / 1000, resends_left: OTP.maxSends - r.sends - 1 });
  }

  if (route === 'otp/verify') {
    const vWait = await lockedFor(env, `otpv:${ip}`, RL.otpVerifyIp);
    if (vWait) return tooMany(vWait);
    const code = String(body.code || '').trim();
    if (!/^\d{6}$/.test(code)) return bad('validation_failed', 'The code is 6 digits', 422);
    const r = await row();
    if (!r || r.email !== email) { await hit(env, `otpv:${ip}`, RL.otpVerifyIp); return fail('otp_request_invalid', 'Start again'); }
    if (r.status === 'locked') return fail('otp_locked', 'Too many wrong codes. Start again');
    if (r.status !== 'pending') return fail('otp_request_invalid', 'Start again');
    if (now > r.expires_at) return fail('otp_expired', 'The code has expired');
    // count the attempt first (atomic), so parallel guesses cannot go past the limit
    const inc = await env.DB.prepare(`UPDATE ${T} SET attempts = attempts + 1 WHERE id = ? AND status = 'pending' AND attempts < ?`).bind(r.id, OTP.maxAttempts).run();
    if (!inc.meta?.changes) {
      await env.DB.prepare(`UPDATE ${T} SET status = 'locked' WHERE id = ? AND status = 'pending'`).bind(r.id).run();
      return fail('otp_locked', 'Too many wrong codes. Start again');
    }
    const fresh = await env.DB.prepare(`SELECT otp_hash, attempts FROM ${T} WHERE id = ?`).bind(r.id).first();
    const given = await otpHash(env, r.id, code);
    const ok = sameText(given, fresh.otp_hash) && !!r.user_id;
    if (!ok) {
      await hit(env, `otpv:${ip}`, RL.otpVerifyIp);
      const left = OTP.maxAttempts - fresh.attempts;
      if (left <= 0) {
        await env.DB.prepare(`UPDATE ${T} SET status = 'locked' WHERE id = ? AND status = 'pending'`).bind(r.id).run();
        return fail('otp_locked', 'Too many wrong codes. Start again');
      }
      return fail('otp_invalid', 'Wrong code', 400, { attempts_left: left });
    }
    const token = rid() + rid();
    const v = await env.DB.prepare(`UPDATE ${T} SET status = 'verified', otp_hash = '', verified_at = ?, reset_hash = ?, reset_expires_at = ? WHERE id = ? AND status = 'pending'`)
      .bind(now, await sha256Hex(token), now + OTP.resetTtlMs, r.id).run();
    if (!v.meta?.changes) return fail('otp_request_invalid', 'Start again');
    return respond({ ok: true, reset_token: token, expires_in: OTP.resetTtlMs / 1000 });
  }

  if (route === 'otp/reset') {
    const vWait = await lockedFor(env, `otpv:${ip}`, RL.otpVerifyIp);
    if (vWait) return tooMany(vWait);
    const password = String(body.password ?? '');
    if (password.length < OTP.minPassword || password.length > 128) return bad('weak_password', `Password must be at least ${OTP.minPassword} characters`, 422);
    const r = await row();
    const valid = r && r.status === 'verified' && r.user_id && r.reset_hash && now <= r.reset_expires_at
      && sameText(await sha256Hex(String(body.reset_token || '')), r.reset_hash);
    if (!valid) { await hit(env, `otpv:${ip}`, RL.otpVerifyIp); return fail('reset_invalid', 'Start again'); }
    const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(r.user_id).first();
    if (!u || String(u.email).toLowerCase() !== r.email || await isStaff(env, u)) return fail('reset_invalid', 'Start again');
    const newHash = await hashPassword(env, password);
    // single use: only the request that flips verified → used may change the password
    const claim = await env.DB.prepare(`UPDATE ${T} SET status = 'used', used_at = ?, reset_hash = NULL WHERE id = ? AND status = 'verified'`).bind(now, r.id).run();
    if (!claim.meta?.changes) return fail('reset_invalid', 'Start again');
    await env.DB.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').bind(newHash, u.id).run();
    await env.DB.prepare('DELETE FROM auth_refresh WHERE user_id = ?').bind(u.id).run(); // signed out on every device
    await env.DB.prepare(`UPDATE ${T} SET status = 'cancelled', reset_hash = NULL WHERE email = ? AND status IN ('pending','verified')`).bind(r.email).run();
    return respond({ ok: true });
  }
  return null;
}

export async function handleAuth(request, env, path, ctx = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (!env.DB || !env.JWT_SECRET) return perr(503, 'unexpected_failure', 'Auth is not configured (DB / JWT_SECRET)');
  const url = new URL(request.url);
  const route = path.join('/');
  const body = ['POST', 'PUT'].includes(request.method) ? await request.json().catch(() => ({})) : {};
  const bad = (code, msg, status = 400) => respond({ code: status, error_code: code, msg }, status);
  const tooMany = (sec) => respond({ code: 429, error_code: 'over_request_rate_limit', msg: `Too many attempts. Try again in ${Math.max(1, Math.ceil(sec / 60))} minute(s).`, retry_after: sec }, 429, { 'retry-after': String(sec) });
  const ip = ipOf(request);

  if (route === 'token') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      // Limits are checked before any hashing: a locked IP/e-mail costs one small read, no CPU-heavy work, no write.
      const kFail = `lf:${ip}:${String(body.email || '').trim().toLowerCase()}`, kIp = `li:${ip}`;
      const wait = Math.max(await lockedFor(env, kFail, RL.loginFail), await lockedFor(env, kIp, RL.loginIp));
      if (wait) return tooMany(wait);
      const u = await passwordLogin(env, body.email, body.password);
      if (!u) {
        const w = Math.max(await hit(env, kFail, RL.loginFail), await hit(env, kIp, RL.loginIp));
        return w ? tooMany(w) : bad('invalid_credentials', 'Invalid login credentials');
      }
      await reset(env, kFail);
      return respond(await session(env, u));
    }
    if (grant === 'refresh_token') {
      const r = await env.DB.prepare('SELECT * FROM auth_refresh WHERE token = ?').bind(body.refresh_token || '').first();
      if (!r || r.expires_at < Date.now()) return bad('refresh_token_not_found', 'Invalid Refresh Token', 400);
      const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(r.user_id).first();
      await env.DB.prepare('DELETE FROM auth_refresh WHERE token = ?').bind(r.token).run();
      return u ? respond(await session(env, u)) : bad('user_not_found', 'User not found');
    }
    if (grant === 'pkce') {
      const c = await env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(body.auth_code || '').first();
      if (!c || c.expires_at < Date.now()) return bad('flow_state_not_found', 'Invalid or expired code');
      const ver = b64u(await crypto.subtle.digest('SHA-256', enc.encode(body.code_verifier || '')));
      if (c.challenge && ver !== c.challenge) return bad('bad_code_verifier', 'Code verifier mismatch');
      await env.DB.prepare('DELETE FROM auth_codes WHERE code = ?').bind(c.code).run();
      const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(c.user_id).first();
      return respond(await session(env, u));
    }
    return bad('unsupported_grant_type', 'Unsupported grant type');
  }

  if (route === 'signup') {
    const sWait = await lockedFor(env, `su:${ip}`, RL.signupIp);
    if (sWait) return tooMany(sWait);
    await hit(env, `su:${ip}`, RL.signupIp);
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || String(body.password || '').length < 6) return bad('validation_failed', 'Invalid email or password (min 6 chars)', 422);
    if (await getUserByEmail(env, email)) return bad('user_already_exists', 'User already registered', 422);
    const name = body.data?.name || body.data?.full_name || null;
    await env.DB.prepare('INSERT INTO auth_users (email,password_hash,name,meta) VALUES (?,?,?,?)').bind(email, await hashPassword(env, body.password), name, JSON.stringify(body.data || {})).run();
    const u = await getUserByEmail(env, email);
    await ensureProfile(env, u, null);
    return respond(await session(env, u));
  }

  if (route === 'user') {
    const who = await identify(request, env);
    if (!who.uid) return bad('bad_jwt', 'invalid JWT', 401);
    const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(who.uid).first();
    if (!u) return bad('user_not_found', 'User not found', 404);
    if (request.method === 'PUT') {
      if (body.password) {
        if (String(body.password).length < 6) return bad('weak_password', 'Password too short', 422);
        await env.DB.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').bind(await hashPassword(env, body.password), u.id).run();
      }
      if (body.data && typeof body.data === 'object') {
        // merge into the existing metadata (like GoTrue): a key set to null is removed; other keys are kept, so saving study
        // progress never erases the name, and vice versa. Capped so one account row cannot grow without limit.
        let old = {};
        try { old = u.meta ? JSON.parse(u.meta) : {}; } catch { old = {}; }
        const merged = { ...old, ...body.data };
        for (const [k, v] of Object.entries(body.data)) if (v === null) delete merged[k];
        const json = JSON.stringify(merged);
        if (json.length > 300_000) return bad('payload_too_large', 'User metadata too large', 413);
        await env.DB.prepare('UPDATE auth_users SET meta = ?, name = COALESCE(?, name) WHERE id = ?').bind(json, body.data.name || null, u.id).run();
      }
      return respond(userJson(await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(u.id).first()));
    }
    return respond(userJson(u));
  }

  if (route === 'logout') {
    const who = await identify(request, env);
    if (who.uid) await env.DB.prepare('DELETE FROM auth_refresh WHERE user_id = ?').bind(who.uid).run();
    return new Response(null, { status: 204, headers: CORS });
  }

  if (route === 'recover') {
    // No outbound e-mail on the free plan (reset is done by the site owner, see cloudflare/README.md). Still limited, so wiring
    // a mailer later can never be used to burn its daily quota.
    const em = String(body.email || '').trim().toLowerCase();
    const rWait = Math.max(await lockedFor(env, `rc:${ip}`, RL.recoverIp), em ? await lockedFor(env, `rce:${em}`, RL.recoverEmail) : 0);
    if (rWait) return tooMany(rWait);
    await hit(env, `rc:${ip}`, RL.recoverIp);
    if (em) await hit(env, `rce:${em}`, RL.recoverEmail);
    return respond({});
  }

  if (route.startsWith('otp/') && request.method === 'POST') {
    try {
      const res = await handleOtp(route, env, body, ip, ctx, { bad, tooMany });
      if (res) return res;
    } catch (e) {
      // table not created yet (migration 0003 not applied): same honest answer as "no mailer configured"
      if (/no such table: password_resets/.test(String(e?.message))) return respond({ code: 503, error_code: 'email_not_configured', msg: 'Password reset by e-mail is not available yet' }, 503);
      throw e;
    }
  }

  if (route === 'settings') return respond({ external: { google: !!env.GOOGLE_CLIENT_ID, email: true }, disable_signup: false, mailer_autoconfirm: true });

  // Google OAuth (authorization-code flow handled here, PKCE hand-off to supabase-js)
  if (route === 'authorize') {
    if (!env.GOOGLE_CLIENT_ID) return bad('provider_disabled', 'Google sign-in is not configured', 400);
    const state = b64u(enc.encode(JSON.stringify({ r: url.searchParams.get('redirect_to') || url.origin, c: url.searchParams.get('code_challenge') || '', n: rid() })));
    const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    g.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/auth/v1/callback`, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString();
    return Response.redirect(g.toString(), 302);
  }
  if (route === 'callback') {
    try {
      const st = JSON.parse(atob(url.searchParams.get('state').replace(/-/g, '+').replace(/_/g, '/')));
      const tr = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/auth/v1/callback`, grant_type: 'authorization_code' }) })).json();
      const info = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { authorization: `Bearer ${tr.access_token}` } })).json();
      const email = String(info.email || '').toLowerCase();
      if (!email) throw new Error('no email');
      let u = await getUserByEmail(env, email);
      if (!u) { await env.DB.prepare('INSERT INTO auth_users (email,name,provider) VALUES (?,?,?)').bind(email, info.name || null, 'google').run(); u = await getUserByEmail(env, email); }
      await ensureProfile(env, u, null);
      const code = rid() + rid();
      await env.DB.prepare('INSERT INTO auth_codes (code,user_id,challenge,expires_at) VALUES (?,?,?,?)').bind(code, u.id, st.c, Date.now() + 5 * 60e3).run();
      const dest = new URL(st.r); dest.searchParams.set('code', code);
      return Response.redirect(dest.toString(), 302);
    } catch (e) {
      return Response.redirect(`${url.origin}/login?error=oauth`, 302);
    }
  }
  return perr(404, 'not_found', `Unknown auth route ${route}`);
}
void verifyJwt;
