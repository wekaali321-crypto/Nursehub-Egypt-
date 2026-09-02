import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO, breadcrumbSchema } from "../lib/seo";
import { HighAlertBadges, parseHighAlertTypes } from "../lib/highAlert";
import CrossRefBox from "../components/CrossRefBox";
import PrintButton from "../components/PrintButton";

export default function DrugPage() {
  const { slug } = useParams();
  const { drugs, drugInteractions } = useStore();
  const drug = drugs.find((d) => d.slug === slug);
  const interactions = drug
    ? drugInteractions
        .filter((i) => i.drugAId === drug.id || i.drugBId === drug.id)
        .map((i) => ({ ...i, other: drugs.find((d) => d.id === (i.drugAId === drug.id ? i.drugBId : i.drugAId)) }))
        .filter((i) => i.other)
    : [];

  useSEO({
    title: drug ? `${drug.name} (${drug.genericName}) | دليل الأدوية` : "الدواء غير موجود",
    description: drug ? `${drug.name}: ${drug.indications}` : "",
    keywords: drug ? `${drug.name}, ${drug.genericName}, ${drug.drugClass}, جرعة, تمريض` : "",
    type: "article",
    jsonLd: drug
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Drug",
            name: drug.name,
            activeIngredient: drug.genericName,
            drugClass: drug.drugClass,
            description: drug.indications,
          },
          breadcrumbSchema([
            { name: "الرئيسية", url: window.location.origin },
            { name: "الأدوية", url: `${window.location.origin}/drugs` },
            { name: drug.name, url: window.location.href },
          ]),
        ]
      : undefined,
  });

  if (!drug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">الدواء غير موجود</h1>
        <Link to="/drugs" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">العودة لدليل الأدوية</Link>
      </div>
    );
  }

  const related = drugs.filter((d) => d.category === drug.category && d.id !== drug.id).slice(0, 4);
  const highAlertTypes = parseHighAlertTypes(drug.highAlertType);
  const showHighAlert = drug.isHighAlert || highAlertTypes.length > 0;

  const blocks = [
    { t: "الجرعة", i: "💉", v: drug.dose, c: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-500/5" },
    { t: "دواعي الاستعمال", i: "✅", v: drug.indications, c: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/5" },
    { t: "الآثار الجانبية", i: "⚠️", v: drug.sideEffects, c: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/5" },
    { t: "الاعتبارات التمريضية", i: "🩺", v: drug.nursingConsiderations, c: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-500/5" },
    ...(drug.contraindications ? [{ t: "موانع الاستعمال", i: "🚫", v: drug.contraindications, c: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-500/5" }] : []),
    ...(drug.storage ? [{ t: "التخزين", i: "🧊", v: drug.storage, c: "border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-500/5" }] : []),
    ...(drug.references ? [{ t: "المراجع", i: "📚", v: drug.references, c: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40" }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="print:hidden"><Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: drug.name }]} /></div>
      <div className="mb-3 flex justify-end print:hidden"><PrintButton label="طباعة بطاقة الدواء" /></div>

      <div className="rounded-3xl bg-gradient-to-l from-sky-600 to-emerald-500 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{drug.category}</span>
          {showHighAlert && (
            highAlertTypes.length > 0 ? (
              <HighAlertBadges types={highAlertTypes} />
            ) : (
              <span className="rounded-full bg-rose-500 px-3 py-1 text-sm font-bold">⚠️ دواء عالي الخطورة</span>
            )
          )}
        </div>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{drug.name}</h1>
        <p className="mt-1 text-lg text-sky-50">{drug.genericName} • {drug.drugClass}</p>
      </div>

      <div className="print:hidden"><CrossRefBox table="drugs" id={drug.id} /></div>

      {drug.showImage && drug.imageUrl && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <img src={drug.imageUrl} alt={drug.name} className="mx-auto max-h-80 w-auto rounded-2xl object-contain" />
        </div>
      )}

      {drug.isHighAlert && drug.highAlertWarnings && (
        <div className="mt-6 rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-500/10">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
            <span className="text-xl">⚠️</span> تحذيرات دواء عالي الخطورة
          </h3>
          <p className="leading-relaxed text-rose-800 dark:text-rose-300">{drug.highAlertWarnings}</p>
        </div>
      )}

      <div className="my-6 print:hidden"><AdSlot label="إعلان صفحة الدواء" /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.t} className={`rounded-2xl border p-5 ${b.c}`}>
            <h3 className="mb-2 flex items-center gap-2 font-bold dark:text-white"><span className="text-xl">{b.i}</span>{b.t}</h3>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{b.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-slate-800 dark:bg-amber-500/5 dark:text-amber-400">
        ⚠️ هذه المعلومات لأغراض تعليمية فقط ولا تغني عن استشارة الطبيب أو الصيدلي المختص.
      </div>

      {interactions.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold dark:text-white">🔄 تفاعلات دوائية معروفة</h2>
          <div className="grid gap-3">
            {interactions.map((i) => {
              const sevStyle =
                i.severity === "severe"
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-400"
                  : i.severity === "moderate"
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-400"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300";
              const sevLabel = i.severity === "severe" ? "خطير" : i.severity === "moderate" ? "متوسط" : "بسيط";
              return (
                <div key={i.id} className={`rounded-2xl border p-4 ${sevStyle}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold">مع {i.other!.name}</span>
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold dark:bg-black/20">{sevLabel}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{i.description}</p>
                  {i.management && <p className="mt-1 text-sm font-bold">💡 {i.management}</p>}
                </div>
              );
            })}
          </div>
          <Link to="/drugs/interactions" className="mt-3 inline-block text-sm font-bold text-sky-600 hover:underline">فحص تفاعل مع دواء آخر ←</Link>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10 print:hidden">
          <h2 className="mb-4 text-xl font-bold dark:text-white">أدوية مشابهة في نفس الفئة</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((d) => (
              <Link key={d.id} to={`/drug/${d.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900">
                <div className="font-bold dark:text-white">{d.name}</div>
                <div className="text-sm text-slate-400">{d.genericName}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
