// Server-side SEO injection (Cloudflare Pages Function).
// The site is a single-page app: without JavaScript a crawler only sees the splash screen.
// For content routes we take the static index.html and inject the real page text, title,
// description, canonical and structured data into it. The React app replaces #root on mount,
// so visitors see no difference; crawlers (Google, AdSense review) get the full content.
// Only routes listed in public/_routes.json reach this function.

const SITE_NAME = 'NurseHub Egypt';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// remove scripts/handlers and the image-slot tokens used by the guides
function clean(html) {
  return String(html ?? '')
    .replace(/\[\[slot:[^\]]*\]\]/g, '')
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

const SECTION_ORDER = ['overview', 'causes', 'signs', 'tests', 'treatment', 'nursing', 'redflags', 'teaching'];
const SECTION_TITLE = {
  overview: 'ما هو المرض؟', causes: 'الأسباب', signs: 'الأعراض والعلامات', tests: 'الفحوصات',
  treatment: 'العلاج', nursing: 'دور التمريض', redflags: 'علامات الخطر', teaching: 'تثقيف المريض',
};

const HOME_LINKS = [
  ['/diseases', 'الأمراض للتمريض', 'أكثر من 330 مرضاً: الأعراض والعلاج ودور الممرض خطوة بخطوة'],
  ['/cases', 'الحالات السريرية', 'حالات تفاعلية في الطب الباطني والطوارئ وأمراض القلب'],
  ['/drugs', 'الأدوية', 'دليل الأدوية والجرعات وأدوية الطوارئ والعناية المركزة'],
  ['/drugs/prescriptions', 'الروشتات', 'نماذج روشتات شائعة حسب الحالة'],
  ['/er-reception', 'الاستقبال والطوارئ', 'مرجع الفرز والجروح والحالات الطبية والجراحية الحادة'],
  ['/pediatrics', 'قسم الأطفال', 'تمريض الأطفال ورعاية المواليد'],
  ['/obgyn', 'النساء والتوليد', 'الحمل والولادة وأمراض النساء'],
  ['/operating-room', 'قسم العمليات', 'التعقيم والتخدير والرعاية قبل وبعد العملية'],
  ['/section/surgical-dressings', 'الغيارات الجراحية', 'غيار القدم السكري وقرح الفراش وتفريغ الخراج'],
  ['/section/lab-reference', 'التحاليل ودلالاتها', 'القيم الطبيعية وتحضير المريض وجمع العينات'],
  ['/section/poisoning', 'السموم', 'التعامل مع حالات التسمم الشائعة'],
  ['/first-aid', 'الإسعافات الأولية', 'الإنعاش والنزيف والحروق والإصابات'],
  ['/ecg', 'مكتبة ECG', 'تعلّم قراءة رسم القلب'],
  ['/icu-nursing', 'العناية المركزة', 'تمريض العناية المركزة'],
  ['/fundamentals', 'أسس التمريض', 'مهارات وإجراءات التمريض الأساسية'],
  ['/pharmacology', 'الفارماكولوجي', 'علم الأدوية للتمريض'],
  ['/courses', 'الكورسات', 'كورسات تعليمية منظمة'],
  ['/quizzes', 'الاختبارات', 'اختبارات وأسئلة مراجعة'],
];

async function getJSON(env, request, path) {
  try {
    const r = await env.ASSETS.fetch(new URL(path, request.url));
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function sb(env, table, query) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

function list(items) {
  return `<ul>${items.map(([href, title, d]) => `<li><a href="${esc(href)}">${esc(title)}</a>${d ? ' — ' + esc(d) : ''}</li>`).join('')}</ul>`;
}

// -> { title, description, body, type } or null (let the SPA render as usual)
async function pageFor(path, env, request) {
  const p = path.replace(/\/+$/, '') || '/';
  let m;
  if (p === '/') {
    return {
      title: `${SITE_NAME} | منصة تعليم التمريض`,
      description: 'منصة عربية متخصصة في تعليم التمريض: الأمراض والحالات السريرية والأدوية والمهارات والطوارئ والتحاليل، بشرح مبسّط موجّه للممرض.',
      body: `<h1>${SITE_NAME} — منصة تعليم التمريض</h1><p>منصة عربية لتعليم التمريض: شرح الأمراض بأسلوب مبسّط يوضّح للممرض ما هو المرض وكيف يتعرف عليه وكيف يتعامل معه، مع حالات سريرية تفاعلية وأدلة للأدوية والطوارئ والمهارات والتحاليل.</p>${list(HOME_LINKS)}`,
      type: 'WebSite',
    };
  }
  if (p === '/diseases' || (m = /^\/section\/([a-z0-9-]+)$/.exec(p))) {
    const idx = await getJSON(env, request, '/diseases/index.json');
    if (!idx) return null;
    const slug = m ? m[1] : 'diseases';
    const sec = slug === 'diseases' ? { ar: 'الأمراض للتمريض' } : idx.sections?.[slug];
    if (!sec) return null;
    const items = (idx.items || []).filter((i) => (i.target || 'diseases') === slug);
    return {
      title: `${sec.ar} | ${SITE_NAME}`,
      description: clip(`${sec.ar}: ${items.slice(0, 8).map((i) => i.title.ar).join('، ')} وغيرها — شرح تمريضي مبسّط.`, 300),
      body: `<h1>${esc(sec.ar)}</h1>${list(items.map((i) => [slug === 'diseases' ? `/diseases/${i.id}` : `/guide/${i.id}`, i.title.ar, i.teaser?.ar || '']))}`,
      type: 'CollectionPage',
    };
  }
  if ((m = /^\/(?:diseases|guide)\/(dis-\d{3,4})$/.exec(p))) {
    const d = await getJSON(env, request, `/diseases/items/${m[1]}.json`);
    if (!d) return null;
    const secs = SECTION_ORDER.filter((k) => d.sections?.[k]?.ar);
    const body =
      `<article><h1>${esc(d.title.ar)}</h1>${d.title.en ? `<p lang="en">${esc(d.title.en)}</p>` : ''}<p>${esc(d.teaser?.ar || '')}</p>` +
      secs.map((k) => `<section><h2>${esc(d.labels?.[k]?.t || SECTION_TITLE[k])}</h2>${clean(d.sections[k].ar)}</section>`).join('') +
      (d.keyPoints?.ar?.length ? `<section><h2>نقاط مهمة</h2><ul>${d.keyPoints.ar.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '') +
      '</article>';
    const desc = clip(strip(d.teaser?.ar || '') || strip(d.sections?.overview?.ar || ''), 300);
    return { title: `${d.title.ar} — شرح تمريضي | ${SITE_NAME}`, description: desc, body, type: 'MedicalWebPage' };
  }
  if (p === '/cases') {
    const idx = await getJSON(env, request, '/clinical-cases/index.json');
    if (!idx) return null;
    return {
      title: `الحالات السريرية | ${SITE_NAME}`,
      description: 'حالات سريرية تفاعلية من الطب الباطني والطوارئ وأمراض القلب: اقرأ القصة، افحص، حلّل ثم اكشف التشخيص.',
      body: `<h1>الحالات السريرية</h1>${list((idx.cases || []).map((c) => [`/cases/${c.id}`, c.title.ar, c.teaser?.ar || '']))}`,
      type: 'CollectionPage',
    };
  }
  if ((m = /^\/cases\/(case-\d{3})$/.exec(p))) {
    const c = await getJSON(env, request, `/clinical-cases/cases/${m[1]}.json`);
    if (!c) return null;
    const part = (t, h) => (h?.ar ? `<section><h2>${t}</h2>${clean(h.ar)}</section>` : '');
    const body = `<article><h1>${esc(c.title.ar)}</h1><p>${esc(c.teaser?.ar || '')}</p>${part('القصة', c.story)}${part('الفحص', c.exam)}${part('الفحوصات', c.investigations)}${part('التشخيص', c.diagnosis)}${part('الشرح', c.answer)}</article>`;
    return { title: `${c.title.ar} — حالة سريرية | ${SITE_NAME}`, description: clip(strip(c.teaser?.ar || c.story?.ar || ''), 300), body, type: 'Article' };
  }
  if ((m = /^\/article\/([^/]+)$/.exec(p))) {
    const slug = decodeURIComponent(m[1]).replace(/[^\w\u0600-\u06FF-]/g, '');
    const r = await sb(env, 'articles', `select=title,excerpt,content,meta_title,meta_description&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`);
    const a = r?.[0];
    if (!a) return null;
    return {
      title: `${a.meta_title || a.title} | ${SITE_NAME}`,
      description: clip(a.meta_description || strip(a.excerpt) || strip(a.content), 300),
      body: `<article><h1>${esc(a.title)}</h1>${clean(a.content)}</article>`,
      type: 'Article',
    };
  }
  if ((m = /^\/drug\/([^/]+)$/.exec(p))) {
    const slug = decodeURIComponent(m[1]).replace(/[^\w\u0600-\u06FF-]/g, '');
    const r = await sb(env, 'drugs', `select=name,generic_name,drug_class,dose,indications,side_effects,nursing_considerations,contraindications,storage&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const d = r?.[0];
    if (!d) return null;
    const row = (t, v) => (v ? `<section><h2>${t}</h2><p>${esc(strip(v))}</p></section>` : '');
    return {
      title: `${d.name}${d.generic_name ? ` (${d.generic_name})` : ''} — الجرعة والتمريض | ${SITE_NAME}`,
      description: clip(`${d.name}: ${strip(d.indications || d.drug_class || '')}`, 300),
      body: `<article><h1>${esc(d.name)}</h1>${d.generic_name ? `<p>${esc(d.generic_name)}${d.drug_class ? ' — ' + esc(d.drug_class) : ''}</p>` : ''}${row('الجرعة', d.dose)}${row('دواعي الاستعمال', d.indications)}${row('الأعراض الجانبية', d.side_effects)}${row('الاعتبارات التمريضية', d.nursing_considerations)}${row('موانع الاستعمال', d.contraindications)}${row('التخزين', d.storage)}</article>`,
      type: 'Article',
    };
  }
  return null;
}

function inject(html, page, url) {
  const canonical = `${url.origin.replace('https://nursehub-egypt.pages.dev', 'https://nursehubegypt.com')}${url.pathname.replace(/\/+$/, '') || '/'}`;
  const t = esc(page.title);
  const d = esc(page.description);
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${t}</title>`);
  for (const [re, val] of [
    [/(<meta\s+name="description"\s+content=")[^"]*(")/i, d],
    [/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, t],
    [/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, d],
    [/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, t],
    [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, d],
  ]) out = out.replace(re, (_m, a, c) => `${a}${val}${c}`);
  const ld = { '@context': 'https://schema.org', '@type': page.type, name: page.title, description: page.description, url: canonical, inLanguage: 'ar', publisher: { '@type': 'Organization', name: SITE_NAME } };
  const head = `<link rel="canonical" href="${esc(canonical)}" /><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  // The bundle is inlined into index.html and may itself contain "</head>" / "<body" inside strings, so anchor on the
  // last root tag and the closest </head> before it. String slicing also avoids "$&" expansion in the page text.
  const rootTag = '<div id="root">';
  const rootIdx = out.lastIndexOf(rootTag);
  const headEnd = rootIdx < 0 ? -1 : out.lastIndexOf('</head>', rootIdx);
  if (headEnd < 0 || rootIdx < 0) return html;
  const seo = `<div id="seo-static" dir="rtl" lang="ar" style="position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden">${page.body}</div>`;
  out = out.slice(0, headEnd) + head + out.slice(headEnd, rootIdx + rootTag.length) + seo + out.slice(rootIdx + rootTag.length);
  return out;
}

// Only crawlers / link-preview bots need the server-side SEO injection (the React app renders the same content for people).
// Skipping everyone else keeps CPU time per request tiny: the Workers free plan allows only ~10ms, and this function
// otherwise parses a large index.json and slices a ~3MB HTML file on every page view.
const BOT_RE = /bot|crawl|spider|slurp|mediapartners|adsbot|google-inspectiontool|googleother|facebookexternalhit|facebot|whatsapp|telegram|embedly|pinterest|applebot|duckduck|yandex|baidu|ahrefs|semrush|lighthouse|pagespeed|preview/i;

export async function onRequest({ request, env, next }) {
  try {
    const url = new URL(request.url);
    const accept = request.headers.get('accept') || '';
    if (request.method !== 'GET' || (!accept.includes('text/html') && !accept.includes('*/*'))) return next();
    if (!BOT_RE.test(request.headers.get('user-agent') || '')) return next();
    const page = await pageFor(url.pathname, env, request);
    if (!page) return next();
    const res = await env.ASSETS.fetch(new URL('/', request.url));
    if (!res.ok) return next();
    const html = await res.text();
    return new Response(inject(html, page, url), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-seo-injected': '1' },
    });
  } catch {
    return next();
  }
}
