// ============================================================
// api/order-lookup.js — secure public order-tracking lookup
//
// The `orders` table intentionally has NO anon-readable RLS policy (it
// holds customer PII and payment data), so the customer-facing tracking
// page cannot query it directly with the public Supabase client. The
// actual data access goes through the existing public.get_order_status()
// SQL function — a SECURITY DEFINER RPC already scoped to return only
// invoice_no/status/items (never email, phone, name, or totals) — rather
// than this endpoint querying `orders` itself, so there is one single
// narrow read path to keep in sync, not two.
//
// This endpoint adds the layer that RPC alone can't provide: per-IP rate
// limiting, so brute-force enumeration of invoice numbers (which are not
// cryptographically random) is bounded even though the RPC itself is
// technically callable directly.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { getClientIp } from './_lib/adminAuth.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INVOICE_RE = /^INV-\d{4}-\d{4,10}$/;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const invoiceNo = typeof req.body?.invoiceNo === 'string' ? req.body.invoiceNo.trim() : '';
  if (!INVOICE_RE.test(invoiceNo)) {
    return res.status(400).json({ error: 'رقم الفاتورة غير صالح' });
  }

  const ip = getClientIp(req);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from('order_lookup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since);

  if (countError) return res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'محاولات كثيرة، حاول لاحقاً' });
  }
  await supabaseAdmin.from('order_lookup_attempts').insert({ ip });

  const { data, error } = await supabaseAdmin.rpc('get_order_status', { p_invoice: invoiceNo });
  if (error) return res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });

  return res.status(200).json({
    invoiceNo: row.invoice_no,
    paymentStatus: row.status,
    items: row.items ?? [],
  });
}
