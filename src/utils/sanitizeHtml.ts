// src/utils/sanitizeHtml.ts
// Minimal allow-list sanitizer for admin-authored course HTML (no external dependency).
// Drops scripts/iframes/styles, inline event handlers and javascript: URLs; keeps tables, lists,
// images, figures and the nh-box classes.

const BLOCKED_TAGS = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'LINK', 'META', 'FORM', 'BASE']);

export function sanitizeHtml(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html || '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (BLOCKED_TAGS.has(child.tagName)) {
        child.remove();
        continue;
      }
      if (child.tagName === 'IMG') {
        // Chapters can hold dozens of full-resolution figures: load them as they scroll into view.
        child.setAttribute('loading', 'lazy');
        child.setAttribute('decoding', 'async');
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc') child.removeAttribute(attr.name);
        else if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^(javascript|vbscript|data:text)/.test(value.replace(/\s/g, ''))) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
