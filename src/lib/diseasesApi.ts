// src/lib/diseasesApi.ts
// "الأمراض للتمريض" (Diseases for Nurses): static JSON shipped with the site
// (public/diseases/index.json + public/diseases/items/<id>.json), no database.

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

let indexCache: Promise<DiseaseIndexItem[]> | null = null;
const itemCache = new Map<string, Promise<Disease | null>>();

export function fetchDiseaseIndex(): Promise<DiseaseIndexItem[]> {
  if (!indexCache) {
    indexCache = fetch('/diseases/index.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => ((j.items ?? []) as DiseaseIndexItem[]).sort((a, b) => a.num - b.num))
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
