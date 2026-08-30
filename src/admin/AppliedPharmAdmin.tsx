import { useEffect, useState } from "react";
import {
  deleteAppliedPharmItem,
  fetchAppliedPharmItems,
  upsertAppliedPharmItem,
  type AppliedPharmItem,
  type TreatmentLine,
} from "../lib/appliedPharmApi";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

const EMPTY: AppliedPharmItem = {
  id: "",
  part: 1,
  order_num: 0,
  topic: "",
  topic_icon: "💊",
  item_type: "fact",
  title: "",
  content: "",
  question: "",
  answer: "",
  disease_name: "",
  treatment_lines: [],
};

export default function AppliedPharmAdmin() {
  const [items, setItems] = useState<AppliedPharmItem[]>([]);
  const [form, setForm] = useState<AppliedPharmItem | null>(null);
  const [search, setSearch] = useState("");
  const [partFilter, setPartFilter] = useState<1 | 2 | 0>(0);

  const load = () => fetchAppliedPharmItems().then(setItems);
  useEffect(() => { load(); }, []);

  const startNew = (part: 1 | 2) => {
    setForm({ ...EMPTY, id: `ap${Date.now()}`, part, item_type: part === 2 ? "treatment_plan" : "fact" });
  };

  const save = async () => {
    if (!form) return;
    if (form.part === 2 && form.item_type === "treatment_plan" && !form.disease_name) {
      alert("لازم اسم المرض للخطة العلاجية");
      return;
    }
    if (form.part === 1 && !form.topic) {
      alert("لازم اسم الموضوع");
      return;
    }
    await upsertAppliedPharmItem(form);
    setForm(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteAppliedPharmItem(id);
    await load();
  };

  const updateLine = (idx: number, field: keyof TreatmentLine, value: string) => {
    if (!form) return;
    const lines = [...(form.treatment_lines || [])];
    lines[idx] = { ...lines[idx], [field]: value };
    setForm({ ...form, treatment_lines: lines });
  };
  const addLine = () => {
    if (!form) return;
    setForm({ ...form, treatment_lines: [...(form.treatment_lines || []), { line_no: String((form.treatment_lines?.length || 0) + 1), title: "", content: "" }] });
  };
  const removeLine = (idx: number) => {
    if (!form) return;
    setForm({ ...form, treatment_lines: (form.treatment_lines || []).filter((_, i) => i !== idx) });
  };

  const filtered = items
    .filter((i) => !partFilter || i.part === partFilter)
    .filter((i) => !search.trim() || (i.topic + i.disease_name + i.content + i.question).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.part - b.part || a.order_num - b.order_num);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => startNew(1)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white">+ عنصر جزء 1 (موضوع)</button>
          <button onClick={() => startNew(2)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">+ خطة علاجية (جزء 2)</button>
          <select value={partFilter} onChange={(e) => setPartFilter(Number(e.target.value) as 0 | 1 | 2)} className={inp + " w-auto"}>
            <option value={0}>الكل</option>
            <option value={1}>الجزء 1</option>
            <option value={2}>الجزء 2</option>
          </select>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className={inp} />
        {filtered.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm">
              <div className="font-bold dark:text-white">
                {it.part === 2 ? `🩺 ${it.disease_name}` : `${it.topic_icon} ${it.topic}`}
              </div>
              <div className="text-xs text-slate-400">{it.item_type} · {it.id}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setForm(it)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
              <button onClick={() => remove(it.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-8 text-center text-slate-400">مفيش عناصر.</div>}
      </div>

      {form && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold dark:text-white">{form.part === 1 ? "عنصر جزء 1" : "خطة علاجية"}</h3>

          {form.part === 1 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="الموضوع (مثال: أدوية الجهاز الهضمي)" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inp} />
                <input placeholder="أيقونة" value={form.topic_icon} onChange={(e) => setForm({ ...form, topic_icon: e.target.value })} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as AppliedPharmItem["item_type"] })} className={inp}>
                  <option value="fact">معلومة</option>
                  <option value="qa">سؤال وجواب</option>
                  <option value="alert">تنبيه صيدلاني</option>
                  <option value="trivia">هل تعلم؟</option>
                  <option value="note">ملاحظة</option>
                </select>
                <input type="number" placeholder="الترتيب" value={form.order_num} onChange={(e) => setForm({ ...form, order_num: Number(e.target.value) })} className={inp} />
              </div>
              <input placeholder="عنوان مختصر (اختياري)" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
              {form.item_type === "qa" ? (
                <>
                  <textarea placeholder="السؤال" rows={2} value={form.question || ""} onChange={(e) => setForm({ ...form, question: e.target.value })} className={inp} />
                  <textarea placeholder="الجواب" rows={4} value={form.answer || ""} onChange={(e) => setForm({ ...form, answer: e.target.value })} className={inp} />
                </>
              ) : (
                <textarea placeholder="المحتوى" rows={6} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inp} />
              )}
            </>
          )}

          {form.part === 2 && (
            <>
              <input placeholder="اسم المرض" value={form.disease_name || ""} onChange={(e) => setForm({ ...form, disease_name: e.target.value })} className={inp} />
              <div className="space-y-2">
                {(form.treatment_lines || []).map((l, idx) => (
                  <div key={idx} className="space-y-1 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input placeholder="رقم/عنوان الخط (مثال: الخط الأول)" value={l.line_no} onChange={(e) => updateLine(idx, "line_no", e.target.value)} className={inp} />
                      <button onClick={() => removeLine(idx)} className="shrink-0 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600">حذف</button>
                    </div>
                    <input placeholder="عنوان الخطوة" value={l.title} onChange={(e) => updateLine(idx, "title", e.target.value)} className={inp} />
                    <textarea placeholder="التفاصيل" rows={3} value={l.content} onChange={(e) => updateLine(idx, "content", e.target.value)} className={inp} />
                  </div>
                ))}
                <button onClick={addLine} className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-500">+ إضافة خط علاجي</button>
              </div>
            </>
          )}

          <button onClick={save} className="w-full rounded-lg bg-emerald-600 py-2 font-bold text-white">حفظ</button>
          <button onClick={() => setForm(null)} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>
        </div>
      )}
    </div>
  );
}
