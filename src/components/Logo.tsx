/**
 * Unified NurseHub Egypt brand logo.
 *
 * Icon: heart + stethoscope in the official blue/turquoise palette.
 * Wordmark: "Nurse" (dark/white) + "Hub" (sky), with small "Egypt" subtitle.
 *
 * This is the single source of truth for the brand mark — use it everywhere
 * (header, footer, login, admin, loading screen, certificates, etc.).
 */

export const BRAND = {
  blue: "#0284c7", // sky-600
  turquoise: "#14b8a6", // teal-500
  cyan: "#06b6d4",
};

/** The heart + stethoscope glyph on the gradient rounded tile. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl shadow-lg shadow-sky-500/30 ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.turquoise})` }}
    >
      <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62} fill="none" aria-hidden="true">
        {/* Stethoscope tubing forming a heart */}
        <path
          d="M24 41c-1 0-1.9-.5-2.5-1.2C17 34.4 9 30 9 21.5 9 16.8 12.6 13 17.2 13c2.9 0 5.4 1.5 6.8 3.8C25.4 14.5 27.9 13 30.8 13 35.4 13 39 16.8 39 21.5c0 .9-.1 1.7-.3 2.5"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.14)"
        />
        {/* Earpieces */}
        <path d="M14 12v6a6 6 0 0 0 12 0v-4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="10.5" r="2" fill="#ffffff" />
        <circle cx="26" cy="10.5" r="2" fill="#ffffff" />
        {/* Chestpiece */}
        <circle cx="35.5" cy="27.5" r="4.2" fill="#ffffff" />
        <circle cx="35.5" cy="27.5" r="1.7" fill={BRAND.blue} />
        {/* Cross on chestpiece area suggestion (subtle plus for medical) */}
        <path d="M24 22.5v5M21.5 25h5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

interface LogoProps {
  size?: number;
  showSubtitle?: boolean;
  variant?: "auto" | "light"; // "light" forces white wordmark (for dark/gradient backgrounds)
  className?: string;
}

/** Full lockup: icon + "NurseHub" wordmark + "Egypt" subtitle. */
export default function Logo({ size = 40, showSubtitle = true, variant = "auto", className = "" }: LogoProps) {
  const nurseColor = variant === "light" ? "text-white" : "text-slate-900 dark:text-white";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-none">
        <span className="block font-extrabold tracking-tight" style={{ fontSize: size * 0.42 }}>
          <span className={nurseColor}>Nurse</span><span className="text-sky-500" style={variant === "light" ? { color: "#e0f2fe" } : undefined}>Hub</span>
        </span>
        {showSubtitle && (
          <span className="mt-0.5 block font-bold tracking-[0.25em] text-teal-500" style={{ fontSize: size * 0.2, color: variant === "light" ? "rgba(255,255,255,0.85)" : undefined }}>
            EGYPT
          </span>
        )}
      </span>
    </span>
  );
}
