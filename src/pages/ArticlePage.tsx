import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore, readingTime } from "../lib/store";
import { CATEGORY_LABELS, type Category } from "../lib/types";
import { ArticleCard, CAT_ICON, CAT_KEY } from "../components/common";
import { useSEO, breadcrumbSchema, extractFaqSchema, extractHowToSchema } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import { useToast } from "../components/Toast";
import { useFavorites } from "../lib/favorites";
import { useUserAuth } from "../lib/userAuth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import ReadingProgress from "../components/ReadingProgress";
import Icon from "../components/Icon";
import OptimizedImage from "../components/OptimizedImage";
import TableOfContents, { type TocItem } from "../components/TableOfContents";
import AuthorCard, { AuthorChip } from "../components/AuthorCard";
import ArticleNav from "../components/ArticleNav";
import ArticleAI from "../components/ArticleAI";
import ArticleContent from "../components/ArticleContent";
import ShareBar from "../components/ShareBar";
import { startArticleView, endArticleView, trackScrollDepth, tickActiveReadingTime, logArticleEvent } from "../lib/analytics";
import "./ArticlePage.css";

function buildToc(html: string): TocItem[] {
  const matches = [...html.matchAll(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/g)];
  return matches.map((m, i) => ({ id: `h-${i}`, level: Number(m[1]), text: m[2].replace(/<[^>]+>/g, "").trim() })).filter((t) => t.text);
}
function injectIds(html: string) {
  let i = 0;
  return html.replace(/<h([2-6])([^>]*)>/g, (_m, lvl, attrs) => `<h${lvl}${attrs} id="h-${i++}">`);
}

function fmtDate(iso: string | undefined, lang: "ar" | "en") {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

// URLs are matched first so they stay one unbroken left-to-right unit.
const LATIN_RE = /(?:https?:\/\/|www\.)[^\s)،<>"]+|[A-Za-z][A-Za-z0-9]*(?:[ \-\/.'][A-Za-z0-9]+)*/g;
const SKIP_TAGS = new Set(["CODE", "PRE", "A", "BDI", "SCRIPT", "STYLE", "H1", "H2", "H3", "H4", "H5", "H6", "TEXTAREA", "INPUT"]);

/** Display-only enhancements on already-rendered HTML (stored content is never modified). */
function enhanceContent(root: HTMLElement, arabic: boolean) {
  // 1) existing "References" section → grouped into a .nh-refs card
  root.querySelectorAll<HTMLElement>(":scope > h2, :scope > h3").forEach((h) => {
    if (h.parentElement?.classList.contains("nh-refs")) return;
    const label = (h.textContent || "").replace(/^[^\p{L}]+/u, "").trim();
    if (!/^(المراجع|المصادر|References|Sources|Bibliography)(?!\S)/i.test(label) && !/^(المراجع|المصادر)\s*[(:：]/.test(label)) return;
    const wrap = document.createElement("section");
    wrap.className = "nh-refs";
    h.before(wrap);
    wrap.appendChild(h);
    let n = wrap.nextElementSibling;
    while (n && !/^H[1-3]$/.test(n.tagName) && !n.classList.contains("nh-refs")) {
      const next = n.nextElementSibling;
      wrap.appendChild(n);
      n = next;
    }
    wrap.querySelectorAll<HTMLAnchorElement>("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
  });
  // 2) Latin medical terms inside Arabic text → <bdi class="nh-en-term">
  if (!arabic) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue || "";
      if (!/[\u0600-\u06FF]/.test(text) || !/[A-Za-z]{2}/.test(text)) return NodeFilter.FILTER_REJECT;
      for (let e = node.parentElement; e && e !== root; e = e.parentElement) if (SKIP_TAGS.has(e.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((tn) => {
    const text = tn.nodeValue || "";
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(LATIN_RE)) {
      if (m[0].length < 2) continue;
      const i = m.index ?? 0;
      if (i > last) frag.append(text.slice(last, i));
      const b = document.createElement("bdi");
      b.className = "nh-en-term";
      b.textContent = m[0];
      frag.append(b);
      last = i + m[0].length;
    }
    if (last === 0) return;
    if (last < text.length) frag.append(text.slice(last));
    tn.replaceWith(frag);
  });
}

function BackToArticleTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 700);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 end-4 z-40 flex items-center gap-2 rounded-full bg-[#153448] px-4 py-3 text-sm font-bold text-white shadow-xl ring-2 ring-[#168C91] transition hover:bg-[#168C91] focus:outline-none focus-visible:ring-4 print:hidden"
    >
      <span aria-hidden="true">↑</span> {label}
    </button>
  );
}

function CoverPlaceholder({ category, icon, title }: { category: string; icon: Parameters<typeof Icon>[0]["name"]; title: string }) {
  return (
    <div className="cover-ph aspect-[16/9] md:aspect-[21/9]" role="img" aria-label={title}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 md:h-20 md:w-20"><Icon name={icon} size={36} /></span>
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/20">{category}</span>
      <span className="text-sm font-black tracking-wide opacity-90">NurseHub Egypt</span>
    </div>
  );
}

function Stars({ value, count, onRate }: { value: number; count: number; onRate: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="التقييم من 5 نجوم">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value >= n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onRate(n)} className="text-2xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168C91] rounded" aria-label={`${n} نجوم`}>
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
  const { user, loggedIn } = useUserAuth();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const scrollTimer = useRef<number | undefined>(undefined);
  const tickTimer = useRef<number | undefined>(undefined);

  const [docLang, setDocLang] = useState<"ar" | "en">(lang === "en" ? "en" : "ar");
  const hasEnglish = !!(article?.titleEn && article?.contentEn);

  // --- Real Supabase bookmark state (used only when logged in) ---
  const [dbBookmarked, setDbBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

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
  }, [slug]);

  // Load bookmark status + log reading_history when a logged-in user opens an article
  useEffect(() => {
    if (!article || !loggedIn || !user || !isSupabaseConfigured() || !supabase) {
      setDbBookmarked(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("article_id", article.id)
        .maybeSingle();
      if (!cancelled) setDbBookmarked(!!data);
    })();

    // Log reading history (fire and forget)
    supabase
      .from("reading_history")
      .insert({ user_id: user.id, article_id: article.id })
      .then(({ error }) => {
        if (error) console.error("[reading_history] insert failed:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [article?.id, loggedIn, user?.id]);

  const toc = useMemo(() => (article ? buildToc(article.content) : []), [article]);
  const contentWithIds = useMemo(() => (article ? injectIds(article.content) : ""), [article]);
  const mins = useMemo(() => (article ? readingTime(article.content) : 0), [article]);

  const dispTitle = article ? bilingual(article.title, article.titleEn, docLang) : { text: "", missing: false };
  const dispContent = article ? bilingual(article.content, article.contentEn, docLang) : { text: "", missing: false };
  const displayContentWithIds = article && docLang === "en" && article.contentEn ? injectIds(article.contentEn) : contentWithIds;
  const activeToc = article && docLang === "en" && article.contentEn ? buildToc(article.contentEn) : toc;

  const faqSchema = article ? extractFaqSchema(displayContentWithIds) : null;
  const howToSchema = article ? extractHowToSchema(displayContentWithIds, dispTitle.text) : null;

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
            { name: t(CAT_KEY[article.category]), url: `${window.location.origin}/category/${article.category}` },
            { name: article.title, url: window.location.href },
          ]),
          ...(faqSchema ? [faqSchema] : []),
          ...(howToSchema ? [howToSchema] : []),
        ]
      : undefined,
  });

  const proseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = proseRef.current;
    if (!root) return;
    // ArticleContent is lazy-loaded and React may re-apply innerHTML, so (re)enhance any block whose DOM was replaced.
    const done = new WeakMap<Element, ChildNode | null>();
    const run = () => {
      root.querySelectorAll<HTMLElement>(".ac-html").forEach((el) => {
        if (el.childNodes.length === 0) return;
        if (done.has(el) && done.get(el) === el.firstChild) return;
        enhanceContent(el, docLang === "ar");
        done.set(el, el.firstChild);
      });
    };
    run();
    const mo = new MutationObserver(() => { mo.disconnect(); run(); mo.observe(root, { childList: true, subtree: true }); });
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [displayContentWithIds, docLang, article?.id]);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">{t("article.notFound")}</h1>
        <Link to="/" className="mt-4 inline-block rounded-full bg-[#168C91] px-6 py-2 font-bold text-white">{t("article.backHome")}</Link>
      </div>
    );
  }

  const published = articles.filter((a) => a.id !== article.id && a.status === "published");
  const tagSet = new Set(article.tags);
  const related = [
    ...published.filter((a) => a.category === article.category),
    ...published.filter((a) => a.category !== article.category && a.tags.some((tg) => tagSet.has(tg))),
  ].slice(0, 3);
  const articleComments = comments.filter((c) => c.articleId === article.id && c.status === "approved");
  const ytEmbed = article.videoUrl?.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
  // only sections that really contain published articles (an empty section is a hollow page)
  const cats = (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) => c === article.category || c === "drugs" || articles.some((a) => a.category === c && a.status === "published"));

  // Bookmark state: real DB when logged in, local favorites when a guest
  const bookmarked = loggedIn ? dbBookmarked : isFav(article.id);

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

  const doBookmark = async () => {
    // Logged-in users: persist to Supabase
    if (loggedIn && user) {
      if (!isSupabaseConfigured() || !supabase) return;
      if (bookmarkBusy) return;
      setBookmarkBusy(true);
      if (dbBookmarked) {
        const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("article_id", article.id);
        if (!error) { setDbBookmarked(false); notify("أُزيل من المفضلة", "success"); }
        else notify("تعذّر الإزالة، حاول مرة أخرى", "info");
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, article_id: article.id });
        if (!error) { setDbBookmarked(true); notify("أُضيف إلى المفضلة", "success"); }
        else notify("تعذّر الإضافة، حاول مرة أخرى", "info");
      }
      setBookmarkBusy(false);
      logArticleEvent("bookmark", { contentId: article.id, slug: article.slug, label: dbBookmarked ? "remove" : "add" });
      return;
    }

    // Guests: keep the existing local-only behavior
    toggleFav(article.id);
    const nowFav = !isFav(article.id);
    logArticleEvent("bookmark", { contentId: article.id, slug: article.slug, label: nowFav ? "add" : "remove" });
    notify(nowFav ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة", "success");
  };

  const downloadAttachment = (fileName: string) => {
    trackDownload();
    logArticleEvent("download", { contentId: article.id, slug: article.slug, label: fileName });
  };

  const ar = docLang === "ar";
  const dateLang = lang === "ar" ? "ar" : "en";
  const catLabel = t(CAT_KEY[article.category]);
  const fmtNum = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  return (
    <div className="article-page pb-12">
      <ReadingProgress />
      <BackToArticleTop label={lang === "ar" ? "أعلى المقال" : "Back to top"} />

      <header className="relative overflow-hidden bg-[#153448] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
        <div aria-hidden className="pointer-events-none absolute -top-20 end-[-5rem] h-72 w-72 rounded-full bg-[#168C91]/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-5 md:pb-24 md:pt-8">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-300 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link to="/" className="hover:text-teal-200">{t("nav.home")}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to={`/category/${article.category}`} className="hover:text-teal-200">{catLabel}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-[60vw] truncate font-semibold text-white sm:max-w-md">{dispTitle.text}</li>
            </ol>
          </nav>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Link to={`/category/${article.category}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#168C91]/60 bg-[#168C91]/20 px-3 py-1 text-xs font-bold text-teal-100 sm:text-sm">
              <Icon name={CAT_ICON[article.category]} size={14} /> {catLabel}
            </Link>
            <div className="flex items-center gap-2 print:hidden">
              {hasEnglish && (
                <button
                  onClick={() => setDocLang((d) => (d === "ar" ? "en" : "ar"))}
                  title={docLang === "ar" ? "Read this article in English" : "اقرأ هذا المقال بالعربي"}
                  className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  {docLang === "ar" ? "🇬🇧 EN" : "🇪🇬 AR"}
                </button>
              )}
              <button
                onClick={doBookmark}
                disabled={bookmarkBusy}
                aria-pressed={bookmarked}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 sm:text-sm ${bookmarked ? "border-rose-300 bg-rose-500/25 text-rose-100" : "border-white/30 bg-white/10 text-white hover:bg-white/20"}`}
              >
                {bookmarked ? "❤️" : "🤍"} {bookmarked ? t("article.bookmarked") : t("article.bookmark")}
              </button>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.3] md:text-5xl">{dispTitle.text}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <AuthorChip name={article.author} fallback={lang === "ar" ? `فريق ${settings.siteName}` : `${settings.siteName} Team`} />
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/30 bg-teal-200/10 px-3 py-1 text-xs font-bold text-teal-100">
              <Icon name="verified" size={15} />
              {ar ? `روجع طبياً بواسطة فريق ${settings.siteName}` : `Medically reviewed by ${settings.siteName} team`}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-200 sm:text-sm">
            <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} /> {fmtNum(mins)} {t("article.readingTime")}</span>
            <span className="inline-flex items-center gap-1"><Icon name="calendar" size={14} /> {lang === "ar" ? "نُشر" : "Published"}: {fmtDate(article.publishDate, dateLang)}</span>
            {article.updatedDate && <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} /> {t("article.lastUpdated")}: {fmtDate(article.updatedDate, dateLang)}</span>}
            <span className="inline-flex items-center gap-1"><Icon name="eye" size={14} /> {fmtNum(article.views)} {t("article.views")}</span>
            {article.ratingCount ? <span>⭐ {article.rating?.toFixed(1)}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        <div className="relative -mt-10 overflow-hidden rounded-2xl shadow-xl shadow-[#153448]/25 ring-1 ring-black/5 md:-mt-16">
          {article.cover
            ? <OptimizedImage src={article.cover} alt={dispTitle.text} width={1000} ratio="16/9" />
            : <CoverPlaceholder category={catLabel} icon={CAT_ICON[article.category]} title={dispTitle.text} />}
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        <article className="min-w-0">
          {ytEmbed && (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl print:hidden">
              <iframe src={ytEmbed} title="video" className="h-full w-full" allowFullScreen loading="lazy" />
            </div>
          )}

          {activeToc.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden print:hidden">
              <TableOfContents items={activeToc} collapsible />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6 md:p-8">
          {dispContent.missing && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-600 dark:bg-amber-500/10">
              {docLang === "en" ? t("common.comingSoon") : t("common.comingSoonAr")}
            </div>
          )}
          <div ref={proseRef}>
            <ArticleContent html={displayContentWithIds} slug={article.slug} lang={docLang} className="prose-content article-prose reading-measure max-w-none" />
          </div>
          </div>

          {/* ============================================================
              🟢 رابط المتجر الرقمي (بدلاً من المعاينة والتحميل المباشر)
              ============================================================ */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#168C91]/30 bg-white p-4 dark:border-[#168C91]/40 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#168C91]/10 text-2xl" aria-hidden="true">📄</span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#153448] dark:text-white">
                  {docLang === "ar" ? "📥 حمل نسخة PDF احترافية" : "📥 Download Professional PDF"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {docLang === "ar"
                    ? "نسخة PDF احترافية مصممة خصيصاً لهذا المقال — بسعر 50 ج.م"
                    : "Professional PDF version specially designed for this article — 50 EGP"}
                </p>
              </div>
            </div>
            <Link to="/store" className="shrink-0 rounded-full bg-[#168C91] px-5 py-2 text-center text-sm font-bold text-white transition hover:bg-[#127a7f]">
              🛒 {docLang === "ar" ? "اشتري الآن من المتجر الرقمي" : "Buy Now from Digital Store"}
            </Link>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-500/5 dark:text-amber-400">
            <span className="text-xl" aria-hidden="true">⚕️</span>
            <p>{docLang === "ar"
              ? "إخلاء مسؤولية طبي: هذا المحتوى لأغراض تعليمية فقط ولا يُغني عن استشارة الطبيب أو المختص. راجع دائماً البروتوكولات المعتمدة في مؤسستك."
              : "Medical disclaimer: This content is for educational purposes only and is not a substitute for professional medical advice. Always follow your institution's approved protocols."}</p>
          </div>

          <div className="mt-6">
            <ArticleAI articleHtml={dispContent.text} articleTitle={dispTitle.text} />
          </div>

          {article.attachments && article.attachments.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="mb-3 font-bold dark:text-white">📎 الملفات المرفقة</h3>
              {article.attachments.map((f) => (
                <a key={f.name} href={f.url} onClick={() => downloadAttachment(f.name)} className="flex items-center justify-between rounded-lg bg-white p-3 hover:bg-teal-50 dark:bg-slate-900">
                  <span className="font-semibold dark:text-white">📄 {f.name}</span>
                  <span className="rounded-full bg-[#168C91] px-4 py-1 text-sm font-bold text-white">تحميل</span>
                </a>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tg) => <Link key={tg} to={`/search?q=${encodeURIComponent(tg)}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-teal-100 dark:bg-slate-800 dark:text-slate-300">#{tg}</Link>)}
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

          <div className="mt-8">
            <h3 className="mb-2 text-sm font-bold text-slate-400">{t("article.author")}</h3>
            <AuthorCard name={article.author} />
          </div>

          <ArticleNav prev={prevArticle} next={nextArticle} />

          <section className="mt-10 print:hidden">
            <h3 className="mb-4 text-xl font-bold dark:text-white">💬 {t("article.comments")} ({articleComments.length})</h3>
            <div className="space-y-3">
              {articleComments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-[#168C91]">{c.name[0]}</div><div><div className="font-bold dark:text-white">{c.name}</div><div className="text-xs text-slate-400">{c.date}</div></div></div>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{c.text}</p>
                </div>
              ))}
              {articleComments.length === 0 && <p className="text-slate-400">{t("article.beFirstComment")}</p>}
            </div>
            <form onSubmit={submitComment} className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <label htmlFor="comment-name" className="sr-only">{t("article.yourName")}</label>
              <input id="comment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("article.yourName")} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
              <label htmlFor="comment-text" className="sr-only">{t("article.yourComment")}</label>
              <textarea id="comment-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("article.writeComment")} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
              <button className="rounded-full bg-[#168C91] px-6 py-2 font-bold text-white">{t("article.submitComment")}</button>
            </form>
          </section>
        </article>

        <aside className="space-y-6 print:hidden">
          {activeToc.length > 0 && (
            <div className="sticky top-20 hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:block">
              <TableOfContents items={activeToc} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 font-bold dark:text-white">{t("article.categories")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Link
                  key={c}
                  to={`/category/${c}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${c === article.category ? "bg-[#168C91] text-white" : "bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-[#168C91] dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  <Icon name={CAT_ICON[c]} size={12} /> {t(CAT_KEY[c])}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#153448] p-4 text-white">
            <div className="min-w-0">
              <h3 className="text-sm font-bold"><span aria-hidden="true">🎓</span> {settings.siteName} Premium</h3>
              <p className="mt-0.5 text-xs text-slate-300">وصول غير محدود لكل المحتوى الحصري.</p>
            </div>
            <Link to="/store" className="shrink-0 rounded-full bg-[#168C91] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1aa0a6]">اشترك الآن</Link>
          </div>
        </aside>
        </div>

      {related.length > 0 && (
        <section className="mt-12 print:hidden">
          <h2 className="mb-5 border-s-4 border-[#168C91] ps-3 text-2xl font-black text-[#153448] dark:text-white">{t("article.related")}</h2>
          <div className="grid gap-6 md:grid-cols-3">{related.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}
      </div>
    </div>
  );
}
