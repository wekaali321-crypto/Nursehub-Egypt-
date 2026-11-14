import { useEffect, useState } from "react";

export interface DrugNavItem { id: string; label: string }

/**
 * In-page navigation for the drug reference page: a sticky horizontal chip bar on mobile and a sticky side list on desktop.
 * Both highlight the section currently in view. Only sections that really exist are passed in.
 */
export default function DrugSectionNav({ items, title, variant }: { items: DrugNavItem[]; title: string; variant: "chips" | "list" }) {
  const [active, setActive] = useState(items[0]?.id || "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis.length) setActive(vis[0].target.id);
      },
      { rootMargin: "-130px 0px -55% 0px", threshold: [0, 1] }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  if (variant === "chips") {
    return (
      <nav aria-label={title} className="sticky top-[65px] z-30 -mx-4 bg-[#F1F4F6]/95 px-4 py-2 backdrop-blur dark:bg-slate-950/95 lg:hidden print:hidden">
        <ul className="flex snap-x gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {items.map((i) => (
            <li key={i.id} className="shrink-0 snap-start">
              <a
                href={`#${i.id}`}
                aria-current={active === i.id ? "location" : undefined}
                className={`block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] ${
                  active === i.id
                    ? "border-[#168C91] bg-[#127378] text-white"
                    : "border-slate-200 bg-white text-[#153448] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={title} className="sticky top-24 hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:block print:hidden">
      <h2 className="mb-2 px-2 text-sm font-black text-[#153448] dark:text-white">{title}</h2>
      <ul className="space-y-0.5 border-s-2 border-slate-100 ps-2 dark:border-slate-800">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={`block rounded-lg px-2 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] ${
                active === i.id ? "bg-[#168C91]/10 font-bold text-[#127378] dark:bg-[#168C91]/20 dark:text-teal-300" : "text-slate-600 hover:bg-slate-50 hover:text-[#168C91] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
