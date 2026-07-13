import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

export interface TocItem { id: string; level: number; text: string }

/**
 * Sticky, scrollspy table of contents with active-section highlighting.
 * Supports h2–h6, is keyboard accessible, and announces the current
 * section via aria-current for screen readers.
 */
export default function TableOfContents({ items, className = "" }: { items: TocItem[]; className?: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;
    const headings = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: [0, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label={t("article.toc")} className={className}>
      <h3 className="mb-3 flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
        <span aria-hidden="true">📑</span> {t("article.toc")}
      </h3>
      <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto border-r-2 border-slate-100 pr-3 text-sm dark:border-slate-800">
        {items.map((it) => (
          <li key={it.id} style={{ marginInlineStart: `${Math.max(0, it.level - 2) * 12}px` }}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "location" : undefined}
              className={`block truncate rounded-lg px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                active === it.id
                  ? "bg-sky-50 font-bold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                  : "text-slate-500 hover:bg-slate-50 hover:text-sky-500 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
