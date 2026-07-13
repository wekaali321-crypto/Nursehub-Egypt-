import type { ReactNode } from "react";

/** Reusable enterprise CMS UI primitives — NurseHub design system. */

export const cardCls =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export function PageHeader({
  title, subtitle, icon, actions,
}: {
  title: string; subtitle?: string; icon?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-xl text-white shadow-lg shadow-sky-500/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white md:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, icon, gradient, hint, onClick,
}: {
  label: string; value: string | number; icon: string; gradient: string; hint?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${cardCls} group flex flex-col gap-2 p-4 text-right transition-all hover:-translate-y-0.5 hover:shadow-lg ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-lg text-white shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black text-slate-800 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </button>
  );
}

export function Toggle({
  checked, onChange, label, description, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</div>}
          {description && <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "-translate-x-6" : "-translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export function Field({
  label, children, hint, required,
}: {
  label: string; children: ReactNode; hint?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/40";

export function Btn({
  children, onClick, variant = "primary", size = "md", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md"; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const variants = {
    primary: "bg-gradient-to-l from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/30",
    success: "bg-gradient-to-l from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "purple" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ icon = "📭", title, description, action }: { icon?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
