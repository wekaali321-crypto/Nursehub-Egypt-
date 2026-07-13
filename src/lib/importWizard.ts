/**
 * Content Import Wizard — core processing engine.
 * Pure functions operating on HTML strings; no external services required.
 */
import { slugify, readingTime } from "./store";

export type DetectedLanguage = "ar" | "en" | "bilingual" | "unknown";

/** Detect whether text is Arabic, English, or a mix of both (bilingual article). */
export function detectLanguage(text: string): DetectedLanguage {
  const plain = text.replace(/<[^>]+>/g, " ");
  const arabicChars = (plain.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (plain.match(/[a-zA-Z]/g) || []).length;
  const total = arabicChars + latinChars;
  if (total < 10) return "unknown";
  const arRatio = arabicChars / total;
  if (arRatio > 0.85) return "ar";
  if (arRatio < 0.15) return "en";
  return "bilingual";
}

/**
 * When a pasted/uploaded document mixes Arabic and English (e.g. an Arabic
 * article with English medical terms interspersed, or two full versions
 * concatenated), try to separate them into independent Arabic/English HTML
 * bodies by scanning block-level elements. Falls back to treating everything
 * as the primary (majority) language when no clean split is possible.
 */
export function splitBilingualContent(html: string): { primary: "ar" | "en"; ar: string; en: string } {
  const lang = detectLanguage(html);
  if (lang === "ar") return { primary: "ar", ar: html, en: "" };
  if (lang === "en") return { primary: "en", ar: "", en: html };

  // bilingual/unknown: classify each top-level block and bucket it.
  const blocks = html.match(/<(h[1-6]|p|ul|ol|blockquote|div|table)[^>]*>[\s\S]*?<\/\1>/gi) || [html];
  const arBlocks: string[] = [];
  const enBlocks: string[] = [];
  for (const b of blocks) {
    const blockLang = detectLanguage(b);
    if (blockLang === "en") enBlocks.push(b);
    else arBlocks.push(b); // ar, bilingual, or unknown blocks default to the Arabic body
  }
  const primary = arBlocks.join("").length >= enBlocks.join("").length ? "ar" : "en";
  return { primary, ar: arBlocks.join("\n"), en: enBlocks.join("\n") };
}

export interface TocEntry { id: string; level: number; text: string }

/** Renumber headings into a clean, sequential hierarchy starting at H2 (H1 reserved for the article title). */
export function optimizeHeadings(html: string): string {
  const levels: number[] = [];
  return html.replace(/<h([1-6])([^>]*)>/gi, (_m, lvl) => {
    const n = Number(lvl);
    // Compress H1 -> H2 (title stays outside the body), keep relative nesting otherwise.
    const normalized = n === 1 ? 2 : n;
    levels.push(normalized);
    return `<h${normalized}>`;
  }).replace(/<\/h[1-6]>/gi, () => {
    const lvl = levels.shift();
    return `</h${lvl ?? 2}>`;
  });
}

/** Inject stable sequential ids on every heading so a table of contents can deep-link to them. */
export function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h([2-6])([^>]*)>/gi, (_m, lvl, attrs) => {
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, "");
    return `<h${lvl}${cleanAttrs} id="section-${i++}">`;
  });
}

/** Build a table of contents from (already-id'd) heading tags. */
export function buildToc(html: string): TocEntry[] {
  const matches = [...html.matchAll(/<h([2-6])[^>]*\sid="([^"]+)"[^>]*>(.*?)<\/h[2-6]>/gi)];
  return matches
    .map((m) => ({ id: m[2], level: Number(m[1]), text: m[3].replace(/<[^>]+>/g, "").trim() }))
    .filter((t) => t.text);
}

/** Estimate reading time — reuses the platform-wide 200 wpm baseline. */
export function estimateReadingTime(html: string): number {
  return readingTime(html);
}

/** Word / character counts for the wizard's live stats panel. */
export function countStats(html: string) {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { words: plain ? plain.split(" ").length : 0, chars: plain.length };
}

/** Generate a unique slug, avoiding collisions with existing article slugs. */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const base = slugify(title) || "article";
  if (!existingSlugs.includes(base)) return base;
  let n = 2;
  while (existingSlugs.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Extract the plain-text sentence set used by several generators below. */
function sentencesOf(html: string): string[] {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.split(/(?<=[.!؟])\s+/).map((s) => s.trim()).filter((s) => s.length > 25 && s.length < 260);
}

/** Extract heading -> first-paragraph pairs, used to build FAQs, summaries, flashcards, mind maps. */
export interface SectionSummary { heading: string; level: number; firstParagraph: string; sentences: string[] }
export function extractSections(html: string): SectionSummary[] {
  const parts = html.split(/(?=<h[2-6])/i);
  const sections: SectionSummary[] = [];
  for (const part of parts) {
    const hMatch = part.match(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/i);
    if (!hMatch) continue;
    const rest = part.replace(/<h[2-6][^>]*>.*?<\/h[2-6]>/i, "");
    const paraMatch = rest.match(/<p[^>]*>(.*?)<\/p>/i);
    const firstParagraph = (paraMatch ? paraMatch[1] : rest).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    sections.push({
      heading: hMatch[2].replace(/<[^>]+>/g, "").trim(),
      level: Number(hMatch[1]),
      firstParagraph,
      sentences: sentencesOf(rest),
    });
  }
  return sections;
}

/* ============================== Image matching ============================== */

export interface WizardImage { id: string; name: string; dataUrl: string; sizeBytes: number; file: File }
export interface MatchedImage extends WizardImage { sectionIndex: number; sectionHeading: string }

/**
 * Distribute uploaded images evenly across the article's sections (round-robin),
 * so every image lands near relevant content instead of all piling at the top.
 * The admin can still drag them to a different section afterward.
 */
export function matchImagesToSections(images: WizardImage[], sections: SectionSummary[]): MatchedImage[] {
  if (!sections.length) return images.map((img) => ({ ...img, sectionIndex: -1, sectionHeading: "(بداية المقال)" }));
  return images.map((img, i) => {
    const idx = i % sections.length;
    return { ...img, sectionIndex: idx, sectionHeading: sections[idx].heading };
  });
}

/** Insert matched images as figures right after their assigned section's heading. */
export function insertImagesIntoHtml(html: string, images: MatchedImage[]): string {
  if (!images.length) return html;
  const parts = html.split(/(?=<h[2-6])/i);
  let sectionCounter = -1;
  const byIndex = new Map<number, MatchedImage[]>();
  images.forEach((img) => {
    const arr = byIndex.get(img.sectionIndex) || [];
    arr.push(img);
    byIndex.set(img.sectionIndex, arr);
  });

  const out = parts.map((part) => {
    const isHeadingBlock = /^<h[2-6]/i.test(part);
    if (isHeadingBlock) sectionCounter++;
    const imgsHere = byIndex.get(isHeadingBlock ? sectionCounter : -1);
    if (!imgsHere) return part;
    const figures = imgsHere
      .map((img) => `<figure><img src="${img.dataUrl}" alt="${escapeAttr(img.name)}" loading="lazy"/><figcaption style="text-align:center;font-size:.85rem;color:#64748b">${escapeAttr(img.name)}</figcaption></figure>`)
      .join("\n");
    if (isHeadingBlock) {
      const hCloseIdx = part.search(/<\/h[2-6]>/i);
      if (hCloseIdx === -1) return part + figures;
      const closeTagMatch = part.match(/<\/h[2-6]>/i)!;
      const insertAt = hCloseIdx + closeTagMatch[0].length;
      return part.slice(0, insertAt) + figures + part.slice(insertAt);
    }
    return figures + part;
  });
  return out.join("");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

/* ============================== SEO metadata ============================== */

export interface SeoBundle { metaTitle: string; metaDescription: string; keywords: string[]; slug: string }

export function generateSeoBundle(title: string, html: string, existingSlugs: string[]): SeoBundle {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const metaTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const metaDescription = (plain.slice(0, 155).trim() || `${title} — دليل تمريضي شامل على منصة NurseHub Egypt.`) + (plain.length > 155 ? "…" : "");
  const stop = new Set(["في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي", "أو", "ثم", "كل", "بعد", "قبل", "the", "and", "for", "with", "this", "that"]);
  const words = (title + " " + plain).replace(/[^\u0600-\u06FFa-zA-Z\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w.toLowerCase()));
  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  return { metaTitle, metaDescription, keywords, slug: generateUniqueSlug(title, existingSlugs) };
}

/* ============================== Validation ============================== */

export interface ValidationIssue { level: "error" | "warning"; message: string }

export function validateArticle(opts: { title: string; html: string; references?: string }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const plain = opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plain ? plain.split(" ").length : 0;

  if (!opts.title.trim()) issues.push({ level: "error", message: "العنوان مفقود." });
  if (wordCount < 80) issues.push({ level: "warning", message: "المحتوى قصير جداً (أقل من 80 كلمة) — قد يحتاج توسعاً." });
  if (!/<h[2-6]/i.test(opts.html)) issues.push({ level: "warning", message: "لا توجد عناوين فرعية — يُفضّل تقسيم المقال بعناوين لتحسين القراءة و SEO." });

  // Empty sections: a heading immediately followed by another heading (or the end) with no real content between.
  const sections = extractSections(opts.html);
  sections.forEach((s) => {
    if (!s.firstParagraph || s.firstParagraph.replace(/\s/g, "").length < 15) {
      issues.push({ level: "warning", message: `القسم "${s.heading}" فارغ أو شبه فارغ.` });
    }
  });

  // Broken/placeholder image sources.
  const imgTags = [...opts.html.matchAll(/<img[^>]+src="([^"]*)"/gi)];
  imgTags.forEach((m) => {
    const src = m[1];
    if (!src || src === "#" || src === "about:blank") issues.push({ level: "error", message: "صورة برابط فارغ أو غير صالح." });
  });

  // Duplicate paragraph detection (copy-paste artifacts).
  const paras = [...opts.html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)].map((m) => m[1].replace(/<[^>]+>/g, "").trim()).filter((p) => p.length > 40);
  const seen = new Map<string, number>();
  paras.forEach((p) => seen.set(p, (seen.get(p) || 0) + 1));
  const dupCount = [...seen.values()].filter((c) => c > 1).length;
  if (dupCount > 0) issues.push({ level: "warning", message: `تم رصد ${dupCount} فقرة مكررة داخل المقال.` });

  if (!opts.references || !opts.references.trim()) {
    issues.push({ level: "warning", message: "لا توجد مراجع علمية مرفقة — يُنصح بإضافة مصدر موثوق." });
  }

  return issues;
}
