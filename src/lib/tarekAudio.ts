/**
 * Tarek — the one voice of NurseHub Egypt (ElevenLabs, made on the server; the key never reaches the browser).
 * Shared by the oral exam (/api/tts) and the site reader (/api/ali-reader); each endpoint has its own monthly quota.
 *
 * TarekPlayer: fetches a part as MP3 (kept as a blob URL, a few parts cached), plays it on one <audio> element, and reports the
 * REAL loudness (Web Audio analyser) for Ali's mouth. When the analyser is not available, `synced` is false and the level stays
 * 0 — the page then shows a plain "speaking" state instead of pretending to lip-sync. Nothing ever plays without a user tap:
 * `unlock()` must be called from the click that starts listening.
 */
export type TarekEndpoint = "/api/tts" | "/api/ali-reader";
export interface TarekStatus { tts: boolean; enabled: boolean; configured: boolean; used: number; limit: number; pct: number; calls: number; month: string; voice: string }
export type ClipResult = { url: string } | { error: string };
export type PlayResult = "ended" | "stopped" | "error";

export async function getTarekStatus(endpoint: TarekEndpoint): Promise<TarekStatus | null> {
  try {
    const r = await fetch(endpoint, { headers: { accept: "application/json" } });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return null;
    return (await r.json()) as TarekStatus;
  } catch { return null; }
}

/** 0.05 s of silence (a real WAV) — played inside the user's tap so later clips may play on phones. */
function silentWav(): string {
  const n = 400, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
  b.fill(128, 44);
  let bin = ""; b.forEach((x) => { bin += String.fromCharCode(x); });
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export class TarekPlayer {
  private el: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private wired = false;
  private clips = new Map<string, Promise<ClipResult>>();
  private raf = 0;
  private finish: ((r: PlayResult) => void) | null = null;
  private levelCb: ((v: number) => void) | undefined;

  constructor(private endpoint: TarekEndpoint, private maxChars: number) {}

  /** true when the mouth can follow the real audio level. */
  get synced() { return this.wired && this.ctx?.state === "running"; }
  get paused() { return !!this.el && this.el.paused && !!this.finish; }

  /** Call inside the click/tap that starts audio. */
  unlock() {
    try {
      if (!this.el) { this.el = new Audio(); this.el.preload = "auto"; }
      this.el.src = silentWav();
      void this.el.play().catch(() => {});
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC && !this.ctx) this.ctx = new AC();
      const ctx = this.ctx;
      if (ctx) void ctx.resume().then(() => {
        // route through the analyser only once the context really runs (a suspended context would mute the audio)
        if (ctx.state === "running" && !this.wired && this.el) {
          try {
            this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512;
            ctx.createMediaElementSource(this.el).connect(this.analyser);
            this.analyser.connect(ctx.destination);
            this.wired = true;
          } catch { this.wired = false; }
        }
      }).catch(() => {});
    } catch { /* plain playback still works */ }
  }

  /** Fetch one part (cached per text); { error } carries the server's reason (monthly_limit, tts_off, …). */
  fetchClip(text: string, lang: "ar" | "en"): Promise<ClipResult> {
    const t = text.slice(0, this.maxChars);
    const k = `${lang}|${t}`;
    if (!this.clips.has(k)) {
      if (this.clips.size > 24) {
        const first = this.clips.keys().next().value as string;
        void this.clips.get(first)?.then((c) => { if ("url" in c) URL.revokeObjectURL(c.url); });
        this.clips.delete(first);
      }
      const p = (async (): Promise<ClipResult> => {
        try {
          const r = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, lang }) });
          if (r.ok && (r.headers.get("content-type") || "").startsWith("audio/")) return { url: URL.createObjectURL(await r.blob()) };
          const j = await r.json().catch(() => null);
          return { error: (j && j.reason) || `http_${r.status}` };
        } catch { return { error: "network" }; }
      })();
      this.clips.set(k, p);
      // a failed part may be tried again later (e.g. after a network blip)
      void p.then((c) => { if ("error" in c) this.clips.delete(k); });
    }
    return this.clips.get(k)!;
  }

  /** Play a fetched clip; resolves when it ends, is stopped, or fails. `onLevel` gets the real loudness 0..1 (or 0 when not synced). */
  play(url: string, onLevel?: (v: number) => void): Promise<PlayResult> {
    this.stop();
    if (!this.el) this.el = new Audio();
    const el = this.el;
    el.src = url;
    this.levelCb = onLevel;
    return new Promise<PlayResult>((res) => {
      this.finish = (r) => { cancelAnimationFrame(this.raf); this.raf = 0; this.levelCb?.(0); el.onended = null; el.onerror = null; this.finish = null; res(r); };
      el.onended = () => this.finish?.("ended");
      el.onerror = () => this.finish?.("error");
      el.play().then(() => this.loop()).catch(() => this.finish?.("error"));
    });
  }

  private loop() {
    cancelAnimationFrame(this.raf);
    const buf = this.analyser ? new Uint8Array(this.analyser.fftSize) : null;
    const tick = () => {
      if (!this.el || this.el.paused) { this.levelCb?.(0); this.raf = 0; return; } // no animation while nothing plays
      if (this.synced && this.analyser && buf) {
        this.analyser.getByteTimeDomainData(buf);
        let sum = 0; for (const b of buf) { const x = (b - 128) / 128; sum += x * x; }
        this.levelCb?.(Math.min(1, Math.sqrt(sum / buf.length) * 5));
      } else this.levelCb?.(0);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private timeBuf: Uint8Array<ArrayBuffer> | null = null;
  private freqBuf: Uint8Array<ArrayBuffer> | null = null;
  /**
   * One frame of REAL audio analysis for lip-sync, or null when nothing is playing / analysis is unavailable.
   * level: loudness 0..1 (jaw opening). wide: spectral centre 0..1 (higher = brighter vowels like "ee", lower = "oo").
   */
  frame(): { level: number; wide: number } | null {
    if (!this.el || this.el.paused || !this.finish || !this.synced || !this.analyser) return null;
    const a = this.analyser;
    if (!this.timeBuf || this.timeBuf.length !== a.fftSize) this.timeBuf = new Uint8Array(a.fftSize);
    if (!this.freqBuf || this.freqBuf.length !== a.frequencyBinCount) this.freqBuf = new Uint8Array(a.frequencyBinCount);
    a.getByteTimeDomainData(this.timeBuf);
    let sum = 0; for (const b of this.timeBuf) { const x = (b - 128) / 128; sum += x * x; }
    const level = Math.min(1, Math.sqrt(sum / this.timeBuf.length) * 5);
    a.getByteFrequencyData(this.freqBuf);
    // spectral centroid over the voice band (~80 Hz – 5 kHz)
    const hz = (this.ctx?.sampleRate ?? 44100) / 2 / this.freqBuf.length;
    let num = 0, den = 0;
    for (let i = Math.floor(80 / hz); i < Math.min(this.freqBuf.length, Math.ceil(5000 / hz)); i++) { num += i * hz * this.freqBuf[i]; den += this.freqBuf[i]; }
    const centroid = den ? num / den : 0;
    const wide = Math.max(0, Math.min(1, (centroid - 500) / 2000));
    return { level, wide };
  }

  pause() { if (this.el && this.finish) { this.el.pause(); this.levelCb?.(0); } }
  resume() { if (this.el && this.finish && this.el.paused) { void this.ctx?.resume(); void this.el.play().then(() => this.loop()).catch(() => this.finish?.("error")); } }
  stop() { if (this.el) { this.el.pause(); } this.finish?.("stopped"); }
}
