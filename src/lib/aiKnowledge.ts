/**
 * Article-scoped AI knowledge engine.
 *
 * Priority order when answering a question about an article:
 *   1. Search the CURRENT article's own text (most trustworthy — exact context).
 *   2. Fall back to a small, curated nursing knowledge base (general facts).
 *   3. If neither has an answer, clearly point to trusted EXTERNAL medical
 *      sources — never invent facts.
 */

export interface KBEntry { keys: string[]; ar: string; en: string }

export const NURSING_KB: KBEntry[] = [
  { keys: ["bmi", "كتلة الجسم", "وزن مثالي", "body mass"], ar: "يُحسب مؤشر كتلة الجسم بقسمة الوزن (كجم) على مربع الطول (متر). المعدل الطبيعي يتراوح بين 18.5 و24.9.", en: "BMI is calculated as weight (kg) divided by height squared (m²). The normal range is 18.5–24.9." },
  { keys: ["جرعة", "dose", "dosage"], ar: "تُحسب جرعة الدواء عادة حسب وزن المريض ونوع الدواء وحالته الصحية. راجع دائماً بروتوكول المنشأة والطبيب المعالج قبل الإعطاء.", en: "Medication dosage is typically calculated based on the patient's weight, the specific drug, and their clinical condition. Always verify with your institution's protocol and the prescribing physician." },
  { keys: ["ضغط الدم", "blood pressure", " bp ", "hypertension"], ar: "الضغط الطبيعي للبالغين تقريباً 120/80 ملم زئبق. القراءات فوق 140/90 تُعد ارتفاعاً يستدعي المتابعة الطبية.", en: "Normal adult blood pressure is around 120/80 mmHg. Readings above 140/90 are considered elevated and warrant medical follow-up." },
  { keys: ["سكر الدم", "glucose", "diabetes", "سكري"], ar: "مستوى سكر الدم الصائم الطبيعي يتراوح تقريباً بين 70–100 مجم/ديسيلتر. راقب دوماً علامات نقص أو ارتفاع السكر لدى المريض.", en: "Normal fasting blood glucose is roughly 70–100 mg/dL. Always monitor patients for signs of hypo- or hyperglycemia." },
  { keys: ["نبض", "pulse", "heart rate"], ar: "معدل النبض الطبيعي للبالغين يتراوح بين 60 و100 نبضة في الدقيقة.", en: "Normal adult heart rate ranges from 60 to 100 beats per minute." },
  { keys: ["تنفس", "respiration", "breathing rate", "respiratory rate"], ar: "معدل التنفس الطبيعي للبالغين يتراوح بين 12 و20 نفساً في الدقيقة.", en: "Normal adult respiratory rate is 12 to 20 breaths per minute." },
  { keys: ["حرارة الجسم", "temperature", "fever", "حمى"], ar: "درجة حرارة الجسم الطبيعية تقارب 36.5–37.5°م. تبدأ الحمى عادة من 38°م فأعلى.", en: "Normal body temperature is approximately 36.5–37.5°C. Fever typically begins at 38°C or higher." },
  { keys: ["جرح", "wound", "ضماد", "dressing"], ar: "للعناية بالجرح: اغسل يديك، استخدم قفازات معقمة، نظّف الجرح بمحلول ملحي معقم، ثم غطِّه بضمادة مناسبة وغيّرها بانتظام وفق البروتوكول المعتمد.", en: "Wound care basics: wash your hands, wear sterile gloves, clean the wound with sterile saline, then cover it with an appropriate dressing and change it regularly per approved protocol." },
  { keys: ["حقن وريدي", " iv ", "تسريب", "cannulation"], ar: "عند تركيب الكانيولا الوريدية، حافظ على التقنية المعقمة، اختر الوريد المناسب، وراقب باستمرار علامات التسرب أو الالتهاب الوريدي.", en: "For IV cannulation, maintain strict sterile technique, select an appropriate vein, and continuously monitor for infiltration or phlebitis." },
  { keys: ["أكسجين", "oxygen", "spo2", "saturation"], ar: "التشبع الطبيعي بالأكسجين (SpO2) للبالغين الأصحاء عادة 95% فأعلى.", en: "Normal oxygen saturation (SpO2) for healthy adults is typically 95% or above." },
];

const STOP_WORDS_AR = new Set(["في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي", "أو", "ثم", "كل", "هل", "ما", "كيف", "لماذا", "و", "لا", "قد"]);
const STOP_WORDS_EN = new Set(["the", "is", "are", "a", "an", "of", "in", "on", "to", "and", "or", "what", "how", "why", "does", "do", "for", "it", "this", "that"]);

function tokenize(text: string, lang: "ar" | "en"): string[] {
  const stop = lang === "ar" ? STOP_WORDS_AR : STOP_WORDS_EN;
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w));
}

/**
 * Try to answer strictly from the CURRENT article's own HTML content by
 * finding the sentence with the highest keyword overlap with the question.
 * Returns null if no reasonable match is found (score of 0).
 */
export function searchArticleContent(html: string, question: string, lang: "ar" | "en"): string | null {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = plain.split(/(?<=[.!؟])\s+|\n+/).filter((s) => s.trim().length > 15);
  const qTokens = new Set(tokenize(question, lang));
  if (!qTokens.size || !sentences.length) return null;

  let best = { score: 0, text: "" };
  for (const s of sentences) {
    const sTokens = tokenize(s, lang);
    let score = 0;
    for (const t of sTokens) if (qTokens.has(t)) score++;
    if (score > best.score) best = { score, text: s.trim() };
  }
  return best.score >= 1 ? best.text : null;
}

/** Fall back to the curated general nursing knowledge base. */
export function answerFromKnowledgeBase(question: string, lang: "ar" | "en"): string | null {
  const q = ` ${question.toLowerCase()} `;
  const hit = NURSING_KB.find((e) => e.keys.some((k) => q.includes(k)));
  return hit ? (lang === "ar" ? hit.ar : hit.en) : null;
}

/** Trusted external medical references — pointers only, never fabricated facts. */
export const EXTERNAL_SOURCES = [
  { name: "MedlinePlus (NIH)", url: "https://medlineplus.gov" },
  { name: "World Health Organization", url: "https://www.who.int" },
  { name: "CDC", url: "https://www.cdc.gov" },
  { name: "Mayo Clinic", url: "https://www.mayoclinic.org" },
];
