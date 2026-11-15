// Shared drawing kit for the section diagrams (scripts/build-*-art.mjs). One style for the whole site:
// Navy lines, Teal highlight, light grey reference shapes, short English clinical labels; 260 x 190 drawing grid.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(new URL('..', import.meta.url).pathname);
export const OUT = join(ROOT, 'public/cards/art');
export const C = { NAVY: '#153448', TEAL: '#168C91', GREY: '#E3EAEE', MID: '#B9C6CE', RED: '#D64545', BLUE: '#3B6FB6', YEL: '#E8B931', PINK: '#F2B8B5', FAT: '#F6D98B', LTEAL: '#DCEFF0', LRED: '#F8DADA', LBLUE: '#DCE7F5', SUB: '#5b6b75', PURP: '#8E6BBF' };
const W = 304, H = 194, PAD = 22;
const ARROWS = { t: C.TEAL, r: C.RED, b: C.BLUE, n: C.NAVY, y: '#B8860B', p: C.PURP };
const defs = `<defs>${Object.entries(ARROWS).map(([k, c]) => `<marker id="a${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>`;
export const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" font-family="Arial, Helvetica, sans-serif">${defs}<g transform="translate(${PAD} 2)">${body}</g></svg>`;
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** text: o = { size, w (weight), c (colour), a (anchor) } */
export const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 9}" font-weight="${o.w || 700}" fill="${o.c || C.NAVY}" text-anchor="${o.a || 'middle'}">${esc(s)}</text>`;
/** small grey note */
export const N = (x, y, s, a = 'middle', size = 7.5) => T(x, y, s, { size, w: 400, c: C.SUB, a });
/** label with a leader line from a point on the drawing to the text */
export const L = (x1, y1, x2, y2, s, a = 'start') => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${C.MID}" stroke-width="1"/><circle cx="${x1}" cy="${y1}" r="1.6" fill="${C.NAVY}"/>${T(x2 + (a === 'start' ? 2 : a === 'end' ? -2 : 0), y2 + 3, s, { a, size: 8.5 })}`;
export const arrow = (d, k = 't', w = 2.4) => `<path d="${d}" stroke="${ARROWS[k]}" stroke-width="${w}" marker-end="url(#a${k})"/>`;
export const box = (x, y, w, h, label, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 6}" fill="${o.fill || '#fff'}" stroke="${o.stroke || C.NAVY}" stroke-width="${o.sw || 1.5}"/>` + (label ? T(x + w / 2, y + h / 2 + 3, label, { size: o.size || 8, c: o.c }) : '');
export const dot = (x, y, r = 4, fill = C.TEAL) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${C.NAVY}" stroke-width="1"/>`;

export function writeAll(prefix, out) {
  mkdirSync(OUT, { recursive: true });
  for (const [name, body] of Object.entries(out)) writeFileSync(join(OUT, `${prefix}-${name}.svg`), svg(body));
  console.log(`${prefix} diagrams: ${Object.keys(out).length} → public/cards/art/${prefix}-*.svg`);
}
