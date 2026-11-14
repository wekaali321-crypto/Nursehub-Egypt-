import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchNicuTopics, fetchNicuTopic, type NicuTopic } from "../lib/nicuTopicsApi";
import { cachedQuery, TTL } from "../lib/remoteCache";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light orange accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-orange-400/25",
  iconBg: "bg-orange-400/35",
  tile: "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
  text: "text-orange-700 dark:text-orange-300",
};

export function NicuHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.nicu")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<NicuTopic[] | null>(null);

  useEffect(() => {
    cachedQuery("topics_v1_nicu", TTL.topics, () => fetchNicuTopics()).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.nicu")}
      icon="👶"
      fallbackIcon="👶"
      tint={TINT}
      description={{
        en: "A complete, structured reference for neonatal intensive care nursing: newborn assessment, resuscitation, respiratory support, jaundice, sepsis, fluids, nutrition, and medication calculations.",
        ar: "مرجع شامل ومنظّم لتمريض العناية المركزة لحديثي الولادة: تقييم المولود، الإنعاش، الدعم التنفسي، اليرقان، الإنتان، السوائل، التغذية، وحسابات الأدوية.",
      }}
      topics={topics}
      hrefFor={(tp) => `/nicu/${tp.id}`}
    />
  );
}

export default function NicuTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<NicuTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchNicuTopic(id ?? "").then((tp) => {
      if (!cancelled) setTopic(tp);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.nicu")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/nicu" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.nicu")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.nicu")}
      basePath="/nicu"
      tint={TINT}
      fallbackIcon="👶"
      backLabel={{ en: "← Back to NICU", ar: "← رجوع لقسم الحضانة" }}
    />
  );
}
