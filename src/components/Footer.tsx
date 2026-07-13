import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_LABELS, type Category } from "../lib/types";
import Logo from "./Logo";
import { useI18n, type TKey } from "../lib/i18n";

const CAT_KEYS: Record<Category, TKey> = {
  articles: "nav.articles", summaries: "nav.summaries", drugs: "nav.drugs",
  skills: "nav.skills", careplans: "nav.careplans", books: "nav.books",
};

export default function Footer() {
  const { settings } = useStore();
  const { t, lang } = useI18n();
  const cats = Object.keys(CATEGORY_LABELS) as Category[];

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
            {["📘", "📸", "▶️", "🐦"].map((i, idx) => (
              <span key={idx} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 hover:bg-sky-100 dark:bg-slate-800">{i}</span>
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
