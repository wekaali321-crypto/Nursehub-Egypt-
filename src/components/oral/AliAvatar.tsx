import { useEffect, useId, useRef } from "react";
import { MASCOT_SRC } from "./avatarSrc";

/**
 * "Ali Ashour" — the original home-page mascot, animated with a lightweight SVG overlay.
 * The source image and its appearance remain unchanged.
 */
export type AvatarMood = "idle" | "speaking" | "listening" | "thinking" | "happy" | "sad";

const LID_L = "M240 213 Q268 190 299 208 Q270 229 240 213 Z";
const LID_R = "M340 205 Q366 182 394 199 Q368 219 340 205 Z";
const LASH_L = "M240 213 Q270 229 299 208";
const LASH_R = "M340 205 Q368 219 394 199";

export default function AliAvatar({
  mood,
  level = 0,
  size = 240,
  crop = "bust",
  className = "",
  label = "Ali Ashour",
}: {
  mood: AvatarMood;
  level?: number;
  size?: number;
  crop?: "bust" | "face";
  className?: string;
  /** name read by screen readers: the examiner shown (Ali Ashour / Donia) */
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const jaw = useRef<SVGGElement>(null);
  const mouth = useRef<SVGEllipseElement>(null);
  const lids = useRef<SVGGElement>(null);
  const cur = useRef(0);
  const raf = useRef<number | null>(null);

  // Animate only when the voice level changes; do not keep an idle rAF loop running.
  useEffect(() => {
    const nextTarget = mood === "speaking" ? Math.max(0, Math.min(1, level)) : 0;
    if (raf.current !== null) cancelAnimationFrame(raf.current);

    const tick = () => {
      const delta = nextTarget - cur.current;
      cur.current = Math.abs(delta) < 0.008
        ? nextTarget
        : cur.current + delta * 0.22;

      const d = cur.current * 7.5;
      jaw.current?.setAttribute("transform", `translate(0 ${d.toFixed(2)})`);
      mouth.current?.setAttribute("cy", (304 + d * 0.42).toFixed(2));
      mouth.current?.setAttribute("ry", Math.max(0, d * 0.52).toFixed(2));

      if (Math.abs(nextTarget - cur.current) >= 0.008) {
        raf.current = requestAnimationFrame(tick);
      } else {
        cur.current = nextTarget;
        raf.current = null;
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [mood, level]);

  // Blinks use tracked timers so neither timeout survives component unmount.
  useEffect(() => {
    let nextBlink: number | null = null;
    let closeLids: number | null = null;
    let cancelled = false;

    const schedule = (delay: number) => {
      nextBlink = window.setTimeout(() => {
        if (cancelled) return;
        lids.current?.classList.add("nh-ali-blink");
        closeLids = window.setTimeout(() => {
          lids.current?.classList.remove("nh-ali-blink");
          closeLids = null;
          if (!cancelled) {
            const doubleBlink = Math.random() < 0.16;
            schedule(doubleBlink ? 180 : 2800 + Math.random() * 2600);
          }
        }, 125);
      }, delay);
    };

    schedule(1500);
    return () => {
      cancelled = true;
      if (nextBlink !== null) window.clearTimeout(nextBlink);
      if (closeLids !== null) window.clearTimeout(closeLids);
      lids.current?.classList.remove("nh-ali-blink");
    };
  }, []);

  const vb = crop === "face" ? "205 95 250 250" : "110 0 480 640";
  const ratio = crop === "face" ? 1 : 640 / 480;
  const ring =
    mood === "listening" ? "nh-ali-listen" :
    mood === "happy" ? "nh-ali-happy" :
    mood === "sad" ? "nh-ali-sad" : "";
  const motion =
    mood === "speaking" ? "nh-ali-talk" :
    mood === "happy" ? "nh-ali-bounce" :
    mood === "sad" ? "nh-ali-shake" :
    mood === "thinking" ? "nh-ali-think" : "nh-ali-breathe";

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size * ratio }}>
      <style>{CSS}</style>
      {ring && <span aria-hidden="true" className={`absolute inset-[6%] rounded-full ${ring}`} />}
      <svg
        viewBox={vb}
        width={size}
        height={size * ratio}
        className={`relative ${motion}`}
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={`jaw-${id}`} clipPathUnits="userSpaceOnUse">
            <path d="M282 299 Q330 312 378 297 L392 322 Q384 356 360 372 Q330 382 300 372 Q276 356 270 322 Z" />
          </clipPath>
        </defs>
        <image href={MASCOT_SRC} x="0" y="0" width="700" height="1019" />
        <ellipse ref={mouth} cx="330" cy="304" rx="40" ry="0" fill="#4a1512" />
        <g ref={jaw} clipPath={`url(#jaw-${id})`}>
          <image href={MASCOT_SRC} x="0" y="0" width="700" height="1019" />
        </g>
        <g ref={lids} className="nh-ali-lids">
          <g>
            <path d={LID_L} fill="#d48857" />
            <path d={LASH_L} fill="none" stroke="#2b1308" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g>
            <path d={LID_R} fill="#dd9262" />
            <path d={LASH_R} fill="none" stroke="#2b1308" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
        {mood === "thinking" && (
          <g className="nh-ali-dots" fill="#14b8a6">
            <circle cx="470" cy="120" r="9" />
            <circle cx="500" cy="95" r="12" />
            <circle cx="535" cy="65" r="15" />
          </g>
        )}
      </svg>
    </div>
  );
}

const CSS = `
.nh-ali-lids g{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0);transition:transform 70ms ease-in}
.nh-ali-lids.nh-ali-blink g{transform:scaleY(1)}
@keyframes nhAliBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2%)}}
@keyframes nhAliTalk{0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-1.2deg) translateY(-.6%)}75%{transform:rotate(1.2deg) translateY(-.3%)}}
@keyframes nhAliBounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-6%)}55%{transform:translateY(0)}75%{transform:translateY(-2%)}}
@keyframes nhAliShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-2.5%)}40%,80%{transform:translateX(2.5%)}}
@keyframes nhAliThink{0%,100%{transform:rotate(0)}50%{transform:rotate(-2.5deg)}}
@keyframes nhAliPulse{0%{box-shadow:0 0 0 0 rgba(20,184,166,.55)}100%{box-shadow:0 0 0 26px rgba(20,184,166,0)}}
@keyframes nhAliDots{0%,100%{opacity:.25}50%{opacity:1}}
.nh-ali-breathe{animation:nhAliBreathe 3.6s ease-in-out infinite;transform-origin:50% 100%}
.nh-ali-talk{animation:nhAliTalk 1.4s ease-in-out infinite;transform-origin:50% 100%}
.nh-ali-bounce{animation:nhAliBounce .9s ease-out 1;transform-origin:50% 100%}
.nh-ali-shake{animation:nhAliShake .6s ease-in-out 1}
.nh-ali-think{animation:nhAliThink 2.4s ease-in-out infinite;transform-origin:50% 100%}
.nh-ali-listen{animation:nhAliPulse 1.3s ease-out infinite;background:rgba(20,184,166,.10)}
.nh-ali-happy{background:radial-gradient(circle,rgba(16,185,129,.28),transparent 70%)}
.nh-ali-sad{background:radial-gradient(circle,rgba(245,158,11,.25),transparent 70%)}
.nh-ali-dots circle{animation:nhAliDots 1.2s ease-in-out infinite}
.nh-ali-dots circle:nth-child(2){animation-delay:.2s}.nh-ali-dots circle:nth-child(3){animation-delay:.4s}
@media (prefers-reduced-motion:reduce){.nh-ali-breathe,.nh-ali-talk,.nh-ali-bounce,.nh-ali-shake,.nh-ali-think,.nh-ali-listen,.nh-ali-dots circle{animation:none}}
`;
