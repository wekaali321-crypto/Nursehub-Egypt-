import { useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import type { HomeCategory } from "../lib/types";
import { AdSlot, ArticleCard, SectionTitle } from "../components/common";
import Newsletter from "../components/Newsletter";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";

/** A single dynamic home category card — links internally or to an external URL. */
function CategoryCardLink({ card }: { card: HomeCategory }) {
  const external = /^https?:\/\//i.test(card.link);
  const inner = (
    <>
      {card.image ? (
        <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-xl">
          <img src={card.image} alt={card.title} loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-2xl text-white transition-transform group-hover:scale-110 sm:h-14 sm:w-14 sm:text-3xl`}>{card.icon}</div>
      )}
      <div className="text-xs font-bold dark:text-white sm:text-sm">{card.title}</div>
      {card.description && <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{card.description}</div>}
    </>
  );
  const cls = "group rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-1 hover:border-sky-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-5";
  return external
    ? <a href={card.link} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link to={card.link} className={cls}>{inner}</Link>;
}

function HeroSearch() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q)}`); }}
      className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-2xl shadow-sky-900/20"
    >
      <span className="pr-3 text-xl text-slate-400">🔍</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("common.searchPlaceholder")}
        className="flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
      />
      <button className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-5 py-2.5 font-bold text-white sm:px-7">{t("common.search")}</button>
    </form>
  );
}

/** بديل قسم "الإحصائيات" اللي كان تحت الهيرو مباشرة: كارت نضيف بشخصية الممرض بدل الإنفوجرافيك المزدحم. */
function StatsAsIllustration() {
  const { t } = useI18n();
  return (
    <section className="bg-white py-10 dark:bg-slate-950 sm:py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-2 md:gap-12">
        <div className="order-2 text-center md:order-1 md:text-start">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white sm:text-3xl">{t("home.mascotTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400 sm:text-lg md:mx-0">{t("home.mascotDesc")}</p>
          <ul className="mx-auto mt-5 max-w-md space-y-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 sm:text-base md:mx-0">
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base text-sky-600 dark:bg-sky-900/40">💙</span>
              {t("home.mascotPoint1")}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base text-emerald-600 dark:bg-emerald-900/40">📘</span>
              {t("home.mascotPoint2")}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base text-amber-600 dark:bg-amber-900/40">🎯</span>
              {t("home.mascotPoint3")}
            </li>
          </ul>
          <Link
            to="/category/articles"
            className="mt-6 inline-block rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 sm:text-base"
          >
            {t("home.browse")}
          </Link>
        </div>
        <div className="order-1 flex justify-center md:order-2">
          <img
            src="/male-nurse-mascot.png"
            alt={t("home.mascotAlt")}
            loading="lazy"
            className="w-full max-w-[220px] drop-shadow-2xl sm:max-w-xs"
          />
        </div>
      </div>
    </section>
  );
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
  const visibleCards = [...homeCategories].filter((c) => c.visible).sort((a, b) => a.order - b.order);
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
      <section key="hero" className="relative overflow-hidden bg-gradient-to-bl from-sky-600 via-sky-500 to-emerald-500 py-10 text-white sm:py-16 md:py-20">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl animate-pulse-slow" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur sm:text-sm">{t("home.badge")}</span>
          <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight sm:text-4xl md:text-6xl">{settings.siteName}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-sky-50 sm:text-lg md:text-xl">{lang === "ar" ? settings.tagline : t("brand.tagline")} — {t("home.heroDesc")}</p>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3">
            <Link to="/category/articles" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-sky-600 shadow-lg transition-transform hover:scale-105 sm:px-7 sm:py-3 sm:text-base">{t("home.browse")}</Link>
            <Link to="/drugs" className="rounded-full border-2 border-white/60 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 sm:px-7 sm:py-3 sm:text-base">{t("home.drugGuide")}</Link>
          </div>
        </div>
      </section>
    ),
    search: <div key="search" />,
    // القسم اللي كان عبارة عن أرقام/إحصائيات تحت الهيرو مباشرة — استبدلناه بصورة/تصميم بدل الأرقام.
    stats: <div key="stats"><StatsAsIllustration /></div>,
    // "محتوى مميز" — أُزيل بالكامل من الصفحة الرئيسية بناءً على الطلب.
    featured: <div key="featured" />,
    // "استكشف الأقسام" — رجّعناها لشكلها الأصلي (كروت التنقل بين الأقسام).
    categories: visibleCards.length > 0 ? (
      <section key="categories" className="bg-slate-100 py-10 dark:bg-slate-900/50 md:py-12">
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
        <AdSlot label="إعلان (728x90) - أعلى المقالات" />
        <div className="py-8">
          <SectionTitle {...meta("latest", "home.latest", "home.latestSub")} link={{ label: t("common.viewAll"), to: "/category/articles" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      </section>
    ),
    popular: popular.length > 0 ? (
      <section key="popular" className="bg-slate-100 py-10 dark:bg-slate-900/50 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle {...meta("popular", "home.popular", "home.popularSub")} link={{ label: t("common.more"), to: "/category/articles" }} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{popular.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      </section>
    ) : <div key="popular" />,
    pdfs: pdfArticles.length > 0 ? (
      <section key="pdfs" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("pdfs", "home.pdfs", "home.pdfsSub")} link={{ label: t("nav.books"), to: "/category/books" }} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{pdfArticles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      </section>
    ) : <div key="pdfs" />,
    quizzes: (
      <section key="quizzes" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("quizzes", "home.quizzes", "home.quizzesSub")} link={{ label: t("nav.quizzes"), to: "/quizzes" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.filter((q) => q.status === "published").slice(0, 3).map((q) => (
            <Link key={q.id} to={`/quiz/${q.id}`} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50 p-5 transition hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center justify-between"><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">{q.category}</span><span className="text-2xl">📝</span></div>
              <h3 className="mt-2 font-bold dark:text-white">{q.title}</h3>
              <div className="mt-1 text-xs text-slate-400">{q.questions.length} سؤال · {q.difficulty}</div>
            </Link>
          ))}
        </div>
      </section>
    ),
    tools: (
      <section key="tools" className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <SectionTitle {...meta("tools", "home.tools", "home.toolsSub")} link={{ label: t("nav.tools"), to: "/tools" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: "⚖️", t: "حاسبة BMI", d: "مؤشر كتلة الجسم" },
            { i: "💧", t: "IV Drip Rate", d: "معدل التنقيط الوريدي" },
            { i: "🧠", t: "GCS", d: "مقياس غلاسكو للوعي" },
            { i: "🤰", t: "حاسبة الحمل", d: "موعد الولادة المتوقع" },
          ].map((t) => (
            <Link key={t.t} to="/tools" className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 transition hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
              <div className="text-3xl">{t.i}</div>
              <div className="mt-2 font-bold dark:text-white">{t.t}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{t.d}</div>
            </Link>
          ))}
        </div>
      </section>
    ),
    store: (
      <section key="store" className="bg-slate-100 py-10 dark:bg-slate-900/50 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle {...meta("store", "home.store", "home.storeSub")} link={{ label: t("home.visitStore"), to: "/store" }} />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latestProduct.map((p) => (
              <Link key={p.id} to="/store" className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <img src={p.cover} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold dark:text-white">{p.title}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-500">{p.price} ج.م</span>
                    {p.oldPrice && <span className="text-sm text-slate-400 line-through">{p.oldPrice}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),
    newsletter: <Newsletter key="newsletter" />,
  };

  return <div>{homeSections.map((s) => sections[s] ?? <div key={s} />)}</div>;
}
