// ============================================================
// المسار الصحيح: api/admin-login.js  (استبدل الملف القديم بالكامل)
// ============================================================
import { createToken } from './_lib/adminAuth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'كلمة السر غلط' });
  }

  const token = createToken();
  res.status(200).json({ token });
}
