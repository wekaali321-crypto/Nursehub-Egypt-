import { Fragment, type ReactNode } from "react";

const LATIN = /([A-Za-z][A-Za-z0-9/\-.+%°µ' ]*[A-Za-z0-9%)]|[A-Za-z])/g;

/** Wrap English runs so they keep their own direction inside Arabic text. */
function iso(text: string): ReactNode {
  const parts = text.split(LATIN);
  return parts.map((p, i) =>
    i % 2 === 1 ? <bdi key={i} dir="ltr" className="font-semibold">{p}</bdi> : <Fragment key={i}>{p}</Fragment>,
  );
}

const MARK = /^\s*(?:[-•*▪●]|\d{1,2}[.)])\s+/;

/**
 * Readable rendering for the plain-text bodies of the topic pages: bullets become
 * cards with a bold lead-in, "Title:" lines become sub-headings, English terms keep LTR.
 */
export default function TopicBody({ body, accent = "teal" }: { body: string; accent?: "teal" | "violet" | "amber" | "rose" | "sky" | "emerald" }) {
  const lines = (body || "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length === 0) return null;
  const dot: Record<string, string> = {
    teal: "bg-teal-500", violet: "bg-violet-500", amber: "bg-amber-500", rose: "bg-rose-500", sky: "bg-sky-500", emerald: "bg-emerald-500",
  };
  const lead: Record<string, string> = {
    teal: "text-teal-700 dark:text-teal-300", violet: "text-violet-700 dark:text-violet-300", amber: "text-amber-700 dark:text-amber-300",
    rose: "text-rose-700 dark:text-rose-300", sky: "text-sky-700 dark:text-sky-300", emerald: "text-emerald-700 dark:text-emerald-300",
  };
  return (
    <div className="space-y-2 text-[15px] leading-8 text-slate-700 dark:text-slate-300">
      {lines.map((raw, i) => {
        const isItem = MARK.test(raw);
        const text = raw.replace(MARK, "").trim();
        const num = raw.match(/^\s*(\d{1,2})[.)]\s/)?.[1];
        if (!isItem) {
          if (/^#+\s/.test(text) || (/[:：]$/.test(text) && text.length < 70)) {
            return <h3 key={i} className={`pt-2 text-base font-black ${lead[accent]}`}>{text.replace(/^#+\s*/, "").replace(/[:：]$/, "")}</h3>;
          }
          return <p key={i}>{iso(text)}</p>;
        }
        const m = text.match(/^([^:：]{2,60})[:：]\s*(.+)$/);
        return (
          <div key={i} className="flex gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2 dark:bg-slate-800/50">
            {num ? (
              <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${dot[accent]}`}>{num}</span>
            ) : (
              <span className={`mt-3 h-2 w-2 shrink-0 rounded-full ${dot[accent]}`} />
            )}
            <div className="min-w-0 flex-1">
              {m ? (<><b className={lead[accent]}>{iso(m[1])}:</b> {iso(m[2])}</>) : iso(text)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
