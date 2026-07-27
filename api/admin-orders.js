// ============================================================
// المسار الصحيح: api/admin-orders.js  (استبدل الملف القديم بالكامل)
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { verifyToken, getBearerToken } from './_lib/adminAuth.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
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

      const { error } = await supabaseAdmin.from('orders').update(update).eq('id', orderId);
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
}
