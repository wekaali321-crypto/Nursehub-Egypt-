import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";

const CHAPTER_META: Record<number, { title: string; range: string; icon: string; gradient: string }> = {
  1: { title: "الفصل الأول", range: "المعلومات 1 – 100", icon: "📗", gradient: "from-emerald-600 to-teal-500" },
  2: { title: "الفصل الثاني", range: "المعلومات 101 – 200", icon: "📘", gradient: "from-sky-600 to-blue-500" },
  3: { title: "الفصل الثالث", range: "المعلومات 201 – 300", icon: "📙", gradient: "from-amber-600 to-orange-500" },
  4: { title: "الفصل الرابع", range: "المعلومات 301 – 400", icon: "📕", gradient: "from-rose-600 to-red-500" },
  5: { title: "الفصل الخامس", range: "المعلومات 401 – 500", icon: "📓", gradient: "from-violet-600 to-purple-500" },
};

export function PharmacyFactsHome() {
  const { pharmacyFacts, settings } = useStore();

  useSEO({
    title: `مكتبة المعلومات الصيدلانية | ${settings.siteName}`,
    description: "مكتبة معلومات صيدلانية وطبية عملية، مقسّمة على 5 فصول.",
    keywords: "معلومات صيدلانية, pharmacy facts, تمريض",
  });

  const counts: Record<number, number> = {};
  for (const f of pharmacyFacts) counts[f.chapter] = (counts[f.chapter] || 0) + 1;
  const total = pharmacyFacts.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "معلومات صيدلانية" }]} />

      <div className="mb-8 rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-teal-500 p-6 text-white shadow-lg sm:p-10">
        <div className="text-5xl sm:text-6xl">📚</div>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">المعلومات الصيدلانية</h1>
        <p className="mt-2 max-w-xl text-teal-50">
          مجموعة معلومات وأسئلة وأجوبة صيدلانية عملية، مقسّمة على 5 فصول — كل فصل فيه 100 معلومة.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
          ✅ {total} معلومة متاحة من أصل 500
        </div>
      </div>

      <div className="mb-6"><AdSlot label="إعلان مكتبة المعلومات" /></div>

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
              <h3 className="mt-4 text-xl font-black">{meta.title}</h3>
              <p className="text-sm text-white/80">{meta.range}</p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="mt-3 inline-block text-sm font-bold text-white/90 group-hover:underline">
                {n > 0 ? "افتحي الفصل ←" : "لسه هيتضاف قريب"}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}

export default function PharmacyFactsChapterPage() {
  const { chapter } = useParams();
  const chNum = Number(chapter) || 1;
  const { pharmacyFacts, settings } = useStore();
  const [q, setQ] = useState("");
  const meta = CHAPTER_META[chNum] || CHAPTER_META[1];

  useSEO({
    title: `${meta.title} — معلومات صيدلانية | ${settings.siteName}`,
    description: `معلومات صيدلانية وطبية عملية — ${meta.range}.`,
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
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "معلومات صيدلانية", path: "/drugs/facts" }, { label: meta.title }]} />

      <div className={`mb-6 rounded-3xl bg-gradient-to-l ${meta.gradient} p-6 text-white sm:p-8`}>
        <div className="text-4xl sm:text-5xl">{meta.icon}</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{meta.title}</h1>
        <p className="mt-1 text-white/85">{meta.range} — {chapterFacts.length} معلومة متاحة</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان الفصل" /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحثي في معلومات هذا الفصل..."
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-black text-white shadow">{f.number}</span>
              <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>
            <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{f.content}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            {chapterFacts.length === 0 ? "لسه معملتش رفع معلومات الفصل ده." : "مفيش نتائج مطابقة للبحث."}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/facts" className="text-sky-600 hover:underline">← كل الفصول</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">دليل الأدوية ←</Link>
      </div>
    </div>
  );
}
