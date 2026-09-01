import { useEffect, useState } from "react";
import {
  fetchRxPrescriptions,
  upsertRxPrescription,
  deleteRxPrescription,
  RX_CATEGORY_ORDER,
  type RxPrescription,
  type RxItem,
} from "../lib/rxApi";

const EMPTY: RxPrescription = {
  id: "",
  order_num: 0,
  category: RX_CATEGORY_ORDER[0],
  condition_ar: "",
  condition_en: "",
  doctor_name: "",
  items: [],
  clinical_note: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function RxPrescriptionsAdmin() {
  const [items, setItems] = useState<RxPrescription[]>([]);
  const [editing, setEditing] = useState<RxPrescription | null>(null);
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchRxPrescriptions().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(rx: RxPrescription | null) {
    const target = rx ? { ...rx } : { ...EMPTY };
    setEditing(target);
    setRxItems(target.items ? [...target.items] : []);
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.condition_ar.trim()) {
      alert("لازم تحدد المعرف (id) واسم الحالة على الأقل.");
      return;
    }
    await upsertRxPrescription({
      ...editing,
      items: rxItems.filter((it) => it.drug_name.trim()),
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteRxPrescription(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة الروشتات ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-emerald-600 text-white rounded-lg px-4 py-2">+ إضافة روشتة</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{r.order_num}. {r.condition_ar}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{r.category} — {r.items.length} دواء</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(r)} className="text-emerald-700 dark:text-emerald-400 text-sm">تعديل</button>
                <button onClick={() => remove(r.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="id (فريد، إنجليزي، بدون مسافات)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })}
              className={inp} />
          </div>

          <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            className={`${inp} w-full`}>
            {RX_CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم الحالة بالعربي" value={editing.condition_ar}
              onChange={(e) => setEditing({ ...editing, condition_ar: e.target.value })}
              className={inp} />
            <input placeholder="اسم الحالة بالإنجليزي (اختياري)" value={editing.condition_en || ""}
              onChange={(e) => setEditing({ ...editing, condition_en: e.target.value })}
              className={inp} />
          </div>

          <input placeholder="اسم الطبيب كما في المصدر (اختياري)" value={editing.doctor_name || ""}
            onChange={(e) => setEditing({ ...editing, doctor_name: e.target.value })}
            className={`${inp} w-full`} />

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">الأدوية (Rx)</div>
            {rxItems.map((it, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 mb-2 space-y-1">
                <input placeholder="اسم الدواء" value={it.drug_name} onChange={(e) => {
                  const next = [...rxItems]; next[i] = { ...next[i], drug_name: e.target.value }; setRxItems(next);
                }} className={`${inp} w-full`} />
                <input placeholder="الجرعة / طريقة الاستخدام" value={it.dose || ""} onChange={(e) => {
                  const next = [...rxItems]; next[i] = { ...next[i], dose: e.target.value }; setRxItems(next);
                }} className={`${inp} w-full`} />
                <div className="flex gap-2">
                  <input placeholder="ملاحظة إضافية (اختياري)" value={it.note || ""} onChange={(e) => {
                    const next = [...rxItems]; next[i] = { ...next[i], note: e.target.value }; setRxItems(next);
                  }} className={`${inp} flex-1`} />
                  <button onClick={() => setRxItems(rxItems.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
                </div>
              </div>
            ))}
            <button onClick={() => setRxItems([...rxItems, { drug_name: "", dose: "", note: "" }])} className="text-emerald-700 dark:text-emerald-400 text-sm">+ إضافة دواء</button>
          </div>

          <textarea placeholder="ملاحظات إكلينيكية عامة" value={editing.clinical_note || ""}
            onChange={(e) => setEditing({ ...editing, clinical_note: e.target.value })}
            className={`${inp} w-full`} rows={3} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-emerald-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
