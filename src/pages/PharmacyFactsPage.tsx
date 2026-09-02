import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const CHAPTER_META: Record<number, { title: string; titleEn: string; range: string; rangeEn: string; icon: string; gradient: string }> = {
  1: { title: "الفصل الأول", titleEn: "Chapter 1", range: "المعلومات 1 – 100", rangeEn: "Facts 1 – 100", icon: "📗", gradient: "from-emerald-600 to-teal-500" },
  2: { title: "الفصل الثاني", titleEn: "Chapter 2", range: "المعلومات 101 – 200", rangeEn: "Facts 101 – 200", icon: "📘", gradient: "from-sky-600 to-blue-500" },
  3: { title: "الفصل الثالث", titleEn: "Chapter 3", range: "المعلومات 201 – 300", rangeEn: "Facts 201 – 300", icon: "📙", gradient: "from-amber-600 to-orange-500" },
  4: { title: "الفصل الرابع", titleEn: "Chapter 4", range: "المعلومات 301 – 400", rangeEn: "Facts 301 – 400", icon: "📕", gradient: "from-rose-600 to-red-500" },
  5: { title: "الفصل الخامس", titleEn: "Chapter 5", range: "المعلومات 401 – 500", rangeEn: "Facts 401 – 500", icon: "📓", gradient: "from-violet-600 to-purple-500" },
};

export function PharmacyFactsHome() {
  const { pharmacyFacts, settings } = useStore();
  const { t, lang } = useI18n();

  useSEO({
    title: `${t("facts.libraryTitle")} | ${settings.siteName}`,
    description: t("facts.seoDesc"),
    keywords: "معلومات صيدلانية, pharmacy facts, تمريض",
  });

  const counts: Record<number, number> = {};
  for (const f of pharmacyFacts) counts[f.chapter] = (counts[f.chapter] || 0) + 1;
  const total = pharmacyFacts.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("drugs.title"), path: "/drugs" }, { label: t("facts.pageTitle") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="mb-8 rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-teal-500 p-6 text-white shadow-lg sm:p-10">
        <div className="text-5xl sm:text-6xl">📚</div>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">{t("facts.pageTitle")}</h1>
        <p className="mt-2 max-w-xl text-teal-50">{t("facts.desc")}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
          ✅ {total} {t("facts.availableOf500")}
        </div>
      </div>

      <div className="mb-6"><AdSlot label={t("facts.adLabel")} /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4, 5].map((ch) => {
          const meta = CHAPTER_META[ch];
          const n = counts[ch] || 0;
          const pct = Math.round((n / 100) * 100);
          return (
            <Link
              key={ch}
              to={`/drugs/facts/${ch}`}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${meta.gradient} p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{meta.icon}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{n}/100</span>
              </div>
              <h3 className="mt-4 text-xl font-black">{lang === "en" ? meta.titleEn : meta.title}</h3>
              <p className="text-sm text-white/80">{lang === "en" ? meta.rangeEn : meta.range}</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="mt-3 inline-block text-sm font-bold text-white/90 group-hover:underline">
                {n > 0 ? t("facts.openChapter") : t("facts.comingSoon")}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">{t("mnemonics.backToDrugs")}</Link>
      </div>
    </div>
  );
}

export default function PharmacyFactsChapterPage() {
  const { chapter } = useParams();
  const chNum = Number(chapter) || 1;
  const { pharmacyFacts, settings } = useStore();
  const [q, setQ] = useState("");
  const { t, lang } = useI18n();
  const meta = CHAPTER_META[chNum] || CHAPTER_META[1];
  const chapterTitle = lang === "en" ? meta.titleEn : meta.title;
  const chapterRange = lang === "en" ? meta.rangeEn : meta.range;

  useSEO({
    title: `${chapterTitle} — ${t("facts.pageTitle")} | ${settings.siteName}`,
    description: `${t("facts.seoDesc")} — ${chapterRange}.`,
    keywords: "معلومات صيدلانية, pharmacy facts, تمريض",
  });

  const chapterFacts = useMemo(
    () => pharmacyFacts.filter((f) => f.chapter === chNum).sort((a, b) => a.number - b.number),
    [pharmacyFacts, chNum]
  );
  const filtered = q.trim()
    ? chapterFacts.filter((f) => f.content.toLowerCase().includes(q.trim().toLowerCase()))
    : chapterFacts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("drugs.title"), path: "/drugs" }, { label: t("facts.pageTitle"), path: "/drugs/facts" }, { label: chapterTitle }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className={`mb-6 rounded-3xl bg-gradient-to-l ${meta.gradient} p-6 text-white sm:p-8`}>
        <div className="text-4xl sm:text-5xl">{meta.icon}</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{chapterTitle}</h1>
        <p className="mt-1 text-white/85">{chapterRange} — {chapterFacts.length} {t("facts.available")}</p>
      </div>

      <div className="mb-6"><AdSlot label={t("facts.chapterAdLabel")} /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("facts.searchPlaceholder")}
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-black text-white shadow">{f.number}</span>
              <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>
            <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{bilingual(f.content, f.contentEn, lang).text}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {chapterFacts.length === 0 ? t("facts.noneUploaded") : t("facts.noResults")}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/facts" className="text-sky-600 hover:underline">{t("facts.backToChapters")}</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">{t("facts.toDrugsGuide")}</Link>
      </div>
    </div>
  );
}
