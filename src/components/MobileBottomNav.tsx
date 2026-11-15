import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Search, User, Zap } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useUserAuth } from "../lib/userAuth";
import { cn } from "../utils/cn";

/**
 * Phone-only bottom bar (hidden from md up): Home · Search · Learn · Shift · Account.
 * "Learn" opens the side menu on its "Learn" group (no separate hub page to maintain); Account goes to the
 * dashboard when signed in, otherwise to the login page. Needs no data of its own (no D1 reads).
 */
export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const { loggedIn } = useUserAuth();
  const ar = lang !== "en";
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold transition-colors";
  const on = "text-nh-teal-dark dark:text-teal-300";
  const off = "text-slate-500 dark:text-slate-400";
  const acct = loggedIn ? "/dashboard" : "/login";
  const learnActive = /^\/(category|fundamentals|diseases|cases|anatomy|terminology|courses|article)(\/|$)/.test(pathname);
  return (
    <nav
      aria-label={ar ? "التنقل السريع" : "Quick navigation"}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-nh-line bg-white/95 backdrop-blur md:hidden print:hidden dark:border-slate-800 dark:bg-slate-900/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch">
        <Link to="/" className={cn(item, pathname === "/" ? on : off)} aria-current={pathname === "/" ? "page" : undefined}>
          <Home size={22} aria-hidden="true" />{ar ? "الرئيسية" : "Home"}
        </Link>
        <Link to="/search?focus=1" className={cn(item, pathname === "/search" ? on : off)} aria-current={pathname === "/search" ? "page" : undefined}>
          <Search size={22} aria-hidden="true" />{ar ? "بحث" : "Search"}
        </Link>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("nh:open-nav", { detail: "learn" }))} className={cn(item, learnActive ? on : off)} aria-haspopup="dialog">
          <BookOpen size={22} aria-hidden="true" />{ar ? "التعلم" : "Learn"}
        </button>
        <Link to="/shift" className={cn(item, pathname === "/shift" ? on : off)} aria-current={pathname === "/shift" ? "page" : undefined}>
          <Zap size={22} aria-hidden="true" />{ar ? "الشيفت" : "Shift"}
        </Link>
        <Link to={acct} className={cn(item, pathname === acct ? on : off)} aria-current={pathname === acct ? "page" : undefined}>
          <User size={22} aria-hidden="true" />{ar ? "حسابي" : "Account"}
        </Link>
      </div>
    </nav>
  );
}
