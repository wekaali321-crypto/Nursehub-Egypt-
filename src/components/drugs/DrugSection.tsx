import type { ReactNode } from "react";

type Tone = "default" | "dose" | "danger";

const TONE: Record<Tone, string> = {
  default: "border-slate-200 border-s-[#168C91] bg-white dark:border-slate-800 dark:border-s-[#168C91] dark:bg-slate-900",
  dose: "border-[#168C91]/40 border-s-[#168C91] bg-[#168C91]/[0.06] dark:border-[#168C91]/40 dark:border-s-[#168C91] dark:bg-[#168C91]/10",
  danger: "border-red-200 border-s-red-600 bg-red-50 dark:border-red-900 dark:border-s-red-600 dark:bg-red-500/10",
};

/** One titled block of the drug reference page. Text is rendered exactly as stored (line breaks preserved, nothing trimmed). */
export default function DrugSection({ id, icon, title, tone = "default", children }: { id: string; icon: string; title: string; tone?: Tone; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-32 rounded-2xl border border-s-4 p-4 sm:p-5 ${TONE[tone]}`}>
      <h2 className={`mb-2 flex items-center gap-2 text-base font-black sm:text-lg ${tone === "danger" ? "text-red-800 dark:text-red-300" : "text-[#153448] dark:text-white"}`}>
        <span aria-hidden="true" className="text-xl">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DrugText({ children, tone = "default" }: { children: string; tone?: Tone }) {
  return <p className={`whitespace-pre-line break-words leading-8 ${tone === "danger" ? "text-red-900 dark:text-red-200" : "text-slate-700 dark:text-slate-300"}`}>{children}</p>;
}
