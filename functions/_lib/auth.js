// Cloudflare Pages Functions port of api/_lib/adminAuth.js (Web Crypto instead of Node crypto).
// Session = "<expiry-ms>.<hex hmac-sha256>" signed with ADMIN_SESSION_SECRET, kept only in a Secure HttpOnly cookie.

const COOKIE_NAME = 'admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const enc = new TextEncoder();

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison. */
export function safeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function createToken(env) {
  const payload = `${Date.now() + SESSION_MS}`;
  return `${payload}.${await hmacHex(env.ADMIN_SESSION_SECRET, payload)}`;
}

export async function verifyToken(env, token) {
  if (!token || typeof token !== 'string' || !env.ADMIN_SESSION_SECRET) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature || !/^\d+$/.test(payload)) return false;
  const expected = await hmacHex(env.ADMIN_SESSION_SECRET, payload);
  if (!safeEqual(signature, expected)) return false;
  return Date.now() <= Number(payload);
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_MS / 1000)}`;
}

export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getSessionToken(request) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === COOKIE_NAME) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
