/**
 * "ابدأ هنا" guides of the care-plans section: /care-plans/guide/:slug
 * (care-plan, nursing-diagnosis, nursing-process). Static bilingual JSON in public/careplans/guides, no database.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpenCheck, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useSEO } from "../lib/seo";
import { Breadcrumbs } from "../components/common";
import InlineLangToggle from "../components/InlineLangToggle";
import { LOAD_FAILED } from "../lib/loadFailed";
import { GUIDES, fetchCarePlanIndex, fetchGuide, pick, pickList, type CarePlanGuide, type CarePlanIndexItem } from "../lib/carePlansApi";

export default function CarePlanGuidePage() {
  const { slug = "" } = useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [guide, setGuide] = useState<CarePlanGuide | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [plans, setPlans] = useState<CarePlanIndexItem[]>([]);

  useEffect(() => {
    setGuide(undefined); setFailed(false);
    fetchGuide(slug).then(setGuide).catch(() => setFailed(true));
  }, [slug]);
  useEffect(() => {
    fetchCarePlanIndex().then((p) => { if (p !== LOAD_FAILED) setPlans(p); });
  }, []);

  useSEO({
    title: guide ? `${pick(guide.title, ar)} | NurseHub Egypt` : "خطط الرعاية التمريضية | NurseHub Egypt",
    description: guide ? pick(guide.summary, ar) : "",
    type: "article",
  });

  if (failed || guide === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center" dir={ar ? "rtl" : "ltr"}>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{failed ? (ar ? "تعذّر تحميل الدليل. تأكد من الإنترنت." : "Could not load this guide. Check your connection.") : ar ? "الدليل غير موجود." : "Guide not found."}</p>
        <Link to="/care-plans" className="mt-4 inline-block rounded-full bg-teal-700 px-6 py-2 font-bold text-white">{ar ? "رجوع" : "Back"}</Link>
      </div>
    );
  }
  if (guide === undefined) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" /></div>;

  const Next = ar ? ChevronLeft : ChevronRight;
  const linkTitle = (path: string) => {
    const g = GUIDES.find((x) => path === `/care-plans/guide/${x.slug}`);
    if (g) return pick(g.title, ar);
    const p = plans.find((x) => path === `/care-plans/${x.id}`);
    return p ? `${ar ? "مثال: " : "Example: "}${pick(p.title, ar)}` : null;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" dir={ar ? "rtl" : "ltr"}>
      <Breadcrumbs items={[{ label: ar ? "خطط الرعاية التمريضية" : "Nursing Care Plans", path: "/care-plans" }, { label: pick(guide.title, ar) }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="cs-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-white/80"><BookOpenCheck className="h-4 w-4" />{ar ? "ابدأ هنا" : "Start here"}</div>
          <h1 className="mt-2 text-2xl font-black sm:text-4xl">{pick(guide.title, ar)}</h1>
          {ar && <div dir="ltr" className="mt-1 text-right text-sm font-bold text-teal-200">{guide.title.en}</div>}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">{pick(guide.summary, ar)}</p>
        </div>
      </div>

      <nav aria-label={ar ? "المحتويات" : "Contents"} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-2 text-sm font-black text-[#153448] dark:text-white">{ar ? "المحتويات" : "Contents"}</div>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {guide.sections.map((s, i) => (
            <li key={i}><a href={`#s${i + 1}`} className="font-bold text-teal-700 hover:underline dark:text-teal-300">{i + 1}. {pick(s.heading, ar)}</a></li>
          ))}
        </ol>
      </nav>

      <article className="mt-6 space-y-6">
        {guide.sections.map((s, i) => (
          <section key={i} id={`s${i + 1}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black text-[#153448] dark:text-white sm:text-xl">{pick(s.heading, ar)}</h2>
            {pickList(s.paragraphs, ar).map((t, j) => <p key={j} className="mt-3 leading-8 text-slate-700 dark:text-slate-300">{t}</p>)}
            {s.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 ps-6 leading-7 text-slate-700 marker:text-teal-600 dark:text-slate-300">
                {pickList(s.bullets, ar).map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            )}
            {s.table && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead><tr>{s.table.head.map((h, j) => <th key={j} className="border border-slate-300 bg-[#153448] px-3 py-2 text-start font-black text-white dark:border-slate-600">{pick(h, ar)}</th>)}</tr></thead>
                  <tbody>
                    {s.table.rows.map((r, j) => (
                      <tr key={j} className="even:bg-slate-50 dark:even:bg-slate-800/50">
                        {r.map((c, k) => <td key={k} className={`border border-slate-300 px-3 py-2 align-top leading-6 text-slate-700 dark:border-slate-600 dark:text-slate-300 ${k === 0 ? "font-bold" : ""}`}>{pick(c, ar)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {s.example && (
              <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                <Lightbulb className="mt-1 h-4 w-4 shrink-0" /><span>{pick(s.example, ar)}</span>
              </div>
            )}
          </section>
        ))}
      </article>

      {!!guide.related?.length && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-black text-[#153448] dark:text-white">{ar ? "اقرأ كمان" : "Read next"}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {guide.related.map((r) => {
              const t = linkTitle(r.path);
              return t ? (
                <Link key={r.path} to={r.path} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 font-bold text-slate-700 transition hover:border-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span>{t}</span><Next className="h-4 w-4 shrink-0 text-teal-600" />
                </Link>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
