import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchDialysisTopics, type DialysisTopic } from "../lib/dialysisTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light sky accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-sky-400/25",
  iconBg: "bg-sky-400/35",
  tile: "bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  text: "text-sky-700 dark:text-sky-300",
};

export function DialysisHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.dialysis")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<DialysisTopic[] | null>(null);

  useEffect(() => {
    fetchDialysisTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.dialysis")}
      icon="💧"
      fallbackIcon="💧"
      tint={TINT}
      description={{
        en: "A complete, structured reference for hemodialysis nursing: machine principles, water treatment, vascular access, anticoagulation, dialysis adequacy, and intradialytic complications.",
        ar: "مرجع شامل ومنظّم لتمريض الغسيل الكلوي: مبادئ الماكينة، معالجة المياه، الوصول الوعائي، مضادات التجلط، كفاءة الغسيل، ومضاعفات الجلسة.",
      }}
      topics={topics}
      hrefFor={(tp) => `/dialysis/${tp.id}`}
    />
  );
}

export default function DialysisTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<DialysisTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchDialysisTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.dialysis")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/dialysis" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.dialysis")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.dialysis")}
      basePath="/dialysis"
      tint={TINT}
      fallbackIcon="💧"
      backLabel={{ en: "← Back to Dialysis", ar: "← رجوع لقسم الغسيل الكلوي" }}
    />
  );
}
