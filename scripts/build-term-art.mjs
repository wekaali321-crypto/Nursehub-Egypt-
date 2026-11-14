// Generates the simple teaching drawings for medical-term flashcards: public/cards/art/<name>.svg
// Three families, one style (Navy #153448 lines, Teal #168C91 highlight, light grey reference shapes):
//   body-*  : a front-view body with ONE organ / region highlighted ("where is it?")
//   pos-*   : a reference shape + a teal dot / arrow ("above / below / between / inside / around …")
//   idea-*  : quantity / speed / size ideas (hyper / hypo, tachy / brady, macro / micro, uni / bi / poly …)
// Static files served by Cloudflare Pages (no D1 / Supabase). Re-run:  node scripts/build-term-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = join(ROOT, 'public/cards/art');
mkdirSync(OUT, { recursive: true });

const NAVY = '#153448', TEAL = '#168C91', GREY = '#E3EAEE', MID = '#B9C6CE', RED = '#D64545';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const arrowDef = (id, c) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker></defs>`;

// ---------------------------------------------------------------- body (viewBox 160 x 250)
const BODY = `
  <circle cx="80" cy="30" r="20" fill="${GREY}" stroke="${MID}" stroke-width="2"/>
  <rect x="72" y="48" width="16" height="12" rx="4" fill="${GREY}" stroke="${MID}" stroke-width="2"/>
  <path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" fill="${GREY}" stroke="${MID}" stroke-width="2"/>
  <path d="M46 64 Q36 70 34 92 L28 146" stroke="${MID}" stroke-width="11"/>
  <path d="M114 64 Q124 70 126 92 L132 146" stroke="${MID}" stroke-width="11"/>
  <path d="M62 150 L58 240" stroke="${MID}" stroke-width="15"/>
  <path d="M98 150 L102 240" stroke="${MID}" stroke-width="15"/>`;
const hi = (s) => s.replaceAll('$T', TEAL).replaceAll('$N', NAVY);
const organs = {
  brain: `<path d="M64 30 Q62 14 78 12 Q96 10 98 26 Q100 38 86 40 L72 40 Q64 38 64 30Z" fill="$T" stroke="$N" stroke-width="1.5"/><path d="M80 14 Q76 24 82 32 M70 24 Q76 26 74 34 M90 22 Q86 28 92 34" stroke="#fff" stroke-width="1.3"/>`,
  eye: `<ellipse cx="72" cy="28" rx="5" ry="3.4" fill="#fff" stroke="$T" stroke-width="2"/><circle cx="72" cy="28" r="1.8" fill="$T"/><ellipse cx="88" cy="28" rx="5" ry="3.4" fill="#fff" stroke="$T" stroke-width="2"/><circle cx="88" cy="28" r="1.8" fill="$T"/>`,
  ear: `<path d="M58 24 Q53 30 58 38 Q62 34 60 28Z" fill="$T" stroke="$N" stroke-width="1.5"/><path d="M102 24 Q107 30 102 38 Q98 34 100 28Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  nose: `<path d="M80 24 L76 36 L84 36 Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  mouth: `<path d="M71 40 Q80 47 89 40 Q80 43 71 40Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  face: `<circle cx="80" cy="30" r="17" fill="none" stroke="$T" stroke-width="3"/>`,
  skull: `<path d="M61 32 Q60 10 80 10 Q100 10 99 32" stroke="$T" stroke-width="4"/>`,
  neck: `<rect x="74" y="47" width="12" height="15" rx="3" fill="$T"/>`,
  thyroid: `<path d="M71 54 Q74 50 79 55 L81 55 Q86 50 89 54 Q90 60 84 60 L76 60 Q70 60 71 54Z" fill="$T" stroke="$N" stroke-width="1.2"/>`,
  trachea: `<path d="M80 46 L80 76 M80 76 L68 88 M80 76 L92 88" stroke="$T" stroke-width="4"/><path d="M76 52 H84 M76 58 H84 M76 64 H84 M76 70 H84" stroke="$N" stroke-width="1.2"/>`,
  lungs: `<path d="M77 70 Q60 68 56 92 Q54 110 66 112 Q76 112 77 100Z" fill="$T" stroke="$N" stroke-width="1.5"/><path d="M83 70 Q100 68 104 92 Q106 110 94 112 Q84 112 83 100Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  pleura: `<path d="M77 70 Q60 68 56 92 Q54 110 66 112 Q76 112 77 100Z" fill="#fff" stroke="$T" stroke-width="3.5"/><path d="M83 70 Q100 68 104 92 Q106 110 94 112 Q84 112 83 100Z" fill="#fff" stroke="$T" stroke-width="3.5"/>`,
  chest: `<path d="M50 66 Q80 58 110 66 L108 112 L52 112Z" fill="$T" opacity=".85"/>`,
  heart: `<path d="M84 104 Q70 96 70 86 Q70 79 77 79 Q82 79 84 84 Q86 79 91 79 Q98 79 98 86 Q98 96 84 104Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  vessels: `<path d="M84 84 L84 150 M84 150 L64 236 M84 150 L100 236 M80 70 Q60 64 44 76 L31 146 M86 70 Q104 64 117 76 L130 146" stroke="${RED}" stroke-width="2.6"/><path d="M84 84 Q76 72 86 66" stroke="${RED}" stroke-width="3"/>`,
  liver: `<path d="M52 112 Q54 104 74 104 Q86 104 84 112 Q72 124 54 124 Q50 120 52 112Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  gallbladder: `<path d="M52 112 Q54 104 74 104 Q86 104 84 112 Q72 124 54 124 Q50 120 52 112Z" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/><ellipse cx="70" cy="122" rx="5" ry="7" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  stomach: `<path d="M88 106 Q104 102 106 114 Q108 128 94 130 Q86 130 84 124 Q92 124 94 118 Q94 112 88 112Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  spleen: `<ellipse cx="108" cy="112" rx="5" ry="9" fill="$T" stroke="$N" stroke-width="1.5" transform="rotate(20 108 112)"/>`,
  intestine: `<path d="M60 128 H100 V146 H60 Z" fill="none" stroke="$T" stroke-width="5"/><path d="M68 134 Q74 130 80 136 Q86 142 92 134 M68 142 Q76 138 84 142" stroke="$T" stroke-width="3"/>`,
  colon: `<path d="M60 146 V128 H100 V146 Q100 152 92 152" stroke="$T" stroke-width="6"/>`,
  rectum: `<path d="M60 128 H100 V146" stroke="${MID}" stroke-width="4"/><path d="M80 140 V156" stroke="$T" stroke-width="7"/>`,
  duodenum: `<path d="M84 124 Q76 130 80 138 Q86 142 90 136" stroke="$T" stroke-width="5"/>`,
  abdomen: `<path d="M50 112 H110 L106 150 H54Z" fill="$T" opacity=".85"/>`,
  kidneys: `<path d="M60 114 Q52 118 56 130 Q60 138 66 132 Q62 124 66 118 Q64 112 60 114Z" fill="$T" stroke="$N" stroke-width="1.5"/><path d="M100 114 Q108 118 104 130 Q100 138 94 132 Q98 124 94 118 Q96 112 100 114Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  adrenal: `<path d="M60 114 Q52 118 56 130 Q60 138 66 132 Q62 124 66 118 Q64 112 60 114Z" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/><path d="M100 114 Q108 118 104 130 Q100 138 94 132 Q98 124 94 118 Q96 112 100 114Z" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/><path d="M54 114 L60 104 L68 114Z M92 114 L100 104 L106 114Z" fill="$T" stroke="$N" stroke-width="1.2"/>`,
  ureters: `<path d="M62 132 Q66 142 76 150 M98 132 Q94 142 84 150" stroke="$T" stroke-width="3"/><ellipse cx="80" cy="154" rx="8" ry="6" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/>`,
  bladder: `<path d="M71 148 Q80 140 89 148 Q92 160 80 162 Q68 160 71 148Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  uterus: `<path d="M72 138 Q80 132 88 138 L84 152 L82 158 L78 158 L76 152Z" fill="$T" stroke="$N" stroke-width="1.5"/><path d="M72 139 Q64 136 62 142 M88 139 Q96 136 98 142" stroke="$T" stroke-width="2"/><circle cx="61" cy="144" r="3" fill="$T"/><circle cx="99" cy="144" r="3" fill="$T"/>`,
  ovaries: `<path d="M72 138 Q80 132 88 138 L84 152 L82 158 L78 158 L76 152Z" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/><path d="M72 139 Q64 136 62 142 M88 139 Q96 136 98 142" stroke="${MID}" stroke-width="2"/><ellipse cx="60" cy="144" rx="5" ry="4" fill="$T" stroke="$N" stroke-width="1.5"/><ellipse cx="100" cy="144" rx="5" ry="4" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  breast: `<circle cx="66" cy="88" r="10" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="94" cy="88" r="10" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  umbilicus: `<circle cx="80" cy="130" r="4" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="80" cy="130" r="9" stroke="$T" stroke-width="1.5" stroke-dasharray="2 3"/>`,
  pelvis: `<path d="M52 140 Q80 128 108 140 L102 160 Q80 166 58 160Z" fill="$T" opacity=".85"/>`,
  spine: `<path d="M80 50 V150" stroke="$T" stroke-width="5" stroke-dasharray="5 2"/>`,
  ribs: `<path d="M58 72 Q80 64 102 72 M56 82 Q80 74 104 82 M56 92 Q80 84 104 92 M57 102 Q80 94 103 102" stroke="$T" stroke-width="3"/><path d="M80 66 V104" stroke="$N" stroke-width="2"/>`,
  bones: `<path d="M34 92 L28 146 M126 92 L132 146 M62 152 L58 240 M98 152 L102 240" stroke="$T" stroke-width="5"/><circle cx="62" cy="194" r="4" fill="#fff" stroke="$T" stroke-width="2"/><circle cx="98" cy="194" r="4" fill="#fff" stroke="$T" stroke-width="2"/>`,
  joint: `<circle cx="60" cy="196" r="8" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="100" cy="196" r="8" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="35" cy="96" r="6" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="125" cy="96" r="6" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  hip: `<circle cx="62" cy="152" r="7" fill="$T" stroke="$N" stroke-width="1.5"/><circle cx="98" cy="152" r="7" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  wrist: `<rect x="23" y="138" width="11" height="8" rx="3" fill="$T"/><rect x="126" y="138" width="11" height="8" rx="3" fill="$T"/>`,
  fingers: `<path d="M24 148 L20 160 M28 149 L26 162 M32 149 L32 162 M136 148 L140 160 M132 149 L134 162 M128 149 L128 162" stroke="$T" stroke-width="3"/>`,
  muscle: `<path d="M36 70 Q48 76 40 96 Q34 96 34 86Z M124 70 Q112 76 120 96 Q126 96 126 86Z M60 160 Q70 180 62 200 Q54 186 56 170Z M100 160 Q90 180 98 200 Q106 186 104 170Z" fill="$T" stroke="$N" stroke-width="1.5"/>`,
  skin: `<circle cx="80" cy="30" r="20" stroke="$T" stroke-width="3.5"/><path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" stroke="$T" stroke-width="3.5"/>`,
  fat: `<path d="M52 114 Q80 126 108 114 L106 140 Q80 150 54 140Z" fill="#F2C94C" stroke="#C9A227" stroke-width="1.5"/>`,
  mouthTeeth: `<path d="M71 39 H89 V44 Q80 48 71 44Z" fill="#fff" stroke="$T" stroke-width="2"/><path d="M75 39 V44 M80 39 V45 M85 39 V44" stroke="$T" stroke-width="1.2"/>`,
  throat: `<path d="M76 40 Q80 44 84 40 L84 60 L76 60Z" fill="$T" stroke="$N" stroke-width="1.2"/>`,
};
// Small head / neck structures are drawn on the same body but shown zoomed on the head (still recognisable, readable on a card).
const HEAD = [44, 2, 72, 66], NECK = [52, 8, 56, 64];
const ZOOM = { brain: HEAD, eye: HEAD, ear: HEAD, nose: HEAD, mouth: HEAD, face: HEAD, skull: HEAD, mouthTeeth: HEAD, throat: NECK, thyroid: NECK, neck: NECK };
for (const [name, part] of Object.entries(organs)) {
  const z = ZOOM[name];
  const out = z
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${z.join(' ')}" width="${z[2] * 4}" height="${z[3] * 4}" fill="none" stroke-linecap="round" stroke-linejoin="round">${BODY + hi(part)}</svg>`
    : svg(160, 250, BODY + hi(part));
  writeFileSync(join(OUT, `body-${name}.svg`), out);
}

// ---------------------------------------------------------------- positions (viewBox 200 x 140)
const REF = (cx = 100, cy = 72, rx = 42, ry = 28) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${GREY}" stroke="${MID}" stroke-width="3"/>`;
const DOT = (cx, cy, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TEAL}" stroke="${NAVY}" stroke-width="2"/>`;
const ARROW = (d, c = TEAL) => `<path d="${d}" stroke="${c}" stroke-width="5" marker-end="url(#a)"/>`;
const pos = {
  above: REF() + DOT(100, 22),
  on: REF() + DOT(100, 38),
  below: REF() + DOT(100, 122),
  between: REF(52, 72, 34, 26) + REF(148, 72, 34, 26) + DOT(100, 72),
  inside: REF() + DOT(100, 72, 12),
  outside: REF() + ARROW('M128 60 L174 30') + DOT(182, 24, 8),
  around: REF() + `<ellipse cx="100" cy="72" rx="62" ry="46" stroke="${TEAL}" stroke-width="5" stroke-dasharray="10 7"/>`,
  beside: REF() + DOT(162, 72),
  behind: DOT(126, 56, 14) + REF(),
  away: `<path d="M100 10 V130" stroke="${MID}" stroke-width="3" stroke-dasharray="6 6"/>` + DOT(100, 72, 8) + ARROW('M110 72 L176 72') + ARROW('M90 72 L24 72'),
  toward: `<path d="M100 10 V130" stroke="${MID}" stroke-width="3" stroke-dasharray="6 6"/>` + ARROW('M176 72 L114 72') + ARROW('M24 72 L86 72'),
  through: REF() + ARROW('M20 72 L180 72'),
  against: ARROW('M20 72 L88 72') + ARROW('M180 72 L112 72', RED),
  middle: `<rect x="20" y="50" width="160" height="44" rx="10" fill="${GREY}" stroke="${MID}" stroke-width="3"/>` + DOT(100, 72),
};
for (const [name, body] of Object.entries(pos)) writeFileSync(join(OUT, `pos-${name}.svg`), svg(200, 140, arrowDef('a', TEAL) + body));

// ---------------------------------------------------------------- ideas (viewBox 200 x 140)
const NORMAL = `<path d="M20 70 H180" stroke="${MID}" stroke-width="3" stroke-dasharray="7 6"/><text x="22" y="62" font-family="sans-serif" font-size="12" fill="#5b6b75">الطبيعي</text>`;
const ecg = (beats) => {
  let d = 'M10 80', x = 10; const step = 180 / beats;
  for (let i = 0; i < beats; i++) { d += ` L${x + step * 0.35} 80 L${x + step * 0.45} 30 L${x + step * 0.55} 110 L${x + step * 0.65} 80 L${x + step} 80`; x += step; }
  return `<path d="${d}" stroke="${TEAL}" stroke-width="3.5"/>`;
};
const circles = (n) => Array.from({ length: n }, (_, i) => DOT(100 - (n - 1) * 17 + i * 34, 72, 13)).join('');
const ideas = {
  increase: NORMAL + `<rect x="80" y="20" width="40" height="100" rx="6" fill="${RED}" opacity=".85"/>` + ARROW('M150 110 L150 26', RED),
  decrease: NORMAL + `<rect x="80" y="96" width="40" height="24" rx="6" fill="${TEAL}"/>` + ARROW('M150 30 L150 114'),
  fast: ecg(6),
  slow: ecg(2),
  big: `<circle cx="70" cy="72" r="52" fill="${TEAL}" stroke="${NAVY}" stroke-width="2"/><circle cx="160" cy="100" r="10" fill="${GREY}" stroke="${MID}" stroke-width="2"/>`,
  small: `<circle cx="70" cy="72" r="46" fill="${GREY}" stroke="${MID}" stroke-width="2"/><circle cx="160" cy="100" r="8" fill="${TEAL}" stroke="${NAVY}" stroke-width="2"/>`,
  one: circles(1), two: circles(2), many: circles(5),
  half: `<circle cx="100" cy="72" r="48" fill="${GREY}" stroke="${MID}" stroke-width="3"/><path d="M100 24 A48 48 0 0 1 100 120 Z" fill="${TEAL}"/>`,
  none: `<circle cx="100" cy="72" r="46" fill="${GREY}" stroke="${MID}" stroke-width="3"/><path d="M66 38 L134 106" stroke="${RED}" stroke-width="8"/>`,
  same: `<rect x="40" y="46" width="52" height="52" rx="10" fill="${TEAL}"/><rect x="108" y="46" width="52" height="52" rx="10" fill="${TEAL}"/>`,
  different: `<rect x="40" y="46" width="52" height="52" rx="10" fill="${TEAL}"/><path d="M134 42 L164 98 H104Z" fill="${NAVY}"/>`,
  bad: `<path d="M20 72 Q40 40 60 72 T100 72" stroke="${TEAL}" stroke-width="5"/><path d="M100 72 L116 54 L128 96 L142 48 L156 92 L180 70" stroke="${RED}" stroke-width="5"/>`,
  together: DOT(84, 72, 22) + DOT(118, 72, 22),
  cold: `<path d="M100 22 V122 M57 47 L143 97 M57 97 L143 47" stroke="#4A90C2" stroke-width="7"/>`,
  hot: `<path d="M100 122 Q60 112 66 76 Q70 52 92 30 Q92 56 106 62 Q110 44 122 36 Q142 66 136 92 Q130 118 100 122Z" fill="${RED}"/>`,
};
for (const [name, body] of Object.entries(ideas)) writeFileSync(join(OUT, `idea-${name}.svg`), svg(200, 140, arrowDef('a', name === 'increase' ? RED : TEAL) + body));

// ---------------------------------------------------------------- movement (viewBox 200 x 200)
const figure = (armL, armR) => `<circle cx="100" cy="34" r="16" fill="${GREY}" stroke="${MID}" stroke-width="3"/><path d="M100 50 V122 M100 122 L82 186 M100 122 L118 186" stroke="${MID}" stroke-width="9"/>
  <path d="M100 66 ${armL}" stroke="${NAVY}" stroke-width="8"/><path d="M100 66 ${armR}" stroke="${NAVY}" stroke-width="8"/><path d="M100 20 V196" stroke="${MID}" stroke-width="2" stroke-dasharray="5 5"/>`;
writeFileSync(join(OUT, 'move-abduction.svg'), svg(200, 200, arrowDef('a', TEAL) + figure('L40 30', 'L160 30') + `<path d="M72 118 Q44 82 50 44" stroke="${TEAL}" stroke-width="4" marker-end="url(#a)"/><path d="M128 118 Q156 82 150 44" stroke="${TEAL}" stroke-width="4" marker-end="url(#a)"/>`));
writeFileSync(join(OUT, 'move-adduction.svg'), svg(200, 200, arrowDef('a', TEAL) + figure('L86 128', 'L114 128') + `<path d="M42 40 Q40 90 76 122" stroke="${TEAL}" stroke-width="4" marker-end="url(#a)"/><path d="M158 40 Q160 90 124 122" stroke="${TEAL}" stroke-width="4" marker-end="url(#a)"/>`));

console.log(`term art: ${Object.keys(organs).length} body + ${Object.keys(pos).length} position + ${Object.keys(ideas).length} idea + 2 movement drawings → public/cards/art`);
