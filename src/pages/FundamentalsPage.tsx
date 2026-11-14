import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchFundamentalsTopics, type FundamentalsTopic } from "../lib/fundamentalsTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light blue accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-blue-400/25",
  iconBg: "bg-blue-400/35",
  tile: "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
  text: "text-blue-700 dark:text-blue-300",
};

export function FundamentalsHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.fundamentals")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<FundamentalsTopic[] | null>(null);

  useEffect(() => {
    fetchFundamentalsTopics({ withRouted: true }).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.fundamentals")}
      icon="🛏️"
      fallbackIcon="🛏️"
      tint={TINT}
      description={{
        en: "The core nursing skills and procedures every nurse relies on daily: patient care, vital signs, medication safety, infection control, and basic clinical procedures.",
        ar: "المهارات والإجراءات الأساسية التي يعتمد عليها كل ممرض يوميًا: رعاية المريض، العلامات الحيوية، أمان الأدوية، مكافحة العدوى، والإجراءات الإكلينيكية الأساسية.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/fundamentals/${tp.id}`}
    />
  );
}

export default function FundamentalsTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<FundamentalsTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchFundamentalsTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.fundamentals")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/fundamentals" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.fundamentals")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.fundamentals")}
      basePath="/fundamentals"
      tint={TINT}
      fallbackIcon="🛏️"
      backLabel={{ en: "← Back to Fundamentals of Nursing", ar: "← رجوع لقسم أسس التمريض" }}
    />
  );
}
