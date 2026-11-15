/**
 * Topic of each exam / travel question (static files built by scripts/build-question-topics.mjs — keyword rules, so
 * approximate) and where to review each topic. Loaded only on the results screen; no database read.
 */
export type TopicCode = "cardio" | "respiratory" | "neuro" | "renal" | "gi" | "endocrine" | "maternity" | "pediatrics" | "mental" | "pharmacology" | "infection" | "oncology" | "musculo" | "emergency" | "community" | "leadership" | "general";

export const TOPIC_INFO: Record<TopicCode, { ar: string; en: string; to?: string }> = {
  cardio: { ar: "القلب والأوعية", en: "Cardiovascular", to: "/diseases?system=cardio" },
  respiratory: { ar: "الجهاز التنفسي", en: "Respiratory", to: "/diseases?system=chest" },
  neuro: { ar: "الجهاز العصبي", en: "Neurology", to: "/diseases?system=neuro" },
  renal: { ar: "الكلى والسوائل والأملاح", en: "Renal, fluids & electrolytes", to: "/diseases?system=renal" },
  gi: { ar: "الجهاز الهضمي والكبد", en: "GI & liver", to: "/diseases?system=gi" },
  endocrine: { ar: "الغدد الصماء والسكر", en: "Endocrine & diabetes", to: "/diseases?system=endo" },
  maternity: { ar: "النساء والتوليد وحديثي الولادة", en: "Maternity & newborn", to: "/obgyn" },
  pediatrics: { ar: "الأطفال", en: "Pediatrics", to: "/pediatrics" },
  mental: { ar: "الصحة النفسية", en: "Mental health", to: "/diseases?system=mental" },
  pharmacology: { ar: "الأدوية والجرعات", en: "Pharmacology & dosage", to: "/pharmacology" },
  infection: { ar: "العدوى ومكافحتها", en: "Infection & control", to: "/diseases?system=infect" },
  oncology: { ar: "الأورام والدم", en: "Oncology & blood", to: "/diseases?system=blood" },
  musculo: { ar: "العظام والمفاصل", en: "Musculoskeletal", to: "/diseases?system=rheum" },
  emergency: { ar: "الطوارئ والإنعاش", en: "Emergency & resuscitation", to: "/er-reception" },
  community: { ar: "صحة المجتمع", en: "Community health", to: "/fundamentals" },
  leadership: { ar: "الإدارة والأخلاقيات والأولويات", en: "Leadership, ethics & priorities", to: "/fundamentals" },
  general: { ar: "عام", en: "General" },
};

const cache = new Map<string, Promise<Record<string, TopicCode> | null>>();
export function loadQuestionTopics(group: string, bank: string): Promise<Record<string, TopicCode> | null> {
  const key = `${group}-${bank.replace(/[^\w-]/g, "_")}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(`/exams/topics/${key}.json`).then((r) => (r.ok ? r.json() : null)).then((j) => (j?.topics as Record<string, TopicCode>) ?? null).catch(() => { cache.delete(key); return null; }));
  }
  return cache.get(key)!;
}

/** Per topic in one attempt: [correct, total]. */
export function topicBreakdown(order: string[], isCorrect: (id: string) => boolean, topics: Record<string, TopicCode>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const id of order) {
    const t = topics[id] ?? "general";
    const cur = out[t] ?? [0, 0];
    out[t] = [cur[0] + (isCorrect(id) ? 1 : 0), cur[1] + 1];
  }
  return out;
}
