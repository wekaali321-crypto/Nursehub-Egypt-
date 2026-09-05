import { useEffect, useState } from "react";
import { fetchLasaPairs, upsertLasaPair, deleteLasaPair, type LasaPair } from "../lib/lasaApi";

const EMPTY: LasaPair = {
  id: "",
  order_num: 0,
  drug_a: "",
  drug_b: "",
  similarity_type: "both",
  tall_man_a: "",
  tall_man_b: "",
  notes: "",
  notes_en: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const SIMILARITY_LABELS: Record<LasaPair["similarity_type"], string> = {
  look_alike: "تشابه شكلي (Look-Alike)",
  sound_alike: "تشابه نطقي (Sound-Alike)",
  both: "شكلي ونطقي معًا",
};

export default function LasaAdmin() {
  const [items, setItems] = useState<LasaPair[]>([]);
  const [editing, setEditing] = useState<LasaPair | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchLasaPairs().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: LasaPair | null) {
    setEditing(item ? { ...item } : { ...EMPTY });
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.drug_a.trim() || !editing.drug_b.trim()) {
      alert("لازم تحدد المعرف (id) واسم الدواء الأول والثاني على الأقل.");
      return;
    }
    await upsertLasaPair(editing);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteLasaPair(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة أزواج الأدوية المتشابهة LASA ({items.length} زوج)</h1>
        <button onClick={() => startEdit(null)} className="bg-red-600 text-white rounded-lg px-4 py-2">+ إضافة زوج</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{i.order_num}. {i.drug_a} ⇄ {i.drug_b}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{SIMILARITY_LABELS[i.similarity_type]}</div>
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
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="id (فريد، إنجليزي — مثال lasa11)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })}
              className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="الدواء الأول" value={editing.drug_a}
              onChange={(e) => setEditing({ ...editing, drug_a: e.target.value })}
              className={inp} />
            <input placeholder="الدواء الثاني" value={editing.drug_b}
              onChange={(e) => setEditing({ ...editing, drug_b: e.target.value })}
              className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="صيغة Tall Man للدواء الأول (اختياري، مثال: hydrOXYzine)" value={editing.tall_man_a || ""}
              onChange={(e) => setEditing({ ...editing, tall_man_a: e.target.value })}
              className={inp} />
            <input placeholder="صيغة Tall Man للدواء الثاني (اختياري)" value={editing.tall_man_b || ""}
              onChange={(e) => setEditing({ ...editing, tall_man_b: e.target.value })}
              className={inp} />
          </div>

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">نوع التشابه</div>
            <select value={editing.similarity_type}
              onChange={(e) => setEditing({ ...editing, similarity_type: e.target.value as LasaPair["similarity_type"] })}
              className={`${inp} w-full`}>
              {Object.entries(SIMILARITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <textarea placeholder="ملاحظات السلامة (عربي)" value={editing.notes || ""}
            onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            className={`${inp} w-full`} rows={3} />

          <textarea placeholder="Safety notes (English, optional)" value={editing.notes_en || ""}
            onChange={(e) => setEditing({ ...editing, notes_en: e.target.value })}
            className={`${inp} w-full`} rows={3} />

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-red-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
