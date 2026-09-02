import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchPregnancyLactationSafety,
  type PregnancyLactationSafety,
} from "../lib/pregnancyLactationApi";

const CATEGORY_ORDER = [
  "مسكنات ومضادات التهاب",
  "مضادات حيوية",
  "مضادات التخثر",
  "أدوية القلب والضغط",
  "مضادات الصرع",
  "أدوية نفسية",
  "أدوية السكري والغدة",
  "أخرى عالية الخطورة",
];

function pregnancyTone(cat: string | null) {
  if (!cat) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (cat.includes("X")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (cat.includes("D")) return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300";
  if (cat.includes("C")) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function lactationTone(v: string | null) {
  if (!v) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (v.includes("يُمنع")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (v.includes("حذر")) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function DrugCard({ item, open, onToggle }: { item: PregnancyLactationSafety; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-right">
        <span className="text-slate-400 dark:text-slate-500">{open ? "▲" : "▼"}</span>
        <div className="flex-1">
          <div className="font-bold text-slate-800 dark:text-white">{item.drug_name}</div>
          {item.drug_class && <div className="text-xs text-slate-400 dark:text-slate-500">{item.drug_class}</div>}
        </div>
        <div className="flex flex-col gap-1 items-end">
          {item.pregnancy_category && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pregnancyTone(item.pregnancy_category)}`}>
              🤰 {item.pregnancy_category}
            </span>
          )}
          {item.lactation_safety && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lactationTone(item.lactation_safety)}`}>
              🤱 {item.lactation_safety}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {item.pregnancy_notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">🤰 أثناء الحمل</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.pregnancy_notes}</div>
            </div>
          )}
          {item.lactation_notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">🤱 أثناء الرضاعة</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.lactation_notes}</div>
            </div>
          )}
          {item.key_point && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-500/10 dark:border-amber-500/20">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">💡 نقطة مهمة</div>
              <div className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">{item.key_point}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PregnancyLactationPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<PregnancyLactationSafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPregnancyLactationSafety().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter(
      (i) =>
        i.drug_name.toLowerCase().includes(query) ||
        (i.drug_class || "").toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const cats = Array.from(new Set([...CATEGORY_ORDER, ...filtered.map((i) => i.category)]));
    return cats
      .map((cat) => ({ category: cat, drugs: filtered.filter((i) => i.category === cat) }))
      .filter((g) => g.drugs.length > 0);
  }, [filtered]);

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
      <div className="rounded-2xl bg-gradient-to-l from-pink-600 to-fuchsia-700 text-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🤰</span>
          <h1 className="text-xl font-bold">أمان الأدوية أثناء الحمل والرضاعة</h1>
        </div>
        <p className="opacity-90 text-xs">
          تصنيف الأدوية الأكثر شيوعًا حسب أمانها أثناء الحمل والرضاعة — مرجع تعليمي، القرار الطبي النهائي دائمًا لطبيب المريضة المعالج.
        </p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} دواء</p>
      </div>

      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن دواء أو فئة دوائية..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-pink-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
        ⓘ التصنيفات الحرفية (A/B/C/D/X) مبنية على نظام FDA الكلاسيكي الشائع تدريسه؛ راجعي دائمًا أحدث الإرشادات وأوامر الطبيب قبل أي قرار.
      </div>

      {grouped.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد أدوية مطابقة لبحثك.</div>
      )}

      {grouped.map((g) => (
        <div key={g.category} className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{g.category}</h2>
          <div className="space-y-3">
            {g.drugs.map((item) => (
              <DrugCard key={item.id} item={item} open={query ? true : openIds.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
