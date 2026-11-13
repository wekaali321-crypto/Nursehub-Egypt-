import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

export interface TocItem { id: string; level: number; text: string }

/**
 * Table of contents with scrollspy highlighting.
 * - `collapsible` (mobile): closed by default, shows the section count, opens/closes on tap.
 * - otherwise (desktop sidebar): always open and sticky from the parent.
 * Supports h2–h6, keyboard accessible, announces the current section via aria-current.
 */
export default function TableOfContents({ items, className = "", collapsible = false }: { items: TocItem[]; className?: string; collapsible?: boolean }) {
  const { t, lang } = useI18n();
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

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

  const count = items.length.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  const listId = collapsible ? "toc-list-mobile" : "toc-list-desktop";
  const show = !collapsible || open;

  const title = (
    <>
      <span aria-hidden="true">📑</span> {t("article.toc")}
      <span className="rounded-full bg-[#168C91]/10 px-2 py-0.5 text-xs font-bold text-[#168C91] dark:bg-[#168C91]/20 dark:text-teal-300">
        {count} {lang === "ar" ? "قسم" : "sections"}
      </span>
    </>
  );

  return (
    <nav aria-label={t("article.toc")} className={className}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-full items-center justify-between gap-2 rounded-lg font-bold text-[#153448] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168C91] dark:text-white"
        >
          <span className="flex flex-wrap items-center gap-2">{title}</span>
          <span aria-hidden="true" className={`text-[#168C91] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      ) : (
        <h3 className="mb-3 flex flex-wrap items-center gap-2 font-bold text-[#153448] dark:text-white">{title}</h3>
      )}
      {show && (
        <ul
          id={listId}
          className={`max-h-[60vh] space-y-0.5 overflow-y-auto border-s-2 border-slate-100 ps-3 text-sm dark:border-slate-800 ${collapsible ? "mt-3" : ""}`}
        >
          {items.map((it) => (
            <li key={it.id} style={{ marginInlineStart: `${Math.max(0, it.level - 2) * 12}px` }}>
              <a
                href={`#${it.id}`}
                onClick={() => collapsible && setOpen(false)}
                aria-current={active === it.id ? "location" : undefined}
                className={`block rounded-lg px-2 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168C91] ${
                  active === it.id
                    ? "bg-[#168C91]/10 font-bold text-[#168C91] dark:bg-[#168C91]/20 dark:text-teal-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#168C91] dark:text-slate-400 dark:hover:bg-slate-800"
                } ${collapsible ? "" : "truncate"}`}
              >
                {it.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
