import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";
import { computeAnalytics } from "../lib/quizStats";

function pctColor(pct: number) {
  if (pct >= 75) return "text-emerald-500 bg-emerald-500";
  if (pct >= 50) return "text-amber-500 bg-amber-500";
  return "text-rose-500 bg-rose-500";
}

function LearningCurve({ points }: { points: { label: string; score: number }[] }) {
  if (points.length < 2) return null;
  const w = 320, h = 120, pad = 10;
  const stepX = (w - pad * 2) / (points.length - 1);
  const y = (score: number) => h - pad - (score / 100) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${y(p.score)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <line x1={pad} y1={y(60)} x2={w - pad} y2={y(60)} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="4 3" />
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={pad + i * stepX} cy={y(p.score)} r={3.5} fill={p.score >= 60 ? "#10b981" : "#f43f5e"} />
      ))}
    </svg>
  );
}

export default function QuizAnalyticsPage() {
  const { attempts, questionLog } = useStore();
  const { lang, t } = useI18n();
  useSEO({ title: `${t("quiz.analyticsTitle")} | NurseHub Egypt` });

  const a = computeAnalytics(attempts, questionLog);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.quizzes"), path: "/quizzes" }, { label: t("quiz.analyticsTitle") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-violet-500 to-purple-600 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">📊</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("quiz.analyticsTitle")}</h1>
        <p className="mt-1 text-violet-50">{t("quiz.analyticsSubtitle")}</p>
      </div>

      {a.quizCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          <p>{t("quiz.analyticsNoData")}</p>
          <Link to="/quizzes" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("quiz.allQuizzes")}</Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[[t("quiz.analyticsQuizzes"), a.quizCount], [t("quiz.analyticsQuestions"), a.questionCount], [t("quiz.analyticsStudyTime"), `${a.studyMinutes} ${t("quiz.time")}`]].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <div className="text-2xl font-black text-violet-500">{v}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{l}</div>
              </div>
            ))}
          </div>

          {a.learningCurve.length >= 2 && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold dark:text-white">{t("quiz.analyticsLearningCurve")}</h2>
              <p className="mb-3 text-xs text-slate-400">{t("quiz.analyticsLearningCurveSub")}</p>
              <LearningCurve points={a.learningCurve} />
            </div>
          )}

          {a.categoryBreakdown.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold dark:text-white">{t("quiz.analyticsBreakdown")}</h2>
              <div className="mt-3 space-y-3">
                {a.categoryBreakdown.map((c) => {
                  const label = bilingual(c.category, c.categoryEn, lang).text;
                  const color = pctColor(c.pct);
                  return (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="dark:text-white">{label}</span>
                        <span className={`font-bold ${color.split(" ")[0]}`}>{c.pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full ${color.split(" ")[1]}`} style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
