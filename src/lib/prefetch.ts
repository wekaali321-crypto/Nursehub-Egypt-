/**
 * Load a page's code while the visitor is about to open it (hover, touch, keyboard focus on a link), so the page appears
 * immediately on click. Generated from the public routes in App.tsx (same import paths → same chunks, nothing duplicated).
 * Only code (JS) is prefetched — never data, so it costs no D1 / Supabase reads.
 */
import { matchPath } from "react-router-dom";

const L = {
  AnatomyPage: () => import("../pages/AnatomyPage"),
  AppliedPharmPage: () => import("../pages/AppliedPharmPage"),
  ArticlePage: () => import("../pages/ArticlePage"),
  CardiacMedsPage: () => import("../pages/CardiacMedsPage"),
  CardsPage: () => import("../pages/CardsPage"),
  CasesPage: () => import("../pages/CasesPage"),
  CarePlansPage: () => import("../pages/CarePlansPage"),
  CategoryPage: () => import("../pages/CategoryPage"),
  CheckoutPage: () => import("../pages/CheckoutPage"),
  ClinicalProtocolsPage: () => import("../pages/ClinicalProtocolsPage"),
  CoursesPage: () => import("../pages/CoursesPage"),
  DialysisPage: () => import("../pages/DialysisPage"),
  DiseasesPage: () => import("../pages/DiseasesPage"),
  DrugAntidotesPage: () => import("../pages/DrugAntidotesPage"),
  DrugClassificationsPage: () => import("../pages/DrugClassificationsPage"),
  DrugInteractionsPage: () => import("../pages/DrugInteractionsPage"),
  DrugPage: () => import("../pages/DrugPage"),
  DrugSafetyCenterPage: () => import("../pages/DrugSafetyCenterPage"),
  DrugSuffixesPage: () => import("../pages/DrugSuffixesPage"),
  DrugsHubPage: () => import("../pages/DrugsHubPage"),
  DrugsPage: () => import("../pages/DrugsPage"),
  ECGPage: () => import("../pages/ECGPage"),
  ERMedicationsPage: () => import("../pages/ERMedicationsPage"),
  ERReceptionPage: () => import("../pages/ERReceptionPage"),
  FavoritesPage: () => import("../pages/FavoritesPage"),
  FirstAidPage: () => import("../pages/FirstAidPage"),
  FundamentalsPage: () => import("../pages/FundamentalsPage"),
  HighAlertRefPage: () => import("../pages/HighAlertRefPage"),
  Home: () => import("../pages/Home"),
  ICUMedicationsPage: () => import("../pages/ICUMedicationsPage"),
  ICUNursingPage: () => import("../pages/ICUNursingPage"),
  IVCompatibilityPage: () => import("../pages/IVCompatibilityPage"),
  InterviewQuestionsPage: () => import("../pages/InterviewQuestionsPage"),
  LasaPage: () => import("../pages/LasaPage"),
  LicensureExamPage: () => import("../pages/LicensureExamPage"),
  MonetizationPage: () => import("../pages/MonetizationPage"),
  NICUPage: () => import("../pages/NICUPage"),
  OTCGuidePage: () => import("../pages/OTCGuidePage"),
  ObgynPage: () => import("../pages/ObgynPage"),
  OperatingRoomPage: () => import("../pages/OperatingRoomPage"),
  OrderStatusPage: () => import("../pages/OrderStatusPage"),
  OrganDoseAdjustmentsPage: () => import("../pages/OrganDoseAdjustmentsPage"),
  PediatricsPage: () => import("../pages/PediatricsPage"),
  PedsMedicationsPage: () => import("../pages/PedsMedicationsPage"),
  PharmacologyPage: () => import("../pages/PharmacologyPage"),
  PregnancyLactationPage: () => import("../pages/PregnancyLactationPage"),
  ProductPage: () => import("../pages/ProductPage"),
  QuizAnalyticsPage: () => import("../pages/QuizAnalyticsPage"),
  QuizPlayer: () => import("../pages/QuizPlayer"),
  QuizReviewPage: () => import("../pages/QuizReviewPage"),
  QuizzesPage: () => import("../pages/QuizzesPage"),
  RadiologyPage: () => import("../pages/RadiologyPage"),
  RxPrescriptionsPage: () => import("../pages/RxPrescriptionsPage"),
  SearchPage: () => import("../pages/SearchPage"),
  ShiftPage: () => import("../pages/ShiftPage"),
  StorePage: () => import("../pages/StorePage"),
  StudentDashboard: () => import("../pages/StudentDashboard"),
  TerminologyPage: () => import("../pages/TerminologyPage"),
  ToolsPage: () => import("../pages/ToolsPage"),
  TravelQuestionsPage: () => import("../pages/TravelQuestionsPage"),
};

const ROUTES: Array<[string, () => Promise<unknown>]> = [
  ["/", L.Home],
  ["/category/:cat", L.CategoryPage],
  ["/category/:cat/:sub", L.CategoryPage],
  ["/article/:slug", L.ArticlePage],
  ["/drugs", L.DrugsHubPage],
  ["/drugs/all", L.DrugsPage],
  ["/drugs/interactions", L.DrugInteractionsPage],
  ["/drugs/antidotes", L.DrugAntidotesPage],
  ["/drugs/classifications", L.DrugClassificationsPage],
  ["/drugs/suffixes", L.DrugSuffixesPage],
  ["/drugs/cardiac", L.CardiacMedsPage],
  ["/drugs/otc-guide", L.OTCGuidePage],
  ["/drugs/otc-guide/:id", L.OTCGuidePage],
  ["/drugs/applied-pharm", L.AppliedPharmPage],
  ["/drugs/applied-pharm/topic/:topic", L.AppliedPharmPage],
  ["/drugs/applied-pharm/plan/:id", L.AppliedPharmPage],
  ["/drugs/icu-medications", L.ICUMedicationsPage],
  ["/drugs/icu-medications/:id", L.ICUMedicationsPage],
  ["/drugs/er-medications", L.ERMedicationsPage],
  ["/drugs/er-medications/:id", L.ERMedicationsPage],
  ["/drugs/peds-medications", L.PedsMedicationsPage],
  ["/drugs/peds-medications/:id", L.PedsMedicationsPage],
  ["/drugs/high-alert-ref", L.HighAlertRefPage],
  ["/drugs/lasa", L.LasaPage],
  ["/drugs/organ-dose", L.OrganDoseAdjustmentsPage],
  ["/drugs/pregnancy-lactation", L.PregnancyLactationPage],
  ["/drugs/safety-center", L.DrugSafetyCenterPage],
  ["/drugs/iv-compatibility", L.IVCompatibilityPage],
  ["/drugs/prescriptions", L.RxPrescriptionsPage],
  ["/drugs/prescriptions/:id", L.RxPrescriptionsPage],
  ["/drugs/protocols/:id", L.ClinicalProtocolsPage],
  ["/icu-nursing", L.ICUNursingPage],
  ["/icu-nursing/print-all", L.ICUNursingPage],
  ["/icu-nursing/:id", L.ICUNursingPage],
  ["/dialysis", L.DialysisPage],
  ["/dialysis/:id", L.DialysisPage],
  ["/radiology", L.RadiologyPage],
  ["/radiology/:id", L.RadiologyPage],
  ["/nicu", L.NICUPage],
  ["/nicu/:id", L.NICUPage],
  ["/pharmacology", L.PharmacologyPage],
  ["/pharmacology/:id", L.PharmacologyPage],
  ["/terminology", L.TerminologyPage],
  ["/terminology/:id", L.TerminologyPage],
  ["/first-aid", L.FirstAidPage],
  ["/first-aid/:id", L.FirstAidPage],
  ["/er-reception", L.ERReceptionPage],
  ["/er-reception/:id", L.ERReceptionPage],
  ["/pediatrics", L.PediatricsPage],
  ["/pediatrics/:id", L.PediatricsPage],
  ["/anatomy", L.AnatomyPage],
  ["/anatomy/:id", L.AnatomyPage],
  ["/fundamentals", L.FundamentalsPage],
  ["/fundamentals/:id", L.FundamentalsPage],
  ["/operating-room", L.OperatingRoomPage],
  ["/operating-room/:id", L.OperatingRoomPage],
  ["/obgyn", L.ObgynPage],
  ["/obgyn/:id", L.ObgynPage],
  ["/drug/:slug", L.DrugPage],
  ["/quizzes", L.QuizzesPage],
  ["/quizzes/analytics", L.QuizAnalyticsPage],
  ["/quizzes/review", L.QuizReviewPage],
  ["/quiz/:id", L.QuizPlayer],
  ["/quiz-mode/:mode", L.QuizPlayer],
  ["/tests/licensure", L.LicensureExamPage],
  ["/tests/licensure/:categoryId", L.LicensureExamPage],
  ["/tests/licensure/:categoryId/:examId", L.LicensureExamPage],
  ["/interview-questions", L.InterviewQuestionsPage],
  ["/travel-questions", L.TravelQuestionsPage],
  ["/travel-questions/:categoryId", L.TravelQuestionsPage],
  ["/care-plans", L.CarePlansPage],
  ["/care-plans/:id", L.CarePlansPage],
  ["/cases", L.CasesPage],
  ["/cases/guide/:id", L.CasesPage],
  ["/cases/:id", L.CasesPage],
  ["/diseases", L.DiseasesPage],
  ["/diseases/:id", L.DiseasesPage],
  ["/guide/:id", L.DiseasesPage],
  ["/section/:slug", L.DiseasesPage],
  ["/courses", L.CoursesPage],
  ["/courses/:courseId", L.CoursesPage],
  ["/courses/:courseId/chapter/:chapterId", L.CoursesPage],
  ["/courses/:courseId/quiz", L.CoursesPage],
  ["/search", L.SearchPage],
  ["/tools", L.ToolsPage],
  ["/shift", L.ShiftPage],
  ["/cards", L.CardsPage],
  ["/ecg", L.ECGPage],
  ["/store", L.StorePage],
  ["/checkout", L.CheckoutPage],
  ["/order/:invoiceNo", L.OrderStatusPage],
  ["/product/:id", L.ProductPage],
  ["/favorites", L.FavoritesPage],
  ["/dashboard", L.StudentDashboard],
  ["/monetization", L.MonetizationPage],
];

const done = new Set<() => Promise<unknown>>();

export function prefetchPath(pathname: string): void {
  for (const [pattern, load] of ROUTES) {
    if (!matchPath({ path: pattern, end: true }, pathname)) continue;
    if (!done.has(load)) { done.add(load); load().catch(() => done.delete(load)); }
    return;
  }
}

/** One delegated listener for the whole app. Skips slow / data-saver connections. */
export function installLinkPrefetch(): () => void {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || "")) return () => {};
  const onIntent = (e: Event) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.origin !== location.origin) return;
    prefetchPath(a.pathname);
  };
  const opts: AddEventListenerOptions = { passive: true, capture: true };
  document.addEventListener("pointerover", onIntent, opts);
  document.addEventListener("touchstart", onIntent, opts);
  document.addEventListener("focusin", onIntent, opts);
  return () => {
    document.removeEventListener("pointerover", onIntent, opts);
    document.removeEventListener("touchstart", onIntent, opts);
    document.removeEventListener("focusin", onIntent, opts);
  };
}
