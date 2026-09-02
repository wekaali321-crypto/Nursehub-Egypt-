import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { logoMarkSVG, creditFooterHTML, BRAND_NAME } from "../lib/brand";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const DIFFICULTY_LABEL: Record<string, { ar: string; en: string }> = {
  "سهل": { ar: "سهل", en: "Easy" },
  "متوسط": { ar: "متوسط", en: "Medium" },
  "صعب": { ar: "صعب", en: "Hard" },
};

export default function QuizPlayer() {
  const { id } = useParams();
  const { quizzes, recordAttempt, settings } = useStore();
  const { notify } = useToast();
  const { lang, t } = useI18n();
  const quiz = quizzes.find((q) => q.id === id);

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [userName, setUserName] = useState("");

  const title = quiz ? bilingual(quiz.title, quiz.titleEn, lang).text : "";
  const description = quiz ? bilingual(quiz.description, quiz.descriptionEn, lang).text : "";
  const difficulty = quiz ? (DIFFICULTY_LABEL[quiz.difficulty]?.[lang] ?? quiz.difficulty) : "";

  useSEO({ title: quiz ? `${title} | اختبار` : "اختبار غير موجود" });

  useEffect(() => {
    if (started && quiz?.timeLimit && !finished) {
      if (secondsLeft <= 0) { finish(); return; }
      const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, secondsLeft, finished]);

  const result = useMemo(() => {
    if (!quiz) return { correct: 0, total: 0, score: 0, passed: false };
    const correct = quiz.questions.filter((q) => answers[q.id] === q.correct).length;
    const total = quiz.questions.length;
    const score = Math.round((correct / total) * 100);
    return { correct, total, score, passed: score >= quiz.passScore };
  }, [quiz, answers]);

  if (!quiz) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">{t("quiz.notFound")}</h1>
        <Link to="/quizzes" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("quiz.allQuizzes")}</Link>
      </div>
    );
  }

  function start() {
    setStarted(true);
    setSecondsLeft((quiz!.timeLimit || 0) * 60);
  }

  function finish() {
    setFinished(true);
    recordAttempt({
      id: "at" + Date.now(), quizId: quiz!.id, quizTitle: quiz!.title,
      score: result.score, correct: result.correct, total: result.total,
      passed: result.passed, date: new Date().toISOString().slice(0, 16).replace("T", " "),
    });
    notify(result.passed ? "أحسنت! لقد نجحت 🎉" : "لم تجتز الاختبار، حاول مجدداً", result.passed ? "success" : "info");
  }

  const printCertificate = () => {
    const w = window.open("", "_blank", "width=1000,height=720");
    if (!w) return;
    const isAr = lang === "ar";
    w.document.write(`<!doctype html><html lang="${lang}" dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"/><title>${isAr ? "شهادة" : "Certificate"} - ${title}</title>
      <style>
        body{font-family:'Cairo',Arial,sans-serif;margin:0;padding:40px;background:#f1f5f9}
        .cert{max-width:820px;margin:0 auto;background:#fff;border:10px double #0ea5e9;border-radius:20px;padding:48px;text-align:center;box-shadow:0 20px 60px rgba(2,132,199,.15)}
        .brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px}
        .brand .wm{font-weight:800;font-size:26px;color:#0f172a}
        .brand .wm span{color:#0ea5e9}
        .egypt{font-weight:700;letter-spacing:.3em;font-size:12px;color:#14b8a6;margin-bottom:20px}
        h1{font-size:30px;margin:16px 0 4px;color:#0f172a}
        .name{font-size:34px;font-weight:800;color:#0284c7;margin:18px 0;border-bottom:2px dashed #cbd5e1;display:inline-block;padding:0 24px 8px}
        .muted{color:#64748b;font-size:16px}
        .score{margin-top:14px;font-weight:800;color:#10b981;font-size:20px}
      </style></head><body>
      <div class="cert">
        <div class="brand">${logoMarkSVG(46)}<div class="wm">Nurse<span>Hub</span></div></div>
        <div class="egypt">EGYPT</div>
        <div style="font-size:44px">🏅</div>
        <h1>${isAr ? "شهادة إتمام بنجاح" : "Certificate of Successful Completion"}</h1>
        <div class="muted">${isAr ? `تشهد ${BRAND_NAME} بأن` : `${BRAND_NAME} certifies that`}</div>
        <div class="name">${(userName || t("quiz.trainee")).replace(/</g, "")}</div>
        <div class="muted">${isAr ? "قد اجتاز بنجاح اختبار:" : "has successfully passed the quiz:"} <b>${title}</b></div>
        <div class="score">${t("quiz.result")}: ${result.score}%</div>
        <div class="muted" style="margin-top:8px;font-size:13px">${t("quiz.date")}: ${new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US")}</div>
        ${creditFooterHTML()}
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
    </body></html>`);
    w.document.close();
  };

  const q = quiz.questions[current];
  const qText = bilingual(q.text, q.textEn, lang).text;
  const qOptions = lang === "en" && q.optionsEn && q.optionsEn.length === q.options.length ? q.optionsEn : q.options;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;
  const optionLetters = lang === "en" ? ["A", "B", "C", "D", "E"] : ["أ", "ب", "ج", "د", "هـ"];

  // Start screen
  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Breadcrumbs items={[{ label: t("nav.quizzes"), path: "/quizzes" }, { label: title }]} />
        <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-5xl">📝</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">{title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{description}</p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-sm">
            {[[t("quiz.numQuestionsLabel"), quiz.questions.length], [t("quiz.duration"), quiz.timeLimit ? `${quiz.timeLimit} ${t("quiz.time")}` : t("quiz.notSpecified")], [t("quiz.passScoreLabel"), `${quiz.passScore}%`], [t("quiz.level"), difficulty]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="font-black text-sky-600">{v}</div><div className="text-xs text-slate-500">{l}</div></div>
            ))}
          </div>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t("quiz.namePlaceholder")} className="mx-auto mt-5 block w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
          <button onClick={start} className="mt-4 rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-10 py-3 font-bold text-white">{t("quiz.startBtn")}</button>
        </div>
      </div>
    );
  }

  // Result screen
  if (finished) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
        <div className={`rounded-3xl border p-8 text-center ${result.passed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/5" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/5"}`}>
          <div className="text-6xl">{result.passed ? "🎉" : "📚"}</div>
          <h1 className="mt-3 text-3xl font-black dark:text-white">{result.score}%</h1>
          <p className="mt-1 font-bold text-slate-600 dark:text-slate-300">{result.correct} {t("quiz.of")} {result.total} {t("quiz.correctAnswersOf")}</p>
          <p className={`mt-2 font-bold ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>{result.passed ? t("quiz.passed") : t("quiz.failed")}</p>

          {result.passed && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border-4 border-double border-sky-400 bg-white p-6 text-center dark:bg-slate-900">
              <div className="text-3xl">🏅</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{t("quiz.certificate")}</div>
              <div className="mt-2 text-lg font-black dark:text-white">{userName || t("quiz.trainee")}</div>
              <div className="text-sm text-slate-500">{t("quiz.certifiedPassed")}: {title}</div>
              <div className="mt-2 text-xs text-slate-400">{t("quiz.by")} {result.score}% — {settings.siteName}</div>
              <div className="mt-1 text-[10px] text-slate-300">Created by RN. Ali Ashour</div>
              <button onClick={printCertificate} className="mt-3 rounded-full bg-sky-500 px-5 py-1.5 text-sm font-bold text-white">{t("quiz.printCert")}</button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => { setStarted(false); setFinished(false); setAnswers({}); setCurrent(0); }} className="rounded-full border border-sky-500 px-6 py-2 font-bold text-sky-500">{t("quiz.retry")}</button>
            <Link to="/quizzes" className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("quiz.otherQuizzes")}</Link>
          </div>
        </div>

        {/* Review answers */}
        <div className="mt-6 space-y-3">
          <h2 className="font-bold dark:text-white">{t("quiz.reviewAnswers")}</h2>
          {quiz.questions.map((qq, i) => {
            const ua = answers[qq.id];
            const ok = ua === qq.correct;
            const qqText = bilingual(qq.text, qq.textEn, lang).text;
            const qqOptions = lang === "en" && qq.optionsEn && qq.optionsEn.length === qq.options.length ? qq.optionsEn : qq.options;
            const qqExplanation = qq.explanation ? bilingual(qq.explanation, qq.explanationEn, lang).text : undefined;
            return (
              <div key={qq.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="font-semibold dark:text-white">{i + 1}. {qqText}</div>
                <div className="mt-2 space-y-1 text-sm">
                  {qqOptions.map((o, oi) => (
                    <div key={oi} className={`rounded-lg px-3 py-1.5 ${oi === qq.correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : oi === ua ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "text-slate-500"}`}>
                      {oi === qq.correct ? "✅ " : oi === ua ? "❌ " : ""}{o}
                    </div>
                  ))}
                </div>
                {qqExplanation && <div className="mt-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">💡 {qqExplanation}</div>}
                {!ok && ua === undefined && <div className="mt-1 text-xs text-amber-500">{t("quiz.notAnswered")}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Player screen
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t("quiz.questionLabel")} {current + 1} {t("quiz.of")} {quiz.questions.length}</span>
        <div className="flex items-center gap-2">
          {quiz.timeLimit > 0 && <span className={`rounded-full px-4 py-1 text-sm font-black ${secondsLeft < 30 ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600 dark:bg-sky-500/10"}`}>⏱ {mm}:{ss}</span>}
          <InlineLangToggle />
        </div>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-gradient-to-l from-sky-500 to-emerald-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold dark:text-white">{qText}</h2>
        <div className="mt-4 space-y-2">
          {qOptions.map((o, oi) => (
            <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-right transition ${answers[q.id] === oi ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 hover:border-sky-300 dark:border-slate-700"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[q.id] === oi ? "bg-sky-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>{optionLetters[oi]}</span>
              <span className="dark:text-white">{o}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="rounded-full border border-slate-200 px-6 py-2 font-bold disabled:opacity-40 dark:border-slate-700 dark:text-white">{t("quiz.prev")}</button>
        <span className="text-xs text-slate-400">{t("quiz.answered")} {answered}/{quiz.questions.length}</span>
        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("quiz.next")}</button>
        ) : (
          <button onClick={finish} className="rounded-full bg-emerald-500 px-6 py-2 font-bold text-white">{t("quiz.finish")}</button>
        )}
      </div>
    </div>
  );
}
