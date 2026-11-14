import { handleRest, isPublicTable } from '../../_lib/sb.js';

// Anonymous reads of public content tables are cached at the Cloudflare edge for a short time:
// fewer D1 reads and faster pages. Logged-in users and the admin (Authorization: Bearer <JWT>) always get live data,
// so the admin panel never shows stale rows; visitors see an edit within the table's TTL.
// Content tables that change rarely are kept longer (fewer D1 reads); tables that drive money/settings/moderation stay short.
const SHORT_TTL_TABLES = new Set(['ads', 'products', 'site_settings', 'redirects', 'pages', 'comments', 'user_notifications', 'nh_settings', 'affiliates']);
const EDGE_TTL_SHORT = 60;
const EDGE_TTL_CONTENT = 600;
const edgeTtl = (table) => (SHORT_TTL_TABLES.has(table) ? EDGE_TTL_SHORT : EDGE_TTL_CONTENT);
// Browsers only keep a response briefly, so an edit is never hidden for longer than the short TTL by the visitor's own cache.
const BROWSER_MAX_AGE = 60;
const isJwt = (h) => /^Bearer\s+[^.\s]+\.[^.\s]+\.[^.\s]+$/.test(h || '');

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = [].concat(params.path || []);
  const cacheable = request.method === 'GET' && path.length === 1 && isPublicTable(path[0]) && !isJwt(request.headers.get('authorization'));
  if (!cacheable) return handleRest(request, env, path);
  let cache, key;
  try {
    cache = caches.default;
    const variant = ['accept', 'prefer', 'range', 'accept-profile'].map((h) => request.headers.get(h) || '').join('|');
    key = new Request(`${request.url}${request.url.includes('?') ? '&' : '?'}__ek=${encodeURIComponent(variant)}`);
    const hit = await cache.match(key);
    if (hit) {
      const r = new Response(hit.body, hit);
      r.headers.set('x-edge-cache', 'HIT');
      r.headers.set('cache-control', `public, max-age=${BROWSER_MAX_AGE}`);
      return r;
    }
  } catch {
    cache = null;
  }
  const res = await handleRest(request, env, path);
  if (cache && res.status === 200) {
    const copy = new Response(res.clone().body, res);
    copy.headers.set('cache-control', `public, max-age=${edgeTtl(path[0])}`);
    copy.headers.set('x-edge-cache', 'MISS');
    try {
      const put = cache.put(key, copy);
      context.waitUntil(put); // not destructured: ctx methods need their receiver
    } catch { /* caching is best-effort */ }
    const out = new Response(res.body, res);
    out.headers.set('x-edge-cache', 'MISS');
    return out;
  }
  return res;
}
