import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const DIFFICULTY_LABEL: Record<string, { ar: string; en: string }> = {
  "سهل": { ar: "سهل", en: "Easy" },
  "متوسط": { ar: "متوسط", en: "Medium" },
  "صعب": { ar: "صعب", en: "Hard" },
};

export default function QuizzesPage() {
  const { quizzes, attempts } = useStore();
  const { lang, t } = useI18n();
  const [cat, setCat] = useState("all");
  useSEO({ title: "الاختبارات والامتحانات | NurseHub Egypt", description: "اختبارات NCLEX و Prometric وبنوك أسئلة MCQ لطلاب وممارسي التمريض مع مؤقت وتصحيح فوري." });

  const published = quizzes.filter((q) => q.status === "published");
  const catLabels = new Map<string, string>();
  published.forEach((q) => catLabels.set(q.category, bilingual(q.category, q.categoryEn, lang).text));
  const cats = ["all", ...Array.from(catLabels.keys())];
  const list = cat === "all" ? published : published.filter((q) => q.category === cat);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الاختبارات" }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-sky-500 to-emerald-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">📝</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("quiz.pageTitle")}</h1>
        <p className="mt-1 text-sky-50">{t("quiz.pageDesc")}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cat === c ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{c === "all" ? t("cat.all") : catLabels.get(c)}</button>
        ))}
      </div>

      <div className="mb-6"><AdSlot label="إعلان قسم الاختبارات" /></div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((q) => {
          const best = attempts.filter((a) => a.quizId === q.id).sort((a, b) => b.score - a.score)[0];
          const title = bilingual(q.title, q.titleEn, lang).text;
          const description = bilingual(q.description, q.descriptionEn, lang).text;
          const category = bilingual(q.category, q.categoryEn, lang).text;
          const difficulty = DIFFICULTY_LABEL[q.difficulty]?.[lang] ?? q.difficulty;
          return (
            <div key={q.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">{category}</span>
                {q.demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">Demo</span>}
              </div>
              <h3 className="mt-3 text-lg font-bold dark:text-white">{title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>❓ {q.questions.length} {t("quiz.numQuestions")}</span>
                <span>⏱ {q.timeLimit ? `${q.timeLimit} ${t("quiz.time")}` : t("quiz.noTimeLimit")}</span>
                <span>🎯 {t("quiz.passRate")} {q.passScore}%</span>
                <span>📊 {difficulty}</span>
              </div>
              {best && <div className="mt-2 text-xs font-bold text-emerald-500">{t("quiz.bestScore")}: {best.score}%</div>}
              <Link to={`/quiz/${q.id}`} className="mt-4 rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 text-center font-bold text-white">{t("quiz.start")}</Link>
            </div>
          );
        })}
        {list.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">{t("quiz.noQuizzesInCategory")}</div>}
      </div>
    </div>
  );
}
