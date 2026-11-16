import { useEffect, useId, useRef } from "react";

/**
 * NurseHubAvatar — the official NurseHub Egypt educational assistant.
 * An ORIGINAL SVG character drawn for this project after the approved reference (no photo, no third-party asset): a young
 * Egyptian male medical educator — short thick dark curly hair, neatly trimmed beard, navy scrubs (#153448) with teal (#168C91)
 * piping and cuffs, white undershirt, NurseHub heart-ECG badge, watch. Shaded layers give a 3D-like look in a few KB.
 *
 * Rig (separate SVG layers, moved by ONE requestAnimationFrame loop that runs only while the avatar is mounted, on screen, the
 * tab is visible and there is something to animate; ~30 fps):
 *   body (breathing) › shoulders › upper arms › forearms + hands (elbow pivots, gesture poses)
 *   neck › head (nod / tilt) › hair · ears · brows · eyes (gaze, independent lids) · nose · mouth (visemes) · jaw + beard
 *
 * Lip-sync:
 *   - `frame()` gives REAL audio analysis { level, wide }: jaw opening follows loudness; lip shape follows the spectral centre
 *     (bright vowels → wide "ee", dark → rounded "oo"), with a fast attack and softer release → closed / slight / open / wide /
 *     round shapes, never a fixed loop. data-lipsync="audio".
 *   - speaking without analysable audio (the phone's SpeechSynthesis): a regular "talking indicator" rhythm plus a small
 *     sound-wave badge — clearly different and never presented as lip-sync. data-lipsync="indicator".
 *   - not speaking → mouth closed at once (pause / stop: callers leave the "speaking" state).
 * Reduced motion: no head / body / arm / blink motion; only the mouth while speaking.
 */
export type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "happy" | "sad";
export type AudioFrame = { level: number; wide: number };

const SKIN = { light: "#f2c7a3", base: "#e2aa83", shade: "#c78c66", deep: "#a7704f" };
const NAVY = "#153448", NAVY_D = "#0c2333", NAVY_L = "#234f6c", TEAL = "#168C91", TEAL_L = "#2ab5bb";
const HAIR = "#1a120e";

interface Pose { smile: number; brow: number; browIn: number; squint: number; gazeX: number; gazeY: number; tilt: number; nod: number }
const POSES: Record<AvatarState, Pose> = {
  idle: { smile: 0.35, brow: 0, browIn: 0, squint: 0.05, gazeX: 0, gazeY: 0, tilt: 0, nod: 0 },
  speaking: { smile: 0.3, brow: 0.6, browIn: 0, squint: 0.05, gazeX: 0, gazeY: 0, tilt: 0, nod: 0 },
  listening: { smile: 0.2, brow: 1.6, browIn: 0, squint: 0, gazeX: 0.5, gazeY: 0, tilt: 5, nod: 1 },
  thinking: { smile: -0.1, brow: 1.2, browIn: 0.9, squint: 0.18, gazeX: -3.5, gazeY: -3.2, tilt: -6, nod: -1 },
  happy: { smile: 1, brow: 1.4, browIn: 0, squint: 0.42, gazeX: 0, gazeY: 0, tilt: 3, nod: 0 },
  sad: { smile: -0.6, brow: 0.5, browIn: 1.7, squint: 0.12, gazeX: 0, gazeY: 2.5, tilt: -3, nod: 2.5 },
};

/** Arm pose: rotation around the elbow (deg) + shift (px). REST hides the forearm below the frame. */
type Arm = { rot: number; x: number; y: number };
const ARM: Record<string, Arm> = {
  rest: { rot: 62, x: 0, y: 40 },
  explain: { rot: 0, x: 0, y: 0 },        // open palm up in front of the chest
  explain2: { rot: -10, x: 18, y: -14 },  // a little higher / further in
  welcome: { rot: 26, x: -30, y: -34 },   // palm open, out to the side
  chin: { rot: -16, x: 30, y: -150 },     // thinking: fingers under the chin
};

/** Mouth for a jaw opening `o` (0..1), lip shape `w` (0 = rounded "oo" … 1 = wide "ee") and smile `s` (-1..1). */
export function mouthPaths(o: number, w: number, s: number) {
  const cx = 200, y0 = 263;
  const half = 20 + w * 8 - o * 3 + Math.max(0, s) * 4;   // narrow when rounded, wide when spread or smiling
  const cy = y0 - s * 6;                                   // corners up (smile) / down (concern)
  const h = o * (13 + (1 - w) * 5);                         // rounded vowels open taller
  const L = cx - half, R = cx + half;
  const bottom = y0 + 1 + h * 1.45;
  const round = (1 - w) * o;                                // pucker
  const upper = `M${L} ${cy} Q${cx - half * 0.5} ${y0 - 7} ${cx} ${y0 - 4.5} Q${cx + half * 0.5} ${y0 - 7} ${R} ${cy} Q${cx} ${y0 + 2 - round * 2} ${L} ${cy}Z`;
  const inner = `M${L + 2} ${cy} Q${cx} ${y0 + 1} ${R - 2} ${cy} Q${cx} ${bottom + 1} ${L + 2} ${cy}Z`;
  const tH = Math.min(6, h * 0.55);
  const teeth = `M${cx - half * 0.7} ${y0 + 0.5} Q${cx} ${y0 + 2.2} ${cx + half * 0.7} ${y0 + 0.5} L${cx + half * 0.6} ${y0 + 0.5 + tH} Q${cx} ${y0 + 2 + tH * 1.25} ${cx - half * 0.6} ${y0 + 0.5 + tH}Z`;
  const tongue = `M${cx - half * 0.45} ${bottom - 1} Q${cx} ${bottom - Math.min(7, h * 0.6)} ${cx + half * 0.45} ${bottom - 1}Z`;
  const lower = `M${L} ${cy} Q${cx} ${bottom} ${R} ${cy} Q${cx} ${bottom + 10 - s * 1.5} ${L} ${cy}Z`;
  return { upper, inner, teeth, tongue, lower, jawDrop: h * 0.6 };
}

const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// short thick curls (cx, cy, r): deterministic rows over the top of the head, smaller towards the sides
const CURLS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let row = 0; row < 5; row++) {
    const y = 97 + row * 12;
    const halfW = 38 + row * 9;            // the crown widens downwards, stays inside the head outline
    const n = 5 + row * 2;
    for (let i = 0; i < n; i++) {
      const x = 200 - halfW + (2 * halfW * (i + 0.5)) / n + (rnd() - 0.5) * 5;
      const r = 10.5 + rnd() * 3 - Math.abs(x - 200) / 30;
      out.push([x, y + (rnd() - 0.5) * 5, r]);
    }
  }
  return out;
})();

export default function NurseHubAvatar({
  state = "idle", size = 240, framing = "bust", frame, animated = true, label = "NurseHub assistant", className = "",
}: {
  state?: AvatarState;
  /** rendered width in px */
  size?: number;
  framing?: "bust" | "head";
  /** real audio analysis for lip-sync (read every animation frame while speaking) */
  frame?: () => AudioFrame | null;
  /** false = still picture (no animation loop at all), e.g. small buttons */
  animated?: boolean;
  label?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const R = useRef<Record<string, SVGElement | null>>({});
  const ref = (k: string) => (el: SVGElement | null) => { R.current[k] = el; };
  const stateRef = useRef(state); stateRef.current = state;
  const frameRef = useRef(frame); frameRef.current = frame;
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => { kickRef.current(); }, [state]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    const set = (k: string, a: string, v: string) => R.current[k]?.setAttribute(a, v);

    const cur: Pose & { open: number; wide: number } = { ...POSES[stateRef.current], open: 0, wide: 0.5 };
    const armL: Arm = { ...ARM.rest }, armR: Arm = { ...ARM.rest };
    let raf = 0, last = 0, visible = true, prevState = stateRef.current, stateSince = performance.now();
    const blink = { next: performance.now() + 1800, start: -1, double: false };
    let gaze = { x: 0, y: 0 }, nextGaze = performance.now() + 2500;
    let gesture: { hand: "L" | "R" | "both"; pose: string; start: number; dur: number } | null = null;
    let nextGesture = performance.now() + 900;
    let lipsync: "audio" | "indicator" | "none" = "none";

    const lids = (l: number, r: number) => {
      set("lidL", "transform", `translate(0 180) scale(1 ${l.toFixed(3)}) translate(0 -180)`);
      set("lidR", "transform", `translate(0 180) scale(1 ${r.toFixed(3)}) translate(0 -180)`);
    };
    const armTransform = (a: Arm, mirror: boolean) => {
      const px = mirror ? 330 : 70, py = 540; // elbow pivot, below the frame
      return `translate(${(mirror ? -a.x : a.x).toFixed(1)} ${a.y.toFixed(1)}) rotate(${(mirror ? -a.rot : a.rot).toFixed(2)} ${px} ${py})`;
    };

    const apply = (t: number) => {
      const st = stateRef.current;
      if (st !== prevState) { prevState = st; stateSince = t; gesture = null; nextGesture = t + (st === "speaking" ? 500 : 300); }
      const pose = POSES[st];
      for (const key of Object.keys(pose) as (keyof Pose)[]) cur[key] = lerp(cur[key], pose[key], 0.1);

      // ---------- mouth
      let open = 0, wide = 0.5;
      if (st === "speaking") {
        const f = frameRef.current?.() ?? null;
        if (f) { lipsync = "audio"; open = Math.min(1, f.level * 1.15); wide = f.wide; }
        else {
          lipsync = "indicator";
          // a calm, regular rhythm: deliberately NOT presented as lip-sync (see the sound-wave badge)
          open = 0.1 + 0.16 * Math.max(0, Math.sin((t / 1000) * Math.PI * 2 * 2.1));
          wide = 0.55;
        }
      } else { lipsync = "none"; if (st === "happy") { open = 0.22; wide = 0.9; } }
      cur.open = lerp(cur.open, open, open > cur.open ? 0.55 : 0.32);
      cur.wide = lerp(cur.wide, wide, 0.25);
      if (st !== "speaking" && st !== "happy" && cur.open < 0.01) cur.open = 0;
      el.dataset.lipsync = lipsync;
      el.dataset.mouth = cur.open.toFixed(3);
      const m = mouthPaths(cur.open, cur.wide, cur.smile - cur.open * 0.15);
      set("upper", "d", m.upper); set("inner", "d", m.inner); set("teeth", "d", m.teeth); set("tongue", "d", m.tongue); set("lower", "d", m.lower);
      R.current.teeth?.setAttribute("opacity", cur.open > 0.07 ? "1" : "0");
      R.current.inner?.setAttribute("opacity", cur.open > 0.02 ? "1" : "0");
      R.current.tongue?.setAttribute("opacity", cur.open > 0.35 ? "0.9" : "0");
      set("jaw", "transform", `translate(0 ${(m.jawDrop * 0.8).toFixed(2)})`);

      // brows / cheeks (expressions are shown in reduced motion as well)
      const browUp = cur.brow + (st === "speaking" ? cur.open * 2.4 : 0);
      set("browL", "transform", `translate(0 ${(-browUp).toFixed(2)}) rotate(${(cur.browIn * 7).toFixed(2)} 172 170)`);
      set("browR", "transform", `translate(0 ${(-browUp).toFixed(2)}) rotate(${(-cur.browIn * 7).toFixed(2)} 228 170)`);
      set("cheeks", "opacity", Math.max(0, cur.smile).toFixed(2));

      if (reduce) {
        el.dataset.motion = "reduced";
        set("irisL", "transform", `translate(${cur.gazeX.toFixed(2)} ${cur.gazeY.toFixed(2)})`);
        set("irisR", "transform", `translate(${cur.gazeX.toFixed(2)} ${cur.gazeY.toFixed(2)})`);
        lids(cur.squint, cur.squint);
        return;
      }
      el.dataset.motion = "full";

      // ---------- breathing, shoulders
      const breath = Math.sin(((t / 1000) * Math.PI * 2) / 4.2);
      set("body", "transform", `translate(0 ${(-breath * 1.6).toFixed(2)})`);
      const talk = st === "speaking" ? cur.open : 0;
      set("shoulders", "transform", `translate(0 ${(-breath * 0.8 - (st === "speaking" ? Math.sin(t / 700) * 1.1 + talk * 1.4 : 0)).toFixed(2)})`);

      // ---------- head
      const drift = Math.sin((t / 1000) * 0.7) * 1.2 + Math.sin((t / 1000) * 1.9) * 0.5;
      const talkMove = st === "speaking" ? Math.sin((t / 1000) * 1.3) * 2 : 0;
      const nod = st === "speaking" ? Math.sin((t / 1000) * 3.1) * 1.6 * (0.3 + talk) : st === "listening" ? Math.sin((t / 1000) * 1.6) * 1.3 : 0;
      set("head", "transform", `translate(0 ${(cur.nod + nod - breath * 1.1).toFixed(2)}) rotate(${(cur.tilt + drift + talkMove).toFixed(2)} 200 300)`);

      // ---------- eyes: gaze, independent blinks
      if (t > nextGaze) {
        gaze = st === "idle" ? { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 2.4 } : st === "thinking" ? { x: (Math.random() - 0.5) * 2, y: 0 } : { x: 0, y: 0 };
        nextGaze = t + 1600 + Math.random() * 2600;
      }
      set("irisL", "transform", `translate(${(cur.gazeX + gaze.x).toFixed(2)} ${(cur.gazeY + gaze.y).toFixed(2)})`);
      set("irisR", "transform", `translate(${(cur.gazeX + gaze.x).toFixed(2)} ${(cur.gazeY + gaze.y).toFixed(2)})`);
      let lidL = cur.squint, lidR = cur.squint;
      if (t > blink.next && blink.start < 0) blink.start = t;
      if (blink.start >= 0) {
        const p = (t - blink.start) / 150;
        const v = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2);
        lidL = Math.max(lidL, v); lidR = Math.max(lidR, Math.max(0, v - 0.08));
        if (p >= 1) { blink.start = -1; blink.double = !blink.double && Math.random() < 0.18; blink.next = t + (blink.double ? 200 : 2400 + Math.random() * 3400); }
      }
      lids(lidL, lidR);

      // ---------- arms / gestures
      if (framing === "bust") {
        let tgtL = ARM.rest, tgtR = ARM.rest;
        if (st === "thinking") tgtL = ARM.chin;
        else if (st === "happy" && t - stateSince < 2600) { tgtL = ARM.welcome; tgtR = ARM.welcome; }
        else if (st === "speaking") {
          if (!gesture && t > nextGesture) {
            const r = Math.random();
            gesture = { hand: r < 0.45 ? "R" : r < 0.85 ? "L" : "both", pose: Math.random() < 0.5 ? "explain" : "explain2", start: t, dur: 2200 + Math.random() * 1600 };
          }
          if (gesture) {
            const gp = (t - gesture.start) / gesture.dur;
            if (gp >= 1) { gesture = null; nextGesture = t + 900 + Math.random() * 2200; }
            else if (gp < 0.82) {
              const base = ARM[gesture.pose];
              const beat = Math.sin((t / 1000) * 3.4) * 4 * (0.4 + talk); // a small beat with the speech
              const live = { rot: base.rot + beat, x: base.x, y: base.y - talk * 4 };
              if (gesture.hand !== "L") tgtR = live;
              if (gesture.hand !== "R") tgtL = live;
            }
          }
        }
        const k = 0.09;
        armL.rot = lerp(armL.rot, tgtL.rot, k); armL.x = lerp(armL.x, tgtL.x, k); armL.y = lerp(armL.y, tgtL.y, k);
        armR.rot = lerp(armR.rot, tgtR.rot, k); armR.x = lerp(armR.x, tgtR.x, k); armR.y = lerp(armR.y, tgtR.y, k);
        set("armL", "transform", armTransform(armL, false));
        set("armR", "transform", armTransform(armR, true));
        el.dataset.gesture = gesture ? `${gesture.hand}:${gesture.pose}` : st === "thinking" ? "chin" : st === "happy" && t - stateSince < 2600 ? "welcome" : "none";
      }
    };

    const needsLoop = () => animated && visible && !document.hidden && (!reduce || stateRef.current === "speaking");
    const tick = (now: number) => {
      raf = 0;
      if (!needsLoop()) { if (reduce) apply(now); return; }
      if (now - last >= 30) { last = now; apply(now); } // ~30 fps: plenty for this style, half the work on phones
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && (needsLoop() || reduce)) raf = requestAnimationFrame(tick); };
    kickRef.current = kick;

    apply(performance.now());
    if (!animated) for (let i = 0; i < 40; i++) apply(performance.now()); // still picture: settle into the pose once
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); }) : null;
    io?.observe(el);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    kick();
    return () => { cancelAnimationFrame(raf); raf = 0; kickRef.current = () => {}; io?.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [animated, framing]);

  const vb = framing === "head" ? "88 74 224 224" : "0 64 400 416";
  const ratio = framing === "head" ? 1 : 416 / 400;
  const g = (id: string) => `${id}-${uid}`;

  // one forearm + open hand (palm up), drawn for the viewer-left arm; the right arm is its mirror image
  const forearm = (watch: boolean) => (
    <>
      <path d="M52 540 C60 500 92 470 124 444 L146 462 C118 486 96 514 88 548Z" fill={`url(#${g("arm")})`} />
      {watch && <><path d="M116 440 L140 462 L132 470 L108 448Z" fill="#20272c" /><rect x="114" y="446" width="14" height="12" rx="3" transform="rotate(42 121 452)" fill="#3a454c" stroke="#9aa7ae" strokeWidth="1.2" /></>}
      <path d="M126 440 C136 428 150 420 164 420 C176 420 182 428 178 436 C172 446 158 456 146 462Z" fill={SKIN.base} />
      <g strokeLinecap="round" fill="none">
        <path d="M162 422 C172 416 182 414 190 416 M164 428 C176 424 186 424 193 427 M162 434 C173 434 182 436 188 440 M156 440 C164 442 170 446 174 451" stroke={SKIN.deep} strokeWidth="8.5" />
        <path d="M162 422 C172 416 182 414 190 416 M164 428 C176 424 186 424 193 427 M162 434 C173 434 182 436 188 440 M156 440 C164 442 170 446 174 451" stroke={SKIN.base} strokeWidth="6.5" />
        <path d="M140 432 C140 418 146 408 154 404" stroke={SKIN.deep} strokeWidth="9.5" />
        <path d="M140 432 C140 418 146 408 154 404" stroke={SKIN.light} strokeWidth="7.5" />
      </g>
      <path d="M134 446 C146 440 158 436 168 436" stroke={SKIN.shade} strokeWidth="1.6" fill="none" opacity="0.7" />
    </>
  );

  return (
    <div ref={root} className={`relative inline-block select-none ${className}`} style={{ width: size, height: size * ratio }} data-state={state} data-lipsync="none">
      <svg viewBox={vb} width={size} height={size * ratio} role="img" aria-label={label} style={{ overflow: "hidden", display: "block" }}>
        <defs>
          <linearGradient id={g("scrub")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={NAVY_L} /><stop offset="0.45" stopColor={NAVY} /><stop offset="1" stopColor={NAVY_D} />
          </linearGradient>
          <linearGradient id={g("sleeveL")} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={NAVY_L} /><stop offset="1" stopColor={NAVY_D} />
          </linearGradient>
          <radialGradient id={g("face")} cx="0.45" cy="0.36" r="0.72">
            <stop offset="0" stopColor={SKIN.light} /><stop offset="0.62" stopColor={SKIN.base} /><stop offset="1" stopColor={SKIN.shade} />
          </radialGradient>
          <linearGradient id={g("neck")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SKIN.deep} /><stop offset="0.55" stopColor={SKIN.shade} /><stop offset="1" stopColor={SKIN.base} />
          </linearGradient>
          <linearGradient id={g("arm")} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={SKIN.shade} /><stop offset="1" stopColor={SKIN.base} />
          </linearGradient>
          <radialGradient id={g("curl")} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#33251e" /><stop offset="0.75" stopColor={HAIR} /><stop offset="1" stopColor="#120c09" />
          </radialGradient>
          <radialGradient id={g("iris")} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#8a5631" /><stop offset="1" stopColor="#3a2112" />
          </radialGradient>
          <linearGradient id={g("beard")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1d17" stopOpacity="0.45" /><stop offset="0.4" stopColor="#21160f" stopOpacity="0.85" /><stop offset="1" stopColor="#170f0a" stopOpacity="0.95" />
          </linearGradient>
          <clipPath id={g("eyeL")}><path d="M149 197 C155 182 182 181 189 195 C182 210 156 211 149 197Z" /></clipPath>
          <clipPath id={g("eyeR")}><path d="M211 195 C218 181 245 182 251 197 C244 211 218 210 211 195Z" /></clipPath>
        </defs>

        <g ref={ref("body")}>
          {/* ---------------- torso, shoulders, sleeves ---------------- */}
          <g ref={ref("shoulders")}>
            <path d="M34 420 C30 446 30 466 32 480 L72 480 C70 462 70 444 74 424Z" fill={SKIN.shade} />
            <path d="M366 420 C370 446 370 466 368 480 L328 480 C330 462 330 444 326 424Z" fill={SKIN.shade} />
            <path d="M24 440 C28 380 66 346 140 330 L176 318 C190 336 210 336 224 318 L260 330 C334 346 372 380 376 440 L376 480 L24 480Z" fill={`url(#${g("scrub")})`} />
            <path d="M24 440 C26 400 44 372 74 356 L88 430 C70 434 50 438 30 444Z" fill={`url(#${g("sleeveL")})`} />
            <path d="M28 440 L86 428 L88 438 L30 452Z" fill={TEAL} />
            <path d="M376 440 C374 400 356 372 326 356 L312 430 C330 434 350 438 370 444Z" fill={NAVY_D} />
            <path d="M372 440 L314 428 L312 438 L370 452Z" fill={TEAL} />
            <path d="M74 356 C80 380 84 404 88 430" stroke="#0a1b28" strokeWidth="2.5" fill="none" opacity="0.6" />
            <path d="M326 356 C320 380 316 404 312 430" stroke="#0a1b28" strokeWidth="2.5" fill="none" opacity="0.6" />
            <path d="M70 360 C104 340 140 334 168 326" stroke="#2c6383" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45" />
            {/* white undershirt + V-neck with teal piping */}
            <path d="M170 320 L200 384 L230 320 C220 334 210 338 200 338 C190 338 180 334 170 320Z" fill="#f4f6f7" />
            <path d="M178 330 C190 342 210 342 222 330 L200 376Z" fill="#dde3e6" />
            <path d="M162 318 L200 396 L238 318" stroke={TEAL} strokeWidth="7" fill="none" strokeLinejoin="round" />
            <path d="M162 318 L200 396 L238 318" stroke={TEAL_L} strokeWidth="1.8" fill="none" strokeLinejoin="round" opacity="0.7" />
            {/* chest pocket + NurseHub badge (heart with an ECG line) */}
            <path d="M246 430 L312 430 L310 470 L248 470Z" fill={NAVY_D} opacity="0.5" />
            <path d="M292 367 C292 360 283 356 278 362 C273 356 264 360 264 367 C264 376 278 384 278 384 C278 384 292 376 292 367Z" fill={TEAL} />
            <path d="M264 372 L270 372 L273 366 L277 378 L281 369 L284 372 L292 372" stroke="#ffffff" strokeWidth="1.7" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <text x="278" y="400" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#ffffff" fontFamily="system-ui,'Segoe UI',Arial">NurseHub</text>
            <text x="278" y="412" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#cfe9ea" fontFamily="system-ui,'Segoe UI',Arial">Egypt</text>
          </g>

          {/* neck */}
          <path d="M174 246 L174 320 Q200 344 226 320 L226 246Z" fill={`url(#${g("neck")})`} />
          <path d="M174 288 Q200 312 226 288 L226 300 Q200 324 174 300Z" fill={SKIN.deep} opacity="0.3" />

          {/* ---------------- head ---------------- */}
          <g ref={ref("head")}>
            <ellipse cx="129" cy="206" rx="12" ry="21" fill={SKIN.shade} />
            <ellipse cx="131" cy="207" rx="6" ry="13" fill={SKIN.deep} opacity="0.45" />
            <ellipse cx="271" cy="206" rx="12" ry="21" fill={SKIN.shade} />
            <ellipse cx="269" cy="207" rx="6" ry="13" fill={SKIN.deep} opacity="0.45" />
            <path d="M200 112 C251 112 273 150 272 200 C271 246 250 282 214 296 C206 299 194 299 186 296 C150 282 129 246 128 200 C127 150 149 112 200 112Z" fill={`url(#${g("face")})`} />
            <path d="M129 198 C131 238 148 268 172 284 C152 262 142 236 140 204Z" fill={SKIN.shade} opacity="0.4" />
            <path d="M271 198 C269 238 252 268 228 284 C248 262 258 236 260 204Z" fill={SKIN.deep} opacity="0.3" />
            <g ref={ref("cheeks")} opacity="0.3">
              <ellipse cx="158" cy="236" rx="13" ry="8" fill="#e98f7a" opacity="0.35" />
              <ellipse cx="242" cy="236" rx="13" ry="8" fill="#e98f7a" opacity="0.35" />
            </g>

            {/* trimmed beard: jawline + chin (moves with the jaw); the mustache stays */}
            <g ref={ref("jaw")}>
              <path d="M130 212 C133 256 156 290 200 300 C244 290 267 256 270 212 C264 236 254 250 240 256 C232 250 222 268 214 280 C208 284 192 284 186 280 C178 268 168 250 160 256 C146 250 136 236 130 212Z" fill={`url(#${g("beard")})`} />
            </g>
            <path d="M172 256 C184 246 195 249 200 251 C205 249 216 246 228 256 C217 253 207 255 200 258 C193 255 183 253 172 256Z" fill="#1d130d" />

            {/* nose */}
            <path d="M199 192 C197 209 192 222 188 229 C193 236 207 236 212 229" stroke={SKIN.deep} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
            <path d="M203 194 C205 209 207 219 208 225" stroke={SKIN.light} strokeWidth="2.2" fill="none" opacity="0.75" strokeLinecap="round" />
            <ellipse cx="193" cy="231" rx="3" ry="1.6" fill={SKIN.deep} opacity="0.7" />
            <ellipse cx="207" cy="231" rx="3" ry="1.6" fill={SKIN.deep} opacity="0.7" />

            {/* mouth (paths set by the animation loop) */}
            <g>
              <path ref={ref("inner")} fill="#3d1511" opacity="0" />
              <path ref={ref("tongue")} fill="#b9564d" opacity="0" />
              <path ref={ref("teeth")} fill="#f6f2ec" opacity="0" />
              <path ref={ref("lower")} fill="#c47a66" />
              <path ref={ref("upper")} fill="#ab624f" />
            </g>

            {/* eyes (independent lids) */}
            {([["L", 169, "eyeL", "lidL", "irisL"], ["R", 231, "eyeR", "lidR", "irisR"]] as const).map(([side, cx, clip, lid, iris]) => (
              <g key={side}>
                <path d={side === "L" ? "M149 197 C155 182 182 181 189 195 C182 210 156 211 149 197Z" : "M211 195 C218 181 245 182 251 197 C244 211 218 210 211 195Z"} fill="#f7f2ec" />
                <g clipPath={`url(#${g(clip)})`}>
                  <g ref={ref(iris)}>
                    <circle cx={cx} cy="196.5" r="10.5" fill={`url(#${g("iris")})`} />
                    <circle cx={cx} cy="196.5" r="4.6" fill="#120a06" />
                    <circle cx={cx + 3.4} cy="192.6" r="2.5" fill="#fff" />
                  </g>
                  <path ref={ref(lid)} d={`M${cx - 24} 180 L${cx + 24} 180 L${cx + 24} 212 L${cx - 24} 212Z`} fill={SKIN.base} transform="translate(0 183) scale(1 0) translate(0 -183)" />
                </g>
                <path d={side === "L" ? "M148 197 C155 180 182 179 190 195" : "M210 195 C218 179 245 180 252 197"} stroke="#1f120b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d={side === "L" ? "M155 202 C163 206 176 206 183 200" : "M217 200 C224 206 237 206 245 202"} stroke={SKIN.deep} strokeWidth="1.2" fill="none" opacity="0.55" />
              </g>
            ))}

            {/* thick brows */}
            <path ref={ref("browL")} d="M145 177 C154 164 174 161 190 169 C188 173 186 174 184 173 C171 169 158 171 148 181Z" fill="#1b110c" />
            <path ref={ref("browR")} d="M255 177 C246 164 226 161 210 169 C212 173 214 174 216 173 C229 169 242 171 252 181Z" fill="#1b110c" />

            {/* short thick curly hair */}
            <path d="M127 200 C119 144 148 96 200 92 C252 92 283 140 273 200 C269 178 263 162 252 152 C228 145 172 145 148 152 C137 162 131 180 127 200Z" fill={HAIR} />
            {CURLS.map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={`url(#${g("curl")})`} />
                <path d={`M${x - r * 0.55} ${y - r * 0.1} C${x - r * 0.4} ${y - r * 0.7} ${x + r * 0.3} ${y - r * 0.75} ${x + r * 0.5} ${y - r * 0.25}`} stroke="#5a4438" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.75" />
              </g>
            ))}
            <path d="M130 196 C127 212 128 222 132 230 L136 204Z" fill={HAIR} />
            <path d="M270 196 C273 212 272 222 268 230 L264 204Z" fill={HAIR} />
          </g>

          {/* forearms + hands (gestures) — bust framing only */}
          {framing === "bust" && (
            <>
              <g ref={ref("armL")} transform="rotate(62 70 540) translate(0 40)">{forearm(false)}</g>
              <g ref={ref("armR")} transform="rotate(-62 330 540) translate(0 40)"><g transform="translate(400 0) scale(-1 1)">{forearm(true)}</g></g>
            </>
          )}
        </g>
      </svg>
      {/* honest fallback marker: shown only while speaking WITHOUT analysable audio */}
      <span aria-hidden="true" className="nh-av-wave"><i /><i /><i /></span>
      <style>{`
        .nh-av-wave{display:none;position:absolute;bottom:6%;inset-inline-end:6%;gap:2px;padding:4px 6px;border-radius:999px;background:rgba(0,0,0,.35);pointer-events:none}
        [data-lipsync="indicator"] > .nh-av-wave{display:inline-flex}
        .nh-av-wave i{display:block;width:3px;height:10px;border-radius:2px;background:#2ab5bb;animation:nhAvWave .9s ease-in-out infinite}
        .nh-av-wave i:nth-child(2){animation-delay:.15s}.nh-av-wave i:nth-child(3){animation-delay:.3s}
        @keyframes nhAvWave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
        @media (prefers-reduced-motion:reduce){.nh-av-wave i{animation:none}}
      `}</style>
    </div>
  );
}
