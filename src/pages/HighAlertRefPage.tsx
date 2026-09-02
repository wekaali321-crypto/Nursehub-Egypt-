import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchHighAlertRef, type HighAlertRefCategory } from "../lib/highAlertRefApi";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const LABELS = {
  loading: { ar: "جارِ التحميل...", en: "Loading..." },
  title: { ar: "الأدوية عالية التنبيه", en: "High-Alert Medications" },
  subtitle: { ar: "مبني على قائمة ISMP العالمية لأدوية عالية الخطورة", en: "Based on the global ISMP List of High-Alert Medications" },
  searchPlaceholder: { ar: "ابحث عن دواء أو فئة...", en: "Search by drug or category..." },
  bannerTitle: { ar: "أدوية تتطلب حذراً خاصاً", en: "Medications requiring special caution" },
  categoryCount: { ar: "فئة", en: "categories" },
  drugCount: { ar: "دواء", en: "drugs" },
  disclaimer: {
    ar: "ⓘ مرجع تعليمي مبني على ISMP List of High-Alert Medications in Acute Care Settings. تحقّقي دائماً من بروتوكول مؤسستك وأوامر الطبيب. هذه الأدوية تسبب أذىً خطيراً عند الخطأ في استخدامها.",
    en: "ⓘ An educational reference based on the ISMP List of High-Alert Medications in Acute Care Settings. Always check your institution's protocol and the physician's orders. These medications cause serious harm when used incorrectly.",
  },
  noResults: { ar: "لا توجد نتائج مطابقة لبحثك.", en: "No matching results." },
  drugsLabel: { ar: "💊 الأدوية", en: "💊 Medications" },
  safetyStrategy: { ar: "🛡 استراتيجية الأمان", en: "🛡 Safety Strategy" },
};

function CategoryCard({
  cat,
  open,
  onToggle,
  highlightDrugs,
  lang,
}: {
  cat: HighAlertRefCategory;
  open: boolean;
  onToggle: () => void;
  highlightDrugs: string[] | null;
  lang: "ar" | "en";
}) {
  const drugsSource = lang === "en" && cat.drugs_en && cat.drugs_en.length > 0 ? cat.drugs_en : cat.drugs;
  const drugsToShow = highlightDrugs ?? drugsSource;
  return (
    <div className="rounded-2xl border border-red-100 bg-white overflow-hidden dark:bg-slate-900 dark:border-red-500/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-right"
      >
        <span className="text-xl">{open ? "▲" : "▼"}</span>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-800 dark:text-white">{bilingual(cat.category_ar, cat.category_en, lang).text}</div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">{cat.drugs.length} {LABELS.drugCount[lang]}</div>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-2xl dark:bg-red-500/10">
            {cat.icon || "⚠️"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">{LABELS.drugsLabel[lang]}</div>
            <ul className="space-y-1.5">
              {drugsToShow.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {cat.safety_strategy && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 dark:bg-red-500/10 dark:border-red-500/20">
              <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">{LABELS.safetyStrategy[lang]}</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {bilingual(cat.safety_strategy, cat.safety_strategy_en, lang).text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HighAlertRefPage() {
  const { lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<HighAlertRefCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHighAlertRef().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return items.map((c) => ({ cat: c, matchDrugs: null as string[] | null }));
    return items
      .map((c) => {
        const catMatch =
          c.category_ar.toLowerCase().includes(query) ||
          (c.category_en || "").toLowerCase().includes(query);
        const drugsSource = lang === "en" && c.drugs_en && c.drugs_en.length > 0 ? c.drugs_en : c.drugs;
        const matchingDrugs = drugsSource.filter((d) => d.toLowerCase().includes(query));
        if (catMatch) return { cat: c, matchDrugs: null as string[] | null };
        if (matchingDrugs.length) return { cat: c, matchDrugs: matchingDrugs };
        return null;
      })
      .filter((x): x is { cat: HighAlertRefCategory; matchDrugs: string[] | null } => x !== null);
  }, [items, query, lang]);

  const totalDrugs = items.reduce((sum, c) => sum + c.drugs.length, 0);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.loading[lang]}</div>;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-red-600 to-orange-600 text-white p-6 mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <h1 className="text-xl font-bold">{LABELS.title[lang]}</h1>
            <p className="opacity-90 text-xs mt-0.5">{LABELS.subtitle[lang]}</p>
          </div>
        </div>
        <InlineLangToggle light />
      </div>

      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={LABELS.searchPlaceholder[lang]}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-red-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      <div className="rounded-2xl bg-gradient-to-l from-red-600 to-rose-700 text-white p-5 mb-4">
        <div className="flex items-center gap-2 font-bold mb-2">
          <span className="text-xl">⚠️</span>
          {LABELS.bannerTitle[lang]}
        </div>
        <div className="flex gap-4 text-sm opacity-95">
          <span>📂 {items.length} {LABELS.categoryCount[lang]}</span>
          <span>💊 {totalDrugs} {LABELS.drugCount[lang]}</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
        {LABELS.disclaimer[lang]}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">{LABELS.noResults[lang]}</div>
      )}

      <div className="space-y-3">
        {filtered.map(({ cat, matchDrugs }) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            open={query ? true : openIds.has(cat.id)}
            onToggle={() => toggle(cat.id)}
            highlightDrugs={matchDrugs}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
