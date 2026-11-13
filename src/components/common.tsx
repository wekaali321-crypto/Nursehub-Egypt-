import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { type Article, type Category } from "../lib/types";
import { useI18n, bilingual, type TKey } from "../lib/i18n";
import Icon, { type IconName } from "./Icon";
import OptimizedImage from "./OptimizedImage";

export const CAT_KEY: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", "infection-control": "nav.infectionControl",
  careplans: "nav.careplans", books: "nav.books",
};

export const CAT_ICON: Record<Category, IconName> = {
  articles: "article", summaries: "summary", drugs: "drug",
  skills: "skill", "infection-control": "shield",
  careplans: "careplan", books: "book",
};

/**
 * A Google AdSense ad unit. It renders NOTHING unless a real unit is configured:
 * a valid publisher id (Site Settings → AdSense) AND a numeric ad-slot id passed as `slot`.
 * (No placeholder boxes: visitors and Google reviewers must never see an "ad space" without an ad.)
 * The AdSense loader script itself lives once in index.html.
 */
declare global { interface Window { adsbygoogle?: unknown[] } }
export function AdSlot({ slot }: { slot?: string; label?: string; height?: string }) {
  const { settings } = useStore();
  const client = (settings.adsenseClient || "").trim();
  const valid = Boolean(settings.adsenseEnabled) && /^ca-pub-\d{16}$/.test(client) && !/^ca-pub-0+$/.test(client) && /^\d{6,}$/.test(slot || "");
  useEffect(() => {
    if (!valid) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* ad blockers / duplicate push */ }
  }, [valid]);
  if (!valid) return null;
  return <ins className="adsbygoogle block" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />;
}

export function Breadcrumbs({ items }: { items: { label: string; path?: string }[] }) {
  const { t } = useI18n();
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link to="/" className="hover:text-sky-500" aria-label={t("nav.home")}>{t("nav.home")}</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="text-slate-300" aria-hidden="true">/</span>
            {it.path
              ? <Link to={it.path} className="hover:text-sky-500">{it.label}</Link>
              : <span aria-current="page" className="font-semibold text-slate-700 dark:text-slate-200">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ArticleCard({ a }: { a: Article }) {
  const { t, lang } = useI18n();
  const title = bilingual(a.title, a.titleEn, lang).text;
  const excerpt = bilingual(a.excerpt, a.excerptEn, lang).text;
  return (
    <Link
      to={`/article/${a.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-500 group-hover:scale-105">
          <OptimizedImage src={a.cover} alt={title} width={600} ratio="16/10" />
        </div>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-sky-600 backdrop-blur dark:bg-slate-900/90">
          <Icon name={CAT_ICON[a.category]} size={13} /> {t(CAT_KEY[a.category])}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 font-bold leading-snug text-slate-900 group-hover:text-sky-600 dark:text-white">{title}</h3>
        <p className="mb-3 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{excerpt}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-1"><Icon name="user" size={12} /> {a.author}</span>
          <span className="inline-flex items-center gap-1"><Icon name="eye" size={13} /> {a.views.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</span>
        </div>
      </div>
    </Link>
  );
}

export function SectionTitle({ title, subtitle, link }: { title: string; subtitle?: string; link?: { label: string; to: string } }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {link && <Link to={link.to} className="shrink-0 text-sm font-bold text-sky-500 hover:underline">{link.label} ←</Link>}
    </div>
  );
}
