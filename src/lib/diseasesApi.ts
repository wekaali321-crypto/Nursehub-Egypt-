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
  'surgery-clinic': { icon: '🩺', en: 'Surgery Clinic', grad: 'from-emerald-500 to-teal-600' },
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
  if (!/^dis-\d{3}$/.test(id)) return Promise.resolve(null);
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
