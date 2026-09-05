import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

type Filter = "all" | "flagged" | "incorrect" | "correct";

export default function QuizReviewPage() {
  const { questionLog, toggleQuestionFlag } = useStore();
  const { lang, t } = useI18n();
  useSEO({ title: `${t("quiz.reviewTitle")} | NurseHub Egypt` });

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = {
    all: questionLog.length,
    flagged: questionLog.filter((e) => e.flagged).length,
    incorrect: questionLog.filter((e) => !e.isCorrect).length,
    correct: questionLog.filter((e) => e.isCorrect).length,
  };

  const list = useMemo(() => {
    let l = questionLog;
    if (filter === "flagged") l = l.filter((e) => e.flagged);
    else if (filter === "incorrect") l = l.filter((e) => !e.isCorrect);
    else if (filter === "correct") l = l.filter((e) => e.isCorrect);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      l = l.filter((e) => e.questionText.toLowerCase().includes(q) || (e.questionTextEn ?? "").toLowerCase().includes(q));
    }
    return l;
  }, [questionLog, filter, query]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("quiz.reviewAll") },
    { key: "flagged", label: t("quiz.reviewFlagged") },
    { key: "incorrect", label: t("quiz.reviewIncorrect") },
    { key: "correct", label: t("quiz.reviewCorrect") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.quizzes"), path: "/quizzes" }, { label: t("quiz.reviewTitle") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-amber-500 to-orange-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🗂️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("quiz.reviewTitle")}</h1>
        <p className="mt-1 text-amber-50">{t("quiz.reviewSubtitle")}</p>
      </div>

      {questionLog.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          <p>{t("quiz.reviewEmpty")}</p>
          <Link to="/quizzes" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("quiz.allQuizzes")}</Link>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-xl border p-2.5 text-center transition ${filter === tab.key ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-800"}`}
              >
                <div className="text-lg font-black dark:text-white">{counts[tab.key]}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{tab.label}</div>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("quiz.reviewSearchPlaceholder")}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="space-y-3">
            {list.map((e) => {
              const qText = bilingual(e.questionText, e.questionTextEn, lang).text;
              const catLabel = bilingual(e.category, e.categoryEn, lang).text;
              const options = lang === "en" && e.optionsEn?.length === e.options.length ? e.optionsEn : e.options;
              const explanation = e.explanation ? bilingual(e.explanation, e.explanationEn, lang).text : undefined;
              const open = openId === e.id;
              return (
                <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <button onClick={() => setOpenId(open ? null : e.id)} className="flex w-full items-start gap-3 text-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{catLabel}</div>
                      <div className="mt-1 line-clamp-2 text-sm font-semibold dark:text-white">{qText}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        role="button"
                        onClick={(ev) => { ev.stopPropagation(); toggleQuestionFlag(e.id); }}
                        className={`text-lg ${e.flagged ? "opacity-100" : "opacity-30"}`}
                        title={t("quiz.reviewFlag")}
                      >
                        🚩
                      </span>
                      <span className="text-lg">{e.isCorrect ? "✅" : "❌"}</span>
                    </div>
                  </button>
                  {open && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {options.map((o, oi) => (
                        <div
                          key={oi}
                          className={`rounded-lg px-3 py-1.5 text-sm ${
                            oi === e.correctIndex
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : oi === e.chosenIndex
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                              : "text-slate-500"
                          }`}
                        >
                          {oi === e.correctIndex ? "✅ " : oi === e.chosenIndex ? "❌ " : ""}{o}
                        </div>
                      ))}
                      {explanation && <div className="rounded-lg bg-sky-50 p-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">💡 {explanation}</div>}
                      <div className="text-[11px] text-slate-400">{e.quizTitle} · {e.date}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {list.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">{t("common.noResults")}</div>}
          </div>
        </>
      )}
    </div>
  );
}
