/**
 * Site reader text: what "Listen to this page" reads, taken from #main-content in page order.
 *  - skipped: navigation, footer, buttons, inputs / forms, labels, hidden or aria-hidden parts, closed dialogs / pop-ups,
 *    scripts / styles / icons, and anything marked data-reader-skip (or the oral-exam cards, data-oral-skip)
 *  - kept: every visible text in order; a new paragraph starts at each block (heading, paragraph, list item, card, cell…)
 *  - cleaned: markup, emoji and decorative symbols removed; English medical terms, numbers and units kept as written
 *  - split: parts of at most MAX characters, cut at paragraph / sentence / comma boundaries (never mid-word)
 */
export const READER_MAX = 1000;

export const SKIP_SELECTOR = [
  "nav", "footer", "aside", "button", "input", "select", "textarea", "form", "label", "option",
  "script", "style", "noscript", "template", "svg", "canvas", "iframe", "video", "audio", "img", "picture",
  "[hidden]", "[inert]", "[aria-hidden='true']", "[role='dialog']", "[role='alertdialog']", "[role='menu']", "[role='tooltip']",
  "dialog:not([open])", "details:not([open]) > :not(summary)", "[data-reader-skip]", "[data-oral-skip]", ".sr-only", ".skip-link",
].join(",");

/** Text cleanup for listening: no markup / emoji / decorative symbols; English terms, digits and units stay. */
export function cleanForSpeech(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, " ")
    .replace(/[•●○■□▪▫◆◇►▶▸▹◀◂→←↑↓⇒⇐✓✔✗✘★☆|_*#`~^=<>{}[\]\\]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const endsSentence = (s: string) => /[.!?؟؛:…]$/.test(s);
const MIN_PARA = 3; // drops avatar initials ("NH"), lone letters and separators

/** Readable paragraphs of a container, in page order. `isVisible` lets tests run without layout. */
export function extractParagraphs(root: Element, isVisible: (el: Element) => boolean = defaultVisible): string[] {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const displayOf = new WeakMap<Element, string>();
  const isBlock = (el: Element) => {
    let d = displayOf.get(el);
    if (d === undefined) { d = win ? win.getComputedStyle(el).display : "block"; displayOf.set(el, d); }
    return d !== "inline" && d !== "contents"; // block, flex, grid, list-item, table-cell, inline-block / inline-flex chips …
  };
  const blockOf = (el: Element): Element => { let e: Element | null = el; while (e && e !== root && !isBlock(e)) e = e.parentElement; return e ?? root; };
  const skipCache = new WeakMap<Element, boolean>();
  const skipped = (el: Element): boolean => {
    let v = skipCache.get(el);
    if (v === undefined) { const hit = el.closest(SKIP_SELECTOR); v = (!!hit && root.contains(hit)) || !isVisible(el); skipCache.set(el, v); }
    return v;
  };

  // the content starts at the page title: chips, breadcrumbs and toolbars placed before the <h1> are not read
  const h1 = [...root.querySelectorAll("h1")].find((h) => !skipped(h)) ?? null;
  const beforeTitle = (n: Node) => !!h1 && !h1.contains(n) && !!(h1.compareDocumentPosition(n) & 2 /* DOCUMENT_POSITION_PRECEDING */);

  const out: string[] = [];
  let cur = "", curBlock: Element | null = null;
  const flush = () => { const t = cleanForSpeech(cur); if (t.length >= MIN_PARA && t !== out[out.length - 1]) out.push(t); cur = ""; };
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || !n.nodeValue?.trim() || skipped(parent) || beforeTitle(n)) continue;
    const b = blockOf(parent);
    if (b !== curBlock) { flush(); curBlock = b; }
    cur += (cur && !/\s$/.test(cur) ? " " : "") + n.nodeValue;
  }
  flush();
  return out;
}

function defaultVisible(el: Element): boolean {
  const he = el as HTMLElement;
  if (typeof he.checkVisibility === "function") return he.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true } as CheckVisibilityOptions);
  return he.getClientRects ? he.getClientRects().length > 0 : true;
}

/** Split one long paragraph at sentence ends, then commas, then spaces. */
function splitLong(p: string, max: number): string[] {
  const out: string[] = [];
  const sentences = p.match(/[^.!?؟؛\n]+(?:[.!?؟؛]+|$)\s*/g) ?? [p];
  let cur = "";
  const push = (s: string) => { const t = s.trim(); if (t) out.push(t); };
  for (const s of sentences) {
    if ((cur + s).length <= max) { cur += s; continue; }
    push(cur); cur = "";
    if (s.length <= max) { cur = s; continue; }
    // a very long sentence: commas, then spaces
    let rest = s;
    while (rest.length > max) {
      const slice = rest.slice(0, max);
      const at = Math.max(slice.lastIndexOf("، "), slice.lastIndexOf(", "), slice.lastIndexOf("; "));
      const cut = at > max * 0.4 ? at + 1 : slice.lastIndexOf(" ") > max * 0.4 ? slice.lastIndexOf(" ") : max;
      push(rest.slice(0, cut)); rest = rest.slice(cut);
    }
    cur = rest;
  }
  push(cur);
  return out;
}

/** Parts to send one by one (each ≤ max), keeping paragraphs together when they fit. */
export function splitChunks(paragraphs: string[], max = READER_MAX): string[] {
  const chunks: string[] = [];
  let cur = "";
  for (const raw of paragraphs) {
    const p = endsSentence(raw) ? raw : `${raw}.`; // headings / list items get a pause
    if (p.length > max) { if (cur) chunks.push(cur); cur = ""; chunks.push(...splitLong(p, max)); continue; }
    if (cur && cur.length + 1 + p.length > max) { chunks.push(cur); cur = p; } else cur = cur ? `${cur} ${p}` : p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** Language of a part: Arabic when it has Arabic letters, else English (the voice is Tarek either way). */
export const langOf = (s: string): "ar" | "en" => (/[؀-ۿ]/.test(s) ? "ar" : "en");
