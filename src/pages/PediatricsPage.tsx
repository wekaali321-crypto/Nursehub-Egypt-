import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchPediatricTopics, fetchPediatricTopic, type PediatricTopic } from "../lib/pediatricTopicsApi";
import { cachedQuery, TTL } from "../lib/remoteCache";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";
import PediatricsQuizWidget from "../components/PediatricsQuizWidget";

// Light yellow accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-yellow-400/25",
  iconBg: "bg-yellow-400/35",
  tile: "bg-yellow-50 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200",
  text: "text-yellow-700 dark:text-yellow-300",
};

export function PediatricsHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.pediatrics")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<PediatricTopic[] | null>(null);

  useEffect(() => {
    cachedQuery("topics_v1_pediatric_routed", TTL.topics, () => fetchPediatricTopics({ withRouted: true })).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.pediatrics")}
      icon="🍼"
      fallbackIcon="🍼"
      tint={TINT}
      description={{
        en: "A complete pediatric nursing reference: growth and development milestones, normal vital-sign ranges by age, growth measurement tools, and an interactive question bank.",
        ar: "مرجع شامل لتمريض الأطفال: مؤشرات النمو والتطور، المعدلات الطبيعية للعلامات الحيوية حسب العمر، أدوات قياس النمو، وبنك أسئلة تفاعلي.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/pediatrics/${tp.id}`}
      hubTop={<PediatricsQuizWidget />}
    />
  );
}

export default function PediatricsTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<PediatricTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchPediatricTopic(id ?? "").then((tp) => {
      if (!cancelled) setTopic(tp);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.pediatrics")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/pediatrics" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.pediatrics")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.pediatrics")}
      basePath="/pediatrics"
      tint={TINT}
      fallbackIcon="🍼"
      backLabel={{ en: "← Back to Pediatrics", ar: "← رجوع لقسم الأطفال" }}
    />
  );
}
