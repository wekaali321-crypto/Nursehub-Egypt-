import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchICUMedications, ICU_CATEGORY_ORDER, type ICUMedication } from "../lib/icuMedApi";
import { HighAlertBadges, parseHighAlertTypes } from "../lib/highAlert";
import CrossRefBox from "../components/CrossRefBox";

const CATEGORY_COLORS: Record<string, string> = {
  "أدوية الثلاجة": "from-cyan-500 to-blue-600",
  "الأدوية المخدرة": "from-indigo-500 to-violet-600",
  "مقويات التقلص العضلي (Inotropes)": "from-emerald-500 to-teal-600",
  "الكهارل المركزة (Concentrated Electrolytes)": "from-slate-500 to-slate-700",
  "الترياقات وحالات الطوارئ الخاصة (Antidotes & Special Emergencies)": "from-rose-500 to-pink-600",
  "المضادات الحيوية والمناعية الحرجة (Critical Antibiotics & Immunoglobulins)": "from-lime-600 to-green-700",
  "أدوية أخرى في العناية المركزة": "from-sky-500 to-blue-600",
};

function InfoBlock({ title, content }: { title: string; content?: string | null }) {
  if (!content) return null;
  return (
    <div className="mb-4">
      <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

function CalcBlock({ dose }: { dose: Record<string, string> | null }) {
  if (!dose) return null;
  return (
    <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 p-4 dark:bg-blue-500/10 dark:border-blue-500/20">
      <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">حساب الجرعة</h3>
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
        {Object.entries(dose).map(([k, v]) => (
          <p key={k}><span className="font-semibold">{k.replace(/_/g, " ")}: </span>{v}</p>
        ))}
      </div>
    </div>
  );
}

export function ICUMedicationsHome() {
  const [items, setItems] = useState<ICUMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchICUMedications().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  const query = q.trim().toLowerCase();
  const filtered = !query
    ? items
    : items.filter(
        (i) =>
          i.drug_name.toLowerCase().includes(query) ||
          (i.drug_class || "").toLowerCase().includes(query) ||
          (i.concentration || "").toLowerCase().includes(query)
      );

  const grouped = ICU_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    drugs: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.drugs.length > 0);

  return (
    <div dir="rtl" className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-cyan-600 to-blue-700 text-white p-6 mb-6">
        <h1 className="text-2xl font-bold mb-1">أدوية العناية المركزة</h1>
        <p className="opacity-90 text-sm">دليل شامل لأدوية وحدة العناية المركزة: التركيز، الاستعمالات، موانع الاستخدام، طريقة التحضير، وحساب الجرعات.</p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} دواء</p>
      </div>

      <div className="relative mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن دواء أو فئة..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-3 top-3 text-slate-400">🔍</span>
      </div>

      {grouped.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد أدوية مطابقة لبحثك.</div>
      )}

      {grouped.map((g) => (
        <div key={g.category} className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{g.category}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.drugs.map((d) => (
              <Link
                key={d.id}
                to={`/drugs/icu-medications/${d.id}`}
                className={`rounded-xl p-4 text-white bg-gradient-to-l ${CATEGORY_COLORS[g.category] || "from-blue-500 to-blue-700"} hover:opacity-90 transition`}
              >
                <div className="font-bold">{d.drug_name}</div>
                {d.concentration && <div className="text-xs opacity-90 mt-1">{d.concentration}</div>}
                {d.is_high_alert && (
                  <span className="inline-block mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5">عالي الخطورة</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ICUMedicationDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<ICUMedication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchICUMedications()
      .then((all) => setItem(all.find((i) => i.id === id) || null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;
  if (!item) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">لم يتم العثور على الدواء.</div>;

  const highAlertTypes = parseHighAlertTypes(item.high_alert_type);
  const showHighAlert = item.is_high_alert || highAlertTypes.length > 0;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/drugs/icu-medications" className="text-blue-600 text-sm mb-4 inline-block">→ العودة لأدوية العناية المركزة</Link>

      <div className="rounded-2xl bg-gradient-to-l from-cyan-600 to-blue-700 text-white p-6 mb-6">
        <h1 className="text-xl font-bold mb-1">{item.drug_name}</h1>
        {item.concentration && <p className="opacity-90 text-sm">{item.concentration}</p>}
        {item.drug_class && <p className="opacity-80 text-xs mt-1">{item.drug_class}</p>}
        {showHighAlert && (
          highAlertTypes.length > 0 ? (
            <div className="mt-3"><HighAlertBadges types={highAlertTypes} /></div>
          ) : (
            <span className="inline-block mt-3 text-xs bg-white/20 rounded-full px-3 py-1">⚠ دواء عالي الخطورة — يتطلب حذرًا إضافيًا</span>
          )
        )}
      </div>

      <CrossRefBox table="icu_medications" id={item.id} />

      {item.show_image && item.image_url && (
        <div className="mb-6 mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <img src={item.image_url} alt={item.drug_name} className="mx-auto max-h-80 w-auto rounded-2xl object-contain" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6 dark:bg-slate-900 dark:border-slate-800">
        <InfoBlock title="الاستعمالات" content={item.uses} />
        <InfoBlock title="موانع الاستخدام" content={item.contraindications} />
        <InfoBlock title="الأعراض الجانبية" content={item.side_effects} />
        <InfoBlock title="تنبيهات مهمة" content={item.warnings} />
        {item.preparation?.steps && (
          <div className="mb-4">
            <h3 className="font-bold text-slate-700 mb-1">طريقة التحضير</h3>
            <ul className="list-disc pr-5 space-y-1 text-slate-600">
              {item.preparation.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        <CalcBlock dose={item.dose_calculation} />
        <InfoBlock title="ملاحظات تمريضية" content={item.nursing_considerations} />
        <InfoBlock title="التخزين" content={item.storage_notes} />
      </div>
    </div>
  );
}
