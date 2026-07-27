// ============================================================
// المسار الصحيح: api/admin-login.js
// رابط الاستدعاء: https://موقعك/api/admin-login  (POST)
// ============================================================
const { createToken } = require('./_lib/adminAuth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'كلمة السر غلط' });
  }

  const token = createToken();
  res.status(200).json({ token });
};
