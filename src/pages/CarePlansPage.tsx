/**
 * خطط الرعاية التمريضية — Nursing Care Plans (static JSON in public/careplans, no database).
 *  - /care-plans          : list of ready-made plans (search + body-system filter, shared HubGrid)
 *  - /care-plans/:id      : one plan, two tabs (?type=student | hospital)
 *      student : Assessment (S/O) → Nursing Diagnosis → Goals → Interventions (each with its Rationale) → Evaluation
 *      hospital: Date/Time · Nursing Diagnosis · Patient Needs · Actions · Expected Outcomes · Timeframe · Signature
 * Phones get stacked cards (a 5–7 column table is unreadable at 390 px); wide screens and print get the sheet table,
 * printed A4 landscape with the blank patient fields, like the paper forms.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ClipboardList, GraduationCap, Hospital, Printer, Search } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useSEO } from "../lib/seo";
import { Breadcrumbs } from "../components/common";
import InlineLangToggle from "../components/InlineLangToggle";
import HubGrid from "../components/HubGrid";
import { LogoMark } from "../components/Logo";
import { LOAD_FAILED } from "../lib/loadFailed";
import {
  SYSTEMS, fetchCarePlan, fetchCarePlanIndex, pick, pickList,
  type CarePlan, type CarePlanIndexItem, type HospitalRow, type StudentDiagnosis,
} from "../lib/carePlansApi";

type Kind = "student" | "hospital";

const T = {
  section: { ar: "خطط الرعاية التمريضية", en: "Nursing Care Plans" },
  sheet: { ar: "خطة الرعاية التمريضية", en: "Nursing Care Plan" },
  student: { ar: "خطة الطلاب", en: "Student plan" },
  hospital: { ar: "خطة المستشفى", en: "Hospital plan" },
  studentHint: { ar: "التقييم (ذاتي وموضوعي) ← التشخيص ← الأهداف ← التدخلات ومبرراتها ← التقييم النهائي", en: "Assessment (S/O) → Diagnosis → Goals → Interventions with rationale → Evaluation" },
  hospitalHint: { ar: "التشخيص ← احتياجات المريض ← الإجراءات ← النتائج المرجوة ← الإطار الزمني", en: "Diagnosis → Patient needs → Actions → Expected outcomes → Timeframe" },
  assessment: { ar: "التقييم (Assessment)", en: "Assessment (Data)" },
  subjective: { ar: "بيانات ذاتية (Subjective)", en: "Subjective data" },
  objective: { ar: "بيانات موضوعية (Objective)", en: "Objective data" },
  diagnosis: { ar: "التشخيص التمريضي", en: "Nursing Diagnosis" },
  goals: { ar: "الأهداف / النتائج المتوقعة", en: "Goals / Expected Outcomes" },
  interventions: { ar: "التدخلات التمريضية والمبررات", en: "Nursing Interventions & Rationale" },
  rationale: { ar: "المبرر", en: "Rationale" },
  evaluation: { ar: "التقييم النهائي (Evaluation)", en: "Evaluation (Results)" },
  problem: { ar: "مشكلة", en: "Problem" },
  dateTime: { ar: "الوقت / التاريخ", en: "Date / Time" },
  needs: { ar: "احتياجات المريض", en: "Patient Needs" },
  actions: { ar: "الإجراءات", en: "Actions" },
  outcomes: { ar: "النتائج المرجوة", en: "Expected Outcomes" },
  timeframe: { ar: "الإطار الزمني", en: "Timeframe" },
  signature: { ar: "التوقيع", en: "Signature" },
  notes: { ar: "ملاحظات الخطة", en: "Plan Notes" },
  date: { ar: "التاريخ", en: "Date" },
  print: { ar: "طباعة", en: "Print" },
  disclaimer: {
    ar: "خطة نموذجية للتعلم والاسترشاد: عدّلها حسب تقييمك للمريض وأوامر الطبيب وسياسة المستشفى.",
    en: "A model plan for learning and guidance: adapt it to your own patient assessment, the physician's orders and hospital policy.",
  },
  refs: { ar: "المراجع", en: "References" },
} as const;
const tr = (k: keyof typeof T, ar: boolean) => (ar ? T[k].ar : T[k].en);

/* ---------------- list ---------------- */
export function CarePlansHome() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [plans, setPlans] = useState<CarePlanIndexItem[] | null>(null);
  const [q, setQ] = useState("");
  const [sys, setSys] = useState("all");

  useSEO({
    title: ar ? "خطط الرعاية التمريضية جاهزة | NurseHub Egypt" : "Nursing Care Plans | NurseHub Egypt",
    description: ar
      ? "خطط رعاية تمريضية جاهزة بالعربي والإنجليزي لأشهر الأمراض: خطة الطلاب (Assessment، Diagnosis، Goals، Interventions & Rationale، Evaluation) وخطة المستشفى، قابلة للطباعة."
      : "Ready-made bilingual nursing care plans for common conditions: student format (assessment, diagnosis, goals, interventions & rationale, evaluation) and hospital format, printable.",
  });
  useEffect(() => { void fetchCarePlanIndex().then(setPlans); }, []);

  const systems = useMemo(() => [...new Set((plans ?? []).map((p) => p.system))], [plans]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (plans ?? []).filter((p) => (sys === "all" || p.system === sys) && (!s || `${p.title.ar} ${p.title.en} ${p.summary.ar} ${p.summary.en}`.toLowerCase().includes(s)));
  }, [plans, q, sys]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir={ar ? "rtl" : "ltr"}>
      <Breadcrumbs items={[{ label: tr("section", ar) }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="cs-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-white/80"><ClipboardList className="h-4 w-4" />{ar ? "جاهزة للمذاكرة والطباعة" : "Ready to study and print"}</div>
          <h1 className="mt-2 text-2xl font-black sm:text-4xl">{tr("section", ar)}</h1>
          {ar && <div dir="ltr" className="mt-1 text-right text-sm font-bold text-teal-200">Nursing Care Plans</div>}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            {ar ? "كل خطة فيها شكلين: خطة الطلاب بالتفصيل زي ما بتتطلب في الكلية، وخطة المستشفى المختصرة زي اللي بتتكتب في القسم." : "Every plan comes in two formats: the detailed student plan used in nursing school, and the short hospital plan used on the ward."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([["student", GraduationCap, "studentHint"], ["hospital", Hospital, "hospitalHint"]] as const).map(([k, Icon, hint]) => (
              <div key={k} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="flex items-center gap-2 font-black"><Icon className="h-5 w-5 text-teal-200" />{tr(k, ar)}</div>
                <p className="mt-1 text-xs leading-6 text-white/80">{tr(hint, ar)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 start-3" />
          <span className="sr-only">{ar ? "ابحث عن خطة" : "Search plans"}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "ابحث: سكر، ضغط، Pneumonia…" : "Search: diabetes, stroke…"} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm outline-none focus:border-teal-400 ps-9 pe-3 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...systems].map((s) => (
            <button key={s} onClick={() => setSys(s)} className={`rounded-full px-3 py-1 text-xs font-bold ${sys === s ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`}>
              {s === "all" ? (ar ? "الكل" : "All") : ar ? SYSTEMS[s]?.ar ?? s : SYSTEMS[s]?.en ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {plans === null ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : plans === LOAD_FAILED ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">{ar ? "تعذّر تحميل الخطط. تأكد من الإنترنت وحدّث الصفحة." : "Could not load the plans. Check your connection and refresh."}</p>
        ) : shown.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ar ? "لا توجد خطة بهذا الاسم." : "No plan matches your search."}</p>
        ) : (
          <HubGrid isEn={!ar} accent="teal" items={shown.map((p) => ({
            id: p.id, to: `/care-plans/${p.id}`, icon: p.icon, title: p.title.ar, titleEn: p.title.en,
            category: ar ? SYSTEMS[p.system]?.ar : SYSTEMS[p.system]?.en, summary: pick(p.summary, ar),
          }))} />
        )}
      </div>
    </div>
  );
}

/* ---------------- one plan ---------------- */
export function CarePlanPage() {
  const { id = "" } = useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get("type") === "hospital" ? "hospital" : "student";
  const [plan, setPlan] = useState<CarePlan | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlan(undefined); setFailed(false);
    fetchCarePlan(id).then(setPlan).catch(() => setFailed(true));
  }, [id]);

  const title = plan ? pick(plan.title, ar) : "";
  useSEO({
    title: plan ? (ar ? `خطة رعاية تمريضية: ${plan.title.ar} | NurseHub Egypt` : `Nursing Care Plan: ${plan.title.en} | NurseHub Egypt`) : "خطط الرعاية التمريضية | NurseHub Egypt",
    description: plan ? pick(plan.summary, ar) : "",
    type: "article",
  });

  // print the sheet A4 landscape (this page only)
  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = "@media print { @page { size: A4 landscape; margin: 8mm; } }";
    document.head.appendChild(st);
    return () => st.remove();
  }, []);

  if (failed || plan === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center" dir={ar ? "rtl" : "ltr"}>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{failed ? (ar ? "تعذّر تحميل الخطة. تأكد من الإنترنت." : "Could not load this plan. Check your connection.") : ar ? "الخطة غير موجودة." : "Plan not found."}</p>
        <Link to="/care-plans" className="mt-4 inline-block rounded-full bg-teal-700 px-6 py-2 font-bold text-white">{ar ? "كل الخطط" : "All plans"}</Link>
      </div>
    );
  }
  if (plan === undefined) return <div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" /></div>;

  const setKind = (k: Kind) => { const p = new URLSearchParams(params); if (k === "student") p.delete("type"); else p.set("type", k); setParams(p, { replace: true }); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 print:max-w-none print:p-0" dir={ar ? "rtl" : "ltr"}>
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: tr("section", ar), path: "/care-plans" }, { label: title }]} />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label={tr("section", ar)} className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            {(["student", "hospital"] as const).map((k) => {
              const Icon = k === "student" ? GraduationCap : Hospital;
              return (
                <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition ${kind === k ? "bg-[#153448] text-white shadow" : "text-slate-600 dark:text-slate-300"}`}>
                  <Icon className="h-4 w-4" />{tr(k, ar)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <InlineLangToggle />
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Printer className="h-4 w-4" />{tr("print", ar)}
            </button>
          </div>
        </div>
      </div>

      <article className="cp-sheet overflow-hidden rounded-3xl border border-[#168C91]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 print:rounded-none print:border-0 print:shadow-none" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <SheetHeader ar={ar} kind={kind} title={title} titleOther={ar ? plan.title.en : plan.title.ar} />
        <div className="space-y-4 p-3 sm:p-5">
          <PatientFields ar={ar} kind={kind} />
          {kind === "student" ? <StudentPlan ar={ar} dx={plan.student} /> : <HospitalPlan ar={ar} rows={plan.hospital} />}
          {kind === "student" && (
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr] print:grid-cols-[2fr_1fr]">
              <div className="min-h-[72px] rounded-2xl border border-[#168C91]/40 p-3"><div className="text-sm font-black text-[#153448] dark:text-teal-200">{tr("notes", ar)}:</div></div>
              <div className="min-h-[72px] rounded-2xl border border-[#168C91]/40 p-3 text-sm font-black text-[#153448] dark:text-teal-200">
                <div>{tr("signature", ar)}:</div><div className="mt-5">{tr("date", ar)}: ____________</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 bg-[#153448] px-4 py-2 text-xs font-bold text-white sm:px-6">
          <span dir="ltr">NurseHub Egypt — Your Nursing Knowledge Hub</span>
          <span className="hidden sm:inline" dir="ltr">nursehubegypt.com</span>
        </div>
      </article>

      <div className="mt-4 space-y-3 print:hidden">
        <p className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{tr("disclaimer", ar)}</p>
        {!!plan.refs?.length && (
          <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <summary className="cursor-pointer font-bold text-slate-700 dark:text-slate-200">{tr("refs", ar)}</summary>
            <ul dir="ltr" className="mt-2 list-disc space-y-1 pl-5 text-left text-slate-600 dark:text-slate-400">{plan.refs.map((r) => <li key={r.title}>{r.title}</li>)}</ul>
          </details>
        )}
        <Link to="/care-plans" className="inline-block font-bold text-teal-700 dark:text-teal-300">{ar ? "← كل خطط الرعاية" : "← All care plans"}</Link>
      </div>
    </div>
  );
}

function SheetHeader({ ar, kind, title, titleOther }: { ar: boolean; kind: Kind; title: string; titleOther: string }) {
  return (
    <header className="flex flex-col gap-3 border-b border-[#168C91]/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5 print:flex-row print:items-center print:justify-between">
      <div className="flex items-center gap-3">
        <LogoMark size={44} className="shadow-none" />
        <div>
          <div dir="ltr" className="text-xl font-black text-[#153448] dark:text-white">NurseHub <span className="text-[#168C91]">Egypt</span></div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">كل ما يحتاجه الممرض في مكان واحد</div>
        </div>
      </div>
      <div className="rounded-2xl bg-[#153448] px-5 py-3 text-white sm:min-w-[340px]">
        <div className="text-lg font-black sm:text-xl">{ar ? T.sheet.ar : T.sheet.en} — {ar ? T[kind].ar : T[kind].en}</div>
        <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <span className="font-black text-[#7fdde1]">{title}</span>
          <span dir={ar ? "ltr" : "rtl"} className="text-xs font-bold text-white/75">{titleOther}</span>
        </div>
      </div>
    </header>
  );
}

/** Blank lines to fill by hand (printed sheet), like the paper forms. */
function PatientFields({ ar, kind }: { ar: boolean; kind: Kind }) {
  const f = (k: string) => (
    <div key={k} className="flex items-end gap-2 text-sm font-bold text-[#153448] dark:text-slate-200">
      <span className="shrink-0">{k}:</span><span className="mb-1 h-px flex-1 border-b border-dotted border-slate-400" />
    </div>
  );
  const fields = kind === "hospital"
    ? (ar ? ["التاريخ", "القسم", "اسم المريض رباعي", "الرقم القومي الموحد"] : ["Date", "Department", "Patient full name", "National ID"])
    : (ar ? ["اسم المريض", "السن", "النوع", "التشخيص الطبي", "تاريخ الدخول", "تاريخ الخطة", "اسم الممرض/ة"] : ["Patient name", "Age", "Gender", "Medical diagnosis", "Date of admission", "Date of care plan", "Nurse's name"]);
  return <div className="grid gap-x-6 gap-y-3 rounded-2xl border border-[#168C91]/40 p-3 sm:grid-cols-2 print:grid-cols-3 lg:grid-cols-3">{fields.map(f)}</div>;
}

const List = ({ items, className = "" }: { items: string[]; className?: string }) => (
  <ul className={`list-disc space-y-1 ps-4 ${className}`}>{items.map((x) => <li key={x}>{x}</li>)}</ul>
);
const thCls = "border border-[#168C91]/50 bg-[#153448] px-2 py-2 text-center text-[13px] font-black text-white print:text-[11px]";
const tdCls = "border border-[#168C91]/40 p-2 align-top text-[13px] leading-6 text-slate-800 dark:text-slate-200 print:text-[10.5px] print:leading-[1.45]";

function Interventions({ d, ar }: { d: StudentDiagnosis; ar: boolean }) {
  return (
    <ol className="space-y-2">
      {d.interventions.map((x, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#168C91] text-[11px] font-black text-white">{i + 1}</span>
          <div>
            <div className="font-bold">{pick(x.action, ar)}</div>
            <div className="mt-0.5 text-[#0f6b70] dark:text-teal-300"><span className="font-black">{tr("rationale", ar)}: </span>{pick(x.rationale, ar)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StudentPlan({ ar, dx }: { ar: boolean; dx: StudentDiagnosis[] }) {
  return (
    <>
      {/* phones / tablets: one card per problem, steps in the right order */}
      <div className="space-y-4 lg:hidden print:hidden">
        {dx.map((d, n) => {
          const steps: [string, React.ReactNode][] = [
            [tr("assessment", ar), (
              <div className="space-y-2">
                <div><div className="text-xs font-black text-slate-500">{tr("subjective", ar)}</div><List items={pickList(d.assessment.subjective, ar)} /></div>
                <div><div className="text-xs font-black text-slate-500">{tr("objective", ar)}</div><List items={pickList(d.assessment.objective, ar)} /></div>
              </div>
            )],
            [tr("diagnosis", ar), <p className="font-bold">{pick(d.diagnosis, ar)}</p>],
            [tr("goals", ar), <List items={pickList(d.goals, ar)} />],
            [tr("interventions", ar), <Interventions d={d} ar={ar} />],
            [tr("evaluation", ar), <List items={pickList(d.evaluation, ar)} />],
          ];
          return (
            <section key={n} className="overflow-hidden rounded-2xl border border-[#168C91]/40">
              <h2 className="bg-[#153448] px-3 py-2 text-sm font-black text-white">{tr("problem", ar)} {n + 1}</h2>
              <div className="divide-y divide-[#168C91]/20">
                {steps.map(([label, body], i) => (
                  <div key={label} className="p-3 text-sm leading-7 text-slate-800 dark:text-slate-200">
                    <div className="mb-1 flex items-center gap-2 text-[13px] font-black text-[#153448] dark:text-teal-200">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-[#168C91]/15 text-[11px] text-[#0f6b70] dark:text-teal-300">{i + 1}</span>{label}
                    </div>
                    {body}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {/* wide screens and print: the sheet table */}
      <div className="hidden lg:block print:block">
        <table className="w-full table-fixed border-collapse">
          <colgroup><col className="w-[20%]" /><col className="w-[15%]" /><col className="w-[15%]" /><col className="w-[34%]" /><col className="w-[16%]" /></colgroup>
          <thead><tr>{(["assessment", "diagnosis", "goals", "interventions", "evaluation"] as const).map((k) => <th key={k} className={thCls}>{tr(k, ar)}</th>)}</tr></thead>
          <tbody>
            {dx.map((d, n) => (
              <tr key={n} className="break-inside-avoid">
                <td className={tdCls}>
                  <div className="text-[11px] font-black text-slate-500">{tr("subjective", ar)}</div><List items={pickList(d.assessment.subjective, ar)} />
                  <div className="mt-2 text-[11px] font-black text-slate-500">{tr("objective", ar)}</div><List items={pickList(d.assessment.objective, ar)} />
                </td>
                <td className={`${tdCls} font-bold`}>{pick(d.diagnosis, ar)}</td>
                <td className={tdCls}><List items={pickList(d.goals, ar)} /></td>
                <td className={tdCls}><Interventions d={d} ar={ar} /></td>
                <td className={tdCls}><List items={pickList(d.evaluation, ar)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function HospitalPlan({ ar, rows }: { ar: boolean; rows: HospitalRow[] }) {
  const cols = ["dateTime", "diagnosis", "needs", "actions", "outcomes", "timeframe", "signature"] as const;
  return (
    <>
      <div className="space-y-3 lg:hidden print:hidden">
        {rows.map((r, n) => (
          <section key={n} className="overflow-hidden rounded-2xl border border-[#168C91]/40 text-sm leading-7 text-slate-800 dark:text-slate-200">
            <h2 className="bg-[#153448] px-3 py-2 font-black text-white">{pick(r.diagnosis, ar)}</h2>
            <dl className="divide-y divide-[#168C91]/20">
              <div className="p-3"><dt className="text-[13px] font-black text-[#153448] dark:text-teal-200">{tr("needs", ar)}</dt><dd>{pick(r.need, ar)}</dd></div>
              <div className="p-3"><dt className="text-[13px] font-black text-[#153448] dark:text-teal-200">{tr("actions", ar)}</dt><dd><List items={pickList(r.actions, ar)} /></dd></div>
              <div className="p-3"><dt className="text-[13px] font-black text-[#153448] dark:text-teal-200">{tr("outcomes", ar)}</dt><dd>{pick(r.outcome, ar)}</dd></div>
              <div className="flex items-center justify-between gap-2 p-3"><dt className="text-[13px] font-black text-[#153448] dark:text-teal-200">{tr("timeframe", ar)}</dt><dd className="rounded-full bg-[#168C91]/10 px-3 text-[13px] font-bold text-[#0f6b70] dark:text-teal-300">{pick(r.timeframe, ar)}</dd></div>
            </dl>
          </section>
        ))}
      </div>
      <div className="hidden lg:block print:block">
        <table className="w-full table-fixed border-collapse">
          <colgroup><col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[15%]" /><col className="w-[24%]" /><col className="w-[16%]" /><col className="w-[10%]" /><col className="w-[10%]" /></colgroup>
          <thead><tr>{cols.map((k) => <th key={k} className={thCls}>{tr(k, ar)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n} className="break-inside-avoid">
                <td className={tdCls} />
                <td className={`${tdCls} font-bold`}>{pick(r.diagnosis, ar)}</td>
                <td className={tdCls}>{pick(r.need, ar)}</td>
                <td className={tdCls}><List items={pickList(r.actions, ar)} /></td>
                <td className={tdCls}>{pick(r.outcome, ar)}</td>
                <td className={`${tdCls} text-center font-bold`}>{pick(r.timeframe, ar)}</td>
                <td className={tdCls} />
              </tr>
            ))}
            {[0, 1].map((i) => <tr key={`blank${i}`} className="h-12">{cols.map((k) => <td key={k} className={tdCls} />)}</tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
