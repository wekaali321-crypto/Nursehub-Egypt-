// "خطط الرعاية التمريضية" (Nursing Care Plans): static JSON shipped with the site, no database.
//   public/careplans/index.json          — list (built by scripts/build-careplans-index.mjs)
//   public/careplans/plans/<id>.json     — one disease / topic with several nursing diagnoses; every diagnosis is its own form:
//     student : Assessment (S/O) → Nursing Diagnosis (definition, related to, evidenced by / risk factors)
//               → Goals (short / long) → Interventions (each with its rationale, grouped by type) → Evaluation (met / partial / not met)
//     hospital: Date/Time · Nursing Diagnosis · Patient Needs · Actions · Expected Outcomes · Timeframe · Signature
// Older files (format 1: student[] + hospital[]) are converted on load until they are rewritten.
import { LOAD_FAILED } from "./loadFailed";

export type Bi = { ar: string; en: string };
export type BiList = { ar: string[]; en: string[] };
export type InterventionType = "assess" | "independent" | "collab" | "teach";
export type EvalStatus = "met" | "partial" | "not";

export interface HospitalRow { need: Bi; actions: BiList; outcome: Bi; timeframe: Bi }
export interface Diagnosis {
  id: string;
  kind: "actual" | "risk" | "health-promotion";
  title: Bi;
  /** full sentence for older plans (title + related to + evidenced by in one line) */
  statement?: Bi;
  definition?: Bi;
  relatedTo?: BiList;
  evidencedBy?: BiList;
  riskFactors?: BiList;
  assessment: { subjective: BiList; objective: BiList };
  goals: { short: BiList; long: BiList };
  interventions: { type: InterventionType; action: Bi; rationale: Bi }[];
  evaluation: { status: EvalStatus; text: Bi }[];
  hospital: HospitalRow[];
}
export interface CarePlanIndexItem {
  id: string; icon: string; system: string; folder: "disease" | "general"; group?: string;
  title: Bi; summary: Bi; diagnoses: { id: string; title: Bi }[];
}
export interface CarePlan { id: string; icon: string; system: string; folder: "disease" | "general"; group?: string; title: Bi; summary: Bi; diagnoses: Diagnosis[]; refs?: { title: string; url?: string }[] }

export const SYSTEMS: Record<string, { ar: string; en: string }> = {
  cardiology: { ar: "القلب", en: "Cardiology" },
  respiratory: { ar: "الصدر", en: "Respiratory" },
  endocrine: { ar: "الغدد والسكر", en: "Endocrine" },
  neurology: { ar: "المخ والأعصاب", en: "Neurology" },
  renal: { ar: "الكلى", en: "Renal" },
  gastro: { ar: "الجهاز الهضمي والكبد", en: "GI & Liver" },
  hematology: { ar: "الدم", en: "Hematology" },
  surgery: { ar: "الجراحة", en: "Surgery" },
  orthopedics: { ar: "العظام", en: "Orthopedics" },
  obstetrics: { ar: "النساء والتوليد", en: "Obstetrics" },
  pediatrics: { ar: "الأطفال", en: "Pediatrics" },
  integumentary: { ar: "الجلد والحروق", en: "Skin & Burns" },
  infection: { ar: "العدوى", en: "Infection" },
  general: { ar: "عام", en: "General" },
};
/** Groups of the "general" folder. */
export const GROUPS: Record<string, { ar: string; en: string }> = {
  symptoms: { ar: "الأعراض الشائعة", en: "Common symptoms" },
  vitals: { ar: "العلامات الحيوية", en: "Vital signs" },
  devices: { ar: "الأجهزة والإجراءات", en: "Devices & procedures" },
  maternal: { ar: "الأم والوليد", en: "Mother & newborn" },
  icu: { ar: "مضاعفات الرعاية المركزة", en: "ICU complications" },
  other: { ar: "أخرى", en: "Other" },
};

export const pick = (v: Bi | undefined, ar: boolean) => (v ? (ar ? v.ar : v.en || v.ar) : "");
export const pickList = (v: BiList | undefined, ar: boolean) => (v ? (ar ? v.ar : v.en?.length ? v.en : v.ar) : []);

/* ---------- format 1 → format 2 (until every plan is rewritten) ---------- */
interface LegacyPlan {
  id: string; icon: string; system: string; title: Bi; summary: Bi; refs?: CarePlan["refs"];
  student: { diagnosis: Bi; assessment: { subjective: BiList; objective: BiList }; goals: BiList; interventions: { action: Bi; rationale: Bi }[]; evaluation: BiList }[];
  hospital: { diagnosis: Bi; need: Bi; actions: BiList; outcome: Bi; timeframe: Bi }[];
}
const head = (s: string, re: RegExp) => { const t = s.split(re)[0].replace(/\s*\([^)]*\)\s*$/, "").trim(); return t.length < s.length ? t : s; };
export function legacyTitle(d: Bi): Bi {
  return { ar: head(d.ar, /\s(?:مرتبط|مرتبطة)\s/), en: head(d.en, /\s(?:related to|r\/t)\s/i) };
}
export function normalizePlan(raw: CarePlan | LegacyPlan): CarePlan {
  if ("diagnoses" in raw && Array.isArray(raw.diagnoses)) return { ...raw, folder: raw.folder ?? "disease" };
  const l = raw as LegacyPlan;
  const diagnoses: Diagnosis[] = l.student.map((s, i) => ({
    id: `dx-${i + 1}`,
    kind: /^(خطر|Risk for)/.test(s.diagnosis.ar) || /^Risk for/.test(s.diagnosis.en) ? "risk" : "actual",
    title: legacyTitle(s.diagnosis),
    statement: s.diagnosis,
    assessment: s.assessment,
    goals: { short: s.goals, long: { ar: [], en: [] } },
    interventions: s.interventions.map((x) => ({ type: "independent" as const, ...x })),
    evaluation: s.evaluation.ar.map((t, j) => ({ status: (/جزئ/.test(t) ? "partial" : "met") as EvalStatus, text: { ar: t, en: s.evaluation.en[j] ?? t } })),
    hospital: [],
  }));
  // older hospital rows: one row per diagnosis, in order; extra rows go to the last diagnosis
  l.hospital.forEach((r, i) => diagnoses[Math.min(i, diagnoses.length - 1)]?.hospital.push({ need: r.need, actions: r.actions, outcome: r.outcome, timeframe: r.timeframe }));
  return { id: l.id, icon: l.icon, system: l.system, folder: "disease", title: l.title, summary: l.summary, refs: l.refs, diagnoses };
}

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
    p = fetch(`/careplans/plans/${id}.json`, { cache: "no-cache" }).then(async (r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // the SPA fallback answers unknown files with index.html: treat non-JSON as "not found"
      if (!(r.headers.get("content-type") || "").includes("json")) return null;
      return normalizePlan(await r.json());
    });
    p.catch(() => planCache.delete(id));
    planCache.set(id, p);
  }
  return p;
}
