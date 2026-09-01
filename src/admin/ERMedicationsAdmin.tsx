import { useEffect, useState } from "react";
import {
  fetchERMedications,
  upsertERMedication,
  deleteERMedication,
  ER_CATEGORY_ORDER,
  type ERMedication,
} from "../lib/erMedApi";

const EMPTY: ERMedication = {
  id: "",
  order_num: 0,
  category: ER_CATEGORY_ORDER[0],
  subcategory: "",
  drug_name: "",
  concentration: "",
  drug_class: "",
  uses: "",
  contraindications: "",
  side_effects: "",
  warnings: "",
  preparation: { steps: [] },
  dose_calculation: {},
  storage_notes: "",
  is_high_alert: false,
  high_alert_type: [],
  nursing_considerations: "",
  show_image: false,
  image_url: "",
};

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function ERMedicationsAdmin() {
  const [items, setItems] = useState<ERMedication[]>([]);
  const [editing, setEditing] = useState<ERMedication | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [doseRows, setDoseRows] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchERMedications().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: ERMedication | null) {
    const target = item ? { ...item } : { ...EMPTY };
    setEditing(target);
    setSteps(target.preparation?.steps ? [...target.preparation.steps] : []);
    setDoseRows(
      target.dose_calculation
        ? Object.entries(target.dose_calculation).map(([key, value]) => ({ key, value }))
        : []
    );
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.drug_name.trim()) {
      alert("لازم تحدد المعرف (id) واسم الدواء على الأقل.");
      return;
    }
    const preparation = steps.filter((s) => s.trim()).length
      ? { steps: steps.filter((s) => s.trim()) }
      : null;
    const dose_calculation = doseRows.filter((r) => r.key.trim())
      .reduce((acc, r) => ({ ...acc, [r.key.trim()]: r.value }), {} as Record<string, string>);
    await upsertERMedication({
      ...editing,
      preparation,
      dose_calculation: Object.keys(dose_calculation).length ? dose_calculation : null,
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteERMedication(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة أدوية الطوارئ ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-red-600 text-white rounded-lg px-4 py-2">+ إضافة دواء</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{i.order_num}. {i.drug_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{i.category} {i.subcategory ? `— ${i.subcategory}` : ""}</div>
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
            <input placeholder="id (فريد، إنجليزي، بدون مسافات — مثال er26)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })}
              className={inp} />
          </div>

          <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            className={`${inp} w-full`}>
            {ER_CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input placeholder="التصنيف الفرعي (اختياري)" value={editing.subcategory || ""}
            onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}
            className={`${inp} w-full`} />

          <input placeholder="اسم الدواء (عربي + إنجليزي)" value={editing.drug_name}
            onChange={(e) => setEditing({ ...editing, drug_name: e.target.value })}
            className={`${inp} w-full`} />

          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-500/10">
            <label className="flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400">
              <input type="checkbox" checked={editing.show_image ?? false}
                onChange={(e) => setEditing({ ...editing, show_image: e.target.checked })} />
              🖼️ إظهار صورة الدواء
            </label>
            {editing.show_image && (
              <div className="mt-2 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1.5 * 1024 * 1024) { alert("الصورة كبيرة — اختاري صورة أقل من 1.5 ميجا"); return; }
                    const reader = new FileReader();
                    reader.onload = () => setEditing((f) => f && { ...f, image_url: String(reader.result) });
                    reader.readAsDataURL(file);
                  }}
                  className={`${inp} w-full`}
                />
                {editing.image_url && (
                  <div className="relative">
                    <img src={editing.image_url} alt="معاينة" className="max-h-40 w-full rounded-lg object-contain" />
                    <button onClick={() => setEditing({ ...editing, image_url: "" })} className="mt-1 w-full rounded-lg bg-red-100 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف الصورة</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="التركيز" value={editing.concentration || ""}
              onChange={(e) => setEditing({ ...editing, concentration: e.target.value })}
              className={inp} />
            <input placeholder="التصنيف الدوائي" value={editing.drug_class || ""}
              onChange={(e) => setEditing({ ...editing, drug_class: e.target.value })}
              className={inp} />
          </div>

          <textarea placeholder="الاستعمالات" value={editing.uses || ""}
            onChange={(e) => setEditing({ ...editing, uses: e.target.value })}
            className={`${inp} w-full`} rows={3} />
          <textarea placeholder="موانع الاستخدام" value={editing.contraindications || ""}
            onChange={(e) => setEditing({ ...editing, contraindications: e.target.value })}
            className={`${inp} w-full`} rows={2} />
          <textarea placeholder="الأعراض الجانبية" value={editing.side_effects || ""}
            onChange={(e) => setEditing({ ...editing, side_effects: e.target.value })}
            className={`${inp} w-full`} rows={2} />
          <textarea placeholder="تنبيهات مهمة" value={editing.warnings || ""}
            onChange={(e) => setEditing({ ...editing, warnings: e.target.value })}
            className={`${inp} w-full`} rows={3} />
          <textarea placeholder="ملاحظات تمريضية" value={editing.nursing_considerations || ""}
            onChange={(e) => setEditing({ ...editing, nursing_considerations: e.target.value })}
            className={`${inp} w-full`} rows={2} />
          <textarea placeholder="ملاحظات التخزين" value={editing.storage_notes || ""}
            onChange={(e) => setEditing({ ...editing, storage_notes: e.target.value })}
            className={`${inp} w-full`} rows={2} />

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">خطوات التحضير</div>
            {steps.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={s} onChange={(e) => {
                  const next = [...steps]; next[i] = e.target.value; setSteps(next);
                }} className={`${inp} flex-1`} />
                <button onClick={() => setSteps(steps.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
              </div>
            ))}
            <button onClick={() => setSteps([...steps, ""])} className="text-red-600 text-sm">+ إضافة خطوة</button>
          </div>

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">حساب الجرعة (مفتاح / قيمة)</div>
            {doseRows.map((r, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="المفتاح مثل formula أو example" value={r.key} onChange={(e) => {
                  const next = [...doseRows]; next[i] = { ...next[i], key: e.target.value }; setDoseRows(next);
                }} className={`${inp} w-40`} />
                <input placeholder="القيمة" value={r.value} onChange={(e) => {
                  const next = [...doseRows]; next[i] = { ...next[i], value: e.target.value }; setDoseRows(next);
                }} className={`${inp} flex-1`} />
                <button onClick={() => setDoseRows(doseRows.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
              </div>
            ))}
            <button onClick={() => setDoseRows([...doseRows, { key: "", value: "" }])} className="text-red-600 text-sm">+ إضافة سطر</button>
          </div>

          <label className="flex items-center gap-2 dark:text-white">
            <input type="checkbox" checked={editing.is_high_alert}
              onChange={(e) => setEditing({ ...editing, is_high_alert: e.target.checked })} />
            دواء عالي الخطورة (High-Alert)
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={save} className="bg-red-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 rounded-lg px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
