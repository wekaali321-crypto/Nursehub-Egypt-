import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Shared hub list used by every section home page.
 * One view preference (compact rows / cards) is remembered for the whole site.
 * Arabic title on the start side, English name on the opposite side of the same row.
 */
export type HubItem = {
  id: string;
  to: string;
  icon: string;
  title: string;
  titleEn?: string | null;
  category?: string | null;
  summary?: string | null;
  count?: number;
};
type Accent = "teal" | "violet" | "amber" | "rose" | "sky" | "emerald" | "red" | "pink" | "indigo" | "orange" | "cyan" | "purple" | "blue";

const ACC: Record<Accent, { text: string; chip: string; grad: string; hover: string }> = {
  teal: { text: "text-teal-700 dark:text-teal-300", chip: "bg-teal-50 text-teal-700 dark:text-teal-300 dark:bg-teal-500/10", grad: "from-teal-500 to-emerald-500", hover: "group-hover:text-teal-600" },
  violet: { text: "text-violet-600", chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10", grad: "from-violet-600 to-fuchsia-500", hover: "group-hover:text-violet-600" },
  amber: { text: "text-amber-700 dark:text-amber-300", chip: "bg-amber-50 text-amber-700 dark:text-amber-300 dark:bg-amber-500/10", grad: "from-amber-500 to-orange-500", hover: "group-hover:text-amber-700" },
  rose: { text: "text-rose-700 dark:text-rose-300", chip: "bg-rose-50 text-rose-700 dark:text-rose-300 dark:bg-rose-500/10", grad: "from-rose-500 to-pink-500", hover: "group-hover:text-rose-600" },
  sky: { text: "text-sky-600", chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10", grad: "from-sky-500 to-cyan-500", hover: "group-hover:text-sky-600" },
  emerald: { text: "text-emerald-700 dark:text-emerald-300", chip: "bg-emerald-50 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/10", grad: "from-emerald-500 to-teal-500", hover: "group-hover:text-emerald-600" },
  red: { text: "text-red-700 dark:text-red-300", chip: "bg-red-50 text-red-700 dark:text-red-300 dark:bg-red-500/10", grad: "from-red-600 to-rose-500", hover: "group-hover:text-red-700" },
  pink: { text: "text-pink-600", chip: "bg-pink-50 text-pink-700 dark:bg-pink-500/10", grad: "from-pink-500 to-rose-500", hover: "group-hover:text-pink-600" },
  indigo: { text: "text-indigo-600", chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10", grad: "from-indigo-500 to-violet-500", hover: "group-hover:text-indigo-600" },
  orange: { text: "text-orange-700 dark:text-orange-300", chip: "bg-orange-50 text-orange-700 dark:text-orange-300 dark:bg-orange-500/10", grad: "from-orange-500 to-amber-500", hover: "group-hover:text-orange-600" },
  cyan: { text: "text-cyan-700 dark:text-cyan-300", chip: "bg-cyan-50 text-cyan-700 dark:text-cyan-300 dark:bg-cyan-500/10", grad: "from-cyan-500 to-sky-500", hover: "group-hover:text-cyan-600" },
  blue: { text: "text-blue-600", chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/10", grad: "from-blue-500 to-indigo-500", hover: "group-hover:text-blue-600" },
  purple: { text: "text-purple-600", chip: "bg-purple-50 text-purple-700 dark:bg-purple-500/10", grad: "from-purple-500 to-fuchsia-500", hover: "group-hover:text-purple-600" },
};

const KEY = "nh_dis_view";
export function useHubView(): ["compact" | "cards", (m: "compact" | "cards") => void] {
  const [v, setV] = useState<"compact" | "cards">(() => {
    try { return localStorage.getItem(KEY) === "cards" ? "cards" : "compact"; } catch { return "compact"; }
  });
  return [v, (m) => { setV(m); try { localStorage.setItem(KEY, m); } catch { /* ignore */ } }];
}

export function ViewToggle({ view, onChange, isEn, count }: { view: "compact" | "cards"; onChange: (m: "compact" | "cards") => void; isEn: boolean; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
      <span className="font-bold">{count != null ? `${count} ${isEn ? "topics" : "موضوع"}` : ""}</span>
      <div className="inline-flex overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
        {(["compact", "cards"] as const).map((m) => (
          <button key={m} onClick={() => onChange(m)} className={`px-3 py-1 font-bold ${view === m ? "bg-teal-700 text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>
            {m === "compact" ? (isEn ? "☰ Compact" : "☰ مضغوط") : isEn ? "▦ Cards" : "▦ كروت"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HubGrid({ items, accent = "teal", isEn }: { items: HubItem[]; accent?: Accent; isEn: boolean }) {
  const [view, setView] = useHubView();
  const a = ACC[accent] ?? ACC.teal;
  return (
    <div>
      <ViewToggle view={view} onChange={setView} isEn={isEn} count={items.length} />
      {view === "compact" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.id} to={it.to} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition hover:border-teal-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${a.grad} text-lg text-white`}>{it.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`line-clamp-2 text-sm font-black leading-5 text-slate-900 dark:text-white ${a.hover}`}>{isEn && it.titleEn ? it.titleEn : it.title}</span>
                  {!isEn && it.titleEn && <span dir="ltr" className="max-w-[40%] shrink-0 truncate text-[13px] font-black text-slate-600 dark:text-slate-300">{it.titleEn}</span>}
                </span>
                {(it.category || it.count != null) && (
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{it.category}{it.count != null ? `${it.category ? " · " : ""}${it.count} ${isEn ? "sections" : "أقسام"}` : ""}</span>
                )}
              </span>
              <span className="shrink-0 text-slate-300 group-hover:text-teal-500">{isEn ? "›" : "‹"}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.id} to={it.to} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className={`flex h-20 items-end justify-between bg-gradient-to-br ${a.grad} p-4 text-white`}>
                <span className="text-4xl drop-shadow">{it.icon}</span>
                {it.category && <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-black backdrop-blur">{it.category}</span>}
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`font-black leading-snug text-slate-900 dark:text-white ${a.hover}`}>{isEn && it.titleEn ? it.titleEn : it.title}</h3>
                  {!isEn && it.titleEn && <span dir="ltr" className="max-w-[42%] shrink-0 truncate text-sm font-black text-slate-600 dark:text-slate-300">{it.titleEn}</span>}
                </div>
                {it.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{it.summary}</p>}
                {it.count != null && <div className={`mt-3 text-xs font-bold ${a.text}`}>{it.count} {isEn ? "sections" : "أقسام"} {isEn ? "→" : "←"}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
