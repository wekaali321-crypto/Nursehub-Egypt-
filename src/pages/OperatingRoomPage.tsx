import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchOperatingRoomTopics, type OperatingRoomTopic } from "../lib/operatingRoomTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light cyan accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-cyan-400/25",
  iconBg: "bg-cyan-400/35",
  tile: "bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200",
  text: "text-cyan-700 dark:text-cyan-300",
};

export function OperatingRoomHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.operatingRoom")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<OperatingRoomTopic[] | null>(null);

  useEffect(() => {
    fetchOperatingRoomTopics({ withRouted: true }).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.operatingRoom")}
      icon="🔪"
      fallbackIcon="🔪"
      tint={TINT}
      description={{
        en: "The core nursing skills and procedures every nurse relies on daily: patient care, vital signs, medication safety, infection control, and basic clinical procedures.",
        ar: "المهارات والإجراءات الأساسية التي يعتمد عليها كل ممرض يوميًا: رعاية المريض، العلامات الحيوية، أمان الأدوية، مكافحة العدوى، والإجراءات الإكلينيكية الأساسية.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/operating-room/${tp.id}`}
    />
  );
}

export default function OperatingRoomTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<OperatingRoomTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchOperatingRoomTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.operatingRoom")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/operating-room" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.operatingRoom")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.operatingRoom")}
      basePath="/operating-room"
      tint={TINT}
      fallbackIcon="🔪"
      backLabel={{ en: "← Back to Operating Room Nursing", ar: "← رجوع لقسم العمليات" }}
    />
  );
}
