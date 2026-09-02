import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import type { OTCCondition } from "../lib/types";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const CATEGORY_GRADIENT: Record<string, string> = {
  "تنفسي": "from-sky-600 to-blue-500",
  "هضمي": "from-teal-600 to-emerald-500",
  "جلدية": "from-cyan-600 to-sky-500",
  "عظام ومفاصل": "from-slate-600 to-slate-800",
  "فم وأسنان": "from-blue-600 to-indigo-500",
  "مسالك بولية": "from-indigo-600 to-violet-500",
  "نسائية": "from-violet-600 to-purple-500",
  "أخرى": "from-emerald-600 to-green-500",
};
const DEFAULT_GRADIENT = "from-teal-700 to-emerald-500";

const LABELS = {
  drugsBreadcrumb: { ar: "الأدوية", en: "Drugs" },
  breadcrumb: { ar: "حالات شائعة وعلاجها", en: "Common Conditions & Treatment" },
  title: { ar: "حالات شائعة وعلاجها", en: "Common Conditions & Treatment" },
  subtitle: {
    ar: "دليل سريع لأشهر الحالات اللي بتتعرض في الصيدلية: الأعراض، الأسئلة المهمة قبل الصرف، العلاج، وعلامات الخطر اللي تستوجب تحويل المريض للطبيب فورًا.",
    en: "A quick reference for the most common conditions seen in the pharmacy: symptoms, key questions before dispensing, treatment, and red flags requiring immediate physician referral.",
  },
  documentedCount: { ar: "حالة موثّقة", en: "documented conditions" },
  searchPlaceholder: { ar: "🔍 دوّر باسم الحالة...", en: "🔍 Search by condition name..." },
  all: { ar: "الكل", en: "All" },
  details: { ar: "التفاصيل ←", en: "Details ←" },
  noneUploaded: { ar: "لسه معملتش رفع الحالات.", en: "No conditions uploaded yet." },
  noResults: { ar: "مفيش نتائج مطابقة.", en: "No matching results." },
  back: { ar: "← العودة لدليل الأدوية", en: "← Back to the Drugs Guide" },
  notFound: { ar: "الحالة دي مش موجودة.", en: "This condition was not found." },
  backToList: { ar: "الرجوع لقائمة الحالات", en: "Back to the conditions list" },
  summary: { ar: "الملخص", en: "Summary" },
  symptoms: { ar: "الأعراض", en: "Symptoms" },
  keyQuestions: { ar: "الأسئلة المهمة قبل الصرف", en: "Key Questions Before Dispensing" },
  redFlags: { ar: "علامات الخطر — تحويل فوري للطبيب", en: "Red Flags — Immediate Physician Referral" },
  treatment: { ar: "العلاج", en: "Treatment" },
  patientAdvice: { ar: "نصائح للمريض", en: "Patient Advice" },
  allConditions: { ar: "← كل الحالات", en: "← All conditions" },
  drugsGuide: { ar: "دليل الأدوية ←", en: "Drugs Guide ←" },
};

export function OTCGuideHome() {
  const { otcConditions, settings } = useStore();
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useSEO({
    title: `حالات شائعة وعلاجها | ${settings.siteName}`,
    description: "دليل سريع لأشهر الحالات في الصيدلية: الأعراض، الأسئلة المهمة قبل الصرف، العلاج، وعلامات الخطر.",
    keywords: "OTC, حالات شائعة, صيدلية, تمريض, علاج",
  });

  const categories = useMemo(
    () => Array.from(new Set(otcConditions.map((c) => c.category))),
    [otcConditions]
  );

  const filtered = useMemo(() => {
    const list = otcConditions
      .filter((c) => !activeCategory || c.category === activeCategory)
      .filter(
        (c) =>
          !search.trim() ||
          c.nameAr.includes(search) ||
          c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          c.summary.includes(search) ||
          (c.summaryEn || "").toLowerCase().includes(search.toLowerCase())
      );
    return [...list].sort((a, b) => a.orderNum - b.orderNum);
  }, [otcConditions, search, activeCategory]);

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: LABELS.drugsBreadcrumb[lang], path: "/drugs" }, { label: LABELS.breadcrumb[lang] }]} />

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-green-500 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="text-5xl sm:text-6xl">🩺</div>
            <InlineLangToggle light />
          </div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">{LABELS.title[lang]}</h1>
          <p className="mt-2 max-w-2xl text-teal-50">{LABELS.subtitle[lang]}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
            ✅ {otcConditions.length} {LABELS.documentedCount[lang]}
          </div>
        </div>
      </div>

      <div className="mb-6"><AdSlot label="إعلان حالات شائعة" /></div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={LABELS.searchPlaceholder[lang]}
        className="mb-4 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
            activeCategory === null
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {LABELS.all[lang]}
        </button>
        {categories.map((cat) => {
          const catEn = otcConditions.find((c) => c.category === cat)?.categoryEn;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
                activeCategory === cat
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {bilingual(cat, catEn, lang).text}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c) => {
          const gradient = CATEGORY_GRADIENT[c.category] || DEFAULT_GRADIENT;
          const name = lang === "en" && c.nameEn ? c.nameEn : c.nameAr;
          const subName = lang === "en" ? c.nameAr : c.nameEn;
          return (
            <Link
              key={c.id}
              to={`/drugs/otc-guide/${c.id}`}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <span className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="relative flex items-start gap-3">
                <span className="text-3xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black leading-tight">{name}</h3>
                  <p className="text-xs text-white/70">{subName}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/85">{bilingual(c.summary, c.summaryEn, lang).text}</p>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{bilingual(c.category, c.categoryEn, lang).text}</span>
                <span className="text-sm font-bold text-white/90 group-hover:underline">{LABELS.details[lang]}</span>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {otcConditions.length === 0 ? LABELS.noneUploaded[lang] : LABELS.noResults[lang]}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">{LABELS.back[lang]}</Link>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: string;
  title: string;
  children?: string;
  tone?: "default" | "red" | "info";
}) {
  if (!children || children === "—") return null;
  const tones: Record<string, string> = {
    default: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    red: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30",
    info: "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30",
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <h3 className="mb-2 flex items-center gap-2 font-black text-slate-800 dark:text-white">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  );
}

export default function OTCConditionPage() {
  const { id } = useParams();
  const { otcConditions, settings } = useStore();
  const { lang } = useI18n();
  const condition = useMemo<OTCCondition | undefined>(
    () => otcConditions.find((c) => c.id === id),
    [otcConditions, id]
  );

  useSEO({
    title: condition ? `${condition.nameAr} | ${settings.siteName}` : `حالات شائعة | ${settings.siteName}`,
    description: condition?.summary ?? "دليل حالات شائعة وعلاجها.",
    keywords: `${condition?.nameAr ?? ""}, OTC, تمريض, صيدلية`,
  });

  if (!condition) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">{LABELS.notFound[lang]}</p>
        <Link to="/drugs/otc-guide" className="font-bold text-emerald-600 hover:underline">
          {LABELS.backToList[lang]}
        </Link>
      </div>
    );
  }

  const name = lang === "en" && condition.nameEn ? condition.nameEn : condition.nameAr;
  const subName = lang === "en" ? condition.nameAr : condition.nameEn;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: LABELS.drugsBreadcrumb[lang], path: "/drugs" },
          { label: LABELS.breadcrumb[lang], path: "/drugs/otc-guide" },
          { label: name },
        ]}
      />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-green-500 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
              {condition.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{name}</h1>
              <p className="text-white/80">{subName}</p>
            </div>
          </div>
          <InlineLangToggle light />
        </div>
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
          {bilingual(condition.category, condition.categoryEn, lang).text}
        </span>
      </div>

      <div className="mb-6"><AdSlot label="إعلان صفحة الحالة" /></div>

      <div className="space-y-4">
        <Section icon="📝" title={LABELS.summary[lang]}>{bilingual(condition.summary, condition.summaryEn, lang).text}</Section>
        <Section icon="🩺" title={LABELS.symptoms[lang]}>{bilingual(condition.symptoms, condition.symptomsEn, lang).text}</Section>
        <Section icon="❓" title={LABELS.keyQuestions[lang]} tone="info">{bilingual(condition.keyQuestions, condition.keyQuestionsEn, lang).text}</Section>
        <Section icon="🚨" title={LABELS.redFlags[lang]} tone="red">{bilingual(condition.redFlags, condition.redFlagsEn, lang).text}</Section>
        <Section icon="💊" title={LABELS.treatment[lang]}>{bilingual(condition.treatment, condition.treatmentEn, lang).text}</Section>
        <Section icon="💡" title={LABELS.patientAdvice[lang]}>{bilingual(condition.patientAdvice, condition.patientAdviceEn, lang).text}</Section>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/otc-guide" className="text-sky-600 hover:underline">{LABELS.allConditions[lang]}</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">{LABELS.drugsGuide[lang]}</Link>
      </div>
    </div>
  );
}
