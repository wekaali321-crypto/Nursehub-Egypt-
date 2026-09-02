import { useEffect, useState } from "react";
import {
  fetchPregnancyLactationSafety,
  upsertPregnancyLactationSafety,
  deletePregnancyLactationSafety,
  type PregnancyLactationSafety,
} from "../lib/pregnancyLactationApi";

const EMPTY: PregnancyLactationSafety = {
  id: "",
  order_num: 0,
  drug_name: "",
  drug_class: "",
  category: "",
  pregnancy_category: "",
  pregnancy_notes: "",
  lactation_safety: "",
  lactation_notes: "",
  key_point: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function PregnancyLactationAdmin() {
  const [items, setItems] = useState<PregnancyLactationSafety[]>([]);
  const [editing, setEditing] = useState<PregnancyLactationSafety | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchPregnancyLactationSafety().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: PregnancyLactationSafety | null) {
    setEditing(item ? { ...item } : { ...EMPTY });
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.drug_name.trim() || !editing.category.trim()) {
      alert("لازم تحدد المعرف (id) واسم الدواء والفئة على الأقل.");
      return;
    }
    await upsertPregnancyLactationSafety(editing);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deletePregnancyLactationSafety(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة أمان الحمل والرضاعة ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-pink-600 text-white rounded-lg px-4 py-2">+ إضافة دواء</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{i.order_num}. {i.drug_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{i.category} — حمل: {i.pregnancy_category || "—"} / رضاعة: {i.lactation_safety || "—"}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(i)} className="text-pink-700 dark:text-pink-400 text-sm">تعديل</button>
                <button onClick={() => remove(i.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="id (فريد، إنجليزي)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })} className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })} className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم الدواء" value={editing.drug_name}
              onChange={(e) => setEditing({ ...editing, drug_name: e.target.value })} className={inp} />
            <input placeholder="الفئة الدوائية" value={editing.drug_class || ""}
              onChange={(e) => setEditing({ ...editing, drug_class: e.target.value })} className={inp} />
          </div>

          <input placeholder="فئة التصنيف (مثال: مسكنات ومضادات التهاب)" value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={`${inp} w-full`} />

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="تصنيف الحمل (مثال: B، C، D، X)" value={editing.pregnancy_category || ""}
              onChange={(e) => setEditing({ ...editing, pregnancy_category: e.target.value })} className={inp} />
            <input placeholder="أمان الرضاعة (آمن / يُستخدم بحذر / يُمنع)" value={editing.lactation_safety || ""}
              onChange={(e) => setEditing({ ...editing, lactation_safety: e.target.value })} className={inp} />
          </div>

          <textarea placeholder="ملاحظات الحمل" value={editing.pregnancy_notes || ""}
            onChange={(e) => setEditing({ ...editing, pregnancy_notes: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="ملاحظات الرضاعة" value={editing.lactation_notes || ""}
            onChange={(e) => setEditing({ ...editing, lactation_notes: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="نقطة مهمة" value={editing.key_point || ""}
            onChange={(e) => setEditing({ ...editing, key_point: e.target.value })} className={`${inp} w-full`} rows={2} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-pink-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
