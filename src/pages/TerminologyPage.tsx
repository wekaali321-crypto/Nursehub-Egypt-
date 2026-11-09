import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HubGrid from "../components/HubGrid";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchTerminologyTopics, type TerminologyTopic } from "../lib/terminologyTopicsApi";
import TermBody from "../components/TermBody";
import TerminologyQuizWidget from "../components/TerminologyQuizWidget";

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export function TerminologyHome() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("nav.terminology")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<TerminologyTopic[] | null>(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetchTerminologyTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  const categories = Array.from(new Set((topics || []).map((tp) => tp.category).filter(Boolean))) as string[];
  const list = category === "all" ? topics || [] : (topics || []).filter((tp) => tp.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.terminology") }]} />

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-violet-600 via-purple-500 to-fuchsia-500 p-8 text-white shadow-lg">
        <div className="text-5xl">🔤</div>
        <h1 className="mt-3 text-3xl font-black">{t("nav.terminology")}</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          {isEn
            ? "A complete, structured reference for medical terminology: word-building rules, prefixes, suffixes, body-system roots, per-system glossaries, imaging and diagnostic terms, and practical hospital vocabulary."
            : "مرجع شامل ومنظّم لعلم المصطلحات الطبية: قواعد بناء الكلمة الطبية، البادئات، اللواحق، جذور أعضاء وأجهزة الجسم، مسارد مصطلحات كل جهاز، مصطلحات الأشعة والفحوصات، ومفردات المستشفى العملية."}
        </p>
      </div>

      <TerminologyQuizWidget />

      {categories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === "all" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {isEn ? "All" : "الكل"}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
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
        <HubGrid
          isEn={isEn}
          accent="violet"
          items={list.map((tp) => ({ id: tp.id, to: `/terminology/${tp.id}`, icon: tp.icon || "🔤", title: tp.title_ar, titleEn: tp.title_en, category: tp.category, summary: isEn ? tp.summary_en : tp.summary_ar, count: tp.sections.length }))}
        />
      )}
    </div>
  );
}

export default function TerminologyTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<TerminologyTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchTerminologyTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.terminology")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/terminology" className="mt-4 inline-block rounded-full bg-violet-600 px-6 py-2 font-bold text-white">{t("nav.terminology")}</Link>
      </div>
    );
  }

  const title = isEn && topic.title_en ? topic.title_en : topic.title_ar;
  const summary = isEn ? topic.summary_en : topic.summary_ar;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.terminology"), path: "/terminology" }, { label: title }]} />

      <div className="mb-6 text-center">
        <div className="text-5xl">{topic.icon || "🔤"}</div>
        <h1 className="mt-3 text-3xl font-black dark:text-white">{title}</h1>
        {summary && <p className="mt-2 text-slate-500 dark:text-slate-400">{summary}</p>}
      </div>

      {topic.sections.length > 1 && (
        <div className="sticky top-14 z-10 -mx-4 mb-5 flex gap-2 overflow-x-auto bg-white/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
          {topic.sections.map((s, i) => (
            <a key={s.id || i} href={`#tsec-${i}`} className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
              {i + 1}. {isEn && s.heading_en ? s.heading_en : s.heading_ar}
            </a>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {topic.sections.map((s, i) => {
          const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
          const body = isEn && s.body_en ? s.body_en : s.body_ar;
          return (
            <section key={s.id || i} id={`tsec-${i}`} className={`${card} scroll-mt-28 p-4 sm:p-5`}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-violet-700 dark:text-violet-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm text-white">{i + 1}</span>
                {heading}
              </h2>
              {s.image_url && (
                <img src={s.image_url} alt={heading} className="mb-4 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              )}
              <TermBody body={body} isEn={isEn} />
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
        <Link to="/terminology" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">
          {isEn ? "← Back to Terminology" : "← رجوع لقسم المصطلحات الطبية"}
        </Link>
      </div>
    </div>
  );
}
