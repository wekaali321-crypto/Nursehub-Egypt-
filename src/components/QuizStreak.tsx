import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { useI18n, bilingual } from "../lib/i18n";
import { buildCalendar, computeStreak, pickQuestionOfDay, studiedDates } from "../lib/quizStats";
import type { QuestionLogEntry } from "../lib/types";

const DOW_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DOW_EN = ["S", "M", "T", "W", "T", "F", "S"];

export default function QuizStreak() {
  const { quizzes, attempts, questionLog, logQuestions } = useStore();
  const { lang, t } = useI18n();
  const [chosen, setChosen] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const days = useMemo(() => studiedDates(attempts, questionLog), [attempts, questionLog]);
  const streak = useMemo(() => computeStreak(days), [days]);
  const calendar = useMemo(() => buildCalendar(days, 14), [days]);
  const qotd = useMemo(() => pickQuestionOfDay(quizzes, today), [quizzes, today]);

  const answeredToday = useMemo(
    () => questionLog.find((e) => e.quizId === "qotd" && e.date.slice(0, 10) === today),
    [questionLog, today]
  );

  if (!qotd && days.size === 0) return null;

  const qText = qotd ? bilingual(qotd.question.text, qotd.question.textEn, lang).text : "";
  const qOptions = qotd ? (lang === "en" && qotd.question.optionsEn?.length === qotd.question.options.length ? qotd.question.optionsEn : qotd.question.options) : [];
  const explanation = qotd?.question.explanation ? bilingual(qotd.question.explanation, qotd.question.explanationEn, lang).text : undefined;

  const answerQotd = (oi: number) => {
    if (!qotd || answeredToday) return;
    setChosen(oi);
    const entry: QuestionLogEntry = {
      id: "qlqotd" + Date.now(),
      quizId: "qotd",
      quizTitle: t("quiz.qotdTitle"),
      category: qotd.quiz.category,
      categoryEn: qotd.quiz.categoryEn,
      questionId: qotd.question.id,
      questionText: qotd.question.text,
      questionTextEn: qotd.question.textEn,
      options: qotd.question.options,
      optionsEn: qotd.question.optionsEn,
      correctIndex: qotd.question.correct,
      chosenIndex: oi,
      isCorrect: oi === qotd.question.correct,
      explanation: qotd.question.explanation,
      explanationEn: qotd.question.explanationEn,
      flagged: false,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    logQuestions([entry]);
  };

  const chosenIndex = answeredToday ? answeredToday.chosenIndex : chosen ?? undefined;
  const showResult = !!answeredToday;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      {/* Streak calendar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="font-bold dark:text-white">{t("quiz.streakTitle")}</h3>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-600 dark:bg-amber-500/10">
              ⚡ {streak} {t("quiz.streakDays")}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
          {calendar.slice(0, 7).map((d) => {
            const dow = new Date(d.date).getDay();
            return <div key={"h" + d.date} className="text-[10px] font-bold text-slate-400">{lang === "ar" ? DOW_AR[dow][0] : DOW_EN[dow]}</div>;
          })}
          {calendar.map((d) => (
            <div
              key={d.date}
              title={d.date}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                d.studied
                  ? "bg-slate-800 text-white dark:bg-sky-500"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              } ${d.isToday ? "ring-2 ring-sky-400 ring-offset-1 dark:ring-offset-slate-900" : ""}`}
            >
              {d.dayOfMonth}
            </div>
          ))}
        </div>
        {streak === 0 && <p className="mt-3 text-xs text-slate-400">{t("quiz.streakEmpty")}</p>}
      </div>

      {/* Question of the day */}
      {qotd && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <h3 className="font-bold dark:text-white">{t("quiz.qotdTitle")}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{qText}</p>
          <div className="mt-3 space-y-1.5">
            {qOptions.map((o, oi) => {
              const isChosen = chosenIndex === oi;
              const isCorrectOpt = oi === qotd.question.correct;
              let cls = "border-slate-200 dark:border-slate-700 hover:border-sky-300";
              if (showResult || chosen !== null) {
                if (isCorrectOpt) cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
                else if (isChosen) cls = "border-rose-400 bg-rose-50 dark:bg-rose-500/10";
              }
              return (
                <button
                  key={oi}
                  disabled={showResult || chosen !== null}
                  onClick={() => answerQotd(oi)}
                  className={`block w-full rounded-lg border-2 px-3 py-2 text-start text-sm dark:text-white ${cls} disabled:cursor-default`}
                >
                  {(showResult || chosen !== null) && isCorrectOpt ? "✅ " : (showResult || chosen !== null) && isChosen ? "❌ " : ""}
                  {o}
                </button>
              );
            })}
          </div>
          {(showResult || chosen !== null) && explanation && (
            <div className="mt-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">💡 {explanation}</div>
          )}
          {(showResult || chosen !== null) && (
            <div className={`mt-2 text-xs font-bold ${(answeredToday ? answeredToday.isCorrect : chosenIndex === qotd.question.correct) ? "text-emerald-500" : "text-rose-500"}`}>
              {(answeredToday ? answeredToday.isCorrect : chosenIndex === qotd.question.correct) ? t("quiz.qotdCorrect") : t("quiz.qotdIncorrect")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
