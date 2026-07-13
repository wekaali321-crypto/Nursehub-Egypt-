import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, AuthProvider, useAuth } from "./lib/theme";
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
const StorePage = lazy(() => import("./pages/StorePage"));
const MonetizationPage = lazy(() => import("./pages/MonetizationPage"));
const DrugsPage = lazy(() => import("./pages/DrugsPage"));
const DrugPage = lazy(() => import("./pages/DrugPage"));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage"));
const QuizPlayer = lazy(() => import("./pages/QuizPlayer"));

// Static + admin (named exports) — imported normally, still split out as needed
import { About, Contact, FAQ, Privacy, Terms } from "./pages/StaticPages";
import { NotFound } from "./pages/NotFound";
import Dashboard from "./admin/Dashboard";
import ArticlesAdmin from "./admin/ArticlesAdmin";
import Editor from "./admin/Editor";
import MediaAdmin from "./admin/MediaAdmin";
import { CommentsAdmin, ProductsAdmin, UsersAdmin } from "./admin/SimpleAdmins";
import { HomeBuilder, MenuAdmin, SEOAdmin, BackupAdmin } from "./admin/Builders";
import { PagesAdmin, CategoriesAdmin, TagsAdmin, SubscribersAdmin, RedirectsAdmin, ActivityAdmin } from "./admin/AdminExtras";
import { DrugsAdmin } from "./admin/DrugsAdmin";
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
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Public><Home /></Public>} />
                  <Route path="/category/:cat" element={<Public><CategoryPage /></Public>} />
                  <Route path="/article/:slug" element={<Public><ArticlePage /></Public>} />
                  <Route path="/drugs" element={<Public><DrugsPage /></Public>} />
                  <Route path="/drug/:slug" element={<Public><DrugPage /></Public>} />
                  <Route path="/quizzes" element={<Public><QuizzesPage /></Public>} />
                  <Route path="/quiz/:id" element={<Public><QuizPlayer /></Public>} />
                  <Route path="/login" element={<Public><LoginPage /></Public>} />
                  <Route path="/register" element={<Public><RegisterPage /></Public>} />
                  <Route path="/forgot" element={<Public><ForgotPage /></Public>} />
                  <Route path="/search" element={<Public><SearchPage /></Public>} />
                  <Route path="/tools" element={<Public><ToolsPage /></Public>} />
                  <Route path="/store" element={<Public><StorePage /></Public>} />
                  <Route path="/checkout" element={<Public><CheckoutPage /></Public>} />
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
                  <Route path="/admin/quizzes" element={<Admin><QuizAdmin /></Admin>} />
                  <Route path="/admin/pages" element={<Admin><PagesAdmin /></Admin>} />
                  <Route path="/admin/categories" element={<Admin><CategoriesAdmin /></Admin>} />
                  <Route path="/admin/tags" element={<Admin><TagsAdmin /></Admin>} />
                  <Route path="/admin/media" element={<Admin><MediaAdmin /></Admin>} />
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
            </FavoritesProvider>
            </CartProvider>
          </ToastProvider>
        </StoreProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
