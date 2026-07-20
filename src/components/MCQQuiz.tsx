// src/components/MCQQuiz.tsx
import { useState } from "react";
import { getMCQ, type MCQItem } from "../data/quizzes";

const LETTERS = ["A", "B", "C", "D", "E"];

function MCQItemBox({ item, index }: { item: MCQItem; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected === item.correct;

  const optionClass = (i: number) => {
    const base =
      "w-full text-right px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 font-medium";
    if (!revealed) {
      return selected === i
        ? `${base} border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200`
        : `${base} border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200`;
    }
    if (i === item.correct)
      return `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200`;
    if (i === selected)
      return `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-60 text-slate-500`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
      <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white text-sm ml-2">
          {index + 1}
        </span>
        {item.q}
      </h4>

      <div className="space-y-2.5">
        {item.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !revealed && setSelected(i)}
            disabled={revealed}
            className={optionClass(i)}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                revealed && i === item.correct
                  ? "bg-green-500 text-white"
                  : revealed && i === selected
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {LETTERS[i]}
            </span>
            <span className="flex-1">{opt}</span>
            {revealed && i === item.correct && <span>✅</span>}
            {revealed && i === selected && i !== item.correct && <span>❌</span>}
          </button>
        ))}
      </div>

      {!revealed && (
        <button
          onClick={() => selected !== null && setRevealed(true)}
          disabled={selected === null}
          className={`mt-4 w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold transition-all ${
            selected === null
              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          تأكيد الإجابة
        </button>
      )}

      {revealed && (
        <div
          className={`mt-4 p-4 rounded-xl border-r-4 ${
            isCorrect
              ? "bg-green-50 dark:bg-green-900/20 border-green-500"
              : "bg-red-50 dark:bg-red-900/20 border-red-500"
          }`}
        >
          <p className="font-bold mb-1 text-slate-800 dark:text-slate-100">
            {isCorrect ? "🎉 إجابة صحيحة — أحسنت!" : "⚠️ إجابة خاطئة"}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold">الإجابة الصحيحة: </span>
            {LETTERS[item.correct]}) {item.options[item.correct]}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
            <span className="font-bold">💡 التفسير: </span>
            {item.explain}
          </p>
          <button
            onClick={() => {
              setRevealed(false);
              setSelected(null);
            }}
            className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline font-semibold"
          >
            ↻ إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}

export default function MCQQuiz({ slug }: { slug: string }) {
  const items = getMCQ(slug);
  if (items.length === 0) return null;

  return (
    <div className="my-8">
      <div className="mb-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          ❓ اختبر نفسك — أسئلة اختيار من متعدد
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          اختر إجابة لكل سؤال ثم اضغط <b>«تأكيد الإجابة»</b> — لن يظهر الحل إلا
          بعد اختيارك، لتختبر فهمك الحقيقي للمقال.
        </p>
      </div>
      {items.map((item, i) => (
        <MCQItemBox key={i} item={item} index={i} />
      ))}
    </div>
  );
}
