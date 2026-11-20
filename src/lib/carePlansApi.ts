// "خطط الرعاية التمريضية" (Nursing Care Plans): static JSON shipped with the site, no database.
//   public/careplans/index.json          — list (built by scripts/build-careplans-index.mjs)
//   public/careplans/plans/<id>.json     — one plan with two views:
//     student : Assessment (Subjective / Objective) → Nursing Diagnosis → Goals → Nursing Interventions (each with its Rationale) → Evaluation
//     hospital: Date/Time · Nursing Diagnosis · Patient Needs · Actions · Expected Outcomes · Timeframe · Signature
import { LOAD_FAILED } from "./loadFailed";

export type Bi = { ar: string; en: string };
export type BiList = { ar: string[]; en: string[] };

export interface StudentDiagnosis {
  diagnosis: Bi;
  assessment: { subjective: BiList; objective: BiList };
  goals: BiList;
  interventions: { action: Bi; rationale: Bi }[];
  evaluation: BiList;
}
export interface HospitalRow { diagnosis: Bi; need: Bi; actions: BiList; outcome: Bi; timeframe: Bi }
export interface CarePlanIndexItem { id: string; icon: string; system: string; title: Bi; summary: Bi; diagnoses: number; rows: number }
export interface CarePlan extends Omit<CarePlanIndexItem, "diagnoses" | "rows"> {
  student: StudentDiagnosis[];
  hospital: HospitalRow[];
  refs?: { title: string; url?: string }[];
}

export const SYSTEMS: Record<string, { ar: string; en: string }> = {
  cardiology: { ar: "القلب", en: "Cardiology" },
  respiratory: { ar: "الصدر", en: "Respiratory" },
  endocrine: { ar: "الغدد والسكر", en: "Endocrine" },
  neurology: { ar: "المخ والأعصاب", en: "Neurology" },
  renal: { ar: "الكلى", en: "Renal" },
  gastro: { ar: "الجهاز الهضمي والكبد", en: "GI & Liver" },
  surgery: { ar: "الجراحة", en: "Surgery" },
  obstetrics: { ar: "النساء والتوليد", en: "Obstetrics" },
  pediatrics: { ar: "الأطفال", en: "Pediatrics" },
};

export const pick = (v: Bi | undefined, ar: boolean) => (v ? (ar ? v.ar : v.en || v.ar) : "");
export const pickList = (v: BiList | undefined, ar: boolean) => (v ? (ar ? v.ar : v.en?.length ? v.en : v.ar) : []);

let indexCache: Promise<CarePlanIndexItem[]> | null = null;
export function fetchCarePlanIndex(): Promise<CarePlanIndexItem[]> {
  if (!indexCache) {
    indexCache = fetch("/careplans/index.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => (j.plans ?? []) as CarePlanIndexItem[])
      .catch(() => {
        indexCache = null;
        return LOAD_FAILED;
      });
  }
  return indexCache;
}

const planCache = new Map<string, Promise<CarePlan | null>>();
/** null = not found; throws on network failure (so the page can say "could not load" instead of "not found"). */
export function fetchCarePlan(id: string): Promise<CarePlan | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return Promise.resolve(null);
  let p = planCache.get(id);
  if (!p) {
    p = fetch(`/careplans/plans/${id}.json`, { cache: "no-cache" }).then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // the SPA fallback answers unknown files with index.html: treat non-JSON as "not found"
      return (r.headers.get("content-type") || "").includes("json") ? (r.json() as Promise<CarePlan>) : null;
    });
    p.catch(() => planCache.delete(id));
    planCache.set(id, p);
  }
  return p;
}
