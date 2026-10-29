// Cloudflare Pages Function: /api/admin-orders (port of api/admin-orders.js)
import { createClient } from '@supabase/supabase-js';
import { verifyToken, getSessionToken, json, readJson } from '../_lib/auth.js';

export async function onRequest({ request, env }) {
  if (!(await verifyToken(env, getSessionToken(request)))) return json({ error: 'محتاج تسجيل دخول' }, 401);
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  if (request.method === 'GET') {
    const { data, error } = await db.from('orders').select('*, products(title, price, file_url)').order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ orders: data });
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    if (body.action === 'updateStatus') {
      const { orderId, status } = body;
      if (typeof orderId !== 'string' || !orderId || !['pending', 'paid', 'failed', 'refunded'].includes(status)) {
        return json({ error: 'orderId/status غير صالحين' }, 400);
      }
      const update = { status };
      if (status === 'paid') update.confirmed_at = new Date().toISOString();
      const { error } = await db.from('orders').update(update).eq('id', orderId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }
    if (body.action === 'getDownloadLink') {
      const { filePath } = body;
      if (typeof filePath !== 'string' || !filePath || filePath.includes('..')) return json({ error: 'filePath غير صالح' }, 400);
      const { data, error } = await db.storage.from('pdf-store').createSignedUrl(filePath, 60 * 60);
      if (error) return json({ error: error.message }, 500);
      return json({ url: data.signedUrl });
    }
    return json({ error: 'action غير معروف' }, 400);
  }
  return json({ error: 'Method not allowed' }, 405);
}
