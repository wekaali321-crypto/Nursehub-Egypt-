import { useEffect, useState } from "react";
import {
  fetchIVCompatibility,
  upsertIVCompatibility,
  deleteIVCompatibility,
  type IVCompatibilityPair,
  type IVCompatibilityStatus,
} from "../lib/ivCompatibilityApi";

const EMPTY: IVCompatibilityPair = {
  id: "",
  order_num: 0,
  drug_a: "",
  drug_b: "",
  status: "incompatible",
  reason: "",
  nursing_action: "",
  source: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function IVCompatibilityAdmin() {
  const [items, setItems] = useState<IVCompatibilityPair[]>([]);
  const [editing, setEditing] = useState<IVCompatibilityPair | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchIVCompatibility().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: IVCompatibilityPair | null) {
    setEditing(item ? { ...item } : { ...EMPTY });
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.drug_a.trim() || !editing.drug_b.trim()) {
      alert("لازم تحدد المعرف (id) واسمي الدواءين على الأقل.");
      return;
    }
    await upsertIVCompatibility(editing);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteIVCompatibility(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة توافق الأدوية الوريدية ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-indigo-600 text-white rounded-lg px-4 py-2">+ إضافة زوج</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{i.order_num}. {i.drug_a} + {i.drug_b}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {i.status === "compatible" ? "✅ متوافق" : i.status === "incompatible" ? "🚫 غير متوافق" : "❓ استشيري الصيدلي"}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(i)} className="text-indigo-700 dark:text-indigo-400 text-sm">تعديل</button>
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
            <select value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as IVCompatibilityStatus })}
              className={inp}>
              <option value="compatible">✅ متوافق</option>
              <option value="incompatible">🚫 غير متوافق</option>
              <option value="consult">❓ استشيري الصيدلي</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="الدواء الأول" value={editing.drug_a}
              onChange={(e) => setEditing({ ...editing, drug_a: e.target.value })} className={inp} />
            <input placeholder="الدواء الثاني" value={editing.drug_b}
              onChange={(e) => setEditing({ ...editing, drug_b: e.target.value })} className={inp} />
          </div>

          <textarea placeholder="السبب" value={editing.reason || ""}
            onChange={(e) => setEditing({ ...editing, reason: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="الإجراء التمريضي" value={editing.nursing_action || ""}
            onChange={(e) => setEditing({ ...editing, nursing_action: e.target.value })} className={`${inp} w-full`} rows={2} />
          <input placeholder="المصدر" value={editing.source || ""}
            onChange={(e) => setEditing({ ...editing, source: e.target.value })} className={`${inp} w-full`} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-indigo-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
