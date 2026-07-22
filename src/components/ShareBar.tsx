import { useToast } from "./Toast";
import { printBrandedDocument } from "../lib/brand";
import { logArticleEvent } from "../lib/analytics";
import { useI18n } from "../lib/i18n";

/* Real brand SVG marks (inline, no external icon library) — each sized to
   fill its 20x20 viewBox and colored via currentColor so it inherits the
   per-button brand color set below. Keeping these local avoids adding a
   new dependency (e.g. lucide-react) just for four static logos. */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.85 9.85 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.78.83-3.03-.2-.31a8.19 8.19 0 0 1-1.27-4.36c0-4.53 3.7-8.22 8.24-8.22a8.19 8.19 0 0 1 8.22 8.22c0 4.53-3.7 8.25-8.22 8.25Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

const NativeShareIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
  </svg>
);

const CopyLinkIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.5 13.5a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 1 0-5.66-5.66l-1.5 1.5" />
    <path d="M13.5 10.5a4 4 0 0 0-5.66 0L5.01 13.33a4 4 0 1 0 5.66 5.66l1.5-1.5" />
  </svg>
);

const PrintIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" />
    <path d="M6 17H4a1 1 0 0 1-1-1v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a1 1 0 0 1-1 1h-2" />
  </svg>
);

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M9 17h1.5a1.5 1.5 0 0 0 0-3H9v5M13 14v5h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-1ZM18 14h-1.5v5M16.5 16.5H18" />
  </svg>
);

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
    {
      Icon: FacebookIcon, l: "Facebook", key: "facebook",
      u: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "#1877F2",
    },
    {
      Icon: XIcon, l: "X (Twitter)", key: "twitter",
      u: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(title)}`,
      color: "#000000",
    },
    {
      Icon: WhatsAppIcon, l: "WhatsApp", key: "whatsapp",
      u: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      color: "#25D366",
    },
    {
      Icon: LinkedInIcon, l: "LinkedIn", key: "linkedin",
      u: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: "#0A66C2",
    },
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
  const btnCls = "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow transition-transform hover:scale-110 dark:bg-slate-700 dark:text-slate-200";

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {canNativeShare && (
        <button onClick={() => share("native")} title={lang === "ar" ? "مشاركة" : "Share"} className={btnCls}>
          <NativeShareIcon />
        </button>
      )}
      {links.map(({ Icon, l, key, u, color }) => (
        <button
          key={key}
          onClick={() => share(key, u)}
          title={l}
          className={btnCls}
          style={{ color }}
        >
          <Icon />
        </button>
      ))}
      <button onClick={copyLink} title={lang === "ar" ? "نسخ الرابط" : "Copy link"} className={btnCls}>
        <CopyLinkIcon />
      </button>
      <button onClick={doPrint} title={lang === "ar" ? "طباعة" : "Print"} className={btnCls}>
        <PrintIcon />
      </button>
      <button onClick={exportPdf} title={lang === "ar" ? "تصدير PDF" : "Export PDF"} className={btnCls}>
        <PdfIcon />
      </button>
    </div>
  );
}
