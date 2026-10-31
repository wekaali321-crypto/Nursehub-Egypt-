// Dynamic sitemap shared by /sitemap.xml and /api/sitemap (Cloudflare Pages Functions).
const STATIC = [
  ['/', 1.0], ['/category/articles', 0.8], ['/category/summaries', 0.8], ['/category/drugs', 0.8],
  ['/category/skills', 0.8], ['/category/careplans', 0.8], ['/category/books', 0.8],
  ['/drugs', 0.8], ['/drugs/all', 0.8], ['/drugs/peds-medications', 0.7], ['/drugs/prescriptions', 0.7],
  ['/courses', 0.8], ['/diseases', 0.8], ['/tools', 0.7], ['/store', 0.7], ['/quizzes', 0.7], ['/travel-questions', 0.7],
  ['/about', 0.5], ['/contact', 0.5], ['/faq', 0.5],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enc = encodeURIComponent;

async function rows(env, table, columns, filter = '') {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${columns}${filter}&limit=5000`;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok ? r.json() : [];
}

export async function sitemapResponse({ request, env }) {
  const site = env.SITE_URL || new URL(request.url).origin;
  const urls = STATIC.map(([p, pr]) => [p, pr]);
  try {
    const [articles, drugs, courses, chapters, peds, rx] = await Promise.all([
      rows(env, 'articles', 'slug', '&status=eq.published'),
      rows(env, 'drugs', 'slug'),
      rows(env, 'courses', 'id'),
      rows(env, 'course_chapters', 'id,course_id'),
      rows(env, 'peds_medications', 'id'),
      rows(env, 'rx_prescriptions', 'id'),
    ]);
    articles.forEach((a) => a.slug && urls.push([`/article/${enc(a.slug)}`, 0.7]));
    drugs.forEach((d) => d.slug && urls.push([`/drug/${enc(d.slug)}`, 0.6]));
    courses.forEach((c) => urls.push([`/courses/${enc(c.id)}`, 0.7]));
    chapters.forEach((c) => urls.push([`/courses/${enc(c.course_id)}/chapter/${enc(c.id)}`, 0.6]));
    try {
      const r = await fetch(`${site}/diseases/index.json`);
      const j = r.ok ? await r.json() : { items: [] };
      (j.items || []).forEach((c) => urls.push([`/diseases/${enc(c.id)}`, 0.7]));
    } catch {
      /* optional */
    }
    try {
      const r = await fetch(`${site}/clinical-cases/index.json`);
      const j = r.ok ? await r.json() : { cases: [] };
      (j.cases || []).forEach((c) => urls.push([`/cases/${enc(c.id)}`, 0.7]));
    } catch {
      /* optional */
    }
    peds.forEach((p) => urls.push([`/drugs/peds-medications/${enc(p.id)}`, 0.6]));
    rx.forEach((p) => urls.push([`/drugs/prescriptions/${enc(p.id)}`, 0.6]));
  } catch {
    /* fall back to the static list if Supabase is unreachable */
  }
  const seen = new Set();
  const body = urls
    .filter(([p]) => !seen.has(p) && seen.add(p))
    .map(([p, pr]) => `  <url><loc>${esc(site + p)}</loc><priority>${pr.toFixed(1)}</priority></url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
