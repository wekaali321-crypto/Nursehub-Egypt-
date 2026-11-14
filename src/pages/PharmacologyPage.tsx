import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchPharmacologyTopics, fetchPharmacologyTopic, type PharmacologyTopic } from "../lib/pharmacologyTopicsApi";
import { cachedQuery, TTL } from "../lib/remoteCache";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light emerald accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-emerald-400/25",
  iconBg: "bg-emerald-400/35",
  tile: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  text: "text-emerald-700 dark:text-emerald-300",
};

export function PharmacologyHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.pharmacology")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<PharmacologyTopic[] | null>(null);

  useEffect(() => {
    cachedQuery("topics_v1_pharmacology_routed", TTL.topics, () => fetchPharmacologyTopics({ withRouted: true })).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.pharmacology")}
      icon="🧪"
      fallbackIcon="🧪"
      tint={TINT}
      description={{
        en: "A complete, structured reference for nursing pharmacology: general principles, dosage calculations, antibiotics, autonomic drugs, cardiovascular and respiratory medications, GIT drugs, anticoagulants, and clinical case scenarios.",
        ar: "مرجع شامل ومنظّم لعلم الأدوية التمريضي: المبادئ العامة، حسابات الجرعات، المضادات الحيوية، أدوية الجهاز العصبي الذاتي، أدوية القلب والجهاز التنفسي، أدوية الجهاز الهضمي، مضادات التخثر، وحالات سريرية تطبيقية.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/pharmacology/${tp.id}`}
    />
  );
}

export default function PharmacologyTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<PharmacologyTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchPharmacologyTopic(id ?? "").then((tp) => {
      if (!cancelled) setTopic(tp);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.pharmacology")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500 dark:text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/pharmacology" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.pharmacology")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.pharmacology")}
      basePath="/pharmacology"
      tint={TINT}
      fallbackIcon="🧪"
      backLabel={{ en: "← Back to Pharmacology", ar: "← رجوع لقسم الفارماكولوجي" }}
    />
  );
}
