import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchERReceptionTopics, type ERReceptionTopic } from "../lib/erReceptionTopicsApi";

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export function ERReceptionHome() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("nav.erReception")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<ERReceptionTopic[] | null>(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchERReceptionTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  const categories = Array.from(new Set((topics || []).map((tp) => tp.category).filter(Boolean))) as string[];
  const list = category === "all" ? topics || [] : (topics || []).filter((tp) => tp.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.erReception") }]} />

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-red-700 via-rose-600 to-amber-500 p-8 text-white shadow-lg">
        <div className="text-5xl">🚨</div>
        <h1 className="mt-3 text-3xl font-black">{t("nav.erReception")}</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          {isEn
            ? "A complete reference for the Emergency Reception Department: patient triage, receiving wound cases, suturing skills, IV fluids, common medical emergencies, and surgical & trauma emergencies."
            : "مرجع شامل لقسم الاستقبال والطوارئ: فرز المرضى، استقبال حالات الجروح، مهارات الخياطة الجراحية، المحاليل الوريدية، الحالات الطبية الشائعة، والحالات الجراحية والإصابات في الطوارئ."}
        </p>
      </div>

      <Link
        to="/drugs/er-medications"
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-500/40 dark:bg-amber-500/10"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">💊</div>
          <div>
            <div className="font-black text-amber-700 dark:text-amber-400">
              {isEn ? "Looking for emergency drug doses?" : "بتدوّر على جرعات أدوية الطوارئ؟"}
            </div>
            <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">
              {isEn
                ? "Full ER medications reference (doses, indications & contraindications) lives in its own dedicated page."
                : "مرجع أدوية الطوارئ الكامل (الجرعات ودواعي وموانع الاستعمال) موجود في صفحته المخصصة تفاديًا لتكرار المحتوى."}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white">
          {isEn ? "Open ER Medications →" : "افتح أدوية الطوارئ ←"}
        </div>
      </Link>

      {categories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === "all" ? "bg-red-700 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {isEn ? "All" : "الكل"}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c ? "bg-red-700 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {topics === null ? (
        <div className="py-16 text-center text-slate-400">{t("common.loading")}</div>
      ) : list.length === 0 ? (
        <div className={`${card} py-16 text-center text-slate-400`}>
          <div className="text-4xl">🚧</div>
          <p className="mt-2">{isEn ? "Content coming soon." : "المحتوى قيد الإضافة قريبًا."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tp) => (
            <Link
              key={tp.id}
              to={`/er-reception/${tp.id}`}
              className={`${card} group p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="text-3xl">{tp.icon || "🚨"}</div>
              <h3 className="mt-2 font-black text-slate-800 group-hover:text-red-700 dark:text-white">
                {isEn && tp.title_en ? tp.title_en : tp.title_ar}
              </h3>
              {tp.category && <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-500/10">{tp.category}</span>}
              {(isEn ? tp.summary_en : tp.summary_ar) && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{isEn ? tp.summary_en : tp.summary_ar}</p>
              )}
              <div className="mt-3 text-xs font-bold text-red-700">{tp.sections.length} {isEn ? "sections" : "أقسام"} ←</div>
            </Link>
          ))}
        </div>
      )}

      <div className={`${card} mt-8 p-5`}>
        <div className="mb-2 font-black text-slate-700 dark:text-white">{isEn ? "Related sections" : "أقسام ذات صلة"}</div>
        <div className="flex flex-wrap gap-2">
          <Link to="/first-aid" className="rounded-full bg-rose-50 px-4 py-1.5 text-sm font-bold text-rose-600 dark:bg-rose-500/10">
            🩹 {isEn ? "First Aid (burns, CPR, bleeding & wounds)" : "الإسعافات الأولية (الحروق، الإنعاش، النزيف والجروح)"}
          </Link>
          <Link to="/pharmacology" className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10">
            🧪 {isEn ? "Pharmacology" : "الفارماكولوجي"}
          </Link>
          <Link to="/terminology" className="rounded-full bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-600 dark:bg-violet-500/10">
            🔤 {isEn ? "Medical Terminology" : "المصطلحات الطبية"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ERReceptionTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<ERReceptionTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchERReceptionTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.erReception")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/er-reception" className="mt-4 inline-block rounded-full bg-red-700 px-6 py-2 font-bold text-white">{t("nav.erReception")}</Link>
      </div>
    );
  }

  const title = isEn && topic.title_en ? topic.title_en : topic.title_ar;
  const summary = isEn ? topic.summary_en : topic.summary_ar;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.erReception"), path: "/er-reception" }, { label: title }]} />

      <div className="mb-6 text-center">
        <div className="text-5xl">{topic.icon || "🚨"}</div>
        <h1 className="mt-3 text-3xl font-black dark:text-white">{title}</h1>
        {summary && <p className="mt-2 text-slate-500 dark:text-slate-400">{summary}</p>}
      </div>

      <Link
        to="/drugs/er-medications"
        className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 transition hover:shadow-md dark:border-amber-500/40 dark:bg-amber-500/10"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
          <span className="text-xl">💊</span>
          {isEn ? "For full drug doses used in this topic, see ER Medications" : "لجرعات الأدوية المذكورة هنا كاملة، راجع صفحة أدوية الطوارئ"}
        </div>
        <span className="shrink-0 text-sm font-bold text-amber-700 dark:text-amber-400">←</span>
      </Link>

      <div className="space-y-6">
        {topic.sections.map((s, i) => {
          const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
          const body = isEn && s.body_en ? s.body_en : s.body_ar;
          return (
            <section key={s.id || i} className={`${card} p-5`}>
              <h2 className="mb-3 text-lg font-black text-red-700">{heading}</h2>
              {s.image_url && (
                <img src={s.image_url} alt={heading} className="mb-4 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              )}
              <div className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{body}</div>
            </section>
          );
        })}
      </div>

      {topic.sources && topic.sources.length > 0 && (
        <div className={`${card} mt-6 p-4 text-xs text-slate-400`}>
          <div className="mb-1 font-bold text-slate-500 dark:text-slate-400">{isEn ? "Sources" : "المصادر"}</div>
          <ul className="list-inside list-disc space-y-0.5">
            {topic.sources.map((src, i) => <li key={i}>{src}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link to="/er-reception" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">
          {isEn ? "← Back to Reception & Emergency" : "← رجوع لقسم الاستقبال والطوارئ"}
        </Link>
      </div>
    </div>
  );
}
