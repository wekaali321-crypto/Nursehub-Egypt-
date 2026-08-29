import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import type { OTCCondition } from "../lib/types";

const CATEGORY_GRADIENT: Record<string, string> = {
  "تنفسي": "from-sky-600 to-cyan-500",
  "هضمي": "from-amber-600 to-orange-500",
  "جلدية": "from-pink-600 to-rose-500",
  "عظام ومفاصل": "from-slate-600 to-slate-800",
  "فم وأسنان": "from-teal-600 to-cyan-600",
  "مسالك بولية": "from-indigo-600 to-violet-500",
  "نسائية": "from-fuchsia-600 to-pink-500",
  "أخرى": "from-emerald-600 to-green-500",
};
const DEFAULT_GRADIENT = "from-emerald-700 to-teal-500";

export function OTCGuideHome() {
  const { otcConditions, settings } = useStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useSEO({
    title: `حالات شائعة وعلاجها | ${settings.siteName}`,
    description: "دليل سريع لأشهر الحالات في الصيدلية: الأعراض، الأسئلة المهمة قبل الصرف، العلاج، وعلامات الخطر.",
    keywords: "OTC, حالات شائعة, صيدلية, تمريض, علاج",
  });

  const categories = useMemo(
    () => Array.from(new Set(otcConditions.map((c) => c.category))),
    [otcConditions]
  );

  const filtered = useMemo(() => {
    const list = otcConditions
      .filter((c) => !activeCategory || c.category === activeCategory)
      .filter(
        (c) =>
          !search.trim() ||
          c.nameAr.includes(search) ||
          c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          c.summary.includes(search)
      );
    return [...list].sort((a, b) => a.orderNum - b.orderNum);
  }, [otcConditions, search, activeCategory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "حالات شائعة وعلاجها" }]} />

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-green-500 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-5xl sm:text-6xl">🩺</div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">حالات شائعة وعلاجها</h1>
          <p className="mt-2 max-w-2xl text-teal-50">
            دليل سريع لأشهر الحالات اللي بتتعرض في الصيدلية: الأعراض، الأسئلة المهمة قبل الصرف،
            العلاج، وعلامات الخطر اللي تستوجب تحويل المريض للطبيب فورًا.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
            ✅ {otcConditions.length} حالة موثّقة
          </div>
        </div>
      </div>

      <div className="mb-6"><AdSlot label="إعلان حالات شائعة" /></div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 دوّر باسم الحالة..."
        className="mb-4 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
            activeCategory === null
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              activeCategory === cat
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c) => {
          const gradient = CATEGORY_GRADIENT[c.category] || DEFAULT_GRADIENT;
          return (
            <Link
              key={c.id}
              to={`/drugs/otc-guide/${c.id}`}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <span className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="relative flex items-start gap-3">
                <span className="text-3xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black leading-tight">{c.nameAr}</h3>
                  <p className="text-xs text-white/70">{c.nameEn}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/85">{c.summary}</p>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{c.category}</span>
                <span className="text-sm font-bold text-white/90 group-hover:underline">التفاصيل ←</span>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {otcConditions.length === 0 ? "لسه معملتش رفع الحالات." : "مفيش نتائج مطابقة."}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: string;
  title: string;
  children: string;
  tone?: "default" | "red" | "amber";
}) {
  if (!children || children === "—") return null;
  const tones: Record<string, string> = {
    default: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    red: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <h3 className="mb-2 flex items-center gap-2 font-black text-slate-800 dark:text-white">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  );
}

export default function OTCConditionPage() {
  const { id } = useParams();
  const { otcConditions, settings } = useStore();
  const condition = useMemo<OTCCondition | undefined>(
    () => otcConditions.find((c) => c.id === id),
    [otcConditions, id]
  );

  useSEO({
    title: condition ? `${condition.nameAr} | ${settings.siteName}` : `حالات شائعة | ${settings.siteName}`,
    description: condition?.summary ?? "دليل حالات شائعة وعلاجها.",
    keywords: `${condition?.nameAr ?? ""}, OTC, تمريض, صيدلية`,
  });

  if (!condition) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">الحالة دي مش موجودة.</p>
        <Link to="/drugs/otc-guide" className="font-bold text-emerald-600 hover:underline">
          الرجوع لقائمة الحالات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "الأدوية", path: "/drugs" },
          { label: "حالات شائعة وعلاجها", path: "/drugs/otc-guide" },
          { label: condition.nameAr },
        ]}
      />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-green-500 p-6 text-white sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            {condition.icon}
          </div>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">{condition.nameAr}</h1>
            <p className="text-white/80">{condition.nameEn}</p>
          </div>
        </div>
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
          {condition.category}
        </span>
      </div>

      <div className="mb-6"><AdSlot label="إعلان صفحة الحالة" /></div>

      <div className="space-y-4">
        <Section icon="📝" title="الملخص">{condition.summary}</Section>
        <Section icon="🩺" title="الأعراض">{condition.symptoms}</Section>
        <Section icon="❓" title="الأسئلة المهمة قبل الصرف" tone="amber">{condition.keyQuestions}</Section>
        <Section icon="🚨" title="علامات الخطر — تحويل فوري للطبيب" tone="red">{condition.redFlags}</Section>
        <Section icon="💊" title="العلاج">{condition.treatment}</Section>
        <Section icon="💡" title="نصائح للمريض">{condition.patientAdvice}</Section>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/otc-guide" className="text-sky-600 hover:underline">← كل الحالات</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">دليل الأدوية ←</Link>
      </div>
    </div>
  );
}
