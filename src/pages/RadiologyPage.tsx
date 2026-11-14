import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchRadiologyTopics, type RadiologyTopic } from "../lib/radiologyTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light indigo accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-indigo-400/25",
  iconBg: "bg-indigo-400/35",
  tile: "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200",
  text: "text-indigo-700 dark:text-indigo-300",
};

export function RadiologyHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.radiology")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<RadiologyTopic[] | null>(null);

  useEffect(() => {
    fetchRadiologyTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.radiology")}
      icon="🩻"
      fallbackIcon="🩻"
      tint={TINT}
      description={{
        en: "A complete reference for radiology nursing: radiation safety, contrast media, patient prep for imaging, and a systematic approach to reading chest X-rays and brain CT scans.",
        ar: "مرجع شامل لتمريض الأشعة: السلامة الإشعاعية، مادة الصبغة الظليلة، تحضير المريض للتصوير، ومنهج منظّم لقراءة أشعة الصدر والأشعة المقطعية على المخ.",
      }}
      topics={topics}
      hrefFor={(tp) => `/radiology/${tp.id}`}
    />
  );
}

export default function RadiologyTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<RadiologyTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchRadiologyTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.radiology")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/radiology" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.radiology")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.radiology")}
      basePath="/radiology"
      tint={TINT}
      fallbackIcon="🩻"
      backLabel={{ en: "← Back to Radiology", ar: "← رجوع لقسم الأشعة" }}
    />
  );
}
