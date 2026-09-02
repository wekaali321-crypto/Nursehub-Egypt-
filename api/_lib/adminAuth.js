// ============================================================
// api/_lib/adminAuth.js — shared admin-session helpers
//
// The admin session is a signed, time-limited HMAC token
// (payload = expiry timestamp, signed with ADMIN_SESSION_SECRET).
// It is carried ONLY in a Secure, HttpOnly, SameSite cookie — it is never
// returned in a JSON response body, so it is never reachable from
// JavaScript / localStorage on the client. A tampered or missing cookie
// cannot produce a valid signature without ADMIN_SESSION_SECRET, which
// only exists as a server-side environment variable.
// ============================================================
import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_MS = 24 * 60 * 60 * 1000; // 24h

export function createToken() {
  const expiry = Date.now() + SESSION_MS;
  const payload = `${expiry}`;
  const signature = crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

/** Constant-time signature check — avoids leaking timing information about how much of the signature matched. */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature || !/^\d+$/.test(payload)) return false;

  const expected = crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');

  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  return Date.now() <= Number(payload);
}

/** Sets the signed session as a Secure, HttpOnly cookie. Never exposed to client-side JS. */
export function setSessionCookie(res, token) {
  const secure = process.env.VERCEL_ENV !== 'development' ? ' Secure;' : '';
  const maxAge = Math.floor(SESSION_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/api; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res) {
  const secure = process.env.VERCEL_ENV !== 'development' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/api; HttpOnly;${secure} SameSite=Lax; Max-Age=0`);
}

/** Parses the admin session token out of the raw Cookie request header. */
export function getSessionCookie(req) {
  const header = req.headers['cookie'] || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (name === COOKIE_NAME) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/** Best-effort client IP for rate limiting (Vercel sets x-forwarded-for). */
export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}
