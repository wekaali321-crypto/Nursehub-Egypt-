import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import TopicBody from "../TopicBody";
import { useHubView } from "../HubGrid";
import { useI18n } from "../../lib/i18n";

/**
 * Shared Navy/Teal layout for the specialty "topic" sections (hub page + topic page).
 * It only lays out data the caller already fetched: fetching, SEO, routing and any section-specific behaviour stay in the page.
 * Each section passes a small `tint` so it keeps its own light accent without going back to per-section gradients.
 */
export interface TopicSectionItem {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}
export interface SectionTopic {
  id: string;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: TopicSectionItem[];
  sources: string[] | null;
}
export interface TopicTint {
  /** glow behind the header (e.g. "bg-amber-400/25") */
  glow: string;
  /** icon tile in the header (on the Navy background) */
  iconBg: string;
  /** icon tile / band background on the cards (light + dark) */
  tile: string;
  /** small label colour on the cards */
  text: string;
}

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

function Header({ crumbs, tint, children }: { crumbs: { label: string; to?: string }[]; tint: TopicTint; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <header className="relative bg-[#153448] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className={`absolute -top-20 end-[-5rem] h-60 w-60 rounded-full blur-3xl ${tint.glow}`} />
        <div className="absolute -bottom-24 start-[-5rem] h-56 w-56 rounded-full bg-[#168C91]/25 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-4 md:pb-8 md:pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-300 sm:text-sm">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-teal-200">{t("nav.home")}</Link></li>
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                <span aria-hidden="true">/</span>
                {c.to ? <Link to={c.to} className="hover:text-teal-200">{c.label}</Link> : <span aria-current="page" className="font-semibold text-white">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        {children}
      </div>
    </header>
  );
}

/** Hub page of a topic section: header, category chips, compact/cards list. */
export function TopicSectionHome({
  title, description, icon, tint, topics, hrefFor, fallbackIcon, hubTop, hubBottom,
}: {
  title: string;
  description: { ar: string; en: string };
  icon: string;
  tint: TopicTint;
  topics: SectionTopic[] | null;
  hrefFor: (tp: SectionTopic) => string;
  fallbackIcon: string;
  /** Optional section-specific content shown above the category chips (e.g. a quiz widget or a banner). */
  hubTop?: ReactNode;
  /** Optional section-specific content shown below the topic list (e.g. related sections). */
  hubBottom?: ReactNode;
}) {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [category, setCategory] = useState("all");
  const [view, setView] = useHubView();

  const categories = Array.from(new Set((topics || []).map((tp) => tp.category).filter(Boolean))) as string[];
  const list = category === "all" ? topics || [] : (topics || []).filter((tp) => tp.category === category);

  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] ${
      active ? "border-[#168C91] bg-[#127378] text-white" : "border-slate-200 bg-white text-[#153448] hover:border-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    }`;

  return (
    <div className="bg-[#F1F4F6] pb-12 dark:bg-slate-950">
      <Header crumbs={[{ label: title }]} tint={tint}>
        <div className="mt-4 flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ring-1 ring-white/20 md:h-16 md:w-16 md:text-4xl ${tint.iconBg}`} aria-hidden="true">{icon}</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight md:text-4xl">{title}</h1>
            {topics && <p className="mt-1 text-sm text-teal-200">{topics.length} {isEn ? "topics" : "موضوع"}</p>}
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">{isEn ? description.en : description.ar}</p>
      </Header>

      <div className="mx-auto max-w-6xl px-4 pt-5">
        {hubTop}
        {categories.length > 1 && (
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]" role="group" aria-label={isEn ? "Filter by category" : "تصفية حسب التصنيف"}>
            <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={chip(category === "all")}>{isEn ? "All" : "الكل"}</button>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={chip(category === c)}>{c}</button>
            ))}
          </div>
        )}

        {topics === null ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>
        ) : list.length === 0 ? (
          <div className={`${card} py-16 text-center text-slate-500 dark:text-slate-400`}>
            <div className="text-4xl">🚧</div>
            <p className="mt-2">{isEn ? "Content coming soon." : "المحتوى قيد الإضافة قريبًا."}</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold">{list.length} {isEn ? "topics" : "موضوع"}</span>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 dark:border-slate-700" role="group" aria-label={isEn ? "View" : "طريقة العرض"}>
                {(["compact", "cards"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setView(m)} aria-pressed={view === m} className={`px-3 py-1 font-bold ${view === m ? "bg-[#153448] text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>
                    {m === "compact" ? (isEn ? "☰ Compact" : "☰ مضغوط") : isEn ? "▦ Cards" : "▦ كروت"}
                  </button>
                ))}
              </div>
            </div>

            {view === "compact" ? (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tp) => (
                  <Link key={tp.id} to={hrefFor(tp)} className="group flex items-center gap-3 rounded-xl border border-slate-200 border-s-4 border-s-[#168C91] bg-white px-3 py-2.5 transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-s-[#168C91] dark:bg-slate-900">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl ${tint.tile}`} aria-hidden="true">{tp.icon || fallbackIcon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-black leading-5 text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{isEn && tp.title_en ? tp.title_en : tp.title_ar}</span>
                        {!isEn && tp.title_en && <span dir="ltr" className="max-w-[40%] shrink-0 truncate text-[13px] font-black text-slate-600 dark:text-slate-300">{tp.title_en}</span>}
                      </span>
                      <span className="block truncate text-[11px] text-slate-600 dark:text-slate-400">{tp.category}{tp.category ? " · " : ""}{tp.sections.length} {isEn ? "sections" : "أقسام"}</span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-[#127378] dark:text-teal-300">{isEn ? "›" : "‹"}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tp) => {
                  const summary = isEn ? tp.summary_en : tp.summary_ar;
                  return (
                    <Link key={tp.id} to={hrefFor(tp)} className="group overflow-hidden rounded-2xl border border-slate-200 border-b-4 border-b-[#168C91] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-b-[#168C91] dark:bg-slate-900">
                      <div className={`flex h-20 items-end justify-between p-4 ${tint.tile}`}>
                        <span className="text-4xl" aria-hidden="true">{tp.icon || fallbackIcon}</span>
                        {tp.category && <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#153448] dark:bg-slate-900/70 dark:text-slate-100">{tp.category}</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-black leading-snug text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{isEn && tp.title_en ? tp.title_en : tp.title_ar}</h3>
                          {!isEn && tp.title_en && <span dir="ltr" className="max-w-[42%] shrink-0 truncate text-sm font-black text-slate-600 dark:text-slate-300">{tp.title_en}</span>}
                        </div>
                        {summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{summary}</p>}
                        <div className={`mt-3 text-xs font-bold ${tint.text}`}>{tp.sections.length} {isEn ? "sections" : "أقسام"} {isEn ? "→" : "←"}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
        {hubBottom}
      </div>
    </div>
  );
}

/** Topic page of a topic section: header + one card per section + sources + back link. */
export function TopicSectionDetail({
  topic, sectionTitle, basePath, tint, fallbackIcon, backLabel, detailTop, renderBody, sectionNav,
}: {
  topic: SectionTopic;
  sectionTitle: string;
  basePath: string;
  tint: TopicTint;
  fallbackIcon: string;
  backLabel: { ar: string; en: string };
  /** Optional section-specific content shown above the section cards (e.g. a cross-link banner). */
  detailTop?: ReactNode;
  /** Optional custom renderer for a section body (defaults to TopicBody). */
  renderBody?: (body: string, isEn: boolean) => ReactNode;
  /** Numbered section headings + a sticky in-page navigation (anchors #tsec-N), for long multi-section topics. */
  sectionNav?: boolean;
}) {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const title = isEn && topic.title_en ? topic.title_en : topic.title_ar;
  const summary = isEn ? topic.summary_en : topic.summary_ar;

  return (
    <div className="bg-[#F1F4F6] pb-12 dark:bg-slate-950">
      <Header crumbs={[{ label: sectionTitle, to: basePath }, { label: title }]} tint={tint}>
        <div className="mt-4 flex items-start gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ring-1 ring-white/20 md:h-16 md:w-16 md:text-4xl ${tint.iconBg}`} aria-hidden="true">{topic.icon || fallbackIcon}</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight md:text-4xl">{title}</h1>
            {summary && <p className="mt-2 text-sm leading-7 text-slate-200 md:text-base">{summary}</p>}
            {topic.category && <span className="mt-3 inline-block rounded-full border border-[#168C91]/60 bg-[#168C91]/20 px-3 py-1 text-xs font-bold text-teal-100 sm:text-sm">{topic.category}</span>}
          </div>
        </div>
      </Header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {detailTop}
        {sectionNav && topic.sections.length > 1 && (
          <div className="sticky top-14 z-10 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-[#F1F4F6]/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
            {topic.sections.map((s, i) => (
              <a key={s.id || i} href={`#tsec-${i}`} className="shrink-0 rounded-full border border-[#168C91]/30 bg-white px-3 py-1 text-xs font-bold text-[#153448] transition hover:border-[#168C91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {i + 1}. {isEn && s.heading_en ? s.heading_en : s.heading_ar}
              </a>
            ))}
          </div>
        )}
        <div className="space-y-4">
          {topic.sections.map((s, i) => {
            const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
            const body = isEn && s.body_en ? s.body_en : s.body_ar;
            return (
              <section key={s.id || i} id={sectionNav ? `tsec-${i}` : undefined} className={`${card} border-s-4 border-s-[#168C91] p-4 sm:p-5 ${sectionNav ? "scroll-mt-28" : ""}`}>
                <h2 className={`mb-3 text-lg font-black text-[#153448] dark:text-white ${sectionNav ? "flex items-center gap-2" : ""}`}>
                  {sectionNav && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#168C91] text-sm text-white">{i + 1}</span>}
                  {heading}
                </h2>
                {s.image_url && (
                  <img src={s.image_url} alt={heading} className="mb-4 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
                )}
                {renderBody ? renderBody(body, isEn) : <TopicBody body={body} accent="teal" />}
              </section>
            );
          })}
        </div>

        {topic.sources && topic.sources.length > 0 && (
          <div className={`${card} mt-4 p-4 text-xs text-slate-600 dark:text-slate-400`}>
            <div className="mb-1 font-bold text-[#153448] dark:text-slate-200">{isEn ? "Sources" : "المصادر"}</div>
            <ul className="list-inside list-disc space-y-0.5">
              {topic.sources.map((src, i) => <li key={i}>{src}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link to={basePath} className="rounded-full border border-[#153448]/20 bg-white px-6 py-2 font-bold text-[#153448] transition hover:border-[#168C91] hover:text-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            {isEn ? backLabel.en : backLabel.ar}
          </Link>
        </div>
      </div>
    </div>
  );
}
