// Cloudflare Pages Function: POST /api/admin-login (port of api/admin-login.js)
import { createToken, sessionCookie, clientIp, safeEqual, json, readJson } from '../_lib/auth.js';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return json({ error: 'Admin login is not configured' }, 503);
  }
  const db = env.DB || null;
  const ip = clientIp(request);

  if (db) {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const c = await db.prepare('SELECT COUNT(*) n FROM admin_login_attempts WHERE ip = ? AND success = 0 AND created_at >= ?').bind(ip, since).first();
    if ((c?.n ?? 0) >= MAX_ATTEMPTS) return json({ error: 'محاولات كثيرة جداً. حاول بعد قليل.' }, 429);
  }

  const { password } = await readJson(request);
  const ok = typeof password === 'string' && safeEqual(password, env.ADMIN_PASSWORD);
  if (db) {
    try {
      await db.prepare('INSERT INTO admin_login_attempts (ip, success) VALUES (?, ?)').bind(ip, ok ? 1 : 0).run();
    } catch (e) {
      console.error('admin-login: failed to record attempt', e);
    }
  }
  if (!ok) return json({ error: 'كلمة السر غلط' }, 401);

  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await createToken(env)) });
}

export const onRequest = ({ request }) => json({ error: 'Method not allowed' }, request.method === 'POST' ? 200 : 405);
