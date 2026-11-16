/**
 * Ali's voice and ears, from the browser itself (free: no server, no D1).
 *  - speak(): speechSynthesis, Arabic (ar-EG preferred) or English; male / female voice when the device has one,
 *    otherwise the same voice with a lower / higher pitch. `onLevel` gets a 0..1 "mouth opening" while speaking.
 *  - listen(): SpeechRecognition (Chrome / Edge / Android / Safari 14.5+), interim text while the learner talks.
 */
export type Gender = "male" | "female";
export type Lang = "ar" | "en";

const FEMALE = /female|woman|zira|hoda|salma|laila|layla|mariam|amira|zariyah|hala|samantha|karen|moira|tessa|victoria|susan|hazel|libby|sonia|jenny|aria|google uk english female|ar-xa-standard-a|ar-xa-wavenet-a|ar-xa-standard-d|ar-xa-wavenet-d/i;
const MALE = /\bmale\b|\bman\b|david|mark|naayf|shakir|hamed|maged|tarik|tarek|daniel|alex|fred|george|ryan|guy|thomas|google uk english male|ar-xa-standard-b|ar-xa-standard-c|ar-xa-wavenet-b|ar-xa-wavenet-c/i;

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;
export const canListen = () => typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
function voices(): Promise<SpeechSynthesisVoice[]> {
  if (!canSpeak()) return Promise.resolve([]);
  if (!voicesReady) {
    voicesReady = new Promise((res) => {
      const now = speechSynthesis.getVoices();
      if (now.length) return res(now);
      const done = () => res(speechSynthesis.getVoices());
      speechSynthesis.addEventListener?.("voiceschanged", done, { once: true });
      setTimeout(done, 1500);
    });
  }
  return voicesReady;
}

/** Best voice for the language and gender; `exact` = a voice of that gender was found (else pitch does the job). */
export async function pickVoice(lang: Lang, gender: Gender): Promise<{ voice: SpeechSynthesisVoice | null; exact: boolean }> {
  const all = await voices();
  const inLang = all.filter((v) => v.lang?.toLowerCase().startsWith(lang));
  const rank = (v: SpeechSynthesisVoice) => (lang === "ar" && /eg/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1);
  const sorted = [...inLang].sort((a, b) => rank(b) - rank(a));
  const want = gender === "female" ? FEMALE : MALE;
  const other = gender === "female" ? MALE : FEMALE;
  const exact = sorted.find((v) => want.test(v.name) && !(gender === "male" && FEMALE.test(v.name)));
  if (exact) return { voice: exact, exact: true };
  const neutral = sorted.find((v) => !other.test(v.name));
  return { voice: neutral ?? sorted[0] ?? null, exact: false };
}

/** Readable by ear: drop markup, read "A." style letters as words, keep it short enough for TTS engines. */
export function speakable(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/[*_#`>|]/g, " ").replace(/\s+/g, " ").trim();
}

export interface SpeakHandle { done: Promise<void>; stop: () => void }

/* ---------- Egyptian voice from the server (/api/tts → Azure ar-EG neural voices) ---------- */
// "on" once /api/tts says the month's budget is available; "off" for the rest of the visit after any fallback answer.
let cloud: "unknown" | "on" | "off" = "unknown";
let onCloudOff: ((reason: string) => void) | null = null;
export interface TtsStatus { tts: boolean; enabled: boolean; used: number; limit: number; pct: number; calls: number; month: string }
export async function getTtsStatus(): Promise<TtsStatus | null> {
  try {
    const r = await fetch("/api/tts", { headers: { accept: "application/json" } });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return null;
    return (await r.json()) as TtsStatus;
  } catch { return null; }
}
export function setCloudVoice(on: boolean, onOff?: (reason: string) => void) { cloud = on ? "on" : "off"; onCloudOff = onOff ?? null; }
export const cloudVoiceOn = () => cloud === "on";

let audioEl: HTMLAudioElement | null = null;
/** 0.05 s of silence as a WAV data URL (a real, playable file — used to unlock audio on the first tap). */
function silentWav(): string {
  const n = 400, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
  b.fill(128, 44);
  let bin = ""; b.forEach((x) => { bin += String.fromCharCode(x); });
  return `data:audio/wav;base64,${btoa(bin)}`;
}
let actx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
/** Call from a click handler: lets later audio play without another tap (mobile autoplay rules) and sets up lip-sync. */
export function unlockAudio() {
  try {
    if (!audioEl) { audioEl = new Audio(); audioEl.preload = "auto"; }
    audioEl.src = silentWav();
    void audioEl.play().catch(() => {});
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC && !actx) {
      actx = new AC();
      analyser = actx.createAnalyser(); analyser.fftSize = 512;
      actx.createMediaElementSource(audioEl).connect(analyser);
      analyser.connect(actx.destination);
    }
    void actx?.resume();
  } catch { /* plain audio still works, the mouth then uses a fake rhythm */ }
}

const clips = new Map<string, Promise<string | null>>(); // text|voice → blob URL (or null = server said no)
function clipKey(text: string, lang: Lang, gender: Gender) { return `${lang}|${gender}|${text}`; }
/** Start fetching a sentence early (e.g. the choices while the question is still being read). */
export function prefetchSpeech(text: string, opts: { lang: Lang; gender: Gender }) {
  if (cloud !== "on") return;
  const clean = speakable(text);
  if (clean) void fetchClip(clean, opts.lang, opts.gender);
}
function fetchClip(text: string, lang: Lang, gender: Gender): Promise<string | null> {
  const k = clipKey(text, lang, gender);
  if (!clips.has(k)) {
    if (clips.size > 40) { const first = clips.keys().next().value as string; clips.get(first)?.then((u) => u && URL.revokeObjectURL(u)); clips.delete(first); }
    clips.set(k, (async () => {
      try {
        const r = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 700), lang, gender }) });
        if (r.ok && (r.headers.get("content-type") || "").startsWith("audio/")) return URL.createObjectURL(await r.blob());
        const j = await r.json().catch(() => null);
        if (cloud === "on") { cloud = "off"; onCloudOff?.(j?.reason || `http_${r.status}`); }
        return null;
      } catch { return null; }
    })());
  }
  return clips.get(k)!;
}

/** Play one clip on the shared audio element; the mouth follows the real loudness. false = could not play. */
async function playClip(url: string, onLevel: ((v: number) => void) | undefined, stopped: () => boolean, setStop: (f: () => void) => void): Promise<boolean> {
  if (!audioEl) audioEl = new Audio();
  const el = audioEl;
  el.src = url;
  const buf = analyser ? new Uint8Array(analyser.fftSize) : null;
  let raf = 0;
  const loop = () => {
    if (analyser && buf) {
      analyser.getByteTimeDomainData(buf);
      let sum = 0; for (const b of buf) { const x = (b - 128) / 128; sum += x * x; }
      onLevel?.(Math.min(1, Math.sqrt(sum / buf.length) * 5));
    } else onLevel?.(el.paused ? 0 : 0.3 + Math.random() * 0.5);
    raf = requestAnimationFrame(loop);
  };
  return new Promise<boolean>((res) => {
    const end = (ok: boolean) => { cancelAnimationFrame(raf); onLevel?.(0); el.onended = null; el.onerror = null; res(ok); };
    setStop(() => { el.pause(); end(true); });
    el.onended = () => end(true);
    el.onerror = () => end(false);
    if (stopped()) return end(true);
    el.play().then(() => { raf = requestAnimationFrame(loop); }).catch(() => end(false));
  });
}

export function speak(text: string, opts: { lang: Lang; gender: Gender; rate?: number; onLevel?: (v: number) => void }): SpeakHandle {
  let stopped = false;
  let timer = 0;
  let stopClip: () => void = () => {};
  const stop = () => { stopped = true; clearInterval(timer); stopClip(); opts.onLevel?.(0); if (canSpeak()) speechSynthesis.cancel(); };
  const done = (async () => {
    const clean = speakable(text);
    // 1) Egyptian voice from the server, when available this month
    if (cloud === "on" && clean) {
      const parts = clean.length <= 700 ? [clean] : (clean.match(/[^.!?؟\n]+[.!?؟]?/g) ?? [clean]).reduce<string[]>((a, s) => { const last = a[a.length - 1]; if (last && (last + s).length <= 700) a[a.length - 1] = last + s; else a.push(s.slice(0, 700)); return a; }, []);
      let ok = true;
      for (let n = 0; n < parts.length && !stopped && ok; n++) {
        if (n + 1 < parts.length) void fetchClip(parts[n + 1], opts.lang, opts.gender);
        const url = await fetchClip(parts[n], opts.lang, opts.gender);
        if (stopped) return;
        ok = !!url && (await playClip(url, opts.onLevel, () => stopped, (f) => { stopClip = f; }));
      }
      if (ok || stopped) return;
      // could not fetch / play → the phone's voice says it instead
    }
    if (!canSpeak() || !clean) { // no TTS: keep the rhythm so the avatar still "talks"
      await mouthOnly(clean, opts.onLevel, () => stopped);
      return;
    }
    const { voice, exact } = await pickVoice(opts.lang, opts.gender);
    if (stopped) return;
    // long text → sentence chunks (some engines stop after ~200 characters)
    const chunks = clean.match(/[^.!?؟\n]+[.!?؟]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
    for (const chunk of chunks) {
      if (stopped) return;
      await new Promise<void>((res) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = voice?.lang || (opts.lang === "ar" ? "ar-EG" : "en-US");
        if (voice) u.voice = voice;
        u.rate = opts.rate ?? (opts.lang === "ar" ? 0.95 : 1);
        u.pitch = exact ? 1 : opts.gender === "female" ? 1.35 : 0.8;
        // mouth: random openings while the engine talks, bigger on word starts
        let boost = 0;
        u.onboundary = () => { boost = 1; };
        u.onstart = () => {
          clearInterval(timer);
          timer = window.setInterval(() => { const v = Math.max(boost, 0.25 + Math.random() * 0.6); boost = 0; opts.onLevel?.(v); }, 110);
        };
        const end = () => { clearInterval(timer); opts.onLevel?.(0); res(); };
        u.onend = end; u.onerror = end;
        speechSynthesis.speak(u);
        // engines that never fire onend (seen on some Android builds): give up after a generous time
        setTimeout(end, 2500 + chunk.length * 120);
      });
    }
  })();
  return { done, stop };
}

async function mouthOnly(text: string, onLevel: ((v: number) => void) | undefined, stopped: () => boolean) {
  const ms = Math.min(8000, 400 + text.length * 55);
  const t0 = Date.now();
  while (Date.now() - t0 < ms && !stopped()) { onLevel?.(0.25 + Math.random() * 0.6); await new Promise((r) => setTimeout(r, 110)); }
  onLevel?.(0);
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
