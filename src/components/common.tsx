import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { type Article, type Category } from "../lib/types";
import { useI18n, bilingual, type TKey } from "../lib/i18n";
import Icon, { type IconName } from "./Icon";
import OptimizedImage from "./OptimizedImage";

const CAT_KEY: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", careplans: "nav.careplans", books: "nav.books",
};

export const CAT_ICON: Record<Category, IconName> = {
  articles: "article", summaries: "summary", drugs: "drug",
  skills: "skill", careplans: "careplan", books: "book",
};

export function AdSlot({ label = "مساحة إعلانية", height = "h-28" }: { label?: string; height?: string }) {
  const { settings } = useStore();
  return (
    <div className={`flex ${height} w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800/50`}>
      <div>
        <div className="text-2xl">📢</div>
        {label}
        {settings.adsenseEnabled && <div className="text-[10px] text-emerald-500">AdSense: {settings.adsenseClient}</div>}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; path?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link to="/" className="hover:text-sky-500" aria-label="الرئيسية">الرئيسية</Link></li>
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
