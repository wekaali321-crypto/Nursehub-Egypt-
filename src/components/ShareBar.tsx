import { useToast } from "./Toast";
import { printBrandedDocument } from "../lib/brand";
import { logArticleEvent } from "../lib/analytics";
import { useI18n } from "../lib/i18n";

/** Share, copy-link, print, and PDF-export actions — each tracked for real analytics. */
export default function ShareBar({
  title, articleId, slug, contentHtml,
}: {
  title: string; articleId: string; slug: string; contentHtml: string;
}) {
  const { notify } = useToast();
  const { lang } = useI18n();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareUrl = encodeURIComponent(url);

  const links = [
    { i: "📘", l: "Facebook", key: "facebook", u: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { i: "🐦", l: "Twitter", key: "twitter", u: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(title)}` },
    { i: "💬", l: "WhatsApp", key: "whatsapp", u: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}` },
    { i: "💼", l: "LinkedIn", key: "linkedin", u: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
  ];

  const share = async (key: string, u?: string) => {
    logArticleEvent("share", { contentId: articleId, slug, label: key });
    if (key === "native" && typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title, url }); } catch { /* user cancelled */ }
      return;
    }
    if (u) window.open(u, "_blank", "noopener,noreferrer");
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    logArticleEvent("share", { contentId: articleId, slug, label: "copy_link" });
    notify(lang === "ar" ? "تم نسخ الرابط" : "Link copied", "success");
  };

  const doPrint = () => {
    logArticleEvent("print", { contentId: articleId, slug });
    window.print();
  };

  const exportPdf = () => {
    logArticleEvent("pdf_export", { contentId: articleId, slug });
    printBrandedDocument(title, `<h2>${title}</h2>${contentHtml}`);
  };

  const canNativeShare = typeof navigator !== "undefined" && !!(navigator as any).share;
  const btnCls = "flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow transition-transform hover:scale-110 dark:bg-slate-700";

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {canNativeShare && (
        <button onClick={() => share("native")} title={lang === "ar" ? "مشاركة" : "Share"} className={btnCls}>📤</button>
      )}
      {links.map((s) => (
        <button key={s.key} onClick={() => share(s.key, s.u)} title={s.l} className={btnCls}>{s.i}</button>
      ))}
      <button onClick={copyLink} title={lang === "ar" ? "نسخ الرابط" : "Copy link"} className={btnCls}>🔗</button>
      <button onClick={doPrint} title={lang === "ar" ? "طباعة" : "Print"} className={btnCls}>🖨️</button>
      <button onClick={exportPdf} title={lang === "ar" ? "تصدير PDF" : "Export PDF"} className={btnCls}>📄</button>
    </div>
  );
}
