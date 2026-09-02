import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchHighAlertRef, type HighAlertRefCategory } from "../lib/highAlertRefApi";

function CategoryCard({
  cat,
  open,
  onToggle,
  highlightDrugs,
}: {
  cat: HighAlertRefCategory;
  open: boolean;
  onToggle: () => void;
  highlightDrugs: string[] | null;
}) {
  const drugsToShow = highlightDrugs ?? cat.drugs;
  return (
    <div className="rounded-2xl border border-red-100 bg-white overflow-hidden dark:bg-slate-900 dark:border-red-500/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-right"
      >
        <span className="text-xl">{open ? "▲" : "▼"}</span>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-800 dark:text-white">{cat.category_ar}</div>
            {cat.category_en && (
              <div className="text-xs text-slate-400 dark:text-slate-500">{cat.category_en}</div>
            )}
            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">{cat.drugs.length} دواء</div>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-2xl dark:bg-red-500/10">
            {cat.icon || "⚠️"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">💊 الأدوية</div>
            <ul className="space-y-1.5">
              {drugsToShow.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {cat.safety_strategy && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 dark:bg-red-500/10 dark:border-red-500/20">
              <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">🛡 استراتيجية الأمان</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{cat.safety_strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HighAlertRefPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<HighAlertRefCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHighAlertRef().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return items.map((c) => ({ cat: c, matchDrugs: null as string[] | null }));
    return items
      .map((c) => {
        const catMatch =
          c.category_ar.toLowerCase().includes(query) ||
          (c.category_en || "").toLowerCase().includes(query);
        const matchingDrugs = c.drugs.filter((d) => d.toLowerCase().includes(query));
        if (catMatch) return { cat: c, matchDrugs: null as string[] | null };
        if (matchingDrugs.length) return { cat: c, matchDrugs: matchingDrugs };
        return null;
      })
      .filter((x): x is { cat: HighAlertRefCategory; matchDrugs: string[] | null } => x !== null);
  }, [items, query]);

  const totalDrugs = items.reduce((sum, c) => sum + c.drugs.length, 0);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-red-600 to-orange-600 text-white p-6 mb-4 flex items-center gap-2">
        <span className="text-2xl">⚠️</span>
        <div>
          <h1 className="text-xl font-bold">الأدوية عالية التنبيه</h1>
          <p className="opacity-90 text-xs mt-0.5">مبني على قائمة ISMP العالمية لأدوية عالية الخطورة</p>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن دواء أو فئة..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-red-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      <div className="rounded-2xl bg-gradient-to-l from-red-600 to-rose-700 text-white p-5 mb-4">
        <div className="flex items-center gap-2 font-bold mb-2">
          <span className="text-xl">⚠️</span>
          أدوية تتطلب حذراً خاصاً
        </div>
        <div className="flex gap-4 text-sm opacity-95">
          <span>📂 {items.length} فئة</span>
          <span>💊 {totalDrugs} دواء</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
        ⓘ مرجع تعليمي مبني على ISMP List of High-Alert Medications in Acute Care Settings. تحقّقي دائماً من بروتوكول مؤسستك وأوامر الطبيب. هذه الأدوية تسبب أذىً خطيراً عند الخطأ في استخدامها.
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد نتائج مطابقة لبحثك.</div>
      )}

      <div className="space-y-3">
        {filtered.map(({ cat, matchDrugs }) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            open={query ? true : openIds.has(cat.id)}
            onToggle={() => toggle(cat.id)}
            highlightDrugs={matchDrugs}
          />
        ))}
      </div>
    </div>
  );
}
