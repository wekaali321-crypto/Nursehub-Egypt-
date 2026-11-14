import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, matchPath } from "react-router-dom";
import { trackPageview, startHeartbeat } from "./lib/siteTracker";
import { syncPushSubscription } from "./lib/push";
import { ThemeProvider, AuthProvider, useAuth } from "./lib/theme";
import { UserAuthProvider } from "./lib/userAuth";
import { I18nProvider } from "./lib/i18n";
import { CartProvider } from "./lib/cart";
import { FavoritesProvider } from "./lib/favorites";
import { StoreProvider, useStore } from "./lib/store";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./admin/AdminLayout";
import Login from "./admin/Login";
import { SkeletonGrid } from "./components/Skeleton";
import { useMaintenance } from "./lib/maintenance";

// Public pages — code-split (default exports)
const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const ECGPage = lazy(() => import("./pages/ECGPage"));
const StorePage = lazy(() => import("./pages/StorePage"));
const MonetizationPage = lazy(() => import("./pages/MonetizationPage"));
const DrugsHubPage = lazy(() => import("./pages/DrugsHubPage"));
const DrugsListPage = lazy(() => import("./pages/DrugsPage"));
const DrugPage = lazy(() => import("./pages/DrugPage"));
const DrugInteractionsPage = lazy(() => import("./pages/DrugInteractionsPage"));
const DrugAntidotesPage = lazy(() => import("./pages/DrugAntidotesPage"));
const DrugClassificationsPage = lazy(() => import("./pages/DrugClassificationsPage"));
const DrugSuffixesPage = lazy(() => import("./pages/DrugSuffixesPage"));
const CardiacMedsPage = lazy(() => import("./pages/CardiacMedsPage"));
const PharmacyFactsPage = lazy(() => import("./pages/PharmacyFactsPage"));
const PharmacyFactsHome = lazy(() => import("./pages/PharmacyFactsPage").then((m) => ({ default: m.PharmacyFactsHome })));
const OTCConditionPage = lazy(() => import("./pages/OTCGuidePage"));
const OTCGuideHome = lazy(() => import("./pages/OTCGuidePage").then((m) => ({ default: m.OTCGuideHome })));
const AppliedPharmPlanPage = lazy(() => import("./pages/AppliedPharmPage"));
const AppliedPharmHome = lazy(() => import("./pages/AppliedPharmPage").then((m) => ({ default: m.AppliedPharmHome })));
const AppliedPharmTopicPage = lazy(() => import("./pages/AppliedPharmPage").then((m) => ({ default: m.AppliedPharmTopicPage })));
const ICUMedicationDetail = lazy(() => import("./pages/ICUMedicationsPage"));
const ICUMedicationsHome = lazy(() => import("./pages/ICUMedicationsPage").then((m) => ({ default: m.ICUMedicationsHome })));
const ERMedicationDetail = lazy(() => import("./pages/ERMedicationsPage"));
const ERMedicationsHome = lazy(() => import("./pages/ERMedicationsPage").then((m) => ({ default: m.ERMedicationsHome })));
const PedsMedicationDetail = lazy(() => import("./pages/PedsMedicationsPage"));
const PedsMedicationsHome = lazy(() => import("./pages/PedsMedicationsPage").then((m) => ({ default: m.PedsMedicationsHome })));
const HighAlertRefPage = lazy(() => import("./pages/HighAlertRefPage"));
const LasaPage = lazy(() => import("./pages/LasaPage"));
const OrganDoseAdjustmentsPage = lazy(() => import("./pages/OrganDoseAdjustmentsPage"));
const PregnancyLactationPage = lazy(() => import("./pages/PregnancyLactationPage"));
const DrugSafetyCenterPage = lazy(() => import("./pages/DrugSafetyCenterPage"));
const IVCompatibilityPage = lazy(() => import("./pages/IVCompatibilityPage"));
const RxPrescriptionDetail = lazy(() => import("./pages/RxPrescriptionsPage"));
const RxPrescriptionsHome = lazy(() => import("./pages/RxPrescriptionsPage").then((m) => ({ default: m.RxPrescriptionsHome })));
const ClinicalProtocolDetail = lazy(() => import("./pages/ClinicalProtocolsPage"));
const ICUNursingTopicPage = lazy(() => import("./pages/ICUNursingPage"));
const ICUNursingHome = lazy(() => import("./pages/ICUNursingPage").then((m) => ({ default: m.ICUNursingHome })));
const ICUPrintAllPage = lazy(() => import("./pages/ICUNursingPage").then((m) => ({ default: m.ICUPrintAllPage })));
const DialysisTopicPage = lazy(() => import("./pages/DialysisPage"));
const DialysisHome = lazy(() => import("./pages/DialysisPage").then((m) => ({ default: m.DialysisHome })));
const RadiologyTopicPage = lazy(() => import("./pages/RadiologyPage"));
const RadiologyHome = lazy(() => import("./pages/RadiologyPage").then((m) => ({ default: m.RadiologyHome })));
const NicuTopicPage = lazy(() => import("./pages/NICUPage"));
const NicuHome = lazy(() => import("./pages/NICUPage").then((m) => ({ default: m.NicuHome })));
const PharmacologyTopicPage = lazy(() => import("./pages/PharmacologyPage"));
const PharmacologyHome = lazy(() => import("./pages/PharmacologyPage").then((m) => ({ default: m.PharmacologyHome })));
const TerminologyTopicPage = lazy(() => import("./pages/TerminologyPage"));
const TerminologyHome = lazy(() => import("./pages/TerminologyPage").then((m) => ({ default: m.TerminologyHome })));
const FirstAidTopicPage = lazy(() => import("./pages/FirstAidPage"));
const FirstAidHome = lazy(() => import("./pages/FirstAidPage").then((m) => ({ default: m.FirstAidHome })));
const ERReceptionTopicPage = lazy(() => import("./pages/ERReceptionPage"));
const ERReceptionHome = lazy(() => import("./pages/ERReceptionPage").then((m) => ({ default: m.ERReceptionHome })));
const PediatricsTopicPage = lazy(() => import("./pages/PediatricsPage"));
const PediatricsHome = lazy(() => import("./pages/PediatricsPage").then((m) => ({ default: m.PediatricsHome })));
const AnatomyTopicPage = lazy(() => import("./pages/AnatomyPage"));
const AnatomyHome = lazy(() => import("./pages/AnatomyPage").then((m) => ({ default: m.AnatomyHome })));
const FundamentalsTopicPage = lazy(() => import("./pages/FundamentalsPage"));
const FundamentalsHome = lazy(() => import("./pages/FundamentalsPage").then((m) => ({ default: m.FundamentalsHome })));
const OperatingRoomTopicPage = lazy(() => import("./pages/OperatingRoomPage"));
const OperatingRoomHome = lazy(() => import("./pages/OperatingRoomPage").then((m) => ({ default: m.OperatingRoomHome })));
const ObgynTopicPage = lazy(() => import("./pages/ObgynPage"));
const ObgynHome = lazy(() => import("./pages/ObgynPage").then((m) => ({ default: m.ObgynHome })));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage"));
const QuizPlayer = lazy(() => import("./pages/QuizPlayer"));
const QuizAnalyticsPage = lazy(() => import("./pages/QuizAnalyticsPage"));
const QuizReviewPage = lazy(() => import("./pages/QuizReviewPage"));
const LicensureExamsHome = lazy(() => import("./pages/LicensureExamPage").then((m) => ({ default: m.LicensureExamsHome })));
const LicensureExamCategory = lazy(() => import("./pages/LicensureExamPage").then((m) => ({ default: m.LicensureExamCategory })));
const LicensureExamStudy = lazy(() => import("./pages/LicensureExamPage"));
const InterviewQuestionsPage = lazy(() => import("./pages/InterviewQuestionsPage"));
const TravelQuestionsHome = lazy(() => import("./pages/TravelQuestionsPage").then((m) => ({ default: m.TravelQuestionsHome })));
const TravelQuestionsStudy = lazy(() => import("./pages/TravelQuestionsPage"));
const CasesHome = lazy(() => import("./pages/CasesPage").then((m) => ({ default: m.CasesHome })));
const DiseasesHome = lazy(() => import("./pages/DiseasesPage").then((m) => ({ default: m.DiseasesHome })));
const SectionHub = lazy(() => import("./pages/DiseasesPage").then((m) => ({ default: m.SectionHub })));
const DiseasePage = lazy(() => import("./pages/DiseasesPage").then((m) => ({ default: m.DiseasePage })));
const CaseGuidePage = lazy(() => import("./pages/CasesPage").then((m) => ({ default: m.CaseGuidePage })));
const CasePage = lazy(() => import("./pages/CasesPage").then((m) => ({ default: m.CasePage })));
const CoursesHome = lazy(() => import("./pages/CoursesPage").then((m) => ({ default: m.CoursesHome })));
const CoursePage = lazy(() => import("./pages/CoursesPage").then((m) => ({ default: m.CoursePage })));
const ChapterPage = lazy(() => import("./pages/CoursesPage").then((m) => ({ default: m.ChapterPage })));
const CourseQuiz = lazy(() => import("./pages/CoursesPage").then((m) => ({ default: m.CourseQuiz })));

// Static + admin (named exports) — imported normally, still split out as needed
import { About, Contact, FAQ, Privacy, Terms } from "./pages/StaticPages";
import { NotFound } from "./pages/NotFound";
const Dashboard = lazy(() => import("./admin/Dashboard"));
const ArticlesAdmin = lazy(() => import("./admin/ArticlesAdmin"));
const Editor = lazy(() => import("./admin/Editor"));
const MediaAdmin = lazy(() => import("./admin/MediaAdmin"));
const ECGLearnAdmin = lazy(() => import("./admin/ECGLearnAdmin"));
const ECGPatternsAdmin = lazy(() => import("./admin/ECGPatternsAdmin"));
const CommentsAdmin = lazy(() => import("./admin/SimpleAdmins").then((m) => ({ default: m.CommentsAdmin })));
const ProductsAdmin = lazy(() => import("./admin/SimpleAdmins").then((m) => ({ default: m.ProductsAdmin })));
const UsersAdmin = lazy(() => import("./admin/SimpleAdmins").then((m) => ({ default: m.UsersAdmin })));
const HomeBuilder = lazy(() => import("./admin/Builders").then((m) => ({ default: m.HomeBuilder })));
const MenuAdmin = lazy(() => import("./admin/Builders").then((m) => ({ default: m.MenuAdmin })));
const SEOAdmin = lazy(() => import("./admin/Builders").then((m) => ({ default: m.SEOAdmin })));
const BackupAdmin = lazy(() => import("./admin/Builders").then((m) => ({ default: m.BackupAdmin })));
const PagesAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.PagesAdmin })));
const CategoriesAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.CategoriesAdmin })));
const TagsAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.TagsAdmin })));
const SubscribersAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.SubscribersAdmin })));
const RedirectsAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.RedirectsAdmin })));
const ActivityAdmin = lazy(() => import("./admin/AdminExtras").then((m) => ({ default: m.ActivityAdmin })));
const DrugsAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.DrugsAdmin })));
const DrugInteractionsAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.DrugInteractionsAdmin })));
const DrugAntidotesAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.DrugAntidotesAdmin })));
const DrugClassificationsAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.DrugClassificationsAdmin })));
const DrugSuffixesAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.DrugSuffixesAdmin })));
const CardiacMedGroupsAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.CardiacMedGroupsAdmin })));
const PharmacyFactsAdmin = lazy(() => import("./admin/DrugsAdmin").then((m) => ({ default: m.PharmacyFactsAdmin })));
const OTCAdmin = lazy(() => import("./admin/OTCAdmin"));
const AppliedPharmAdmin = lazy(() => import("./admin/AppliedPharmAdmin"));
const ICUMedicationsAdmin = lazy(() => import("./admin/ICUMedicationsAdmin"));
const ERMedicationsAdmin = lazy(() => import("./admin/ERMedicationsAdmin"));
const PedsMedicationsAdmin = lazy(() => import("./admin/PedsMedicationsAdmin"));
const HighAlertRefAdmin = lazy(() => import("./admin/HighAlertRefAdmin"));
const LasaAdmin = lazy(() => import("./admin/LasaAdmin"));
const RxPrescriptionsAdmin = lazy(() => import("./admin/RxPrescriptionsAdmin"));
const ClinicalProtocolsAdmin = lazy(() => import("./admin/ClinicalProtocolsAdmin"));
const ICUNursingAdmin = lazy(() => import("./admin/ICUNursingAdmin"));
const DialysisAdmin = lazy(() => import("./admin/DialysisAdmin"));
const RadiologyAdmin = lazy(() => import("./admin/RadiologyAdmin"));
const NICUAdmin = lazy(() => import("./admin/NICUAdmin"));
const PharmacologyAdmin = lazy(() => import("./admin/PharmacologyAdmin"));
const TerminologyAdmin = lazy(() => import("./admin/TerminologyAdmin"));
const FirstAidAdmin = lazy(() => import("./admin/FirstAidAdmin"));
const ERReceptionAdmin = lazy(() => import("./admin/ERReceptionAdmin"));
const PediatricsAdmin = lazy(() => import("./admin/PediatricsAdmin"));
const PediatricsQuizAdmin = lazy(() => import("./admin/PediatricsQuizAdmin"));
const AnatomyAdmin = lazy(() => import("./admin/AnatomyAdmin"));
const FundamentalsAdmin = lazy(() => import("./admin/FundamentalsAdmin"));
const OperatingRoomAdmin = lazy(() => import("./admin/OperatingRoomAdmin"));
const ObgynAdmin = lazy(() => import("./admin/ObgynAdmin"));
const ExamCategoriesAdmin = lazy(() => import("./admin/LicensureExamAdmin").then((m) => ({ default: m.ExamCategoriesAdmin })));
const ExamsAdmin = lazy(() => import("./admin/LicensureExamAdmin").then((m) => ({ default: m.ExamsAdmin })));
const ExamQuestionsAdmin = lazy(() => import("./admin/LicensureExamAdmin").then((m) => ({ default: m.ExamQuestionsAdmin })));
const InterviewCategoriesAdmin = lazy(() => import("./admin/InterviewQuestionsAdmin").then((m) => ({ default: m.InterviewCategoriesAdmin })));
const InterviewQuestionsAdmin = lazy(() => import("./admin/InterviewQuestionsAdmin").then((m) => ({ default: m.InterviewQuestionsAdmin })));
const TravelCategoriesAdmin = lazy(() => import("./admin/TravelQuestionsAdmin").then((m) => ({ default: m.TravelCategoriesAdmin })));
const TravelQuestionsAdmin = lazy(() => import("./admin/TravelQuestionsAdmin").then((m) => ({ default: m.TravelQuestionsAdmin })));
const CoursesAdmin = lazy(() => import("./admin/CoursesAdmin").then((m) => ({ default: m.CoursesAdmin })));
const CourseChaptersAdmin = lazy(() => import("./admin/CoursesAdmin").then((m) => ({ default: m.CourseChaptersAdmin })));
const CourseQuestionsAdmin = lazy(() => import("./admin/CoursesAdmin").then((m) => ({ default: m.CourseQuestionsAdmin })));
const TerminologyQuizAdmin = lazy(() => import("./admin/TerminologyQuizAdmin"));
const OrganDoseAdjustmentsAdmin = lazy(() => import("./admin/OrganDoseAdjustmentsAdmin"));
const PregnancyLactationAdmin = lazy(() => import("./admin/PregnancyLactationAdmin"));
const IVCompatibilityAdmin = lazy(() => import("./admin/IVCompatibilityAdmin"));
const EarningsAdmin = lazy(() => import("./admin/Monetization").then((m) => ({ default: m.EarningsAdmin })));
const AdsManager = lazy(() => import("./admin/Monetization").then((m) => ({ default: m.AdsManager })));
const AffiliateManager = lazy(() => import("./admin/Monetization").then((m) => ({ default: m.AffiliateManager })));
const PaymentsAdmin = lazy(() => import("./admin/Monetization").then((m) => ({ default: m.PaymentsAdmin })));
const AnalyticsAdmin = lazy(() => import("./admin/Analytics").then((m) => ({ default: m.AnalyticsAdmin })));
const TrafficAdmin = lazy(() => import("./admin/TrafficAdmin").then((m) => ({ default: m.TrafficAdmin })));
const TrashAdmin = lazy(() => import("./admin/SystemAdmin").then((m) => ({ default: m.TrashAdmin })));
const VersionsAdmin = lazy(() => import("./admin/SystemAdmin").then((m) => ({ default: m.VersionsAdmin })));
const MaintenanceAdmin = lazy(() => import("./admin/SystemAdmin").then((m) => ({ default: m.MaintenanceAdmin })));
const NotificationsAdmin = lazy(() => import("./admin/SystemAdmin").then((m) => ({ default: m.NotificationsAdmin })));
const QuizAdmin = lazy(() => import("./admin/QuizAdmin").then((m) => ({ default: m.QuizAdmin })));
const HomeCategoriesAdmin = lazy(() => import("./admin/HomeCategoriesAdmin").then((m) => ({ default: m.HomeCategoriesAdmin })));
const EmailTemplatesAdmin = lazy(() => import("./admin/EmailTemplates").then((m) => ({ default: m.EmailTemplatesAdmin })));
const RecoveryCenter = lazy(() => import("./admin/RecoveryCenter").then((m) => ({ default: m.RecoveryCenter })));
const PaymentSettings = lazy(() => import("./admin/PaymentSettings").then((m) => ({ default: m.PaymentSettings })));
const OrdersAdmin = lazy(() => import("./admin/OrdersAdmin").then((m) => ({ default: m.OrdersAdmin })));
const CouponsAdmin = lazy(() => import("./admin/OrdersAdmin").then((m) => ({ default: m.CouponsAdmin })));
const BiometricSettings = lazy(() => import("./admin/BiometricSettings").then((m) => ({ default: m.BiometricSettings })));
const DashboardHome = lazy(() => import("./admin/cms/DashboardHome"));
const WebsiteSettings = lazy(() => import("./admin/cms/WebsiteSettings"));
const FeatureTogglesAdmin = lazy(() => import("./admin/cms/FeatureTogglesAdmin"));
const ContentOperationsCenter = lazy(() => import("./admin/content-ops/ContentOperationsCenter"));
const QACenter = lazy(() => import("./admin/qa/QACenter"));
const ImportWizard = lazy(() => import("./admin/ImportWizard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const OrderStatusPage = lazy(() => import("./pages/OrderStatusPage"));
import { LoginPage, RegisterPage, ForgotPage } from "./pages/AuthPages";

function Loader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <SkeletonGrid count={6} />
    </div>
  );
}

function MaintenanceScreen({ message, until: untilRaw }: { message?: string; until?: string }) {
  const { settings } = useStore();
  const until = untilRaw ? new Date(untilRaw) : null;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-600 to-emerald-600 p-6 text-center text-white">
      <div className="text-7xl">🛠️</div>
      <h1 className="mt-4 text-3xl font-black md:text-4xl">{settings.siteName}</h1>
      <p className="mt-3 max-w-lg text-lg text-sky-50">{message || "الموقع تحت الصيانة حالياً، سنعود قريباً."}</p>
      {until && <p className="mt-4 rounded-full bg-white/15 px-5 py-2 text-sm font-bold backdrop-blur">العودة المتوقعة: {until.toLocaleString("ar-EG")}</p>}
      <a href="/admin" className="mt-6 text-sm underline opacity-80">دخول المشرفين</a>
    </div>
  );
}

/** Public pages that fetch their own data (own API + static snapshot) and never read the store bundle. They render immediately. */
const STORE_FREE_ROUTES = [
  '/anatomy', '/anatomy/:id', '/cases', '/courses', '/diseases', '/tools', '/interview-questions', '/travel-questions', '/travel-questions/:categoryId',
  '/dialysis', '/dialysis/:id', '/er-reception', '/er-reception/:id', '/first-aid', '/first-aid/:id', '/fundamentals', '/fundamentals/:id',
  '/icu-nursing', '/icu-nursing/:id', '/obgyn', '/obgyn/:id', '/operating-room', '/operating-room/:id', '/pediatrics', '/pediatrics/:id',
  '/pharmacology', '/pharmacology/:id', '/radiology', '/radiology/:id', '/terminology', '/terminology/:id',
  '/tests/licensure', '/tests/licensure/:categoryId', '/tests/licensure/:categoryId/:examId',
  '/drugs/er-medications', '/drugs/high-alert-ref', '/drugs/icu-medications', '/drugs/iv-compatibility', '/drugs/lasa',
  '/drugs/organ-dose', '/drugs/peds-medications', '/drugs/pregnancy-lactation', '/drugs/prescriptions',
];

/** Layout-stable placeholder shown while the store bundle loads (same container + grid as the real pages: no jump when content arrives). */
function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8" role="status" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="mb-8 h-40 w-full animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 sm:h-48" />
      <SkeletonGrid count={6} />
    </div>
  );
}

/**
 * The header/footer (PublicLayout) are always visible. Pages that need the store bundle show a skeleton until it is ready;
 * pages that load their own data render at once, so a slow or failed bundle never blocks them.
 * The admin area still waits for the full bundle (it edits it).
 */
function HydrationGate({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { loading, settings } = useStore();
  const { loggedIn, checking } = useAuth();
  const { pathname } = useLocation();
  const maint = useMaintenance(); // own one-row check, started at boot: never waits for the store bundle
  if (!admin && !loggedIn) {
    // Remote flag (nh_settings) or, in local preview mode, the store's own settings.
    // 'unknown' (read failed / timed out) fails open; a late answer of 'on' re-renders this gate into the maintenance screen.
    const remoteOn = maint?.status === "on";
    const on = remoteOn || (!loading && settings.maintenanceMode);
    if (on) {
      if (checking) return <PageSkeleton />; // an admin's session may still be restoring: show nothing yet, not the page
      return <MaintenanceScreen message={remoteOn ? maint!.message : settings.maintenanceMessage} until={remoteOn ? maint!.until : settings.maintenanceUntil} />;
    }
    // Until the flag is known, no page content (store-free pages included) is rendered: the shell + skeleton only.
    if (maint === null) return <PageSkeleton />;
  }
  if (loading) {
    const free = !admin && STORE_FREE_ROUTES.some((r) => matchPath({ path: r, end: true }, pathname));
    if (!free) return <PageSkeleton />;
  }
  return <>{children}</>;
}

function Public({ children }: { children: ReactNode }) {
  return (
    <PublicLayout>
      <HydrationGate>
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </HydrationGate>
    </PublicLayout>
  );
}

function Admin({ children }: { children: ReactNode }) {
  const { loggedIn, checking } = useAuth();
  if (checking) return <Loader />;
  if (!loggedIn) return <Login />;
  return (
    <AdminLayout>
      <HydrationGate admin>
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </HydrationGate>
    </AdminLayout>
  );
}

/** Anonymous real-visitor tracking: page views per route change plus a live-presence heartbeat. */
function SiteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPageview(pathname + search);
  }, [pathname, search]);
  useEffect(() => startHeartbeat(() => window.location.pathname), []);
  useEffect(() => { const t = window.setTimeout(() => void syncPushSubscription(), 4000); return () => window.clearTimeout(t); }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
        <StoreProvider>
          <ToastProvider>
            <CartProvider>
            <FavoritesProvider>
            <UserAuthProvider>
            <AuthProvider>
              <BrowserRouter>
                <SiteTracker />
                <Routes>
                  <Route path="/" element={<Public><Home /></Public>} />
                  <Route path="/category/:cat" element={<Public><CategoryPage /></Public>} />
                  {/* Real sub-category "folder" pages, e.g. /category/articles/nursing-fundamentals.
                      Same component — CategoryPage reads the extra `:sub` param to filter. */}
                  <Route path="/category/:cat/:sub" element={<Public><CategoryPage /></Public>} />
                  <Route path="/article/:slug" element={<Public><ArticlePage /></Public>} />
                  <Route path="/drugs" element={<Public><DrugsHubPage /></Public>} />
                  <Route path="/drugs/all" element={<Public><DrugsListPage /></Public>} />
                  <Route path="/drugs/interactions" element={<Public><DrugInteractionsPage /></Public>} />
                  <Route path="/drugs/antidotes" element={<Public><DrugAntidotesPage /></Public>} />
                  <Route path="/drugs/classifications" element={<Public><DrugClassificationsPage /></Public>} />
                  <Route path="/drugs/suffixes" element={<Public><DrugSuffixesPage /></Public>} />
                  <Route path="/drugs/cardiac" element={<Public><CardiacMedsPage /></Public>} />
                  <Route path="/drugs/mnemonics" element={<Navigate to="/pharmacology/pharm-mnemonics-memory-aids" replace />} />
                  <Route path="/drugs/facts" element={<Navigate to="/drugs/applied-pharm" replace />} />
                  <Route path="/drugs/facts/:chapter" element={<Navigate to="/drugs/applied-pharm" replace />} />
                  <Route path="/drugs/otc-guide" element={<Public><OTCGuideHome /></Public>} />
                  <Route path="/drugs/otc-guide/:id" element={<Public><OTCConditionPage /></Public>} />
                  <Route path="/drugs/applied-pharm" element={<Public><AppliedPharmHome /></Public>} />
                  <Route path="/drugs/applied-pharm/topic/:topic" element={<Public><AppliedPharmTopicPage /></Public>} />
                  <Route path="/drugs/applied-pharm/plan/:id" element={<Public><AppliedPharmPlanPage /></Public>} />
                  <Route path="/drugs/icu-medications" element={<Public><ICUMedicationsHome /></Public>} />
                  <Route path="/drugs/icu-medications/:id" element={<Public><ICUMedicationDetail /></Public>} />
                  <Route path="/drugs/er-medications" element={<Public><ERMedicationsHome /></Public>} />
                  <Route path="/drugs/er-medications/:id" element={<Public><ERMedicationDetail /></Public>} />
                  <Route path="/drugs/peds-medications" element={<Public><PedsMedicationsHome /></Public>} />
                  <Route path="/drugs/peds-medications/:id" element={<Public><PedsMedicationDetail /></Public>} />
                  <Route path="/drugs/high-alert-ref" element={<Public><HighAlertRefPage /></Public>} />
                  <Route path="/drugs/lasa" element={<Public><LasaPage /></Public>} />
                  <Route path="/drugs/organ-dose" element={<Public><OrganDoseAdjustmentsPage /></Public>} />
                  <Route path="/drugs/pregnancy-lactation" element={<Public><PregnancyLactationPage /></Public>} />
                  <Route path="/drugs/safety-center" element={<Public><DrugSafetyCenterPage /></Public>} />
                  <Route path="/drugs/iv-compatibility" element={<Public><IVCompatibilityPage /></Public>} />
                  <Route path="/drugs/prescriptions" element={<Public><RxPrescriptionsHome /></Public>} />
                  <Route path="/drugs/prescriptions/:id" element={<Public><RxPrescriptionDetail /></Public>} />
                  <Route path="/drugs/protocols/:id" element={<Public><ClinicalProtocolDetail /></Public>} />
                  <Route path="/icu-nursing" element={<Public><ICUNursingHome /></Public>} />
                  <Route path="/icu-nursing/print-all" element={<Public><ICUPrintAllPage /></Public>} />
                  <Route path="/icu-nursing/:id" element={<Public><ICUNursingTopicPage /></Public>} />
                  <Route path="/dialysis" element={<Public><DialysisHome /></Public>} />
                  <Route path="/dialysis/:id" element={<Public><DialysisTopicPage /></Public>} />
                  <Route path="/radiology" element={<Public><RadiologyHome /></Public>} />
                  <Route path="/radiology/:id" element={<Public><RadiologyTopicPage /></Public>} />
                  <Route path="/nicu" element={<Public><NicuHome /></Public>} />
                  <Route path="/nicu/:id" element={<Public><NicuTopicPage /></Public>} />
                  <Route path="/pharmacology" element={<Public><PharmacologyHome /></Public>} />
                  <Route path="/pharmacology/:id" element={<Public><PharmacologyTopicPage /></Public>} />
                  <Route path="/terminology" element={<Public><TerminologyHome /></Public>} />
                  <Route path="/terminology/:id" element={<Public><TerminologyTopicPage /></Public>} />
                  <Route path="/first-aid" element={<Public><FirstAidHome /></Public>} />
                  <Route path="/first-aid/:id" element={<Public><FirstAidTopicPage /></Public>} />
                  <Route path="/er-reception" element={<Public><ERReceptionHome /></Public>} />
                  <Route path="/er-reception/:id" element={<Public><ERReceptionTopicPage /></Public>} />
                  <Route path="/pediatrics" element={<Public><PediatricsHome /></Public>} />
                  <Route path="/pediatrics/:id" element={<Public><PediatricsTopicPage /></Public>} />
                  <Route path="/anatomy" element={<Public><AnatomyHome /></Public>} />
                  <Route path="/anatomy/:id" element={<Public><AnatomyTopicPage /></Public>} />
                  <Route path="/fundamentals" element={<Public><FundamentalsHome /></Public>} />
                  <Route path="/fundamentals/:id" element={<Public><FundamentalsTopicPage /></Public>} />
                  <Route path="/operating-room" element={<Public><OperatingRoomHome /></Public>} />
                  <Route path="/operating-room/:id" element={<Public><OperatingRoomTopicPage /></Public>} />
                  <Route path="/obgyn" element={<Public><ObgynHome /></Public>} />
                  <Route path="/obgyn/:id" element={<Public><ObgynTopicPage /></Public>} />
                  <Route path="/drug/:slug" element={<Public><DrugPage /></Public>} />
                  <Route path="/quizzes" element={<Public><QuizzesPage /></Public>} />
                  <Route path="/quizzes/analytics" element={<Public><QuizAnalyticsPage /></Public>} />
                  <Route path="/quizzes/review" element={<Public><QuizReviewPage /></Public>} />
                  <Route path="/quiz/:id" element={<Public><QuizPlayer /></Public>} />
                  <Route path="/quiz-mode/:mode" element={<Public><QuizPlayer /></Public>} />
                  <Route path="/tests/licensure" element={<Public><LicensureExamsHome /></Public>} />
                  <Route path="/tests/licensure/:categoryId" element={<Public><LicensureExamCategory /></Public>} />
                  <Route path="/tests/licensure/:categoryId/:examId" element={<Public><LicensureExamStudy /></Public>} />
                  <Route path="/interview-questions" element={<Public><InterviewQuestionsPage /></Public>} />
                  <Route path="/travel-questions" element={<Public><TravelQuestionsHome /></Public>} />
                  <Route path="/travel-questions/:categoryId" element={<Public><TravelQuestionsStudy /></Public>} />
                  <Route path="/cases" element={<Public><CasesHome /></Public>} />
                  <Route path="/cases/guide/:id" element={<Public><CaseGuidePage /></Public>} />
                  <Route path="/cases/:id" element={<Public><CasePage /></Public>} />
                  <Route path="/diseases" element={<Public><DiseasesHome /></Public>} />
                  <Route path="/diseases/:id" element={<Public><DiseasePage /></Public>} />
                  <Route path="/guide/:id" element={<Public><DiseasePage /></Public>} />
                  <Route path="/section/:slug" element={<Public><SectionHub /></Public>} />
                  <Route path="/courses" element={<Public><CoursesHome /></Public>} />
                  <Route path="/courses/:courseId" element={<Public><CoursePage /></Public>} />
                  <Route path="/courses/:courseId/chapter/:chapterId" element={<Public><ChapterPage /></Public>} />
                  <Route path="/courses/:courseId/quiz" element={<Public><CourseQuiz /></Public>} />
                  <Route path="/login" element={<Public><LoginPage /></Public>} />
                  <Route path="/register" element={<Public><RegisterPage /></Public>} />
                  <Route path="/forgot" element={<Public><ForgotPage /></Public>} />
                  <Route path="/search" element={<Public><SearchPage /></Public>} />
                  <Route path="/tools" element={<Public><ToolsPage /></Public>} />
                  <Route path="/ecg" element={<Public><ECGPage /></Public>} />
                  <Route path="/store" element={<Public><StorePage /></Public>} />
                  <Route path="/checkout" element={<Public><CheckoutPage /></Public>} />
                  <Route path="/order/:invoiceNo" element={<Public><OrderStatusPage /></Public>} />
                  <Route path="/product/:id" element={<Public><ProductPage /></Public>} />
                  <Route path="/favorites" element={<Public><FavoritesPage /></Public>} />
                  <Route path="/dashboard" element={<Public><StudentDashboard /></Public>} />
                  <Route path="/monetization" element={<Public><MonetizationPage /></Public>} />
                  <Route path="/about" element={<Public><About /></Public>} />
                  <Route path="/contact" element={<Public><Contact /></Public>} />
                  <Route path="/faq" element={<Public><FAQ /></Public>} />
                  <Route path="/privacy" element={<Public><Privacy /></Public>} />
                  <Route path="/terms" element={<Public><Terms /></Public>} />

                  <Route path="/admin" element={<Admin><DashboardHome /></Admin>} />
                  <Route path="/admin/dashboard-legacy" element={<Admin><Dashboard /></Admin>} />
                  <Route path="/admin/settings" element={<Admin><WebsiteSettings /></Admin>} />
                  <Route path="/admin/features" element={<Admin><FeatureTogglesAdmin /></Admin>} />
                  <Route path="/admin/content-ops" element={<Admin><ContentOperationsCenter /></Admin>} />
                  <Route path="/admin/qa" element={<Admin><QACenter /></Admin>} />
                  <Route path="/admin/articles" element={<Admin><ArticlesAdmin /></Admin>} />
                  <Route path="/admin/editor" element={<Admin><Editor /></Admin>} />
                  <Route path="/admin/import-wizard" element={<Admin><ImportWizard /></Admin>} />
                  <Route path="/admin/import-wizard" element={<Admin><ImportWizard /></Admin>} />
                  <Route path="/admin/recovery" element={<Admin><RecoveryCenter /></Admin>} />
                  <Route path="/admin/drugs" element={<Admin><DrugsAdmin /></Admin>} />
                  <Route path="/admin/drug-interactions" element={<Admin><DrugInteractionsAdmin /></Admin>} />
                  <Route path="/admin/drug-antidotes" element={<Admin><DrugAntidotesAdmin /></Admin>} />
                  <Route path="/admin/drug-classifications" element={<Admin><DrugClassificationsAdmin /></Admin>} />
                  <Route path="/admin/drug-suffixes" element={<Admin><DrugSuffixesAdmin /></Admin>} />
                  <Route path="/admin/cardiac-meds" element={<Admin><CardiacMedGroupsAdmin /></Admin>} />
                  <Route path="/admin/pharm-mnemonics" element={<Navigate to="/admin/pharmacology" replace />} />
                  <Route path="/admin/pharmacy-facts" element={<Navigate to="/admin/applied-pharm" replace />} />
                  <Route path="/admin/otc" element={<Admin><OTCAdmin /></Admin>} />
                  <Route path="/admin/applied-pharm" element={<Admin><AppliedPharmAdmin /></Admin>} />
                  <Route path="/admin/icu-medications" element={<Admin><ICUMedicationsAdmin /></Admin>} />
                  <Route path="/admin/er-medications" element={<Admin><ERMedicationsAdmin /></Admin>} />
                  <Route path="/admin/peds-medications" element={<Admin><PedsMedicationsAdmin /></Admin>} />
                  <Route path="/admin/high-alert-ref" element={<Admin><HighAlertRefAdmin /></Admin>} />
                  <Route path="/admin/lasa" element={<Admin><LasaAdmin /></Admin>} />
                  <Route path="/admin/prescriptions" element={<Admin><RxPrescriptionsAdmin /></Admin>} />
                  <Route path="/admin/protocols" element={<Admin><ClinicalProtocolsAdmin /></Admin>} />
                  <Route path="/admin/icu-nursing" element={<Admin><ICUNursingAdmin /></Admin>} />
                  <Route path="/admin/dialysis" element={<Admin><DialysisAdmin /></Admin>} />
                  <Route path="/admin/radiology" element={<Admin><RadiologyAdmin /></Admin>} />
                  <Route path="/admin/nicu" element={<Admin><NICUAdmin /></Admin>} />
                  <Route path="/admin/pharmacology" element={<Admin><PharmacologyAdmin /></Admin>} />
                  <Route path="/admin/terminology" element={<Admin><TerminologyAdmin /></Admin>} />
                  <Route path="/admin/first-aid" element={<Admin><FirstAidAdmin /></Admin>} />
                  <Route path="/admin/er-reception" element={<Admin><ERReceptionAdmin /></Admin>} />
                  <Route path="/admin/pediatrics" element={<Admin><PediatricsAdmin /></Admin>} />
                  <Route path="/admin/pediatrics-quiz" element={<Admin><PediatricsQuizAdmin /></Admin>} />
                  <Route path="/admin/anatomy" element={<Admin><AnatomyAdmin /></Admin>} />
                  <Route path="/admin/fundamentals" element={<Admin><FundamentalsAdmin /></Admin>} />
                  <Route path="/admin/operating-room" element={<Admin><OperatingRoomAdmin /></Admin>} />
                  <Route path="/admin/obgyn" element={<Admin><ObgynAdmin /></Admin>} />
                  <Route path="/admin/exam-categories" element={<Admin><ExamCategoriesAdmin /></Admin>} />
                  <Route path="/admin/exams" element={<Admin><ExamsAdmin /></Admin>} />
                  <Route path="/admin/exam-questions" element={<Admin><ExamQuestionsAdmin /></Admin>} />
                  <Route path="/admin/interview-categories" element={<Admin><InterviewCategoriesAdmin /></Admin>} />
                  <Route path="/admin/interview-questions" element={<Admin><InterviewQuestionsAdmin /></Admin>} />
                  <Route path="/admin/travel-categories" element={<Admin><TravelCategoriesAdmin /></Admin>} />
                  <Route path="/admin/travel-questions" element={<Admin><TravelQuestionsAdmin /></Admin>} />
                  <Route path="/admin/courses" element={<Admin><CoursesAdmin /></Admin>} />
                  <Route path="/admin/course-chapters" element={<Admin><CourseChaptersAdmin /></Admin>} />
                  <Route path="/admin/course-questions" element={<Admin><CourseQuestionsAdmin /></Admin>} />
                  <Route path="/admin/terminology-quiz" element={<Admin><TerminologyQuizAdmin /></Admin>} />
                  <Route path="/admin/organ-dose" element={<Admin><OrganDoseAdjustmentsAdmin /></Admin>} />
                  <Route path="/admin/pregnancy-lactation" element={<Admin><PregnancyLactationAdmin /></Admin>} />
                  <Route path="/admin/iv-compatibility" element={<Admin><IVCompatibilityAdmin /></Admin>} />
                  <Route path="/admin/quizzes" element={<Admin><QuizAdmin /></Admin>} />
                  <Route path="/admin/pages" element={<Admin><PagesAdmin /></Admin>} />
                  <Route path="/admin/categories" element={<Admin><CategoriesAdmin /></Admin>} />
                  <Route path="/admin/tags" element={<Admin><TagsAdmin /></Admin>} />
                  <Route path="/admin/media" element={<Admin><MediaAdmin /></Admin>} />
                  <Route path="/admin/ecg-learn" element={<Admin><ECGLearnAdmin /></Admin>} />
                  <Route path="/admin/ecg-patterns" element={<Admin><ECGPatternsAdmin /></Admin>} />
                  <Route path="/admin/comments" element={<Admin><CommentsAdmin /></Admin>} />
                  <Route path="/admin/subscribers" element={<Admin><SubscribersAdmin /></Admin>} />
                  <Route path="/admin/emails" element={<Admin><EmailTemplatesAdmin /></Admin>} />
                  <Route path="/admin/products" element={<Admin><ProductsAdmin /></Admin>} />
                  <Route path="/admin/earnings" element={<Admin><EarningsAdmin /></Admin>} />
                  <Route path="/admin/ads" element={<Admin><AdsManager /></Admin>} />
                  <Route path="/admin/affiliates" element={<Admin><AffiliateManager /></Admin>} />
                  <Route path="/admin/payments" element={<Admin><PaymentsAdmin /></Admin>} />
                  <Route path="/admin/payment-settings" element={<Admin><PaymentSettings /></Admin>} />
                  <Route path="/admin/orders" element={<Admin><OrdersAdmin /></Admin>} />
                  <Route path="/admin/coupons" element={<Admin><CouponsAdmin /></Admin>} />
                  <Route path="/admin/traffic" element={<Admin><TrafficAdmin /></Admin>} />
                  <Route path="/admin/analytics" element={<Admin><AnalyticsAdmin /></Admin>} />
                  <Route path="/admin/users" element={<Admin><UsersAdmin /></Admin>} />
                  <Route path="/admin/home-categories" element={<Admin><HomeCategoriesAdmin /></Admin>} />
                  <Route path="/admin/home-builder" element={<Admin><HomeBuilder /></Admin>} />
                  <Route path="/admin/menu" element={<Admin><MenuAdmin /></Admin>} />
                  <Route path="/admin/seo" element={<Admin><SEOAdmin /></Admin>} />
                  <Route path="/admin/redirects" element={<Admin><RedirectsAdmin /></Admin>} />
                  <Route path="/admin/activity" element={<Admin><ActivityAdmin /></Admin>} />
                  <Route path="/admin/notifications" element={<Admin><NotificationsAdmin /></Admin>} />
                  <Route path="/admin/trash" element={<Admin><TrashAdmin /></Admin>} />
                  <Route path="/admin/versions" element={<Admin><VersionsAdmin /></Admin>} />
                  <Route path="/admin/maintenance" element={<Admin><MaintenanceAdmin /></Admin>} />
                  <Route path="/admin/backup" element={<Admin><BackupAdmin /></Admin>} />
                  <Route path="/admin/biometrics" element={<Admin><BiometricSettings /></Admin>} />

                  <Route path="*" element={<Public><NotFound /></Public>} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
            </UserAuthProvider>
            </FavoritesProvider>
            </CartProvider>
          </ToastProvider>
        </StoreProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
