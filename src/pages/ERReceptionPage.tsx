import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { fetchERReceptionTopics, type ERReceptionTopic } from "../lib/erReceptionTopicsApi";
import { TopicSectionDetail, TopicSectionHome, type TopicTint } from "../components/topics/TopicSectionPage";

// Light red accent on top of the shared Navy/Teal section layout.
const TINT: TopicTint = {
  glow: "bg-red-400/25",
  iconBg: "bg-red-400/35",
  tile: "bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200",
  text: "text-red-700 dark:text-red-300",
};

export function ERReceptionHome() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("nav.erReception")} | NurseHub Egypt` });

  const [topics, setTopics] = useState<ERReceptionTopic[] | null>(null);

  useEffect(() => {
    fetchERReceptionTopics({ withRouted: true }).then(setTopics).catch(() => setTopics([]));
  }, []);

  return (
    <TopicSectionHome
      title={t("nav.erReception")}
      icon="🚨"
      fallbackIcon="🚨"
      tint={TINT}
      description={{
        en: "A complete reference for the Emergency Reception Department: patient triage, receiving wound cases, suturing skills, IV fluids, common medical emergencies, and surgical & trauma emergencies.",
        ar: "مرجع شامل لقسم الاستقبال والطوارئ: فرز المرضى، استقبال حالات الجروح، مهارات الخياطة الجراحية، المحاليل الوريدية، الحالات الطبية الشائعة، والحالات الجراحية والإصابات في الطوارئ.",
      }}
      topics={topics}
      hrefFor={(tp) => (tp as { href?: string }).href ?? `/er-reception/${tp.id}`}
      hubTop={
        <>
        <Link
          to="/drugs/er-medications"
          className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-amber-400 sm:flex-row sm:items-center bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">💊</div>
            <div>
              <div className="font-black text-amber-700 dark:text-amber-400">
                {isEn ? "Looking for emergency drug doses?" : "بتدوّر على جرعات أدوية الطوارئ؟"}
              </div>
              <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">
                {isEn
                  ? "Full ER medications reference (doses, indications & contraindications) lives in its own dedicated page."
                  : "مرجع أدوية الطوارئ الكامل (الجرعات ودواعي وموانع الاستعمال) موجود في صفحته المخصصة تفاديًا لتكرار المحتوى."}
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white">
            {isEn ? "Open ER Medications →" : "افتح أدوية الطوارئ ←"}
          </div>
        </Link>
        </>
      }
      hubBottom={
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 font-black text-slate-700 dark:text-white">{isEn ? "Related sections" : "أقسام ذات صلة"}</div>
          <div className="flex flex-wrap gap-2">
            <Link to="/first-aid" className="rounded-full bg-rose-50 px-4 py-1.5 text-sm font-bold text-rose-600 dark:bg-rose-500/10">
              🩹 {isEn ? "First Aid (burns, CPR, bleeding & wounds)" : "الإسعافات الأولية (الحروق، الإنعاش، النزيف والجروح)"}
            </Link>
            <Link to="/pharmacology" className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10">
              🧪 {isEn ? "Pharmacology" : "الفارماكولوجي"}
            </Link>
            <Link to="/terminology" className="rounded-full bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-600 dark:bg-violet-500/10">
              🔤 {isEn ? "Medical Terminology" : "المصطلحات الطبية"}
            </Link>
          </div>
        </div>
      }
    />
  );
}

export default function ERReceptionTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<ERReceptionTopic | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchERReceptionTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.erReception")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/er-reception" className="mt-4 inline-block rounded-full bg-[#153448] px-6 py-2 font-bold text-white">{t("nav.erReception")}</Link>
      </div>
    );
  }

  return (
    <TopicSectionDetail
      topic={topic}
      sectionTitle={t("nav.erReception")}
      basePath="/er-reception"
      tint={TINT}
      fallbackIcon="🚨"
      backLabel={{ en: "← Back to Reception & Emergency", ar: "← رجوع لقسم الاستقبال والطوارئ" }}
      detailTop={
        <Link
          to="/drugs/er-medications"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 transition hover:shadow-md dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            <span className="text-xl">💊</span>
            {isEn ? "For full drug doses used in this topic, see ER Medications" : "لجرعات الأدوية المذكورة هنا كاملة، راجع صفحة أدوية الطوارئ"}
          </div>
          <span className="shrink-0 text-sm font-bold text-amber-700 dark:text-amber-400">←</span>
        </Link>
      }
    />
  );
}
