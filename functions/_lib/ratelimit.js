// Rate limits for login / signup / password reset / visitor inserts, kept in D1 (table admin_login_attempts, key in `ip`).
// The Cache API turned out not to keep the counters between requests in production, so D1 is the source of truth:
//  - checked BEFORE any password hashing (a locked caller costs one small indexed read, no CPU-heavy work, no write);
//  - one row per counted event only while the caller is not locked, so a flood is capped at `max` writes per window;
//  - rows older than a day are deleted now and then.
const T = 'admin_login_attempts';
const iso = (ms) => new Date(ms).toISOString();

/** Seconds the key is still locked (0 = allowed). `rule` = { max, windowSec }. Fails open if D1 cannot be read. */
export async function lockedFor(env, key, rule) {
  if (!env?.DB) return 0;
  try {
    const now = Date.now();
    const r = await env.DB.prepare(`SELECT COUNT(*) n, MIN(created_at) first FROM ${T} WHERE ip = ? AND success = 0 AND created_at >= ?`)
      .bind(key, iso(now - rule.windowSec * 1000)).first();
    if (!r || r.n < rule.max) return 0;
    return Math.max(1, Math.ceil((Date.parse(r.first) + rule.windowSec * 1000 - now) / 1000));
  } catch { return 0; }
}

/** Count one event for the key; returns the seconds locked after it (0 = still allowed). */
export async function hit(env, key, rule) {
  if (!env?.DB) return 0;
  try {
    const now = Date.now();
    await env.DB.prepare(`INSERT INTO ${T} (ip, success, created_at) VALUES (?, 0, ?)`).bind(key, iso(now)).run();
    if (Math.random() < 0.05) await env.DB.prepare(`DELETE FROM ${T} WHERE created_at < ?`).bind(iso(now - 86400e3)).run();
  } catch { return 0; }
  return lockedFor(env, key, rule);
}

/** Forget the key's events (e.g. after a successful login). */
export async function reset(env, key) {
  if (!env?.DB) return;
  try { await env.DB.prepare(`DELETE FROM ${T} WHERE ip = ? AND success = 0`).bind(key).run(); } catch { /* best effort */ }
}

export const ipOf = (request) => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

// Limits (the owner asked for "3 wrong passwords → wait 5 minutes"). A key locks when `max` events fall inside `windowSec`.
export const LIMITS = {
  loginFail: { max: 3, windowSec: 5 * 60 },         // per IP + e-mail: 3 wrong passwords → 5 min
  loginIp: { max: 20, windowSec: 15 * 60 },         // per IP, any e-mail (credential stuffing)
  signupIp: { max: 5, windowSec: 60 * 60 },         // new accounts per IP per hour
  recoverIp: { max: 3, windowSec: 60 * 60 },        // reset requests per IP per hour
  recoverEmail: { max: 2, windowSec: 60 * 60 },     // reset requests per e-mail per hour
  adminLogin: { max: 3, windowSec: 15 * 60 },       // /api/admin-login per IP
};
