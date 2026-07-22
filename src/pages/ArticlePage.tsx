import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore, readingTime } from "../lib/store";
import { CATEGORY_LABELS, type Category } from "../lib/types";
import { ArticleCard, Breadcrumbs, AdSlot, CAT_ICON } from "../components/common";
import { useSEO, breadcrumbSchema, extractFaqSchema, extractHowToSchema } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import { useToast } from "../components/Toast";
import { useFavorites } from "../lib/favorites";
import ReadingProgress from "../components/ReadingProgress";
import Icon from "../components/Icon";
import OptimizedImage from "../components/OptimizedImage";
import TableOfContents, { type TocItem } from "../components/TableOfContents";
import AuthorCard from "../components/AuthorCard";
import ArticleNav from "../components/ArticleNav";
import ArticleAI from "../components/ArticleAI";
import ArticleContent from "../components/ArticleContent";
import ShareBar from "../components/ShareBar";
import { startArticleView, endArticleView, trackScrollDepth, tickActiveReadingTime, logArticleEvent } from "../lib/analytics";

function buildToc(html: string): TocItem[] {
  const matches = [...html.matchAll(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/g)];
  return matches.map((m, i) => ({ id: `h-${i}`, level: Number(m[1]), text: m[2].replace(/<[^>]+>/g, "").trim() })).filter((t) => t.text);
}
function injectIds(html: string) {
  let i = 0;
  return html.replace(/<h([2-6])([^>]*)>/g, (_m, lvl, attrs) => `<h${lvl}${attrs} id="h-${i++}">`);
}

function Stars({ value, count, onRate }: { value: number; count: number; onRate: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="التقييم من 5 نجوم">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value >= n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onRate(n)} className="text-2xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded" aria-label={`${n} نجوم`}>
            <span className={(hover || value) >= n ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>★</span>
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">{value.toFixed(1)} من 5 ({count} تقييم)</span>
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams();
  const { articles, comments, setData, settings, logActivity, pushNotification, trackView, trackDownload } = useStore();
  const { notify } = useToast();
  const article = articles.find((a) => a.slug === slug);
  const { lang, t } = useI18n();
  const { isFav, toggleFav } = useFavorites();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const scrollTimer = useRef<number | undefined>(undefined);
  const tickTimer = useRef<number | undefined>(undefined);

  // Per-article reading language — independent of the site-wide UI language.
  // Lets a reader flip just this article between Arabic/English via the
  // button next to the title, without switching the whole site's interface.
  const [docLang, setDocLang] = useState<"ar" | "en">(lang === "en" ? "en" : "ar");
  const hasEnglish = !!(article?.titleEn && article?.contentEn);

  // ---- View count + real Supabase analytics (reading time, scroll depth) ----
  useEffect(() => {
    if (!article) return;
    window.scrollTo(0, 0);
    setData((d) => ({ ...d, articles: d.articles.map((a) => (a.id === article.id ? { ...a, views: a.views + 1 } : a)) }));
    trackView();
    startArticleView({ contentId: article.id, slug: article.slug, title: article.title });

    const onScroll = () => trackScrollDepth();
    window.addEventListener("scroll", onScroll, { passive: true });
    scrollTimer.current = onScroll as unknown as number;
    tickTimer.current = window.setInterval(tickActiveReadingTime, 2000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(tickTimer.current);
      endArticleView();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const toc = useMemo(() => (article ? buildToc(article.content) : []), [article]);
  const contentWithIds = useMemo(() => (article ? injectIds(article.content) : ""), [article]);
  const mins = useMemo(() => (article ? readingTime(article.content) : 0), [article]);

  // Bilingual display: use English fields when the reader picked English for
  // this article (docLang), independent from the overall site UI language.
  const dispTitle = article ? bilingual(article.title, article.titleEn, docLang) : { text: "", missing: false };
  const dispContent = article ? bilingual(article.content, article.contentEn, docLang) : { text: "", missing: false };
  const displayContentWithIds = article && docLang === "en" && article.contentEn ? injectIds(article.contentEn) : contentWithIds;
  const activeToc = article && docLang === "en" && article.contentEn ? buildToc(article.contentEn) : toc;

  // Auto-derived structured data — never fabricated, only extracted from real content.
  const faqSchema = article ? extractFaqSchema(displayContentWithIds) : null;
  const howToSchema = article ? extractHowToSchema(displayContentWithIds, dispTitle.text) : null;

  // Previous/next within the same category, ordered by publish date.
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!article) return { prevArticle: undefined, nextArticle: undefined };
    const sameCategory = articles
      .filter((a) => a.category === article.category && a.status === "published")
      .sort((a, b) => (a.publishDate || "").localeCompare(b.publishDate || ""));
    const idx = sameCategory.findIndex((a) => a.id === article.id);
    return { prevArticle: idx > 0 ? sameCategory[idx - 1] : undefined, nextArticle: idx >= 0 && idx < sameCategory.length - 1 ? sameCategory[idx + 1] : undefined };
  }, [articles, article]);

  useSEO({
    title: article ? `${article.metaTitle || article.title} | ${settings.siteName}` : "المقال غير موجود",
    description: article ? article.metaDescription || article.excerpt : "",
    keywords: article ? article.tags.join(", ") : "",
    image: article?.cover,
    type: "article",
    url: article ? `${window.location.origin}/article/${article.slug}` : undefined,
    jsonLd: article
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            image: article.cover,
            keywords: article.tags.join(", "),
            author: { "@type": "Person", name: article.author },
            datePublished: article.publishDate,
            dateModified: article.updatedDate || article.publishDate,
            publisher: { "@type": "Organization", name: settings.siteName },
            aggregateRating: article.ratingCount
              ? { "@type": "AggregateRating", ratingValue: article.rating, reviewCount: article.ratingCount }
              : undefined,
          },
          breadcrumbSchema([
            { name: "الرئيسية", url: window.location.origin },
            { name: CATEGORY_LABELS[article.category], url: `${window.location.origin}/category/${article.category}` },
            { name: article.title, url: window.location.href },
          ]),
          ...(faqSchema ? [faqSchema] : []),
          ...(howToSchema ? [howToSchema] : []),
        ]
      : undefined,
  });

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">{t("article.notFound")}</h1>
        <Link to="/" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("article.backHome")}</Link>
      </div>
    );
  }

  const related = articles.filter((a) => a.category === article.category && a.id !== article.id && a.status === "published").slice(0, 3);
  const articleComments = comments.filter((c) => c.articleId === article.id && c.status === "approved");
  const ytEmbed = article.videoUrl?.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
  const cats = Object.keys(CATEGORY_LABELS) as Category[];

  const rate = (value: number) => {
    setData((d) => ({
      ...d,
      articles: d.articles.map((a) => {
        if (a.id !== article.id) return a;
        const count = (a.ratingCount || 0) + 1;
        const avg = ((a.rating || 0) * (a.ratingCount || 0) + value) / count;
        return { ...a, rating: avg, ratingCount: count };
      }),
    }));
    notify("شكراً لتقييمك!", "success");
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setData((d) => ({
      ...d,
      comments: [...d.comments, { id: "c" + Date.now(), articleId: article.id, name, text, date: new Date().toISOString().slice(0, 10), status: "pending" }],
    }));
    logActivity("تعليق جديد", article.title, name);
    pushNotification("comment", `تعليق جديد من ${name} على: ${article.title}`);
    setName(""); setText("");
    notify("تم إرسال تعليقك وسيظهر بعد الموافقة.", "info");
  };

  const doBookmark = () => {
    toggleFav(article.id);
    const nowFav = !isFav(article.id);
    logArticleEvent("bookmark", { contentId: article.id, slug: article.slug, label: nowFav ? "add" : "remove" });
    notify(nowFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة", "success");
  };

  const downloadAttachment = (fileName: string) => {
    trackDownload();
    logArticleEvent("download", { contentId: article.id, slug: article.slug, label: fileName });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ReadingProgress />
      <Breadcrumbs items={[{ label: CATEGORY_LABELS[article.category], path: `/category/${article.category}` }, { label: dispTitle.text }]} />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-600 dark:bg-sky-500/10">{CATEGORY_LABELS[article.category]}</span>
            <button
              onClick={doBookmark}
              aria-pressed={isFav(article.id)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition print:hidden ${isFav(article.id) ? "border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "border-slate-200 text-slate-500 hover:border-rose-300 dark:border-slate-700"}`}
            >
              {isFav(article.id) ? "❤️" : "🤍"} {isFav(article.id) ? t("article.bookmarked") : t("article.bookmark")}
            </button>
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-white md:text-4xl">{dispTitle.text}</h1>
            {hasEnglish && (
              <button
                onClick={() => setDocLang((d) => (d === "ar" ? "en" : "ar"))}
                title={docLang === "ar" ? "Read this article in English" : "اقرأ هذا المقال بالعربي"}
                className="mt-1 flex shrink-0 items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-500/10 dark:text-sky-400 print:hidden"
              >
                {docLang === "ar" ? "🇬🇧 EN" : "🇪🇬 AR"}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>✍️ {article.author}</span>
            <span className="inline-flex items-center gap-1"><Icon name="calendar" size={14} /> {lang === "ar" ? "نُشر" : "Published"}: {article.publishDate}</span>
            {article.updatedDate && <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} /> {t("article.lastUpdated")}: {article.updatedDate}</span>}
            <span className="inline-flex items-center gap-1"><Icon name="eye" size={14} /> {article.views.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} {t("article.views")}</span>
            <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} /> {mins} {t("article.readingTime")}</span>
            {article.ratingCount ? <span>⭐ {article.rating?.toFixed(1)}</span> : null}
          </div>

          {/* Medical trust badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Icon name="verified" size={16} />
            {docLang === "ar"
              ? `روجع طبياً بواسطة فريق ${settings.siteName} · آخر تحديث ${article.updatedDate || article.publishDate}`
              : `Medically reviewed by ${settings.siteName} team · Updated ${article.updatedDate || article.publishDate}`}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl">
            <OptimizedImage src={article.cover} alt={dispTitle.text} width={1000} ratio="16/9" />
          </div>

          <div className="my-6 print:hidden"><AdSlot label="إعلان داخل المقال" /></div>

          {ytEmbed && (
            <div className="my-6 aspect-video w-full overflow-hidden rounded-2xl print:hidden">
              <iframe src={ytEmbed} title="video" className="h-full w-full" allowFullScreen loading="lazy" />
            </div>
          )}

          {/* Mobile: table of contents inline before the body */}
          {activeToc.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
              <TableOfContents items={activeToc} />
            </div>
          )}

          {dispContent.missing && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-600 dark:bg-amber-500/10">
              {docLang === "en" ? t("common.comingSoon") : t("common.comingSoonAr")}
            </div>
          )}
          <ArticleContent html={displayContentWithIds} slug={article.slug} lang={docLang} className="prose-content reading-measure max-w-none text-slate-700 dark:text-slate-300" />

          {/* Medical disclaimer for trust & safety */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-500/5 dark:text-amber-400">
            <span className="text-xl" aria-hidden="true">⚕️</span>
            <p>{docLang === "ar"
              ? "إخلاء مسؤولية طبي: هذا المحتوى لأغراض تعليمية فقط ولا يُغني عن استشارة الطبيب أو المختص. راجع دائماً البروتوكولات المعتمدة في مؤسستك."
              : "Medical disclaimer: This content is for educational purposes only and is not a substitute for professional medical advice. Always follow your institution's approved protocols."}</p>
          </div>

          {/* AI Assistant — answers from THIS article first */}
          <div className="mt-6">
            <ArticleAI articleHtml={dispContent.text} articleTitle={dispTitle.text} />
          </div>

          {article.attachments && article.attachments.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="mb-3 font-bold dark:text-white">📎 الملفات المرفقة</h3>
              {article.attachments.map((f) => (
                <a key={f.name} href={f.url} onClick={() => downloadAttachment(f.name)} className="flex items-center justify-between rounded-lg bg-white p-3 hover:bg-sky-50 dark:bg-slate-900">
                  <span className="font-semibold dark:text-white">📄 {f.name}</span>
                  <span className="rounded-full bg-sky-500 px-4 py-1 text-sm font-bold text-white">تحميل</span>
                </a>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tg) => <Link key={tg} to={`/search?q=${encodeURIComponent(tg)}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-sky-100 dark:bg-slate-800 dark:text-slate-300">#{tg}</Link>)}
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50 sm:grid-cols-2 print:hidden">
            <div>
              <h3 className="mb-2 font-bold dark:text-white">{t("article.rate")}</h3>
              <Stars value={article.rating || 0} count={article.ratingCount || 0} onRate={rate} />
            </div>
            <div>
              <h3 className="mb-2 font-bold dark:text-white">{t("article.share")}</h3>
              <ShareBar title={dispTitle.text} articleId={article.id} slug={article.slug} contentHtml={dispContent.text} />
            </div>
          </div>

          {/* Author card */}
          <div className="mt-8">
            <h3 className="mb-2 text-sm font-bold text-slate-400">{t("article.author")}</h3>
            <AuthorCard name={article.author} />
          </div>

          {/* Prev / Next navigation within category */}
          <ArticleNav prev={prevArticle} next={nextArticle} />

          <section className="mt-10 print:hidden">
            <h3 className="mb-4 text-xl font-bold dark:text-white">💬 {t("article.comments")} ({articleComments.length})</h3>
            <div className="space-y-3">
              {articleComments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-600">{c.name[0]}</div><div><div className="font-bold dark:text-white">{c.name}</div><div className="text-xs text-slate-400">{c.date}</div></div></div>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{c.text}</p>
                </div>
              ))}
              {articleComments.length === 0 && <p className="text-slate-400">كن أول من يعلق على هذا المقال.</p>}
            </div>
            <form onSubmit={submitComment} className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="comment-name" className="sr-only">اسمك</label>
              <input id="comment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
              <label htmlFor="comment-text" className="sr-only">تعليقك</label>
              <textarea id="comment-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب تعليقك..." rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
              <button className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">إرسال التعليق</button>
            </form>
          </section>
        </article>

        <aside className="space-y-6 print:hidden">
          {activeToc.length > 0 && (
            <div className="sticky top-20 hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:block">
              <TableOfContents items={activeToc} />
            </div>
          )}

          {/* Category quick navigation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold dark:text-white">{t("article.categories")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Link
                  key={c}
                  to={`/category/${c}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${c === article.category ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  <Icon name={CAT_ICON[c]} size={12} /> {CATEGORY_LABELS[c]}
                </Link>
              ))}
            </div>
          </div>

          <AdSlot label="إعلان جانبي (300x250)" height="h-64" />
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 p-5 text-white">
            <div className="text-2xl" aria-hidden="true">🎓</div>
            <h3 className="mt-2 font-bold">{settings.siteName} Premium</h3>
            <p className="mt-1 text-sm text-sky-50">وصول غير محدود لكل المحتوى الحصري.</p>
            <Link to="/store" className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-sky-600">اشترك الآن</Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12 print:hidden">
          <h2 className="mb-5 text-2xl font-bold dark:text-white">{t("article.related")}</h2>
          <div className="grid gap-6 md:grid-cols-3">{related.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}
    </div>
  );
}
