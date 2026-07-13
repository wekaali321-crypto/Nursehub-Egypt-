import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import type { Quiz, Question } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

const blank = (): Quiz => ({
  id: "q" + Date.now(), title: "", description: "", category: "NCLEX", difficulty: "متوسط",
  timeLimit: 10, passScore: 60, status: "draft", questions: [],
});

export function QuizAdmin() {
  const { quizzes, setData, logActivity, attempts } = useStore();
  const { notify } = useToast();
  const [editing, setEditing] = useState<Quiz | null>(null);

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) return notify("أدخل عنوان الاختبار", "error");
    setData((d) => ({ ...d, quizzes: d.quizzes.some((q) => q.id === editing.id) ? d.quizzes.map((q) => (q.id === editing.id ? editing : q)) : [editing, ...d.quizzes] }));
    logActivity("حفظ اختبار", editing.title);
    notify("تم حفظ الاختبار"); setEditing(null);
  };
  const del = (id: string) => { if (confirm("حذف الاختبار؟")) { setData((d) => ({ ...d, quizzes: d.quizzes.filter((q) => q.id !== id) })); notify("تم الحذف"); } };

  const addQuestion = () => setEditing((e) => e ? { ...e, questions: [...e.questions, { id: "qq" + Date.now(), text: "", options: ["", "", "", ""], correct: 0, explanation: "" }] } : e);
  const updQuestion = (qid: string, patch: Partial<Question>) => setEditing((e) => e ? { ...e, questions: e.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) } : e);
  const delQuestion = (qid: string) => setEditing((e) => e ? { ...e, questions: e.questions.filter((q) => q.id !== qid) } : e);

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">{quizzes.some((q) => q.id === editing.id) ? "تعديل اختبار" : "اختبار جديد"}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700 dark:text-white">إلغاء</button>
            <button onClick={save} className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-bold text-white">حفظ</button>
          </div>
        </div>

        <div className={`grid gap-3 sm:grid-cols-2 ${card}`}>
          <input placeholder="عنوان الاختبار" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inp} />
          <input placeholder="التصنيف (NCLEX, Prometric...)" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inp} />
          <textarea placeholder="الوصف" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inp} sm:col-span-2`} rows={2} />
          <select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value as Quiz["difficulty"] })} className={inp}><option>سهل</option><option>متوسط</option><option>صعب</option></select>
          <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Quiz["status"] })} className={inp}><option value="draft">مسودة</option><option value="published">منشور</option></select>
          <label className="text-sm dark:text-white">المدة (دقيقة): <input type="number" value={editing.timeLimit} onChange={(e) => setEditing({ ...editing, timeLimit: +e.target.value })} className={inp} /></label>
          <label className="text-sm dark:text-white">درجة النجاح (%): <input type="number" value={editing.passScore} onChange={(e) => setEditing({ ...editing, passScore: +e.target.value })} className={inp} /></label>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-bold dark:text-white">الأسئلة ({editing.questions.length})</h3>
          <button onClick={addQuestion} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">+ سؤال</button>
        </div>
        {editing.questions.map((q, qi) => (
          <div key={q.id} className={`space-y-2 ${card}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">سؤال {qi + 1}</span>
              <button onClick={() => delQuestion(q.id)} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
            <input placeholder="نص السؤال" value={q.text} onChange={(e) => updQuestion(q.id, { text: e.target.value })} className={inp} />
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`c-${q.id}`} checked={q.correct === oi} onChange={() => updQuestion(q.id, { correct: oi })} title="الإجابة الصحيحة" />
                <input placeholder={`الخيار ${oi + 1}`} value={o} onChange={(e) => updQuestion(q.id, { options: q.options.map((x, i) => (i === oi ? e.target.value : x)) })} className={inp} />
              </div>
            ))}
            <input placeholder="شرح الإجابة (اختياري)" value={q.explanation} onChange={(e) => updQuestion(q.id, { explanation: e.target.value })} className={inp} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">الاختبارات: <span className="font-bold text-sky-500">{quizzes.length}</span> · المحاولات: <span className="font-bold text-emerald-500">{attempts.length}</span></p>
        <button onClick={() => setEditing(blank())} className="rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white">+ اختبار جديد</button>
      </div>
      <div className="space-y-2">
        {quizzes.map((q) => (
          <div key={q.id} className={`flex items-center justify-between ${card} py-3`}>
            <div>
              <div className="font-bold dark:text-white">{q.title} {q.demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">Demo</span>}</div>
              <div className="text-xs text-slate-400">{q.category} · {q.questions.length} سؤال · {q.status === "published" ? "منشور" : "مسودة"}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(q)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
              <button onClick={() => del(q.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">لا توجد اختبارات</div>}
      </div>
    </div>
  );
}
