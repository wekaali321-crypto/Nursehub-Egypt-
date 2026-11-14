import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchObgynTopics, fetchObgynTopic, type ObgynTopic } from "../lib/obgynTopicsApi";
import { cachedQuery, TTL } from "../lib/remoteCache";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light pink accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-pink-400/25",
  iconBg: "bg-pink-400/35",
  tile: "bg-pink-50 text-pink-800 dark:bg-pink-500/15 dark:text-pink-200",
  text: "text-pink-700 dark:text-pink-300",
};

export function ObgynHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.obgyn")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<ObgynTopic[] | null>(null);

  useEffect(() => {
    cachedQuery("topics_v1_obgyn_routed", TTL.topics, () => fetchObgynTopics({ withRouted: true })).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.obgyn")}
      icon="🤰"
      fallbackIcon="🤰"
      tint={TINT}
      description={{
        en: "A comprehensive obstetrics and gynecology nursing reference: pregnancy physiology and antenatal care, pregnancy complications, labor and delivery, postpartum and newborn care, and gynecologic conditions and family planning.",
        ar: "مرجع شامل لتمريض النساء والتوليد: فسيولوجيا الحمل والرعاية السابقة للولادة، مضاعفات الحمل، المخاض والولادة، رعاية النفاس والوليد، وأمراض النساء وتنظيم الأسرة.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/obgyn/${tp.id}`}
    />
  );
}

export default function ObgynTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<ObgynTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchObgynTopic(id ?? "").then((tp) => {
      if (!cancelled) setTopic(tp);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.obgyn")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/obgyn" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.obgyn")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.obgyn")}
      basePath="/obgyn"
      tint={TINT}
      fallbackIcon="🤰"
      backLabel={{ en: "← Back to Obstetrics & Gynecology", ar: "← رجوع لقسم النساء والتوليد" }}
    />
  );
}
