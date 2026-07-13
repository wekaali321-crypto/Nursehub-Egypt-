import { Link } from "react-router-dom";
import type { Article } from "../lib/types";
import { useI18n } from "../lib/i18n";

/** Previous/Next article navigation, ordered by publish date within category. */
export default function ArticleNav({ prev, next }: { prev?: Article; next?: Article }) {
  const { t } = useI18n();
  if (!prev && !next) return null;

  return (
    <nav aria-label={`${t("article.prev")} / ${t("article.next")}`} className="mt-10 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/article/${prev.slug}`}
          className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="text-xs font-bold text-slate-400">◀ {t("article.prev")}</div>
          <div className="mt-1.5 line-clamp-2 font-bold text-slate-800 group-hover:text-sky-500 dark:text-white">{prev.title}</div>
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/article/${next.slug}`}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:text-right"
        >
          <div className="text-xs font-bold text-slate-400">{t("article.next")} ▶</div>
          <div className="mt-1.5 line-clamp-2 font-bold text-slate-800 group-hover:text-sky-500 dark:text-white">{next.title}</div>
        </Link>
      ) : <div />}
    </nav>
  );
}
