import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchAnatomyTopics, fetchAnatomyTopic, type AnatomyTopic } from "../lib/anatomyTopicsApi";
import { cachedQuery, TTL } from "../lib/remoteCache";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";
import { LOAD_FAILED } from "../components/LoadError";

// Anatomy keeps a light warm (amber) accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-amber-400/25",
  iconBg: "bg-amber-400/35",
  tile: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  text: "text-amber-700 dark:text-amber-300",
};

/** Teaching drawing per anatomy topic (public/cards/art, scripts/build-term-art.mjs): where the system is in the body. */
const ART: Record<string, string> = {
  "anat-terminology-planes": "planes", "anat-axial-skeleton": "axial", "anat-appendicular-joints": "appendicular",
  "anat-muscular-system": "muscle", "anat-heart": "heart", "anat-blood-vessels": "vessels", "anat-respiratory": "respiratory",
  "anat-digestive": "digestive", "anat-urinary": "urinary", "anat-brain": "brain", "anat-spinal-cord": "spine",
  "anat-pns-cranial-nerves": "nerves", "anat-endocrine": "endocrine", "anat-reproductive": "uterus", "anat-integumentary": "skin",
  "anat-eye-ear": "eyeEar", "anat-lymphatic-immune": "lymph", "anat-breast": "breast", "anat-surface-landmarks": "landmarks",
};
/** Built-in diagram per anatomy SECTION (scripts/build-anatomy-art.mjs) — only where a picture explains it, not decoration. */
const SECTION_ART: Record<string, string> = {
  tp1: "anat-position", tp2: "anat-planes", tp3: "anat-directions", tp4: "anat-patient-positions",
  ax2: "body-skull", ax3: "anat-spine", ax4: "body-ribs", ap4: "anat-joint-movements",
  mu3: "anat-im-deltoid-vastus", mu4: "anat-im-gluteal",
  ht1: "anat-heart-chambers", ht2: "anat-heart-flow", ht4: "anat-heart-conduction",
  bv1: "anat-vessel-types", bv2: "anat-arm-veins", bv3: "anat-pulse-points",
  re1: "anat-upper-airway", re3: "anat-lungs-pleura", re4: "anat-breathing",
  ur2: "anat-nephron", ur4: "anat-catheter", br1: "anat-brain-lobes", br3: "anat-meninges",
  sc1: "anat-spinal-cord", sc3: "anat-reflex-arc", in1: "anat-skin-layers",
  ee1: "anat-eye", ee2: "anat-ear-outer-middle", ee3: "anat-ear-inner", rp3: "anat-menstrual-cycle",
  "breast-quadrants-drainage": "anat-breast-quadrants", "im-injection-sites": "anat-im-deltoid-vastus",
  "iv-catheter-veins": "anat-arm-veins", "pulse-points": "anat-pulse-points", "lumbar-puncture-landmark": "anat-lumbar-puncture",
  "lymph-node-groups": "body-lymph",
};
const sectionArt = (s: { id?: string }) => (s.id && SECTION_ART[s.id] ? `/cards/art/${SECTION_ART[s.id]}.svg` : null);
const artFor = (id: string) => (ART[id] ? `/cards/art/body-${ART[id]}.svg` : null);

export function AnatomyHome() {
  const { t } = useI18n();
  useSEO({ title: `${t("nav.anatomy")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<AnatomyTopic[] | null>(null);

  useEffect(() => {
    cachedQuery("topics_v1_anatomy_routed", TTL.topics, () => fetchAnatomyTopics({ withRouted: true })).then(setTopics).catch(() => setTopics(LOAD_FAILED));
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
      artFor={(tp) => artFor(tp.id)}
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
    fetchAnatomyTopic(id ?? "").then((tp) => {
      if (!cancelled) setTopic(tp);
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
      art={artFor(topic.id)}
      sectionArt={sectionArt}
    />
  );
}
