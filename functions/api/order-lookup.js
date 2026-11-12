// Cloudflare Pages Function: POST /api/order-lookup (port of api/order-lookup.js)
import { clientIp, json, readJson } from '../_lib/auth.js';

const INVOICE_RE = /^INV-\d{4}-\d{4,10}$/;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 30;

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const invoiceNo = typeof body.invoiceNo === 'string' ? body.invoiceNo.trim() : '';
  if (!INVOICE_RE.test(invoiceNo)) return json({ error: 'رقم الفاتورة غير صالح' }, 400);

  const ip = clientIp(request);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const c = await env.DB.prepare('SELECT COUNT(*) n FROM order_lookup_attempts WHERE ip = ? AND created_at >= ?').bind(ip, since).first();
  if ((c?.n ?? 0) >= MAX_ATTEMPTS) return json({ error: 'محاولات كثيرة، حاول لاحقاً' }, 429);
  await env.DB.prepare('INSERT INTO order_lookup_attempts (ip) VALUES (?)').bind(ip).run();

  const row = await env.DB.prepare('SELECT invoice_no, status, items FROM orders WHERE invoice_no = ?').bind(invoiceNo).first();
  if (!row) return json({ error: 'لم يتم العثور على الطلب' }, 404);
  let items = []; try { items = row.items ? JSON.parse(row.items) : []; } catch { /* keep empty */ }
  return json({ invoiceNo: row.invoice_no, paymentStatus: row.status, items });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
