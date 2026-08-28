import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";

export default function PharmMnemonicsPage() {
  const { pharmMnemonics, settings } = useStore();

  useSEO({
    title: `مذكرات الفارماكولوجي | ${settings.siteName}`,
    description: "مذكرات (Mnemonics) لتسهيل حفظ أهم معلومات الأدوية والتمريض.",
    keywords: "pharmacology mnemonics, مذكرات فارماكولوجي, تمريض",
  });

  const colors = ["border-violet-300 bg-violet-50 dark:bg-violet-500/10", "border-rose-300 bg-rose-50 dark:bg-rose-500/10", "border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10", "border-amber-300 bg-amber-50 dark:bg-amber-500/10", "border-sky-300 bg-sky-50 dark:bg-sky-500/10"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "مذكرات الفارماكولوجي" }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-indigo-600 to-purple-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🧠</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">مذكرات الفارماكولوجي (Mnemonics)</h1>
        <p className="mt-1 text-indigo-50">{pharmMnemonics.length} طريقة سريعة لحفظ معلومات الأدوية المهمة.</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان المذكرات" /></div>

      <div className="space-y-4">
        {pharmMnemonics.map((m, i) => (
          <div key={m.id} className={`rounded-2xl border-2 p-5 ${colors[i % colors.length]}`}>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {m.title} {m.code && <span className="text-indigo-600">"{m.code}"</span>}
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              {m.lines.split("\n").filter(Boolean).map((l, j) => (
                <li key={j}>• {l}</li>
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
