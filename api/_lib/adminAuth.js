// ============================================================
// المسار الصحيح: api/_lib/adminAuth.js  (استبدل الملف القديم بالكامل)
// ============================================================
import crypto from 'crypto';

export function createToken() {
  const expiry = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${expiry}`;
  const signature = crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expected) return false;
  if (Date.now() > Number(payload)) return false;

  return true;
}

export function getBearerToken(req) {
  const header = req.headers['authorization'] || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}
