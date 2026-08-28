import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";

export default function DrugSuffixesPage() {
  const { drugSuffixes, settings } = useStore();
  const [q, setQ] = useState("");

  useSEO({
    title: `لاحقات أسماء الأدوية | ${settings.siteName}`,
    description: "دليل لاحقات أسماء الأدوية الشائعة (Drug Suffix Classification) مع الفئة والأمثلة.",
    keywords: "drug suffixes, لاحقات الأدوية, تمريض",
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return drugSuffixes;
    return drugSuffixes.filter(
      (x) => x.suffix.toLowerCase().includes(s) || x.className.toLowerCase().includes(s) || x.examples.toLowerCase().includes(s)
    );
  }, [drugSuffixes, q]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "لاحقات الأدوية" }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-cyan-600 to-blue-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🔤</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">لاحقات أسماء الأدوية</h1>
        <p className="mt-1 text-cyan-50">{drugSuffixes.length} لاحقة شائعة — طريقة سريعة لمعرفة فئة الدواء من اسمه.</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان لاحقات الأدوية" /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحثي عن لاحقة أو فئة أو دواء..."
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="inline-block rounded-full bg-cyan-500 px-3 py-1 text-sm font-bold text-white">{s.suffix}</span>
            <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{s.className}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">أمثلة: {s.examples}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            مفيش نتائج مطابقة للبحث.
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}
