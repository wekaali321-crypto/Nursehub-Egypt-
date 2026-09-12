import { useEffect, useMemo, useState } from "react";
import { useI18n, bilingual } from "../lib/i18n";
import { fetchPediatricQuizQuestions, type PediatricQuizQuestion } from "../lib/pediatricQuizApi";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function PediatricsQuizWidget() {
  const { lang, t } = useI18n();
  const [pool, setPool] = useState<PediatricQuizQuestion[] | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPediatricQuizQuestions()
      .then((rows) => {
        if (!alive) return;
        setPool(rows);
        const today = new Date().toISOString().slice(0, 10);
        setIndex(rows.length ? hashStr(today) % rows.length : null);
      })
      .catch(() => alive && setPool([]));
    return () => {
      alive = false;
    };
  }, []);

  const q = useMemo(() => (pool && index !== null ? pool[index] : null), [pool, index]);

  if (!pool || pool.length === 0 || !q) return null;

  const qText = bilingual(q.text_ar, q.text_en, lang).text;
  const options = lang === "en" && q.options_en?.length === q.options_ar.length ? q.options_en : q.options_ar;
  const explanation = q.explanation_ar || q.explanation_en ? bilingual(q.explanation_ar, q.explanation_en, lang).text : undefined;

  const another = () => {
    setChosen(null);
    setIndex((prev) => {
      if (pool.length <= 1) return prev;
      let next = Math.floor(Math.random() * pool.length);
      while (next === prev) next = Math.floor(Math.random() * pool.length);
      return next;
    });
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="text-xl">🍼</span>
        <h3 className="font-bold dark:text-white">{t("pediatrics.quizWidgetTitle")}</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{qText}</p>
      <div className="mt-3 space-y-1.5">
        {options.map((o, oi) => {
          const isChosen = chosen === oi;
          const isCorrectOpt = oi === q.correct;
          let cls = "border-slate-200 dark:border-slate-700 hover:border-sky-300";
          if (chosen !== null) {
            if (isCorrectOpt) cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
            else if (isChosen) cls = "border-rose-400 bg-rose-50 dark:bg-rose-500/10";
          }
          return (
            <button
              key={oi}
              disabled={chosen !== null}
              onClick={() => setChosen(oi)}
              className={`block w-full rounded-lg border-2 px-3 py-2 text-start text-sm dark:text-white ${cls} disabled:cursor-default`}
            >
              {chosen !== null && isCorrectOpt ? "✅ " : chosen !== null && isChosen ? "❌ " : ""}
              {o}
            </button>
          );
        })}
      </div>
      {chosen !== null && explanation && (
        <div className="mt-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">💡 {explanation}</div>
      )}
      {chosen !== null && (
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs font-bold ${chosen === q.correct ? "text-emerald-500" : "text-rose-500"}`}>
            {chosen === q.correct ? t("quiz.qotdCorrect") : t("quiz.qotdIncorrect")}
          </span>
          <button type="button" onClick={another} className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-bold text-white">
            {t("pediatrics.quizAnother")}
          </button>
        </div>
      )}
    </div>
  );
}
