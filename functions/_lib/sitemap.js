import { internalRows } from './sb.js';
// Dynamic sitemap shared by /sitemap.xml and /api/sitemap (Cloudflare Pages Functions).
const STATIC = [
  ['/', 1.0],
  // /category/<section> pages are added below, only for sections that contain published articles (never empty ones)
  ['/drugs', 0.8], ['/drugs/all', 0.8], ['/drugs/peds-medications', 0.7], ['/drugs/prescriptions', 0.7],
  ['/courses', 0.8], ['/diseases', 0.8], ['/tools', 0.7], ['/store', 0.7], ['/quizzes', 0.7], ['/travel-questions', 0.7],
  ['/about', 0.5], ['/contact', 0.5], ['/faq', 0.5], ['/privacy', 0.3], ['/terms', 0.3],
];

// Educational hub pages that exist as routes (src/App.tsx) and have real content
const HUBS = [
  ['/ecg', 0.7], ['/interview-questions', 0.6], ['/tests/licensure', 0.6],
  ['/drugs/antidotes', 0.7], ['/drugs/classifications', 0.7], ['/drugs/suffixes', 0.6], ['/drugs/interactions', 0.6],
  ['/drugs/cardiac', 0.6], ['/drugs/er-medications', 0.7], ['/drugs/icu-medications', 0.7], ['/drugs/otc-guide', 0.7],
  ['/drugs/applied-pharm', 0.7], ['/drugs/safety-center', 0.6], ['/drugs/iv-compatibility', 0.6], ['/drugs/lasa', 0.6],
  ['/drugs/high-alert-ref', 0.6], ['/drugs/organ-dose', 0.6], ['/drugs/pregnancy-lactation', 0.6],
];
// /<section> hub + /<section>/<id> topic pages, one table each (a section is listed only when it has topics)
const TOPIC_SECTIONS = {
  'icu-nursing': 'icu_topics', dialysis: 'dialysis_topics', radiology: 'radiology_topics', nicu: 'nicu_topics',
  pharmacology: 'pharmacology_topics', terminology: 'terminology_topics', 'first-aid': 'first_aid_topics',
  'er-reception': 'er_reception_topics', pediatrics: 'pediatric_topics', anatomy: 'anatomy_topics',
  fundamentals: 'fundamentals_topics', 'operating-room': 'operating_room_topics', obgyn: 'obgyn_topics',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enc = encodeURIComponent;

async function rows(env, table, columns, filter = '') {
  if (env.DB) return (await internalRows(env, table, `select=${columns}${filter}&limit=5000`)) || [];
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${columns}${filter}&limit=5000`;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok ? r.json() : [];
}

export async function sitemapResponse({ request, env }) {
  const origin = new URL(request.url).origin;
  // The old *.pages.dev address is kept for the Android app, but the sitemap always lists the main domain.
  const site = env.SITE_URL || (origin === 'https://nursehub-egypt.pages.dev' ? 'https://nursehubegypt.com' : origin);
  const urls = STATIC.map(([p, pr]) => [p, pr]);
  try {
    const sectionKeys = Object.keys(TOPIC_SECTIONS);
    const [articles, drugs, courses, chapters, peds, rx, otc, icuMeds, erMeds, protocols, ...topicRows] = await Promise.all([
      rows(env, 'articles', 'slug,category,updated_date,publish_date', '&status=eq.published'),
      rows(env, 'drugs', 'slug'),
      rows(env, 'courses', 'id'),
      rows(env, 'course_chapters', 'id,course_id'),
      rows(env, 'peds_medications', 'id'),
      rows(env, 'rx_prescriptions', 'id'),
      rows(env, 'otc_conditions', 'id'),
      rows(env, 'icu_medications', 'id'),
      rows(env, 'er_medications', 'id'),
      rows(env, 'clinical_protocols', 'id'),
      ...sectionKeys.map((k) => rows(env, TOPIC_SECTIONS[k], 'id')),
    ]);
    HUBS.forEach(([p, pr]) => urls.push([p, pr]));
    sectionKeys.forEach((k, i) => {
      if (!topicRows[i].length) return;
      urls.push([`/${k}`, 0.8]);
      topicRows[i].forEach((t) => t.id && urls.push([`/${k}/${enc(t.id)}`, 0.6]));
    });
    otc.forEach((o) => o.id && urls.push([`/drugs/otc-guide/${enc(o.id)}`, 0.6]));
    icuMeds.forEach((m) => m.id && urls.push([`/drugs/icu-medications/${enc(m.id)}`, 0.6]));
    erMeds.forEach((m) => m.id && urls.push([`/drugs/er-medications/${enc(m.id)}`, 0.6]));
    protocols.forEach((p) => p.id && urls.push([`/drugs/protocols/${enc(p.id)}`, 0.6]));
    [...new Set(articles.map((a) => a.category).filter(Boolean))].sort().forEach((c) => urls.push([`/category/${enc(c)}`, 0.8]));
    articles.forEach((a) => a.slug && urls.push([`/article/${enc(a.slug)}`, 0.7, a.updated_date || a.publish_date]));
    drugs.forEach((d) => d.slug && urls.push([`/drug/${enc(d.slug)}`, 0.6]));
    courses.forEach((c) => urls.push([`/courses/${enc(c.id)}`, 0.7]));
    chapters.forEach((c) => urls.push([`/courses/${enc(c.course_id)}/chapter/${enc(c.id)}`, 0.6]));
    try {
      const r = await fetch(`${site}/diseases/index.json`);
      const j = r.ok ? await r.json() : { items: [] };
      (j.items || []).forEach((c) => urls.push([!c.target || c.target === 'diseases' ? `/diseases/${enc(c.id)}` : `/guide/${enc(c.id)}`, 0.7]));
      Object.keys(j.sections || {}).forEach((slug) => urls.push([`/section/${enc(slug)}`, 0.8]));
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
    /* fall back to the static list if the database is unreachable */
  }
  const seen = new Set();
  const body = urls
    .filter(([p]) => !seen.has(p) && seen.add(p))
    .map(([p, pr, mod]) => {
      const d = /^\d{4}-\d{2}-\d{2}/.exec(String(mod || ''));
      return `  <url><loc>${esc(site + p)}</loc>${d ? `<lastmod>${d[0]}</lastmod>` : ''}<priority>${pr.toFixed(1)}</priority></url>`;
    })
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
