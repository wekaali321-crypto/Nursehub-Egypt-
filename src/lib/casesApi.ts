// src/lib/casesApi.ts
// "الحالات السريرية" (Clinical Cases): static JSON files shipped with the site
// (public/clinical-cases/index.json + public/clinical-cases/cases/<id>.json), no database.

export type Bi = { ar: string; en?: string };
export type BiList = { ar: string[]; en?: string[] };

export interface CaseIndexItem {
  id: string;
  num: number;
  specialty: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: Bi;
  teaser: Bi;
  chips?: Bi[];
  cover?: string;
  hasImages?: boolean;
}

export interface ClinicalCase extends CaseIndexItem {
  patient?: { age?: number; sex?: 'M' | 'F'; setting?: Bi };
  story: Bi;
  exam: Bi;
  investigations: Bi;
  questions: Bi[];
  diagnosis: Bi;
  answer: Bi;
  keyPoints?: BiList;
  pearls?: BiList;
  /** Guidelines / references consulted when verifying the clinical content. */
  refs?: { title: string; url?: string }[];
}

export const SPECIALTIES: Record<string, { ar: string; en: string; icon: string; grad: string }> = {
  cardiology: { ar: 'القلب', en: 'Cardiology', icon: '🫀', grad: 'from-rose-500 to-red-600' },
  respiratory: { ar: 'الصدر والتنفس', en: 'Respiratory', icon: '🫁', grad: 'from-sky-500 to-blue-600' },
  gastro: { ar: 'الجهاز الهضمي', en: 'Gastroenterology', icon: '🍽️', grad: 'from-amber-500 to-orange-600' },
  neurology: { ar: 'المخ والأعصاب', en: 'Neurology', icon: '🧠', grad: 'from-violet-500 to-purple-600' },
  endocrine: { ar: 'الغدد والتمثيل الغذائي', en: 'Endocrine & Metabolic', icon: '🧬', grad: 'from-emerald-500 to-teal-600' },
  renal: { ar: 'الكلى والأملاح', en: 'Renal & Electrolytes', icon: '💧', grad: 'from-cyan-500 to-sky-600' },
  infection: { ar: 'العدوى', en: 'Infection', icon: '🦠', grad: 'from-lime-500 to-green-600' },
  hematology: { ar: 'الدم والأورام', en: 'Hematology & Oncology', icon: '🩸', grad: 'from-red-600 to-rose-700' },
  toxicology: { ar: 'التسمم', en: 'Toxicology', icon: '☠️', grad: 'from-fuchsia-500 to-pink-600' },
  rheum: { ar: 'الروماتيزم والمناعة', en: 'Rheumatology & Immunology', icon: '🦴', grad: 'from-indigo-500 to-blue-700' },
  psychiatry: { ar: 'الطب النفسي', en: 'Psychiatry', icon: '🧘', grad: 'from-teal-500 to-cyan-600' },
  trauma: { ar: 'الإصابات والبيئة', en: 'Trauma & Environmental', icon: '🚑', grad: 'from-orange-500 to-red-600' },
  other: { ar: 'متنوعة', en: 'Other', icon: '📋', grad: 'from-slate-500 to-slate-700' },
};

export const DIFFICULTY: Record<string, { ar: string; en: string; dots: number; cls: string }> = {
  easy: { ar: 'سهلة', en: 'Easy', dots: 1, cls: 'text-emerald-500' },
  medium: { ar: 'متوسطة', en: 'Medium', dots: 2, cls: 'text-amber-500' },
  hard: { ar: 'صعبة', en: 'Hard', dots: 3, cls: 'text-rose-500' },
};

export const pick = (v: Bi | undefined, ar: boolean): string => (v ? (ar ? v.ar : v.en || v.ar) : '');
export const pickList = (v: BiList | undefined, ar: boolean): string[] => (v ? (ar ? v.ar : v.en && v.en.length ? v.en : v.ar) : []);

let indexCache: Promise<CaseIndexItem[]> | null = null;
const caseCache = new Map<string, Promise<ClinicalCase | null>>();

export function fetchCaseIndex(): Promise<CaseIndexItem[]> {
  if (!indexCache) {
    indexCache = fetch('/clinical-cases/index.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { cases: [] }))
      .then((j) => ((j.cases ?? []) as CaseIndexItem[]).sort((a, b) => a.num - b.num))
      .catch(() => {
        indexCache = null;
        return [];
      });
  }
  return indexCache;
}

export function fetchCase(id: string): Promise<ClinicalCase | null> {
  if (!/^case-\d{3}$/.test(id)) return Promise.resolve(null);
  let p = caseCache.get(id);
  if (!p) {
    p = fetch(`/clinical-cases/cases/${id}.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<ClinicalCase>) : null))
      .catch(() => null);
    caseCache.set(id, p);
  }
  return p;
}

// ---- reader progress (per browser) ----
const DONE_KEY = 'nh_cases_done';
const LAST_KEY = 'nh_cases_last';

export function loadDoneCases(): string[] {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveDoneCases(ids: string[]): void {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function rememberLastCase(id: string): void {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    /* ignore */
  }
}

export function lastCase(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
