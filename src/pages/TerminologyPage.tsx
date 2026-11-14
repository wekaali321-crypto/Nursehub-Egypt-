import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchTerminologyTopics, type TerminologyTopic } from "../lib/terminologyTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";
import TermBody from "../components/TermBody";
import TerminologyQuizWidget from "../components/TerminologyQuizWidget";

// Light violet accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-violet-400/25",
  iconBg: "bg-violet-400/35",
  tile: "bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
  text: "text-violet-700 dark:text-violet-300",
};

export function TerminologyHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.terminology")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<TerminologyTopic[] | null>(null);

  useEffect(() => {
    fetchTerminologyTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.terminology")}
      icon="🔤"
      fallbackIcon="🔤"
      tint={TINT}
      description={{
        en: "A complete, structured reference for medical terminology: word-building rules, prefixes, suffixes, body-system roots, per-system glossaries, imaging and diagnostic terms, and practical hospital vocabulary.",
        ar: "مرجع شامل ومنظّم لعلم المصطلحات الطبية: قواعد بناء الكلمة الطبية، البادئات، اللواحق، جذور أعضاء وأجهزة الجسم، مسارد مصطلحات كل جهاز، مصطلحات الأشعة والفحوصات، ومفردات المستشفى العملية.",
      }}
      topics={topics}
      hrefFor={(tp) => `/terminology/${tp.id}`}
      hubTop={<TerminologyQuizWidget />}
    />
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
        <Link to="/terminology" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.terminology")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.terminology")}
      basePath="/terminology"
      tint={TINT}
      fallbackIcon="🔤"
      backLabel={{ en: "← Back to Terminology", ar: "← رجوع لقسم المصطلحات الطبية" }}
      sectionNav
      renderBody={(body, isEn) => <TermBody body={body} isEn={isEn} />}
    />
  );
}
