import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchIVCompatibility, type IVCompatibilityPair, type IVCompatibilityStatus } from "../lib/ivCompatibilityApi";

const STATUS_META: Record<IVCompatibilityStatus, { label: string; icon: string; tone: string }> = {
  compatible: {
    label: "متوافق",
    icon: "✅",
    tone: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  },
  incompatible: {
    label: "غير متوافق",
    icon: "🚫",
    tone: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",
  },
  consult: {
    label: "استشيري الصيدلي",
    icon: "❓",
    tone: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",
  },
};

function PairCard({ item }: { item: IVCompatibilityPair }) {
  const meta = STATUS_META[item.status];
  return (
    <div className={`rounded-2xl border p-4 ${meta.tone}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-bold text-slate-800 dark:text-white text-sm leading-relaxed">
          {item.drug_a} <span className="text-slate-400 dark:text-slate-500">+</span> {item.drug_b}
        </div>
        <span className="shrink-0 rounded-full bg-white/70 dark:bg-slate-900/60 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
          {meta.icon} {meta.label}
        </span>
      </div>
      {item.reason && <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-1">{item.reason}</p>}
      {item.nursing_action && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-bold">💡 الإجراء التمريضي: </span>{item.nursing_action}
        </p>
      )}
    </div>
  );
}

export default function IVCompatibilityPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<IVCompatibilityPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");

  useEffect(() => {
    fetchIVCompatibility().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter(
      (i) => i.drug_a.toLowerCase().includes(query) || i.drug_b.toLowerCase().includes(query)
    );
  }, [items, query]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-700 text-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🧫</span>
          <h1 className="text-xl font-bold">توافق الأدوية الوريدية (IV Compatibility)</h1>
        </div>
        <p className="opacity-90 text-xs">
          نسخة مبسطة تغطي أشهر أزواج أدوية العناية المركزة والطوارئ عند التسريب المشترك (Y-site) — مرجع تعليمي أساسي وليس بديلاً عن دليل التوافق الكامل أو استشارة الصيدلي.
        </p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} زوج</p>
      </div>

      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن اسم دواء..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
        ⓘ هذه قائمة مبسّطة لأشهر الأزواج شيوعًا في التدريب السريري — دليل التوافق الكامل يضم آلاف التوافقات الثنائية، فراجعي دائمًا دليل مؤسستك المعتمد (مثل Trissel's) أو استشيري الصيدلي الإكلينيكي قبل أي خلط فعلي.
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد نتائج مطابقة لبحثك.</div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <PairCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
