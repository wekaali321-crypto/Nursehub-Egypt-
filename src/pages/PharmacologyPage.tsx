import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchPharmacologyTopics, type PharmacologyTopic } from "../lib/pharmacologyTopicsApi";

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export function PharmacologyHome() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("nav.pharmacology")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<PharmacologyTopic[] | null>(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchPharmacologyTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  const categories = Array.from(new Set((topics || []).map((tp) => tp.category).filter(Boolean))) as string[];
  const list = category === "all" ? topics || [] : (topics || []).filter((tp) => tp.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.pharmacology") }]} />

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-600 via-teal-500 to-cyan-500 p-8 text-white shadow-lg">
        <div className="text-5xl">🧪</div>
        <h1 className="mt-3 text-3xl font-black">{t("nav.pharmacology")}</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          {isEn
            ? "A complete, structured reference for nursing pharmacology: general principles, dosage calculations, antibiotics, autonomic drugs, cardiovascular and respiratory medications, GIT drugs, anticoagulants, and clinical case scenarios."
            : "مرجع شامل ومنظّم لعلم الأدوية التمريضي: المبادئ العامة، حسابات الجرعات، المضادات الحيوية، أدوية الجهاز العصبي الذاتي، أدوية القلب والجهاز التنفسي، أدوية الجهاز الهضمي، مضادات التخثر، وحالات سريرية تطبيقية."}
        </p>
      </div>

      {categories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {isEn ? "All" : "الكل"}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
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
              to={`/pharmacology/${tp.id}`}
              className={`${card} group p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="text-3xl">{tp.icon || "🧪"}</div>
              <h3 className="mt-2 font-black text-slate-800 group-hover:text-emerald-600 dark:text-white">
                {isEn && tp.title_en ? tp.title_en : tp.title_ar}
              </h3>
              {tp.category && <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10">{tp.category}</span>}
              {(isEn ? tp.summary_en : tp.summary_ar) && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{isEn ? tp.summary_en : tp.summary_ar}</p>
              )}
              <div className="mt-3 text-xs font-bold text-emerald-600">{tp.sections.length} {isEn ? "sections" : "أقسام"} ←</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PharmacologyTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<PharmacologyTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchPharmacologyTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.pharmacology")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/pharmacology" className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2 font-bold text-white">{t("nav.pharmacology")}</Link>
      </div>
    );
  }

  const title = isEn && topic.title_en ? topic.title_en : topic.title_ar;
  const summary = isEn ? topic.summary_en : topic.summary_ar;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.pharmacology"), path: "/pharmacology" }, { label: title }]} />

      <div className="mb-6 text-center">
        <div className="text-5xl">{topic.icon || "🧪"}</div>
        <h1 className="mt-3 text-3xl font-black dark:text-white">{title}</h1>
        {summary && <p className="mt-2 text-slate-500 dark:text-slate-400">{summary}</p>}
      </div>

      <div className="space-y-6">
        {topic.sections.map((s, i) => {
          const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
          const body = isEn && s.body_en ? s.body_en : s.body_ar;
          return (
            <section key={s.id || i} className={`${card} p-5`}>
              <h2 className="mb-3 text-lg font-black text-emerald-600">{heading}</h2>
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
        <Link to="/pharmacology" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">
          {isEn ? "← Back to Pharmacology" : "← رجوع لقسم الفارماكولوجي"}
        </Link>
      </div>
    </div>
  );
}
