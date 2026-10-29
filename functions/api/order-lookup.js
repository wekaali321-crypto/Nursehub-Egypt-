// Cloudflare Pages Function: POST /api/order-lookup (port of api/order-lookup.js)
import { createClient } from '@supabase/supabase-js';
import { clientIp, json, readJson } from '../_lib/auth.js';

const INVOICE_RE = /^INV-\d{4}-\d{4,10}$/;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 30;

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const invoiceNo = typeof body.invoiceNo === 'string' ? body.invoiceNo.trim() : '';
  if (!INVOICE_RE.test(invoiceNo)) return json({ error: 'رقم الفاتورة غير صالح' }, 400);

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const ip = clientIp(request);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: countError } = await db.from('order_lookup_attempts').select('*', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since);
  if (countError) return json({ error: 'حدث خطأ، حاول مرة أخرى' }, 500);
  if ((count ?? 0) >= MAX_ATTEMPTS) return json({ error: 'محاولات كثيرة، حاول لاحقاً' }, 429);
  await db.from('order_lookup_attempts').insert({ ip });

  const { data, error } = await db.rpc('get_order_status', { p_invoice: invoiceNo });
  if (error) return json({ error: 'حدث خطأ، حاول مرة أخرى' }, 500);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return json({ error: 'لم يتم العثور على الطلب' }, 404);
  return json({ invoiceNo: row.invoice_no, paymentStatus: row.status, items: row.items ?? [] });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
