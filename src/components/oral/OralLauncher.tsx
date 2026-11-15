import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../lib/i18n";
import { useFeatures } from "../../admin/cms/useFeatures";
import { MASCOT_SRC } from "./avatarSrc";

const OralExamPanel = lazy(() => import("./OralExamPanel"));

/** Open the oral exam from anywhere: `openOralExam({ source: "topic", topic: "cardio" })`. */
export type OralPreset = { mode?: "ai" | "free"; source?: "page" | "topic"; topic?: string };
export function openOralExam(preset: OralPreset = {}) {
  window.dispatchEvent(new CustomEvent("nh:oral", { detail: preset }));
}

// pages where a floating button would get in the way (checkout, sign-in, an exam already running)
const HIDE = /^\/(checkout|login|register|forgot|order\/|buy)/;

/**
 * "Ali" button on every public page (bottom corner, above the mobile nav). The exam itself (avatar, voice, AI) is a separate
 * chunk loaded only when opened — nothing extra on a normal page view, no request until the learner presses it.
 */
export default function OralLauncher() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { pathname } = useLocation();
  const { features } = useFeatures();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<OralPreset | undefined>();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const on = (e: Event) => { setPreset((e as CustomEvent<OralPreset>).detail || {}); setOpen(true); };
    window.addEventListener("nh:oral", on);
    return () => window.removeEventListener("nh:oral", on);
  }, []);

  // a one-time hint bubble for new visitors
  useEffect(() => {
    let seen = true;
    try { seen = localStorage.getItem("nh_oral_hint") === "1"; } catch { /* ignore */ }
    if (seen) return;
    const t = window.setTimeout(() => setHint(true), 6000);
    const t2 = window.setTimeout(() => { setHint(false); try { localStorage.setItem("nh_oral_hint", "1"); } catch { /* ignore */ } }, 16000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  if (features.oralExam === false) return null;
  const hidden = HIDE.test(pathname);

  return (
    <>
      {!hidden && !open && (
        <div className="fixed bottom-24 right-4 z-40 flex items-end gap-2 md:bottom-6 md:right-6 print:hidden">
          {hint && (
            <button type="button" onClick={() => { setHint(false); setOpen(true); }} className="mb-2 max-w-[13rem] rounded-2xl rounded-br-sm bg-white px-3 py-2 text-start text-xs font-bold text-nh-navy shadow-xl dark:bg-slate-800 dark:text-white">
              {ar ? "تحب أسألك شفوي على اللي بتذاكره؟" : "Want me to quiz you out loud on this?"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { setPreset(undefined); setOpen(true); setHint(false); try { localStorage.setItem("nh_oral_hint", "1"); } catch { /* ignore */ } }}
            aria-label={ar ? "امتحان شفوي مع علي عاشور" : "Oral exam with Ali Ashour"}
            title={ar ? "امتحان شفوي مع علي" : "Oral exam with Ali"}
            className="group relative grid h-14 w-14 place-items-center rounded-full bg-nh-navy shadow-lg ring-2 ring-nh-teal transition hover:scale-105"
          >
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <img src={MASCOT_SRC} alt="" width={56} height={56} loading="lazy" decoding="async"
                className="absolute max-w-none" style={{ width: 160, left: -40, top: -14 }} />
            </span>
            <span className="absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-nh-teal text-[10px] text-white shadow" aria-hidden="true">🎙</span>
          </button>
        </div>
      )}
      {open && (
        <Suspense fallback={null}>
          <OralExamPanel onClose={() => setOpen(false)} preset={preset as never} />
        </Suspense>
      )}
    </>
  );
}
