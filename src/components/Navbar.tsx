import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { useStore } from "../lib/store";
import { cn } from "../utils/cn";
import SmartSearch from "./SmartSearch";
import Logo from "./Logo";
import { useI18n, type TKey } from "../lib/i18n";
import { useFavorites } from "../lib/favorites";
import { useFeatures } from "../admin/cms/useFeatures";

// Map known menu paths to i18n keys so nav is fully translatable.
const PATH_LABELS: Record<string, TKey> = {
  "/": "nav.home",
  "/category/articles": "nav.articles",
  "/category/summaries": "nav.summaries",
  "/drugs": "nav.drugs",
  "/category/skills": "nav.skills",
  "/category/careplans": "nav.careplans",
  "/category/books": "nav.books",
  "/quizzes": "nav.quizzes",
  "/tools": "nav.tools",
  "/store": "nav.store",
};

// Map menu paths to feature flags so disabled modules hide from the nav.
const PATH_FEATURE: Record<string, keyof import("../lib/types").FeatureToggles> = {
  "/drugs": "drugGuide",
  "/quizzes": "exams",
  "/store": "store",
  "/category/books": "store",
  "/category/careplans": "carePlans",
};

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { menu } = useStore();
  const { t, lang, setLang } = useI18n();
  const { favorites } = useFavorites();
  const { features } = useFeatures();
  const favCount = favorites.length;
  const label = (m: { label: string; path: string }) => (PATH_LABELS[m.path] ? t(PATH_LABELS[m.path]) : m.label);
  const featureAllowed = (m: { path: string }) => {
    const flag = PATH_FEATURE[m.path];
    return flag ? features[flag] : true;
  };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const loc = useLocation();
  const nav = useNavigate();

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      nav(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/85 print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="shrink-0" aria-label="NurseHub Egypt">
          <Logo size={40} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menu.slice(0, 8).filter(featureAllowed).map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                loc.pathname === m.path
                  ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                   : "text-slate-600 hover:bg-slate-100 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {label(m)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden w-52 md:block"><SmartSearch /></div>

          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label="Language"
            title={t("lang.switch")}
            className="flex h-10 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white"
          >
            🌍 {lang === "ar" ? "EN" : "ع"}
          </button>

          <Link
            to="/favorites"
            aria-label="Favorites"
            title="المفضلة"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ❤️
            {favCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{favCount}</span>}
          </Link>

          <button
            onClick={toggle}
            aria-label="Theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <Link
            to="/admin"
            className="hidden rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:opacity-90 sm:block"
          >
            {t("nav.admin")}
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 lg:hidden dark:border-slate-700"
            aria-label="القائمة"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={doSearch} className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </form>
          <div className="grid grid-cols-2 gap-1">
            {menu.filter(featureAllowed).map((m) => (
              <Link
                key={m.path}
                to={m.path}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {label(m)}
              </Link>
            ))}
          </div>
          <Link to="/admin" onClick={() => setOpen(false)} className="mt-3 block rounded-lg bg-sky-500 py-2 text-center text-sm font-bold text-white">
            {t("nav.admin")}
          </Link>
        </div>
      )}
    </header>
  );
}
