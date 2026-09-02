import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHighAlertRef } from "../lib/highAlertRefApi";
import { fetchLasaPairs } from "../lib/lasaApi";
import { fetchOrganDoseAdjustments } from "../lib/organDoseApi";
import { fetchPregnancyLactationSafety } from "../lib/pregnancyLactationApi";
import { useStore } from "../lib/store";

type Tile = { to: string; icon: string; title: string; desc: string; count?: string; gradient: string };

export default function DrugSafetyCenterPage() {
  const { drugAntidotes, drugInteractions } = useStore();
  const [highAlertCount, setHighAlertCount] = useState(0);
  const [lasaCount, setLasaCount] = useState(0);
  const [organDoseCount, setOrganDoseCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);

  useEffect(() => {
    fetchHighAlertRef()
      .then((cats) => setHighAlertCount(cats.reduce((sum, c) => sum + c.drugs.length, 0)))
      .catch(() => {});
    fetchLasaPairs().then((items) => setLasaCount(items.length)).catch(() => {});
    fetchOrganDoseAdjustments().then((items) => setOrganDoseCount(items.length)).catch(() => {});
    fetchPregnancyLactationSafety().then((items) => setPregnancyCount(items.length)).catch(() => {});
  }, []);

  const tiles: Tile[] = [
    {
      to: "/drugs/high-alert-ref",
      icon: "⚠️",
      title: "الأدوية عالية الخطورة",
      desc: "مرجع ISMP الشامل مصنّف حسب الفئة الدوائية مع استراتيجية الأمان لكل فئة",
      count: `${highAlertCount} دواء`,
      gradient: "from-rose-600 to-red-500",
    },
    {
      to: "/drugs/lasa",
      icon: "🔤",
      title: "أدوية متشابهة الاسم (LASA)",
      desc: "أزواج أدوية سبب رئيسي لأخطاء الدواء — احذري الخلط بينها",
      count: `${lasaCount} زوج`,
      gradient: "from-purple-600 to-indigo-700",
    },
    {
      to: "/drugs/antidotes",
      icon: "🧪",
      title: "الترياقات",
      desc: "كل حالة تسمم والترياق المناسب لها",
      count: `${drugAntidotes.length} حالة`,
      gradient: "from-emerald-600 to-green-500",
    },
    {
      to: "/drugs/interactions",
      icon: "🔄",
      title: "فحص التفاعلات الدوائية",
      desc: "اختر دوائين واعرف التفاعل بينهما وكيفية إدارته",
      count: `${drugInteractions.length} تفاعل`,
      gradient: "from-violet-600 to-purple-500",
    },
    {
      to: "/drugs/organ-dose",
      icon: "🫘",
      title: "تعديل الجرعات الكلوية/الكبدية",
      desc: "إرشادات عملية لتعديل الجرعات عند القصور الكلوي أو الكبدي",
      count: `${organDoseCount} دواء`,
      gradient: "from-amber-600 to-orange-700",
    },
    {
      to: "/drugs/pregnancy-lactation",
      icon: "🤰",
      title: "أمان الحمل والرضاعة",
      desc: "تصنيف الأدوية الأكثر شيوعًا حسب أمانها أثناء الحمل والرضاعة",
      count: `${pregnancyCount} دواء`,
      gradient: "from-pink-600 to-fuchsia-700",
    },
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-800 via-slate-700 to-slate-600 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-5xl sm:text-6xl">🛡️</div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">مركز أمان الأدوية</h1>
          <p className="mt-2 max-w-2xl text-slate-200">
            كل ما يخص سلامة استخدام الأدوية في مكان واحد — الأدوية عالية الخطورة، المتشابهة بالاسم، الترياقات، التفاعلات، وتعديل الجرعات حسب حالة المريض.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} p-5 text-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-6`}
          >
            <span className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <span className="pointer-events-none absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-white/5" />
            <div className="relative flex items-start justify-between">
              <span className="text-4xl">{t.icon}</span>
              {t.count && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{t.count}</span>
              )}
            </div>
            <h3 className="relative mt-4 text-xl font-black">{t.title}</h3>
            <p className="relative mt-1 text-sm text-white/85">{t.desc}</p>
            <span className="relative mt-3 inline-block text-sm font-bold text-white/90 group-hover:underline">
              افتح ←
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
