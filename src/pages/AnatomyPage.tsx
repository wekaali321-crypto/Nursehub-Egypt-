import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchAnatomyTopics, type AnatomyTopic } from "../lib/anatomyTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Anatomy keeps a light warm (amber) accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-amber-400/25",
  iconBg: "bg-amber-400/35",
  tile: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  text: "text-amber-700 dark:text-amber-300",
};

export function AnatomyHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.anatomy")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<AnatomyTopic[] | null>(null);

  useEffect(() => {
    fetchAnatomyTopics({ withRouted: true }).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.anatomy")}
      icon="🦴"
      fallbackIcon="🦴"
      tint={TINT}
      description={{
        en: "A complete anatomy reference for nursing: body systems, structures, and clinically relevant landmarks for everyday nursing practice.",
        ar: "مرجع تشريح شامل للتمريض: أجهزة الجسم وتراكيبها والمعالم التشريحية المهمة للممارسة التمريضية اليومية.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/anatomy/${tp.id}`}
    />
  );
}

export default function AnatomyTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<AnatomyTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchAnatomyTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.anatomy")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/anatomy" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.anatomy")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.anatomy")}
      basePath="/anatomy"
      tint={TINT}
      fallbackIcon="🦴"
      backLabel={{ en: "← Back to Anatomy", ar: "← رجوع لقسم التشريح" }}
    />
  );
}
