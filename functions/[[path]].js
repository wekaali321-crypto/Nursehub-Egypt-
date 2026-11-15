import { internalRows, isD1QuotaError } from './_lib/sb.js';
import { ROUTE_PATTERNS } from './_lib/routes.js';
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
  if (env.DB) return internalRows(env, table, query);
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

// Department hubs and their topic pages (/<dept> and /<dept>/<id>): Arabic + English names and the words people search with.
const DEPTS = {
  'icu-nursing': ['icu_topics', 'تمريض العناية المركزة', 'ICU Nursing', 'شرح تمريض العناية المركزة للممرضين: أجهزة التنفس الصناعي، رسم القلب، الشاشات، الأدوية والإجراءات خطوة بخطوة.'],
  dialysis: ['dialysis_topics', 'تمريض الغسيل الكلوي', 'Dialysis Nursing', 'تمريض الغسيل الكلوي: الفيستيولا والقسطرة، ماكينة الغسيل، مضاعفات الجلسة، الوزن الجاف وحسابات Kt/V.'],
  radiology: ['radiology_topics', 'الأشعة للتمريض', 'Radiology for Nurses', 'قراءة أشعة الصدر والمقطعية للممرضين: الانصباب، الاسترواح، تضخم القلب، الهاونسفيلد والسلامة من الإشعاع.'],
  nicu: ['nicu_topics', 'تمريض الحضّانات', 'NICU Nursing', 'تمريض حديثي الولادة والحضّانات: الإنعاش، أبجار، الصفراء، التغذية، الحرارة والقسطرة السرية.'],
  pharmacology: ['pharmacology_topics', 'الفارماكولوجي للتمريض', 'Pharmacology for Nurses', 'علم الأدوية للممرضين: طرق الإعطاء، حساب الجرعات، المضادات الحيوية، أدوية الضغط والقلب ومدرات البول.'],
  terminology: ['terminology_topics', 'المصطلحات الطبية', 'Medical Terminology', 'المصطلحات الطبية والاختصارات للتمريض بالعربي والإنجليزي، مع بطاقات مذاكرة.'],
  'first-aid': ['first_aid_topics', 'الإسعافات الأولية', 'First Aid', 'الإسعافات الأولية: الإنعاش القلبي الرئوي، الاختناق، النزيف، الحروق، الكسور والصدمة.'],
  'er-reception': ['er_reception_topics', 'الاستقبال والطوارئ', 'Emergency Department Nursing', 'تمريض الاستقبال والطوارئ: الفرز، الجروح والخياطة، المحاليل، الطوارئ الباطنة والجراحية.'],
  pediatrics: ['pediatric_topics', 'تمريض الأطفال', 'Pediatric Nursing', 'تمريض الأطفال: النمو والتطور، العلامات الحيوية حسب السن، أمراض القلب والجهاز الهضمي، جرعات الأطفال.'],
  anatomy: ['anatomy_topics', 'التشريح للتمريض', 'Anatomy for Nurses', 'التشريح ووظائف الأعضاء للممرضين برسومات توضيحية: القلب، الرئة، الكلى، الجهاز العصبي ومواضع الحقن.'],
  fundamentals: ['fundamentals_topics', 'أساسيات التمريض', 'Fundamentals of Nursing', 'أساسيات التمريض: العملية التمريضية، العلامات الحيوية، الحقن والكانيولا، مكافحة العدوى ومهارات التمريض.'],
  'operating-room': ['operating_room_topics', 'تمريض العمليات', 'Operating Room Nursing', 'تمريض غرفة العمليات: التعقيم، الأدوات والإبر، أوضاع المريض، التخدير وقائمة السلامة الجراحية.'],
  obgyn: ['obgyn_topics', 'تمريض النساء والتوليد', 'Obstetric & Gynecologic Nursing', 'تمريض النساء والتوليد: متابعة الحمل، مراحل الولادة، مراقبة نبض الجنين، النزيف ورعاية ما بعد الولادة.'],
};
// Pages without their own data lookup: title + description + a short intro for crawlers.
const STATIC_PAGES = {
  '/shift': ['وضع الشيفت — أدوات الممرض السريعة', 'أدوات سريعة للشيفت تعمل بدون إنترنت: الأدوية، توافق المحاليل، الأدوية عالية الخطورة، الأدوية المتشابهة وحاسبات الجرعات.'],
  '/cards': ['بطاقات مذاكرة التمريض', 'بطاقات مذاكرة بالتكرار المتباعد: المصطلحات الطبية والاختصارات والأدوية والأسماء المتشابهة.'],
  '/tests/licensure': ['امتحانات التمريض — ترخيص وسفر', 'بنك أسئلة وامتحانات للتمريض: امتحانات الترخيص والسفر (البرومترك، الهيئة السعودية، DHA، MOH) مع محاكي امتحان.'],
  '/travel-questions': ['أسئلة امتحانات السفر للتمريض', 'أسئلة امتحانات سفر التمريض للخليج: البرومترك والهيئة السعودية وDHA وMOH مع الإجابات.'],
  '/interview-questions': ['أسئلة مقابلات التمريض', 'أسئلة مقابلات العمل للممرضين وإجاباتها النموذجية بالعربي والإنجليزي.'],
  '/tools': ['حاسبات وأدوات التمريض', 'حاسبات التمريض: الجرعات، معدل التنقيط، مؤشر كتلة الجسم، السوائل وأدوات سريرية أخرى.'],
  '/drugs': ['دليل الأدوية للتمريض', 'دليل أدوية للممرضين: الجرعات، دواعي الاستعمال، الأعراض الجانبية، الاعتبارات التمريضية، التداخلات والأدوية عالية الخطورة.'],
  '/drugs/high-alert-ref': ['الأدوية عالية الخطورة', 'قائمة الأدوية عالية الخطورة (High Alert Medications) واستراتيجيات السلامة للتمريض.'],
  '/drugs/lasa': ['الأدوية المتشابهة في الاسم والشكل (LASA)', 'أدوية متشابهة في الاسم أو الشكل وكيف يتجنب الممرض الخطأ في إعطائها.'],
  '/drugs/iv-compatibility': ['توافق المحاليل والأدوية الوريدية', 'جدول توافق الأدوية الوريدية مع المحاليل لتمريض العناية والطوارئ.'],
  '/drugs/er-medications': ['أدوية الطوارئ', 'أدوية الاستقبال والطوارئ: الجرعات وطريقة الإعطاء والتمريض.'],
  '/drugs/icu-medications': ['أدوية العناية المركزة', 'أدوية العناية المركزة والمحاليل المستمرة: الجرعات والتخفيف والمراقبة.'],
  '/drugs/peds-medications': ['أدوية الأطفال وجرعاتها', 'جرعات أدوية الأطفال بالوزن وملاحظات التمريض.'],
  '/drugs/pregnancy-lactation': ['الأدوية أثناء الحمل والرضاعة', 'سلامة الأدوية أثناء الحمل والرضاعة للتمريض.'],
  '/drugs/prescriptions': ['روشتات شائعة حسب الحالة', 'نماذج روشتات شائعة للحالات اليومية في الاستقبال والعيادات.'],
  '/ecg': ['تعلم رسم القلب ECG', 'مكتبة رسم القلب للممرضين: قراءة الـ ECG واضطرابات النظم خطوة بخطوة.'],
};
const textBlock = (t) => String(t ?? '').split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => `<p>${esc(l.replace(/\*\*/g, ''))}</p>`).join('');
const parseSections = (v) => { try { return Array.isArray(v) ? v : JSON.parse(v || '[]'); } catch { return []; } };

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
    const slug = dec(m[1]).replace(/[^\w\u0600-\u06FF-]/g, '');
    const r = await sb(env, 'articles', `select=title,excerpt,content,meta_title,meta_description,cover&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`);
    const a = r?.[0];
    if (!a) return null;
    return {
      title: `${a.meta_title || a.title} | ${SITE_NAME}`,
      description: clip(a.meta_description || strip(a.excerpt) || strip(a.content), 300),
      body: `<article><h1>${esc(a.title)}</h1>${clean(a.content)}</article>`,
      type: 'Article',
      image: a.cover || null,
    };
  }
  if ((m = /^\/drug\/([^/]+)$/.exec(p))) {
    const slug = dec(m[1]).replace(/[^\w\u0600-\u06FF-]/g, '');
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
  if ((m = /^\/([a-z-]+)$/.exec(p)) && DEPTS[m[1]]) {
    const [table, ar, en, desc] = DEPTS[m[1]];
    const rows = await sb(env, table, 'select=id,title_ar,title_en,summary_ar&order=order_num.asc');
    if (!rows) return null;
    return {
      title: `${ar} (${en}) — شرح مبسّط للممرضين | ${SITE_NAME}`,
      description: desc,
      body: `<h1>${esc(ar)} — ${esc(en)}</h1><p>${esc(desc)}</p>${list(rows.map((r) => [`/${m[1]}/${r.id}`, r.title_ar + (r.title_en ? ` (${r.title_en})` : ''), r.summary_ar || '']))}`,
      type: 'CollectionPage',
      crumbs: [['الرئيسية', '/'], [ar, `/${m[1]}`]],
    };
  }
  if ((m = /^\/([a-z-]+)\/([^/]+)$/.exec(p)) && DEPTS[m[1]]) {
    const id = dec(m[2]);
    if (!SAFE_ID.test(id)) return null;
    const [table, ar, en] = DEPTS[m[1]];
    const r = (await sb(env, table, `select=id,title_ar,title_en,summary_ar,summary_en,sections&id=eq.${encodeURIComponent(id)}&limit=1`))?.[0];
    if (!r) return null;
    const secs = parseSections(r.sections);
    const body = `<article><h1>${esc(r.title_ar)}</h1>${r.title_en ? `<p lang="en">${esc(r.title_en)}</p>` : ''}<p>${esc(r.summary_ar || '')}</p>` +
      secs.map((x) => `<section>${x.heading_ar ? `<h2>${esc(x.heading_ar)}</h2>` : ''}${textBlock(x.body_ar)}</section>`).join('') +
      `<p><a href="/${m[1]}">${esc(ar)}</a></p></article>`;
    return {
      title: `${r.title_ar}${r.title_en ? ` (${r.title_en})` : ''} | ${ar} | ${SITE_NAME}`,
      description: clip(strip(r.summary_ar || '') || strip(secs[0]?.body_ar || ''), 300),
      body, type: 'MedicalWebPage',
      crumbs: [['الرئيسية', '/'], [ar, `/${m[1]}`], [r.title_ar, `/${m[1]}/${r.id}`]],
    };
  }
  if (STATIC_PAGES[p]) {
    const [t, d] = STATIC_PAGES[p];
    return { title: `${t} | ${SITE_NAME}`, description: d, body: `<h1>${esc(t)}</h1><p>${esc(d)}</p>${list(HOME_LINKS)}`, type: 'WebPage' };
  }
  return null;
}

const LEGACY_STORAGE = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\//;
// absolute https URL usable by Facebook/WhatsApp/Twitter crawlers (old Supabase storage links now live on this domain)
function absImage(img, origin) {
  if (!img || typeof img !== 'string' || img.startsWith('data:')) return null;
  if (img.startsWith('/')) return origin + img;
  if (LEGACY_STORAGE.test(img)) return img.replace(LEGACY_STORAGE, origin + '/storage/v1/');
  return /^https:\/\//.test(img) ? img : null;
}

function inject(html, page, url) {
  const canonical = `${url.origin.replace('https://nursehub-egypt.pages.dev', 'https://nursehubegypt.com')}${url.pathname.replace(/\/+$/, '') || '/'}`;
  const t = esc(page.title);
  const d = esc(page.description);
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${t}</title>`);
  const siteOrigin = 'https://nursehubegypt.com';
  const img = absImage(page.image, siteOrigin);
  const pairs = [
    [/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, esc(canonical)],
    [/(<meta\s+name="description"\s+content=")[^"]*(")/i, d],
    [/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, t],
    [/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, d],
    [/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, t],
    [/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, d],
  ];
  if (img) {
    pairs.push([/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, esc(img)], [/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, esc(img)]);
  }
  if (page.type === 'Article' || page.type === 'MedicalWebPage') pairs.push([/(<meta\s+property="og:type"\s+content=")[^"]*(")/i, 'article']);
  for (const [re, val] of pairs) out = out.replace(re, (_m, a, c) => `${a}${val}${c}`);
  const ld = { '@context': 'https://schema.org', '@type': page.type, name: page.title, description: page.description, url: canonical, inLanguage: 'ar', publisher: { '@type': 'Organization', name: SITE_NAME } };
  if (img) ld.image = img;
  let head = `<link rel="canonical" href="${esc(canonical)}" /><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  if (page.crumbs) {
    const bc = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: page.crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: siteOrigin + path })) };
    head += `<script type="application/ld+json">${JSON.stringify(bc).replace(/</g, '\\u003c')}</script>`;
  }
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

// ---------------------------------------------------------------------------------------------------------------
// Real HTTP 404 for URLs that are not pages. The SPA answers every path with index.html (HTTP 200), so crawlers
// (Google) treated garbage URLs like /article/lib/utils/zlib/... as real pages ("soft 404"). Those strings come from
// path-like text inside the inlined JS bundle (jszip internals) that crawlers resolve as relative links.
// A URL is real when: it matches a route of src/App.tsx (functions/_lib/routes.js, generated at build time) AND, for
// the content routes below, the item exists. Real pages keep status 200; an internal lookup failure is a 500.
// ---------------------------------------------------------------------------------------------------------------
const ROUTE_RE = new RegExp(ROUTE_PATTERNS.map((r) => r.source).join('|'));
// /<section>/<id> topic pages backed by one table each (the page looks the topic up by its id)
const TOPIC_TABLES = {
  'icu-nursing': 'icu_topics', dialysis: 'dialysis_topics', radiology: 'radiology_topics', nicu: 'nicu_topics',
  pharmacology: 'pharmacology_topics', terminology: 'terminology_topics', 'first-aid': 'first_aid_topics',
  'er-reception': 'er_reception_topics', pediatrics: 'pediatric_topics', anatomy: 'anatomy_topics',
  fundamentals: 'fundamentals_topics', 'operating-room': 'operating_room_topics', obgyn: 'obgyn_topics',
};
const SAFE_ID = /^[A-Za-z0-9_\u0600-\u06FF-]{1,120}$/;
let sectionSlugs = null; // cached per isolate
const dec = (x) => { try { return decodeURIComponent(x); } catch { return '\0'; } };

async function assetExists(env, request, path) {
  const r = await env.ASSETS.fetch(new Request(new URL(path, request.url), { method: 'GET' }));
  const ct = r.headers.get('content-type') || '';
  return r.ok && !ct.includes('text/html'); // SPA fallback answers missing files with index.html
}

async function rowExists(env, table, query) {
  const rows = await sb(env, table, query);
  if (rows === null) throw new Error('lookup failed');
  return rows.length > 0;
}

/** 'ok' | 'missing' — throws on an internal failure */
async function classify(path, env, request) {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/' || p === '/sitemap.xml') return 'ok';
  if (!ROUTE_RE.test(p)) {
    // paths configured as redirects in the admin panel are served by the SPA (it performs the redirect)
    if (env.DB) {
      const r = await env.DB.prepare('SELECT 1 FROM redirects WHERE "from" = ? LIMIT 1').bind(p).first();
      if (r) return 'ok';
    }
    return 'missing';
  }
  let m;
  if ((m = /^\/(?:diseases|guide)\/([^/]+)$/.exec(p))) {
    const id = dec(m[1]);
    return SAFE_ID.test(id) && (await assetExists(env, request, `/diseases/items/${id}.json`)) ? 'ok' : 'missing';
  }
  if ((m = /^\/cases\/([^/]+)$/.exec(p))) {
    const id = dec(m[1]);
    return SAFE_ID.test(id) && (await assetExists(env, request, `/clinical-cases/cases/${id}.json`)) ? 'ok' : 'missing';
  }
  if ((m = /^\/section\/([^/]+)$/.exec(p))) {
    if (!sectionSlugs) {
      const idx = await getJSON(env, request, '/diseases/index.json');
      if (!idx) throw new Error('index missing');
      sectionSlugs = new Set(Object.keys(idx.sections || {}));
    }
    return sectionSlugs.has(dec(m[1])) ? 'ok' : 'missing';
  }
  if ((m = /^\/article\/([^/]+)$/.exec(p))) {
    const slug = dec(m[1]);
    if (!SAFE_ID.test(slug)) return 'missing';
    return (await rowExists(env, 'articles', `select=id&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`)) ? 'ok' : 'missing';
  }
  if ((m = /^\/drug\/([^/]+)$/.exec(p))) {
    const slug = dec(m[1]);
    if (!SAFE_ID.test(slug)) return 'missing';
    return (await rowExists(env, 'drugs', `select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`)) ? 'ok' : 'missing';
  }
  if ((m = /^\/([a-z-]+)\/([^/]+)$/.exec(p)) && TOPIC_TABLES[m[1]]) {
    const id = dec(m[2]);
    if (!SAFE_ID.test(id)) return 'missing';
    return (await rowExists(env, TOPIC_TABLES[m[1]], `select=id&id=eq.${encodeURIComponent(id)}&limit=1`)) ? 'ok' : 'missing';
  }
  return 'ok';
}

/** The SPA shell with a real status code (the React app then shows its own 404 / error page). */
async function shell(request, env, status) {
  const wantsHtml = (request.headers.get('accept') || '').includes('text/html') || (request.headers.get('accept') || '') === '';
  const headers = { 'cache-control': 'public, max-age=60', 'x-robots-tag': 'noindex' };
  if (!wantsHtml) return new Response(request.method === 'HEAD' ? null : 'Not found', { status, headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' } });
  const res = await env.ASSETS.fetch(new Request(new URL('/', request.url), { method: 'GET' }));
  return new Response(request.method === 'HEAD' ? null : res.body, { status, headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  // A real static file (png, jpg, json, xml, pdf...) that public/_routes.json does not exclude must still be served as is.
  // Without this, a newly added file such as /og-image.png was treated as an unknown page and answered with a 404.
  if ((request.method === 'GET' || request.method === 'HEAD') && /\.[A-Za-z0-9]{2,5}$/.test(url.pathname)) {
    const a = await env.ASSETS.fetch(request);
    if ((a.status >= 200 && a.status < 400) && !(a.headers.get('content-type') || '').includes('text/html')) return a;
    if (a.status >= 300 && a.status < 400) return a;
    return shell(request, env, 404); // unknown file (the SPA fallback would otherwise answer 200 with index.html)
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    let verdict;
    try {
      verdict = await classify(url.pathname, env, request);
    } catch (e) {
      // D1 daily quota exhausted: the existence check cannot run, so serve the SPA (200) and let its static fallback render the page,
      // instead of a 500 that leaves visitors on an error screen. Any other internal failure is still not a "page not found".
      const msg = String((e && e.message) || e);
      if (msg === 'lookup failed' || isD1QuotaError(msg)) verdict = 'ok';
      else return shell(request, env, 500);
    }
    if (verdict === 'missing') return shell(request, env, 404);
  }
  try {
    const accept = request.headers.get('accept') || '';
    if (request.method !== 'GET' || (!accept.includes('text/html') && !accept.includes('*/*'))) return next();
    if (!BOT_RE.test(request.headers.get('user-agent') || '')) return next();
    // Crawlers fetch the same pages again and again: keep the rendered page at the edge for 6 h (no D1 read on a hit).
    const ck = new Request(`${url.origin}/__seo${url.pathname}`); // same-zone key: the Cache API ignores foreign hosts
    try { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, hit); } catch { /* no cache */ }
    const page = await pageFor(url.pathname, env, request);
    if (!page) return next();
    const res = await env.ASSETS.fetch(new URL('/', request.url));
    if (!res.ok) return next();
    const html = await res.text();
    const out = new Response(inject(html, page, url), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-seo-injected': '1' },
    });
    try { await caches.default.put(ck, new Response(out.clone().body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=21600', 'x-seo-injected': '1' } })); } catch { /* best effort */ }
    return out;
  } catch {
    return next();
  }
}
