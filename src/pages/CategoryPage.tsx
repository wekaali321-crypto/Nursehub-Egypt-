import { useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_ICONS, type Category } from "../lib/types";
import { ArticleCard, Breadcrumbs, AdSlot } from "../components/common";
import { useI18n, type TKey } from "../lib/i18n";

const CAT_KEY: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", careplans: "nav.careplans", books: "nav.books",
};

export default function CategoryPage() {
  const { cat } = useParams<{ cat: Category }>();
  const { articles } = useStore();
  const { t } = useI18n();
  const [sort, setSort] = useState("latest");
  const [tag, setTag] = useState("");

  const category = (cat ?? "articles") as Category;
  const catLabel = t(CAT_KEY[category]);
  let list = articles.filter((a) => a.category === category && a.status === "published");
  if (tag) list = list.filter((a) => a.tags.includes(tag));
  list = [...list].sort((a, b) =>
    sort === "popular" ? b.views - a.views : b.publishDate.localeCompare(a.publishDate)
  );

  const tags = Array.from(new Set(articles.filter((a) => a.category === category).flatMap((a) => a.tags)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: catLabel }]} />
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-sky-500 to-emerald-500 p-8 text-white">
        <div className="text-5xl">{CATEGORY_ICONS[category]}</div>
        <h1 className="mt-2 text-3xl font-black">{catLabel}</h1>
        <p className="mt-1 text-sky-50">{list.length} {t("common.item")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTag("")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!tag ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{t("cat.all")}</button>
          {tags.map((tg) => (
            <button key={tg} onClick={() => setTag(tg)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tag === tg ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>#{tg}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="latest">{t("cat.sortLatest")}</option>
          <option value="popular">{t("cat.sortPopular")}</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">{t("common.noData")}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      )}

      <div className="mt-10"><AdSlot label="إعلان أسفل القسم" /></div>
    </div>
  );
}
