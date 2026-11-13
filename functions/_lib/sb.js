// Supabase-compatible backend on Cloudflare D1 (PostgREST subset + GoTrue subset + Storage subset).
// The browser keeps using @supabase/supabase-js; only VITE_SUPABASE_URL changes to the site origin.
import { pushToRole } from './push.js';
import { SCHEMA } from './sbschema.js';

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uJson = (o) => b64u(enc.encode(JSON.stringify(o)));
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, prefer, range, range-unit, accept-profile, content-profile, x-supabase-api-version',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'access-control-expose-headers': 'content-range, content-location',
};
export const respond = (body, status = 200, headers = {}) =>
  new Response(body == null ? null : typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS, ...headers } });
export const perr = (status, code, message, details = null) => respond({ code, message, details, hint: null }, status);

// ---------------------------------------------------------------- JWT (HS256)
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signJwt(env, claims, ttlSec = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64uJson({ alg: 'HS256', typ: 'JWT' });
  const body = b64uJson({ iss: 'nursehub', aud: 'authenticated', iat: now, exp: now + ttlSec, ...claims });
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env.JWT_SECRET), enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64u(sig)}`;
}
export async function verifyJwt(env, token) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s || !env.JWT_SECRET) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.JWT_SECRET), fromB64u(s), enc.encode(`${h}.${b}`));
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64u(b)));
    return claims.exp && claims.exp < Date.now() / 1000 ? null : claims;
  } catch { return null; }
}
/** Identity of the caller: { role: 'anon' | 'authenticated', uid, email } */
export async function identify(request, env) {
  const auth = request.headers.get('authorization') || '';
  const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = tok ? await verifyJwt(env, tok) : null;
  if (claims?.sub && claims.role === 'authenticated') return { role: 'authenticated', uid: claims.sub, email: claims.email || null };
  return { role: 'anon', uid: null, email: null };
}
export async function isAdmin(env, who) {
  if (!who.uid) return false;
  const r = await env.DB.prepare("SELECT 1 FROM profiles WHERE id = ? AND role IN ('admin','superadmin')").bind(who.uid).first();
  return !!r;
}

// ---------------------------------------------------------------- policies (replaces Postgres RLS)
const CONTENT = `ads affiliates anatomy_topics applied_pharm_items articles cardiac_med_groups categories clinical_protocols course_chapters course_questions courses dialysis_topics disease_images drug_antidotes drug_classifications drug_interactions drug_suffixes drugs er_medications er_reception_topics exam_categories exam_questions exams first_aid_topics fundamentals_topics high_alert_ref icu_medications icu_topics interview_categories interview_questions iv_compatibility lasa_pairs media nicu_topics obgyn_topics operating_room_topics organ_dose_adjustments otc_conditions pages pediatric_quiz_questions pediatric_topics peds_medications pharm_mnemonics pharmacology_topics pharmacy_facts pregnancy_lactation_safety products quiz_questions radiology_topics redirects rx_prescriptions site_settings tags terminology_quiz_questions terminology_topics travel_categories travel_questions travel_review_sections`.split(/\s+/);
const READ_FILTER = { articles: "status = 'published'", pages: "status = 'published'", ads: 'active = 1', comments: "status = 'approved'" };
const POLICY = {};
CONTENT.push('nh_settings');
for (const t of CONTENT) POLICY[t] = { read: 'public', write: 'admin' };
Object.assign(POLICY, {
  activity_log: { read: 'admin', write: 'admin' },
  admin_login_attempts: { read: 'none', write: 'none' },
  order_lookup_attempts: { read: 'none', write: 'none' },
  bookmarks: { read: 'own', write: 'own' },
  reading_history: { read: 'own', write: 'own' },
  comments: { read: 'public', write: 'admin', insert: 'public' },
  orders: { read: 'orders', write: 'admin', insert: 'public' },
  profiles: { read: 'none', write: 'none' },
  push_subscriptions: { read: 'admin', write: 'admin', insert: 'public' },
  site_installs: { read: 'admin', write: 'none', insert: 'public' },
  site_pings: { read: 'admin', write: 'none', insert: 'public' },
  site_visits: { read: 'admin', write: 'none', insert: 'public' },
  subscribers: { read: 'admin', write: 'admin', insert: 'public' },
});
const EMAIL_RE = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
function publicInsertOk(table, row) {
  switch (table) {
    case 'comments': return row.status === 'pending';
    case 'orders': return row.status === 'pending';
    case 'push_subscriptions': return row.role === 'visitor';
    case 'subscribers': {
      const e = String(row.email ?? '').trim();
      return EMAIL_RE.test(e) && e.length >= 3 && e.length <= 254 && String(row.id ?? '').trim().length >= 1 && String(row.id).length <= 128 && (row.status == null || ['active', 'unsubscribed'].includes(row.status));
    }
    default: return true; // site_visits / site_pings / site_installs
  }
}

// ---------------------------------------------------------------- value conversion
const qi = (n) => `"${String(n).replace(/"/g, '')}"`;
function fromDb(table, row) {
  const cols = SCHEMA[table].cols;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const t = cols[k];
    if (v == null) out[k] = null;
    else if (t === 'bool') out[k] = !!v;
    else if (t === 'json' || t === 'arr') { try { out[k] = JSON.parse(v); } catch { out[k] = v; } }
    else out[k] = v;
  }
  return out;
}
function toDb(table, k, v) {
  const t = SCHEMA[table].cols[k];
  if (v === undefined) return null;
  if (v === null) return null;
  if (t === 'bool') return v === true || v === 'true' || v === 1 ? 1 : 0;
  if (t === 'json' || t === 'arr') return typeof v === 'string' ? v : JSON.stringify(v);
  return v;
}

// ---------------------------------------------------------------- query parsing
function splitTop(s, sep = ',') {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
function cond(table, col, expr, params) {
  if (!SCHEMA[table].cols[col]) throw new Error(`column ${col}`);
  let neg = false, e = expr;
  if (e.startsWith('not.')) { neg = true; e = e.slice(4); }
  const d = e.indexOf('.');
  const op = e.slice(0, d), raw = e.slice(d + 1);
  const type = SCHEMA[table].cols[col];
  const val = (x) => { if (type === 'bool') return x === 'true' ? 1 : 0; if (type === 'int' || type === 'num') return Number(x); return x; };
  let sql;
  switch (op) {
    case 'eq': sql = `${qi(col)} = ?`; params.push(val(raw)); break;
    case 'neq': sql = `${qi(col)} <> ?`; params.push(val(raw)); break;
    case 'gt': sql = `${qi(col)} > ?`; params.push(val(raw)); break;
    case 'gte': sql = `${qi(col)} >= ?`; params.push(val(raw)); break;
    case 'lt': sql = `${qi(col)} < ?`; params.push(val(raw)); break;
    case 'lte': sql = `${qi(col)} <= ?`; params.push(val(raw)); break;
    case 'like': sql = `${qi(col)} LIKE ?`; params.push(raw.replace(/\*/g, '%')); break;
    case 'ilike': sql = `${qi(col)} LIKE ? COLLATE NOCASE`; params.push(raw.replace(/\*/g, '%')); break;
    case 'is': sql = raw === 'null' ? `${qi(col)} IS NULL` : raw === 'true' ? `${qi(col)} = 1` : `${qi(col)} = 0`; break;
    case 'in': {
      const items = splitTop(raw.replace(/^\(|\)$/g, '')).map((x) => x.replace(/^"|"$/g, ''));
      sql = items.length ? `${qi(col)} IN (${items.map(() => '?').join(',')})` : '0';
      items.forEach((x) => params.push(val(x)));
      break;
    }
    case 'cs': { // array contains: tags=cs.{a,b}
      const items = raw.replace(/^\{|\}$/g, '').split(',').map((x) => x.replace(/^"|"$/g, ''));
      sql = items.map(() => `EXISTS (SELECT 1 FROM json_each(${qi(col)}) WHERE value = ?)`).join(' AND ');
      items.forEach((x) => params.push(x));
      break;
    }
    default: throw new Error(`operator ${op}`);
  }
  return neg ? `NOT (${sql})` : `(${sql})`;
}
function logicTree(table, expr, params, joiner) {
  const inner = expr.replace(/^\(|\)$/g, '');
  const parts = splitTop(inner).map((p) => {
    if (p.startsWith('and(')) return logicTree(table, p.slice(3), params, ' AND ');
    if (p.startsWith('or(')) return logicTree(table, p.slice(2), params, ' OR ');
    const i = p.indexOf('.');
    return cond(table, p.slice(0, i), p.slice(i + 1), params);
  });
  return `(${parts.join(joiner)})`;
}
function buildWhere(table, url, extra, params) {
  const clauses = [];
  for (const [k, v] of url.searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(k)) continue;
    if (k === 'or') clauses.push(logicTree(table, v, params, ' OR '));
    else if (k === 'and') clauses.push(logicTree(table, v, params, ' AND '));
    else clauses.push(cond(table, k, v, params));
  }
  for (const x of extra) clauses.push(x);
  return clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
}
function buildSelect(table, url) {
  const sel = url.searchParams.get('select');
  if (!sel || sel === '*') return '*';
  const cols = splitTop(sel).map((s) => s.trim()).filter(Boolean);
  if (cols.includes('*')) return '*';
  const known = cols.map((c) => c.split(':').pop()).filter((c) => SCHEMA[table].cols[c]);
  return known.length ? known.map(qi).join(',') : '*';
}
function buildOrder(table, url) {
  const o = url.searchParams.get('order');
  if (!o) return '';
  const parts = o.split(',').map((s) => {
    const [c, ...rest] = s.split('.');
    if (!SCHEMA[table].cols[c]) return null;
    return `${qi(c)} ${rest.includes('desc') ? 'DESC' : 'ASC'}${rest.includes('nullsfirst') ? ' NULLS FIRST' : rest.includes('nullslast') ? ' NULLS LAST' : ''}`;
  }).filter(Boolean);
  return parts.length ? ' ORDER BY ' + parts.join(',') : '';
}

// ---------------------------------------------------------------- request handler
export async function handleRest(request, env, path, forceAdmin = false) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(request.url);
  if (!env.DB) return perr(503, 'PGRST000', 'D1 binding DB is not configured');
  const who = await identify(request, env);
  const method = request.method;
  const [first, ...restPath] = path;

  if (first === 'rpc') return handleRpc(request, env, restPath[0], who);

  const table = first;
  if (!table || !SCHEMA[table]) return perr(404, 'PGRST205', `Could not find the table 'public.${table}'`);
  const pol = POLICY[table] || { read: 'none', write: 'none' };
  const admin = forceAdmin || (who.role === 'authenticated' ? await isAdmin(env, who) : false);
  const prefer = (request.headers.get('prefer') || '').split(',').map((s) => s.trim());
  const wantRep = prefer.includes('return=representation');
  const wantCount = prefer.find((p) => p.startsWith('count='));
  const single = (request.headers.get('accept') || '').includes('vnd.pgrst.object');

  // row-level read filter
  const readExtra = [], readParams = [];
  const canRead = () => {
    if (admin) return true;
    if (pol.read === 'public') { if (READ_FILTER[table]) readExtra.push(READ_FILTER[table]); return true; }
    if (pol.read === 'own' && who.uid) { readExtra.push('user_id = ?'); readParams.push(who.uid); return true; }
    if (pol.read === 'orders' && who.uid) {
      readExtra.push('(user_id = ? OR (email IS NOT NULL AND email = ?))'); readParams.push(who.uid, who.email || '\u0000'); return true;
    }
    return false;
  };

  try {
    if (method === 'GET' || method === 'HEAD') {
      if (!canRead()) return perr(who.uid ? 403 : 401, '42501', `permission denied for table ${table}`);
      const params = [];
      const where = buildWhere(table, url, readExtra, params);
      const fullParams = [...params, ...readParams];
      let sql = `SELECT ${buildSelect(table, url)} FROM ${qi(table)}${where}${buildOrder(table, url)}`;
      let lim = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : null;
      let off = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0;
      const range = request.headers.get('range');
      if (range && /^\d+-\d+$/.test(range)) { const [a, b] = range.split('-').map(Number); off = a; lim = b - a + 1; }
      if (lim != null) sql += ` LIMIT ${Math.max(0, lim | 0)} OFFSET ${Math.max(0, off | 0)}`;
      const rows = (await env.DB.prepare(sql).bind(...fullParams).all()).results.map((r) => fromDb(table, r));
      let total = rows.length;
      if (wantCount || method === 'HEAD') {
        const c = await env.DB.prepare(`SELECT COUNT(*) n FROM ${qi(table)}${where}`).bind(...fullParams).first();
        total = c.n;
      }
      const cr = rows.length ? `${off}-${off + rows.length - 1}/${wantCount ? total : '*'}` : `*/${wantCount ? total : 0}`;
      if (method === 'HEAD') return new Response(null, { status: 200, headers: { ...CORS, 'content-range': `*/${total}` } });
      if (single) {
        if (rows.length !== 1) return perr(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned', `The result contains ${rows.length} rows`);
        return respond(rows[0], 200, { 'content-range': cr });
      }
      return respond(rows, 200, { 'content-range': cr });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => null);
      const rows = Array.isArray(body) ? body : body ? [body] : [];
      if (!rows.length) return respond([], 201);
      const allowed = admin || (pol.insert === 'public' && rows.every((r) => publicInsertOk(table, r))) || (pol.write === 'own' && who.uid && rows.every((r) => r.user_id === who.uid));
      if (!allowed) return perr(who.uid || pol.insert ? 403 : 401, '42501', `new row violates row-level security policy for table "${table}"`);
      if (wantRep && !admin && pol.read !== 'public' && !(pol.write === 'own')) return perr(403, '42501', 'permission denied (cannot return inserted rows)');
      const upsert = prefer.some((p) => p.startsWith('resolution=merge-duplicates') || p.startsWith('resolution=ignore-duplicates'));
      const ignore = prefer.includes('resolution=ignore-duplicates');
      const onConflict = (url.searchParams.get('on_conflict') || SCHEMA[table].pk).split(',').filter((c) => SCHEMA[table].cols[c]);
      const stmts = [];
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => SCHEMA[table].cols[k] && row[k] !== undefined);
        if (!keys.length) continue;
        const cols = keys.map(qi).join(','), ph = keys.map(() => '?').join(',');
        const vals = keys.map((k) => toDb(table, k, row[k]));
        let sql = `INSERT INTO ${qi(table)} (${cols}) VALUES (${ph})`;
        if (upsert) {
          const upd = keys.filter((k) => !onConflict.includes(k));
          sql += ignore || !upd.length ? ` ON CONFLICT (${onConflict.map(qi).join(',')}) DO NOTHING` : ` ON CONFLICT (${onConflict.map(qi).join(',')}) DO UPDATE SET ${upd.map((k) => `${qi(k)} = excluded.${qi(k)}`).join(',')}`;
        }
        sql += ' RETURNING *';
        stmts.push(env.DB.prepare(sql).bind(...vals));
      }
      const out = [];
      // one D1 round-trip per 90 rows (Pages Functions allow few subrequests on the free plan)
      for (let i = 0; i < stmts.length; i += 90) {
        const res = await env.DB.batch(stmts.slice(i, i + 90));
        for (const r of res) for (const row of r.results || []) out.push(fromDb(table, row));
      }
      if (table === 'orders' && !admin) {
        // new order → push to the admin's devices (replaces the old database trigger)
        const o = out[0] || rows[0] || {};
        try { await pushToRole(env, 'admin', { title: '🛒 طلب جديد', body: `${o.invoice_no || ''} — ${o.total ?? o.amount ?? ''}`.trim(), link: o.invoice_no ? `/admin/orders?inv=${encodeURIComponent(o.invoice_no)}` : '/admin/orders', id: 'order-' + (o.id || '') }); } catch { /* never block an order */ }
      }
      return wantRep ? (single ? respond(out[0] ?? null, 201) : respond(out, 201)) : new Response(null, { status: 201, headers: CORS });
    }

    if (method === 'PATCH' || method === 'DELETE') {
      const own = pol.write === 'own' && who.uid;
      if (!admin && !own) return perr(who.uid ? 403 : 401, '42501', `permission denied for table ${table}`);
      const params = [];
      const extra = []; const extraParams = [];
      if (!admin && own) { extra.push('user_id = ?'); extraParams.push(who.uid); }
      const where = buildWhere(table, url, extra, params);
      const fullParams = [...params, ...extraParams];
      if (!where) return perr(400, 'PGRST000', 'Filters required for update/delete');
      if (method === 'DELETE') {
        const rs = await env.DB.prepare(`DELETE FROM ${qi(table)}${where} RETURNING *`).bind(...fullParams).all();
        return wantRep ? respond(rs.results.map((r) => fromDb(table, r)), 200) : new Response(null, { status: 204, headers: CORS });
      }
      const body = await request.json().catch(() => ({}));
      const keys = Object.keys(body).filter((k) => SCHEMA[table].cols[k] && k !== SCHEMA[table].pk);
      if (!keys.length) return respond([], 200);
      const setSql = keys.map((k) => `${qi(k)} = ?`).join(',');
      const setVals = keys.map((k) => toDb(table, k, body[k]));
      const rs = await env.DB.prepare(`UPDATE ${qi(table)} SET ${setSql}${where} RETURNING *`).bind(...setVals, ...fullParams).all();
      const rows = rs.results.map((r) => fromDb(table, r));
      return wantRep ? (single ? respond(rows[0] ?? null, 200) : respond(rows, 200)) : new Response(null, { status: 204, headers: CORS });
    }
    return perr(405, 'PGRST000', 'Method not allowed');
  } catch (e) {
    return perr(400, 'PGRST100', String(e.message || e));
  }
}

// ---------------------------------------------------------------- RPC
async function handleRpc(request, env, name, who) {
  if (name === 'admin_site_stats') {
    if (!(await isAdmin(env, who))) return perr(403, 'P0001', 'not allowed');
    return respond(await adminSiteStats(env));
  }
  return perr(404, 'PGRST202', `Could not find the function public.${name}`);
}

const CAIRO_OFFSET_SQL = "datetime(created_at, '+2 hours')"; // Egypt (UTC+2; DST ignored in dashboard buckets)
async function adminSiteStats(env) {
  const db = env.DB;
  const one = async (sql, ...b) => (await db.prepare(sql).bind(...b).first()) || {};
  const all = async (sql, ...b) => (await db.prepare(sql).bind(...b).all()).results;
  await db.prepare("DELETE FROM site_pings WHERE created_at < datetime('now','-3 days')").run();
  const day = `date(${CAIRO_OFFSET_SQL})`;
  const today = (await one("SELECT date('now','+2 hours') d")).d;
  const yday = (await one("SELECT date('now','+2 hours','-1 day') d")).d;
  const online = (await one("SELECT COUNT(DISTINCT visitor_id) n FROM (SELECT visitor_id FROM site_pings WHERE created_at > datetime('now','-2 minutes') UNION ALL SELECT visitor_id FROM site_visits WHERE created_at > datetime('now','-2 minutes'))")).n;
  const onlineApp = (await one("SELECT COUNT(DISTINCT visitor_id) n FROM (SELECT visitor_id FROM site_pings WHERE is_app=1 AND created_at > datetime('now','-2 minutes') UNION ALL SELECT visitor_id FROM site_visits WHERE is_app=1 AND created_at > datetime('now','-2 minutes'))")).n;
  const sessions = await all(`SELECT ${day} dy, COUNT(*) c FROM (SELECT visitor_id, created_at, LAG(created_at) OVER (PARTITION BY visitor_id ORDER BY created_at) prev FROM site_visits) WHERE prev IS NULL OR (julianday(created_at) - julianday(prev)) > 0.0208333 GROUP BY 1`);
  const sess = Object.fromEntries(sessions.map((r) => [r.dy, r.c]));
  const dayStats = async (d) => ({
    ...(await one(`SELECT COUNT(DISTINCT visitor_id) visitors, COUNT(*) views FROM site_visits WHERE ${day} = ?`, d)),
    sessions: sess[d] || 0,
  });
  const t = await dayStats(today);
  const y = await dayStats(yday);
  t.new_visitors = (await one(`SELECT COUNT(*) n FROM (SELECT visitor_id, MIN(created_at) f FROM site_visits GROUP BY visitor_id) WHERE date(datetime(f,'+2 hours')) = ?`, today)).n;
  t.installs = (await one(`SELECT COUNT(DISTINCT visitor_id) n FROM site_installs WHERE kind IN ('installed','apk_download') AND ${day} = ?`, today)).n;
  t.app_users = (await one(`SELECT COUNT(DISTINCT visitor_id) n FROM site_visits WHERE is_app=1 AND ${day} = ?`, today)).n;
  const tot = await one('SELECT COUNT(DISTINCT visitor_id) visitors, COUNT(*) views, MIN(created_at) since FROM site_visits');
  const installers = (await one("SELECT COUNT(DISTINCT visitor_id) n FROM site_installs WHERE kind IN ('installed','apk_download')")).n;
  const dv = await all(`SELECT ${day} dy, COUNT(DISTINCT visitor_id) visitors, COUNT(*) views FROM site_visits WHERE created_at > datetime('now','-31 days') GROUP BY 1`);
  const di = await all(`SELECT ${day} dy, COUNT(DISTINCT visitor_id) installs FROM site_installs WHERE kind IN ('installed','apk_download') AND created_at > datetime('now','-31 days') GROUP BY 1`);
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = (await one("SELECT date('now','+2 hours',?) d", `-${i} days`)).d;
    const v = dv.find((r) => r.dy === d) || {}, ins = di.find((r) => r.dy === d) || {};
    daily.push({ day: d, visitors: v.visitors || 0, views: v.views || 0, sessions: sess[d] || 0, installs: ins.installs || 0 });
  }
  const mv = await all("SELECT strftime('%Y-%m', datetime(created_at,'+2 hours')) mo, COUNT(DISTINCT visitor_id) visitors, COUNT(*) views, COUNT(DISTINCT CASE WHEN is_app=1 THEN visitor_id END) app_users FROM site_visits GROUP BY 1");
  const mi = await all("SELECT strftime('%Y-%m', datetime(created_at,'+2 hours')) mo, COUNT(DISTINCT visitor_id) installs FROM site_installs WHERE kind IN ('installed','apk_download') GROUP BY 1");
  const monthly = [];
  for (let i = 0; i < 12; i++) {
    const mo = (await one("SELECT strftime('%Y-%m', date('now','+2 hours','start of month',?)) m", `-${i} months`)).m;
    const v = mv.find((r) => r.mo === mo) || {}, ins = mi.find((r) => r.mo === mo) || {};
    monthly.push({ month: mo, visitors: v.visitors || 0, views: v.views || 0, installs: ins.installs || 0, app_users: v.app_users || 0 });
  }
  const obj = (rows, k) => Object.fromEntries(rows.map((r) => [r[k] ?? 'unknown', r.c]));
  return {
    generated_at: new Date().toISOString(), online_now: online, online_app: onlineApp,
    today: t, yesterday: { visitors: y.visitors, views: y.views, sessions: y.sessions },
    totals: { visitors: tot.visitors, views: tot.views, sessions: Object.values(sess).reduce((a, b) => a + b, 0), installers, since: tot.since },
    daily, monthly,
    installs_by_kind: obj(await all('SELECT kind, COUNT(*) c FROM site_installs GROUP BY kind'), 'kind'),
    installs_by_platform: obj(await all("SELECT platform, COUNT(DISTINCT visitor_id) c FROM site_installs WHERE kind IN ('installed','apk_download') GROUP BY platform"), 'platform'),
    devices_30d: obj(await all("SELECT device_type, COUNT(DISTINCT visitor_id) c FROM site_visits WHERE created_at > datetime('now','-30 days') GROUP BY 1"), 'device_type'),
    sources_30d: Object.fromEntries((await all("SELECT COALESCE(source,'direct') s, COUNT(DISTINCT visitor_id) c FROM site_visits WHERE created_at > datetime('now','-30 days') GROUP BY 1")).map((r) => [r.s, r.c])),
    top_pages_30d: (await all("SELECT path, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors FROM site_visits WHERE created_at > datetime('now','-30 days') GROUP BY path ORDER BY views DESC LIMIT 15")),
  };
}

/** Server-side read used by Pages Functions (sitemap / SEO pages): bypasses row policies. */
export async function internalRows(env, table, query) {
  const res = await handleRest(new Request(`https://internal/rest/v1/${table}?${query}`), env, [table], true);
  return res.ok ? res.json() : null;
}
