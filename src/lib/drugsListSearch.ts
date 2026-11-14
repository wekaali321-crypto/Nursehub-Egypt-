import type { Drug } from "./types";

/** Light, dictionary-free normalisation so Arabic spelling variants and Latin case match: strips diacritics/tatweel, unifies alef/ya/ta-marbuta. */
export function normalizeSearch(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export interface IndexedDrug {
  drug: Drug;
  /** name / generic name / Arabic class — the primary match (same fields the list searched before) */
  nameText: string;
  /** class (English), category and indications — matched as a secondary group only */
  indText: string;
  nameNorm: string;
}

export function indexDrugs(drugs: Drug[]): IndexedDrug[] {
  return drugs.map((d) => ({
    drug: d,
    nameNorm: normalizeSearch(d.name),
    nameText: normalizeSearch([d.name, d.nameEn, d.genericName, d.genericNameEn, d.drugClass].filter(Boolean).join(" | ")),
    indText: normalizeSearch([d.drugClassEn, d.category, d.categoryEn, d.indications, d.indicationsEn].filter(Boolean).join(" | ")),
  }));
}

/** All whitespace-separated tokens must appear in the haystack. */
function matches(hay: string, tokens: string[]) {
  return tokens.every((t) => hay.includes(t));
}

export interface SearchSplit {
  byName: Drug[];
  byIndication: Drug[];
}

/**
 * Two groups: drugs matching by name/generic/Arabic class, then — for longer queries (3+ Arabic or 4+ Latin chars) —
 * drugs matching only through class/category/indications text. Uses only fields that already exist.
 */
export function searchDrugs(index: IndexedDrug[], query: string, accept: (d: Drug) => boolean): SearchSplit {
  const q = normalizeSearch(query);
  if (!q) return { byName: index.filter((x) => accept(x.drug)).map((x) => x.drug), byIndication: [] };
  const tokens = q.split(" ");
  const minLen = /[\u0600-\u06FF]/.test(q) ? 3 : 4;
  const byName: Drug[] = [];
  const byIndication: Drug[] = [];
  for (const x of index) {
    if (!accept(x.drug)) continue;
    if (matches(x.nameText, tokens)) byName.push(x.drug);
    else if (q.length >= minLen && matches(x.indText, tokens)) byIndication.push(x.drug);
  }
  return { byName, byIndication };
}
