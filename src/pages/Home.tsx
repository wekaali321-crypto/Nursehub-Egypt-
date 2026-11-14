import { useSectionAvailability } from "../lib/sections";
import { type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import type { HomeCategory } from "../lib/types";
import { ArticleCard, SectionTitle } from "../components/common";
import Newsletter from "../components/Newsletter";
import SmartSearch from "../components/SmartSearch";
import StudyStrip from "../components/StudyStrip";
import InstallAppButton from "../components/InstallAppButton";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";

const DIFFICULTY_LABEL: Record<string, { ar: string; en: string }> = {
  "سهل": { ar: "سهل", en: "Easy" },
  "متوسط": { ar: "متوسط", en: "Medium" },
  "صعب": { ar: "صعب", en: "Hard" },
};

const TOOL_PREVIEWS = [
  { i: "⚖️", t: "حاسبة BMI", tEn: "BMI Calculator", d: "مؤشر كتلة الجسم", dEn: "Body Mass Index" },
  { i: "💧", t: "معدل التنقيط الوريدي", tEn: "IV Drip Rate", d: "معدل التنقيط الوريدي", dEn: "IV infusion rate" },
  { i: "🧠", t: "مقياس غلاسكو", tEn: "GCS", d: "مقياس غلاسكو للوعي", dEn: "Glasgow Coma Scale" },
  { i: "🤰", t: "حاسبة الحمل", tEn: "Pregnancy Calculator", d: "موعد الولادة المتوقع", dEn: "Estimated due date" },
];

/** A single dynamic home category card — links internally or to an external URL. */
function CategoryCardLink({ card }: { card: HomeCategory }) {
  const { lang } = useI18n();
  const external = /^https?:\/\//i.test(card.link);
  const title = bilingual(card.title, card.titleEn, lang).text;
  const description = bilingual(card.description, card.descriptionEn, lang).text;
  const inner = (
    <>
      {card.image ? (
        <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-xl">
          <img src={card.image} alt={title} loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-2xl text-white transition-transform group-hover:scale-110 sm:h-14 sm:w-14 sm:text-3xl`}>{card.icon}</div>
      )}
      <div className="text-xs font-bold dark:text-white sm:text-sm">{title}</div>
      {description && <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{description}</div>}
    </>
  );
  const cls = "group rounded-2xl border border-slate-200 border-b-4 border-b-[#168C91] bg-white p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-b-[#168C91] dark:bg-slate-900 sm:p-5";
  return external
    ? <a href={card.link} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link to={card.link} className={cls}>{inner}</Link>;
}

export default function Home() {
  const { articles, products, homeSections, settings, drugs, media, subscribers, quizzes, homeCategories, homeSectionMeta } = useStore();
  const { t, lang } = useI18n();
  // In Arabic use the admin-editable section meta; in English use i18n translations.
  const meta = (key: string, arKey: string, enKey: string) =>
    lang === "ar"
      ? { title: homeSectionMeta[key]?.title || t(arKey as never), subtitle: homeSectionMeta[key]?.subtitle || t(enKey as never) }
      : { title: t(arKey as never), subtitle: t(enKey as never) };
  const published = articles.filter((a) => a.status === "published");
  // "أحدث المقالات": مقال واحد بس — آخر مقال نُشر على المنصة (الأحدث حسب تاريخ النشر).
  const latest = [...published].sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, 1);
  // "أكثر المقالات قراءة": مقال واحد بس — الأعلى مشاهدات.
  const popular = [...published].sort((a, b) => b.views - a.views).slice(0, 1);
  const pdfArticles = published.filter((a) => a.category === "books" || a.attachments?.some((x) => x.type === "pdf")).slice(0, 4);
  const { pathAvailable, hasContent } = useSectionAvailability();
  const visibleCards = [...homeCategories].filter((c) => c.visible && pathAvailable(c.link)).sort((a, b) => a.order - b.order);
  // "المتجر" على الرئيسية: أحدث منتج اتضاف بس. المنتجات الجديدة بتتحط أول المصفوفة
  // وقت الإضافة (زي باقي كيانات لوحة التحكم)، فأول عنصر = الأحدث.
  const latestProduct = products.slice(0, 1);

  useSEO({
    title: `${settings.siteName} | ${settings.tagline}`,
    description: settings.metaDescription,
    keywords: "تمريض, تعليم التمريض, ملخصات, أدوية, مهارات تمريضية, خطط رعاية",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.siteName,
      description: settings.metaDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });

  const sections: Record<string, ReactElement> = {
    hero: (
      <section key="hero" className="relative z-20 bg-[#153448] text-white">
        {/* خلفية: توهج تيل + شبكة خفيفة (بدون صور خارجية). تُقصّ في غلافها الخاص حتى لا يُقصّ معها منسدل البحث. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute -top-24 end-[-6rem] h-80 w-80 rounded-full bg-[#168C91]/40 blur-3xl" />
          <div className="absolute bottom-0 start-[-6rem] h-64 w-64 rounded-full bg-[#168C91]/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:pt-12 md:pt-16">
          <div className="grid items-center gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
            <div className="text-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#168C91]/50 bg-[#168C91]/15 px-3.5 py-1.5 text-xs font-bold text-teal-100 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-teal-300" />{t("home.badge")}
              </span>
              <h1 className="mt-4 text-4xl font-black leading-[1.15] sm:text-5xl md:text-6xl">{settings.siteName}</h1>
              <p className="mt-3 max-w-xl text-base font-bold text-teal-200 sm:text-xl">{lang === "ar" ? settings.tagline : t("brand.tagline")}</p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{t("home.heroDesc")}</p>
              <div className="mt-5 max-w-xl"><SmartSearch variant="hero" /></div>
              <InstallAppButton />
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-200 sm:text-sm">
                <li className="flex items-center gap-1.5"><span className="text-teal-300">●</span> {t("home.mascotPoint1")}</li>
                <li className="flex items-center gap-1.5"><span className="text-teal-300">●</span> {t("home.mascotPoint2")}</li>
                <li className="flex items-center gap-1.5"><span className="text-teal-300">●</span> {t("home.mascotPoint3")}</li>
              </ul>
            </div>
            <div className="relative mx-auto flex w-full max-w-xs flex-col items-center sm:max-w-sm">
              <div aria-hidden className="absolute inset-x-6 bottom-6 top-10 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#168C91]/30 to-white/5" />
              <img
                src="/male-nurse-mascot.webp"
                alt={t("home.mascotAlt")}
                width={320}
                height={465}
                className="relative w-44 drop-shadow-2xl sm:w-60 lg:w-72"
              />
              <div className="relative mt-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                <h2 className="text-sm font-black sm:text-base">{t("home.mascotTitle")}</h2>
                <p className="mt-1 text-xs leading-6 text-slate-200">{t("home.mascotDesc")}</p>
                <span className="mt-1 block text-[11px] font-bold text-teal-200">{t("home.mascotCredit")}</span>
              </div>
            </div>
          </div>
          <StudyStrip />
        </div>
        <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="relative block h-6 w-full text-[#F1F4F6] dark:text-slate-950"><path fill="currentColor" d="M0 40V18C240 0 480 36 720 22s480-22 720-4v22z" /></svg>
      </section>
    ),
    search: <div key="search" />,
    // "إحصائيات": اتنقلت شخصية الممرض جوه الهيرو نفسه بدل قسم منفصل تحته.
    stats: <div key="stats" />,
    // "محتوى مميز" — أُزيل بالكامل من الصفحة الرئيسية بناءً على الطلب.
    featured: <div key="featured" />,
    // "استكشف الأقسام" — رجّعناها لشكلها الأصلي (كروت التنقل بين الأقسام).
    categories: visibleCards.length > 0 ? (
      <section key="categories" className="bg-[#F1F4F6] py-10 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle {...meta("categories", "home.categories", "home.categoriesSub")} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {visibleCards.map((card) => (
              <CategoryCardLink key={card.id} card={card} />
            ))}
          </div>
        </div>
      </section>
    ) : <div key="categories" />,
    latest: (
      <section key="latest" className="mx-auto max-w-7xl px-4 py-6">
        <div className="py-8">
          <SectionTitle {...meta("latest", "home.latest", "home.latestSub")} link={{ label: t("common.viewAll"), to: "/category/articles" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      </section>
    ),
    popular: popular.length > 0 ? (
      <section key="popular" className="bg-[#F1F4F6] py-10 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle {...meta("popular", "home.popular", "home.popularSub")} link={{ label: t("common.more"), to: "/category/articles" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{popular.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      </section>
    ) : <div key="popular" />,
    pdfs: pdfArticles.length > 0 ? (
      <section key="pdfs" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("pdfs", "home.pdfs", "home.pdfsSub")} link={hasContent("books") ? { label: t("nav.books"), to: "/category/books" } : undefined} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{pdfArticles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      </section>
    ) : <div key="pdfs" />,
    quizzes: (
      <section key="quizzes" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("quizzes", "home.quizzes", "home.quizzesSub")} link={{ label: t("nav.quizzes"), to: "/quizzes" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.filter((q) => q.status === "published").slice(0, 3).map((q) => {
            const qTitle = bilingual(q.title, q.titleEn, lang).text;
            const qCategory = bilingual(q.category, q.categoryEn, lang).text;
            const qDifficulty = DIFFICULTY_LABEL[q.difficulty]?.[lang] ?? q.difficulty;
            return (
              <Link key={q.id} to={`/quiz/${q.id}`} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#F1F4F6] p-5 transition hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center justify-between"><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-[#168C91] dark:bg-sky-500/10">{qCategory}</span><span className="text-2xl">📝</span></div>
                <h3 className="mt-2 font-bold dark:text-white">{qTitle}</h3>
                <div className="mt-1 text-xs text-slate-400">{q.questions.length} {t("quiz.numQuestions")} · {qDifficulty}</div>
              </Link>
            );
          })}
        </div>
      </section>
    ),
    tools: (
      <section key="tools" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("tools", "home.tools", "home.toolsSub")} link={{ label: t("nav.tools"), to: "/tools" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOL_PREVIEWS.map((tool) => (
            <Link key={tool.t} to="/tools" className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#F1F4F6] p-5 transition hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
              <div className="text-3xl">{tool.i}</div>
              <div className="mt-2 font-bold dark:text-white">{lang === "en" ? tool.tEn : tool.t}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? tool.dEn : tool.d}</div>
            </Link>
          ))}
        </div>
      </section>
    ),
    store: (
      <section key="store" className="bg-[#F1F4F6] py-10 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle {...meta("store", "home.store", "home.storeSub")} link={{ label: t("home.visitStore"), to: "/store" }} />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latestProduct.map((p) => {
              const pTitle = bilingual(p.title, p.titleEn, lang).text;
              const cur = lang === "en" ? "EGP" : "ج.م";
              return (
                <Link key={p.id} to="/store" className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <img src={p.cover} alt={pTitle} loading="lazy" className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold dark:text-white">{pTitle}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xl font-black text-[#168C91]">{p.price} {cur}</span>
                      {p.oldPrice && <span className="text-sm text-slate-400 line-through">{p.oldPrice}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    ),
    newsletter: <Newsletter key="newsletter" />,
  };

  return <div>{homeSections.map((s) => sections[s] ?? <div key={s} />)}</div>;
}
