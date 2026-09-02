import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const LABELS = {
  title: { ar: "الأصناف الدوائية (Drug Classifications)", en: "Drug Classifications" },
  drugsBreadcrumb: { ar: "الأدوية", en: "Drugs" },
  breadcrumb: { ar: "الأصناف الدوائية", en: "Drug Classifications" },
  subtitle: { ar: "صنف رئيسي مع الوصف والأمثلة.", en: "major classes with description and examples." },
  searchPlaceholder: { ar: "ابحثي عن صنف دوائي أو مثال...", en: "Search by drug class or example..." },
  examples: { ar: "أمثلة: ", en: "Examples: " },
  noResults: { ar: "مفيش نتائج مطابقة للبحث.", en: "No matching results." },
  back: { ar: "← العودة لدليل الأدوية", en: "← Back to the Drugs Guide" },
};

export default function DrugClassificationsPage() {
  const { drugClassifications, settings } = useStore();
  const { lang } = useI18n();
  const [q, setQ] = useState("");

  useSEO({
    title: `الأصناف الدوائية | ${settings.siteName}`,
    description: "دليل الأصناف الدوائية الرئيسية مع أمثلة على كل صنف — مرجع تمريض شامل.",
    keywords: "drug classifications, أصناف دوائية, تمريض, فارماكولوجي",
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return drugClassifications;
    return drugClassifications.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.examples.toLowerCase().includes(s) ||
        (c.nameEn || "").toLowerCase().includes(s)
    );
  }, [drugClassifications, q]);

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: LABELS.drugsBreadcrumb[lang], path: "/drugs" }, { label: LABELS.breadcrumb[lang] }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-violet-600 to-fuchsia-500 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <div className="text-4xl sm:text-5xl">🧬</div>
          <InlineLangToggle light />
        </div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{LABELS.title[lang]}</h1>
        <p className="mt-1 text-violet-50">{drugClassifications.length} {LABELS.subtitle[lang]}</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان الأصناف الدوائية" /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={LABELS.searchPlaceholder[lang]}
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white">{bilingual(c.name, c.nameEn, lang).text}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{bilingual(c.description, c.descriptionEn, lang).text}</p>
            <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-600 dark:bg-violet-500/10">{LABELS.examples[lang]}{bilingual(c.examples, c.examplesEn, lang).text}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {LABELS.noResults[lang]}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">{LABELS.back[lang]}</Link>
      </div>
    </div>
  );
}
