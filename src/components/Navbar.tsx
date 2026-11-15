import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, ChevronDown, Globe, Heart, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme, useAuth } from "../lib/theme";
import { useStore } from "../lib/store";
import { useUserAuth } from "../lib/userAuth";
import { cn } from "../utils/cn";
import SmartSearch from "./SmartSearch";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { useI18n, type TKey } from "../lib/i18n";
import { useFavorites } from "../lib/favorites";
import { useFeatures } from "../admin/cms/useFeatures";
import { useSectionAvailability } from "../lib/sections";
import { NAV_GROUPS, GROUPED_PATHS, groupOf, type NavLink } from "../lib/navGroups";
import { enablePushNotifications, hasActivePushSubscription, isPushSupported } from "../lib/push";

// Map known menu paths to i18n keys so nav is fully translatable.
const PATH_LABELS: Record<string, TKey> = {
  "/": "nav.home",
  "/category/articles": "nav.articles",
  "/category/summaries": "nav.summaries",
  "/drugs": "nav.drugs",
  "/category/skills": "nav.skills",
  "/category/infection-control": "nav.infectionControl",
  "/category/careplans": "nav.careplans",
  "/category/books": "nav.books",
  "/quizzes": "nav.quizzes",
  "/tools": "nav.tools",
  "/shift": "nav.shift",
  "/cards": "nav.cards",
  "/ecg": "nav.ecg",
  "/icu-nursing": "nav.icuNursing",
  "/dialysis": "nav.dialysis",
  "/radiology": "nav.radiology",
  "/nicu": "nav.nicu",
  "/pharmacology": "nav.pharmacology",
  "/terminology": "nav.terminology",
  "/first-aid": "nav.firstAid",
  "/er-reception": "nav.erReception",
  "/pediatrics": "nav.pediatrics",
  "/anatomy": "nav.anatomy",
  "/fundamentals": "nav.fundamentals",
  "/operating-room": "nav.operatingRoom",
  "/obgyn": "nav.obgyn",
  "/tests/licensure": "nav.licensureExams",
  "/interview-questions": "nav.interviewQuestions",
  "/travel-questions": "nav.travelQuestions",
  "/courses": "nav.courses",
  "/cases": "nav.cases",
  "/diseases": "nav.diseases",
  "/store": "nav.store",
};

// Map menu paths to feature flags so disabled modules hide from the nav.
const PATH_FEATURE: Record<string, keyof import("../lib/types").FeatureToggles> = {
  "/drugs": "drugGuide",
  "/quizzes": "exams",
  "/store": "store",
  "/category/books": "store",
  "/category/careplans": "carePlans",
};

function UserMenu() {
  const { user, loggedIn, loading, logout } = useUserAuth();
  const { lang } = useI18n();
  const isRTL = lang === "ar";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />;
  }

  if (!loggedIn || !user) {
    return (
      <Link
        to="/login"
        className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:h-10 sm:px-4 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {isRTL ? "دخول" : "Login"}
      </Link>
    );
  }

  const meta = (user.user_metadata as any) || {};
  const displayName = meta.full_name || meta.name || user.email?.split("@")[0] || "User";
  const avatarUrl: string | undefined = meta.avatar_url || meta.picture;
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  const doLogout = async () => {
    await logout();
    setOpen(false);
    nav("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-700"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#127378] hover:bg-[#0f6165] font-bold text-white">{initial}</span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900",
            isRTL ? "left-0" : "right-0"
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="truncate font-bold text-slate-800 dark:text-white">{displayName}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <User size={16} className="inline-block -mt-0.5 me-1.5" aria-hidden="true" />{isRTL ? "حسابي" : "My Account"}
          </Link>
          <Link
            to="/favorites"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Heart size={16} className="inline-block -mt-0.5 me-1.5" aria-hidden="true" />{isRTL ? "المفضلة" : "Favorites"}
          </Link>
          <button
            onClick={doLogout}
            className="block w-full px-4 py-2.5 text-start text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut size={16} className="inline-block -mt-0.5 me-1.5" aria-hidden="true" />{isRTL ? "تسجيل الخروج" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { loggedIn: isAdmin } = useAuth(); // the dashboard link is only shown to a signed-in admin
  const { menu } = useStore();
  const { t, lang, setLang } = useI18n();
  const { favorites } = useFavorites();
  const { features } = useFeatures();
  const { pathAvailable } = useSectionAvailability();
  const favCount = favorites.length;
  const label = (m: { label: string; path: string }) => (PATH_LABELS[m.path] ? t(PATH_LABELS[m.path]) : m.label);
  const featureAllowed = (m: { path: string }) => {
    const flag = PATH_FEATURE[m.path];
    return flag ? features[flag] : true;
  };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const loc = useLocation();
  const nav = useNavigate();
  const ar = lang === "ar";
  // grouped navigation: a link shows when its module is on and (for /category/x) the section has content
  const linkVisible = (l: NavLink) => (l.feature ? features[l.feature] : true) && pathAvailable(l.to);
  const groups = NAV_GROUPS.map((g) => ({ ...g, links: g.links.filter(linkVisible) })).filter((g) => g.links.length > 0);
  // links the admin added to the menu that no group covers stay reachable under "More"
  const extra = menu.filter(featureAllowed).filter((m) => pathAvailable(m.path) && !GROUPED_PATHS.has(m.path));
  const [desk, setDesk] = useState<string | null>(null); // open desktop group
  const [acc, setAcc] = useState<string | null>(null); // expanded drawer group
  const deskRef = useRef<HTMLDivElement>(null);
  const activeGroup = groupOf(loc.pathname);
  useEffect(() => { setDesk(null); setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!desk) return;
    const onDown = (e: MouseEvent) => { if (deskRef.current && !deskRef.current.contains(e.target as Node)) setDesk(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDesk(null); };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [desk]);
  // other parts of the page (mobile bottom bar "Learn") can open the drawer on a given group
  useEffect(() => {
    const onOpen = (e: Event) => { setOpen(true); setAcc((e as CustomEvent<string>).detail || null); };
    window.addEventListener("nh:open-nav", onOpen);
    return () => window.removeEventListener("nh:open-nav", onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    hasActivePushSubscription().then(setPushOn);
  }, []);

  const handleSubscribe = async () => {
    setPushBusy(true);
    const res = await enablePushNotifications("visitor");
    setPushBusy(false);
    if (res.ok) setPushOn(true);
    else alert(res.reason ?? "تعذّر تفعيل الإشعارات");
  };

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      nav(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/85 print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        <Link to="/" className="shrink-0" aria-label="NurseHub Egypt">
          <Logo size={40} hideWordmarkOnTiny />
        </Link>

        <nav ref={deskRef} className="relative hidden items-center gap-0.5 xl:flex" aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>
          <Link to="/" className={cn("rounded-lg px-3 py-2 text-sm font-bold transition-colors", loc.pathname === "/" ? "bg-nh-teal-soft text-nh-teal-dark dark:bg-teal-500/10 dark:text-teal-300" : "text-nh-navy hover:bg-nh-surface dark:text-slate-200 dark:hover:bg-slate-800")}>
            {t("nav.home")}
          </Link>
          {[...groups, ...(extra.length ? [{ id: "more", ar: "المزيد", en: "More", links: extra.map((m) => ({ to: m.path, ar: label(m), en: label(m) })) }] : [])].map((g) => (
            <div key={g.id} className="relative">
              <button
                type="button"
                onClick={() => setDesk((d) => (d === g.id ? null : g.id))}
                aria-expanded={desk === g.id}
                aria-controls={`nav-${g.id}`}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold transition-colors",
                  activeGroup === g.id || desk === g.id ? "bg-nh-teal-soft text-nh-teal-dark dark:bg-teal-500/10 dark:text-teal-300" : "text-nh-navy hover:bg-nh-surface dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                {ar ? g.ar : g.en}
                <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform", desk === g.id && "rotate-180")} />
              </button>
              {desk === g.id && (
                <div id={`nav-${g.id}`} className={cn("absolute top-full z-50 mt-2 rounded-2xl border border-nh-line bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900", ar ? "right-0" : "left-0", g.links.length > 6 ? "grid w-[30rem] grid-cols-2 gap-0.5" : "w-64")}>
                  {g.links.map((l) => (
                    <Link key={l.to} to={l.to} className={cn("block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", loc.pathname === l.to ? "bg-nh-teal-soft text-nh-teal-dark dark:bg-teal-500/10 dark:text-teal-300" : "text-slate-700 hover:bg-nh-surface hover:text-nh-teal-dark dark:text-slate-200 dark:hover:bg-slate-800")}>
                      {ar ? l.ar : l.en}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {loc.pathname !== "/" && <div className="hidden w-52 md:block"><SmartSearch /></div>}

          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label="Language"
            title={t("lang.switch")}
            className="flex h-9 items-center justify-center gap-1 rounded-full border border-slate-200 px-2.5 text-sm font-bold hover:bg-slate-100 sm:h-10 sm:px-3 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white"
          >
            <Globe size={16} aria-hidden="true" /> {lang === "ar" ? "EN" : "ع"}
          </button>

          <Link
            to="/favorites"
            aria-label="Favorites"
            title="المفضلة"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 sm:flex dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Heart size={18} className="text-rose-500" aria-hidden="true" />
            {favCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{favCount}</span>}
          </Link>

          {isPushSupported() && !pushOn && (
            <button
              onClick={handleSubscribe}
              disabled={pushBusy}
              aria-label="تفعيل الإشعارات"
              title="فعّل الإشعارات — استقبل تنبيه بمقالات وكتب جديدة"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 disabled:opacity-50 sm:flex dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <BellOff size={18} aria-hidden="true" />
            </button>
          )}
          <NotificationBell />

          <button
            onClick={toggle}
            aria-label="Theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 sm:h-10 sm:w-10 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          <UserMenu />

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden whitespace-nowrap rounded-full bg-nh-teal-dark px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-nh-teal-darker sm:block"
            >
              {t("nav.admin")}
            </Link>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 sm:h-10 sm:w-10 xl:hidden dark:border-slate-700"
            aria-label={ar ? "القائمة" : "Menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div role="dialog" aria-label={ar ? "القائمة" : "Menu"} className="max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white px-4 py-3 pb-24 xl:hidden dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={doSearch} className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </form>
          <div className="mb-2 flex gap-2 sm:hidden">
            <Link to="/favorites" onClick={() => setOpen(false)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <Heart size={16} className="text-rose-500" aria-hidden="true" /> {lang === "ar" ? "المفضلة" : "Favorites"}{favCount > 0 ? ` (${favCount})` : ""}
            </Link>
            {isPushSupported() && !pushOn && (
              <button onClick={handleSubscribe} disabled={pushBusy} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                <BellOff size={16} aria-hidden="true" /> {lang === "ar" ? "فعّل الإشعارات" : "Enable alerts"}
              </button>
            )}
            {pushOn && (
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Bell size={16} aria-hidden="true" /> {lang === "ar" ? "الإشعارات مفعّلة" : "Alerts on"}
              </span>
            )}
          </div>
          <nav aria-label={ar ? "الأقسام" : "Sections"} className="space-y-1">
            <Link to="/" onClick={() => setOpen(false)} className={cn("block rounded-xl px-3 py-3 text-sm font-bold", loc.pathname === "/" ? "bg-nh-teal-soft text-nh-teal-dark dark:bg-teal-500/10 dark:text-teal-300" : "text-nh-navy dark:text-slate-200")}>{t("nav.home")}</Link>
            {[...groups, ...(extra.length ? [{ id: "more", ar: "المزيد", en: "More", links: extra.map((m) => ({ to: m.path, ar: label(m), en: label(m) })) }] : [])].map((g) => (
              <div key={g.id} className="rounded-xl border border-nh-line dark:border-slate-800">
                <button type="button" onClick={() => setAcc((a) => (a === g.id ? null : g.id))} aria-expanded={acc === g.id} aria-controls={`drawer-${g.id}`}
                  className={cn("flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold", activeGroup === g.id ? "text-nh-teal-dark dark:text-teal-300" : "text-nh-navy dark:text-slate-100")}>
                  {ar ? g.ar : g.en}
                  <ChevronDown size={18} aria-hidden="true" className={cn("transition-transform", acc === g.id && "rotate-180")} />
                </button>
                {acc === g.id && (
                  <div id={`drawer-${g.id}`} className="grid grid-cols-2 gap-1 px-2 pb-2">
                    {g.links.map((l) => (
                      <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold", loc.pathname === l.to ? "bg-nh-teal-soft text-nh-teal-dark dark:bg-teal-500/10 dark:text-teal-300" : "text-slate-700 hover:bg-nh-surface dark:text-slate-200 dark:hover:bg-slate-800")}>
                        {ar ? l.ar : l.en}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="mt-3 block rounded-lg bg-nh-teal-dark py-2 text-center text-sm font-bold text-white">
              {t("nav.admin")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
