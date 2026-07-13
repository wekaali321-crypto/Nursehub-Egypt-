/**
 * Client-side file parsers for the Content Import Wizard.
 * Everything runs in the browser — no server upload required.
 */
import mammoth from "mammoth";

export interface ParsedDocument {
  html: string;
  warnings: string[];
}

/** Parse a Word (.docx) file into semantic HTML (headings, lists, bold, images preserved as base64). */
export async function parseDocx(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read("base64");
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    }
  );
  return { html: cleanupHtml(result.value), warnings: result.messages.map((m) => m.message) };
}

const PDFJS_VERSION = "5.6.205"; // keep in sync with the installed pdfjs-dist devDependency

/**
 * Load pdf.js from a CDN at runtime (not bundled). This project builds to a
 * single self-contained HTML file — bundling the ~1MB pdf.js core would bloat
 * every page load even for the vast majority of visitors who never touch the
 * PDF import feature. The `/* @vite-ignore *\/` comment tells Vite to leave
 * this as a genuine runtime import instead of trying to resolve/inline it.
 */
async function loadPdfJs(): Promise<any> {
  const url = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
  const pdfjsLib: any = await import(/* @vite-ignore */ url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  return pdfjsLib;
}

/** Extract raw text from a PDF, grouped by page, and turn it into paragraphs. */
export async function parsePdf(file: File): Promise<ParsedDocument> {
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const warnings: string[] = [];
  const paragraphs: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Group text items into lines based on their vertical position, then merge short lines into paragraphs.
    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const item of textContent.items as any[]) {
      const y = item.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(y - lastY) > 4 && line.trim()) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + " ";
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());

    // Merge consecutive short lines (wrapped sentences) into paragraphs; long standalone lines become headings.
    let buffer = "";
    for (const l of lines) {
      const isHeadingLike = l.length < 70 && /[:：]?$/.test(l) && l === l.trim() && !/[.!؟]$/.test(l) && l.split(" ").length <= 10;
      if (isHeadingLike && buffer.trim().length < 5) {
        if (buffer.trim()) paragraphs.push(buffer.trim());
        paragraphs.push(`##HEADING##${l}`);
        buffer = "";
      } else {
        buffer += " " + l;
        if (/[.!؟]$/.test(l)) { paragraphs.push(buffer.trim()); buffer = ""; }
      }
    }
    if (buffer.trim()) paragraphs.push(buffer.trim());
  }

  if (!paragraphs.length) warnings.push("لم يتم العثور على نص قابل للاستخراج — قد يكون الملف صوراً ممسوحة ضوئياً (Scanned PDF).");

  const html = paragraphs
    .map((p) => (p.startsWith("##HEADING##") ? `<h2>${escapeHtml(p.replace("##HEADING##", ""))}</h2>` : `<p>${escapeHtml(p)}</p>`))
    .join("\n");

  return { html: cleanupHtml(html), warnings };
}

/** Convert a lightweight Markdown subset into HTML (headings, bold, italic, lists, links, images, blockquotes). */
export function parseMarkdown(md: string): ParsedDocument {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inCode = false;

  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = null; } };

  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line)) {
      if (inCode) { out.push("</code></pre>"); inCode = false; } else { closeList(); out.push("<pre><code>"); inCode = true; }
      continue;
    }
    if (inCode) { out.push(escapeHtml(line)); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) { closeList(); out.push(`<h${h[1].length === 1 ? 2 : Math.min(h[1].length, 6)}>${inlineMd(h[2])}</h${h[1].length === 1 ? 2 : Math.min(h[1].length, 6)}>`); continue; }

    if (/^>\s?/.test(line)) { closeList(); out.push(`<blockquote>${inlineMd(line.replace(/^>\s?/, ""))}</blockquote>`); continue; }

    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ol) { if (inList !== "ol") { closeList(); out.push("<ol>"); inList = "ol"; } out.push(`<li>${inlineMd(ol[1])}</li>`); continue; }

    const ul = line.match(/^\s*[-*]\s+(.*)/);
    if (ul) { if (inList !== "ul") { closeList(); out.push("<ul>"); inList = "ul"; } out.push(`<li>${inlineMd(ul[1])}</li>`); continue; }

    if (!line.trim()) { closeList(); continue; }

    closeList();
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  closeList();
  return { html: cleanupHtml(out.join("\n")), warnings: [] };
}

function inlineMd(text: string): string {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** Convert freeform pasted plain text into structured HTML: blank-line paragraphs, short standalone lines become H2s. */
export function parsePlainText(text: string): ParsedDocument {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const html = blocks
    .map((b) => {
      const singleLine = !b.includes("\n");
      const looksLikeHeading = singleLine && b.length < 80 && !/[.!؟]$/.test(b);
      if (looksLikeHeading) return `<h2>${escapeHtml(b)}</h2>`;
      return `<p>${escapeHtml(b).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return { html: cleanupHtml(html), warnings: [] };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Basic cleanup: collapse empty paragraphs, trim mammoth's wrapper artifacts. */
function cleanupHtml(html: string): string {
  return html
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/(<br\s*\/?>\s*){3,}/g, "<br/><br/>")
    .trim();
}

/** Read an image file as a data URL (for immediate preview + section matching). */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
