import type { Category } from "../../lib/types";
import type { MatchedImage, ValidationIssue } from "../../lib/importWizard";
import type { EnhancementFlags } from "../../lib/aiContentGen";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface GeneratedBlock {
  key: keyof EnhancementFlags;
  label: string;
  icon: string;
  html: string;
  selected: boolean;
}

export interface WizardState {
  step: WizardStep;
  // Step 1 — input
  rawHtml: string;
  sourceType: "paste" | "docx" | "pdf" | "md" | "" ;
  parseWarnings: string[];
  images: MatchedImage[];
  // Step 2 — structure & details
  title: string;
  titleEn: string;
  category: Category;
  tags: string;
  author: string;
  coverImageId: string; // references an images[].id, or "" for default
  // Step 3 — AI enhancements
  enhancementFlags: EnhancementFlags;
  generatedBlocks: GeneratedBlock[];
  // Step 4 — SEO
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  slug: string;
  slugTouched: boolean;
  references: string;
  // Step 5 — validation & publish
  issues: ValidationIssue[];
  status: "draft" | "published" | "scheduled" | "private";
  publishDate: string;
}
