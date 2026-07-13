/**
 * AI-style content enhancers for the Import Wizard.
 * Rule-based, fully offline generators that extract genuine content from the
 * article itself (never fabricated facts) and format it using NurseHub's
 * existing premium block styles (.nh-pearl, .nh-tip, .nh-mcq, etc.).
 */
import { extractSections, type SectionSummary } from "./importWizard";

function pick<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

function keyTerm(sentence: string): string | null {
  // Heuristic: prefer a capitalized medical-looking English term, else the longest Arabic word.
  const enMatch = sentence.match(/\b[A-Z][a-zA-Z]{3,}\b/);
  if (enMatch) return enMatch[0];
  const words = sentence.replace(/[^\u0600-\u06FF\s]/g, " ").split(/\s+/).filter((w) => w.length > 4);
  if (!words.length) return null;
  return words.reduce((a, b) => (b.length > a.length ? b : a));
}

/* ============================== Clinical Pearls / Tips / Alerts ============================== */

export function generateClinicalPearls(sections: SectionSummary[], max = 3): string {
  const candidates = sections.flatMap((s) => s.sentences.slice(0, 1));
  const chosen = pick(candidates, max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => `<div class="nh-pearl"><strong>🦪 Clinical Pearl:</strong> ${s}</div>`)
    .join("\n") + "<p></p>";
}

export function generateNursingTips(sections: SectionSummary[], max = 3): string {
  const candidates = sections.flatMap((s) => s.sentences.slice(1, 2));
  const chosen = pick(candidates.length ? candidates : sections.flatMap((s) => s.sentences.slice(0, 1)), max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => `<div class="nh-tip"><strong>💡 نصيحة تمريضية:</strong> ${s}</div>`)
    .join("\n") + "<p></p>";
}

const ALERT_TRIGGERS = ["خطر", "طوارئ", "تحذير", "احذر", "قد يسبب", "مضاعفات", "critical", "danger", "emergency", "warning", "risk"];

export function generateClinicalAlerts(sections: SectionSummary[], max = 2): string {
  const flagged = sections.flatMap((s) => s.sentences).filter((s) => ALERT_TRIGGERS.some((k) => s.toLowerCase().includes(k)));
  const chosen = pick(flagged, max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => `<div class="nh-important"><strong>🏥 تنبيه سريري:</strong> ${s}</div>`)
    .join("\n") + "<p></p>";
}

/* ============================== Summary cheat sheet & study notes ============================== */

export function generateSummaryCheatSheet(sections: SectionSummary[]): string {
  if (!sections.length) return "";
  const items = sections.map((s) => `<li><strong>${s.heading}:</strong> ${s.firstParagraph.slice(0, 120)}${s.firstParagraph.length > 120 ? "…" : ""}</li>`);
  return `<div class="nh-quickfacts"><strong>⚡ ملخص سريع (Cheat Sheet):</strong><ul>${items.join("")}</ul></div><p></p>`;
}

export function generateStudyNotes(sections: SectionSummary[]): string {
  if (!sections.length) return "";
  const blocks = sections.map((s) => {
    const bullets = pick(s.sentences, 3).map((sen) => `<li>${sen}</li>`).join("");
    return `<div class="nh-card"><h4>📝 ${s.heading}</h4><ul>${bullets || `<li>${s.firstParagraph}</li>`}</ul></div>`;
  });
  return blocks.join("\n") + "<p></p>";
}

/* ============================== FAQ ============================== */

export function generateFAQ(sections: SectionSummary[], max = 5): string {
  const chosen = pick(sections.filter((s) => s.firstParagraph), max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => `<details class="nh-accordion"><summary>ما المقصود بـ "${s.heading}"؟</summary><div>${s.firstParagraph}</div></details>`)
    .join("\n") + "<p></p>";
}

/* ============================== MCQ / True-False / Fill-in-the-blank ============================== */

export function generateMCQs(sections: SectionSummary[], max = 5): string {
  const pool = sections.flatMap((s) => s.sentences.map((sen) => ({ sen, heading: s.heading })));
  const chosen = pick(pool, max);
  if (!chosen.length) return "";
  return chosen
    .map(({ sen, heading }, i) => {
      const distractors = ["لا شيء مما سبق", "كل ما سبق صحيح", `معلومة غير متعلقة بـ ${heading}`];
      return `<div class="nh-mcq"><strong>❓ سؤال ${i + 1}:</strong> ما العبارة الصحيحة بخصوص "${heading}"؟<ol type="a"><li>${sen} ✅</li><li>${distractors[0]}</li><li>${distractors[1]}</li><li>${distractors[2]}</li></ol><details class="nh-accordion"><summary>الإجابة والشرح</summary><div>الإجابة الصحيحة: (أ) — مستخرجة من قسم "${heading}".</div></details></div><p></p>`;
    })
    .join("\n");
}

export function generateTrueFalse(sections: SectionSummary[], max = 5): string {
  const pool = sections.flatMap((s) => s.sentences);
  const chosen = pick(pool, max);
  if (!chosen.length) return "";
  return chosen
    .map((s, i) => `<div class="nh-mcq"><strong>صح أو خطأ (${i + 1}):</strong> ${s}<details class="nh-accordion"><summary>الإجابة</summary><div>✅ صحيحة — مذكورة نصاً في المقال.</div></details></div><p></p>`)
    .join("\n");
}

export function generateFillBlanks(sections: SectionSummary[], max = 5): string {
  const pool = sections.flatMap((s) => s.sentences);
  const chosen = pick(pool, max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => {
      const term = keyTerm(s);
      if (!term) return null;
      const blanked = s.replace(term, "______");
      return `<div class="nh-mcq"><p>أكمل الفراغ: ${blanked}</p><details class="nh-accordion"><summary>الإجابة</summary><div>${term}</div></details></div><p></p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/* ============================== Flashcards ============================== */

export function generateFlashcards(sections: SectionSummary[], max = 6): string {
  const chosen = pick(sections.filter((s) => s.firstParagraph), max);
  if (!chosen.length) return "";
  return chosen
    .map((s) => `<details class="nh-flashcard"><summary>🎴 ${s.heading}؟</summary><div style="margin-top:.6rem">${s.firstParagraph}</div></details>`)
    .join("\n") + "<p></p>";
}

/* ============================== Mind map (outline) ============================== */

export function generateMindMap(sections: SectionSummary[], articleTitle: string): string {
  if (!sections.length) return "";
  const branches = sections
    .map((s) => `<li>${s.heading}${s.firstParagraph ? `<ul><li>${s.firstParagraph.slice(0, 90)}${s.firstParagraph.length > 90 ? "…" : ""}</li></ul>` : ""}</li>`)
    .join("");
  return `<div class="nh-card"><h4>🧠 ${articleTitle}</h4><ul>${branches}</ul></div><p></p>`;
}

/* ============================== One-shot bundle ============================== */

export interface EnhancementFlags {
  clinicalPearls: boolean;
  nursingTips: boolean;
  clinicalAlerts: boolean;
  summaryCheatSheet: boolean;
  faq: boolean;
  mcqs: boolean;
  trueFalse: boolean;
  fillBlanks: boolean;
  flashcards: boolean;
  mindMap: boolean;
  studyNotes: boolean;
}

export const DEFAULT_ENHANCEMENTS: EnhancementFlags = {
  clinicalPearls: true, nursingTips: true, clinicalAlerts: true, summaryCheatSheet: true,
  faq: true, mcqs: true, trueFalse: false, fillBlanks: false, flashcards: true, mindMap: false, studyNotes: false,
};

/** Generate every enabled block and return them as labeled HTML fragments the admin can append individually. */
export function generateAllEnhancements(html: string, title: string, flags: EnhancementFlags) {
  const sections = extractSections(html);
  const results: { key: keyof EnhancementFlags; label: string; icon: string; html: string }[] = [];

  const push = (key: keyof EnhancementFlags, label: string, icon: string, gen: () => string) => {
    if (!flags[key]) return;
    const generated = gen();
    if (generated.trim()) results.push({ key, label, icon, html: generated });
  };

  push("clinicalPearls", "لآلئ سريرية (Clinical Pearls)", "🦪", () => generateClinicalPearls(sections));
  push("nursingTips", "نصائح تمريضية", "💡", () => generateNursingTips(sections));
  push("clinicalAlerts", "تنبيهات سريرية", "🏥", () => generateClinicalAlerts(sections));
  push("summaryCheatSheet", "ملخص سريع (Cheat Sheet)", "⚡", () => generateSummaryCheatSheet(sections));
  push("faq", "أسئلة شائعة (FAQ)", "❔", () => generateFAQ(sections));
  push("mcqs", "أسئلة اختيارات (MCQ)", "🔘", () => generateMCQs(sections));
  push("trueFalse", "أسئلة صح/خطأ", "✔️", () => generateTrueFalse(sections));
  push("fillBlanks", "أكمل الفراغ", "✏️", () => generateFillBlanks(sections));
  push("flashcards", "بطاقات تعليمية", "🎴", () => generateFlashcards(sections));
  push("mindMap", "خريطة ذهنية", "🧠", () => generateMindMap(sections, title));
  push("studyNotes", "ملاحظات دراسية", "📝", () => generateStudyNotes(sections));

  return results;
}
