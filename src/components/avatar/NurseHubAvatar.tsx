import { useEffect, useRef, useState } from "react";

/**
 * NurseHubAvatar — the official NurseHub Egypt assistant, built from the owner's approved images (design/avatar-src →
 * public/avatar via scripts/build_avatar_assets.py). No drawing of our own: every pixel is the owner's character.
 *
 * Layers (one stack, absolutely positioned, same 512 × 917 frame):
 *   pose image  — base / listening / happy / sad / thinking / gesture_explain / gesture_welcome (cross-faded)
 *   face layer  — positioned where the BASE face sits in the current pose (identity for most poses; measured scale + shift for
 *                 the two gesture images) and holding:
 *                   mouth patches (slight / open / wide / round / smile) cut from the owner's mouth images
 *                   eyes-closed patch (blink)
 *
 * Lip-sync:
 *   - `frame()` returns REAL audio analysis { level, wide } (Web Audio analyser of the playing voice). Loudness picks how open
 *     the mouth is, the spectral centre picks the shape (wide "ee" / open "aa" / round "oo"); a viseme is held ≥ 70 ms so it
 *     never flickers. data-lipsync="audio".
 *   - speaking without analysable audio (the phone's SpeechSynthesis): a slow, regular open / slight alternation plus a small
 *     sound-wave badge — clearly a "talking" indicator, never presented as lip-sync. data-lipsync="indicator".
 *   - not speaking → closed (the pose's own mouth). Pause / stop: the caller leaves "speaking" → the mouth closes at once.
 * Motion: breathing (CSS), a slight head sway and hand gestures only while speaking, blinks on a timer. Nothing runs while the
 * avatar is off screen, the tab is hidden, or after unmount. Reduced motion: no sway / breathing / gesture swaps / blinks; the
 * mouth still follows the voice (it carries information).
 */
export type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "happy" | "sad";
export type AudioFrame = { level: number; wide: number };
type Pose = "base" | "listening" | "happy" | "sad" | "thinking" | "gesture_explain" | "gesture_welcome";
type Viseme = "closed" | "slight" | "open" | "wide" | "round" | "smile";

const DIR = "/avatar/";
const SRC_W = 768, SRC_H = 1376;
const RATIO = 917 / 512;
// geometry from public/avatar/avatar.json (kept in code so nothing extra is fetched; a unit test checks they match)
export const GEOMETRY = {
  mouthBox: [226 / SRC_W, 556 / SRC_H, 544 / SRC_W, 806 / SRC_H],
  eyesBox: [258 / SRC_W, 452 / SRC_H, 510 / SRC_W, 548 / SRC_H],
  face: {
    base: { scale: 1, x: 0, y: 0 }, listening: { scale: 1, x: 0, y: 0 }, happy: { scale: 1, x: 0, y: 0 }, sad: { scale: 1, x: 0, y: 0 }, thinking: { scale: 1, x: 0, y: 0 },
    gesture_explain: { scale: 0.8621, x: 0.07947, y: 0.03057 },
    gesture_welcome: { scale: 0.7937, x: 0.10623, y: 0.01027 },
  } as Record<Pose, { scale: number; x: number; y: number }>,
  icon: [104 / SRC_W, 212 / SRC_H, 560 / SRC_W], // left, top, side of the square face crop
  bust: [0.13, 0.87],                             // visible vertical band of the full pose (empty space above the head removed)
};
const POSES: Pose[] = ["base", "listening", "happy", "sad", "thinking", "gesture_explain", "gesture_welcome"];
const VISEMES: Exclude<Viseme, "closed">[] = ["slight", "open", "wide", "round", "smile"];
// poses where the mouth layer is used (the face is visible and not covered by a hand)
const TALKING_POSES: Pose[] = ["base", "gesture_explain", "gesture_welcome"];
const BLINK_POSES: Pose[] = ["base", "listening", "sad", "gesture_explain", "gesture_welcome"];

const STATE_POSE: Record<AvatarState, Pose> = { idle: "base", speaking: "base", listening: "listening", thinking: "thinking", happy: "happy", sad: "sad" };

let preloaded = false;
function preload() {
  if (preloaded || typeof Image === "undefined") return;
  preloaded = true;
  for (const n of [...POSES.map((p) => `pose_${p}`), ...VISEMES.map((v) => `mouth_${v}`), "eyes_closed"]) { const i = new Image(); i.src = `${DIR}${n}.webp`; }
}

/** Mouth shape from one audio frame. */
export function visemeFor(level: number, wide: number): Viseme {
  if (level < 0.1) return "closed";
  if (level < 0.28) return "slight";
  if (wide > 0.62) return "wide";
  if (wide < 0.34) return "round";
  return "open";
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

export default function NurseHubAvatar({
  state = "idle", size = 240, framing = "bust", frame, animated = true, label = "NurseHub assistant", className = "",
}: {
  state?: AvatarState;
  /** rendered width in px */
  size?: number;
  /** "bust" = the full picture; "head" = a square crop of the face */
  framing?: "bust" | "head";
  /** real audio analysis for lip-sync, read every animation frame while speaking */
  frame?: () => AudioFrame | null;
  /** false = a still picture (small buttons): one image, no timers, no loop */
  animated?: boolean;
  label?: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const sway = useRef<HTMLDivElement>(null);
  const mouthEls = useRef<Partial<Record<Viseme, HTMLImageElement | null>>>({});
  const eyesEl = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(frame); frameRef.current = frame;
  const [gesture, setGesture] = useState<Pose | null>(null);
  const reduce = reducedMotion();
  const pose: Pose = state === "speaking" && gesture ? gesture : STATE_POSE[state];
  const poseRef = useRef(pose); poseRef.current = pose;

  useEffect(() => { if (animated) preload(); }, [animated]);

  // ---- hand gestures while speaking: base → explain / welcome → base, every few seconds
  useEffect(() => {
    if (!animated || reduce || state !== "speaking") { setGesture(null); return; }
    let t = 0;
    const cycle = (first: boolean) => {
      t = window.setTimeout(() => {
        const g: Pose = Math.random() < 0.7 ? "gesture_explain" : "gesture_welcome";
        setGesture(g);
        t = window.setTimeout(() => { setGesture(null); cycle(false); }, 2400 + Math.random() * 1600);
      }, first ? 1200 : 3000 + Math.random() * 4000);
    };
    cycle(true);
    return () => clearTimeout(t);
  }, [state, animated, reduce]);

  // ---- mouth (rAF only while speaking and visible) + blinks (timers)
  useEffect(() => {
    const el = root.current;
    if (!el || !animated) return;
    let raf = 0, visible = true, current: Viseme = "closed", since = 0, blinkT = 0;
    const show = (v: Viseme) => {
      if (v === current) return;
      current = v;
      for (const k of VISEMES) { const m = mouthEls.current[k]; if (m) m.style.opacity = k === v ? "1" : "0"; }
      el.dataset.viseme = v;
    };
    const speaking = () => state === "speaking";
    const tick = (now: number) => {
      raf = 0;
      if (!speaking() || !visible || document.hidden) { show("closed"); el.dataset.lipsync = "none"; return; }
      const f = frameRef.current?.() ?? null;
      let v: Viseme;
      if (f) { el.dataset.lipsync = "audio"; v = visemeFor(f.level, f.wide); }
      else { el.dataset.lipsync = "indicator"; v = Math.floor(now / 230) % 2 ? "slight" : "open"; }
      if (!TALKING_POSES.includes(poseRef.current)) v = "closed";
      if (v !== current && now - since >= 70) { show(v); since = now; }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && speaking() && visible && !document.hidden) raf = requestAnimationFrame(tick); };

    const blink = () => {
      blinkT = window.setTimeout(() => {
        if (visible && !document.hidden && BLINK_POSES.includes(poseRef.current) && eyesEl.current) {
          eyesEl.current.style.opacity = "1";
          window.setTimeout(() => { if (eyesEl.current) eyesEl.current.style.opacity = "0"; }, 130);
        }
        blink();
      }, 2600 + Math.random() * 3400);
    };
    if (!reduce) blink();

    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); }) : null;
    io?.observe(el);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    el.dataset.lipsync = "none"; el.dataset.viseme = "closed";
    for (const k of VISEMES) { const m = mouthEls.current[k]; if (m) m.style.opacity = "0"; }
    kick();
    return () => { cancelAnimationFrame(raf); clearTimeout(blinkT); io?.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [state, animated, reduce]);

  // ---- layout: full picture, or a square crop around the face
  const W = framing === "head" ? size / GEOMETRY.icon[2] : size;
  const H = W * RATIO;
  const outerH = framing === "head" ? size : H * (GEOMETRY.bust[1] - GEOMETRY.bust[0]);
  const offX = framing === "head" ? -GEOMETRY.icon[0] * W : 0;
  const offY = framing === "head" ? -GEOMETRY.icon[1] * H : -GEOMETRY.bust[0] * H; // fractions of the source height

  if (!animated) {
    // still: one small image (the face crop) or the base pose — no timers, no loop
    return (
      <div className={className} style={{ position: "relative", display: "inline-block", overflow: "hidden", width: size, height: outerH }} data-state={state} role="img" aria-label={label}>
        {framing === "head"
          ? <img src={`${DIR}icon.webp`} alt="" width={size} height={size} loading="lazy" decoding="async" style={{ width: size, height: size, display: "block" }} />
          : <img src={`${DIR}pose_${STATE_POSE[state]}.webp`} alt="" width={size} height={H} loading="lazy" decoding="async" style={{ width: size, height: H, display: "block", marginTop: offY }} />}
      </div>
    );
  }

  const face = GEOMETRY.face[pose];
  const mb = GEOMETRY.mouthBox, eb = GEOMETRY.eyesBox;
  const talkingPose = TALKING_POSES.includes(pose);
  return (
    <div ref={root} className={`nh-av ${className}`} style={{ position: "relative", display: "inline-block", overflow: "hidden", userSelect: "none", width: size, height: outerH }}
      data-state={state} data-pose={pose} data-motion={reduce ? "reduced" : "full"} role="img" aria-label={label}>
      <div className={reduce ? "" : "nh-av-breathe"} style={{ position: "absolute", left: offX, top: offY, width: W, height: H }}>
        <div ref={sway} className={state === "speaking" && !reduce ? "nh-av-sway" : ""} style={{ position: "absolute", inset: 0 }}>
          {POSES.map((p) => (
            <img key={p} src={`${DIR}pose_${p}.webp`} alt="" draggable={false} decoding="async"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: p === pose ? 1 : 0, transition: reduce ? "none" : "opacity 220ms ease" }} />
          ))}
          {/* face layer: where the base face sits in the current pose */}
          <div style={{ position: "absolute", left: pct(face.x), top: pct(face.y), width: pct(face.scale), height: pct(face.scale), transition: reduce ? "none" : "all 220ms ease", opacity: talkingPose || BLINK_POSES.includes(pose) ? 1 : 0 }}>
            {VISEMES.map((v) => (
              <img key={v} ref={(e) => { mouthEls.current[v] = e; }} src={`${DIR}mouth_${v}.webp`} alt="" draggable={false} decoding="async"
                style={{ position: "absolute", left: pct(mb[0]), top: pct(mb[1]), width: pct(mb[2] - mb[0]), height: pct(mb[3] - mb[1]), opacity: 0, transition: "opacity 60ms linear" }} />
            ))}
            <img ref={eyesEl} src={`${DIR}eyes_closed.webp`} alt="" draggable={false} decoding="async"
              style={{ position: "absolute", left: pct(eb[0]), top: pct(eb[1]), width: pct(eb[2] - eb[0]), height: pct(eb[3] - eb[1]), opacity: 0, transition: "opacity 50ms linear" }} />
          </div>
        </div>
      </div>
      {/* honest fallback marker: only while speaking WITHOUT analysable audio */}
      <span aria-hidden="true" className="nh-av-wave"><i /><i /><i /></span>
      <style>{`
        .nh-av-breathe{animation:nhAvBreathe 4.2s ease-in-out infinite;transform-origin:50% 100%}
        .nh-av-sway{animation:nhAvSway 2.6s ease-in-out infinite;transform-origin:50% 62%}
        @keyframes nhAvBreathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-0.5%) scale(1.004)}}
        @keyframes nhAvSway{0%,100%{transform:rotate(0) translateY(0)}30%{transform:rotate(-0.7deg) translateY(-0.3%)}70%{transform:rotate(0.6deg) translateY(0.2%)}}
        .nh-av-wave{display:none;position:absolute;bottom:5%;inset-inline-end:5%;gap:2px;padding:4px 6px;border-radius:999px;background:rgba(0,0,0,.4);pointer-events:none}
        .nh-av[data-lipsync="indicator"] > .nh-av-wave{display:inline-flex}
        .nh-av-wave i{display:block;width:3px;height:10px;border-radius:2px;background:#2ab5bb;animation:nhAvWave .9s ease-in-out infinite}
        .nh-av-wave i:nth-child(2){animation-delay:.15s}.nh-av-wave i:nth-child(3){animation-delay:.3s}
        @keyframes nhAvWave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
        @media (prefers-reduced-motion:reduce){.nh-av-breathe,.nh-av-sway,.nh-av-wave i{animation:none}}
      `}</style>
    </div>
  );
}
