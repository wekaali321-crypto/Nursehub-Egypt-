import { useEffect, useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import InstallPrompt from "./InstallPrompt";

function BackToTop() {
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
      aria-label="العودة للأعلى"
      className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-xl text-white shadow-lg hover:scale-110 transition-transform print:hidden"
    >
      ↑
    </button>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">تخطّي إلى المحتوى</a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <div className="print:hidden"><InstallPrompt /></div>
    </div>
  );
}
