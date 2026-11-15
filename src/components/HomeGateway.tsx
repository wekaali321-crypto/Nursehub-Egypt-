import { Link } from "react-router-dom";
import { GraduationCap, Stethoscope, HeartPulse, Plane, Zap, Layers, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useSectionAvailability } from "../lib/sections";
import { cardClass, SectionHeader } from "./ui";

type L = { to: string; ar: string; en: string };
type Audience = { icon: typeof GraduationCap; ar: string; en: string; dAr: string; dEn: string; links: L[] };

// Every link is an existing route. /category/* links are dropped automatically when that section has no published article.
const AUDIENCES: Audience[] = [
  {
    icon: GraduationCap, ar: "طالب تمريض", en: "Nursing student", dAr: "أساسيات ومراجعات واختبارات", dEn: "Basics, revision and tests",
    links: [{ to: "/fundamentals", ar: "أسس التمريض", en: "Fundamentals" }, { to: "/anatomy", ar: "التشريح", en: "Anatomy" }, { to: "/terminology", ar: "المصطلحات", en: "Terminology" }, { to: "/cards", ar: "بطاقات المذاكرة", en: "Flashcards" }],
  },
  {
    icon: Stethoscope, ar: "ممرض ممارس", en: "Practising nurse", dAr: "مهارات وأدوية وإجراءات", dEn: "Skills, drugs and procedures",
    links: [{ to: "/category/skills", ar: "المهارات التمريضية", en: "Nursing skills" }, { to: "/drugs", ar: "دليل الأدوية", en: "Drug guide" }, { to: "/tools", ar: "الحاسبات", en: "Calculators" }, { to: "/diseases", ar: "الأمراض", en: "Diseases" }],
  },
  {
    icon: HeartPulse, ar: "تمريض متخصص", en: "Specialty nursing", dAr: "ICU وER وNICU وغيرها", dEn: "ICU, ER, NICU and more",
    links: [{ to: "/icu-nursing", ar: "العناية المركزة", en: "ICU" }, { to: "/er-reception", ar: "الطوارئ", en: "Emergency" }, { to: "/nicu", ar: "الحضّانات", en: "NICU" }, { to: "/dialysis", ar: "الغسيل الكلوي", en: "Dialysis" }],
  },
  {
    icon: Plane, ar: "الترخيص والسفر", en: "Licensing & travel", dAr: "Prometric وDHA وMOH", dEn: "Prometric, DHA and MOH",
    links: [{ to: "/travel-questions", ar: "أسئلة امتحانات السفر", en: "Travel exam questions" }, { to: "/tests/licensure", ar: "محاكي الامتحان", en: "Exam simulator" }, { to: "/interview-questions", ar: "أسئلة المقابلات", en: "Interview questions" }],
  },
];

const TOOLS = [
  { to: "/shift", icon: Zap, ar: "وضع الشيفت", en: "Shift mode", dAr: "أدوية وتوافق محاليل وحاسبات — بيشتغل من غير نت", dEn: "Drugs, IV compatibility and calculators — works offline" },
  { to: "/cards", icon: Layers, ar: "بطاقات المذاكرة", en: "Flashcards", dAr: "مراجعة ذكية بتفكّرك باللي بتنساه", dEn: "Smart review that brings back what you forget" },
  { to: "/tests/licensure", icon: ClipboardCheck, ar: "محاكي الامتحان", en: "Exam simulator", dAr: "امتحان بوقت ونتيجة وشرح لكل سؤال", dEn: "Timed exam with score and explanations" },
];

/** Home page gateway, right under the hero: "who are you / what are you looking for" + the three quick tools. No data, no D1. */
export default function HomeGateway() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { pathAvailable } = useSectionAvailability();
  const Arrow = ar ? ChevronLeft : ChevronRight;
  return (
    <>
      <section aria-labelledby="gw-title" className="bg-nh-surface py-10 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader id="gw-title" title={ar ? "اختار أنت بتدور على إيه" : "What are you looking for?"} subtitle={ar ? "ابدأ من المكان اللي يناسبك" : "Start where it fits you"} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => {
              const links = a.links.filter((l) => pathAvailable(l.to));
              const Icon = a.icon;
              return (
                <div key={a.ar} className={cardClass(false, "flex flex-col p-5")}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nh-navy text-white"><Icon size={24} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-nh-navy dark:text-white">{ar ? a.ar : a.en}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{ar ? a.dAr : a.dEn}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {links.map((l) => (
                      <li key={l.to}>
                        <Link to={l.to} className="flex items-center justify-between rounded-xl bg-nh-surface px-3 py-2.5 text-sm font-bold text-nh-navy transition hover:bg-nh-teal-soft hover:text-nh-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nh-teal dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-teal-500/10">
                          {ar ? l.ar : l.en}<Arrow size={16} aria-hidden="true" className="text-nh-teal" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="qt-title" className="bg-white py-10 dark:bg-slate-900 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader id="qt-title" title={ar ? "أدواتك السريعة" : "Your quick tools"} />
          <div className="grid gap-4 md:grid-cols-3">
            {TOOLS.map((tl) => {
              const Icon = tl.icon;
              return (
                <Link key={tl.to} to={tl.to} className="group flex items-center gap-4 rounded-2xl bg-nh-navy p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-nh-navy-2 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nh-teal focus-visible:ring-offset-2">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-nh-teal"><Icon size={28} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-black">{ar ? tl.ar : tl.en}</span>
                    <span className="mt-0.5 block text-sm text-slate-200">{ar ? tl.dAr : tl.dEn}</span>
                  </span>
                  <Arrow size={20} aria-hidden="true" className="shrink-0 text-teal-200 transition group-hover:translate-x-[-2px]" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
