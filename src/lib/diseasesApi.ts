// src/lib/diseasesApi.ts
// "الأمراض للتمريض" (Diseases for Nurses): static JSON shipped with the site
// (public/diseases/index.json + public/diseases/items/<id>.json), no database.

import { supabase } from './supabase';

export type Bi = { ar: string; en?: string };

export interface DiseaseIndexItem {
  id: string;
  num: number;
  system: string;
  icon: string;
  title: Bi;
  teaser: Bi;
  chips?: Bi[];
  /** 1 = common daily, 2 = important, 3 = critical / emergency */
  level?: 1 | 2 | 3;
  /** 'diseases' (default) | an existing site section | slug of a new section */
  target?: string;
}

export type SectionKey = 'overview' | 'causes' | 'signs' | 'tests' | 'treatment' | 'nursing' | 'redflags' | 'teaching';

export interface QuizItem {
  q: Bi;
  options: Bi[];
  answer: number;
  why?: Bi;
}

export interface Disease extends DiseaseIndexItem {
  sections: Partial<Record<SectionKey, Bi>>;
  keyPoints?: { ar: string[]; en?: string[] };
  quiz?: QuizItem[];
  refs?: { title: string; url?: string }[];
  /** optional per-guide section titles/icons (key → {t, i}) that replace the default disease headings */
  labels?: Partial<Record<SectionKey, { t: string; i: string }>>;
}

export const SYSTEMS: Record<string, { ar: string; en: string; icon: string; grad: string }> = {
  cardio: { ar: 'القلب والدورة الدموية', en: 'Cardiovascular', icon: '🫀', grad: 'from-rose-500 to-red-600' },
  chest: { ar: 'الصدر والتنفس', en: 'Respiratory', icon: '🫁', grad: 'from-sky-500 to-blue-600' },
  gi: { ar: 'الجهاز الهضمي والكبد', en: 'GI & Liver', icon: '🍽️', grad: 'from-amber-500 to-orange-600' },
  endo: { ar: 'السكر والغدد', en: 'Endocrine', icon: '🧬', grad: 'from-emerald-500 to-teal-600' },
  renal: { ar: 'الكلى والمسالك', en: 'Renal & Urinary', icon: '💧', grad: 'from-cyan-500 to-sky-600' },
  infect: { ar: 'العدوى والطفيليات', en: 'Infection & Parasites', icon: '🦠', grad: 'from-lime-500 to-green-600' },
  rheum: { ar: 'العظام والروماتيزم', en: 'Rheumatology & Bones', icon: '🦴', grad: 'from-indigo-500 to-blue-700' },
  skin: { ar: 'الجلدية', en: 'Dermatology', icon: '🧴', grad: 'from-pink-500 to-rose-500' },
  mental: { ar: 'الصحة النفسية', en: 'Mental Health', icon: '🧘', grad: 'from-teal-500 to-cyan-600' },
  peds: { ar: 'الأطفال والمواليد', en: 'Pediatrics & Newborn', icon: '🍼', grad: 'from-sky-400 to-cyan-500' },
  ent: { ar: 'الأنف والأذن والحنجرة', en: 'ENT', icon: '👂', grad: 'from-amber-500 to-orange-600' },
  eye: { ar: 'العيون', en: 'Ophthalmology', icon: '👁️', grad: 'from-sky-500 to-blue-600' },
  neuro: { ar: 'الأعصاب والطوارئ', en: 'Neuro & Emergencies', icon: '🧠', grad: 'from-violet-500 to-purple-600' },
  blood: { ar: 'الدم', en: 'Hematology', icon: '🩸', grad: 'from-red-600 to-rose-700' },
  other: { ar: 'متنوعة', en: 'Other', icon: '📋', grad: 'from-slate-500 to-slate-700' },
};

export const LEVELS: Record<number, { ar: string; en: string; cls: string }> = {
  1: { ar: 'شائع', en: 'Common', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  2: { ar: 'مهم', en: 'Important', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  3: { ar: 'طارئ / حرج', en: 'Critical', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};

export const SECTIONS: { key: SectionKey; ar: string; en: string; icon: string; ring: string }[] = [
  { key: 'overview', ar: 'إيه هو المرض؟', en: 'What is it?', icon: '📖', ring: 'border-sky-400' },
  { key: 'causes', ar: 'ليه بيحصل؟', en: 'Why it happens', icon: '🔍', ring: 'border-violet-400' },
  { key: 'signs', ar: 'إزاي تتعرف عليه', en: 'How to recognise', icon: '👁️', ring: 'border-amber-400' },
  { key: 'tests', ar: 'الفحوصات', en: 'Investigations', icon: '🧪', ring: 'border-teal-400' },
  { key: 'treatment', ar: 'العلاج', en: 'Treatment', icon: '💊', ring: 'border-indigo-400' },
  { key: 'nursing', ar: 'دورك كممرض', en: 'Your nursing role', icon: '🩺', ring: 'border-emerald-500' },
  { key: 'redflags', ar: 'علامات الخطر', en: 'Red flags', icon: '🚨', ring: 'border-rose-500' },
  { key: 'teaching', ar: 'تثقيف المريض', en: 'Patient teaching', icon: '🗣️', ring: 'border-pink-400' },
];

/** Section headings per hub. The guide engine was built for diseases ("What is the disease?"), so non-disease hubs get their own wording.
 *  A guide can still override any heading with its own `labels`. Pair = [Arabic, English]. */
const L = (a: string, e: string): [string, string] => [a, e];
type Lbl = Partial<Record<SectionKey, [string, string, string?]>>;
// [Arabic, English, icon?] — one full template per hub (all 8 slots), so no hub reads like the disease template.
const TARGET_LABELS: Record<string, Lbl> = {
  anatomy: { overview: L('نظرة عامة', 'Overview'), causes: L('التركيب والوظيفة', 'Structure & function'), signs: L('أهم النقاط والعلامات', 'Key points'), tests: L('الفحص والتقييم', 'Assessment'), treatment: L('التطبيق العملي', 'In practice'), nursing: L('الأهمية التمريضية', 'Nursing relevance'), redflags: L('تنبيهات مهمة', 'Important alerts'), teaching: L('معلومة للمريض', 'Patient information') },
  fundamentals: { overview: L('ما هو؟', 'What is it?'), causes: L('الأسس والمبادئ', 'Principles'), signs: L('الخطوات والعلامات', 'Steps & signs'), tests: L('التقييم والفحص', 'Assessment'), treatment: L('الإجراء والتطبيق', 'Procedure'), nursing: L('نقاط تمريضية', 'Nursing points'), redflags: L('تنبيهات ومضاعفات', 'Alerts & complications'), teaching: L('التوثيق والتثقيف', 'Documentation & teaching') },
  pharmacology: { overview: L('ما هو الدواء أو المجموعة؟', 'What is it?'), causes: L('آلية العمل والاستعمال', 'Mechanism & use'), signs: L('الأعراض الجانبية والتحذيرات', 'Side effects & warnings'), tests: L('المراقبة والتحاليل', 'Monitoring'), treatment: L('الجرعات وطريقة الإعطاء', 'Dosing & administration'), nursing: L('الأولويات التمريضية', 'Nursing priorities'), redflags: L('بلّغ فورًا', 'Report immediately'), teaching: L('تعليمات للمريض', 'Patient instructions') },
  prescriptions: { overview: L('ما هو الدواء؟', 'What is it?'), causes: L('طريقة العمل والاستعمال', 'How it works & use'), signs: L('الآثار الجانبية', 'Side effects'), tests: L('المتابعة', 'Follow-up'), treatment: L('الجرعة وطريقة الاستعمال', 'Dose & use'), nursing: L('دور التمريض', 'Nursing role'), redflags: L('متى تبلّغ الطبيب؟', 'When to call the doctor'), teaching: L('نصائح للمريض', 'Patient tips') },
  'lab-reference': { overview: L('ما هو التحليل؟', 'What is it?'), causes: L('لماذا يُطلب؟', 'Why it is ordered'), signs: L('القيم والدلالات', 'Values & meaning'), tests: L('التحضير والعيّنة', 'Preparation & sample'), treatment: L('التصرف عند الخلل', 'What to do'), nursing: L('دورك في التحليل', 'Your role'), redflags: L('قيم حرجة', 'Critical values'), teaching: L('تعليمات للمريض', 'Patient instructions') },
  'icu-nursing': { overview: L('نظرة عامة', 'Overview'), causes: L('الفسيولوجيا والأسباب', 'Physiology & causes'), signs: L('العلامات والقراءة', 'Signs & reading'), tests: L('المتابعة والمراقبة', 'Monitoring'), treatment: L('التدخل', 'Intervention'), nursing: L('أولويات التمريض', 'Nursing priorities'), redflags: L('إنذار عاجل', 'Urgent alert'), teaching: L('الأسرة والتواصل', 'Family & communication') },
  'er-reception': { overview: L('الحالة باختصار', 'The case in brief'), causes: L('الأسباب', 'Causes'), signs: L('التقييم الأوّلي', 'Initial assessment'), tests: L('الفحوصات العاجلة', 'Urgent tests'), treatment: L('التصرف الفوري', 'Immediate action'), nursing: L('دور التمريض في الطوارئ', 'ER nursing role'), redflags: L('علامات الخطر', 'Danger signs'), teaching: L('تعليمات عند الخروج', 'Discharge advice') },
  'first-aid': { overview: L('ما هي الحالة؟', 'What is it?'), causes: L('كيف تحدث؟', 'How it happens'), signs: L('كيف تعرفها؟', 'How to recognise'), tests: L('تقييم المصاب', 'Assess the casualty'), treatment: L('خطوات الإسعاف', 'First-aid steps'), nursing: L('دورك', 'Your role'), redflags: L('اطلب الإسعاف فورًا', 'Call for help now'), teaching: L('الوقاية', 'Prevention') },
  obgyn: { overview: L('نظرة عامة', 'Overview'), causes: L('الفسيولوجيا والأسباب', 'Physiology & causes'), signs: L('العلامات والأعراض', 'Signs & symptoms'), tests: L('الفحوصات والمتابعة', 'Tests & follow-up'), treatment: L('الرعاية والتدبير', 'Care & management'), nursing: L('رعاية الأم والجنين', 'Maternal & fetal care'), redflags: L('علامات الخطر', 'Danger signs'), teaching: L('إرشاد الأم', 'Mother education') },
  pediatrics: { overview: L('نظرة عامة', 'Overview'), causes: L('الأسباب والنمو', 'Causes & development'), signs: L('العلامات عند الطفل', 'Signs in the child'), tests: L('التقييم والفحوصات', 'Assessment & tests'), treatment: L('الرعاية والتدبير', 'Care & management'), nursing: L('رعاية الطفل', 'Child care'), redflags: L('علامات خطر عند الطفل', 'Danger signs in a child'), teaching: L('إرشاد الأهل', 'Parent education') },
  'operating-room': { overview: L('نظرة عامة', 'Overview'), causes: L('لماذا تُجرى؟', 'Why it is done'), signs: L('التحضير والتجهيز', 'Preparation & set-up'), tests: L('الفحوصات قبل الجراحة', 'Pre-op checks'), treatment: L('خطوات الإجراء', 'Procedure steps'), nursing: L('دور الممرض في العمليات', 'Scrub/circulating role'), redflags: L('مضاعفات وتنبيهات', 'Complications & alerts'), teaching: L('تعليمات ما بعد العملية', 'Post-op instructions') },
  'surgical-dressings': { overview: L('ما هو؟', 'What is it?'), causes: L('متى يُستخدم؟', 'When it is used'), signs: L('الأنواع والعلامات', 'Types & signs'), tests: L('تقييم الجرح', 'Wound assessment'), treatment: L('خطوات الغيار', 'Dressing steps'), nursing: L('نقاط تمريضية', 'Nursing points'), redflags: L('علامات العدوى', 'Signs of infection'), teaching: L('العناية بالجرح', 'Wound care at home') },
  poisoning: { overview: L('ما هي المادة؟', 'The substance'), causes: L('طرق التسمم', 'How poisoning occurs'), signs: L('الأعراض', 'Symptoms'), tests: L('التقييم والتحاليل', 'Assessment & tests'), treatment: L('الإسعاف والترياق', 'Antidote & treatment'), nursing: L('دور التمريض', 'Nursing role'), redflags: L('حالات خطرة', 'Danger signs'), teaching: L('الوقاية', 'Prevention') },
};

/** The section list for one guide: default (disease) headings, hub-specific wording, then the guide's own `labels`. */
export function sectionsFor(target: string | undefined, d?: Disease): typeof SECTIONS {
  const tl = TARGET_LABELS[target || 'diseases'];
  return SECTIONS.map((sec) => {
    const t = tl?.[sec.key];
    const own = d?.labels?.[sec.key];
    return { ...sec, ar: own?.t ?? t?.[0] ?? sec.ar, en: own?.t ?? t?.[1] ?? sec.en, icon: own?.i ?? t?.[2] ?? sec.icon };
  });
}

export const pick = (v: Bi | undefined, ar: boolean): string => (v ? (ar ? v.ar : v.en || v.ar) : '');

/** Existing site sections that also show routed guides (path = the section hub). */
export const HOST_SECTIONS: Record<string, { ar: string; en: string; icon: string; path: string; grad: string }> = {
  'er-reception': { ar: 'الاستقبال والطوارئ', en: 'Reception & Emergency', icon: '🚨', path: '/er-reception', grad: 'from-red-600 to-rose-600' },
  obgyn: { ar: 'النساء والتوليد', en: 'Obstetrics & Gynecology', icon: '🤰', path: '/obgyn', grad: 'from-pink-500 to-rose-600' },
  pediatrics: { ar: 'قسم الأطفال', en: 'Pediatrics', icon: '🍼', path: '/pediatrics', grad: 'from-sky-500 to-cyan-600' },
  nicu: { ar: 'الحضانة', en: 'NICU', icon: '👶', path: '/nicu', grad: 'from-indigo-500 to-sky-600' },
  'operating-room': { ar: 'قسم العمليات', en: 'Operating Room', icon: '🔪', path: '/operating-room', grad: 'from-emerald-600 to-teal-700' },
  pharmacology: { ar: 'الفارماكولوجي', en: 'Pharmacology', icon: '🧪', path: '/pharmacology', grad: 'from-emerald-500 to-teal-600' },
  fundamentals: { ar: 'أسس التمريض', en: 'Fundamentals of Nursing', icon: '🛏️', path: '/fundamentals', grad: 'from-blue-500 to-indigo-600' },
  'first-aid': { ar: 'الإسعافات الأولية', en: 'First Aid', icon: '🩹', path: '/first-aid', grad: 'from-rose-500 to-orange-500' },
  'icu-nursing': { ar: 'العناية المركزة', en: 'ICU Nursing', icon: '🏥', path: '/icu-nursing', grad: 'from-slate-600 to-slate-800' },
  dialysis: { ar: 'الغسيل الكلوي', en: 'Dialysis', icon: '💧', path: '/dialysis', grad: 'from-cyan-500 to-sky-600' },
  radiology: { ar: 'الأشعة', en: 'Radiology', icon: '🩻', path: '/radiology', grad: 'from-zinc-600 to-slate-800' },
  anatomy: { ar: 'التشريح', en: 'Anatomy', icon: '🦴', path: '/anatomy', grad: 'from-stone-500 to-amber-700' },
  terminology: { ar: 'المصطلحات الطبية', en: 'Terminology', icon: '🔤', path: '/terminology', grad: 'from-violet-500 to-purple-600' },
  prescriptions: { ar: 'الروشتات', en: 'Prescriptions', icon: '📝', path: '/drugs/prescriptions', grad: 'from-teal-500 to-emerald-600' },
};

export interface NewSection { ar: string }
let sectionsCache: Record<string, NewSection> = {};
export const newSections = () => sectionsCache;

/** Visual identity for the sections created from the handbook (slug → icon/gradient/English name). */
export const NEW_SECTION_STYLE: Record<string, { icon: string; en: string; grad: string }> = {
  ent: { icon: '👂', en: 'ENT', grad: 'from-amber-500 to-orange-600' },
  'surgical-dressings': { icon: '🩹', en: 'Surgical Dressings', grad: 'from-emerald-500 to-teal-600' },
  'lab-reference': { icon: '🧫', en: 'Lab Tests & Meaning', grad: 'from-violet-500 to-purple-600' },
  ophthalmology: { icon: '👁️', en: 'Ophthalmology', grad: 'from-sky-500 to-blue-600' },
  poisoning: { icon: '☠️', en: 'Poisoning & Toxicology', grad: 'from-fuchsia-600 to-rose-600' },
};

let indexCache: Promise<DiseaseIndexItem[]> | null = null;
const itemCache = new Map<string, Promise<Disease | null>>();

export function fetchDiseaseIndex(): Promise<DiseaseIndexItem[]> {
  if (!indexCache) {
    indexCache = fetch('/diseases/index.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        sectionsCache = (j.sections ?? {}) as Record<string, NewSection>;
        return ((j.items ?? []) as DiseaseIndexItem[]).map((i) => ({ ...i, target: i.target || 'diseases' })).sort((a, b) => a.num - b.num);
      })
      .catch(() => {
        indexCache = null;
        return [];
      });
  }
  return indexCache;
}

export function fetchDisease(id: string): Promise<Disease | null> {
  if (!/^dis-\d{3,4}$/.test(id)) return Promise.resolve(null);
  let p = itemCache.get(id);
  if (!p) {
    p = fetch(`/diseases/items/${id}.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<Disease>) : null))
      .catch(() => null);
    itemCache.set(id, p);
  }
  return p;
}

const READ_KEY = 'nh_dis_read';
export function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return [];
}
export function saveRead(ids: string[]): void {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

// ---- image slots ----
// Disease HTML holds tokens like [[slot:dis-001-a|وصف الصورة|/diseases/img/x.svg]]
// (the 3rd part is an optional built-in drawing). The admin can upload/replace/remove the image
// from the public page; overrides live in the `disease_images` table ('' url = hidden).
export const SLOT_RE = /\[\[slot:([\w-]+)\|([^|\]]*)(?:\|([^\]]*))?\]\]/g;

let imgCache: Promise<Record<string, string>> | null = null;
export function fetchImageOverrides(force = false): Promise<Record<string, string>> {
  if (force) imgCache = null;
  if (!imgCache) {
    imgCache = (async () => {
      try {
        if (!supabase) return {};
        const { data } = await supabase.from('disease_images').select('slot,url');
        const m: Record<string, string> = {};
        (data ?? []).forEach((r: { slot: string; url: string }) => (m[r.slot] = r.url));
        return m;
      } catch {
        return {};
      }
    })();
  }
  return imgCache;
}

export async function saveImageOverride(slot: string, url: string | null): Promise<void> {
  if (!supabase) throw new Error('no supabase');
  if (url === null) {
    const { error } = await supabase.from('disease_images').delete().eq('slot', slot);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('disease_images').upsert({ slot, url, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
  imgCache = null;
}

/** Guides routed to a given section (existing hub or new slug). */
export async function fetchGuidesFor(target: string): Promise<DiseaseIndexItem[]> {
  return (await fetchDiseaseIndex()).filter((i) => i.target === target);
}

/** Routed guides in the shape of a section topic card (merged into the section's own topic grid). */
export async function routedAsTopics<T>(target: string): Promise<T[]> {
  const items = await fetchGuidesFor(target);
  return items.map((i, n) => ({
    id: i.id,
    order_num: 100000 + n,
    title_ar: i.title.ar,
    title_en: i.title.en ?? null,
    icon: i.icon ?? null,
    category: null,
    summary_ar: i.teaser.ar,
    summary_en: i.teaser.en ?? null,
    sections: Array.from({ length: 8 }, (_, k) => ({ id: 's' + k, heading_ar: '', body_ar: '' })),
    sources: null,
    href: '/guide/' + i.id,
  })) as unknown as T[];
}
