// ============================================================
// api/admin-login.js
//
// Verifies ADMIN_PASSWORD (server-side env var, never sent to the
// browser) and, on success, sets a signed session as a Secure HttpOnly
// cookie. The token itself is never returned in the response body, so it
// is never reachable from client-side JavaScript or localStorage.
//
// Rate limiting is backed by a Postgres table (admin_login_attempts) via
// the service-role key, so it persists across serverless invocations
// (unlike an in-memory counter, which would reset on every cold start).
// ============================================================
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createToken, setSessionCookie, getClientIp } from './_lib/adminAuth.js';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length to avoid a fast-path timing
    // signal on length mismatch.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function recentFailures(ip) {
  if (!supabaseAdmin) return 0;
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabaseAdmin
    .from('admin_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('success', false)
    .gte('created_at', since);
  return count ?? 0;
}

async function recordAttempt(ip, success) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('admin_login_attempts').insert({ ip, success }).select().maybeSingle().catch(() => {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.error('admin-login: ADMIN_PASSWORD or ADMIN_SESSION_SECRET is not configured');
    return res.status(503).json({ error: 'Admin login is not configured' });
  }

  const ip = getClientIp(req);
  const failures = await recentFailures(ip);
  if (failures >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'محاولات كثيرة جداً. حاول بعد قليل.' });
  }

  const { password } = req.body || {};
  const ok = typeof password === 'string' && timingSafeStringEqual(password, process.env.ADMIN_PASSWORD);

  await recordAttempt(ip, ok);

  if (!ok) {
    return res.status(401).json({ error: 'كلمة السر غلط' });
  }

  const token = createToken();
  setSessionCookie(res, token);
  res.status(200).json({ ok: true });
}
