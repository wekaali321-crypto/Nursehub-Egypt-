import { sitemapResponse } from './_lib/sitemap.js';

// Cache the generated sitemap at the edge for an hour: building it queries Supabase and parses the guide index,
// which is too much CPU to repeat on every request on the Workers free plan.
export const onRequestGet = async (ctx) => {
  const key = new Request(new URL(ctx.request.url).origin + '/sitemap.xml');
  try {
    const hit = await caches.default.match(key);
    if (hit) return hit;
  } catch { /* cache unavailable */ }
  const res = await sitemapResponse(ctx);
  try { ctx.waitUntil(caches.default.put(key, res.clone())); } catch { /* ignore */ }
  return res;
};

// HEAD (link checkers, some validators) must describe the XML, not fall through to the SPA page.
export const onRequestHead = async (ctx) => {
  const res = await onRequestGet(ctx);
  return new Response(null, { status: res.status, headers: res.headers });
};
