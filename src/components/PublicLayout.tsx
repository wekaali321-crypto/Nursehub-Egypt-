import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import InstallPrompt from "./InstallPrompt";
import { useI18n } from "../lib/i18n";

/** Open every new page from the top (SPA navigation otherwise keeps the previous scroll position). Back/forward and #anchors are left alone. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (hash || navType === "POP") return;
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}

function BackToTop() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("a11y.backToTop")}
      className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-xl text-white shadow-lg hover:scale-110 transition-transform print:hidden"
    >
      ↑
    </button>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">{t("a11y.skipToContent")}</a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
      <BackToTop />
      <div className="print:hidden"><InstallPrompt /></div>
    </div>
  );
}
