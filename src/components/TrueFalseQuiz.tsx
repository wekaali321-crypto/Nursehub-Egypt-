import { useState } from "react";
import { getTF, type TFItem } from "../data/quizzes";

function TFItemBox({ item, index }: { item: TFItem; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<boolean | null>(null);

  const choose = (val: boolean) => {
    if (revealed) return;
    setPicked(val);
    setRevealed(true);
  };

  const isCorrect = picked === item.correct;

  const btnClass = (val: boolean) => {
    const base = "flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2";
    if (!revealed) return `${base} border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`;
    if (val === item.correct) return `${base} border-green-500 bg-green-500 text-white`;
    if (val === picked) return `${base} border-red-500 bg-red-500 text-white`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-50 text-slate-500`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
      <p className="font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500 text-white text-sm ml-2">{index + 1}</span>
        {item.s}
      </p>
      <div className="flex gap-3">
        <button onClick={() => choose(true)} disabled={revealed} className={btnClass(true)}>✅ صح</button>
        <button onClick={() => choose(false)} disabled={revealed} className={btnClass(false)}>❌ غلط</button>
      </div>
      {revealed && (
        <div className={`mt-4 p-4 rounded-xl border-r-4 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-500" : "bg-red-50 dark:bg-red-900/20 border-red-500"}`}>
          <p className="font-bold mb-1 text-slate-800 dark:text-slate-100">{isCorrect ? "🎉 إجابة صحيحة!" : "⚠️ إجابة خاطئة"}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"><span className="font-bold">الإجابة الصحيحة: </span>{item.correct ? "صح ✅" : "غلط ❌"}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2"><span className="font-bold">💡 التفسير: </span>{item.explain}</p>
          <button onClick={() => { setRevealed(false); setPicked(null); }} className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline font-semibold">↻ إعادة المحاولة</button>
        </div>
      )}
    </div>
  );
}

export default function TrueFalseQuiz({ slug }: { slug: string }) {
  const items = getTF(slug);
  if (items.length === 0) return null;
  return (
    <div className="my-8">
      <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">✅ صح أم خطأ</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">اضغط <b>«صح»</b> أو <b>«غلط»</b> — سيظهر لك التفسير فور اختيارك.</p>
      </div>
      {items.map((item, i) => <TFItemBox key={i} item={item} index={i} />)}
    </div>
  );
}
