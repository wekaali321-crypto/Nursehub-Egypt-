import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_LABELS, type Category } from "../lib/types";
import Logo from "./Logo";
import { useI18n, type TKey } from "../lib/i18n";

const CAT_KEYS: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", careplans: "nav.careplans", books: "nav.books",
};

/* Real brand SVG marks (inline, currentColor) — same approach used in
   ShareBar.tsx, so the footer's social row shows actual recognizable
   platform logos and each one opens the matching platform. */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.85 9.85 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.78.83-3.03-.2-.31a8.19 8.19 0 0 1-1.27-4.36c0-4.53 3.7-8.22 8.24-8.22a8.19 8.19 0 0 1 8.22 8.22c0 4.53-3.7 8.25-8.22 8.25Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M21.94 4.6 18.6 20.36c-.25 1.13-.9 1.4-1.83.87l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16 9.4-8.5c.41-.36-.09-.56-.63-.2L6.1 12.8l-5.02-1.57c-1.1-.34-1.11-1.09.23-1.62L20.55 3.45c.91-.34 1.71.2 1.39 1.15Z" />
  </svg>
);

export default function Footer() {
  const { settings } = useStore();
  const { t, lang } = useI18n();
  const cats = Object.keys(CATEGORY_LABELS) as Category[];

  // Facebook comes from the Site Settings field (/admin/settings → Social) so
  // it can be filled in later without touching code. WhatsApp and Telegram
  // are fixed numbers/links given directly.
  const socialLinks = [
    { Icon: FacebookIcon, url: settings.facebook, label: "Facebook", color: "#1877F2" },
    { Icon: WhatsAppIcon, url: "https://wa.me/201095652098", label: "WhatsApp", color: "#25D366" },
    { Icon: TelegramIcon, url: "https://t.me/+ABthe21Ked04YjU0", label: "Telegram", color: "#26A5E4" },
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3">
            <Logo size={40} />
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {lang === "ar"
              ? `${settings.tagline}. منصة عربية متخصصة في تقديم محتوى تعليمي عالي الجودة لطلاب وممارسي التمريض.`
              : "A specialized platform delivering high-quality educational content for nursing students and practitioners."}
          </p>
          <div className="mt-4 flex gap-2">
            {socialLinks.map(({ Icon, url, label, color }) => (
              <a
                key={label}
                href={url || "#"}
                target={url ? "_blank" : undefined}
                rel="noopener noreferrer"
                title={label}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-transform hover:scale-110 hover:bg-sky-100 dark:bg-slate-800"
                style={{ color }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-bold dark:text-white">{t("footer.sections")}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            {cats.map((c) => (
              <li key={c}><Link to={c === "drugs" ? "/drugs" : `/category/${c}`} className="hover:text-sky-500">{t(CAT_KEYS[c])}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-bold dark:text-white">{t("footer.important")}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/about" className="hover:text-sky-500">{t("footer.about")}</Link></li>
            <li><Link to="/contact" className="hover:text-sky-500">{t("footer.contact")}</Link></li>
            <li><Link to="/faq" className="hover:text-sky-500">{t("footer.faq")}</Link></li>
            <li><Link to="/tools" className="hover:text-sky-500">{t("nav.tools")}</Link></li>
            <li><Link to="/quizzes" className="hover:text-sky-500">{t("nav.quizzes")}</Link></li>
            <li><Link to="/login" className="hover:text-sky-500">{t("nav.login")}</Link></li>
            <li><Link to="/store" className="hover:text-sky-500">{t("nav.store")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-bold dark:text-white">{t("footer.legal")}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/privacy" className="hover:text-sky-500">{t("footer.privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-sky-500">{t("footer.terms")}</Link></li>
            <li><Link to="/monetization" className="hover:text-sky-500">{lang === "ar" ? "الإعلان معنا" : "Advertise"}</Link></li>
            <li><Link to="/admin" className="hover:text-sky-500">{t("nav.admin")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div>© {new Date().getFullYear()} {settings.siteName}. {t("footer.rights")} {t("footer.madeWith")}</div>
        <div className="mt-1 text-xs font-semibold text-slate-400">Designed &amp; Developed by <span className="text-sky-500">RN. Ali Ashour</span></div>
      </div>
    </footer>
  );
}
