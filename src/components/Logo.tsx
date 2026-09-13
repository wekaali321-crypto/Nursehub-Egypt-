/**
 * Unified NurseHub Egypt brand logo.
 *
 * Icon: the official NurseHub Egypt logo artwork.
 * Wordmark: "Nurse" (dark/white) + "Hub" (sky), with small "Egypt" subtitle.
 *
 * This is the single source of truth for the brand mark — use it everywhere
 * (header, footer, login, admin, loading screen, certificates, etc.).
 */

/** The NurseHub Egypt logo tile. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/icon-512.png"
      alt="NurseHub Egypt"
      width={size}
      height={size}
      className={`inline-block shrink-0 rounded-xl shadow-lg shadow-sky-500/30 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
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
