import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
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
  heroTitle: { ar: "مرجع الأدوية للتمريض", en: "Nursing Drug Reference" },
  heroSub: { ar: "جرعات واعتبارات تمريضية وتحذيرات أمان — بحث سريع في كل أقسام الدليل.", en: "Doses, nursing considerations and safety warnings — one search across the whole guide." },
  shortcuts: { ar: "اختصارات سريعة", en: "Quick access" },
  byCategory: { ar: "تصفّح حسب الفئة", en: "Browse by category" },
  safetyTitle: { ar: "الأمان الدوائي", en: "Medication safety" },
  safetyDesc: { ar: "مراجع تقلل أخطاء الدواء: الأدوية عالية الخطورة، المتشابهة في الاسم، الترياقات والتفاعلات.", en: "References that reduce medication errors: high-alert drugs, look-alike names, antidotes and interactions." },
  sections: { ar: "المراجع والأقسام", en: "References & sections" },
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
      to: "/drugs/interactions",
      icon: "🔄",
      title: { ar: "فحص التفاعلات", en: "Interaction Checker" },
      desc: { ar: "اختر دوائين واعرف التفاعل بينهما", en: "Pick two drugs and check for an interaction" },
      count: { ar: `${drugInteractions.length} تفاعل`, en: `${drugInteractions.length} interactions` },
    },
    {
      to: "/drugs/otc-guide",
      icon: "🩺",
      title: { ar: "حالات شائعة وعلاجها", en: "Common Conditions" },
      desc: { ar: "الأعراض، الأسئلة المهمة، والعلاج", en: "Symptoms, key questions, and treatment" },
      count: { ar: `${otcConditions.length} حالة`, en: `${otcConditions.length} conditions` },
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
    },
    {
      to: "/courses/peds-gyne",
      icon: "👶",
      title: { ar: "دليل الأطفال والنساء والتوليد", en: "Pediatrics & Gynecology Guide" },
      desc: {
        ar: "مرجع عيادة: الأدوية وجرعاتها حسب الوزن والعمر، وبروتوكولات علاج الحالات الشائعة، بجداول وصور توضيحية",
        en: "A clinic handbook: drugs and weight/age-based doses, treatment protocols for common conditions, with tables and figures",
      },
    },
  ];

  const refs: Tile[] = [
    {
      to: "/drugs/classifications",
      icon: "🧬",
      title: { ar: "الأصناف الدوائية", en: "Drug Classifications" },
      desc: { ar: "الفئات الرئيسية مع الأمثلة", en: "Major classes with examples" },
      count: { ar: `${drugClassifications.length}`, en: `${drugClassifications.length}` },
    },
    {
      to: "/drugs/suffixes",
      icon: "🔤",
      title: { ar: "لاحقات الأدوية", en: "Drug Suffixes" },
      desc: { ar: "اعرف فئة الدواء من آخر اسمه", en: "Identify a drug's class from its name ending" },
      count: { ar: `${drugSuffixes.length}`, en: `${drugSuffixes.length}` },
    },
    {
      to: "/drugs/antidotes",
      icon: "🧪",
      title: { ar: "الترياقات", en: "Antidotes" },
      desc: { ar: "كل حالة تسمم والترياق المناسب", en: "Every poisoning case with its matching antidote" },
      count: { ar: `${drugAntidotes.length}`, en: `${drugAntidotes.length}` },
    },
    {
      to: "/pharmacology/pharm-mnemonics-memory-aids",
      icon: "🧠",
      title: { ar: "مذكرات فارماكولوجي", en: "Pharmacology Mnemonics" },
      desc: { ar: "انتقلت إلى قسم الفارماكولوجي — طرق سريعة للحفظ", en: "Moved to the Pharmacology section — quick memorization techniques" },
    },
  ];

  const highAlertCount = drugs.filter((d) => d.isHighAlert).length;
  const categories = (() => {
    const m = new Map<string, { n: number; en?: string }>();
    drugs.forEach((d) => {
      const cur = m.get(d.category) || { n: 0, en: d.categoryEn };
      cur.n += 1;
      if (!cur.en && d.categoryEn) cur.en = d.categoryEn;
      m.set(d.category, cur);
    });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  })();

  const shortcuts: { to: string; icon: string; title: { ar: string; en: string }; count?: string; danger?: boolean }[] = [
    { to: "/drugs/all", icon: "💊", title: { ar: "جميع الأدوية", en: "All drugs" }, count: `${drugs.length}` },
    { to: "/drugs/all?high=1", icon: "⚠️", title: { ar: "عالية الخطورة", en: "High Alert" }, count: `${highAlertCount}`, danger: true },
    { to: `/drugs/applied-pharm/topic/${encodeURIComponent(DOSAGE_TOPIC)}`, icon: "🧮", title: { ar: "حاسبات الجرعات", en: "Dose calculators" }, count: dosageCount ? `${dosageCount}` : undefined },
    { to: "/drugs/safety-center", icon: "🛡️", title: { ar: "مركز الأمان", en: "Safety Center" } },
  ];
  const safetyLinks: { to: string; title: { ar: string; en: string } }[] = [
    { to: "/drugs/high-alert-ref", title: { ar: "الأدوية عالية الخطورة (ISMP)", en: "High-alert drugs (ISMP)" } },
    { to: "/drugs/lasa", title: { ar: "متشابهة الاسم (LASA)", en: "Look-alike / sound-alike" } },
    { to: "/drugs/antidotes", title: { ar: "الترياقات", en: "Antidotes" } },
    { to: "/drugs/interactions", title: { ar: "فحص التفاعلات", en: "Interaction checker" } },
    { to: "/drugs/organ-dose", title: { ar: "تعديل الجرعات (كلى/كبد)", en: "Renal / hepatic dosing" } },
  ];

  const Card = ({ t }: { t: Tile }) => (
    <Link
      to={t.to}
      className="group flex gap-3 rounded-2xl border border-slate-200 border-b-4 border-b-[#168C91] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-b-[#168C91] dark:bg-slate-900"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#168C91]/10 text-xl" aria-hidden="true">{t.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="font-black leading-snug text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{t.title[lang]}</span>
          {t.count && <span className="shrink-0 rounded-full bg-[#168C91]/10 px-2.5 py-0.5 text-xs font-bold text-[#168C91] dark:bg-[#168C91]/20 dark:text-teal-300">{t.count[lang]}</span>}
        </span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{t.desc[lang]}</span>
      </span>
    </Link>
  );

  const h2 = "mb-3 border-s-4 border-[#168C91] ps-3 text-lg font-black text-[#153448] dark:text-white";

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="bg-[#F1F4F6] pb-12 dark:bg-slate-950">
      {/* No overflow-hidden on the header itself: the search dropdown must be able to extend below it. The decorative layers are clipped in their own wrapper. */}
      <header className="relative z-20 bg-[#153448] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute -top-20 end-[-5rem] h-64 w-64 rounded-full bg-[#168C91]/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pb-6 pt-4 md:pb-8 md:pt-6">
          <div className="flex items-start justify-between gap-3">
            <nav aria-label="Breadcrumb" className="text-xs text-slate-300 sm:text-sm">
              <ol className="flex items-center gap-1">
                <li><Link to="/" className="hover:text-teal-200">{lang === "ar" ? "الرئيسية" : "Home"}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-semibold text-white">{LABELS.breadcrumb[lang]}</li>
              </ol>
            </nav>
            <InlineLangToggle light />
          </div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{LABELS.heroTitle[lang]}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-200 md:text-base">{LABELS.heroSub[lang]}</p>
          <div className="mt-4 max-w-2xl"><GlobalDrugSearchBar /></div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-teal-100">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">💊 {drugs.length} {LABELS.drugCount[lang]}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">⚠️ {highAlertRefDrugCount} {LABELS.highAlert[lang]}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">🧠 {appliedPharmCount} {LABELS.appliedInfo[lang]}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <section aria-label={LABELS.shortcuts[lang]} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shortcuts.map((x) => (
            <Link key={x.to} to={x.to} className={`group flex flex-col items-start gap-1 rounded-2xl border p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] ${x.danger ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-500/10" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <span className="text-2xl" aria-hidden="true">{x.icon}</span>
              <span className={`text-sm font-black leading-snug ${x.danger ? "text-red-700 dark:text-red-300" : "text-[#153448] dark:text-white"}`}>{x.title[lang]}</span>
              {x.count && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{x.count}</span>}
            </Link>
          ))}
        </section>

        <section className="mt-8">
          <h2 className={h2}>{LABELS.byCategory[lang]}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(([c, info]) => (
              <Link key={c} to={`/drugs/all?cat=${encodeURIComponent(c)}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-[#153448] transition hover:border-[#168C91] hover:text-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-teal-300">
                {lang === "en" && info.en ? info.en : c} <span className="text-xs font-semibold opacity-60">{info.n}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-red-200 border-s-4 border-s-red-600 bg-white p-4 shadow-sm dark:border-red-900 dark:border-s-red-600 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-black text-[#153448] dark:text-white"><span aria-hidden="true">🛡️</span> {LABELS.safetyTitle[lang]}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{LABELS.safetyDesc[lang]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {safetyLinks.map((x) => (
              <Link key={x.to} to={x.to} className="rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">{x.title[lang]}</Link>
            ))}
            <Link to="/drugs/safety-center" className="rounded-full bg-[#153448] px-3.5 py-1.5 text-sm font-bold text-white hover:bg-[#168C91]">{LABELS.open[lang]}</Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className={h2}>{LABELS.sections[lang]}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...main, ...refs].map((t) => <Card key={t.to} t={t} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
