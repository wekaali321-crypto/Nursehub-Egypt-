import { useEffect, useMemo, useState } from "react";
import {
  fetchOrganDoseAdjustments,
  type OrganDoseAdjustment,
  type OrganAdjustmentType,
} from "../lib/organDoseApi";

const TABS: { key: OrganAdjustmentType; label: string; icon: string }[] = [
  { key: "renal", label: "الفشل الكلوي", icon: "🫘" },
  { key: "hepatic", label: "الفشل الكبدي", icon: "🫀" },
];

function Row({ label, value, tone }: { label: string; value: string | null; tone?: "danger" | "info" }) {
  if (!value) return null;
  const toneClass =
    tone === "danger"
      ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300"
      : tone === "info"
      ? "bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300"
      : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs font-bold mb-1">{label}</div>
      <div className="text-sm leading-relaxed">{value}</div>
    </div>
  );
}

function DrugCard({ item, open, onToggle }: { item: OrganDoseAdjustment; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-right">
        <span className="text-slate-400 dark:text-slate-500">{open ? "▲" : "▼"}</span>
        <div className="flex-1">
          <div className="font-bold text-slate-800 dark:text-white">{item.drug_name}</div>
          {item.drug_class && <div className="text-xs text-slate-400 dark:text-slate-500">{item.drug_class}</div>}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <Row label="الجرعة الاعتيادية" value={item.normal_dose_note} />
          <Row label="القصور الخفيف" value={item.mild_adjustment} />
          <Row label="القصور المتوسط" value={item.moderate_adjustment} />
          <Row label="القصور الشديد" value={item.severe_adjustment} />
          <Row label="🚫 يُمنع" value={item.contraindicated} tone="danger" />
          <Row label="📊 المراقبة" value={item.monitoring_note} tone="info" />
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

export default function OrganDoseAdjustmentsPage() {
  const [items, setItems] = useState<OrganDoseAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrganAdjustmentType>("renal");
  const [q, setQ] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrganDoseAdjustments().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();
  const byTab = useMemo(() => items.filter((i) => i.adjustment_type === tab), [items, tab]);
  const filtered = useMemo(() => {
    if (!query) return byTab;
    return byTab.filter(
      (i) =>
        i.drug_name.toLowerCase().includes(query) ||
        (i.drug_class || "").toLowerCase().includes(query)
    );
  }, [byTab, query]);

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
      <div className="rounded-2xl bg-gradient-to-l from-amber-600 to-orange-700 text-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🫘</span>
          <h1 className="text-xl font-bold">تعديل الجرعات حسب وظائف الكلى والكبد</h1>
        </div>
        <p className="opacity-90 text-xs">
          إرشادات عملية لتعديل جرعات الأدوية الأكثر شيوعًا عند مرضى القصور الكلوي أو الكبدي — مرجع تعليمي، راجعي دائمًا بروتوكول مؤسستك وأوامر الطبيب.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.key
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن دواء أو فئة دوائية..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد أدوية مطابقة لبحثك.</div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <DrugCard key={item.id} item={item} open={query ? true : openIds.has(item.id)} onToggle={() => toggle(item.id)} />
        ))}
      </div>
    </div>
  );
}
