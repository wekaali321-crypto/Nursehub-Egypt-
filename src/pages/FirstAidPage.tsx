import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchFirstAidTopics, type FirstAidTopic } from "../lib/firstAidTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light rose accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-rose-400/25",
  iconBg: "bg-rose-400/35",
  tile: "bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
  text: "text-rose-700 dark:text-rose-300",
};

export function FirstAidHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.firstAid")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<FirstAidTopic[] | null>(null);

  useEffect(() => {
    fetchFirstAidTopics({ withRouted: true }).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.firstAid")}
      icon="🩹"
      fallbackIcon="🩹"
      tint={TINT}
      description={{
        en: "A complete, structured first-aid reference: primary assessment and CPR, bleeding and wound care, fractures and burns, poisoning and bites, heat/cold and cardiac emergencies, and how to build and use a first-aid kit.",
        ar: "مرجع شامل ومنظّم للإسعافات الأولية: التقييم الأولي والإنعاش القلبي الرئوي، النزيف والعناية بالجروح، الكسور والحروق، التسمم واللدغات، الطوارئ الحرارية والقلبية، وكيفية إعداد حقيبة الإسعافات الأولية واستخدامها.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/first-aid/${tp.id}`}
    />
  );
}

export default function FirstAidTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<FirstAidTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchFirstAidTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.firstAid")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/first-aid" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.firstAid")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.firstAid")}
      basePath="/first-aid"
      tint={TINT}
      fallbackIcon="🩹"
      backLabel={{ en: "← Back to First Aid", ar: "← رجوع للإسعافات الأولية" }}
    />
  );
}
