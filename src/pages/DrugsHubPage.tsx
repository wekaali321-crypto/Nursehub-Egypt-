import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { fetchAppliedPharmItems } from "../lib/appliedPharmApi";
import { fetchICUMedications } from "../lib/icuMedApi";
import { fetchERMedications } from "../lib/erMedApi";
import { fetchPedsMedications } from "../lib/pedsMedApi";
import { fetchHighAlertRef } from "../lib/highAlertRefApi";
import { fetchRxPrescriptions } from "../lib/rxApi";
import GlobalDrugSearchBar from "../components/GlobalDrugSearchBar";
import { useI18n } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

type Tile = {
  to: string;
  icon: string;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  count?: { ar: string; en: string };
  gradient: string;
};

const LABELS = {
  breadcrumb: { ar: "الأدوية", en: "Drugs" },
  title: { ar: "دليل الأدوية", en: "Drugs Guide" },
  subtitle: {
    ar: "مرجع دوائي متكامل للممرضين والممارسين — أدوية، أصناف، ترياقات، تفاعلات ومعلومات عملية في مكان واحد.",
    en: "A complete drug reference for nurses and practitioners - drugs, classifications, antidotes, interactions, and practical information in one place.",
  },
  drugCount: { ar: "دواء", en: "drugs" },
  appliedInfo: { ar: "معلومة تطبيقية", en: "applied facts" },
  commonCondition: { ar: "حالة شائعة", en: "common conditions" },
  highAlert: { ar: "عالي الخطورة", en: "high-alert" },
  mainSections: { ar: "الأقسام الرئيسية", en: "Main Sections" },
  quickReferences: { ar: "مراجع سريعة", en: "Quick References" },
  open: { ar: "افتح ←", en: "Open ←" },
  seo: {
    title: "دليل الأدوية",
    desc: "دليل أدوية متكامل للممرضين: كل الأدوية، الأصناف، اللاحقات، الترياقات، أدوية القلب، فحص التفاعلات، والمذكرات.",
  },
};

export default function DrugsHubPage() {
  const {
    drugs,
    drugAntidotes,
    drugClassifications,
    drugSuffixes,
    pharmMnemonics,
    drugInteractions,
    otcConditions,
    settings,
  } = useStore();
  const { lang } = useI18n();

  useSEO({
    title: `${LABELS.seo.title} | ${settings.siteName}`,
    description: LABELS.seo.desc,
    keywords: "أدوية, دليل أدوية, جرعات, تمريض, ترياقات, تفاعلات دوائية",
  });

  const DOSAGE_TOPIC =
    "نظام الجرعات الدوائية وحساب جرعة الطفل (Dosage Regimen & Pediatric Dose Calculation)";
  const [appliedPharmCount, setAppliedPharmCount] = useState(0);
  const [dosageCount, setDosageCount] = useState(0);
  const [icuMedCount, setIcuMedCount] = useState(0);
  const [erMedCount, setErMedCount] = useState(0);
  const [pedsMedCount, setPedsMedCount] = useState(0);
  const [highAlertRefDrugCount, setHighAlertRefDrugCount] = useState(0);
  const [rxCount, setRxCount] = useState(0);
  useEffect(() => {
    fetchAppliedPharmItems()
      .then((items) => {
        setAppliedPharmCount(items.length);
        setDosageCount(items.filter((i: any) => i.topic === DOSAGE_TOPIC).length);
      })
      .catch(() => {});
    fetchICUMedications()
      .then((items) => setIcuMedCount(items.length))
      .catch(() => {});
    fetchERMedications()
      .then((items) => setErMedCount(items.length))
      .catch(() => {});
    fetchPedsMedications()
      .then((items) => setPedsMedCount(items.length))
      .catch(() => {});
    fetchHighAlertRef()
      .then((cats) => setHighAlertRefDrugCount(cats.reduce((sum, c) => sum + c.drugs.length, 0)))
      .catch(() => {});
    fetchRxPrescriptions()
      .then((items) => setRxCount(items.length))
      .catch(() => {});
  }, []);

  const main: Tile[] = [
    {
      to: "/drugs/safety-center",
      icon: "🛡️",
      title: { ar: "مركز أمان الأدوية", en: "Drug Safety Center" },
      desc: {
        ar: "كل ما يخص السلامة الدوائية في مكان واحد: عالية الخطورة، LASA، الترياقات، التفاعلات، وتعديل الجرعات",
        en: "Everything about drug safety in one place: high-alert, LASA, antidotes, interactions, and dose adjustments",
      },
      gradient: "from-slate-700 to-slate-500",
    },
    {
      to: "/drugs/all",
      icon: "💊",
      title: { ar: "كل الأدوية", en: "All Drugs" },
      desc: { ar: "بحث وتصفية حسب الصنف والحرف", en: "Search and filter by class and letter" },
      count: { ar: `${drugs.length} دواء`, en: `${drugs.length} drugs` },
      gradient: "from-sky-600 to-cyan-500",
    },
    {
      to: "/drugs/interactions",
      icon: "🔄",
      title: { ar: "فحص التفاعلات", en: "Interaction Checker" },
      desc: { ar: "اختر دوائين واعرف التفاعل بينهما", en: "Pick two drugs and check for an interaction" },
      count: { ar: `${drugInteractions.length} تفاعل`, en: `${drugInteractions.length} interactions` },
      gradient: "from-violet-600 to-purple-500",
    },
    {
      to: "/drugs/otc-guide",
      icon: "🩺",
      title: { ar: "حالات شائعة وعلاجها", en: "Common Conditions" },
      desc: { ar: "الأعراض، الأسئلة المهمة، والعلاج", en: "Symptoms, key questions, and treatment" },
      count: { ar: `${otcConditions.length} حالة`, en: `${otcConditions.length} conditions` },
      gradient: "from-teal-600 to-green-500",
    },
    {
      to: "/drugs/applied-pharm",
      icon: "🧠",
      title: { ar: "بنك الصيدلية التعليمي", en: "Applied Pharmacology Bank" },
      desc: {
        ar: "500 معلومة صيدلانية + ملخصات حسب الموضوع + خطط علاجية كاملة",
        en: "500 pharmacology facts + topic summaries + full treatment plans",
      },
      count: { ar: `${appliedPharmCount} عنصر`, en: `${appliedPharmCount} items` },
      gradient: "from-indigo-600 to-violet-500",
    },
    {
      to: `/drugs/applied-pharm/topic/${encodeURIComponent(DOSAGE_TOPIC)}`,
      icon: "🧮",
      title: { ar: "حساب جرعة الطفل", en: "Pediatric Dose Calculation" },
      desc: {
        ar: "نظام الجرعات الدوائية ومعادلات حساب جرعة الطفل من جرعة البالغ",
        en: "Dosage regimens and formulas for calculating a child's dose from the adult dose",
      },
      count: { ar: `${dosageCount} عنصر`, en: `${dosageCount} items` },
      gradient: "from-cyan-600 to-blue-500",
    },
    {
      to: "/drugs/icu-medications",
      icon: "🏥",
      title: { ar: "أدوية العناية المركزة", en: "ICU Medications" },
      desc: {
        ar: "الثلاجة، المخدرة، مقويات القلب، الكهارل المركزة، وحساب الجرعات",
        en: "Refrigerated, narcotic, inotropes, concentrated electrolytes, and dose calculation",
      },
      count: { ar: `${icuMedCount} دواء`, en: `${icuMedCount} drugs` },
      gradient: "from-blue-700 to-cyan-500",
    },
    {
      to: "/drugs/er-medications",
      icon: "🚑",
      title: { ar: "أدوية قسم الطوارئ", en: "ER Medications" },
      desc: {
        ar: "المسكنات، المخدرات، مقويات القلب، الطوارئ السكرية، وحساب الجرعات",
        en: "Analgesics, narcotics, inotropes, diabetic emergencies, and dose calculation",
      },
      count: { ar: `${erMedCount} دواء`, en: `${erMedCount} drugs` },
      gradient: "from-red-600 to-rose-700",
    },
    {
      to: "/drugs/peds-medications",
      icon: "🧒",
      title: { ar: "أدوية قسم الأطفال", en: "Pediatric Medications" },
      desc: {
        ar: "بروتوكولات علاج الحالات الشائعة عند الأطفال حسب التخصص وحساب الجرعات",
        en: "Treatment protocols for common pediatric conditions by specialty, with dose calculation",
      },
      count: { ar: `${pedsMedCount} حالة`, en: `${pedsMedCount} conditions` },
      gradient: "from-teal-600 to-cyan-700",
    },
    {
      to: "/drugs/prescriptions",
      icon: "℞",
      title: { ar: "روشتات صيدلية", en: "Pharmacy Prescriptions" },
      desc: {
        ar: "أشهر الروشتات الطبية حسب الحالة — بشكل الروشتة الحقيقية",
        en: "The most common prescriptions by condition - in real prescription format",
      },
      count: { ar: `${rxCount} روشتة`, en: `${rxCount} prescriptions` },
      gradient: "from-emerald-600 to-teal-700",
    },
  ];

  const refs: Tile[] = [
    {
      to: "/drugs/classifications",
      icon: "🧬",
      title: { ar: "الأصناف الدوائية", en: "Drug Classifications" },
      desc: { ar: "الفئات الرئيسية مع الأمثلة", en: "Major classes with examples" },
      count: { ar: `${drugClassifications.length}`, en: `${drugClassifications.length}` },
      gradient: "from-fuchsia-600 to-pink-500",
    },
    {
      to: "/drugs/suffixes",
      icon: "🔤",
      title: { ar: "لاحقات الأدوية", en: "Drug Suffixes" },
      desc: { ar: "اعرف فئة الدواء من آخر اسمه", en: "Identify a drug's class from its name ending" },
      count: { ar: `${drugSuffixes.length}`, en: `${drugSuffixes.length}` },
      gradient: "from-blue-600 to-indigo-500",
    },
    {
      to: "/drugs/antidotes",
      icon: "🧪",
      title: { ar: "الترياقات", en: "Antidotes" },
      desc: { ar: "كل حالة تسمم والترياق المناسب", en: "Every poisoning case with its matching antidote" },
      count: { ar: `${drugAntidotes.length}`, en: `${drugAntidotes.length}` },
      gradient: "from-emerald-600 to-green-500",
    },
    {
      to: "/drugs/mnemonics",
      icon: "🧠",
      title: { ar: "مذكرات فارماكولوجي", en: "Pharmacology Mnemonics" },
      desc: { ar: "طرق سريعة للحفظ", en: "Quick memorization techniques" },
      count: { ar: `${pharmMnemonics.length}`, en: `${pharmMnemonics.length}` },
      gradient: "from-amber-600 to-yellow-500",
    },
  ];

  const Card = ({ t, big }: { t: Tile; big?: boolean }) => (
    <Link
      to={t.to}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} p-5 text-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
        big ? "sm:p-6" : ""
      }`}
    >
      <span className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <span className={big ? "text-4xl" : "text-3xl"}>{t.icon}</span>
        {t.count && (
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{t.count[lang]}</span>
        )}
      </div>
      <h3 className={`relative mt-4 font-black ${big ? "text-xl" : "text-lg"}`}>{t.title[lang]}</h3>
      <p className="relative mt-1 text-sm text-white/85">{t.desc[lang]}</p>
      <span className="relative mt-3 inline-block text-sm font-bold text-white/90 group-hover:underline">
        {LABELS.open[lang]}
      </span>
    </Link>
  );

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: LABELS.breadcrumb[lang] }]} />

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-500 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="text-5xl sm:text-6xl">💊</div>
            <InlineLangToggle light />
          </div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">{LABELS.title[lang]}</h1>
          <p className="mt-2 max-w-2xl text-sky-50">{LABELS.subtitle[lang]}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">💊 {drugs.length} {LABELS.drugCount[lang]}</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">🧠 {appliedPharmCount} {LABELS.appliedInfo[lang]}</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">🩺 {otcConditions.length} {LABELS.commonCondition[lang]}</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">⚠️ {highAlertRefDrugCount} {LABELS.highAlert[lang]}</span>
          </div>
          <div className="mt-6 max-w-xl">
            <GlobalDrugSearchBar />
          </div>
        </div>
      </div>

      <div className="mb-8"><AdSlot label="إعلان دليل الأدوية" /></div>

      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">{LABELS.mainSections[lang]}</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {main.map((t) => (
          <Card key={t.to} t={t} big />
        ))}
      </div>

      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">{LABELS.quickReferences[lang]}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {refs.map((t) => (
          <Card key={t.to} t={t} />
        ))}
      </div>
    </div>
  );
}
