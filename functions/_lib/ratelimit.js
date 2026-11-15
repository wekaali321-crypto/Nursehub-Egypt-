// Auth rate limits (login / signup / password reset) kept in the Cloudflare Cache API: no D1 reads or writes, and checked
// BEFORE any password hashing, so a flood of wrong passwords costs almost no CPU. Counters live per data centre (an attacker
// from one IP lands on one), which is enough here; a Cloudflare WAF rate-limit rule can add a global layer on top.
// Cache keys must live on the site's own hostname: Cloudflare's Cache API ignores keys on hosts outside the zone
// (an `rl.internal` key was silently never stored in production). bindOrigin() is called once per request.
let ORIGIN = 'https://nursehubegypt.com';
export function bindOrigin(request) { try { ORIGIN = new URL(request.url).origin; } catch { /* keep */ } }
const KEY = (k) => new Request(`${ORIGIN}/__rl/auth/${encodeURIComponent(k)}`);

async function read(k) {
  try { const h = await caches.default.match(KEY(k)); return h ? await h.json() : null; } catch { return null; }
}
async function write(k, v, ttlSec) {
  try { await caches.default.put(KEY(k), new Response(JSON.stringify(v), { headers: { 'cache-control': `max-age=${Math.max(1, Math.ceil(ttlSec))}` } })); } catch { /* best effort */ }
}

/** Seconds left on a lock for this key (0 = not locked). */
export async function lockedFor(k) {
  const v = await read(k);
  return v && v.until > Date.now() ? Math.ceil((v.until - Date.now()) / 1000) : 0;
}

/** Count one event; after `max` events inside `windowSec` the key is locked for `lockSec`. Returns seconds locked (0 = fine). */
export async function count(k, max, windowSec, lockSec) {
  const now = Date.now();
  let v = await read(k);
  if (!v || (v.reset < now && !(v.until > now))) v = { n: 0, reset: now + windowSec * 1000, until: 0 };
  v.n += 1;
  if (v.n >= max && !(v.until > now)) v.until = now + lockSec * 1000;
  await write(k, v, Math.max((v.reset - now) / 1000, (v.until - now) / 1000, 1));
  return v.until > now ? Math.ceil((v.until - now) / 1000) : 0;
}

export async function reset(k) {
  try { await caches.default.delete(KEY(k)); } catch { /* best effort */ }
}

export const ipOf = (request) => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

// Limits (the owner asked for "3 wrong passwords → wait 5 minutes").
export const LIMITS = {
  loginFail: { max: 3, windowSec: 5 * 60, lockSec: 5 * 60 },       // per IP + e-mail: 3 wrong passwords → 5 min
  loginIp: { max: 20, windowSec: 10 * 60, lockSec: 15 * 60 },      // per IP, any e-mail (credential stuffing)
  signupIp: { max: 6, windowSec: 60 * 60, lockSec: 60 * 60 },      // new accounts per IP per hour
  recoverIp: { max: 3, windowSec: 60 * 60, lockSec: 60 * 60 },     // reset requests per IP per hour
  recoverEmail: { max: 2, windowSec: 60 * 60, lockSec: 60 * 60 },  // reset requests per e-mail per hour
};
