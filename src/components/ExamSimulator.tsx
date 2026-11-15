import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock, Flag, Languages, ListChecks, RotateCcw, Timer, TrendingDown, Trophy } from "lucide-react";
import type { RunnerQuestion } from "./QuizRunner";
import { addAttempt, attachTopics, statsByBank, type ExamGroup } from "../lib/examHistory";
import { loadQuestionTopics, topicBreakdown, TOPIC_INFO, type TopicCode } from "../lib/examTopics";
import EditableImage from "./EditableImage";

/**
 * Exam simulator on top of an already-loaded question bank (no extra requests):
 * setup (count, timer) → timed exam (no feedback, flag, jump grid, resume after reload) → score → review of mistakes,
 * "retake my mistakes". Results are saved on the device (lib/examHistory) for the progress / weak-areas panel.
 * Multiple-response questions ("A,D,E") count as correct only when exactly the right set is chosen.
 */

/** jump (not smooth-scroll) to the top after a screen change; runs after render */
const toTop = () => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));

const SECONDS_PER_Q = 72; // ≈ Prometric / DHA pace (150 questions in 3 hours)
const PASS = 60;

type Session = {
  order: string[];
  answers: Record<string, string[]>;
  flagged: string[];
  index: number;
  endsAt: number | null; // null = untimed
  startedAt: number;
};
type Result = { order: string[]; answers: Record<string, string[]>; seconds: number; date?: number };

const correctSet = (q: RunnerQuestion) => q.correct_letter.split(",").map((x) => x.trim()).filter(Boolean);
const isRight = (q: RunnerQuestion, picked: string[] = []) => {
  const c = correctSet(q);
  return picked.length === c.length && c.every((l) => picked.includes(l));
};
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;
const read = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : null; } catch { return null; } };
const write = (k: string, v: unknown) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export default function ExamSimulator({ questions, bankKey, group, title, path }: {
  questions: RunnerQuestion[]; bankKey: string; group: ExamGroup; title: string; path: string;
}) {
  const SKEY = `nh_exam_session_${group}_${bankKey}`;
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const [phase, setPhase] = useState<"setup" | "exam" | "result" | "review">("setup");
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState<Session | null>(() => {
    const s = read<Session>(SKEY);
    return s && s.order.every((id) => byId.has(id)) ? s : null;
  });

  const start = (ids: string[], timed: boolean) => {
    const s: Session = { order: ids, answers: {}, flagged: [], index: 0, endsAt: timed ? Date.now() + ids.length * SECONDS_PER_Q * 1000 : null, startedAt: Date.now() };
    write(SKEY, s); setSaved(null); setSession(s); setPhase("exam"); toTop();
  };
  const finish = (s: Session) => {
    const date = Date.now();
    const r: Result = { order: s.order, answers: s.answers, seconds: Math.round((date - s.startedAt) / 1000), date };
    write(SKEY, null); setSession(null); setResult(r); setPhase("result"); toTop();
    const correct = r.order.filter((id) => isRight(byId.get(id)!, r.answers[id])).length;
    addAttempt({ key: bankKey, group, title, path, date, correct, total: r.order.length, seconds: r.seconds });
  };

  if (phase === "exam" && session) return <ExamRun s={session} byId={byId} onChange={(s) => { setSession(s); write(SKEY, s); }} onFinish={finish} />;
  if (phase === "result" && result) return <ResultView r={result} byId={byId} onReview={() => setPhase("review")} onNew={() => setPhase("setup")} onRetakeWrong={(ids) => start(shuffle(ids), true)} bankKey={bankKey} group={group} />;
  if (phase === "review" && result) return <ReviewView r={result} byId={byId} onBack={() => setPhase("result")} />;
  return <Setup total={questions.length} saved={saved} onResume={() => { if (saved) { if (saved.endsAt && saved.endsAt <= Date.now()) finish(saved); else { setSession(saved); setPhase("exam"); } } }}
    onDiscard={() => { write(SKEY, null); setSaved(null); }} onStart={(n, timed) => start(shuffle(questions.map((q) => q.id)).slice(0, n), timed)} />;
}

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const btnPrimary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#168C91] px-6 text-base font-black text-white hover:bg-[#127378] disabled:opacity-50";
const btnGhost = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-[#153448] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800";

function Setup({ total, saved, onResume, onDiscard, onStart }: { total: number; saved: Session | null; onResume: () => void; onDiscard: () => void; onStart: (n: number, timed: boolean) => void }) {
  const options = [10, 25, 50, 100].filter((n) => n < total);
  const [n, setN] = useState(options.includes(25) ? 25 : options[options.length - 1] ?? total);
  const [timed, setTimed] = useState(true);
  return (
    <div className="space-y-4">
      {saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="text-sm font-black text-amber-800 dark:text-amber-200">عندك امتحان لسه مخلّصتوش ({Object.keys(saved.answers).length}/{saved.order.length} سؤال)</div>
          <div className="flex gap-2"><button className={btnPrimary} onClick={onResume}>كمّل الامتحان</button><button className={btnGhost} onClick={onDiscard}>الغيه</button></div>
        </div>
      )}
      <div className={card}>
        <h2 className="text-lg font-black text-[#153448] dark:text-white">محاكي الامتحان</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">زي الامتحان الحقيقي: أسئلة عشوائية، وقت محدد، ومن غير ما تعرف الإجابة غير في الآخر.</p>
        <div className="mt-4 text-sm font-black text-slate-700 dark:text-slate-300">عدد الأسئلة</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...options, total].map((v) => (
            <button key={v} onClick={() => setN(v)} aria-pressed={n === v} className={`min-h-11 rounded-full px-4 text-sm font-black ${n === v ? "bg-[#153448] text-white dark:bg-[#168C91]" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
              {v === total ? `الكل (${total})` : v}
            </button>
          ))}
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-5 w-5 accent-[#168C91]" />
          بوقت حقيقي — {fmt(n * SECONDS_PER_Q)} دقيقة ({SECONDS_PER_Q} ثانية للسؤال)
        </label>
        <button className={`${btnPrimary} mt-4 w-full sm:w-auto`} onClick={() => onStart(n, timed)}><Timer size={20} aria-hidden="true" />ابدأ الامتحان</button>
      </div>
    </div>
  );
}

function ExamRun({ s, byId, onChange, onFinish }: { s: Session; byId: Map<string, RunnerQuestion>; onChange: (s: Session) => void; onFinish: (s: Session) => void }) {
  const [now, setNow] = useState(Date.now());
  const [ar, setAr] = useState(false);
  const [grid, setGrid] = useState(false);
  const done = useRef(false);
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const left = s.endsAt ? Math.round((s.endsAt - now) / 1000) : null;
  useEffect(() => { if (left !== null && left <= 0 && !done.current) { done.current = true; onFinish(s); } }, [left, s, onFinish]);

  const q = byId.get(s.order[s.index])!;
  const multi = correctSet(q).length > 1;
  const picked = s.answers[q.id] ?? [];
  const arMap = new Map((q.choices_ar ?? []).map((c) => [c.letter, c.text]));
  const answered = Object.values(s.answers).filter((a) => a.length).length;
  const flagged = s.flagged.includes(q.id);

  const pick = (l: string) => {
    const next = multi ? (picked.includes(l) ? picked.filter((x) => x !== l) : [...picked, l].sort()) : [l];
    onChange({ ...s, answers: { ...s.answers, [q.id]: next } });
  };
  const go = (i: number) => { onChange({ ...s, index: Math.max(0, Math.min(s.order.length - 1, i)) }); setGrid(false); toTop(); };
  const submit = () => {
    const missing = s.order.length - answered;
    if (missing > 0 && !window.confirm(`لسه فيه ${missing} سؤال من غير إجابة. تسلّم الامتحان؟`)) return;
    done.current = true; onFinish(s);
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-2 border-b border-slate-200 bg-[#F1F4F6]/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <span className="text-sm font-black text-[#153448] dark:text-white">سؤال {s.index + 1} / {s.order.length}</span>
        {left !== null && <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black tabular-nums ${left < 60 ? "bg-red-600 text-white" : "bg-[#153448] text-white dark:bg-[#168C91]"}`} role="timer" aria-live="off"><Clock size={16} aria-hidden="true" />{fmt(Math.max(0, left))}</span>}
        <button onClick={() => setGrid((g) => !g)} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white px-3 text-xs font-black text-[#153448] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700" aria-expanded={grid}><ListChecks size={16} aria-hidden="true" />{answered}/{s.order.length}</button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-[#168C91] transition-all" style={{ width: `${(answered / s.order.length) * 100}%` }} /></div>

      {grid && (
        <div className={`${card} grid grid-cols-8 gap-1.5 sm:grid-cols-12`}>
          {s.order.map((id, i) => {
            const a = (s.answers[id] ?? []).length > 0, f = s.flagged.includes(id);
            return <button key={id} onClick={() => go(i)} className={`h-9 rounded-lg text-xs font-black ${i === s.index ? "ring-2 ring-[#153448] dark:ring-white" : ""} ${f ? "bg-amber-400 text-amber-950" : a ? "bg-[#168C91] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`} aria-label={`سؤال ${i + 1}`}>{i + 1}</button>;
          })}
        </div>
      )}

      <article className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {multi ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">اختار كل الإجابات الصح ({correctSet(q).length})</span> : <span />}
          <div className="flex gap-2">
            {q.question_ar && <button onClick={() => setAr((v) => !v)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-black dark:border-slate-700 dark:text-white"><Languages size={14} aria-hidden="true" />{ar ? "English" : "عربي"}</button>}
            <button onClick={() => onChange({ ...s, flagged: flagged ? s.flagged.filter((x) => x !== q.id) : [...s.flagged, q.id] })} aria-pressed={flagged} className={`inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-black ${flagged ? "bg-amber-400 text-amber-950" : "border border-slate-200 dark:border-slate-700 dark:text-white"}`}><Flag size={14} aria-hidden="true" />{flagged ? "متعلّم للمراجعة" : "علّم للمراجعة"}</button>
          </div>
        </div>
        <EditableImage block emptyHint={false} slot={`q:${q.id}`} src={q.image_url} label="صورة السؤال" render={(u) => <img src={u} alt="" className="mb-3 max-h-64 w-full rounded-xl object-contain" loading="lazy" />} />
        <p className="text-lg font-bold leading-8 text-slate-900 dark:text-white" dir={ar && q.question_ar ? "rtl" : "ltr"}>{ar && q.question_ar ? q.question_ar : q.question_en}</p>
        <div className="mt-4 space-y-2" role={multi ? "group" : "radiogroup"}>
          {q.choices.map((c) => {
            const on = picked.includes(c.letter);
            return (
              <button key={c.letter} onClick={() => pick(c.letter)} role={multi ? "checkbox" : "radio"} aria-checked={on}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-start transition ${on ? "border-[#168C91] bg-[#168C91]/10 ring-1 ring-[#168C91]" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}
                dir={ar && q.question_ar ? "rtl" : "ltr"}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${on ? "bg-[#168C91] text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>{c.letter}</span>
                <span className="text-base text-slate-800 dark:text-slate-100">{ar ? arMap.get(c.letter) || c.text : c.text}</span>
              </button>
            );
          })}
        </div>
      </article>

      <div className="flex items-center justify-between gap-2">
        <button className={btnGhost} onClick={() => go(s.index - 1)} disabled={s.index === 0}><ChevronRight size={18} aria-hidden="true" />السابق</button>
        {s.index < s.order.length - 1
          ? <button className={btnPrimary} onClick={() => go(s.index + 1)}>التالي<ChevronLeft size={18} aria-hidden="true" /></button>
          : <button className={btnPrimary} onClick={submit}>سلّم الامتحان</button>}
      </div>
      {s.index < s.order.length - 1 && <div className="text-center"><button onClick={submit} className="text-sm font-bold text-slate-500 underline dark:text-slate-400">سلّم الامتحان دلوقتي</button></div>}
    </div>
  );
}

function ResultView({ r, byId, onReview, onNew, onRetakeWrong, bankKey, group }: { r: Result; byId: Map<string, RunnerQuestion>; onReview: () => void; onNew: () => void; onRetakeWrong: (ids: string[]) => void; bankKey: string; group: ExamGroup }) {
  const total = r.order.length;
  const wrong = r.order.filter((id) => !isRight(byId.get(id)!, r.answers[id]));
  const unanswered = r.order.filter((id) => !(r.answers[id] ?? []).length).length;
  const correct = total - wrong.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS;
  const prev = statsByBank(group).find((b) => b.key === bankKey);
  return (
    <div className="space-y-4">
      <div className={`${card} text-center`}>
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${passed ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"}`}>
          {passed ? <Trophy size={40} aria-hidden="true" /> : <TrendingDown size={40} aria-hidden="true" />}
        </div>
        <div className="mt-3 text-5xl font-black tabular-nums text-[#153448] dark:text-white">{pct}%</div>
        <div className={`mt-1 text-base font-black ${passed ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{passed ? "ناجح — كمّل كده" : `محتاج مذاكرة — النجاح التقريبي ${PASS}%`}</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"><CircleCheck size={18} className="mx-auto mb-1" aria-hidden="true" />{correct} صح</div>
          <div className="rounded-xl bg-red-50 p-3 font-black text-red-800 dark:bg-red-500/10 dark:text-red-200"><CircleX size={18} className="mx-auto mb-1" aria-hidden="true" />{wrong.length - unanswered} غلط</div>
          <div className="rounded-xl bg-slate-100 p-3 font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Clock size={18} className="mx-auto mb-1" aria-hidden="true" />{fmt(r.seconds)}</div>
        </div>
        {unanswered > 0 && <p className="mt-2 text-xs font-bold text-slate-500">{unanswered} سؤال من غير إجابة اتحسبوا غلط</p>}
        {total > 0 && correct / total < PASS / 100 && (
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            نصيحة: راجع شرح الأسئلة الغلط تحت، وبعدين ثبّت المعلومات في <Link to="/cards" className="text-[#127378] underline dark:text-teal-300">بطاقات المذاكرة</Link> قبل ما تعيد الامتحان.
          </p>
        )}
        {prev && prev.attempts > 1 && <p className="mt-2 text-xs font-bold text-slate-500">متوسطك في البنك ده: {prev.avg}% · أحسن نتيجة: {prev.best}% · {prev.attempts} محاولات</p>}
        <p className="mt-1 text-[11px] text-slate-500">نسبة النجاح الحقيقية بتختلف حسب الهيئة (DHA / Prometric / SNLE) — دي للتقييم بس.</p>
      </div>
      <TopicResults r={r} byId={byId} bankKey={bankKey} group={group} />
      <div className="flex flex-wrap justify-center gap-2">
        {wrong.length > 0 && <button className={btnPrimary} onClick={onReview}><ListChecks size={18} aria-hidden="true" />راجع أخطائك ({wrong.length})</button>}
        {wrong.length > 0 && <button className={btnGhost} onClick={() => onRetakeWrong(wrong)}><RotateCcw size={18} aria-hidden="true" />امتحن في الغلط بس</button>}
        <button className={btnGhost} onClick={onNew}>امتحان جديد</button>
      </div>
    </div>
  );
}

function ReviewView({ r, byId, onBack }: { r: Result; byId: Map<string, RunnerQuestion>; onBack: () => void }) {
  const wrong = r.order.filter((id) => !isRight(byId.get(id)!, r.answers[id]));
  const [ar, setAr] = useState(true);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className={btnGhost} onClick={onBack}><ChevronRight size={18} aria-hidden="true" />النتيجة</button>
        <button className={btnGhost} onClick={() => setAr((v) => !v)}><Languages size={16} aria-hidden="true" />{ar ? "الشرح بالإنجليزي" : "الشرح بالعربي"}</button>
      </div>
      {wrong.map((id, i) => {
        const q = byId.get(id)!;
        const mine = r.answers[id] ?? [];
        const right = correctSet(q);
        return (
          <article key={id} className={card}>
            <div className="text-xs font-black text-slate-500">{i + 1} / {wrong.length}</div>
            <EditableImage block emptyHint={false} slot={`q:${q.id}`} src={q.image_url} label="صورة السؤال" render={(u) => <img src={u} alt="" className="my-2 max-h-56 w-full rounded-xl object-contain" loading="lazy" />} />
            <p className="mt-1 font-bold leading-7 text-slate-900 dark:text-white" dir="ltr">{q.question_en}</p>
            <ul className="mt-3 space-y-1.5" dir="ltr">
              {q.choices.map((c) => {
                const isR = right.includes(c.letter), isM = mine.includes(c.letter);
                return (
                  <li key={c.letter} className={`flex items-start gap-2 rounded-lg p-2 text-sm ${isR ? "bg-emerald-50 font-bold text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100" : isM ? "bg-red-50 text-red-900 line-through dark:bg-red-500/10 dark:text-red-200" : "text-slate-700 dark:text-slate-300"}`}>
                    <b>{c.letter}.</b><span>{c.text}</span>
                  </li>
                );
              })}
            </ul>
            {!mine.length && <p className="mt-2 text-xs font-black text-slate-500">ما جاوبتش السؤال ده</p>}
            {(ar ? q.rationale_ar || q.rationale_en : q.rationale_en || q.rationale_ar) && (
              <p className="mt-3 whitespace-pre-line rounded-xl bg-[#F1F4F6] p-3 text-sm leading-7 text-slate-800 dark:bg-slate-800 dark:text-slate-200" dir={ar && q.rationale_ar ? "rtl" : "ltr"}>
                {ar ? q.rationale_ar || q.rationale_en : q.rationale_en || q.rationale_ar}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

/** "Your progress / weak areas" — from this device's simulator results. Renders nothing until there is at least one result. */
export function ExamProgressPanel({ group }: { group?: ExamGroup }) {
  const stats = useMemo(() => statsByBank(group), [group]);
  if (!stats.length) return null;
  const weakest = stats[0];
  return (
    <section className={`${card} mb-6`} aria-label="تقدّمك">
      <h2 className="flex items-center gap-2 text-lg font-black text-[#153448] dark:text-white"><TrendingDown size={20} className="text-[#168C91]" aria-hidden="true" />تقدّمك ونقاط ضعفك</h2>
      {weakest.avg < PASS && <p className="mt-1 text-sm font-bold text-red-700 dark:text-red-300">ركّز على: <Link to={weakest.path} className="underline">{weakest.title}</Link> (متوسطك {weakest.avg}%)</p>}
      <ul className="mt-3 space-y-2">
        {stats.slice(0, 6).map((b) => (
          <li key={b.key}>
            <Link to={b.path} className="block rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              <div className="flex items-center justify-between gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <span className="truncate">{b.title}</span><span className="shrink-0 tabular-nums">{b.avg}% · {b.attempts}×</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-full ${b.avg >= PASS ? "bg-emerald-500" : b.avg >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.max(4, b.avg)}%` }} /></div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">محفوظة على الجهاز ده بس.</p>
    </section>
  );
}

/** Study / exam-simulator switch kept in the URL (?mode=exam), so the choice survives reloads and can be shared. */
export function useExamMode() {
  const [params, setParams] = useSearchParams();
  const exam = params.get("mode") === "exam";
  const set = (v: boolean) => { const p = new URLSearchParams(params); if (v) p.set("mode", "exam"); else p.delete("mode"); setParams(p, { replace: true }); };
  const switcher = (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-slate-200/70 p-1 dark:bg-slate-800" role="tablist" aria-label="طريقة المذاكرة">
      <button role="tab" aria-selected={!exam} onClick={() => set(false)} className={`min-h-11 rounded-full text-sm font-black ${!exam ? "bg-white text-[#153448] shadow dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>مذاكرة (إجابة فورية)</button>
      <button role="tab" aria-selected={exam} onClick={() => set(true)} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-black ${exam ? "bg-[#153448] text-white shadow dark:bg-[#168C91]" : "text-slate-600 dark:text-slate-300"}`}><Timer size={16} aria-hidden="true" />محاكي امتحان</button>
    </div>
  );
  return { exam, switcher };
}

/** Score per topic for this attempt (approximate automatic topics), weakest first, with where to review. Saved with the attempt. */
function TopicResults({ r, byId, bankKey, group }: { r: Result; byId: Map<string, RunnerQuestion>; bankKey: string; group: ExamGroup }) {
  const [rows, setRows] = useState<{ t: TopicCode; c: number; n: number }[] | null>(null);
  useEffect(() => {
    let alive = true;
    void loadQuestionTopics(group, bankKey).then((topics) => {
      if (!alive || !topics) return;
      const b = topicBreakdown(r.order, (id) => isRight(byId.get(id)!, r.answers[id]), topics);
      if (r.date) attachTopics(bankKey, r.date, b);
      setRows(Object.entries(b).map(([t, [c, n]]) => ({ t: t as TopicCode, c, n })).filter((x) => x.t !== "general").sort((a, b2) => a.c / a.n - b2.c / b2.n));
    });
    return () => { alive = false; };
  }, [r, byId, bankKey, group]);
  if (!rows || rows.length < 2) return null;
  return (
    <div className={card}>
      <h3 className="mb-1 font-black text-[#153448] dark:text-white">نتيجتك حسب الموضوع</h3>
      <p className="mb-3 text-[11px] text-slate-500">تصنيف تلقائي تقريبي للأسئلة — الأضعف فوق.</p>
      <ul className="space-y-2">
        {rows.map(({ t, c, n }) => {
          const pct = Math.round((c / n) * 100);
          const info = TOPIC_INFO[t];
          return (
            <li key={t} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">{info.ar}</span>
                <span className="flex items-center gap-2">
                  <span className={`font-black tabular-nums ${pct >= PASS ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{c}/{n}</span>
                  {pct < PASS && info.to && <Link to={info.to} className="text-xs font-bold text-[#127378] underline dark:text-teal-300">ذاكر الموضوع</Link>}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                <div className={`h-full ${pct >= PASS ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
