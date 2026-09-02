import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const LABELS = {
  title: { ar: "الترياقات الطبية (Antidotes)", en: "Medical Antidotes" },
  drugsBreadcrumb: { ar: "الأدوية", en: "Drugs" },
  breadcrumb: { ar: "الترياقات", en: "Antidotes" },
  subtitle: { ar: "حالة تسمم مع الترياق المناسب لها — مرجع سريع للطوارئ.", en: "poisoning cases with their matching antidote - a quick ER reference." },
  searchPlaceholder: { ar: "ابحثي عن مادة سامة أو ترياق...", en: "Search by toxin or antidote..." },
  noResults: { ar: "مفيش نتائج مطابقة للبحث.", en: "No matching results." },
  back: { ar: "← العودة لدليل الأدوية", en: "← Back to the Drugs Guide" },
};

export default function DrugAntidotesPage() {
  const { drugAntidotes, settings } = useStore();
  const { lang } = useI18n();
  const [q, setQ] = useState("");

  useSEO({
    title: `الترياقات الطبية | ${settings.siteName}`,
    description: "دليل الترياقات الطبية (Antidotes) لأشهر حالات التسمم الدوائي، مرجع سريع للتمريض.",
    keywords: "antidotes, ترياقات, تسمم دوائي, تمريض",
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return drugAntidotes;
    return drugAntidotes.filter(
      (a) =>
        a.toxin.toLowerCase().includes(s) ||
        a.antidotes.toLowerCase().includes(s) ||
        (a.toxinEn || "").toLowerCase().includes(s) ||
        (a.antidotesEn || "").toLowerCase().includes(s)
    );
  }, [drugAntidotes, q]);

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: LABELS.drugsBreadcrumb[lang], path: "/drugs" }, { label: LABELS.breadcrumb[lang] }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-600 to-teal-500 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <div className="text-4xl sm:text-5xl">🧪</div>
          <InlineLangToggle light />
        </div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{LABELS.title[lang]}</h1>
        <p className="mt-1 text-emerald-50">{drugAntidotes.length} {LABELS.subtitle[lang]}</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان الترياقات" /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={LABELS.searchPlaceholder[lang]}
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">{bilingual(a.toxin, a.toxinEn, lang).text}</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10">💊 {bilingual(a.antidotes, a.antidotesEn, lang).text}</span>
            </div>
            {a.notes && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{bilingual(a.notes, a.notesEn, lang).text}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {LABELS.noResults[lang]}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">{LABELS.back[lang]}</Link>
      </div>
    </div>
  );
}
