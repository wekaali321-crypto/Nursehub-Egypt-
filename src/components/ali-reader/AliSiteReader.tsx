import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Headphones, Pause, Play, RotateCcw, Square } from "lucide-react";
import AliAvatar, { type AvatarMood } from "../oral/AliAvatar";
import { useI18n } from "../../lib/i18n";
import { TarekPlayer } from "../../lib/tarekAudio";
import { extractParagraphs, langOf, READER_MAX, splitChunks } from "./readerText";

/**
 * "Listen to this page" — reads the main content of the current page (#main-content) in Tarek's voice (ElevenLabs via
 * /api/ali-reader, its own monthly quota, separate from the oral exam). Never starts by itself: only after a tap.
 * Play / pause / resume / stop, a progress bar and the part being read; stops when the page changes or the oral exam opens.
 * Lives OUTSIDE #main-content (PublicLayout), so its own texts are never read.
 */
type State = "idle" | "loading" | "playing" | "paused" | "done" | "error";
const HIDE = /^\/(checkout|login|register|forgot|order\/|buy|admin|dashboard)/;

const player = typeof window !== "undefined" ? new TarekPlayer("/api/ali-reader", READER_MAX) : (null as unknown as TarekPlayer);

export default function AliSiteReader() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const T = (a: string, e: string) => (ar ? a : e);
  const { pathname } = useLocation();
  const [state, setState] = useState<State>("idle");
  const [chunks, setChunks] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(0);
  const [msg, setMsg] = useState("");
  const run = useRef(0); // bumps on stop / new start: older async steps see it changed and quit

  const errorText = useCallback((reason: string) => {
    if (reason === "monthly_limit") return T("رصيد قارئ الموقع للشهر ده خلص. هيرجع أول الشهر الجاي.", "The site reader's monthly budget is used up. It renews next month.");
    if (reason === "rate_limited") return T("استمعت لصفحات كتير في الساعة دي. جرّب تاني بعد شوية.", "You've listened to many pages this hour. Try again a bit later.");
    if (reason === "tts_off") return T("قارئ الموقع متوقف حاليًا.", "The site reader is switched off right now.");
    if (reason === "network") return T("مفيش اتصال بالإنترنت دلوقتي.", "No internet connection right now.");
    return T("صوت Tarek مش متاح دلوقتي. جرّب تاني بعد شوية.", "Tarek's voice isn't available right now. Try again later.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar]);

  const stop = useCallback(() => {
    run.current++;
    player?.stop();
    setLevel(0);
    setState("idle"); setChunks([]); setIdx(0); setMsg("");
    window.dispatchEvent(new CustomEvent("nh:reader", { detail: { open: false } }));
  }, []);

  const playFrom = useCallback(async (list: string[], from: number, my: number) => {
    for (let i = from; i < list.length; i++) {
      if (run.current !== my) return;
      setIdx(i);
      setState((s) => (s === "paused" ? s : "loading"));
      const current = player.fetchClip(list[i], langOf(list[i]));
      if (i + 1 < list.length) void player.fetchClip(list[i + 1], langOf(list[i + 1])); // next part ready in time
      const clip = await current;
      if (run.current !== my) return;
      if ("error" in clip) { setState("error"); setMsg(errorText(clip.error)); setLevel(0); return; }
      setState("playing");
      const r = await player.play(clip.url, (v) => run.current === my && setLevel(v));
      if (run.current !== my || r === "stopped") return;
      if (r === "error") { setState("error"); setMsg(errorText("play_error")); return; }
    }
    if (run.current === my) { setState("done"); setLevel(0); }
  }, [errorText]);

  const start = useCallback(() => {
    player.unlock(); // inside the tap — no audio ever starts without one
    const main = document.getElementById("main-content");
    const list = main ? splitChunks(extractParagraphs(main)) : [];
    const my = ++run.current;
    window.dispatchEvent(new CustomEvent("nh:reader", { detail: { open: true } }));
    if (!list.length) { setChunks([]); setState("error"); setMsg(T("مفيش محتوى مكتوب كفاية في الصفحة دي للقراءة.", "There isn't enough text on this page to read.")); return; }
    setChunks(list); setMsg("");
    void playFrom(list, 0, my);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playFrom, ar]);

  const pause = () => { player.pause(); setLevel(0); setState("paused"); };
  const resume = () => { player.resume(); setState("playing"); };
  const restart = () => { const my = ++run.current; player.stop(); void playFrom(chunks, 0, my); };

  // stop on page change, when the oral exam opens, and on unmount
  useEffect(() => { stop(); }, [pathname, stop]);
  useEffect(() => {
    const onOral = () => stop();
    window.addEventListener("nh:oral", onOral);
    return () => { window.removeEventListener("nh:oral", onOral); run.current++; player?.stop(); };
  }, [stop]);

  if (HIDE.test(pathname)) return null;
  const open = state !== "idle";
  const pct = chunks.length ? Math.round(((idx + (state === "done" ? 1 : 0)) / chunks.length) * 100) : 0;
  const mood: AvatarMood = state === "playing" ? "speaking" : state === "loading" ? "thinking" : state === "done" ? "happy" : "idle";

  return (
    <>
      {/* entry button: under the navbar, outside #main-content */}
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3 print:hidden" data-reader-skip>
        <button type="button" onClick={open ? stop : start} aria-pressed={open}
          className="inline-flex items-center gap-2 rounded-full border border-nh-teal/40 bg-white px-4 py-2 text-sm font-bold text-nh-teal-dark shadow-sm hover:bg-nh-teal-soft dark:border-teal-400/30 dark:bg-slate-900 dark:text-teal-300">
          <Headphones size={16} aria-hidden="true" />
          {open ? T("إيقاف الاستماع", "Stop listening") : T("استمع للمحتوى", "Listen to this page")}
        </button>
      </div>

      {open && (
        <div role="region" aria-label={T("قارئ الصفحة", "Page reader")} data-reader-skip dir={ar ? "rtl" : "ltr"}
          className="fixed inset-x-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[45] mx-auto max-w-xl rounded-2xl border border-white/10 bg-nh-navy p-3 text-white shadow-2xl md:bottom-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="shrink-0 overflow-hidden rounded-full bg-[#173a5a]">
              <AliAvatar mood={mood} level={level} size={52} crop="face" label={T("علي عاشور", "Ali Ashour")} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-teal-200">
                <span aria-live="polite">
                  {state === "loading" ? T("بيجهّز الجزء…", "Preparing…") : state === "playing" ? T("Tarek بيقرأ", "Tarek is reading") : state === "paused" ? T("متوقف مؤقتًا", "Paused") : state === "done" ? T("خلصت الصفحة", "Finished") : T("مش شغال", "Not playing")}
                </span>
                {chunks.length > 0 && <span>{T(`جزء ${Math.min(idx + 1, chunks.length)} من ${chunks.length}`, `Part ${Math.min(idx + 1, chunks.length)} of ${chunks.length}`)}</span>}
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              {msg ? <p role="alert" className="mt-1.5 text-xs font-bold text-amber-200">{msg}</p>
                : chunks[idx] && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-200" dir="auto">{chunks[idx]}</p>}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {state === "playing" && <button type="button" onClick={pause} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15"><Pause size={14} aria-hidden="true" />{T("إيقاف مؤقت", "Pause")}</button>}
            {state === "paused" && <button type="button" onClick={resume} className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-4 py-2 text-xs font-black text-nh-navy hover:bg-teal-400"><Play size={14} aria-hidden="true" />{T("متابعة", "Resume")}</button>}
            {(state === "done" || state === "error") && chunks.length > 0 && <button type="button" onClick={restart} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15"><RotateCcw size={14} aria-hidden="true" />{T("من الأول", "From the start")}</button>}
            <button type="button" onClick={stop} className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold hover:bg-rose-700"><Square size={12} aria-hidden="true" />{T("إيقاف", "Stop")}</button>
          </div>
        </div>
      )}
    </>
  );
}
