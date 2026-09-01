import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRxPrescriptions, RX_CATEGORY_ORDER, type RxPrescription } from "../lib/rxApi";

function DisclaimerBanner() {
  return (
    <div dir="rtl" className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
      ⚠ برجاء المراجعة قبل تطبيق أي من هذه الوصفات — المحتوى هنا لأغراض تعليمية للتمريض وليس بديلاً عن تقييم الطبيب واستشارته.
    </div>
  );
}

export function RxPrescriptionsHome() {
  const [items, setItems] = useState<RxPrescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRxPrescriptions().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  const grouped = RX_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    rx: items.filter((i) => i.category === cat),
  })).filter((g) => g.rx.length > 0);

  // أي فئة موجودة في البيانات ومش في الترتيب المعرّف، تتضاف في الآخر بدل ما تختفي
  const knownCats = new Set(RX_CATEGORY_ORDER);
  const extra = Array.from(new Set(items.filter((i) => !knownCats.has(i.category)).map((i) => i.category)))
    .map((cat) => ({ category: cat, rx: items.filter((i) => i.category === cat) }));

  const allGroups = [...grouped, ...extra];

  return (
    <div dir="rtl" className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 text-white p-6 mb-6">
        <h1 className="text-2xl font-bold mb-1">روشتات صيدلية</h1>
        <p className="opacity-90 text-sm">مرجع تعليمي لأشهر الروشتات الطبية حسب الحالة — بشكل الروشتة الحقيقية.</p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} روشتة</p>
      </div>

      <DisclaimerBanner />

      {allGroups.map((g) => (
        <div key={g.category} className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{g.category}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.rx.map((r) => (
              <Link
                key={r.id}
                to={`/drugs/prescriptions/${r.id}`}
                className="rounded-xl p-4 bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="font-bold text-slate-800 dark:text-white">{r.condition_ar}</div>
                {r.condition_en && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.condition_en}</div>}
                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">{r.items.length} دواء</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RxPrescriptionDetail() {
  const { id } = useParams();
  const [rx, setRx] = useState<RxPrescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchRxPrescriptions()
      .then((all) => setRx(all.find((r) => r.id === id) || null))
      .catch(() => setRx(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;
  if (!rx) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">لم يتم العثور على الروشتة.</div>;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/drugs/prescriptions" className="text-emerald-700 dark:text-emerald-400 text-sm mb-4 inline-block">→ العودة لكل الروشتات</Link>

      <DisclaimerBanner />

      {/* بطاقة الروشتة نفسها — مصممة بشكل روشتة حقيقية */}
      <div className="bg-white rounded-2xl border-2 border-emerald-700/20 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-emerald-500/20">
        {/* رأس الروشتة */}
        <div className="bg-emerald-50 border-b-2 border-dashed border-emerald-700/30 p-5 flex items-start justify-between dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide mb-1">{rx.category}</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{rx.condition_ar}</h1>
            {rx.condition_en && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rx.condition_en}</p>}
          </div>
          <div className="text-4xl text-emerald-700 dark:text-emerald-400 font-serif leading-none">℞</div>
        </div>

        {/* قائمة الأدوية */}
        <div className="p-5 space-y-4">
          {rx.items.map((it, idx) => (
            <div key={idx} className="border-b border-dotted border-slate-200 dark:border-slate-700 pb-3 last:border-0">
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{idx + 1}.</span>
                <span className="font-semibold text-slate-800 dark:text-white">{it.drug_name}</span>
              </div>
              {it.dose && <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 pr-5 leading-relaxed">{it.dose}</p>}
              {it.note && <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 pr-5 italic">{it.note}</p>}
            </div>
          ))}
        </div>

        {/* ملاحظات إكلينيكية */}
        {rx.clinical_note && (
          <div className="mx-5 mb-5 rounded-lg bg-slate-50 border border-slate-200 p-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ملاحظات</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rx.clinical_note}</p>
          </div>
        )}

        {/* توقيع الطبيب */}
        <div className="border-t-2 border-dashed border-emerald-700/30 dark:border-emerald-500/20 p-5 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div className="text-xs text-slate-400 dark:text-slate-500">مرجع تعليمي — ليس بديلاً عن استشارة الطبيب</div>
          {rx.doctor_name && (
            <div className="text-sm text-slate-600 dark:text-slate-300 font-serif italic">{rx.doctor_name}</div>
          )}
        </div>
      </div>
    </div>
  );
}
