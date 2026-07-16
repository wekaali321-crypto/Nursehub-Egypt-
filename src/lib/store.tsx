import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Article,
  Comment,
  MediaItem,
  MediaFolder,
  Product,
  User,
  SiteSettings,
  Drug,
  Page,
  Taxonomy,
  Subscriber,
  Ad,
  Affiliate,
  Redirect,
  ActivityEntry,
  TrashEntry,
  ArticleVersion,
  AppNotification,
  Quiz,
  QuizAttempt,
  CustomType,
  CustomEntry,
  HomeCategory,
  PaymentGateway,
  Coupon,
  Order,
  CommerceSettings,
} from "./types";
import {
  seedArticles,
  seedComments,
  seedMedia,
  seedProducts,
  seedUsers,
} from "./seed";
import {
  seedDrugs,
  seedPages,
  seedCategories,
  seedTags,
  seedSubscribers,
  seedAds,
  seedAffiliates,
  seedRedirects,
  seedActivity,
} from "./seed2";
import { seedQuizzes, seedCustomTypes, seedHomeCategories, seedGateways, seedCoupons, defaultCommerce } from "./seed3";
import { isSupabaseEnabled } from "./supabase";
import { loadAllFromSupabase, syncEntity, syncSettings, seedSupabase } from "./dataApi";

const KEY = "nursehub_data_v1";

export interface DataShape {
  articles: Article[];
  comments: Comment[];
  media: MediaItem[];
  folders: MediaFolder[];
  products: Product[];
  users: User[];
  settings: SiteSettings;
  homeSections: string[];
  menu: { label: string; path: string }[];
  drugs: Drug[];
  pages: Page[];
  categories: Taxonomy[];
  tags: Taxonomy[];
  subscribers: Subscriber[];
  ads: Ad[];
  affiliates: Affiliate[];
  redirects: Redirect[];
  activity: ActivityEntry[];
  trash: TrashEntry[];
  versions: ArticleVersion[];
  notifications: AppNotification[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  customTypes: CustomType[];
  customEntries: CustomEntry[];
  homeCategories: HomeCategory[];
  // Editable heading/subtitle per homepage section (dynamic, no code edits needed)
  homeSectionMeta: Record<string, { title: string; subtitle: string }>;
  dailyViews: Record<string, number>; // { "2026-06-01": 42 } — real page view counts per day
  downloads: number; // real file download count
  gateways: PaymentGateway[];
  coupons: Coupon[];
  orders: Order[];
  commerce: CommerceSettings;
}

const defaultSettings: SiteSettings = {
  siteName: "NurseHub Egypt",
  tagline: "منصتك الأولى لتعليم التمريض",
  metaDescription: "منصة عربية متخصصة في تعليم التمريض",
  adsenseEnabled: false,
  adsenseClient: "ca-pub-0000000000000000",
};

const defaultMenu = [
  { label: "الرئيسية", path: "/" },
  { label: "المقالات", path: "/category/articles" },
  { label: "الملخصات", path: "/category/summaries" },
  { label: "الأدوية", path: "/drugs" },
  { label: "المهارات", path: "/category/skills" },
  { label: "خطط الرعاية", path: "/category/careplans" },
  { label: "الكتب", path: "/category/books" },
  { label: "الاختبارات", path: "/quizzes" },
  { label: "الأدوات", path: "/tools" },
  { label: "المتجر", path: "/store" },
];

const defaultSectionMeta: Record<string, { title: string; subtitle: string }> = {
  featured: { title: "محتوى مميز", subtitle: "أبرز المقالات والملفات المختارة" },
  categories: { title: "استكشف الأقسام", subtitle: "محتوى منظم حسب التخصص" },
  latest: { title: "أحدث المقالات", subtitle: "آخر ما تم نشره على المنصة" },
  popular: { title: "🔥 أكثر المقالات قراءة", subtitle: "الأكثر مشاهدة بين القراء" },
  pdfs: { title: "📄 آخر ملفات PDF والكتب", subtitle: "حمّل أحدث الكتب والملخصات" },
  quizzes: { title: "🧠 اختبر معلوماتك", subtitle: "اختبارات NCLEX و Prometric وبنوك أسئلة MCQ" },
  tools: { title: "أدوات حسابية طبية", subtitle: "حاسبات احترافية تساعدك في عملك" },
  store: { title: "المتجر الرقمي", subtitle: "كتب، كورسات واشتراكات مميزة" },
};

const defaultHome = [
  "hero",
  "search",
  "stats",
  "featured",
  "categories",
  "latest",
  "popular",
  "pdfs",
  "quizzes",
  "tools",
  "store",
  "newsletter",
];

const defaults: DataShape = {
  articles: seedArticles,
  comments: seedComments,
  media: seedMedia,
  folders: [{ id: "f-root", name: "الرئيسية" }],
  products: seedProducts,
  users: seedUsers,
  settings: defaultSettings,
  homeSections: defaultHome,
  menu: defaultMenu,
  drugs: seedDrugs,
  pages: seedPages,
  categories: seedCategories,
  tags: seedTags,
  subscribers: seedSubscribers,
  ads: seedAds,
  affiliates: seedAffiliates,
  redirects: seedRedirects,
  activity: seedActivity,
  trash: [],
  versions: [],
  notifications: [],
  quizzes: seedQuizzes,
  attempts: [],
  customTypes: seedCustomTypes,
  customEntries: [],
  homeCategories: seedHomeCategories,
  homeSectionMeta: defaultSectionMeta,
  dailyViews: {},
  downloads: 0,
  gateways: seedGateways,
  coupons: seedCoupons,
  orders: [],
  commerce: defaultCommerce,
};

// UI-only preferences (theme is handled elsewhere). These are NOT production data
// and are allowed in localStorage. Home layout & menu are editorial config that we
// keep client-side for now (can be moved to a `site_config` table later).
const UI_KEY = "nursehub_ui_config_v1";

function loadPreview(): DataShape {
  // PREVIEW MODE ONLY — used when Supabase env vars are absent.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaults;
}

function loadUiConfig(): { homeSections: string[]; menu: { label: string; path: string }[]; trash: TrashEntry[]; versions: ArticleVersion[]; notifications: AppNotification[]; quizzes: Quiz[]; attempts: QuizAttempt[]; customTypes: CustomType[]; customEntries: CustomEntry[]; homeCategories: HomeCategory[]; homeSectionMeta: Record<string, { title: string; subtitle: string }>; dailyViews: Record<string, number>; downloads: number; gateways: PaymentGateway[]; coupons: Coupon[]; orders: Order[]; commerce: CommerceSettings } {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        homeSections: p.homeSections ?? defaultHome,
        menu: p.menu ?? defaultMenu,
        trash: p.trash ?? [],
        versions: p.versions ?? [],
        notifications: p.notifications ?? [],
        quizzes: p.quizzes ?? seedQuizzes,
        attempts: p.attempts ?? [],
        customTypes: p.customTypes ?? seedCustomTypes,
        customEntries: p.customEntries ?? [],
        homeCategories: p.homeCategories ?? seedHomeCategories,
        homeSectionMeta: { ...defaultSectionMeta, ...(p.homeSectionMeta ?? {}) },
        dailyViews: p.dailyViews ?? {},
        downloads: p.downloads ?? 0,
        gateways: p.gateways ?? seedGateways,
        coupons: p.coupons ?? seedCoupons,
        orders: p.orders ?? [],
        commerce: p.commerce ?? defaultCommerce,
      };
    }
  } catch { /* ignore */ }
  return { homeSections: defaultHome, menu: defaultMenu, trash: [], versions: [], notifications: [], quizzes: seedQuizzes, attempts: [], customTypes: seedCustomTypes, customEntries: [], homeCategories: seedHomeCategories, homeSectionMeta: defaultSectionMeta, dailyViews: {}, downloads: 0, gateways: seedGateways, coupons: seedCoupons, orders: [], commerce: defaultCommerce };
}

interface StoreCtx extends DataShape {
  setData: (updater: (d: DataShape) => DataShape) => void;
  resetData: () => void;
  importData: (json: string) => boolean;
  exportData: () => string;
  logActivity: (action: string, target: string, user?: string) => void;
  backend: "supabase" | "local";
  loading: boolean;
  seedRemote: () => Promise<void>;
  reload: () => Promise<void>;
  pushNotification: (type: AppNotification["type"], message: string, link?: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
  saveVersion: (articleId: string, title: string, content: string, author?: string) => void;
  moveToTrash: (type: TrashEntry["type"], record: { id: string }, label: string) => void;
  restoreFromTrash: (trashId: string) => void;
  purgeTrash: (trashId: string) => void;
  emptyTrash: () => void;
  recordAttempt: (a: QuizAttempt) => void;
  deleteDemoData: () => void;
  hasDemoData: boolean;
  trackView: () => void;
  trackDownload: () => void;
  recordOrder: (o: Order) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

// Entities that are persisted to Supabase row-by-row in production.
const SYNCED: (keyof DataShape)[] = [
  "articles", "comments", "media", "products", "users", "drugs",
  "subscribers", "pages", "categories", "tags", "ads", "affiliates",
  "redirects", "activity",
];

export function StoreProvider({ children }: { children: ReactNode }) {
  // In Supabase mode we start from an empty-but-typed shape and hydrate from the DB.
  // In preview mode we hydrate from localStorage.
  const ui = loadUiConfig();
  const [data, setDataState] = useState<DataShape>(() =>
    isSupabaseEnabled ? { ...defaults, ...emptyCollections(), ...ui } : loadPreview()
  );
  const [loading, setLoading] = useState<boolean>(isSupabaseEnabled);
  const prevRef = useRef<DataShape>(data);

  // Hydrate from Supabase on mount (production)
  const reload = async () => {
    if (!isSupabaseEnabled) return;
    setLoading(true);
    try {
      const remote = await loadAllFromSupabase();
      setDataState((prev) => {
        const merged = { ...prev, ...remote, ...loadUiConfig() } as DataShape;
        if (!remote.settings) merged.settings = prev.settings;
        prevRef.current = merged;
        return merged;
      });
    } catch (e) {
      console.error("Supabase load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseEnabled) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change
  useEffect(() => {
    // Always persist editorial UI config (home layout + menu + trash/versions/notifications) client-side.
    localStorage.setItem(UI_KEY, JSON.stringify({
      homeSections: data.homeSections,
      menu: data.menu,
      trash: data.trash,
      versions: data.versions.slice(0, 200),
      notifications: data.notifications.slice(0, 100),
      quizzes: data.quizzes,
      attempts: data.attempts.slice(0, 200),
      customTypes: data.customTypes,
      customEntries: data.customEntries,
      homeCategories: data.homeCategories,
      homeSectionMeta: data.homeSectionMeta,
      dailyViews: data.dailyViews,
      downloads: data.downloads,
      gateways: data.gateways,
      coupons: data.coupons,
      orders: data.orders,
      commerce: data.commerce,
    }));

    if (!isSupabaseEnabled) {
      // PREVIEW ONLY: persist full data locally.
      localStorage.setItem(KEY, JSON.stringify(data));
    } else if (!loading) {
      // PRODUCTION: sync each changed collection to Supabase. No data in localStorage.
      const prev = prevRef.current;
      (async () => {
        for (const entity of SYNCED) {
          if (data[entity] !== prev[entity]) {
            try { await syncEntity(entity, data[entity] as any[], prev[entity] as any[]); }
            catch (e) { console.error(`sync ${entity} failed`, e); }
          }
        }
        if (data.settings !== prev.settings) {
          try { await syncSettings(data.settings); } catch (e) { console.error("sync settings failed", e); }
        }
        prevRef.current = data;
      })();
    }
  }, [data, loading]);

  const setData = (updater: (d: DataShape) => DataShape) => setDataState((prev) => updater(prev));

  const logActivity = (action: string, target: string, user = "المدير العام") =>
    setDataState((prev) => ({
      ...prev,
      activity: [
        { id: "log" + Date.now(), action, target, user, date: new Date().toISOString().slice(0, 16).replace("T", " ") },
        ...prev.activity,
      ].slice(0, 200),
    }));

  const resetData = () => {
    if (isSupabaseEnabled) { void reload(); return; }
    localStorage.removeItem(KEY);
    setDataState(loadPreview());
  };

  const exportData = () => JSON.stringify(data, null, 2);

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setDataState((prev) => ({ ...prev, ...parsed }));
      return true;
    } catch {
      return false;
    }
  };

  const seedRemote = async () => {
    await seedSupabase();
    await reload();
  };

  const pushNotification = (type: AppNotification["type"], message: string, link?: string) =>
    setDataState((prev) => ({
      ...prev,
      notifications: [
        { id: "n" + Date.now() + Math.random(), type, message, date: new Date().toISOString().slice(0, 16).replace("T", " "), read: false, link },
        ...prev.notifications,
      ].slice(0, 100),
    }));

  const markAllRead = () => setDataState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
  const markRead = (id: string) => setDataState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  const clearNotifications = () => setDataState((prev) => ({ ...prev, notifications: [] }));

  const saveVersion = (articleId: string, title: string, content: string, author = "المدير العام") =>
    setDataState((prev) => ({
      ...prev,
      versions: [
        { id: "v" + Date.now(), articleId, title, content, savedAt: new Date().toISOString().slice(0, 16).replace("T", " "), author },
        ...prev.versions,
      ].slice(0, 200),
    }));

  // Soft-delete: move a record to trash and remove from its collection
  const moveToTrash = (type: TrashEntry["type"], record: { id: string }, label: string) =>
    setDataState((prev) => {
      const collKey = type === "article" ? "articles" : type === "media" ? "media" : "users";
      return {
        ...prev,
        [collKey]: (prev[collKey] as { id: string }[]).filter((x) => x.id !== record.id),
        trash: [{ id: "t" + Date.now(), type, label, data: record, deletedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }, ...prev.trash],
      } as DataShape;
    });

  const restoreFromTrash = (trashId: string) =>
    setDataState((prev) => {
      const entry = prev.trash.find((t) => t.id === trashId);
      if (!entry) return prev;
      const collKey = entry.type === "article" ? "articles" : entry.type === "media" ? "media" : "users";
      return {
        ...prev,
        [collKey]: [entry.data as { id: string }, ...(prev[collKey] as { id: string }[])],
        trash: prev.trash.filter((t) => t.id !== trashId),
      } as DataShape;
    });

  const purgeTrash = (trashId: string) => setDataState((prev) => ({ ...prev, trash: prev.trash.filter((t) => t.id !== trashId) }));
  const emptyTrash = () => setDataState((prev) => ({ ...prev, trash: [] }));

  const recordAttempt = (a: QuizAttempt) =>
    setDataState((prev) => ({ ...prev, attempts: [a, ...prev.attempts].slice(0, 200) }));

  const trackView = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDataState((prev) => ({ ...prev, dailyViews: { ...prev.dailyViews, [today]: (prev.dailyViews[today] || 0) + 1 } }));
  };
  const trackDownload = () => setDataState((prev) => ({ ...prev, downloads: prev.downloads + 1 }));

  // One-click removal of all demo/seed data across collections
  const deleteDemoData = () =>
    setDataState((prev) => ({
      ...prev,
      quizzes: prev.quizzes.filter((q) => !q.demo),
      customTypes: prev.customTypes.filter((t) => !t.demo),
      customEntries: prev.customEntries.filter((e) => !e.demo),
      subscribers: prev.subscribers.filter((s) => !s.demo),
      homeCategories: prev.homeCategories.filter((h) => !h.demo),
      coupons: prev.coupons.filter((c) => !c.demo),
    }));

  const recordOrder = (o: Order) =>
    setDataState((prev) => ({ ...prev, orders: [o, ...prev.orders] }));

  const hasDemoData = data.quizzes.some((q) => q.demo) || data.customTypes.some((t) => t.demo) || data.customEntries.some((e) => e.demo) || data.subscribers.some((s) => s.demo) || data.homeCategories.some((h) => h.demo) || data.coupons.some((c) => c.demo);

  return (
    <Ctx.Provider
      value={{
        ...data,
        setData,
        resetData,
        importData,
        exportData,
        logActivity,
        backend: isSupabaseEnabled ? "supabase" : "local",
        loading,
        seedRemote,
        reload,
        pushNotification,
        markAllRead,
        markRead,
        clearNotifications,
        saveVersion,
        moveToTrash,
        restoreFromTrash,
        purgeTrash,
        emptyTrash,
        recordAttempt,
        deleteDemoData,
        hasDemoData,
        trackView,
        trackDownload,
        recordOrder,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// Empty typed collections for Supabase mode (before hydration).
function emptyCollections(): Partial<DataShape> {
  return {
    articles: [], comments: [], media: [], products: [], users: [], drugs: [],
    pages: [], categories: [], tags: [], subscribers: [], ads: [], affiliates: [],
    redirects: [], activity: [], trash: [], versions: [], notifications: [],
    quizzes: seedQuizzes, attempts: [], customTypes: seedCustomTypes, customEntries: [],
    homeCategories: seedHomeCategories, homeSectionMeta: defaultSectionMeta, dailyViews: {}, downloads: 0,
    gateways: seedGateways, coupons: seedCoupons, orders: [], commerce: defaultCommerce,
  };
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function readingTime(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
