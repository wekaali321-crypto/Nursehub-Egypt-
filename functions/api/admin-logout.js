// Cloudflare Pages Function: POST /api/admin-logout
import { clearedCookie, json } from '../_lib/auth.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'set-cookie': clearedCookie() });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
