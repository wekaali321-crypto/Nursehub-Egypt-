import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { fetchPediatricQuizQuestions, upsertPediatricQuizQuestion, deletePediatricQuizQuestion, type PediatricQuizQuestion } from "../lib/pediatricQuizApi";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

const blank = (nextOrder: number): PediatricQuizQuestion => ({
  id: "pq" + Date.now(),
  order_num: nextOrder,
  category: "",
  text_ar: "",
  text_en: "",
  options_ar: ["", "", "", ""],
  options_en: ["", "", "", ""],
  correct: 0,
  explanation_ar: "",
  explanation_en: "",
});

export default function PediatricsQuizAdmin() {
  const { notify } = useToast();
  const [items, setItems] = useState<PediatricQuizQuestion[] | null>(null);
  const [editing, setEditing] = useState<PediatricQuizQuestion | null>(null);

  const reload = () => fetchPediatricQuizQuestions().then(setItems).catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.text_ar.trim()) return notify("أدخل نص السؤال بالعربية", "error");
    if (editing.options_ar.some((o) => !o.trim())) return notify("أكمل كل الخيارات بالعربية", "error");
    try {
      await upsertPediatricQuizQuestion(editing);
      notify("تم الحفظ");
      setEditing(null);
      reload();
    } catch (e) {
      notify("فشل الحفظ: " + (e as Error).message, "error");
    }
  };

  const del = async (id: string) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    await deletePediatricQuizQuestion(id);
    notify("تم الحذف");
    reload();
  };

  const updOpt = (arr: "options_ar" | "options_en", oi: number, value: string) => {
    if (!editing) return;
    const opts = [...(editing[arr] || ["", "", "", ""])];
    opts[oi] = value;
    setEditing({ ...editing, [arr]: opts });
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">{items?.some((q) => q.id === editing.id) ? "تعديل سؤال" : "سؤال جديد"}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700 dark:text-white">إلغاء</button>
            <button onClick={save} className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-bold text-white">حفظ</button>
          </div>
        </div>

        <div className={`grid gap-3 sm:grid-cols-2 ${card}`}>
          <input placeholder="التصنيف (مثال: مثال: مؤشرات النمو)" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inp} />
          <label className="flex items-center gap-2 text-sm dark:text-white">الترتيب: <input type="number" value={editing.order_num} onChange={(e) => setEditing({ ...editing, order_num: +e.target.value })} className={inp} /></label>
          <textarea placeholder="نص السؤال بالعربية" value={editing.text_ar} onChange={(e) => setEditing({ ...editing, text_ar: e.target.value })} className={`${inp} sm:col-span-2`} rows={2} />
          <textarea placeholder="Question text in English" value={editing.text_en || ""} onChange={(e) => setEditing({ ...editing, text_en: e.target.value })} className={`${inp} sm:col-span-2`} rows={2} />
        </div>

        <div className={`space-y-2 ${card}`}>
          <div className="mb-2 font-bold dark:text-white">الخيارات (حدد الإجابة الصحيحة)</div>
          {editing.options_ar.map((o, oi) => (
            <div key={oi} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
              <input type="radio" name={`c-${editing.id}`} checked={editing.correct === oi} onChange={() => setEditing({ ...editing, correct: oi })} title="الإجابة الصحيحة" />
              <input placeholder={`الخيار ${oi + 1} بالعربية`} value={o} onChange={(e) => updOpt("options_ar", oi, e.target.value)} className={inp} />
              <input placeholder={`Option ${oi + 1} in English`} value={editing.options_en?.[oi] || ""} onChange={(e) => updOpt("options_en", oi, e.target.value)} className={inp} />
            </div>
          ))}
        </div>

        <div className={`grid gap-3 sm:grid-cols-2 ${card}`}>
          <textarea placeholder="شرح الإجابة بالعربية (اختياري)" value={editing.explanation_ar || ""} onChange={(e) => setEditing({ ...editing, explanation_ar: e.target.value })} className={inp} rows={2} />
          <textarea placeholder="Explanation in English (optional)" value={editing.explanation_en || ""} onChange={(e) => setEditing({ ...editing, explanation_en: e.target.value })} className={inp} rows={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">عدد الأسئلة: <span className="font-bold text-sky-500">{items?.length ?? "…"}</span></p>
        <button onClick={() => setEditing(blank((items?.length || 0) + 1))} className="rounded-lg bg-gradient-to-l from-sky-600 to-teal-500 px-5 py-2 text-sm font-bold text-white">+ سؤال جديد</button>
      </div>
      <div className="space-y-2">
        {items === null ? (
          <div className="py-12 text-center text-slate-400">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">لا توجد أسئلة بعد</div>
        ) : (
          items.map((q) => (
            <div key={q.id} className={`flex items-center justify-between ${card} py-3`}>
              <div className="min-w-0">
                <div className="truncate font-bold dark:text-white">{q.text_ar}</div>
                <div className="text-xs text-slate-400">{q.category || "بدون تصنيف"} · ترتيب {q.order_num}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setEditing(q)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(q.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
