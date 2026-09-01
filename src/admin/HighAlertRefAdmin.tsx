import { useEffect, useState } from "react";
import {
  fetchHighAlertRef,
  upsertHighAlertRef,
  deleteHighAlertRef,
  type HighAlertRefCategory,
} from "../lib/highAlertRefApi";

const EMPTY: HighAlertRefCategory = {
  id: "",
  order_num: 0,
  icon: "⚠️",
  category_ar: "",
  category_en: "",
  drugs: [],
  safety_strategy: "",
  source: "ISMP — List of High-Alert Medications in Acute Care Settings",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function HighAlertRefAdmin() {
  const [items, setItems] = useState<HighAlertRefCategory[]>([]);
  const [editing, setEditing] = useState<HighAlertRefCategory | null>(null);
  const [drugRows, setDrugRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchHighAlertRef().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: HighAlertRefCategory | null) {
    const target = item ? { ...item } : { ...EMPTY };
    setEditing(target);
    setDrugRows(target.drugs ? [...target.drugs] : []);
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.category_ar.trim()) {
      alert("لازم تحدد المعرف (id) واسم الفئة على الأقل.");
      return;
    }
    await upsertHighAlertRef({
      ...editing,
      drugs: drugRows.filter((d) => d.trim()),
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteHighAlertRef(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة الأدوية عالية التنبيه ({items.length} فئة)</h1>
        <button onClick={() => startEdit(null)} className="bg-red-600 text-white rounded-lg px-4 py-2">+ إضافة فئة</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{i.order_num}. {i.icon} {i.category_ar}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{i.drugs.length} دواء</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(i)} className="text-red-600 text-sm">تعديل</button>
                <button onClick={() => remove(i.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid sm:grid-cols-3 gap-3">
            <input placeholder="id (فريد، إنجليزي — مثال ha20)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })}
              className={inp} />
            <input placeholder="الأيقونة (إيموجي)" value={editing.icon || ""}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم الفئة بالعربي" value={editing.category_ar}
              onChange={(e) => setEditing({ ...editing, category_ar: e.target.value })}
              className={inp} />
            <input placeholder="اسم الفئة بالإنجليزي (اختياري)" value={editing.category_en || ""}
              onChange={(e) => setEditing({ ...editing, category_en: e.target.value })}
              className={inp} />
          </div>

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">الأدوية</div>
            {drugRows.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={d} onChange={(e) => {
                  const next = [...drugRows]; next[i] = e.target.value; setDrugRows(next);
                }} className={`${inp} flex-1`} />
                <button onClick={() => setDrugRows(drugRows.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
              </div>
            ))}
            <button onClick={() => setDrugRows([...drugRows, ""])} className="text-red-600 text-sm">+ إضافة دواء</button>
          </div>

          <textarea placeholder="استراتيجية الأمان" value={editing.safety_strategy || ""}
            onChange={(e) => setEditing({ ...editing, safety_strategy: e.target.value })}
            className={`${inp} w-full`} rows={3} />

          <input placeholder="المصدر" value={editing.source || ""}
            onChange={(e) => setEditing({ ...editing, source: e.target.value })}
            className={`${inp} w-full`} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-red-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
