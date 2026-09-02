import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { loadGlobalSearchData, searchGlobalDrugs, type GlobalSearchData, type SearchResult } from "../lib/globalDrugSearch";

export default function GlobalDrugSearchBar() {
  const { drugs } = useStore();
  const [data, setData] = useState<GlobalSearchData | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGlobalSearchData().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results: SearchResult[] = data ? searchGlobalDrugs(q, drugs, data) : [];

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث عن أي دواء في كل أقسام دليل الأدوية دفعة واحدة..."
          className="w-full rounded-2xl border-0 bg-white/95 py-3.5 pr-12 pl-4 text-slate-800 shadow-lg outline-none ring-2 ring-white/40 focus:ring-white placeholder:text-slate-400 dark:bg-slate-900/95 dark:text-white"
        />
        <span className="absolute right-4 top-4 text-slate-400">🔍</span>
      </div>

      {open && q.trim() && (
        <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
              {data ? "لا توجد نتائج مطابقة." : "جارِ تحميل بيانات البحث..."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((r) => (
                <Link
                  key={r.id}
                  to={r.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-xl shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{r.title}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{r.subtitle}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {r.sourceLabel}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
