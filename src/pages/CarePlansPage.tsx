/**
 * خطط الرعاية التمريضية — Nursing Care Plans (static JSON in public/careplans, no database).
 *  - /care-plans                 : two folders — plans by disease, and general plans (symptoms, vital signs, ICU complications)
 *  - /care-plans/:id/:dx         : ONE nursing diagnosis = one form, two tabs (?type=student | hospital); /care-plans/:id shows the first
 *      student : Assessment (S/O) → Nursing Diagnosis (definition, related to, evidenced by / risk factors) → Goals (short / long)
 *                → Interventions with rationale (grouped by type) → Evaluation (met / partial / not met)
 *      hospital: Date/Time · Nursing Diagnosis · Patient Needs · Actions · Expected Outcomes · Timeframe · Signature
 * Every screen shows the same sheet as the paper forms; phones scroll it sideways. Printed A4 landscape, one diagnosis per print.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity, BedDouble, BookOpenCheck, BriefcaseMedical, CircleCheck, ClipboardCheck, ClipboardList, Clock, FolderHeart, FolderOpen, GraduationCap, HeartPulse, Hospital, Lightbulb,
  PenLine, Printer, Search, Settings, Stethoscope, Syringe, Target, TrendingUp, TriangleAlert, Trophy, UserRound,
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useSEO } from "../lib/seo";
import { Breadcrumbs } from "../components/common";
import InlineLangToggle from "../components/InlineLangToggle";
import HubGrid from "../components/HubGrid";
import { LogoMark } from "../components/Logo";
import { LOAD_FAILED } from "../lib/loadFailed";
import {
  GROUPS, GUIDES, SYSTEMS, fetchCarePlan, fetchCarePlanIndex, pick, pickList,
  type CarePlan, type CarePlanIndexItem, type Diagnosis, type EvalStatus, type InterventionType,
} from "../lib/carePlansApi";

type Kind = "student" | "hospital";

const T = {
  section: { ar: "خطط الرعاية التمريضية", en: "Nursing Care Plans" },
  sheet: { ar: "خطة الرعاية التمريضية", en: "Nursing Care Plan" },
  student: { ar: "خطة الطلاب", en: "Student plan" },
  hospital: { ar: "خطة المستشفى", en: "Hospital plan" },
  byDisease: { ar: "خطط حسب المرض", en: "Plans by disease" },
  general: { ar: "خطط عامة", en: "General plans" },
  byDiseaseHint: { ar: "كل مرض فيه عدة تشخيصات تمريضية، وكل تشخيص في نموذج مستقل.", en: "Each disease has several nursing diagnoses, each in its own form." },
  generalHint: { ar: "الأعراض الشائعة، والعلامات الحيوية، ومضاعفات الرعاية المركزة.", en: "Common symptoms, vital signs and ICU complications." },
  diagnoses: { ar: "التشخيصات التمريضية", en: "Nursing diagnoses" },
  assessment: { ar: "التقييم (Assessment)", en: "Assessment (Data)" },
  subjective: { ar: "بيانات ذاتية (Subjective)", en: "Subjective data" },
  objective: { ar: "بيانات موضوعية (Objective)", en: "Objective data" },
  diagnosis: { ar: "التشخيص التمريضي", en: "Nursing Diagnosis" },
  definition: { ar: "التعريف", en: "Definition" },
  relatedTo: { ar: "مرتبط بـ (Related to)", en: "Related to" },
  evidencedBy: { ar: "ويظهر في (As evidenced by)", en: "As evidenced by" },
  riskFactors: { ar: "عوامل الخطورة (Risk factors)", en: "Risk factors" },
  goals: { ar: "الأهداف / النتائج المتوقعة", en: "Goals / Expected Outcomes" },
  shortTerm: { ar: "قصيرة المدى", en: "Short-term" },
  longTerm: { ar: "طويلة المدى", en: "Long-term" },
  interventions: { ar: "التدخلات التمريضية والمبررات", en: "Nursing Interventions & Rationale" },
  rationale: { ar: "المبرر", en: "Rationale" },
  evaluation: { ar: "التقييم النهائي (Evaluation)", en: "Evaluation (Results)" },
  dateTime: { ar: "الوقت / التاريخ", en: "Date / Time" },
  needs: { ar: "احتياجات المريض", en: "Patient Needs" },
  actions: { ar: "الإجراءات", en: "Actions" },
  outcomes: { ar: "النتائج المرجوة", en: "Expected Outcomes" },
  timeframe: { ar: "الإطار الزمني", en: "Timeframe" },
  signature: { ar: "التوقيع", en: "Signature" },
  notes: { ar: "ملاحظات الخطة", en: "Plan Notes" },
  date: { ar: "التاريخ", en: "Date" },
  print: { ar: "طباعة النموذج", en: "Print this form" },
  disclaimer: {
    ar: "خطة نموذجية للتعلم والاسترشاد: عدّلها حسب تقييمك للمريض وأوامر الطبيب وسياسة المستشفى.",
    en: "A model plan for learning and guidance: adapt it to your own patient assessment, the physician's orders and hospital policy.",
  },
  refs: { ar: "المراجع", en: "References" },
} as const;
const tr = (k: keyof typeof T, ar: boolean) => (ar ? T[k].ar : T[k].en);

const TYPE_LABEL: Record<InterventionType, { ar: string; en: string }> = {
  assess: { ar: "تقييم ومتابعة", en: "Assessment & monitoring" },
  independent: { ar: "تدخلات تمريضية مستقلة", en: "Independent" },
  collab: { ar: "بالتعاون مع الفريق الطبي", en: "Collaborative" },
  teach: { ar: "تثقيف المريض والأسرة", en: "Patient & family teaching" },
};
const STATUS: Record<EvalStatus, { ar: string; en: string; cls: string; mark: string }> = {
  met: { ar: "تحقق", en: "Met", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", mark: "✓" },
  partial: { ar: "تحقق جزئيًا", en: "Partially met", cls: "bg-amber-50 text-amber-800 ring-amber-200", mark: "◐" },
  not: { ar: "لم يتحقق", en: "Not met", cls: "bg-rose-50 text-rose-800 ring-rose-200", mark: "✗" },
};

/* ---------------- list ---------------- */
export function CarePlansHome() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [params, setParams] = useSearchParams();
  const folder = params.get("folder") === "general" ? "general" : "disease";
  const [plans, setPlans] = useState<CarePlanIndexItem[] | null>(null);
  const [q, setQ] = useState("");
  const [sys, setSys] = useState("all");

  useSEO({
    title: ar ? "خطط الرعاية التمريضية جاهزة | NurseHub Egypt" : "Nursing Care Plans | NurseHub Egypt",
    description: ar
      ? "خطط رعاية تمريضية جاهزة بالعربي والإنجليزي: كل تشخيص تمريضي في نموذج مستقل (Assessment، Nursing Diagnosis، Goals، Interventions & Rationale، Evaluation) وخطة المستشفى، قابلة للطباعة."
      : "Ready-made bilingual nursing care plans: every nursing diagnosis in its own form (assessment, diagnosis, goals, interventions & rationale, evaluation) plus the hospital format, printable.",
  });
  useEffect(() => { void fetchCarePlanIndex().then(setPlans); }, []);
  useEffect(() => { setSys("all"); }, [folder]);

  const inFolder = useMemo(() => (plans ?? []).filter((p) => (p.folder || "disease") === folder), [plans, folder]);
  const facets = useMemo(() => [...new Set(inFolder.map((p) => (folder === "general" ? p.group || "other" : p.system)))], [inFolder, folder]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return inFolder.filter((p) => {
      const facet = folder === "general" ? p.group || "other" : p.system;
      if (sys !== "all" && facet !== sys) return false;
      if (!s) return true;
      return `${p.title.ar} ${p.title.en} ${p.summary.ar} ${p.summary.en} ${p.diagnoses.map((d) => `${d.title.ar} ${d.title.en}`).join(" ")}`.toLowerCase().includes(s);
    });
  }, [inFolder, q, sys, folder]);
  const facetLabel = (f: string) => (folder === "general" ? (ar ? GROUPS[f]?.ar : GROUPS[f]?.en) : ar ? SYSTEMS[f]?.ar : SYSTEMS[f]?.en) ?? f;
  const setFolder = (f: "disease" | "general") => { const p = new URLSearchParams(params); if (f === "disease") p.delete("folder"); else p.set("folder", f); setParams(p, { replace: true }); };
  const count = (f: "disease" | "general") => (plans ?? []).filter((p) => (p.folder || "disease") === f).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir={ar ? "rtl" : "ltr"}>
      <Breadcrumbs items={[{ label: tr("section", ar) }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="cs-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-white/80"><ClipboardList className="h-4 w-4" />{ar ? "كل تشخيص تمريضي في نموذج مستقل" : "One form per nursing diagnosis"}</div>
          <h1 className="mt-2 text-2xl font-black sm:text-4xl">{tr("section", ar)}</h1>
          {ar && <div dir="ltr" className="mt-1 text-right text-sm font-bold text-teal-200">Nursing Care Plans</div>}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            {ar ? "اختار المرض أو الموضوع، وبعدين اختار التشخيص التمريضي: هتلاقي نموذج الطلاب بالتفصيل (التعريف، Related to، As evidenced by، أهداف قصيرة وطويلة، تدخلات بمبرراتها، والتقييم) ونموذج المستشفى، وكل نموذج بيتطبع لوحده." : "Pick a disease or topic, then a nursing diagnosis: the detailed student form (definition, related to, evidenced by, short and long goals, interventions with rationale, evaluation) and the hospital form, each printable on its own."}
          </p>
        </div>
      </div>

      <section aria-labelledby="cp-start" className="mt-6">
        <h2 id="cp-start" className="mb-2 text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">{ar ? "ابدأ هنا" : "Start here"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {GUIDES.map((g) => (
            <Link key={g.slug} to={`/care-plans/guide/${g.slug}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#168C91] dark:border-slate-700 dark:bg-slate-900">
              <BookOpenCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#168C91]" />
              <span>
                <span className="block font-black text-slate-800 dark:text-white">{pick(g.title, ar)}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{pick(g.hint, ar)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="mb-2 mt-6 text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">{ar ? "تصفح حسب القسم" : "Browse by category"}</h2>
      <div role="tablist" className="grid gap-3 sm:grid-cols-2">
        {([["disease", FolderHeart, "byDisease", "byDiseaseHint"], ["general", FolderOpen, "general", "generalHint"]] as const).map(([f, Icon, label, hint]) => (
          <button key={f} role="tab" aria-selected={folder === f} onClick={() => setFolder(f)} className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition ${folder === f ? "border-[#168C91] bg-[#153448] text-white shadow" : "border-slate-200 bg-white text-slate-700 hover:border-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
            <Icon className={`mt-0.5 h-7 w-7 shrink-0 ${folder === f ? "text-[#7fdde1]" : "text-[#168C91]"}`} />
            <span>
              <span className="block font-black">{tr(label, ar)} <span className="text-xs font-bold opacity-70">({count(f)})</span></span>
              <span className={`mt-0.5 block text-xs leading-5 ${folder === f ? "text-white/75" : "text-slate-500 dark:text-slate-400"}`}>{tr(hint, ar)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 start-3" />
          <span className="sr-only">{ar ? "ابحث عن خطة أو تشخيص" : "Search plans or diagnoses"}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? "ابحث: سكر، ألم، Excess fluid volume…" : "Search: diabetes, pain, excess fluid volume…"} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm outline-none focus:border-teal-400 ps-9 pe-3 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </label>
        {facets.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {["all", ...facets].map((s) => (
              <button key={s} onClick={() => setSys(s)} className={`rounded-full px-3 py-1 text-xs font-bold ${sys === s ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`}>
                {s === "all" ? (ar ? "الكل" : "All") : facetLabel(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {plans === null ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : plans === LOAD_FAILED ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">{ar ? "تعذّر تحميل الخطط. تأكد من الإنترنت وحدّث الصفحة." : "Could not load the plans. Check your connection and refresh."}</p>
        ) : shown.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{inFolder.length ? (ar ? "لا توجد خطة بهذا الاسم." : "No plan matches your search.") : ar ? "الخطط العامة بتتضاف قريب." : "General plans are being added."}</p>
        ) : (
          <HubGrid isEn={!ar} accent="teal" items={shown.map((p) => ({
            id: p.id, to: `/care-plans/${p.id}`, icon: p.icon, title: p.title.ar, titleEn: p.title.en,
            category: `${facetLabel(folder === "general" ? p.group || "other" : p.system)} · ${p.diagnoses.length} ${ar ? "تشخيصات" : "diagnoses"}`, summary: pick(p.summary, ar),
          }))} />
        )}
      </div>
    </div>
  );
}

/* ---------------- one diagnosis form ---------------- */
export function CarePlanPage() {
  const { id = "", dx: dxId } = useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get("type") === "hospital" ? "hospital" : "student";
  const [plan, setPlan] = useState<CarePlan | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlan(undefined); setFailed(false);
    fetchCarePlan(id).then(setPlan).catch(() => setFailed(true));
  }, [id]);

  const dx = plan ? plan.diagnoses.find((d) => d.id === dxId) ?? (dxId && !/^dx-\d+$/.test(dxId) ? undefined : plan.diagnoses[0]) : undefined;
  const dxIndex = plan && dx ? plan.diagnoses.indexOf(dx) : -1;
  useSEO({
    title: plan && dx
      ? (ar ? `${dx.title.ar} — خطة رعاية تمريضية ${plan.title.ar} | NurseHub Egypt` : `${dx.title.en} — ${plan.title.en} Nursing Care Plan | NurseHub Egypt`)
      : "خطط الرعاية التمريضية | NurseHub Egypt",
    description: plan && dx ? pick(dx.definition ?? dx.statement, ar) || pick(plan.summary, ar) : "",
    type: "article",
  });

  // print the sheet A4 landscape (this page only)
  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = "@media print { @page { size: A4 landscape; margin: 6mm; } .cp-sheet table, .cp-sheet tbody, .cp-sheet tr, .cp-sheet td { break-inside: auto !important; } }";
    document.head.appendChild(st);
    return () => st.remove();
  }, []);

  if (failed || plan === null || (plan && !dx)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center" dir={ar ? "rtl" : "ltr"}>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{failed ? (ar ? "تعذّر تحميل الخطة. تأكد من الإنترنت." : "Could not load this plan. Check your connection.") : ar ? "الخطة أو التشخيص غير موجود." : "Plan or diagnosis not found."}</p>
        <Link to={plan ? `/care-plans/${plan.id}` : "/care-plans"} className="mt-4 inline-block rounded-full bg-teal-700 px-6 py-2 font-bold text-white">{ar ? "رجوع" : "Back"}</Link>
      </div>
    );
  }
  if (plan === undefined || !dx) return <div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" /></div>;

  const setKind = (k: Kind) => { const p = new URLSearchParams(params); if (k === "student") p.delete("type"); else p.set("type", k); setParams(p, { replace: true }); };
  const goDx = (d: Diagnosis) => nav(`/care-plans/${plan.id}${d.id === plan.diagnoses[0]?.id ? "" : `/${d.id}`}${kind === "hospital" ? "?type=hospital" : ""}`); // first diagnosis = the plan page (one URL)
  const folderLink = plan.folder === "general" ? "/care-plans?folder=general" : "/care-plans";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 print:max-w-none print:p-0" dir={ar ? "rtl" : "ltr"}>
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: tr("section", ar), path: folderLink }, { label: pick(plan.title, ar), path: `/care-plans/${plan.id}` }, { label: pick(dx.title, ar) }]} />
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h1 className="text-lg font-black text-[#153448] dark:text-white">{pick(plan.title, ar)}</h1>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{tr("diagnoses", ar)} ({plan.diagnoses.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={tr("diagnoses", ar)}>
            {plan.diagnoses.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={d === dx} onClick={() => goDx(d)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold transition ${d === dx ? "bg-[#168C91] text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-teal-50 dark:bg-slate-800 dark:text-slate-200"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${d === dx ? "bg-white/25" : "bg-white dark:bg-slate-700"}`}>{i + 1}</span>
                {pick(d.title, ar)}{d.kind === "risk" && <span className="text-[10px] opacity-70">({ar ? "خطر" : "risk"})</span>}
              </button>
            ))}
          </div>
        </div>
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

      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-500 lg:hidden print:hidden">↔ {ar ? "اسحب النموذج يمين وشمال لقراءة كل الأعمدة" : "Swipe the form sideways to see every column"}</p>
      <div className="overflow-x-auto rounded-3xl border border-[#168C91]/30 shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <article className="cp-sheet min-w-[1100px] bg-[#f7fbfc] text-slate-800 lg:min-w-0 print:min-w-0" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          <SheetHeader ar={ar} kind={kind} plan={plan} dx={dx} n={dxIndex + 1} />
          <div className="space-y-4 px-5 pb-5 print:space-y-2 print:px-3 print:pb-2">
            <PatientFields ar={ar} kind={kind} />
            {kind === "student" ? <StudentForm ar={ar} dx={dx} /> : <HospitalForm ar={ar} dx={dx} />}
            {kind === "student" && (
              <div className="grid grid-cols-[2fr_1fr] gap-4 break-inside-avoid">
                <div className="min-h-[80px] rounded-2xl border border-[#168C91]/50 bg-white p-3 print:min-h-[56px] print:p-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#168C91] px-4 py-1 text-sm font-black text-white"><ClipboardList className="h-4 w-4" />{tr("notes", ar)}:</span>
                </div>
                <div className="min-h-[80px] rounded-2xl border border-[#168C91]/50 bg-white p-3 text-sm font-black text-[#153448] print:min-h-[56px] print:p-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#168C91] px-4 py-1 text-white"><PenLine className="h-4 w-4" />{tr("signature", ar)}:</span>
                  <div className="mt-4">{tr("date", ar)}: ______________________</div>
                </div>
              </div>
            )}
          </div>
          <SheetFooter />
        </article>
      </div>

      <div className="mt-4 space-y-3 print:hidden">
        <div className="flex flex-wrap justify-between gap-2">
          {dxIndex > 0 ? <button onClick={() => goDx(plan.diagnoses[dxIndex - 1])} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{ar ? "→ التشخيص السابق" : "← Previous diagnosis"}</button> : <span />}
          {dxIndex < plan.diagnoses.length - 1 && <button onClick={() => goDx(plan.diagnoses[dxIndex + 1])} className="rounded-full bg-[#168C91] px-4 py-2 text-sm font-bold text-white">{ar ? "التشخيص التالي ←" : "Next diagnosis →"}</button>}
        </div>
        <p className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{tr("disclaimer", ar)}</p>
        {!!plan.refs?.length && (
          <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <summary className="cursor-pointer font-bold text-slate-700 dark:text-slate-200">{tr("refs", ar)}</summary>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-slate-600 dark:text-slate-400">{plan.refs.map((r) => <li key={r.title}>{r.title}</li>)}</ul>
          </details>
        )}
        <Link to={folderLink} className="inline-block font-bold text-teal-700 dark:text-teal-300">{ar ? "← كل خطط الرعاية" : "← All care plans"}</Link>
      </div>
    </div>
  );
}

function SheetHeader({ ar, kind, plan, dx, n }: { ar: boolean; kind: Kind; plan: CarePlan; dx: Diagnosis; n: number }) {
  return (
    <header dir="ltr" className="flex items-center justify-between gap-6 p-5 print:gap-3 print:px-3 print:py-1.5">
      <div className="flex items-center gap-3">
        <LogoMark size={56} className="shadow-none print:!h-8 print:!w-8" />
        <div>
          <div className="whitespace-nowrap text-[28px] font-black leading-8 text-[#153448] print:text-[15px] print:leading-5">NurseHub <span className="text-[#168C91]">Egypt</span></div>
          <div dir="rtl" className="mt-1 whitespace-nowrap text-xs font-bold text-[#153448] print:mt-0 print:text-[8px]">— كل ما يحتاجه الممرض في مكان واحد —</div>
        </div>
      </div>
      <div dir={ar ? "rtl" : "ltr"} className="flex min-w-[560px] items-center gap-4 rounded-full bg-[#153448] py-3 ps-4 pe-8 text-white print:min-w-0 print:flex-1 print:gap-2 print:py-1 print:ps-2 print:pe-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-[#153448] print:h-7 print:w-7"><Stethoscope className="h-8 w-8 print:h-4 print:w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3"><span className="text-2xl font-black leading-8 print:text-[13px] print:leading-5">{ar ? T.sheet.ar : T.sheet.en}</span><span className="text-sm font-bold italic text-[#7fdde1] print:text-[9px]">{ar ? T.sheet.en : T.sheet.ar} · {ar ? T[kind].ar : T[kind].en}</span></div>
          <div className="mt-1 text-sm print:mt-0 print:text-[9px]"><span className="font-black text-white">{pick(plan.title, ar)}</span><span className="mx-2 text-white/40">|</span><span className="font-bold text-white/85">{ar ? "التشخيص" : "Diagnosis"} {n}: {pick(dx.title, ar)}</span></div>
        </div>
        <Activity className="h-10 w-10 shrink-0 text-[#5fd3d8] print:hidden" />
      </div>
    </header>
  );
}

function SheetFooter() {
  return (
    <footer dir="ltr" className="relative mt-2 overflow-hidden bg-[#153448] text-white break-inside-avoid print:mt-0">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="block h-6 w-full bg-[#f7fbfc] print:hidden" aria-hidden="true"><path d="M0 40 C300 0 700 50 1200 10 L1200 40 Z" fill="#168C91" /><path d="M0 40 C350 15 750 55 1200 25 L1200 40 Z" fill="#153448" /></svg>
      <div className="flex items-center justify-between gap-4 px-6 py-3 print:px-3 print:py-0.5 print:text-[9px] print:[&_span.grid]:hidden">
        <div className="text-base font-black italic print:text-[9px]">NurseHub Egypt <span className="mx-2 text-white/50">—</span> <span className="font-bold">Your Nursing Knowledge Hub</span></div>
        <div className="flex items-center gap-2">
          {[Stethoscope, BriefcaseMedical, Syringe, HeartPulse].map((I, i) => <span key={i} className="grid h-8 w-8 place-items-center rounded-full bg-[#168C91]"><I className="h-4 w-4" /></span>)}
          <span className="ms-2 text-xs font-bold text-white/80">nursehubegypt.com</span>
        </div>
      </div>
    </footer>
  );
}

/** Blank lines to fill by hand, laid out like the paper forms. */
function PatientFields({ ar, kind }: { ar: boolean; kind: Kind }) {
  const line = (label: string, extra = "") => (
    <div key={label} className={`flex items-end gap-2 text-[15px] font-black text-[#153448] ${extra}`}>
      <span className="shrink-0">{label}:</span><span className="mb-1 h-px flex-1 border-b border-dotted border-[#153448]/50" />
    </div>
  );
  const box = "grid grid-cols-[1fr_auto_1fr] gap-x-6 rounded-2xl border border-[#168C91]/60 bg-white p-4 print:rounded-lg print:p-1.5 print:[&_div]:text-[10px] print:[&_svg]:hidden print:[&_.space-y-3]:space-y-1.5 print:[&_.space-y-4]:space-y-2";
  const divider = <span className="w-[2px] rounded-full bg-[#168C91]" />;
  if (kind === "hospital") {
    return (
      <div className={box}>
        <div className="space-y-4">
          <div className="flex items-end gap-2 text-[15px] font-black text-[#153448]"><span>{ar ? "التاريخ" : "Date"}:</span><span className="tracking-[0.6em] text-slate-400">/ /</span></div>
          {line(ar ? "القسم" : "Department")}
        </div>
        {divider}
        <div className="space-y-4">
          {line(ar ? "اسم المريض رباعي" : "Patient full name")}
          {line(ar ? "الرقم القومي الموحد" : "National ID")}
        </div>
      </div>
    );
  }
  const box2 = (
    <span className="flex items-center gap-4 text-[15px] font-black text-[#153448]">
      <span>{ar ? "النوع" : "Gender"}:</span>
      {(ar ? ["ذكر", "أنثى"] : ["Male", "Female"]).map((g) => <span key={g} className="inline-flex items-center gap-1.5"><span className="h-4 w-4 rounded-[4px] border-2 border-[#153448]" />{g}</span>)}
    </span>
  );
  return (
    <div className={box}>
      <div className="space-y-3">
        {line(ar ? "اسم المريض" : "Patient Name")}
        <div className="flex items-end gap-6">{line(ar ? "السن" : "Age", "w-40")}{box2}</div>
        {line(ar ? "التشخيص الطبي" : "Medical Diagnosis")}
      </div>
      {divider}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-3">
          {line(ar ? "تاريخ الدخول" : "Date of Admission")}
          {line(ar ? "تاريخ الخطة" : "Date of Care Plan")}
          {line(ar ? "اسم الممرض/ة" : "Nurse's Name")}
        </div>
        <BedDouble className="h-16 w-16 shrink-0 text-[#168C91]/40" />
      </div>
    </div>
  );
}

const List = ({ items, className = "" }: { items: string[]; className?: string }) => (
  <ul className={`list-disc space-y-1 ps-4 ${className}`}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
);
const thCls = "border-x border-white/25 bg-[#153448] px-2 py-3 print:py-1.5 text-center align-middle text-[14px] font-black leading-5 text-white print:text-[11px]";
const tdCls = "border border-[#168C91]/45 bg-white p-2.5 align-top text-[13px] leading-6 text-slate-800 print:text-[10px] print:leading-[1.4]";
const Head = ({ icon: Icon, label }: { icon: typeof Clock; label: string }) => (
  <span className="flex flex-col items-center gap-1.5"><Icon className="h-6 w-6 text-[#7fdde1] print:h-4 print:w-4" strokeWidth={2.2} /><span>{label}</span></span>
);
const Sub = ({ children }: { children: React.ReactNode }) => <div className="mb-0.5 mt-2 text-[11px] font-black text-[#168C91] first:mt-0">{children}</div>;

function DiagnosisCell({ dx, ar }: { dx: Diagnosis; ar: boolean }) {
  return (
    <div>
      <div className="text-[14px] font-black leading-6 text-[#153448]">{pick(dx.title, ar)}</div>
      {dx.statement && !dx.definition && <p className="mt-1 font-bold">{pick(dx.statement, ar)}</p>}
      {dx.definition && <><Sub>{tr("definition", ar)}</Sub><p className="text-slate-600">{pick(dx.definition, ar)}</p></>}
      {!!dx.relatedTo?.ar.length && <><Sub>{tr("relatedTo", ar)}</Sub><List items={pickList(dx.relatedTo, ar)} /></>}
      {dx.kind === "risk"
        ? !!dx.riskFactors?.ar.length && <><Sub>{tr("riskFactors", ar)}</Sub><List items={pickList(dx.riskFactors, ar)} /></>
        : !!dx.evidencedBy?.ar.length && <><Sub>{tr("evidencedBy", ar)}</Sub><List items={pickList(dx.evidencedBy, ar)} /></>}
    </div>
  );
}

function Interventions({ dx, ar }: { dx: Diagnosis; ar: boolean }) {
  const groups = (["assess", "independent", "collab", "teach"] as const).map((t) => [t, dx.interventions.filter((x) => x.type === t)] as const).filter(([, l]) => l.length);
  let n = 0;
  return (
    <div className="space-y-2">
      {groups.map(([t, list]) => (
        <div key={t}>
          {groups.length > 1 && <div className="mb-1 rounded-md bg-[#168C91]/10 px-2 py-0.5 text-[11px] font-black text-[#0f6b70]">{ar ? TYPE_LABEL[t].ar : TYPE_LABEL[t].en}</div>}
          <ol className="space-y-1.5">
            {list.map((x) => {
              n += 1;
              return (
                <li key={n} className="flex gap-2 break-inside-avoid">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#168C91] text-[11px] font-black text-white">{n}</span>
                  <div>
                    <div className="font-bold">{pick(x.action, ar)}</div>
                    <div className="mt-0.5 text-[#0f6b70]"><span className="font-black">{tr("rationale", ar)}: </span>{pick(x.rationale, ar)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

function StudentForm({ ar, dx }: { ar: boolean; dx: Diagnosis }) {
  const cols = [[ClipboardList, "assessment"], [TriangleAlert, "diagnosis"], [Trophy, "goals"], [Settings, "interventions"], [CircleCheck, "evaluation"]] as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#168C91]/60 print:overflow-visible">
      <table className="w-full table-fixed border-collapse">
        <colgroup><col className="w-[18%]" /><col className="w-[19%]" /><col className="w-[15%]" /><col className="w-[33%]" /><col className="w-[15%]" /></colgroup>
        <thead><tr>{cols.map(([I, k]) => <th key={k} className={thCls}><Head icon={I} label={tr(k, ar)} /></th>)}</tr></thead>
        <tbody>
          <tr>
            <td className={tdCls}>
              <Sub>{tr("subjective", ar)}</Sub><List items={pickList(dx.assessment.subjective, ar)} />
              <Sub>{tr("objective", ar)}</Sub><List items={pickList(dx.assessment.objective, ar)} />
            </td>
            <td className={tdCls}><DiagnosisCell dx={dx} ar={ar} /></td>
            <td className={tdCls}>
              <Sub>{tr("shortTerm", ar)}</Sub><List items={pickList(dx.goals.short, ar)} />
              {!!dx.goals.long.ar.length && <><Sub>{tr("longTerm", ar)}</Sub><List items={pickList(dx.goals.long, ar)} /></>}
            </td>
            <td className={tdCls}><Interventions dx={dx} ar={ar} /></td>
            <td className={tdCls}>
              <ul className="space-y-2">
                {dx.evaluation.map((e, i) => (
                  <li key={i}>
                    <span className={`mb-0.5 inline-block rounded-full px-2 text-[11px] font-black ring-1 ${STATUS[e.status].cls}`}>{STATUS[e.status].mark} {ar ? STATUS[e.status].ar : STATUS[e.status].en}</span>
                    <div>{pick(e.text, ar)}</div>
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HospitalForm({ ar, dx }: { ar: boolean; dx: Diagnosis }) {
  const cols = [[Target, "dateTime"], [UserRound, "diagnosis"], [ClipboardCheck, "needs"], [Lightbulb, "actions"], [CircleCheck, "outcomes"], [TrendingUp, "timeframe"], [PenLine, "signature"]] as const;
  const rows = dx.hospital.length ? dx.hospital : [];
  return (
    <div className="overflow-hidden rounded-2xl border border-[#168C91]/60 print:overflow-visible">
      <table className="w-full table-fixed border-collapse">
        <colgroup><col className="w-[8%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[31%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[7%]" /></colgroup>
        <thead><tr>{cols.map(([I, k]) => <th key={k} className={thCls}><Head icon={I} label={tr(k, ar)} /></th>)}</tr></thead>
        <tbody>
          {rows.map((r, n) => (
            <tr key={n}>
              {n === 0 && <td rowSpan={rows.length} className={tdCls} />}
              {n === 0 && (
                <td rowSpan={rows.length} className={`${tdCls} font-black text-[#153448]`}>
                  {pick(dx.title, ar)}{dx.kind === "risk" && <div className="mt-1 text-[11px] font-bold text-slate-500">({ar ? "تشخيص خطر" : "risk diagnosis"})</div>}
                  {dx.definition && <p className="mt-2 text-[12px] font-normal leading-5 text-slate-600">{pick(dx.definition, ar)}</p>}
                </td>
              )}
              <td className={`${tdCls} font-bold`}>{pick(r.need, ar)}</td>
              <td className={tdCls}><List items={pickList(r.actions, ar)} /></td>
              <td className={tdCls}>{pick(r.outcome, ar)}</td>
              <td className={`${tdCls} text-center font-bold`}>{pick(r.timeframe, ar)}</td>
              {n === 0 && <td rowSpan={rows.length} className={tdCls} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

