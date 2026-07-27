// ============================================================
// المسار الصحيح: api/admin-orders.js
// رابط الاستدعاء: https://موقعك/api/admin-orders
// GET  → يرجّع كل الطلبات
// POST → { action: 'updateStatus', orderId, status }
//        { action: 'getDownloadLink', filePath }
// لازم يتبعت Header: Authorization: Bearer <token من admin-login>
// ============================================================
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, getBearerToken } = require('./_lib/adminAuth');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  const token = getBearerToken(req);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'محتاج تسجيل دخول' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, products(title, price, file_url)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    if (action === 'updateStatus') {
      const { orderId, status } = req.body;
      const update = { status };
      if (status === 'paid') update.confirmed_at = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('orders')
        .update(update)
        .eq('id', orderId);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (action === 'getDownloadLink') {
      const { filePath } = req.body;
      const { data, error } = await supabaseAdmin.storage
        .from('pdf-store')
        .createSignedUrl(filePath, 60 * 60);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ url: data.signedUrl });
    }

    return res.status(400).json({ error: 'action غير معروف' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
