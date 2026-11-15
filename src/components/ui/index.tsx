/**
 * NurseHub Egypt UI kit — the shared building blocks every new or updated screen uses (DESIGN.md).
 * Colours come from the @theme tokens in src/index.css (nh-navy, nh-teal, nh-surface, nh-line, status colours).
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nh-teal focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 " +
  "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-nh-teal-dark text-white shadow-sm hover:bg-nh-teal-darker",
  secondary: "bg-nh-navy text-white shadow-sm hover:bg-nh-navy-2",
  outline: "border border-nh-teal text-nh-teal-dark hover:bg-nh-teal-soft dark:text-teal-300 dark:hover:bg-teal-500/10",
  ghost: "text-nh-navy hover:bg-nh-surface dark:text-slate-200 dark:hover:bg-slate-800",
  danger: "bg-nh-danger text-white shadow-sm hover:bg-red-800",
};
const sizes: Record<ButtonSize, string> = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-base" };

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) => cn(base, variants[variant], sizes[size], extra);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; icon?: ReactNode };
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest }, ref) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant = "primary", size = "md", icon, className, children, ...rest }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode }) {
  return <Link className={buttonClass(variant, size, className)} {...rest}>{icon}{children}</Link>;
}

/** Card surface: one radius / border / shadow / hover for every card type. */
export const cardClass = (interactive = false, extra?: string) =>
  cn(
    "rounded-2xl border border-nh-line bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
    interactive && "transition hover:-translate-y-0.5 hover:border-nh-teal/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nh-teal",
    extra,
  );
export function Card({ className, interactive, children }: { className?: string; interactive?: boolean; children: ReactNode }) {
  return <div className={cardClass(interactive, className)}>{children}</div>;
}

/** Section heading used on hubs and the home page (title + optional subtitle + optional "see all" link). */
export function SectionHeader({ title, subtitle, action, id }: { title: ReactNode; subtitle?: ReactNode; action?: { to: string; label: string }; id?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-black text-nh-navy md:text-2xl dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <Link to={action.to} className="shrink-0 text-sm font-bold text-nh-teal-dark hover:underline dark:text-teal-300">{action.label}</Link>}
    </div>
  );
}

/** Status chip (success / warning / danger / info / alert / neutral). */
export type Tone = "success" | "warning" | "danger" | "info" | "alert" | "neutral" | "brand";
const tones: Record<Tone, string> = {
  success: "bg-green-50 text-nh-success ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/30",
  warning: "bg-amber-50 text-nh-warning ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  danger: "bg-red-50 text-nh-danger ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  info: "bg-blue-50 text-nh-info ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  alert: "bg-orange-50 text-nh-alert ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
  neutral: "bg-nh-surface text-slate-600 ring-nh-line dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  brand: "bg-nh-teal-soft text-nh-teal-dark ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
};
export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1", tones[tone], className)}>{children}</span>;
}
