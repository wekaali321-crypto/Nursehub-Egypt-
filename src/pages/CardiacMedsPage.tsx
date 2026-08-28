import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";

export default function CardiacMedsPage() {
  const { cardiacMedGroups, settings } = useStore();

  useSEO({
    title: `أدوية القلب حسب الفئة | ${settings.siteName}`,
    description: "دليل أدوية القلب مصنّفة حسب الفئة الدوائية مع الأسماء التجارية الشائعة.",
    keywords: "cardiac meds, أدوية القلب, تمريض قلب",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "أدوية القلب" }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-rose-600 to-red-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">❤️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">أدوية القلب حسب الفئة</h1>
        <p className="mt-1 text-rose-50">{cardiacMedGroups.length} فئة رئيسية من أدوية القلب والدورة الدموية.</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان أدوية القلب" /></div>

      <div className="space-y-4">
        {cardiacMedGroups.map((g) => (
          <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-rose-600">{g.name}</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {g.examples.split(",").map((e, i) => (
                <li key={i}>- {e.trim()}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}
