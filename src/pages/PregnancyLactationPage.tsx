import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchPregnancyLactationSafety,
  type PregnancyLactationSafety,
} from "../lib/pregnancyLactationApi";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const CATEGORY_ORDER = [
  "مسكنات ومضادات التهاب",
  "مضادات حيوية",
  "مضادات التخثر",
  "أدوية القلب والضغط",
  "مضادات الصرع",
  "أدوية نفسية",
  "أدوية السكري والغدة",
  "أخرى عالية الخطورة",
];

const LABELS = {
  loading: { ar: "جارِ التحميل...", en: "Loading..." },
  title: { ar: "أمان الأدوية أثناء الحمل والرضاعة", en: "Drug Safety in Pregnancy & Lactation" },
  subtitle: {
    ar: "تصنيف الأدوية الأكثر شيوعًا حسب أمانها أثناء الحمل والرضاعة — مرجع تعليمي، القرار الطبي النهائي دائمًا لطبيب المريضة المعالج.",
    en: "Classification of the most common medications by their safety during pregnancy and lactation - an educational reference; the final medical decision always rests with the patient's treating physician.",
  },
  drugCount: { ar: "دواء", en: "drugs" },
  searchPlaceholder: { ar: "ابحث عن دواء أو فئة دوائية...", en: "Search by drug or drug class..." },
  fdaNote: {
    ar: "ⓘ التصنيفات الحرفية (A/B/C/D/X) مبنية على نظام FDA الكلاسيكي الشائع تدريسه؛ راجعي دائمًا أحدث الإرشادات وأوامر الطبيب قبل أي قرار.",
    en: "ⓘ The letter categories (A/B/C/D/X) are based on the classic FDA system commonly taught; always check the latest guidelines and the physician's orders before any decision.",
  },
  noResults: { ar: "لا توجد أدوية مطابقة لبحثك.", en: "No matching drugs found." },
  duringPregnancy: { ar: "🤰 أثناء الحمل", en: "🤰 During Pregnancy" },
  duringLactation: { ar: "🤱 أثناء الرضاعة", en: "🤱 During Lactation" },
  keyPoint: { ar: "💡 نقطة مهمة", en: "💡 Key Point" },
};

function pregnancyTone(cat: string | null) {
  if (!cat) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (cat.includes("X")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (cat.includes("D")) return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300";
  if (cat.includes("C")) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function lactationTone(v: string | null) {
  if (!v) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (v.includes("يُمنع")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (v.includes("حذر")) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

function DrugCard({
  item,
  open,
  onToggle,
  lang,
}: {
  item: PregnancyLactationSafety;
  open: boolean;
  onToggle: () => void;
  lang: "ar" | "en";
}) {
  const lactationText = bilingual(item.lactation_safety, item.lactation_safety_en, lang).text;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-right">
        <span className="text-slate-400 dark:text-slate-500">{open ? "▲" : "▼"}</span>
        <div className="flex-1">
          <div className="font-bold text-slate-800 dark:text-white">{bilingual(item.drug_name, item.drug_name_en, lang).text}</div>
          {item.drug_class && (
            <div className="text-xs text-slate-400 dark:text-slate-500">{bilingual(item.drug_class, item.drug_class_en, lang).text}</div>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end">
          {item.pregnancy_category && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pregnancyTone(item.pregnancy_category)}`}>
              🤰 {item.pregnancy_category}
            </span>
          )}
          {lactationText && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lactationTone(item.lactation_safety)}`}>
              🤱 {lactationText}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {item.pregnancy_notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{LABELS.duringPregnancy[lang]}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {bilingual(item.pregnancy_notes, item.pregnancy_notes_en, lang).text}
              </div>
            </div>
          )}
          {item.lactation_notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{LABELS.duringLactation[lang]}</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {bilingual(item.lactation_notes, item.lactation_notes_en, lang).text}
              </div>
            </div>
          )}
          {item.key_point && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-500/10 dark:border-amber-500/20">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">{LABELS.keyPoint[lang]}</div>
              <div className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                {bilingual(item.key_point, item.key_point_en, lang).text}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PregnancyLactationPage() {
  const { lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<PregnancyLactationSafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPregnancyLactationSafety().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter(
      (i) =>
        i.drug_name.toLowerCase().includes(query) ||
        (i.drug_name_en || "").toLowerCase().includes(query) ||
        (i.drug_class || "").toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const cats = Array.from(new Set([...CATEGORY_ORDER, ...filtered.map((i) => i.category)]));
    return cats
      .map((cat) => ({
        category: cat,
        categoryEn: filtered.find((i) => i.category === cat)?.category_en,
        drugs: filtered.filter((i) => i.category === cat),
      }))
      .filter((g) => g.drugs.length > 0);
  }, [filtered]);

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
      <div className="rounded-2xl bg-gradient-to-l from-pink-600 to-fuchsia-700 text-white p-6 mb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤰</span>
            <h1 className="text-xl font-bold">{LABELS.title[lang]}</h1>
          </div>
          <InlineLangToggle light />
        </div>
        <p className="opacity-90 text-xs">{LABELS.subtitle[lang]}</p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} {LABELS.drugCount[lang]}</p>
      </div>

      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={LABELS.searchPlaceholder[lang]}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-pink-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
        {LABELS.fdaNote[lang]}
      </div>

      {grouped.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">{LABELS.noResults[lang]}</div>
      )}

      {grouped.map((g) => (
        <div key={g.category} className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
            {bilingual(g.category, g.categoryEn, lang).text}
          </h2>
          <div className="space-y-3">
            {g.drugs.map((item) => (
              <DrugCard key={item.id} item={item} open={query ? true : openIds.has(item.id)} onToggle={() => toggle(item.id)} lang={lang} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
