import { useEffect, useState } from "react";
import { fetchIcuTopics, upsertIcuTopic, deleteIcuTopic, type IcuTopic, type IcuTopicSection } from "../lib/icuTopicsApi";
import MediaPicker from "./MediaPicker";

const EMPTY: IcuTopic = {
  id: "",
  order_num: 0,
  title_ar: "",
  title_en: "",
  icon: "🏥",
  category: "",
  summary_ar: "",
  summary_en: "",
  sections: [],
  sources: [],
};

let counter = 0;
function newSectionId() { counter += 1; return `s${Date.now()}_${counter}`; }

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function ICUNursingAdmin() {
  const [items, setItems] = useState<IcuTopic[]>([]);
  const [editing, setEditing] = useState<IcuTopic | null>(null);
  const [sections, setSections] = useState<IcuTopicSection[]>([]);
  const [sourcesText, setSourcesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [pickerForSection, setPickerForSection] = useState<number | null>(null);

  function load() {
    setLoading(true);
    fetchIcuTopics().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(p: IcuTopic | null) {
    const target = p ? { ...p } : { ...EMPTY };
    setEditing(target);
    setSections(target.sections ? target.sections.map((s) => ({ ...s })) : []);
    setSourcesText((target.sources || []).join("\n"));
  }

  function addSection() {
    setSections([...sections, { id: newSectionId(), heading_ar: "", heading_en: "", body_ar: "", body_en: "", image_url: "" }]);
  }
  function updateSection(idx: number, patch: Partial<IcuTopicSection>) {
    const next = [...sections]; next[idx] = { ...next[idx], ...patch }; setSections(next);
  }
  function removeSection(idx: number) {
    setSections(sections.filter((_, i) => i !== idx));
  }
  function moveSection(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.title_ar.trim()) {
      alert("لازم تحدد المعرف (id) والعنوان بالعربي على الأقل.");
      return;
    }
    const sources = sourcesText.split("\n").map((s) => s.trim()).filter(Boolean);
    await upsertIcuTopic({
      ...editing,
      sections: sections.filter((s) => s.heading_ar.trim()),
      sources,
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteIcuTopic(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold dark:text-white">🏥 إدارة قسم العناية المركزة ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="rounded-lg bg-rose-600 px-4 py-2 text-white">+ إضافة موضوع</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="font-semibold dark:text-white">{p.icon} {p.title_ar}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{p.sections.length} قسم{p.category ? ` — ${p.category}` : ""}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="text-sm text-rose-700 dark:text-rose-400">تعديل</button>
                <button onClick={() => remove(p.id)} className="text-sm text-red-500">حذف</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا توجد مواضيع بعد</div>}
        </div>
      )}

      {editing && (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="id (فريد، إنجليزي)" value={editing.id} disabled={!!items.find((i) => i.id === editing.id)}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })} className={`${inp} disabled:opacity-60`} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })} className={inp} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="العنوان بالعربي" value={editing.title_ar}
              onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} className={inp} />
            <input placeholder="Title in English" value={editing.title_en || ""}
              onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className={inp} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="أيقونة (إيموجي)" value={editing.icon || ""}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className={inp} />
            <input placeholder="التصنيف (مثال: الجهاز التنفسي)" value={editing.category || ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inp} />
          </div>

          <textarea placeholder="ملخص قصير بالعربي" value={editing.summary_ar || ""}
            onChange={(e) => setEditing({ ...editing, summary_ar: e.target.value })} className={`${inp} w-full`} rows={2} />
          <textarea placeholder="Short summary in English" value={editing.summary_en || ""}
            onChange={(e) => setEditing({ ...editing, summary_en: e.target.value })} className={`${inp} w-full`} rows={2} />

          <div>
            <div className="mb-2 font-bold dark:text-white">أقسام الموضوع (كل قسم = عنوان + شرح + صورة توضيحية)</div>
            {sections.map((s, idx) => (
              <div key={s.id} className="mb-3 rounded-xl border-2 border-slate-100 p-3 dark:border-slate-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">قسم {idx + 1}</span>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => moveSection(idx, -1)} className="text-slate-400">▲</button>
                    <button onClick={() => moveSection(idx, 1)} className="text-slate-400">▼</button>
                    <button onClick={() => removeSection(idx)} className="text-red-500">حذف القسم</button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input placeholder="عنوان القسم (عربي)" value={s.heading_ar}
                    onChange={(e) => updateSection(idx, { heading_ar: e.target.value })} className={inp} />
                  <input placeholder="Section heading (English)" value={s.heading_en || ""}
                    onChange={(e) => updateSection(idx, { heading_en: e.target.value })} className={inp} />
                </div>
                <textarea placeholder="شرح القسم بالعربي" value={s.body_ar}
                  onChange={(e) => updateSection(idx, { body_ar: e.target.value })} className={`${inp} mt-2 w-full`} rows={4} />
                <textarea placeholder="Section body in English" value={s.body_en || ""}
                  onChange={(e) => updateSection(idx, { body_en: e.target.value })} className={`${inp} mt-2 w-full`} rows={4} />
                <div className="mt-2 flex items-center gap-3">
                  {s.image_url ? (
                    <img src={s.image_url} alt="" className="h-16 w-24 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 dark:border-slate-700">🖼️</div>
                  )}
                  <button type="button" onClick={() => setPickerForSection(idx)} className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white">
                    {s.image_url ? "تغيير الصورة" : "رفع/اختيار صورة"}
                  </button>
                  {s.image_url && (
                    <button type="button" onClick={() => updateSection(idx, { image_url: "" })} className="text-xs text-red-500">إزالة الصورة</button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addSection} className="rounded-lg bg-slate-100 px-4 py-2 text-sm dark:bg-slate-800 dark:text-white">+ إضافة قسم جديد</button>
          </div>

          <div>
            <div className="mb-1 text-sm font-semibold dark:text-white">المصادر (سطر لكل مصدر — اختياري)</div>
            <textarea value={sourcesText} onChange={(e) => setSourcesText(e.target.value)} className={`${inp} w-full`} rows={2} />
          </div>

          <div className="flex gap-3 border-t border-slate-200 pt-2 dark:border-slate-800">
            <button onClick={save} className="rounded-lg bg-rose-600 px-5 py-2 text-white">حفظ</button>
            <button onClick={() => setEditing(null)} className="rounded-lg bg-slate-100 px-5 py-2 dark:bg-slate-800 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}

      {pickerForSection !== null && (
        <MediaPicker
          accept={["image"]}
          onClose={() => setPickerForSection(null)}
          onPick={(item) => {
            updateSection(pickerForSection, { image_url: item.url });
            setPickerForSection(null);
          }}
        />
      )}
    </div>
  );
}
