/**
 * The oral exam's voice and ears.
 *  - speak(): always Tarek (ElevenLabs via /api/tts, see lib/tarekAudio). Arabic and English, whichever examiner (Ali / Donia)
 *    is shown. If Tarek cannot speak (monthly limit, service off, network), NOTHING else speaks instead: the exam goes on with
 *    the text on screen, a clear notice is shown (onUnavailable), and Ali's mouth stays still.
 *  - listen(): the browser's SpeechRecognition (Chrome / Edge / Android / Safari 14.5+) for the learner's spoken answers.
 */
import { TarekPlayer, getTarekStatus, type TarekStatus } from "../tarekAudio";

export type Gender = "male" | "female";
export type Lang = "ar" | "en";
export type TtsStatus = TarekStatus;

export const canListen = () => typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

/** Readable by ear: drop markup and symbols. */
export function speakable(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/[*_#`>|]/g, " ").replace(/\s+/g, " ").trim();
}

export interface SpeakHandle { done: Promise<void>; stop: () => void }

const MAX = 700; // = /api/tts limit per part
const player = new TarekPlayer("/api/tts", MAX);
// "on" once /api/tts reports Tarek available this month; "off" for the rest of the visit after any failure answer.
let tarek: "unknown" | "on" | "off" = "unknown";
let onUnavailable: ((reason: string) => void) | null = null;

export const getTtsStatus = () => getTarekStatus("/api/tts");
/** Set from the status check; `onOff` is told why Tarek stopped (so the page can say so). */
export function setTarekVoice(on: boolean, onOff?: (reason: string) => void) { tarek = on ? "on" : "off"; onUnavailable = onOff ?? null; }
export const tarekOn = () => tarek === "on";
/** Call inside the tap that starts the exam (mobile autoplay rules; also sets up the real lip-sync). */
export const unlockAudio = () => player.unlock();
/** true when Ali's mouth follows the real audio level. */
export const lipSynced = () => player.synced;

function splitParts(clean: string): string[] {
  if (clean.length <= MAX) return [clean];
  return (clean.match(/[^.!?؟\n]+[.!?؟]?/g) ?? [clean]).reduce<string[]>((a, s) => {
    const last = a[a.length - 1];
    if (last !== undefined && (last + s).length <= MAX) a[a.length - 1] = last + s; else a.push(s.slice(0, MAX));
    return a;
  }, []);
}

/** Start fetching early (e.g. the choices while the question is still being read). */
export function prefetchSpeech(text: string, opts: { lang: Lang }) {
  if (tarek !== "on") return;
  const clean = speakable(text);
  if (clean) for (const p of splitParts(clean)) void player.fetchClip(p, opts.lang);
}

function turnOff(reason: string) {
  if (tarek === "on") { tarek = "off"; onUnavailable?.(reason); }
}

/** Time to read a text on screen when there is no voice (so hands-free mode does not rush past it). */
const readingMs = (text: string) => Math.min(9000, 1200 + text.length * 45);

/**
 * Say a text in Tarek's voice. `gender` is accepted for compatibility (the examiner's name) — the voice is always Tarek.
 * onPlaying(true/false) tells when audio is actually playing (Ali shows "speaking" only then).
 */
export function speak(text: string, opts: { lang: Lang; gender?: Gender; onLevel?: (v: number) => void; onPlaying?: (on: boolean) => void }): SpeakHandle {
  let stopped = false;
  let wake: (() => void) | null = null;
  const stop = () => { stopped = true; player.stop(); opts.onLevel?.(0); opts.onPlaying?.(false); wake?.(); };
  const silentWait = (ms: number) => new Promise<void>((res) => { const t = window.setTimeout(res, ms); wake = () => { clearTimeout(t); res(); }; });
  const done = (async () => {
    const clean = speakable(text);
    if (!clean) return;
    if (tarek === "on") {
      const parts = splitParts(clean);
      for (let n = 0; n < parts.length && !stopped; n++) {
        if (n + 1 < parts.length) void player.fetchClip(parts[n + 1], opts.lang);
        const clip = await player.fetchClip(parts[n], opts.lang);
        if (stopped) return;
        if ("error" in clip) { turnOff(clip.error); break; }
        opts.onPlaying?.(true);
        const r = await player.play(clip.url, opts.onLevel);
        opts.onPlaying?.(false);
        if (r === "stopped" || stopped) return;
        if (r === "error") { turnOff("play_error"); break; }
        if (n + 1 === parts.length) return; // all spoken
      }
    }
    // Tarek unavailable: no other voice — leave time to read the text on screen
    if (!stopped) await silentWait(readingMs(clean));
  })();
  return { done, stop };
}

export interface ListenHandle { result: Promise<string>; stop: () => void }

/** Listen once; resolves with the final text ("" if nothing was heard or listening is not supported). */
export function listen(opts: { lang: Lang; onInterim?: (text: string) => void; maxMs?: number }): ListenHandle {
  const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!Ctor) return { result: Promise.resolve(""), stop: () => {} };
  const rec = new Ctor();
  rec.lang = opts.lang === "ar" ? "ar-EG" : "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;
  let finalText = "";
  let interim = "";
  let silence = 0;
  const result = new Promise<string>((res) => {
    const finish = () => { clearTimeout(silence); clearTimeout(cap); try { rec.stop(); } catch { /* already stopped */ } res((finalText + " " + interim).trim()); };
    const cap = window.setTimeout(finish, opts.maxMs ?? 45000);
    rec.onresult = (e: SpeechRecEvent) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += " " + r[0].transcript; else interim += r[0].transcript;
      }
      opts.onInterim?.((finalText + " " + interim).trim());
      // the learner stopped talking for a moment → done
      clearTimeout(silence);
      silence = window.setTimeout(finish, 2200);
    };
    rec.onerror = () => finish();
    rec.onend = () => finish();
    try { rec.start(); } catch { finish(); }
  });
  return { result, stop: () => { try { rec.stop(); } catch { /* ignore */ } } };
}

interface SpeechRecEvent { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }
interface SpeechRec {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: ((e: SpeechRecEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null;
  start(): void; stop(): void;
}
