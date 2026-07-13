import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_LABELS } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { logSearch } from "../lib/analytics";

interface Suggestion {
  label: string;
  sub: string;
  to: string;
  icon: string;
}

export default function SmartSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { articles, drugs } = useStore();
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const nav = useNavigate();
  const blurTimer = useRef<number | undefined>(undefined);
  const searchLogged = useRef<string>("");

  // Instant search across titles, tags, and full body text (Arabic + English,
  // so medical terminology in either language surfaces real matches).
  const suggestions = useMemo<Suggestion[]>(() => {
    if (q.trim().length < 1) return [];
    const lower = q.toLowerCase();
    const fromArticles: Suggestion[] = articles
      .filter((a) => a.status === "published" && [a.title, a.titleEn, a.excerpt, a.content, a.contentEn, ...a.tags].filter(Boolean).join(" ").toLowerCase().includes(lower))
      .slice(0, 5)
      .map((a) => ({ label: a.title, sub: CATEGORY_LABELS[a.category], to: `/article/${a.slug}`, icon: a.category === "books" ? "📖" : "📝" }));
    const fromDrugs: Suggestion[] = drugs
      .filter((d) => (d.name + d.genericName + d.drugClass + d.indications).toLowerCase().includes(lower))
      .slice(0, 3)
      .map((d) => ({ label: d.name, sub: "دواء • " + d.category, to: `/drug/${d.slug}`, icon: "💊" }));
    const results = [...fromDrugs, ...fromArticles].slice(0, 7);

    // Log real search analytics once per distinct query (debounced by ref, not per keystroke render).
    if (q.trim().length >= 3 && searchLogged.current !== lower) {
      searchLogged.current = lower;
      logSearch(q.trim(), results.length, "instant", lang);
    }
    return results;
  }, [q, articles, drugs, lang]);

  const go = (to: string) => {
    setQ(""); setOpen(false); onNavigate?.();
    nav(to);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions[active]) go(suggestions[active].to);
    else if (q.trim()) go(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={submit}>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
            onFocus={() => setOpen(true)}
            onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 150); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, suggestions.length - 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            }}
            placeholder="بحث..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm outline-none transition-all focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div
          onMouseDown={() => window.clearTimeout(blurTimer.current)}
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => go(s.to)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-right ${i === active ? "bg-sky-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold dark:text-white">{s.label}</span>
                <span className="block text-xs text-slate-400">{s.sub}</span>
              </span>
            </button>
          ))}
          <button onMouseDown={() => go(`/search?q=${encodeURIComponent(q)}`)} className="block w-full bg-slate-50 px-4 py-2 text-center text-xs font-bold text-sky-500 dark:bg-slate-800">
            عرض كل النتائج عن "{q}" ←
          </button>
        </div>
      )}
    </div>
  );
}
