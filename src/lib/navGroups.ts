/**
 * Site navigation groups (desktop mega menu + mobile drawer). Every link points to a route that exists in App.tsx.
 * Links to /category/<x> are hidden automatically when that section has no published article (useSectionAvailability),
 * and feature-flagged modules (store, exams, care plans…) hide when switched off in the admin panel.
 */
import type { FeatureToggles } from "./types";

export type NavLink = { to: string; ar: string; en: string; feature?: keyof FeatureToggles };
export type NavGroup = { id: string; ar: string; en: string; links: NavLink[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "learn", ar: "التعلم", en: "Learn",
    links: [
      { to: "/category/articles", ar: "المقالات", en: "Articles" },
      { to: "/category/skills", ar: "المهارات التمريضية", en: "Nursing skills" },
      { to: "/fundamentals", ar: "أسس التمريض", en: "Fundamentals" },
      { to: "/diseases", ar: "الأمراض للتمريض", en: "Diseases" },
      { to: "/cases", ar: "الحالات السريرية", en: "Clinical cases" },
      { to: "/care-plans", ar: "خطط الرعاية التمريضية", en: "Nursing care plans", feature: "carePlans" },
      { to: "/category/summaries", ar: "الملخصات", en: "Summaries" },
      { to: "/anatomy", ar: "التشريح", en: "Anatomy" },
      { to: "/terminology", ar: "المصطلحات الطبية", en: "Medical terminology" },
      { to: "/courses", ar: "الكورسات", en: "Courses", feature: "courses" },
    ],
  },
  {
    id: "specialties", ar: "التخصصات", en: "Specialties",
    links: [
      { to: "/icu-nursing", ar: "العناية المركزة ICU", en: "ICU" },
      { to: "/er-reception", ar: "الاستقبال والطوارئ", en: "Emergency" },
      { to: "/pediatrics", ar: "الأطفال", en: "Pediatrics" },
      { to: "/nicu", ar: "الحضّانات NICU", en: "NICU" },
      { to: "/dialysis", ar: "الغسيل الكلوي", en: "Dialysis" },
      { to: "/obgyn", ar: "النساء والتوليد", en: "OB/GYN" },
      { to: "/operating-room", ar: "العمليات", en: "Operating room" },
      { to: "/radiology", ar: "الأشعة", en: "Radiology" },
      { to: "/first-aid", ar: "الإسعافات الأولية", en: "First aid" },
      { to: "/ecg", ar: "رسم القلب ECG", en: "ECG" },
    ],
  },
  {
    id: "drugs", ar: "الأدوية", en: "Drugs",
    links: [
      { to: "/drugs", ar: "دليل الأدوية", en: "Drug guide", feature: "drugGuide" },
      { to: "/drugs/high-alert-ref", ar: "الأدوية عالية الخطورة", en: "High-alert drugs" },
      { to: "/drugs/lasa", ar: "الأدوية المتشابهة LASA", en: "Look-alike / sound-alike" },
      { to: "/drugs/iv-compatibility", ar: "توافق المحاليل", en: "IV compatibility" },
      { to: "/drugs/interactions", ar: "التداخلات الدوائية", en: "Interactions", feature: "drugGuide" },
      { to: "/pharmacology", ar: "الفارماكولوجي", en: "Pharmacology" },
    ],
  },
  {
    id: "study", ar: "الدراسة والاختبارات", en: "Study & exams",
    links: [
      { to: "/cards", ar: "بطاقات المذاكرة", en: "Flashcards" },
      { to: "/tests/licensure", ar: "محاكي الامتحان", en: "Exam simulator" },
      { to: "/travel-questions", ar: "أسئلة السفر (Prometric / DHA / MOH)", en: "Travel exams (Prometric / DHA / MOH)" },
      { to: "/quizzes", ar: "الاختبارات القصيرة", en: "Quizzes", feature: "exams" },
      { to: "/interview-questions", ar: "أسئلة المقابلات", en: "Interview questions" },
    ],
  },
  {
    id: "tools", ar: "الأدوات", en: "Tools",
    links: [
      { to: "/shift", ar: "وضع الشيفت", en: "Shift mode" },
      { to: "/tools", ar: "الحاسبات التمريضية", en: "Clinical calculators" },
      { to: "/drugs/prescriptions", ar: "الروشتات الشائعة", en: "Common prescriptions" },
    ],
  },
  {
    id: "store", ar: "المتجر", en: "Store",
    links: [
      { to: "/store", ar: "الكتب وملفات PDF", en: "Books & PDFs", feature: "store" },
      { to: "/category/books", ar: "الكتب", en: "Books", feature: "store" },
    ],
  },
];

/** Every path already covered by a group (admin menu items outside these go to "More"). */
export const GROUPED_PATHS = new Set(["/", ...NAV_GROUPS.flatMap((g) => g.links.map((l) => l.to))]);

/** Which group the current page belongs to (for the active state). */
export function groupOf(pathname: string): string | null {
  for (const g of NAV_GROUPS) for (const l of g.links) if (pathname === l.to || (l.to !== "/drugs" && pathname.startsWith(l.to + "/"))) return g.id;
  if (pathname.startsWith("/drug")) return "drugs";
  return null;
}
