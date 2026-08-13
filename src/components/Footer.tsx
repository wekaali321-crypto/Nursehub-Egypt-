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
   platform logos instead of generic emoji, and each one opens the
   matching platform (Facebook, Instagram, YouTube, X) instead of doing
   nothing. */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.42a2.78 2.78 0 0 0-1.95 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 2C5.12 20 12 20 12 20s6.88 0 8.59-.42a2.78 2.78 0 0 0 1.95-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
  </svg>
);

export default function Footer() {
  const { settings } = useStore();
  const { t, lang } = useI18n();
  const cats = Object.keys(CATEGORY_LABELS) as Category[];

  // Sourced from the same Site Settings fields configured at /admin/settings
  // (Social block). If a field is left empty there, the icon still shows
  // for brand recognition but links to "#" until it's filled in.
  const socialLinks = [
    { Icon: FacebookIcon, url: settings.facebook, label: "Facebook", color: "#1877F2" },
    { Icon: InstagramIcon, url: settings.instagram, label: "Instagram", color: "#E4405F" },
    { Icon: YouTubeIcon, url: settings.youtube, label: "YouTube", color: "#FF0000" },
    { Icon: XIcon, url: settings.twitter, label: "X (Twitter)", color: "#000000" },
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
