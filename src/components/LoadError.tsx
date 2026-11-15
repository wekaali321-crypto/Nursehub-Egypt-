import { useI18n } from "../lib/i18n";

export { LOAD_FAILED } from "../lib/loadFailed";

/**
 * What a visitor sees when data could not be loaded: a plain bilingual message and a retry button — never the raw
 * database/network error text (that goes to the console only).
 */
export default function LoadError({ detail, onRetry, className = "" }: { detail?: unknown; onRetry?: () => void; className?: string }) {
  const { lang } = useI18n();
  const en = lang === "en";
  if (detail) console.warn("[load error]", detail);
  return (
    <div role="alert" className={`mx-auto my-10 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-500/30 dark:bg-amber-500/10 ${className}`}>
      <div className="text-3xl" aria-hidden="true">📶</div>
      <p className="mt-2 font-bold text-amber-900 dark:text-amber-200">{en ? "We couldn't load this content right now." : "مقدرناش نحمّل المحتوى دلوقتي."}</p>
      <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">{en ? "Check your connection and try again in a moment." : "اتأكد من الإنترنت وجرّب تاني بعد شوية."}</p>
      <button type="button" onClick={onRetry ?? (() => window.location.reload())} className="mt-4 rounded-full bg-[#127378] px-5 py-2 text-sm font-bold text-white hover:bg-[#0f6165]">
        {en ? "Try again" : "حاول تاني"}
      </button>
    </div>
  );
}
