import { SEARCH_DROPDOWN } from "../lib/searchDropdown";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";
import { loadGlobalSearchData, searchGlobalDrugs, type GlobalSearchData, type SearchResult } from "../lib/globalDrugSearch";

// English labels for the fixed (non-data) texts produced by globalDrugSearch.ts. Arabic text is untouched; anything not listed
// here (drug names, classes, categories coming from the data) is shown as stored.
const EN: Record<string, string> = {
  "الأدوية الرئيسية": "Main drugs",
  "العناية المركزة": "ICU",
  "الطوارئ": "Emergency",
  "الأطفال": "Pediatrics",
  "الأدوية عالية الخطورة": "High-alert drugs",
  "LASA": "LASA",
  "روشتات صيدلية": "Prescriptions",
  "تعديل الجرعات": "Dose adjustment",
  "الحمل والرضاعة": "Pregnancy & lactation",
  "توافق IV": "IV compatibility",
  "أدوية العناية المركزة": "ICU medications",
  "أدوية الطوارئ": "Emergency medications",
  "بروتوكولات الأطفال": "Pediatric protocols",
  "عالي الخطورة": "High alert",
  "متشابه الاسم (LASA)": "Look-alike / sound-alike (LASA)",
  "تعديل جرعة كلوي": "Renal dose adjustment",
  "تعديل جرعة كبدي": "Hepatic dose adjustment",
  "أمان الحمل والرضاعة": "Pregnancy & lactation safety",
  "توافق أدوية وريدية": "IV drug compatibility",
};

export default function GlobalDrugSearchBar() {
  const { lang } = useI18n();
  const tr = (s: string) => (lang === "en" ? EN[s] ?? s : s);
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
          placeholder={lang === "en" ? "Search any drug across the whole drug guide at once..." : "ابحث عن أي دواء في كل أقسام دليل الأدوية دفعة واحدة..."}
          className="w-full rounded-2xl border-0 bg-white/95 py-3.5 pr-12 pl-4 text-slate-800 shadow-lg outline-none ring-2 ring-white/40 focus:ring-white placeholder:text-slate-400 dark:bg-slate-900/95 dark:text-white"
        />
        <span className="absolute right-4 top-4 text-slate-500 dark:text-slate-400">🔍</span>
      </div>

      {open && q.trim() && (
        <div className={`${SEARCH_DROPDOWN} w-full`}>
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {data ? (lang === "en" ? "No matching results." : "لا توجد نتائج مطابقة.") : (lang === "en" ? "Loading search data..." : "جارِ تحميل بيانات البحث...")}
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
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{tr(r.subtitle)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {tr(r.sourceLabel)}
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
