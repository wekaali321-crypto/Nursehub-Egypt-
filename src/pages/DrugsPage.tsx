import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";

export default function DrugsPage() {
  const { drugs, settings } = useStore();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [letter, setLetter] = useState("");
  const [sort, setSort] = useState("alpha");

  useSEO({
    title: `دليل الأدوية | ${settings.siteName}`,
    description: "دليل أدوية احترافي للممرضين: البحث، التصفية، الترتيب الأبجدي، الجرعات والاعتبارات التمريضية.",
    keywords: "أدوية, دليل أدوية, جرعات, تمريض, دواء",
  });

  const categories = useMemo(() => Array.from(new Set(drugs.map((d) => d.category))), [drugs]);
  const letters = useMemo(() => Array.from(new Set(drugs.map((d) => d.name[0].toUpperCase()))).sort(), [drugs]);

  let list = drugs.filter((d) => {
    const m = (d.name + d.genericName + d.drugClass).toLowerCase().includes(q.toLowerCase());
    const c = !cat || d.category === cat;
    const l = !letter || d.name.toUpperCase().startsWith(letter);
    return m && c && l;
  });
  list = [...list].sort((a, b) => (sort === "alpha" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("drugs.title") }]} />
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-sky-500 to-emerald-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">💊</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("drugs.title")}</h1>
        <p className="mt-1 text-sky-50">{drugs.length} دواء مع الجرعات والاعتبارات التمريضية</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search") + "..."} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
          <span className="absolute right-3 top-3 text-slate-400">🔍</span>
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <option value="">{t("drugs.allCats")}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <option value="alpha">أ - ي (تصاعدي)</option>
          <option value="alphaDesc">ي - أ (تنازلي)</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-1">
        <button onClick={() => setLetter("")} className={`rounded-lg px-2.5 py-1 text-sm font-bold ${!letter ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>الكل</button>
        {letters.map((l) => (
          <button key={l} onClick={() => setLetter(l)} className={`rounded-lg px-2.5 py-1 text-sm font-bold ${letter === l ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{l}</button>
        ))}
      </div>

      <div className="mb-6"><AdSlot label="إعلان دليل الأدوية" /></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <Link key={d.id} to={`/drug/${d.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-sky-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">{d.category}</span>
              <span className="text-2xl">💊</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-sky-600 dark:text-white">{d.name}</h3>
            <p className="text-sm text-slate-400">{d.genericName}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d.drugClass}</p>
          </Link>
        ))}
        {list.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">لا توجد نتائج مطابقة.</div>}
      </div>
    </div>
  );
}
