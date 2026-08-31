import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { fetchAppliedPharmItems } from "../lib/appliedPharmApi";
import { fetchICUMedications } from "../lib/icuMedApi";
import { fetchLasaPairs } from "../lib/lasaApi";

type Tile = {
  to: string;
  icon: string;
  title: string;
  desc: string;
  count?: string;
  gradient: string;
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

  useSEO({
    title: `دليل الأدوية | ${settings.siteName}`,
    description:
      "دليل أدوية متكامل للممرضين: كل الأدوية، الأصناف، اللاحقات، الترياقات، أدوية القلب، فحص التفاعلات، والمذكرات.",
    keywords: "أدوية, دليل أدوية, جرعات, تمريض, ترياقات, تفاعلات دوائية",
  });

  const highAlertCount = drugs.filter((d) => d.isHighAlert).length;
  const DOSAGE_TOPIC =
    "نظام الجرعات الدوائية وحساب جرعة الطفل (Dosage Regimen & Pediatric Dose Calculation)";
  const [appliedPharmCount, setAppliedPharmCount] = useState(0);
  const [dosageCount, setDosageCount] = useState(0);
  const [icuMedCount, setIcuMedCount] = useState(0);
  const [lasaCount, setLasaCount] = useState(0);
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
    fetchLasaPairs()
      .then((items) => setLasaCount(items.length))
      .catch(() => {});
  }, []);

  const main: Tile[] = [
    {
      to: "/drugs/all",
      icon: "💊",
      title: "كل الأدوية",
      desc: "بحث وتصفية حسب الصنف والحرف",
      count: `${drugs.length} دواء`,
      gradient: "from-sky-600 to-cyan-500",
    },
    {
      to: "/drugs/interactions",
      icon: "🔄",
      title: "فحص التفاعلات",
      desc: "اختر دوائين واعرف التفاعل بينهما",
      count: `${drugInteractions.length} تفاعل`,
      gradient: "from-violet-600 to-purple-500",
    },
    {
      to: "/drugs/all?high=1",
      icon: "⚠️",
      title: "الأدوية عالية الخطورة",
      desc: "احتياطات إجبارية قبل الإعطاء",
      count: `${highAlertCount} دواء`,
      gradient: "from-rose-600 to-red-500",
    },
    {
      to: "/drugs/otc-guide",
      icon: "🩺",
      title: "حالات شائعة وعلاجها",
      desc: "الأعراض، الأسئلة المهمة، والعلاج",
      count: `${otcConditions.length} حالة`,
      gradient: "from-teal-600 to-green-500",
    },
    {
      to: "/drugs/applied-pharm",
      icon: "🧠",
      title: "بنك الصيدلية التعليمي",
      desc: "500 معلومة صيدلانية + ملخصات حسب الموضوع + خطط علاجية كاملة",
      count: `${appliedPharmCount} عنصر`,
      gradient: "from-indigo-600 to-violet-500",
    },
    {
      to: `/drugs/applied-pharm/topic/${encodeURIComponent(DOSAGE_TOPIC)}`,
      icon: "🧮",
      title: "حساب جرعة الطفل",
      desc: "نظام الجرعات الدوائية ومعادلات حساب جرعة الطفل من جرعة البالغ",
      count: `${dosageCount} عنصر`,
      gradient: "from-cyan-600 to-blue-500",
    },
    {
      to: "/drugs/icu-medications",
      icon: "🏥",
      title: "أدوية العناية المركزة",
      desc: "الثلاجة، المخدرة، مقويات القلب، الكهارل المركزة، وحساب الجرعات",
      count: `${icuMedCount} دواء`,
      gradient: "from-blue-700 to-cyan-500",
    },
    {
      to: "/drugs/lasa",
      icon: "🔤",
      title: "أدوية متشابهة الاسم (LASA)",
      desc: "أزواج أدوية سبب رئيسي لأخطاء الدواء — احذري الخلط بينها",
      count: `${lasaCount} زوج`,
      gradient: "from-purple-600 to-indigo-700",
    },
  ];

  const refs: Tile[] = [
    {
      to: "/drugs/classifications",
      icon: "🧬",
      title: "الأصناف الدوائية",
      desc: "الفئات الرئيسية مع الأمثلة",
      count: `${drugClassifications.length}`,
      gradient: "from-fuchsia-600 to-pink-500",
    },
    {
      to: "/drugs/suffixes",
      icon: "🔤",
      title: "لاحقات الأدوية",
      desc: "اعرف فئة الدواء من آخر اسمه",
      count: `${drugSuffixes.length}`,
      gradient: "from-blue-600 to-indigo-500",
    },
    {
      to: "/drugs/antidotes",
      icon: "🧪",
      title: "الترياقات",
      desc: "كل حالة تسمم والترياق المناسب",
      count: `${drugAntidotes.length}`,
      gradient: "from-emerald-600 to-green-500",
    },
    {
      to: "/drugs/mnemonics",
      icon: "🧠",
      title: "مذكرات فارماكولوجي",
      desc: "طرق سريعة للحفظ",
      count: `${pharmMnemonics.length}`,
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
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{t.count}</span>
        )}
      </div>
      <h3 className={`relative mt-4 font-black ${big ? "text-xl" : "text-lg"}`}>{t.title}</h3>
      <p className="relative mt-1 text-sm text-white/85">{t.desc}</p>
      <span className="relative mt-3 inline-block text-sm font-bold text-white/90 group-hover:underline">
        افتح ←
      </span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية" }]} />

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-500 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-5xl sm:text-6xl">💊</div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">دليل الأدوية</h1>
          <p className="mt-2 max-w-2xl text-sky-50">
            مرجع دوائي متكامل للممرضين والممارسين — أدوية، أصناف، ترياقات، تفاعلات ومعلومات عملية في مكان واحد.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">💊 {drugs.length} دواء</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">🧠 {appliedPharmCount} معلومة تطبيقية</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">🩺 {otcConditions.length} حالة شائعة</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">⚠️ {highAlertCount} عالي الخطورة</span>
          </div>
        </div>
      </div>

      <div className="mb-8"><AdSlot label="إعلان دليل الأدوية" /></div>

      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">الأقسام الرئيسية</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {main.map((t) => (
          <Card key={t.to} t={t} big />
        ))}
      </div>

      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">مراجع سريعة</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {refs.map((t) => (
          <Card key={t.to} t={t} />
        ))}
      </div>
    </div>
  );
}
