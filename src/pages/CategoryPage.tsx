import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_ICONS, type Category } from "../lib/types";
import ArticleListCard from "../components/ArticleListCard";
import { useI18n, bilingual, type TKey } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const CAT_KEY: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", "infection-control": "nav.infectionControl",
  careplans: "nav.careplans", books: "nav.books",
};

// قوائم تحقق البروتوكولات الإكلينيكية التفاعلية — كل بروتوكول عنصر مستقل بذاته،
// مثبّت أعلى قسم المهارات لأنه مهارة إكلينيكية تفاعلية وليس مقالاً عاديًا.
const SKILL_PROTOCOL_LINKS = [
  {
    to: "/drugs/protocols/proto_dka",
    icon: "🩸",
    title: "بروتوكول الحُماض الكيتوني السكري (DKA)",
    titleEn: "Diabetic Ketoacidosis (DKA) Protocol",
    desc: "قائمة تحقق تفاعلية خطوة بخطوة وفق مبادئ JBDS/ADA — علّم على كل خطوة وتقدّمك يُحفظ تلقائيًا",
    descEn: "An interactive step-by-step checklist based on JBDS/ADA guidelines — check off each step and your progress is saved automatically",
  },
  {
    to: "/drugs/protocols/proto_cabg",
    icon: "🫀",
    title: "بروتوكول جراحة المجازة التاجية (CABG)",
    titleEn: "Coronary Artery Bypass Graft (CABG) Surgery Protocol",
    desc: "قائمة تحقق تفاعلية خطوة بخطوة وفق مبادئ ERAS Cardiac Surgery Society",
    descEn: "An interactive step-by-step checklist based on ERAS Cardiac Surgery Society guidelines",
  },
];

export default function CategoryPage() {
  // `sub` is the real sub-category folder slug (from the `categories` taxonomy),
  // e.g. /category/articles/nursing-fundamentals
  const { cat, sub } = useParams<{ cat: Category; sub?: string }>();
  const { articles, categories } = useStore();
  const { lang, t } = useI18n();
  const [sort, setSort] = useState("latest");

  const category = (cat ?? "articles") as Category;
  const catLabel = t(CAT_KEY[category]);

  // Real, clickable sub-category folders — only ones that actually contain
  // at least one published article in this section are shown.
  const subcats = categories.filter((c) =>
    articles.some((a) => a.category === category && a.status === "published" && a.subcategory === c.id)
  );

  const activeSub = sub ? categories.find((c) => c.slug === sub) : undefined;
  const activeSubName = activeSub ? bilingual(activeSub.name, activeSub.nameEn, lang).text : undefined;

  // Top level: only show articles that are NOT tucked into a sub-category
  // folder — otherwise they'd appear twice (once loose, once inside their
  // folder), which makes the section look cluttered/duplicated.
  // Inside a folder (activeSub set): show only that folder's articles.
  let list = articles.filter((a) => a.category === category && a.status === "published");
  if (activeSub) {
    list = list.filter((a) => a.subcategory === activeSub.id);
  } else {
    list = list.filter((a) => !a.subcategory);
  }
  list = [...list].sort((a, b) =>
    sort === "popular" ? b.views - a.views : b.publishDate.localeCompare(a.publishDate)
  );

  // At the top level, only render the tag bar / grid section when there's
  // something uncategorized to show, or when there are no folders at all
  // (fresh section with nothing organized yet) — otherwise the page would
  // show an empty "no data" box right under the folder cards for no reason.
  const showFlatSection = Boolean(activeSub) || list.length > 0 || subcats.length === 0;

  const totalInSection = articles.filter((a) => a.category === category && a.status === "published").length;

  // An empty section stays reachable by direct link but is kept out of search results.
  useEffect(() => {
    if (totalInSection > 0) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [totalInSection]);

  const heroCount = activeSub ? list.length : totalInSection;
  const folderCount = (id: string) => articles.filter((a) => a.category === category && a.status === "published" && a.subcategory === id).length;

  return (
    <div className="bg-[#F1F4F6] pb-12 dark:bg-slate-950">
      <header className="relative overflow-hidden bg-[#153448] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
        <div aria-hidden className="pointer-events-none absolute -top-20 end-[-5rem] h-64 w-64 rounded-full bg-[#168C91]/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-5 md:pb-10 md:pt-8">
          <div className="flex items-start justify-between gap-3">
            <nav aria-label="Breadcrumb" className="text-xs text-slate-300 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link to="/" className="hover:text-teal-200">{t("nav.home")}</Link></li>
                <li aria-hidden="true">/</li>
                {activeSub ? (
                  <>
                    <li><Link to={`/category/${category}`} className="hover:text-teal-200">{catLabel}</Link></li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page" className="font-semibold text-white">{activeSubName}</li>
                  </>
                ) : (
                  <li aria-current="page" className="font-semibold text-white">{catLabel}</li>
                )}
              </ol>
            </nav>
            <InlineLangToggle light />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/20 md:h-16 md:w-16 md:text-4xl" aria-hidden="true">{activeSub ? "📁" : CATEGORY_ICONS[category]}</span>
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight md:text-4xl">{activeSub ? activeSubName : catLabel}</h1>
              <p className="mt-1 text-sm text-teal-200">{heroCount} {t("common.item")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6">
        {!activeSub && category === "skills" && (
          <section className="mb-8">
            <h2 className="mb-3 border-s-4 border-[#168C91] ps-3 text-lg font-black text-[#153448] dark:text-white">{t("cat.protocolChecklists")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {SKILL_PROTOCOL_LINKS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group relative flex gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#153448] to-[#168C91] p-4 text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="text-3xl" aria-hidden="true">{s.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-bold">{bilingual(s.title, s.titleEn, lang).text}</span>
                    <span className="mt-1 block text-sm text-white/85">{bilingual(s.desc, s.descEn, lang).text}</span>
                    <span className="mt-2 inline-block text-sm font-bold text-teal-100 group-hover:underline">{t("cat.open")}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Real sub-category folders (top level only). Clicking one goes to /category/:cat/:sub. */}
        {!activeSub && subcats.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 border-s-4 border-[#168C91] ps-3 text-lg font-black text-[#153448] dark:text-white">{t("cat.subcategories")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {subcats.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${category}/${c.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 border-b-4 border-b-[#168C91] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-b-[#168C91] dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#168C91]/10 text-xl" aria-hidden="true">📁</span>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{bilingual(c.name, c.nameEn, lang).text}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{folderCount(c.id)} {t("common.item")}</div>
                    </div>
                  </div>
                  <span className="text-[#168C91]" aria-hidden="true">←</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {showFlatSection && (
          <section>
            {list.length > 1 && (
              <div className="mb-4 flex justify-end">
                <select aria-label="ترتيب النتائج" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#153448] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <option value="latest">{t("cat.sortLatest")}</option>
                  <option value="popular">{t("cat.sortPopular")}</option>
                </select>
              </div>
            )}

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">{t("common.noData")}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">{list.map((a) => <ArticleListCard key={a.id} a={a} />)}</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
