import { Link } from "react-router-dom";
import type { Article } from "../lib/types";
import { readingTime } from "../lib/store";
import { useI18n, bilingual } from "../lib/i18n";
import { CAT_ICON, CAT_KEY } from "./common";
import Icon from "./Icon";
import OptimizedImage from "./OptimizedImage";

/**
 * Navy/Teal article card for article-section listings (category pages, related articles).
 * Compact horizontal layout on mobile, vertical card from md up. Self-contained styling;
 * the older shared ArticleCard is left untouched for the other pages that use it.
 */
export default function ArticleListCard({ a }: { a: Article }) {
  const { t, lang } = useI18n();
  const title = bilingual(a.title, a.titleEn, lang).text;
  const excerpt = bilingual(a.excerpt, a.excerptEn, lang).text;
  const mins = readingTime(a.content);
  const cat = t(CAT_KEY[a.category]);
  return (
    <Link
      to={`/article/${a.slug}`}
      className="group flex overflow-hidden rounded-2xl border border-slate-200 border-b-4 border-b-[#168C91] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-b-[#168C91] dark:bg-slate-900 md:flex-col"
    >
      <div className="relative w-32 shrink-0 self-stretch overflow-hidden sm:w-40 md:w-full md:self-auto">
        <div className="h-full min-h-[8.5rem] transition-transform duration-500 group-hover:scale-105 max-md:[&>div]:!absolute max-md:[&>div]:inset-0 max-md:[&>div]:!aspect-auto md:h-auto md:min-h-0 md:aspect-[16/10]">
          {a.cover ? (
            <OptimizedImage src={a.cover} alt={title} width={600} ratio="16/10" className="md:!h-full" />
          ) : (
            <div role="img" aria-label={title} className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#153448] via-[#1b5a73] to-[#168C91] text-white">
              <span className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25"><Icon name={CAT_ICON[a.category]} size={24} /></span>
            </div>
          )}
        </div>
        <span className="absolute start-2 top-2 hidden items-center gap-1 rounded-full bg-[#153448]/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur md:inline-flex">
          <Icon name={CAT_ICON[a.category]} size={12} /> {cat}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-4">
        <span className="mb-1 inline-flex w-fit items-center gap-1 text-[11px] font-bold text-[#168C91] dark:text-teal-300 md:hidden">
          <Icon name={CAT_ICON[a.category]} size={12} /> {cat}
        </span>
        <h3 className="line-clamp-2 font-black leading-snug text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{title}</h3>
        {excerpt && <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{excerpt}</p>}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><Icon name="clock" size={13} /> {mins.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} {t("article.readingTime")}</span>
          <span className="font-bold text-[#168C91] dark:text-teal-300">{lang === "ar" ? "اقرأ المقال ←" : "Read →"}</span>
        </div>
      </div>
    </Link>
  );
}
