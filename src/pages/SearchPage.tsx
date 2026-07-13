import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_LABELS, type Category } from "../lib/types";
import { ArticleCard, Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { logSearch } from "../lib/analytics";

type Tab = "all" | "content" | "drugs";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const { articles, drugs } = useStore();
  const { lang } = useI18n();
  const [query, setQuery] = useState(q);
  const [catFilter, setCatFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [tab, setTab] = useState<Tab>("all");

  useSEO({ title: q ? `نتائج البحث: ${q}` : "البحث المتقدم", description: "ابحث في المقالات، الكتب، الأدوية والمهارات — عربي وإنجليزي." });

  const cats = Object.keys(CATEGORY_LABELS) as Category[];
  const lower = q.toLowerCase();

  // Search across Arabic + English fields so medical terminology in either
  // language returns real matches (bilingual search).
  let articleResults = articles.filter((a) => a.status === "published");
  if (q) {
    articleResults = articleResults.filter((a) =>
      [a.title, a.titleEn, a.excerpt, a.excerptEn, a.content, a.contentEn, ...a.tags].filter(Boolean).join(" ").toLowerCase().includes(lower)
    );
  }
  if (catFilter) articleResults = articleResults.filter((a) => a.category === catFilter);
  if (tagFilter) articleResults = articleResults.filter((a) => a.tags.includes(tagFilter));

  const drugResults = q ? drugs.filter((d) => (d.name + d.genericName + d.drugClass + d.indications).toLowerCase().includes(lower)) : [];

  const showContent = tab === "all" || tab === "content";
  const showDrugs = tab === "all" || tab === "drugs";
  const total = (showContent ? articleResults.length : 0) + (showDrugs ? drugResults.length : 0);

  // Popular tags among currently visible results, for one-click refinement.
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    articleResults.forEach((a) => a.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [articleResults]);

  // Real search analytics — logged once per completed query.
  useEffect(() => {
    if (q.trim().length >= 2) logSearch(q, total, tab, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "البحث المتقدم" }]} />
      <h1 className="mb-6 text-3xl font-black dark:text-white">🔍 البحث المتقدم</h1>

      <form onSubmit={(e) => { e.preventDefault(); setParams({ q: query }); }} className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في المقالات، الكتب، الأدوية، المهارات..." className="flex-1 rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <option value="">كل الأقسام</option>
          {cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <button className="rounded-lg bg-sky-500 px-8 py-3 font-bold text-white">بحث</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {([["all", "الكل"], ["content", "المقالات والكتب"], ["drugs", "الأدوية"]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{l}</button>
        ))}
      </div>

      {(popularTags.length > 0 || tagFilter) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">🏷️ {lang === "ar" ? "الوسوم:" : "Tags:"}</span>
          {tagFilter && (
            <button onClick={() => setTagFilter("")} className="rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white">
              {tagFilter} ✕
            </button>
          )}
          {popularTags.filter((tg) => tg !== tagFilter).map((tg) => (
            <button key={tg} onClick={() => setTagFilter(tg)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-sky-100 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300">
              {tg}
            </button>
          ))}
        </div>
      )}

      {q && <p className="mb-4 text-slate-500 dark:text-slate-400">نتائج البحث عن "<span className="font-bold text-sky-500">{q}</span>": {total} نتيجة</p>}

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">لا توجد نتائج مطابقة. جرب كلمات أخرى.</div>
      ) : (
        <div className="space-y-8">
          {showDrugs && drugResults.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold dark:text-white">💊 الأدوية ({drugResults.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {drugResults.map((d) => (
                  <Link key={d.id} to={`/drug/${d.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
                    <div className="font-bold dark:text-white">💊 {d.name}</div>
                    <div className="text-sm text-slate-400">{d.genericName} • {d.category}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {showContent && articleResults.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold dark:text-white">📚 المقالات والكتب ({articleResults.length})</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articleResults.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
