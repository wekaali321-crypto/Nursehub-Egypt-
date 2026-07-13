import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { logoMarkSVG, creditFooterHTML, BRAND_NAME } from "../lib/brand";

export default function QuizPlayer() {
  const { id } = useParams();
  const { quizzes, recordAttempt, settings } = useStore();
  const { notify } = useToast();
  const quiz = quizzes.find((q) => q.id === id);

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [userName, setUserName] = useState("");

  useSEO({ title: quiz ? `${quiz.title} | اختبار` : "اختبار غير موجود" });

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
        <h1 className="mt-4 text-2xl font-bold dark:text-white">الاختبار غير موجود</h1>
        <Link to="/quizzes" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">كل الاختبارات</Link>
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
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>شهادة - ${quiz!.title}</title>
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
        <h1>شهادة إتمام بنجاح</h1>
        <div class="muted">تشهد ${BRAND_NAME} بأن</div>
        <div class="name">${(userName || "المتدرب").replace(/</g, "")}</div>
        <div class="muted">قد اجتاز بنجاح اختبار: <b>${quiz!.title}</b></div>
        <div class="score">النتيجة: ${result.score}%</div>
        <div class="muted" style="margin-top:8px;font-size:13px">التاريخ: ${new Date().toLocaleDateString("ar-EG")}</div>
        ${creditFooterHTML()}
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
    </body></html>`);
    w.document.close();
  };

  const q = quiz.questions[current];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;

  // Start screen
  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Breadcrumbs items={[{ label: "الاختبارات", path: "/quizzes" }, { label: quiz.title }]} />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-5xl">📝</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">{quiz.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{quiz.description}</p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-sm">
            {[["عدد الأسئلة", quiz.questions.length], ["المدة", quiz.timeLimit ? `${quiz.timeLimit} دقيقة` : "غير محدد"], ["درجة النجاح", `${quiz.passScore}%`], ["المستوى", quiz.difficulty]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="font-black text-sky-600">{v}</div><div className="text-xs text-slate-500">{l}</div></div>
            ))}
          </div>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="اسمك (لإصدار الشهادة)" className="mx-auto mt-5 block w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
          <button onClick={start} className="mt-4 rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-10 py-3 font-bold text-white">ابدأ الآن</button>
        </div>
      </div>
    );
  }

  // Result screen
  if (finished) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className={`rounded-3xl border p-8 text-center ${result.passed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/5" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/5"}`}>
          <div className="text-6xl">{result.passed ? "🎉" : "📚"}</div>
          <h1 className="mt-3 text-3xl font-black dark:text-white">{result.score}%</h1>
          <p className="mt-1 font-bold text-slate-600 dark:text-slate-300">{result.correct} من {result.total} إجابة صحيحة</p>
          <p className={`mt-2 font-bold ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>{result.passed ? "ناجح ✅" : "لم تجتز درجة النجاح"}</p>

          {result.passed && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border-4 border-double border-sky-400 bg-white p-6 text-center dark:bg-slate-900">
              <div className="text-3xl">🏅</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">شهادة إتمام</div>
              <div className="mt-2 text-lg font-black dark:text-white">{userName || "المتدرب"}</div>
              <div className="text-sm text-slate-500">اجتاز بنجاح: {quiz.title}</div>
              <div className="mt-2 text-xs text-slate-400">بنسبة {result.score}% — {settings.siteName}</div>
              <div className="mt-1 text-[10px] text-slate-300">Created by RN. Ali Ashour</div>
              <button onClick={printCertificate} className="mt-3 rounded-full bg-sky-500 px-5 py-1.5 text-sm font-bold text-white">🖨️ طباعة الشهادة</button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => { setStarted(false); setFinished(false); setAnswers({}); setCurrent(0); }} className="rounded-full border border-sky-500 px-6 py-2 font-bold text-sky-500">إعادة</button>
            <Link to="/quizzes" className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">اختبارات أخرى</Link>
          </div>
        </div>

        {/* Review answers */}
        <div className="mt-6 space-y-3">
          <h2 className="font-bold dark:text-white">مراجعة الإجابات</h2>
          {quiz.questions.map((qq, i) => {
            const ua = answers[qq.id];
            const ok = ua === qq.correct;
            return (
              <div key={qq.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="font-semibold dark:text-white">{i + 1}. {qq.text}</div>
                <div className="mt-2 space-y-1 text-sm">
                  {qq.options.map((o, oi) => (
                    <div key={oi} className={`rounded-lg px-3 py-1.5 ${oi === qq.correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : oi === ua ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "text-slate-500"}`}>
                      {oi === qq.correct ? "✅ " : oi === ua ? "❌ " : ""}{o}
                    </div>
                  ))}
                </div>
                {qq.explanation && <div className="mt-2 rounded-lg bg-sky-50 p-2 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">💡 {qq.explanation}</div>}
                {!ok && ua === undefined && <div className="mt-1 text-xs text-amber-500">لم تتم الإجابة</div>}
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
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">سؤال {current + 1} من {quiz.questions.length}</span>
        {quiz.timeLimit > 0 && <span className={`rounded-full px-4 py-1 text-sm font-black ${secondsLeft < 30 ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600 dark:bg-sky-500/10"}`}>⏱ {mm}:{ss}</span>}
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-gradient-to-l from-sky-500 to-emerald-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold dark:text-white">{q.text}</h2>
        <div className="mt-4 space-y-2">
          {q.options.map((o, oi) => (
            <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-right transition ${answers[q.id] === oi ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 hover:border-sky-300 dark:border-slate-700"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[q.id] === oi ? "bg-sky-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>{["أ", "ب", "ج", "د", "هـ"][oi]}</span>
              <span className="dark:text-white">{o}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="rounded-full border border-slate-200 px-6 py-2 font-bold disabled:opacity-40 dark:border-slate-700 dark:text-white">السابق</button>
        <span className="text-xs text-slate-400">أُجيب {answered}/{quiz.questions.length}</span>
        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">التالي</button>
        ) : (
          <button onClick={finish} className="rounded-full bg-emerald-500 px-6 py-2 font-bold text-white">إنهاء وتصحيح</button>
        )}
      </div>
    </div>
  );
}
