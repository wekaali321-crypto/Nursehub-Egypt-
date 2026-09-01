import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Logo from "./components/Logo";

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
const PharmMnemonicsPage = lazy(() => import("./pages/PharmMnemonicsPage"));
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
const RxPrescriptionDetail = lazy(() => import("./pages/RxPrescriptionsPage"));
const RxPrescriptionsHome = lazy(() => import("./pages/RxPrescriptionsPage").then((m) => ({ default: m.RxPrescriptionsHome })));
const ClinicalProtocolDetail = lazy(() => import("./pages/ClinicalProtocolsPage"));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage"));
const QuizPlayer = lazy(() => import("./pages/QuizPlayer"));

// Static + admin (named exports) — imported normally, still split out as needed
import { About, Contact, FAQ, Privacy, Terms } from "./pages/StaticPages";
import { NotFound } from "./pages/NotFound";
import Dashboard from "./admin/Dashboard";
import ArticlesAdmin from "./admin/ArticlesAdmin";
import Editor from "./admin/Editor";
import MediaAdmin from "./admin/MediaAdmin";
import ECGLearnAdmin from "./admin/ECGLearnAdmin";
import ECGPatternsAdmin from "./admin/ECGPatternsAdmin";
import { CommentsAdmin, ProductsAdmin, UsersAdmin } from "./admin/SimpleAdmins";
import { HomeBuilder, MenuAdmin, SEOAdmin, BackupAdmin } from "./admin/Builders";
import { PagesAdmin, CategoriesAdmin, TagsAdmin, SubscribersAdmin, RedirectsAdmin, ActivityAdmin } from "./admin/AdminExtras";
import { DrugsAdmin, DrugInteractionsAdmin, DrugAntidotesAdmin, DrugClassificationsAdmin, DrugSuffixesAdmin, CardiacMedGroupsAdmin, PharmMnemonicsAdmin, PharmacyFactsAdmin } from "./admin/DrugsAdmin";
import OTCAdmin from "./admin/OTCAdmin";
import AppliedPharmAdmin from "./admin/AppliedPharmAdmin";
import ICUMedicationsAdmin from "./admin/ICUMedicationsAdmin";
import ERMedicationsAdmin from "./admin/ERMedicationsAdmin";
import PedsMedicationsAdmin from "./admin/PedsMedicationsAdmin";
import HighAlertRefAdmin from "./admin/HighAlertRefAdmin";
import RxPrescriptionsAdmin from "./admin/RxPrescriptionsAdmin";
import ClinicalProtocolsAdmin from "./admin/ClinicalProtocolsAdmin";
import { EarningsAdmin, AdsManager, AffiliateManager, PaymentsAdmin } from "./admin/Monetization";
import { AnalyticsAdmin } from "./admin/Analytics";
import { TrashAdmin, VersionsAdmin, MaintenanceAdmin, NotificationsAdmin } from "./admin/SystemAdmin";
import { QuizAdmin } from "./admin/QuizAdmin";
import { HomeCategoriesAdmin } from "./admin/HomeCategoriesAdmin";
import { EmailTemplatesAdmin } from "./admin/EmailTemplates";
import { RecoveryCenter } from "./admin/RecoveryCenter";
import { PaymentSettings } from "./admin/PaymentSettings";
import { OrdersAdmin, CouponsAdmin } from "./admin/OrdersAdmin";
import { BiometricSettings } from "./admin/BiometricSettings";
import DashboardHome from "./admin/cms/DashboardHome";
import WebsiteSettings from "./admin/cms/WebsiteSettings";
import FeatureTogglesAdmin from "./admin/cms/FeatureTogglesAdmin";
import ContentOperationsCenter from "./admin/content-ops/ContentOperationsCenter";
import QACenter from "./admin/qa/QACenter";
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

function MaintenanceScreen() {
  const { settings } = useStore();
  const until = settings.maintenanceUntil ? new Date(settings.maintenanceUntil) : null;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-600 to-emerald-600 p-6 text-center text-white">
      <div className="text-7xl">🛠️</div>
      <h1 className="mt-4 text-3xl font-black md:text-4xl">{settings.siteName}</h1>
      <p className="mt-3 max-w-lg text-lg text-sky-50">{settings.maintenanceMessage || "الموقع تحت الصيانة حالياً، سنعود قريباً."}</p>
      {until && <p className="mt-4 rounded-full bg-white/15 px-5 py-2 text-sm font-bold backdrop-blur">العودة المتوقعة: {until.toLocaleString("ar-EG")}</p>}
      <a href="/admin" className="mt-6 text-sm underline opacity-80">دخول المشرفين</a>
    </div>
  );
}

function HydrationGate({ children }: { children: ReactNode }) {
  const { loading, settings } = useStore();
  const { loggedIn } = useAuth();
  if (!loading && settings.maintenanceMode && !loggedIn) return <MaintenanceScreen />;
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="animate-pulse"><Logo size={56} /></div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="font-semibold text-slate-500 dark:text-slate-400">جارٍ التحميل...</p>
      </div>
    );
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
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Login />;
  return (
    <AdminLayout>
      <HydrationGate>
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </HydrationGate>
    </AdminLayout>
  );
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
                  <Route path="/drugs/mnemonics" element={<Public><PharmMnemonicsPage /></Public>} />
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
                  <Route path="/drugs/prescriptions" element={<Public><RxPrescriptionsHome /></Public>} />
                  <Route path="/drugs/prescriptions/:id" element={<Public><RxPrescriptionDetail /></Public>} />
                  <Route path="/drugs/protocols/:id" element={<Public><ClinicalProtocolDetail /></Public>} />
                  <Route path="/drug/:slug" element={<Public><DrugPage /></Public>} />
                  <Route path="/quizzes" element={<Public><QuizzesPage /></Public>} />
                  <Route path="/quiz/:id" element={<Public><QuizPlayer /></Public>} />
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
                  <Route path="/admin/pharm-mnemonics" element={<Admin><PharmMnemonicsAdmin /></Admin>} />
                  <Route path="/admin/pharmacy-facts" element={<Navigate to="/admin/applied-pharm" replace />} />
                  <Route path="/admin/otc" element={<Admin><OTCAdmin /></Admin>} />
                  <Route path="/admin/applied-pharm" element={<Admin><AppliedPharmAdmin /></Admin>} />
                  <Route path="/admin/icu-medications" element={<Admin><ICUMedicationsAdmin /></Admin>} />
                  <Route path="/admin/er-medications" element={<Admin><ERMedicationsAdmin /></Admin>} />
                  <Route path="/admin/peds-medications" element={<Admin><PedsMedicationsAdmin /></Admin>} />
                  <Route path="/admin/high-alert-ref" element={<Admin><HighAlertRefAdmin /></Admin>} />
                  <Route path="/admin/prescriptions" element={<Admin><RxPrescriptionsAdmin /></Admin>} />
                  <Route path="/admin/protocols" element={<Admin><ClinicalProtocolsAdmin /></Admin>} />
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
