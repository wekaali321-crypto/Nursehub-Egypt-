// ============================================================
// api/admin-logout.js — clears the admin session cookie server-side.
// ============================================================
import { clearSessionCookie } from './_lib/adminAuth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
