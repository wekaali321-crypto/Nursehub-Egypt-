import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, CheckCircle2, Keyboard, Mic, MicOff, PhoneOff, RotateCcw, Sparkles, Volume2, X, XCircle, Zap } from "lucide-react";
import AliAvatar, { type AvatarMood } from "./AliAvatar";
import { Button } from "../ui";
import { useI18n } from "../../lib/i18n";
import { TOPIC_INFO, type TopicCode } from "../../lib/examTopics";
import { addAttempt } from "../../lib/examHistory";
import { canListen, getTtsStatus, listen, prefetchSpeech, setTarekVoice, speak, usePhoneVoice, unlockAudio, type Gender, type Lang, type ListenHandle, type SpeakHandle } from "../../lib/oral/voice";
import { matchChoice } from "../../lib/oral/match";
import { aiGenerate, aiGrade, getAiStatus, isFallback, loadPool, pageContext, pickQuestions, topicForPath, type AiQuestion, type AiStatus, type PoolQuestion } from "../../lib/oral/api";

/**
 * Oral exam with Ali Ashour, available on every page (launcher in PublicLayout).
 *  - Smart mode (Workers AI): open questions from the page the learner is reading (or a topic), spoken answers marked by the AI.
 *  - Free mode: multiple-choice questions from the static bank, read aloud; the learner says the letter or the answer.
 * The smart mode falls back to the free one by itself when the day's free AI budget is used up (or the AI is off / fails),
 * keeping the progress. Voice in / out is the browser's own (free). Results go to "My learning" (this device only).
 */
type Mode = "ai" | "free";
type Item = { kind: "mcq"; pq: PoolQuestion } | { kind: "open"; q: AiQuestion };
type Result = { said: string; score: 0 | 1 | 2; feedback: string; missing?: string[]; selfMarked?: boolean };
type Phase = "asking" | "listening" | "grading" | "feedback" | "selfmark";
interface Prefs { mode: Mode; gender: Gender; lang: Lang; count: number; source: "page" | "topic"; topic: TopicCode | "mixed"; handsFree: boolean }
const PREFS = "nh_oral_prefs_v1";
const loadPrefs = (lang: Lang): Prefs => {
  const d: Prefs = { mode: "ai", gender: "male", lang, count: 5, source: "page", topic: "mixed", handsFree: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem(PREFS) || "{}") }; } catch { return d; }
};
const LETTERS = ["A", "B", "C", "D", "E"];
const AR_LETTERS = ["أ", "ب", "ج", "د", "هـ"];

export default function OralExamPanel({ onClose, preset }: { onClose: () => void; preset?: Partial<Prefs> }) {
  const { lang: siteLang } = useI18n();
  const loc = useLocation();
  const [prefs, setPrefs] = useState<Prefs>(() => ({ ...loadPrefs(siteLang === "en" ? "en" : "ar"), ...(preset || {}) }));
  const ar = prefs.lang === "ar";
  const T = (a: string, e: string) => (ar ? a : e);
  const P = persona(prefs.gender);
  const G = (m: string, f: string) => (P.female ? f : m); // Arabic verb for a male / female examiner
  const pageTopic = topicForPath(loc.pathname, loc.search);
  const [status, setStatus] = useState<AiStatus | null | undefined>(undefined);
  const [step, setStep] = useState<"setup" | "loading" | "run" | "done">("setup");
  const [mode, setMode] = useState<Mode>(prefs.mode);
  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("asking");
  const phaseRef = useRef<Phase>("asking");
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const [results, setResults] = useState<Result[]>([]);
  const [mood, setMood] = useState<AvatarMood>("idle");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [showType, setShowType] = useState(!canListen());
  const [notice, setNotice] = useState("");
  const tries = useRef(0);
  const resRef = useRef<Result[]>([]);
  const turn = useRef(0); // bumps on every new question / repeat / end: older async steps see it changed and stop
  const speaking = useRef<SpeakHandle | null>(null);
  const listening = useRef<ListenHandle | null>(null);
  const alive = useRef(true);
  const started = useRef(Date.now());
  const ctx = useRef<{ title: string; topic: TopicCode | "mixed" }>({ title: "", topic: "mixed" });

  useEffect(() => { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch { /* ignore */ } }, [prefs]);

  // The voice is always Tarek (ElevenLabs via /api/tts). If it cannot speak, nothing else speaks: the text stays on screen
  // and a notice says why (never pretending Tarek is talking).
  // Temporary: while the server has no ElevenLabs key at all, the phone's own voice speaks (and is labelled as such).
  const [egVoice, setEgVoice] = useState<"tarek" | "phone" | "off" | undefined>(undefined);
  const voiceNotice = (reason: string) => (reason === "monthly_limit"
    ? T("رصيد صوت Tarek للشهر ده خلص، فالامتحان هيكمل مكتوب من غير صوت. الرصيد بيتجدد أول الشهر.", "Tarek's voice budget for this month is used up, so the exam continues as text without sound. It renews next month.")
    : T("صوت Tarek مش متاح دلوقتي، فالامتحان هيكمل مكتوب من غير صوت.", "Tarek's voice isn't available right now, so the exam continues as text without sound."));
  useEffect(() => {
    getTtsStatus().then((s) => {
      if (!alive.current) return;
      if (!s || !s.configured) { usePhoneVoice(); setEgVoice("phone"); return; }
      setEgVoice(s.tts ? "tarek" : "off");
      if (!s.tts) setNotice(voiceNotice(s.enabled ? "monthly_limit" : "tts_off"));
      setTarekVoice(s.tts, (reason: string) => {
        if (!alive.current) return;
        setEgVoice("off");
        setNotice(voiceNotice(reason));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live AI budget: on open, then every 30 s while the smart mode is chosen / running
  useEffect(() => {
    let t = 0;
    const load = async () => { const s = await getAiStatus(); if (alive.current) setStatus(s); };
    load();
    if (prefs.mode === "ai") t = window.setInterval(load, 30000);
    return () => clearInterval(t);
  }, [prefs.mode]);

  const stopAll = useCallback(() => { speaking.current?.stop(); listening.current?.stop(); speaking.current = null; listening.current = null; setLevel(0); }, []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; stopAll(); }; }, [stopAll]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => { stopAll(); onClose(); };

  const say = useCallback(async (text: string, l: Lang = prefs.lang) => {
    speaking.current?.stop();
    // "speaking" only while Tarek's audio actually plays
    const h = speak(text, {
      lang: l, gender: prefs.gender,
      onLevel: (v) => alive.current && setLevel(v),
      onPlaying: (on) => alive.current && setMood((m) => (m === "happy" || m === "sad" ? m : on ? "speaking" : "idle")),
    });
    speaking.current = h;
    await h.done;
    if (speaking.current === h) speaking.current = null;
  }, [prefs.gender, prefs.lang]);

  const aiOk = status === undefined ? true : !!status?.ai;

  /* ---------- start ---------- */
  const freeItems = async (topic: TopicCode | "mixed", n: number): Promise<Item[]> => {
    let pool = await loadPool(topic);
    if (pool.length < n) pool = await loadPool("mixed");
    return pickQuestions(pool, n).map((pq) => ({ kind: "mcq" as const, pq }));
  };

  const start = async () => {
    unlockAudio(); // inside the tap: lets Ali's voice play on phones without another tap
    stopAll();
    setStep("loading"); setNotice(""); setResults([]); resRef.current = []; setI(0); setMood("thinking"); started.current = Date.now();
    const page = pageContext();
    const topic = prefs.source === "page" ? pageTopic : prefs.topic;
    const topicName = topic === "mixed" ? T("أسئلة تمريض عامة", "General nursing") : TOPIC_INFO[topic].en;
    ctx.current = { title: prefs.source === "page" && page.title ? page.title : (topic === "mixed" ? T("امتحان شفوي عام", "General oral exam") : (ar ? TOPIC_INFO[topic].ar : TOPIC_INFO[topic].en)), topic };
    let list: Item[] = [];
    let m: Mode = prefs.mode;
    if (m === "ai") {
      const r = await aiGenerate({ gender: prefs.gender, lang: prefs.lang, title: page.title, text: prefs.source === "page" ? page.text : "", topic: topicName, count: prefs.count });
      if (isFallback(r)) { m = "free"; setNotice(fallbackText(r.reason, ar)); getAiStatus().then((s) => alive.current && setStatus(s)); }
      else list = r.questions.map((q) => ({ kind: "open" as const, q }));
    }
    if (m === "free") list = await freeItems(topic, prefs.count);
    if (!alive.current) return;
    if (!list.length) { setStep("setup"); setNotice(T("مقدرناش نجهّز الأسئلة دلوقتي، جرّب تاني.", "Could not prepare the questions, try again.")); setMood("idle"); return; }
    setMode(m); setItems(list); setStep("run");
    await say(T(`أهلًا! أنا ${P.arFull}. هسألك ${list.length} أسئلة. جاوب بصوتك بعد ما أخلص السؤال.`, `Hi! I'm ${P.en}. I'll ask you ${list.length} questions. Answer out loud when I finish each one.`));
    if (alive.current) ask(0, list);
  };

  /* ---------- one question ---------- */
  const questionText = (it: Item) => (it.kind === "open" ? it.q.q : (ar && it.pq.ar) || it.pq.en);
  const choiceTexts = (it: Item): string[] => (it.kind === "mcq" ? (ar && it.pq.ca) || it.pq.c : []);

  const ask = async (k: number, list = items) => {
    const it = list[k];
    if (!it) return;
    const my = ++turn.current;
    const live = () => alive.current && turn.current === my;
    setI(k); setHeard(""); setTyped(""); tries.current = 0; setMood("idle"); setPhase("asking");
    if (it.kind === "mcq") {
      const qLang: Lang = ar && it.pq.ar ? "ar" : "en";
      const cLang: Lang = ar && it.pq.ca ? "ar" : "en";
      const choicesSpeech = choiceTexts(it).map((c, j) => `${cLang === "ar" ? AR_LETTERS[j] : LETTERS[j]}. ${c}.`).join(" ");
      prefetchSpeech(choicesSpeech, { lang: cLang });
      await say(`${T("سؤال", "Question")} ${k + 1}. ${questionText(it)}`, qLang);
      if (!live()) return;
      await say(choicesSpeech, cLang);
    } else {
      await say(`${T("سؤال", "Question")} ${k + 1}. ${it.q.q}`);
    }
    if (!live()) return;
    if (canListen() && prefs.handsFree) startListening(k, list); else { setMood("idle"); setPhase("listening"); }
  };

  const startListening = (k = i, list = items) => {
    speaking.current?.stop();
    listening.current?.stop();
    setPhase("listening"); setMood("listening"); setHeard("");
    const h = listen({ lang: prefs.lang, onInterim: (t) => alive.current && setHeard(t) });
    listening.current = h;
    h.result.then((text) => {
      if (!alive.current || listening.current !== h) return;
      listening.current = null;
      setMood("idle");
      if (text.trim()) submit(text, k, list);
    });
  };

  const submit = async (answer: string, k = i, list = items) => {
    const it = list[k];
    if (!it || phaseRef.current === "grading" || phaseRef.current === "feedback") return;
    listening.current?.stop(); listening.current = null;
    setHeard(answer);
    if (it.kind === "mcq") {
      const idx = matchChoice(answer, [0, 1, 2, 3, 4].slice(0, it.pq.c.length).map((j) => [it.pq.c[j], it.pq.ca?.[j] ?? ""]));
      if (idx < 0) {
        const n = ++tries.current;
        await say(T(`مش ${G("متأكد", "متأكدة")} إني فهمت. قول حرف الإجابة، أو اضغط عليها.`, "I didn't quite get that. Say the letter of your answer, or tap it."));
        if (alive.current && n < 2 && canListen()) startListening(k, list); else setPhase("listening");
        return;
      }
      return chooseMcq(idx, answer, k, list);
    }
    // open question → AI marks it
    setPhase("grading"); setMood("thinking");
    const r = await aiGrade({ gender: prefs.gender, lang: prefs.lang, q: it.q.q, points: it.q.points, answer });
    if (!alive.current) return;
    if (isFallback(r)) {
      // the budget ran out mid-exam: the learner marks this answer against the key points, the rest becomes the free exam
      setNotice(fallbackText(r.reason, ar)); getAiStatus().then((s) => alive.current && setStatus(s));
      setPhase("selfmark"); setMood("idle");
      await say(T("خلص رصيد الذكاء الاصطناعي لليوم. قارن إجابتك بالنقط اللي قدامك وقيّم نفسك، وبعدها هنكمل بالأسئلة المجانية.", "The AI budget for today is used up. Compare your answer with the key points and mark yourself, then we'll go on with free questions."));
      return;
    }
    record(k, { said: answer, score: r.score as 0 | 1 | 2, feedback: r.feedback, missing: r.missing });
    setPhase("feedback"); setMood(r.score === 2 ? "happy" : r.score === 1 ? "idle" : "sad");
    const my = turn.current;
    await say(r.feedback || (r.score === 2 ? T("إجابة ممتازة.", "Excellent answer.") : T("إجابة ناقصة.", "Not quite.")));
    if (alive.current && turn.current === my) afterFeedback(k, list);
  };

  const chooseMcq = async (idx: number, said: string, k = i, list = items) => {
    const it = list[k];
    if (!it || it.kind !== "mcq" || phaseRef.current === "feedback" || resRef.current[k]) return;
    listening.current?.stop(); listening.current = null;
    const right = idx === it.pq.a;
    const cTexts = choiceTexts(it);
    const letter = (j: number) => (ar && it.pq.ca ? AR_LETTERS[j] : LETTERS[j]);
    const why = (ar && it.pq.ra) || it.pq.r || "";
    const fb = right
      ? `${T("صح! برافو.", "Correct! Well done.")} ${why}`
      : `${T("للأسف لأ. الإجابة الصح هي", "Not quite. The right answer is")} ${letter(it.pq.a)}: ${cTexts[it.pq.a]}. ${why}`;
    record(k, { said: said || `${letter(idx)}. ${cTexts[idx]}`, score: right ? 2 : 0, feedback: fb });
    setPhase("feedback"); setMood(right ? "happy" : "sad");
    const my = turn.current;
    await say(fb, ar && (it.pq.ra || !why) ? "ar" : why ? "en" : prefs.lang);
    if (alive.current && turn.current === my) afterFeedback(k, list);
  };

  const selfMark = async (score: 0 | 1 | 2) => {
    const it = items[i];
    if (!it || it.kind !== "open") return;
    record(i, { said: heard || typed, score, feedback: T("تقييم ذاتي بالنقط الأساسية.", "Self-marked against the key points."), missing: it.q.points, selfMarked: true });
    // the rest of the exam: free questions of the same topic
    const rest = items.length - i - 1;
    let list = items;
    if (rest > 0) { const more = await freeItems(ctx.current.topic, rest); list = [...items.slice(0, i + 1), ...more]; setItems(list); setMode("free"); }
    afterFeedback(i, list);
  };

  const record = (k: number, r: Result) => { const n = [...resRef.current]; n[k] = r; resRef.current = n; setResults(n); };

  const afterFeedback = (k: number, list: Item[]) => {
    setPhase("feedback");
    if (!prefs.handsFree) return;
    const my = turn.current;
    window.setTimeout(() => { if (alive.current && turn.current === my && phaseRef.current === "feedback") next(k, list); }, 900);
  };

  const next = (k = i, list = items) => {
    stopAll();
    if (k + 1 >= list.length) return finish(list);
    setMood("idle");
    ask(k + 1, list);
  };

  const finish = (list = items) => {
    turn.current++;
    stopAll();
    if (step === "done") return;
    setStep("done");
    {
      const done = resRef.current.filter(Boolean);
      // partly-right answers count half
      const correct = Math.round(done.reduce((n, r) => n + r.score, 0) / 2);
      if (done.length) {
        addAttempt({ key: `oral-${ctx.current.topic}`, group: "oral", title: `${T("شفوي", "Oral")}: ${ctx.current.title}`.slice(0, 120), path: loc.pathname, date: Date.now(), correct, total: done.length, seconds: Math.round((Date.now() - started.current) / 1000), topics: ctx.current.topic !== "mixed" && list[0]?.kind === "mcq" ? { [ctx.current.topic]: [correct, done.length] } : undefined });
      }
      const pct = done.length ? Math.round((correct / done.length) * 100) : 0;
      setMood(pct >= 60 ? "happy" : "idle");
      void say(done.length ? T(`خلصنا! جبت ${correct} من ${done.length}. ${pct >= 60 ? "شغل ممتاز، كمّل كده." : "محتاج تراجع شوية، وهتبقى أحسن المرة الجاية."}`, `All done! You got ${correct} out of ${done.length}. ${pct >= 60 ? "Great work, keep it up." : "A bit more review and you'll do better next time."}`) : T("خلصنا. ابدأ تاني وقت ما تحب.", "We're done. Start again any time."));
    }
  };

  const it = items[i];
  const done = results.filter(Boolean);
  const correct = done.filter((r) => r.score === 2).length;
  const pctNow = done.length ? Math.round((done.reduce((n, r) => n + r.score, 0) / (2 * done.length)) * 100) : 0;

  /* ---------- UI ---------- */
  return (
    <div role="dialog" aria-modal="true" aria-label={T(`الامتحان الشفوي مع ${P.ar}`, `Oral exam with ${P.en}`)} dir={ar ? "rtl" : "ltr"}
      className="fixed inset-0 z-[95] flex items-end justify-center bg-nh-navy/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
      <div className="relative flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#0f2236] text-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Bot size={18} className="text-teal-300" aria-hidden="true" />
          <h2 className="flex-1 truncate text-sm font-black">{step === "run" || step === "done" ? ctx.current.title : T(`امتحان شفوي مع ${P.arFull}`, `Oral exam with ${P.en}`)}</h2>
          {step === "run" && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${mode === "ai" ? "bg-teal-400/20 text-teal-200" : "bg-white/10 text-slate-200"}`}>{mode === "ai" ? T("ذكي", "Smart") : T("مجاني", "Free")}</span>}
          {step === "run" && <button type="button" onClick={() => finish()} className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold hover:bg-rose-700"><PhoneOff size={14} aria-hidden="true" />{T("إنهاء", "End exam")}</button>}
          <button type="button" onClick={close} aria-label={T("إغلاق", "Close")} className="rounded-full p-1.5 text-slate-300 hover:bg-white/10"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notice && <p role="status" className="mx-4 mt-3 rounded-xl bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-200">{notice}</p>}

          {step === "setup" && (
            <Setup egVoice={egVoice} prefs={prefs} setPrefs={setPrefs} status={status} aiOk={aiOk} pageTopic={pageTopic} T={T} ar={ar} onStart={start} />
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 px-4 py-10">
              <AliAvatar label={ar ? P.arFull : P.en} mood="thinking" size={190} />
              <p className="text-sm font-bold text-slate-200">{T(`${P.ar} ${G("بيجهّز", "بتجهّز")} الأسئلة…`, `${P.en} is preparing your questions…`)}</p>
            </div>
          )}

          {step === "run" && it && (
            <div className="px-4 pb-4">
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${(done.length / items.length) * 100}%` }} /></div>
              <p className="mt-1 text-center text-[11px] font-bold text-slate-300">{T(`${done.length} من ${items.length} أسئلة`, `${done.length} of ${items.length} questions covered`)}</p>
              <div className="flex justify-center"><AliAvatar label={ar ? P.arFull : P.en} mood={mood} level={level} size={200} /></div>
              <p className="-mt-1 mb-2 text-center text-xs font-bold text-teal-200" aria-live="polite">
                {mood === "speaking" ? T(`${P.ar} ${G("بيتكلم", "بتتكلم")}…`, `${P.en} is speaking…`) : phase === "listening" && mood === "listening" ? T("بسمعك…", "Listening…") : phase === "grading" ? T(`${P.ar} ${G("بيقيّم", "بتقيّم")} إجابتك…`, `${P.en} is marking your answer…`) : " "}
              </p>

              <div className="rounded-2xl bg-white/[0.06] p-4">
                <div className="text-[11px] font-bold text-slate-400">{T(`سؤال ${i + 1} من ${items.length}`, `Question ${i + 1} of ${items.length}`)}</div>
                <p className="mt-1 font-bold leading-7" dir="auto">{questionText(it)}</p>
                {it.kind === "mcq" && (
                  <ul className="mt-3 space-y-2">
                    {choiceTexts(it).map((c, j) => {
                      const r = results[i];
                      const state = r ? (j === it.pq.a ? "right" : "") : "";
                      return (
                        <li key={j}>
                          <button type="button" disabled={!!r} onClick={() => chooseMcq(j, "")} dir="auto"
                            className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-start text-sm transition ${state === "right" ? "border-emerald-400 bg-emerald-400/15" : "border-white/10 bg-white/[0.03] hover:border-teal-300/60"}`}>
                            <b className="shrink-0 text-teal-300">{ar && it.pq.ca ? AR_LETTERS[j] : LETTERS[j]}</b><span>{c}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {phase === "selfmark" && it.kind === "open" && (
                  <div className="mt-3 rounded-xl bg-white/[0.06] p-3 text-sm">
                    <div className="mb-1 text-xs font-bold text-slate-300">{T("النقط الأساسية:", "Key points:")}</div>
                    <ul className="list-disc space-y-1 ps-5">{it.q.points.map((p) => <li key={p} dir="auto">{p}</li>)}</ul>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button size="sm" onClick={() => selfMark(2)}>{T("جاوبت صح", "I got it")}</Button>
                      <Button size="sm" variant="secondary" onClick={() => selfMark(1)}>{T("جزئيًا", "Partly")}</Button>
                      <Button size="sm" variant="danger" onClick={() => selfMark(0)}>{T("غلط", "Missed it")}</Button>
                    </div>
                  </div>
                )}
              </div>

              {(heard || phase === "listening") && phase !== "feedback" && (
                <p className="mt-3 rounded-xl border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-sm" dir="auto"><span className="text-xs font-bold text-teal-200">{T("إجابتك: ", "You said: ")}</span>{heard || "…"}</p>
              )}

              {phase === "feedback" && results[i] && (
                <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${results[i].score === 2 ? "bg-emerald-400/15 text-emerald-100" : results[i].score === 1 ? "bg-amber-400/15 text-amber-100" : "bg-rose-400/15 text-rose-100"}`} dir="auto">
                  <div className="mb-1 flex items-center gap-1 font-black">{results[i].score === 2 ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}{results[i].score === 2 ? T("صح", "Correct") : results[i].score === 1 ? T("ناقصة", "Partly right") : T("غلط", "Not right")}</div>
                  {results[i].feedback}
                  {!!results[i].missing?.length && results[i].score < 2 && <ul className="mt-1 list-disc ps-5 text-xs opacity-90">{results[i].missing!.map((p) => <li key={p}>{p}</li>)}</ul>}
                </div>
              )}

              {/* controls */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {phase !== "feedback" && phase !== "grading" && phase !== "selfmark" && canListen() && (
                  mood === "listening"
                    ? <button type="button" onClick={() => listening.current?.stop()} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-black hover:bg-rose-700"><MicOff size={18} aria-hidden="true" />{T("خلصت إجابتي", "I'm done")}</button>
                    : <button type="button" onClick={() => startListening()} className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-3 text-sm font-black text-nh-navy hover:bg-teal-400"><Mic size={18} aria-hidden="true" />{T("اضغط واتكلم", "Tap & speak")}</button>
                )}
                {phase !== "feedback" && phase !== "selfmark" && <button type="button" onClick={() => ask(i)} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"><Volume2 size={14} aria-hidden="true" />{T("كرر السؤال", "Repeat")}</button>}
                {phase !== "feedback" && phase !== "selfmark" && <button type="button" onClick={() => setShowType((v) => !v)} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"><Keyboard size={14} aria-hidden="true" />{T("اكتب بدل الكلام", "Type instead")}</button>}
                {phase === "feedback" && <Button onClick={() => next()}>{i + 1 >= items.length ? T("النتيجة", "See results") : T("السؤال التالي", "Next question")}</Button>}
              </div>
              {showType && phase !== "feedback" && phase !== "selfmark" && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) submit(typed.trim()); }}>
                  <input value={typed} onChange={(e) => setTyped(e.target.value)} dir="auto" placeholder={T("اكتب إجابتك…", "Type your answer…")} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400" />
                  <Button type="submit" size="sm" disabled={!typed.trim() || phase === "grading"}>{T("إرسال", "Send")}</Button>
                </form>
              )}
              {!canListen() && <p className="mt-3 text-center text-[11px] text-slate-400">{T("المتصفح ده مش بيدعم الإجابة بالصوت — استخدم Chrome أو اكتب إجابتك.", "This browser can't take spoken answers — use Chrome, or type your answer.")}</p>}
            </div>
          )}

          {step === "done" && (
            <div className="px-4 pb-5">
              <div className="flex justify-center"><AliAvatar label={ar ? P.arFull : P.en} mood={mood} level={level} size={170} /></div>
              <div className="text-center">
                <div className="text-4xl font-black">{pctNow}%</div>
                <p className="text-sm text-slate-300">{T(`${correct} إجابة صح من ${done.length}`, `${correct} correct out of ${done.length}`)}{done.some((r) => r.score === 1) ? T(` و${done.filter((r) => r.score === 1).length} ناقصة`, `, ${done.filter((r) => r.score === 1).length} partly right`) : ""}</p>
              </div>
              <ol className="mt-4 space-y-2">
                {items.map((x, k) => results[k] && (
                  <li key={k} className="rounded-xl bg-white/[0.06] p-3 text-sm">
                    <div className="flex items-start gap-2">
                      {results[k].score === 2 ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" /> : <XCircle size={16} className={`mt-0.5 shrink-0 ${results[k].score === 1 ? "text-amber-300" : "text-rose-300"}`} aria-hidden="true" />}
                      <div className="min-w-0" dir="auto">
                        <p className="font-bold">{questionText(x)}</p>
                        {results[k].said && <p className="mt-1 text-xs text-slate-300">{T("إجابتك: ", "You said: ")}{results[k].said}</p>}
                        <p className="mt-1 text-xs text-slate-200">{results[k].feedback}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button onClick={start} icon={<RotateCcw size={16} aria-hidden="true" />}>{T("امتحان جديد", "New exam")}</Button>
                <Button variant="secondary" onClick={() => { stopAll(); setStep("setup"); setMood("idle"); }}>{T("غيّر الإعدادات", "Change settings")}</Button>
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">{T("النتيجة اتحفظت في «مذاكرتي» على الجهاز ده.", "Saved to “My learning” on this device.")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fallbackText(reason: string, ar: boolean): string {
  if (reason === "daily_limit") return ar ? "رصيد الذكاء الاصطناعي المجاني لليوم خلص، فكمّلنا بالامتحان المجاني. الرصيد بيتجدد كل يوم." : "Today's free AI budget is used up, so we switched to the free exam. It renews every day.";
  if (reason === "rate_limited") return ar ? "استخدمت الامتحان الذكي كتير في الساعة دي، فكمّلنا بالامتحان المجاني." : "You've used the smart exam a lot this hour, so we switched to the free exam.";
  if (reason === "ai_off") return ar ? "الامتحان الذكي متوقف حاليًا، فكمّلنا بالامتحان المجاني." : "The smart exam is off right now, so we switched to the free exam.";
  return ar ? "الامتحان الذكي مش متاح دلوقتي، فكمّلنا بالامتحان المجاني." : "The smart exam isn't available right now, so we switched to the free exam.";
}

/* ---------- setup screen ---------- */
function Setup({ egVoice, prefs, setPrefs, status, aiOk, pageTopic, T, ar, onStart }: {
  egVoice: "tarek" | "phone" | "off" | undefined;
  prefs: Prefs; setPrefs: (f: (p: Prefs) => Prefs) => void; status: AiStatus | null | undefined; aiOk: boolean; pageTopic: TopicCode | "mixed";
  T: (a: string, e: string) => string; ar: boolean; onStart: () => void;
}) {
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));
  const P = persona(prefs.gender);
  const G = (m: string, f: string) => (P.female ? f : m);
  const opt = (on: boolean) => `flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition ${on ? "border-teal-300 bg-teal-300/10" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`;
  const pill = (on: boolean) => `flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${on ? "border-teal-300 bg-teal-300/15 text-teal-100" : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/25"}`;
  const pageName = pageTopic === "mixed" ? T("الصفحة الحالية", "This page") : `${T("الصفحة الحالية", "This page")} (${ar ? TOPIC_INFO[pageTopic].ar : TOPIC_INFO[pageTopic].en})`;
  return (
    <div className="space-y-4 px-4 pb-5 pt-3">
      <div className="flex items-center gap-3">
        <AliAvatar label={ar ? P.arFull : P.en} mood="idle" size={92} crop="face" className="shrink-0 overflow-hidden rounded-full bg-[#173a5a]" />
        <p className="text-sm leading-6 text-slate-200">{T(`أهلًا، أنا ${P.arFull}. هسألك بصوتي وانت تجاوب بصوتك، زي الامتحان الشفوي الحقيقي.`, `Hi, I'm ${P.en}. I'll ask out loud and you answer out loud, like a real oral exam.`)}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-black text-slate-300">{T("نوع الامتحان", "Exam type")}</legend>
        <button type="button" className={opt(prefs.mode === "ai")} onClick={() => set("mode", "ai")} aria-pressed={prefs.mode === "ai"}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-400/20 text-teal-200"><Sparkles size={20} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">{T("ذكي (ذكاء اصطناعي)", "Smart (AI)")}</span>
            <span className="block text-xs text-slate-300">{T(`أسئلة مفتوحة من الصفحة اللي بتذاكرها، و${P.ar} ${G("بيقيّم", "بتقيّم")} كلامك ${G("ويقولك", "وتقولك")} الناقص.`, `Open questions from the page you're studying; ${P.en} marks what you say and tells you what's missing.`)}</span>
            <AiMeter status={status} T={T} />
          </span>
        </button>
        <button type="button" className={opt(prefs.mode === "free")} onClick={() => set("mode", "free")} aria-pressed={prefs.mode === "free"}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-slate-100"><Zap size={20} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">{T("مجاني (بنك الأسئلة)", "Free (question bank)")}</span>
            <span className="block text-xs text-slate-300">{T(`اختيار من متعدد بيتقري بصوت ${P.ar}، وانت تقول الحرف أو الإجابة. متاح دايمًا.`, `Multiple choice read by ${P.en}; say the letter or the answer. Always available.`)}</span>
          </span>
        </button>
        {prefs.mode === "ai" && !aiOk && <p className="text-xs font-bold text-amber-200">{T("رصيد اليوم خلص — هيشتغل الامتحان المجاني تلقائيًا لحد ما الرصيد يتجدد.", "Today's budget is used up — the free exam will run until it renews.")}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-xs font-black text-slate-300">{T("الأسئلة عن", "Questions about")}</legend>
        <div className="flex gap-2">
          <button type="button" className={pill(prefs.source === "page")} onClick={() => set("source", "page")}>{pageName}</button>
          <button type="button" className={pill(prefs.source === "topic")} onClick={() => set("source", "topic")}>{T("موضوع أختاره", "A topic I pick")}</button>
        </div>
        {prefs.source === "topic" && (
          <select value={prefs.topic} onChange={(e) => set("topic", e.target.value as TopicCode | "mixed")} className="mt-2 w-full rounded-xl border border-white/15 bg-[#132c45] px-3 py-2.5 text-sm text-white">
            <option value="mixed">{T("منوّع من كل المواضيع", "Mixed — all topics")}</option>
            {(Object.keys(TOPIC_INFO) as TopicCode[]).filter((k) => k !== "general").map((k) => <option key={k} value={k}>{ar ? TOPIC_INFO[k].ar : TOPIC_INFO[k].en}</option>)}
          </select>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <fieldset>
          <legend className="mb-1 text-xs font-black text-slate-300">{T("المُمتحِن", "Examiner")}</legend>
          <div className="flex gap-2">
            <button type="button" className={pill(prefs.gender === "male")} onClick={() => set("gender", "male")}>{T("علي (ذكر)", "Ali (male)")}</button>
            <button type="button" className={pill(prefs.gender === "female")} onClick={() => set("gender", "female")}>{T("دنيا (أنثى)", "Donia (female)")}</button>
          </div>
          {egVoice !== undefined && (
            <p className={`mt-1 text-[11px] font-bold ${egVoice === "tarek" ? "text-emerald-300" : "text-slate-400"}`}>
              {egVoice === "tarek" ? T("✓ الصوت: Tarek", "✓ Voice: Tarek") : egVoice === "phone" ? T("الصوت: صوت الموبايل", "Voice: your phone's voice") : T("صوت Tarek مش متاح — الأسئلة هتظهر مكتوبة", "Tarek's voice unavailable — questions shown as text")}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-black text-slate-300">{T("اللغة", "Language")}</legend>
          <div className="flex gap-2">
            <button type="button" className={pill(prefs.lang === "ar")} onClick={() => set("lang", "ar")}>عربي</button>
            <button type="button" className={pill(prefs.lang === "en")} onClick={() => set("lang", "en")}>English</button>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-200">
          {T("عدد الأسئلة", "Questions")}
          <select value={prefs.count} onChange={(e) => set("count", Number(e.target.value))} className="rounded-lg border border-white/15 bg-[#132c45] px-2 py-1 text-white">
            {[3, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={prefs.handsFree} onChange={(e) => set("handsFree", e.target.checked)} />
          {T("من غير إيدين (يسمع ويكمل لوحده)", "Hands-free (listens and moves on)")}
        </label>
      </div>

      <Button size="lg" className="w-full" onClick={onStart} icon={<Mic size={18} aria-hidden="true" />}>{T("ابدأ الامتحان", "Start")}</Button>
      <p className="text-center text-[11px] leading-5 text-slate-400">{T("صوت الممتحن: Tarek (ElevenLabs)، أو صوت الموبايل مؤقتًا لحد ما يتفعّل. إجابتك بتتسمع وتتحول لكلام على جهازك عن طريق المتصفح. الامتحان للتدريب ومش بديل عن المصادر المعتمدة.", "Examiner voice: Tarek (ElevenLabs), or your phone's voice until it is set up. Your spoken answers are recognised by your browser. For practice only, not a substitute for approved references.")}</p>
    </div>
  );
}

export function AiMeter({ status, T }: { status: AiStatus | null | undefined; T: (a: string, e: string) => string }) {
  if (status === undefined) return <span className="mt-2 block h-1.5 w-full animate-pulse rounded-full bg-white/10" aria-hidden="true" />;
  if (status === null) return <span className="mt-1 block text-[11px] text-slate-400">{T("الرصيد مش ظاهر دلوقتي", "Budget not available right now")}</span>;
  const left = Math.max(0, 100 - status.pct);
  const color = !status.ai ? "bg-rose-400" : left < 20 ? "bg-amber-400" : "bg-teal-400";
  return (
    <span className="mt-2 block" aria-label={T(`باقي ${left}% من رصيد اليوم`, `${left}% of today's budget left`)}>
      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/10"><span className={`block h-full rounded-full ${color} transition-all`} style={{ width: `${left}%` }} /></span>
      <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-300">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.ai ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} aria-hidden="true" />
        {status.ai ? T(`مباشر: باقي ${left}% من رصيد اليوم المجاني`, `Live: ${left}% of today's free budget left`) : status.enabled ? T("رصيد اليوم خلص — بيتجدد بكرة", "Used up today — renews tomorrow") : T("متوقف حاليًا", "Off right now")}
      </span>
    </span>
  );
}

/** The examiner: Ali Ashour (male voice) or Donia (female voice). */
export function persona(gender: Gender) {
  return gender === "female"
    ? { female: true, ar: "دنيا", arFull: "دنيا", en: "Donia" }
    : { female: false, ar: "علي", arFull: "علي عاشور", en: "Ali Ashour" };
}
