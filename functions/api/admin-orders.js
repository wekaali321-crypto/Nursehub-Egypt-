// Cloudflare Pages Function: /api/admin-orders (port of api/admin-orders.js)
import { verifyToken, getSessionToken, json, readJson } from '../_lib/auth.js';

export async function onRequest({ request, env }) {
  if (!(await verifyToken(env, getSessionToken(request)))) return json({ error: 'محتاج تسجيل دخول' }, 401);

  if (request.method === 'GET') {
    const rows = (await env.DB.prepare('SELECT o.*, p.title AS p_title, p.price AS p_price, p.file_url AS p_file FROM orders o LEFT JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC').all()).results;
    const orders = rows.map(({ p_title, p_price, p_file, ...o }) => ({
      ...o,
      items: o.items ? (() => { try { return JSON.parse(o.items); } catch { return o.items; } })() : o.items,
      products: p_title != null || p_file != null ? { title: p_title, price: p_price, file_url: p_file } : null,
    }));
    return json({ orders });
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    if (body.action === 'updateStatus') {
      const { orderId, status } = body;
      if (typeof orderId !== 'string' || !orderId || !['pending', 'paid', 'failed', 'refunded'].includes(status)) {
        return json({ error: 'orderId/status غير صالحين' }, 400);
      }
      await env.DB.prepare('UPDATE orders SET status = ?, confirmed_at = CASE WHEN ? = \'paid\' THEN ? ELSE confirmed_at END WHERE id = ?').bind(status, status, new Date().toISOString(), orderId).run();
      return json({ ok: true });
    }
    if (body.action === 'getDownloadLink') {
      const { filePath } = body;
      if (typeof filePath !== 'string' || !filePath || filePath.includes('..')) return json({ error: 'filePath غير صالح' }, 400);
      // files are public static assets on Cloudflare (copied from the old private bucket)
      return json({ url: new URL(filePath.startsWith('/') ? filePath : `/media/${filePath}`, request.url).href });
    }
    return json({ error: 'action غير معروف' }, 400);
  }
  return json({ error: 'Method not allowed' }, 405);
}
