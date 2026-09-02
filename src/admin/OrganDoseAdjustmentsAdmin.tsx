import { useEffect, useState } from "react";
import {
  fetchOrganDoseAdjustments,
  upsertOrganDoseAdjustment,
  deleteOrganDoseAdjustment,
  type OrganDoseAdjustment,
  type OrganAdjustmentType,
} from "../lib/organDoseApi";

const EMPTY: OrganDoseAdjustment = {
  id: "",
  order_num: 0,
  adjustment_type: "renal",
  drug_name: "",
  drug_class: "",
  normal_dose_note: "",
  mild_adjustment: "",
  moderate_adjustment: "",
  severe_adjustment: "",
  contraindicated: "",
  monitoring_note: "",
  key_point: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function OrganDoseAdjustmentsAdmin() {
  const [items, setItems] = useState<OrganDoseAdjustment[]>([]);
  const [editing, setEditing] = useState<OrganDoseAdjustment | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchOrganDoseAdjustments().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: OrganDoseAdjustment | null) {
    setEditing(item ? { ...item } : { ...EMPTY });
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.drug_name.trim()) {
      alert("لازم تحدد المعرف (id) واسم الدواء على الأقل.");
      return;
    }
    await upsertOrganDoseAdjustment(editing);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteOrganDoseAdjustment(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة تعديل الجرعات الكلوية/الكبدية ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-amber-600 text-white rounded-lg px-4 py-2">+ إضافة دواء</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">
                  {i.order_num}. {i.adjustment_type === "renal" ? "🫘 كلوي" : "🫀 كبدي"} — {i.drug_name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{i.drug_class}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(i)} className="text-amber-700 dark:text-amber-400 text-sm">تعديل</button>
                <button onClick={() => remove(i.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid sm:grid-cols-3 gap-3">
            <input placeholder="id (فريد، إنجليزي)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })} className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })} className={inp} />
            <select value={editing.adjustment_type}
              onChange={(e) => setEditing({ ...editing, adjustment_type: e.target.value as OrganAdjustmentType })}
              className={inp}>
              <option value="renal">🫘 كلوي</option>
              <option value="hepatic">🫀 كبدي</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم الدواء" value={editing.drug_name}
              onChange={(e) => setEditing({ ...editing, drug_name: e.target.value })} className={inp} />
            <input placeholder="الفئة الدوائية" value={editing.drug_class || ""}
              onChange={(e) => setEditing({ ...editing, drug_class: e.target.value })} className={inp} />
          </div>

          <textarea placeholder="الجرعة الاعتيادية" value={editing.normal_dose_note || ""}
            onChange={(e) => setEditing({ ...editing, normal_dose_note: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="تعديل القصور الخفيف" value={editing.mild_adjustment || ""}
            onChange={(e) => setEditing({ ...editing, mild_adjustment: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="تعديل القصور المتوسط" value={editing.moderate_adjustment || ""}
            onChange={(e) => setEditing({ ...editing, moderate_adjustment: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="تعديل القصور الشديد" value={editing.severe_adjustment || ""}
            onChange={(e) => setEditing({ ...editing, severe_adjustment: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="ممنوع عند... (اختياري)" value={editing.contraindicated || ""}
            onChange={(e) => setEditing({ ...editing, contraindicated: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="ملاحظات المراقبة" value={editing.monitoring_note || ""}
            onChange={(e) => setEditing({ ...editing, monitoring_note: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="نقطة مهمة" value={editing.key_point || ""}
            onChange={(e) => setEditing({ ...editing, key_point: e.target.value })} className={`${inp} w-full`} rows={2} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-amber-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
