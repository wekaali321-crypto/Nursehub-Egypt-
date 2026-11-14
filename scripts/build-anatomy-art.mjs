// Section diagrams for the Anatomy section: public/cards/art/anat-<name>.svg
// Simplified teaching diagrams (not decoration, not the text repeated): labelled with the English terms nurses use.
// Same palette as build-term-art.mjs. Static files served by Cloudflare (no D1). Re-run: node scripts/build-anatomy-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = join(ROOT, 'public/cards/art');
mkdirSync(OUT, { recursive: true });

const NAVY = '#153448', TEAL = '#168C91', GREY = '#E3EAEE', MID = '#B9C6CE', RED = '#D64545', BLUE = '#3B6FB6', YEL = '#E8B931', PINK = '#F2B8B5', FAT = '#F6D98B';
const W = 304, H = 194; // drawn on a 260 x 190 grid, shifted by PAD so edge labels are never cut
const PAD = 22;
const svg = (body, w = W, h = H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" font-family="Arial, Helvetica, sans-serif">${defs}<g transform="translate(${PAD} 2)">${body}</g></svg>`;
const defs = `<defs>${['t', 'r', 'b', 'n', 'y'].map((k, i) => `<marker id="a${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${[TEAL, RED, BLUE, NAVY, '#B8860B'][i]}"/></marker>`).join('')}</defs>`;
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 9}" font-weight="${o.w || 700}" fill="${o.c || NAVY}" text-anchor="${o.a || 'middle'}">${esc(s)}</text>`;
/** label with a leader line from (x1,y1) on the drawing to the text at (x2,y2) */
const L = (x1, y1, x2, y2, s, a = 'start') => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${MID}" stroke-width="1"/><circle cx="${x1}" cy="${y1}" r="1.6" fill="${NAVY}"/>${T(x2 + (a === 'start' ? 2 : a === 'end' ? -2 : 0), y2 + 3, s, { a, size: 8.5 })}`;
const arrow = (d, k = 't', w = 2.4, c) => `<path d="${d}" stroke="${c || { t: TEAL, r: RED, b: BLUE, n: NAVY, y: '#B8860B' }[k]}" stroke-width="${w}" marker-end="url(#a${k})"/>`;
const out = {};

// mini figure (front) used by several diagrams
const fig = (x, y, s = 1, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-58" r="9" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M-14 -46 Q0 -50 14 -46 L12 -8 L-12 -8Z" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M-14 -44 L-22 -12 M14 -44 L22 -12 M-6 -8 L-8 30 M6 -8 L8 30" stroke="${MID}" stroke-width="5"/>${extra}</g>`;

// ---------------------------------------------------------------- position & planes
out['planes'] = [
  ['Sagittal', `<path d="M0 -72 V34" stroke="${TEAL}" stroke-width="3" stroke-dasharray="5 3"/>`, 'right | left'],
  ['Frontal (Coronal)', `<ellipse cx="0" cy="-20" rx="26" ry="58" stroke="${TEAL}" stroke-width="3" stroke-dasharray="5 3" transform="rotate(0)"/><path d="M-26 -20 H26" stroke="${TEAL}" stroke-width="1" opacity=".3"/>`, 'front | back'],
  ['Transverse', `<path d="M-30 -24 H30" stroke="${TEAL}" stroke-width="3" stroke-dasharray="5 3"/>`, 'upper | lower'],
].map(([n, plane, sub], i) => fig(48 + i * 82, 108, 1, plane) + T(48 + i * 82, 166, n, { size: 9.5 }) + T(48 + i * 82, 178, sub, { size: 8, w: 400, c: '#5b6b75' })).join('');

out['position'] = fig(130, 112, 1.25, `<path d="M-22 -12 l-2 6 M22 -12 l2 6" stroke="${TEAL}" stroke-width="4"/>`) +
  L(118, 40, 40, 30, 'Head & eyes forward', 'start') + L(103, 98, 40, 120, 'Palms facing forward', 'start') + L(122, 150, 40, 168, 'Feet flat, slightly apart', 'start') + L(130, 52, 200, 30, 'Standing upright', 'start');

out['directions'] = fig(130, 110, 1.2) +
  arrow('M130 30 V12', 'n') + T(130, 9, 'Superior', { size: 8.5 }) + arrow('M130 156 V176', 'n') + T(130, 186, 'Inferior', { size: 8.5 }) +
  arrow('M118 88 H82', 't') + T(60, 91, 'Lateral', { size: 8.5 }) + arrow('M100 100 H124', 't') + T(115, 112, 'Medial', { size: 8 }) +
  `<path d="M130 26 V160" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/>` +
  `<circle cx="155" cy="62" r="3" fill="${RED}"/>` + T(200, 58, 'Proximal (near trunk)', { size: 8 }) + `<circle cx="157" cy="96" r="3" fill="${BLUE}"/>` + T(200, 100, 'Distal (far)', { size: 8 });

const bed = (x, y) => `<path d="M${x - 50} ${y} H${x + 50}" stroke="${MID}" stroke-width="4"/><path d="M${x - 50} ${y} v8 M${x + 50} ${y} v8" stroke="${MID}" stroke-width="3"/>`;
const lying = (x, y, ang = 0, face = 'up') => `<g transform="translate(${x} ${y}) rotate(${ang})"><circle cx="-34" cy="-7" r="6" fill="${GREY}" stroke="${NAVY}" stroke-width="1.5"/><path d="M-27 -6 H22" stroke="${NAVY}" stroke-width="7"/>${face === 'up' ? `<path d="M-33 -12 l2 -2" stroke="${NAVY}" stroke-width="1.5"/>` : ''}</g>`;
out['patient-positions'] = [
  ['Supine', (x, y) => bed(x, y) + lying(x, y - 2)],
  ['Prone', (x, y) => bed(x, y) + `<g transform="translate(${x} ${y - 2})"><circle cx="-34" cy="-7" r="6" fill="${NAVY}"/><path d="M-27 -6 H22" stroke="${NAVY}" stroke-width="7"/></g>`],
  ["Fowler's 45-60°", (x, y) => bed(x, y) + `<g transform="translate(${x} ${y - 2})"><path d="M-6 -4 L-24 -30" stroke="${NAVY}" stroke-width="7"/><circle cx="-28" cy="-37" r="6" fill="${GREY}" stroke="${NAVY}" stroke-width="1.5"/><path d="M-6 -4 H30" stroke="${NAVY}" stroke-width="7"/></g>`],
  ['Lateral (side)', (x, y) => bed(x, y) + `<g transform="translate(${x} ${y - 2})"><circle cx="-34" cy="-9" r="6" fill="${GREY}" stroke="${NAVY}" stroke-width="1.5"/><path d="M-27 -9 H10 Q18 -9 22 -2" stroke="${NAVY}" stroke-width="9"/><path d="M4 -6 l10 -8" stroke="${NAVY}" stroke-width="4"/></g>`],
  ['Trendelenburg', (x, y) => `<g transform="rotate(-12 ${x} ${y})">${bed(x, y)}${lying(x, y - 2)}</g>` + T(x + 40, y - 30, 'head down', { size: 7, w: 400, c: RED })],
  ['Sims (semi-prone)', (x, y) => bed(x, y) + `<g transform="translate(${x} ${y - 2})"><circle cx="-34" cy="-7" r="6" fill="${NAVY}"/><path d="M-27 -6 H12" stroke="${NAVY}" stroke-width="7"/><path d="M12 -6 l14 -10 M12 -6 L28 -4" stroke="${NAVY}" stroke-width="5"/></g>`],
].map(([n, f], i) => { const x = 50 + (i % 3) * 82, y = 50 + Math.floor(i / 3) * 80; return f(x, y) + T(x, y + 24, n, { size: 9 }); }).join('');

// ---------------------------------------------------------------- heart
const HEART_OUT = `<path d="M130 176 Q52 132 46 82 Q42 40 84 34 Q112 30 130 52 Q148 30 176 34 Q218 40 214 82 Q208 132 130 176Z" fill="#FBEDEC" stroke="${RED}" stroke-width="2.5"/>`;
const chambers = `<path d="M84 50 Q74 72 86 92 H124 V54Z" fill="#DCE7F5" stroke="${BLUE}" stroke-width="1.8"/><path d="M136 54 V92 H174 Q186 72 176 50Z" fill="#F8DADA" stroke="${RED}" stroke-width="1.8"/><path d="M86 98 H124 V160 Q96 140 86 98Z" fill="#DCE7F5" stroke="${BLUE}" stroke-width="1.8"/><path d="M136 98 H174 Q164 140 136 162Z" fill="#F8DADA" stroke="${RED}" stroke-width="1.8"/>`;
out['heart-chambers'] = HEART_OUT + chambers +
  T(104, 76, 'RA', { size: 11 }) + T(156, 76, 'LA', { size: 11 }) + T(104, 124, 'RV', { size: 11 }) + T(156, 124, 'LV', { size: 11 }) +
  `<path d="M90 95 H120 M140 95 H170" stroke="${NAVY}" stroke-width="3.5"/>` + L(96, 95, 18, 112, 'Tricuspid', 'start') + L(166, 95, 222, 112, 'Mitral', 'start') +
  `<path d="M112 46 l10 -6 M150 46 l-10 -6" stroke="${NAVY}" stroke-width="3.5"/>` + L(116, 43, 30, 22, 'Pulmonary valve', 'start') + L(146, 43, 196, 22, 'Aortic valve', 'start') +
  T(130, 186, 'Right side = deoxygenated (blue)  ·  Left side = oxygenated (red)', { size: 7.5, w: 400, c: '#5b6b75' });
out['heart-flow'] = HEART_OUT + chambers +
  arrow('M60 20 Q80 30 98 66', 'b') + T(4, 30, '1 from body', { size: 8, a: 'start' }) + T(4, 40, '(vena cava)', { size: 7, a: 'start', w: 400 }) +
  arrow('M104 82 V112', 'b') + T(98, 100, '2', { size: 9, c: BLUE }) +
  arrow('M110 132 Q122 70 112 30', 'b') + T(114, 14, '3 to lungs', { size: 8, a: 'end' }) +
  arrow('M210 20 Q186 32 162 66', 'r') + T(150, 14, '4 from lungs', { size: 8, a: 'start' }) +
  arrow('M156 82 V112', 'r') + T(162, 100, '5', { size: 9, c: RED }) +
  arrow('M150 132 Q140 70 160 22', 'r') + T(176, 186, '6 Aorta → body', { size: 8 });
out['heart-conduction'] = HEART_OUT + chambers +
  `<path d="M96 60 Q118 76 128 96 V112 M128 112 L106 150 M128 112 L156 150" stroke="${YEL}" stroke-width="3.5"/>` +
  `<circle cx="96" cy="60" r="5" fill="${YEL}" stroke="${NAVY}" stroke-width="1.2"/><circle cx="127" cy="94" r="4.5" fill="${YEL}" stroke="${NAVY}" stroke-width="1.2"/>` +
  `<path d="M106 150 Q100 160 112 164 M156 150 Q162 160 150 164" stroke="${YEL}" stroke-width="2"/>` +
  L(96, 60, 20, 40, '1 SA node (pacemaker)', 'start') + L(127, 94, 200, 70, '2 AV node', 'start') + L(128, 106, 200, 92, '3 Bundle of His', 'start') +
  L(150, 142, 200, 130, '4 Bundle branches', 'start') + L(110, 162, 20, 166, '5 Purkinje fibers', 'start');

// ---------------------------------------------------------------- vessels & sites
const ring = (cx, cy, rOut, rIn, fill) => `<circle cx="${cx}" cy="${cy}" r="${rOut}" fill="${fill}" stroke="${NAVY}" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${rIn}" fill="#fff" stroke="${NAVY}" stroke-width="1"/>`;
out['vessel-types'] = ring(50, 78, 34, 13, '#F3B3B3') + T(50, 132, 'Artery', { size: 10 }) + T(50, 145, 'thick muscular wall', { size: 7.5, w: 400 }) + T(50, 156, 'high pressure', { size: 7.5, w: 400 }) +
  ring(130, 78, 32, 24, '#B9CCEA') + `<path d="M118 70 Q130 86 142 70" stroke="${BLUE}" stroke-width="2"/>` + T(130, 132, 'Vein', { size: 10 }) + T(130, 145, 'thin wall + valves', { size: 7.5, w: 400 }) + T(130, 156, 'low pressure', { size: 7.5, w: 400 }) +
  ring(210, 78, 12, 9, '#E9C1D8') + T(210, 132, 'Capillary', { size: 10 }) + T(210, 145, 'one cell thick', { size: 7.5, w: 400 }) + T(210, 156, 'gas & nutrient exchange', { size: 7.5, w: 400 });
out['arm-veins'] = `<path d="M70 10 Q60 90 84 180 L176 180 Q200 90 190 10Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M80 96 Q130 104 180 96" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/>` +
  `<path d="M90 12 Q82 96 96 178" stroke="${BLUE}" stroke-width="4"/><path d="M172 12 Q178 96 164 178" stroke="${BLUE}" stroke-width="4"/><path d="M94 120 Q130 98 168 76" stroke="${BLUE}" stroke-width="4"/>` +
  L(90, 40, 20, 30, 'Cephalic', 'start') + L(174, 40, 206, 30, 'Basilic', 'start') + L(130, 99, 206, 118, 'Median cubital', 'start') + T(130, 92, 'antecubital fossa', { size: 7, w: 400, c: '#5b6b75' }) +
  T(130, 188, 'Median cubital: first choice for venipuncture', { size: 7.5, w: 400, c: '#5b6b75' });
const PULSES = [['Temporal', 70, 26], ['Carotid', 76, 50], ['Apical', 86, 82], ['Brachial', 50, 92], ['Radial', 40, 132], ['Femoral', 70, 150], ['Popliteal', 66, 196], ['Post. tibial', 62, 236], ['Dorsalis pedis', 104, 240]];
out['pulse-points'] = `<svg x="40" y="0" width="140" height="190" viewBox="0 0 160 250">` +
  `<circle cx="80" cy="30" r="20" fill="${GREY}" stroke="${MID}" stroke-width="2"/><rect x="72" y="48" width="16" height="12" rx="4" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M46 64 Q36 70 34 92 L28 146" stroke="${MID}" stroke-width="11"/><path d="M114 64 Q124 70 126 92 L132 146" stroke="${MID}" stroke-width="11"/><path d="M62 150 L58 240" stroke="${MID}" stroke-width="15"/><path d="M98 150 L102 240" stroke="${MID}" stroke-width="15"/>` +
  PULSES.map(([, x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${RED}" stroke="#fff" stroke-width="1.5"/>`).join('') + `</svg>` +
  PULSES.map(([n, x, y], i) => { const X = 40 + (x * 140) / 160, Y = (y * 190) / 250; return L(X, Y, i % 2 ? 196 : 22, 14 + i * 19, n, i % 2 ? 'start' : 'start'); }).join('');

// ---------------------------------------------------------------- IM sites
out['im-deltoid-vastus'] =
  `<path d="M30 20 Q60 10 90 22 L96 140 L70 140 L64 50 Q40 46 30 20Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M40 26 Q66 22 84 30 L74 74 Z" fill="${TEAL}" opacity=".85"/><path d="M38 20 H86" stroke="${NAVY}" stroke-width="2"/>` +
  L(62, 20, 20, 8, 'Acromion', 'start') + T(64, 92, '2-3 fingers', { size: 7.5 }) + T(64, 102, 'below acromion', { size: 7.5 }) + T(64, 162, 'Deltoid', { size: 10 }) + T(64, 174, '≤ 1 mL, adults', { size: 7.5, w: 400 }) +
  `<path d="M150 10 Q140 100 156 180 H214 Q226 100 214 10Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M150 20 H220 M152 172 H216" stroke="${NAVY}" stroke-width="2"/><path d="M198 70 Q206 96 200 124 L214 124 Q220 96 214 70Z" fill="${TEAL}" opacity=".85"/>` +
  `<path d="M146 70 H226 M146 124 H226" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/>` + L(184, 20, 236, 8, 'Greater trochanter', 'end') + L(184, 172, 236, 186, 'Knee', 'end') +
  T(182, 98, 'middle ⅓', { size: 8 }) + T(182, 108, 'outer side', { size: 8 }) + T(184, 152, 'Vastus lateralis', { size: 9 }) + T(184, 162, 'infants & adults', { size: 7.5, w: 400 });
out['im-gluteal'] =
  `<path d="M20 30 Q60 10 110 26 Q124 90 104 168 H24 Q8 100 20 30Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/>` +
  `<circle cx="96" cy="40" r="4" fill="${NAVY}"/><circle cx="40" cy="44" r="4" fill="${NAVY}"/><circle cx="86" cy="104" r="4" fill="${NAVY}"/>` +
  `<path d="M86 104 L96 40 M86 104 L40 44" stroke="${NAVY}" stroke-width="2"/><path d="M58 56 L76 52 L84 82 Z" fill="${TEAL}" opacity=".9"/>` +
  L(96, 40, 104, 8, 'Ant. sup. iliac spine', 'start') + L(40, 44, 4, 8, 'Iliac crest', 'start') + L(86, 104, 60, 124, 'Greater trochanter', 'end') +
  T(64, 150, 'Ventrogluteal', { size: 10 }) + T(64, 162, 'preferred (no major vessels)', { size: 7.5, w: 400 }) +
  `<path d="M150 20 Q196 10 236 22 Q246 90 230 168 H156 Q140 96 150 20Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M193 22 V168 M152 92 H240" stroke="${NAVY}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
  `<path d="M196 30 H232 Q238 60 232 88 H196Z" fill="${TEAL}" opacity=".9"/><path d="M164 120 Q178 140 186 168" stroke="${RED}" stroke-width="3"/>` +
  T(214, 62, 'upper', { size: 7.5, c: '#fff' }) + T(214, 71, 'outer', { size: 7.5, c: '#fff' }) + L(170, 136, 150, 160, 'Sciatic nerve: avoid', 'start') + T(196, 186, 'Dorsogluteal', { size: 9.5 });

// ---------------------------------------------------------------- respiratory
out['upper-airway'] =
  `<path d="M40 30 Q40 10 70 10 H130 Q150 10 150 30 V60 Q170 62 170 80 Q150 84 150 96 V180" fill="none" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M60 40 Q90 30 128 42 L132 58 Q104 52 66 58Z" fill="#DCEFF0" stroke="${TEAL}" stroke-width="2"/>` +
  `<path d="M126 56 Q136 66 134 96 L132 120 H118 L116 96 Q114 70 116 60Z" fill="#DCEFF0" stroke="${TEAL}" stroke-width="2"/>` +
  `<path d="M118 120 H132 V180 H118Z" fill="#DCEFF0" stroke="${TEAL}" stroke-width="2"/><path d="M118 132 H132 M118 146 H132 M118 160 H132" stroke="${TEAL}" stroke-width="1.2"/>` +
  `<path d="M116 102 Q108 96 112 88" stroke="${RED}" stroke-width="3"/><rect x="112" y="122" width="24" height="10" rx="3" fill="${YEL}" opacity=".8"/>` +
  arrow('M30 48 H58', 't') + L(90, 46, 30, 76, 'Nasal cavity', 'start') + L(134, 80, 196, 60, 'Pharynx', 'start') + L(110, 92, 30, 104, 'Epiglottis', 'start') +
  L(136, 127, 196, 122, 'Larynx (vocal cords)', 'start') + L(132, 166, 196, 166, 'Trachea', 'start');
out['lungs-pleura'] =
  `<path d="M130 14 V70 M130 70 L104 92 M130 70 L156 92" stroke="${TEAL}" stroke-width="5"/>` +
  `<path d="M120 60 Q66 50 54 110 Q48 160 86 166 Q116 166 118 130Z" fill="#DCEFF0" stroke="${NAVY}" stroke-width="2"/><path d="M140 60 Q194 50 206 110 Q212 160 174 166 Q144 166 142 130Z" fill="#DCEFF0" stroke="${NAVY}" stroke-width="2"/>` +
  `<path d="M58 100 Q90 98 112 120 M62 132 Q86 126 110 150" stroke="${NAVY}" stroke-width="1.2"/><path d="M202 98 Q174 100 150 118" stroke="${NAVY}" stroke-width="1.2"/>` +
  `<path d="M114 54 Q56 42 44 110 Q38 170 88 174" stroke="${RED}" stroke-width="2.4" stroke-dasharray="4 3"/>` +
  T(84, 120, 'Right lung', { size: 8.5 }) + T(84, 131, '3 lobes', { size: 7.5, w: 400 }) + T(176, 120, 'Left lung', { size: 8.5 }) + T(176, 131, '2 lobes', { size: 7.5, w: 400 }) +
  L(44, 110, 6, 40, 'Pleura (2 layers)', 'start') + L(130, 30, 160, 22, 'Trachea', 'start') + L(104, 92, 160, 40, 'Bronchi', 'start') +
  T(130, 186, 'Pleural space normally holds only a thin film of fluid', { size: 7.5, w: 400, c: '#5b6b75' });
const chest = (x, dome, lungW, label, sub, k) => `<path d="M${x - 50} 30 Q${x} 16 ${x + 50} 30 L${x + 52} 150 H${x - 52}Z" fill="#fff" stroke="${MID}" stroke-width="2"/>` +
  `<ellipse cx="${x - 22}" cy="${76 + dome / 3}" rx="${lungW}" ry="${34 + dome / 2}" fill="#DCEFF0" stroke="${TEAL}" stroke-width="1.6"/><ellipse cx="${x + 22}" cy="${76 + dome / 3}" rx="${lungW}" ry="${34 + dome / 2}" fill="#DCEFF0" stroke="${TEAL}" stroke-width="1.6"/>` +
  `<path d="M${x - 52} ${150 - 10} Q${x} ${150 - 10 - (40 - dome)} ${x + 52} 140" stroke="${RED}" stroke-width="3.5"/>` + T(x, 172, label, { size: 10 }) + T(x, 184, sub, { size: 7.5, w: 400 }) +
  (k === 'in' ? arrow(`M${x} 158 V${144 - (40 - dome) + 18}`, 'r', 2) + arrow(`M${x} 10 V26`, 't', 2) : arrow(`M${x} ${150 - 40 + dome - 2} V${120 - (40 - dome) - 6}`, 'r', 2) + arrow(`M${x} 26 V8`, 't', 2));
out['breathing'] = chest(66, 36, 20, 'Inspiration', 'diaphragm flattens → air in', 'in') + chest(194, 4, 15, 'Expiration', 'diaphragm domes up → air out', 'out');

// ---------------------------------------------------------------- urinary / nephron
out['nephron'] =
  `<circle cx="52" cy="46" r="20" fill="#fff" stroke="${NAVY}" stroke-width="2"/><path d="M42 40 Q52 30 60 42 Q50 54 44 46 Q52 38 58 50" stroke="${RED}" stroke-width="2.5"/>` +
  `<path d="M72 44 Q100 30 104 56 Q108 78 90 82 Q78 86 96 96" stroke="${TEAL}" stroke-width="4"/>` +
  `<path d="M96 96 V160 Q104 176 112 160 V100" stroke="${TEAL}" stroke-width="4"/>` +
  `<path d="M112 100 Q120 80 140 86 Q160 92 150 66 Q144 50 170 46 H196" stroke="${TEAL}" stroke-width="4"/><path d="M196 30 V176" stroke="${NAVY}" stroke-width="6"/>` +
  L(46, 56, 6, 90, 'Glomerulus + Bowman’s capsule', 'start') + T(20, 102, 'filtration', { size: 7.5, w: 400, a: 'start' }) +
  L(100, 46, 104, 14, 'Proximal tubule (reabsorbs most)', 'start') + L(104, 150, 120, 176, 'Loop of Henle (concentrates urine)', 'start') +
  L(152, 72, 160, 100, 'Distal tubule', 'start') + L(196, 120, 210, 140, 'Collecting', 'start') + T(212, 152, 'duct → urine', { size: 8.5, a: 'start' });
out['catheter'] =
  T(66, 14, 'Female', { size: 10 }) + `<path d="M36 26 Q66 18 96 26 Q100 110 66 176 Q32 110 36 26Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/>` +
  `<circle cx="66" cy="54" r="5" fill="${PINK}" stroke="${NAVY}" stroke-width="1.2"/><circle cx="66" cy="82" r="5" fill="${TEAL}" stroke="${NAVY}" stroke-width="1.2"/><ellipse cx="66" cy="112" rx="7" ry="12" fill="${PINK}" stroke="${NAVY}" stroke-width="1.2"/>` +
  L(66, 54, 6, 44, 'Clitoris', 'start') + L(66, 82, 104, 74, 'Urethral meatus', 'start') + L(66, 112, 104, 120, 'Vagina', 'start') + T(66, 186, 'meatus is above the vagina', { size: 7.5, w: 400 }) +
  T(196, 14, 'Male', { size: 10 }) + `<path d="M176 30 H216 V120 Q216 150 196 156 Q176 150 176 120Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M196 30 V150" stroke="${TEAL}" stroke-width="3"/>` +
  `<path d="M196 92 Q186 88 182 74" stroke="${NAVY}" stroke-width="2"/>` + L(196, 60, 168, 44, 'Urethra ~20 cm', 'end') + T(196, 176, 'hold penis at 90° to insert', { size: 7.5, w: 400 });

// ---------------------------------------------------------------- nervous system
const BRAIN = `<path d="M40 110 Q30 50 90 30 Q150 14 196 44 Q226 66 220 104 Q214 128 186 132 L76 132 Q46 132 40 110Z" stroke="${NAVY}" stroke-width="2.2"/>`;
out['brain-lobes'] =
  `<path d="M40 110 Q30 50 90 30 Q112 24 122 26 L118 92 L54 116 Q44 116 40 110Z" fill="#B9E0E2"/><path d="M122 26 Q170 24 192 48 L150 92 L118 92Z" fill="#F6D98B"/><path d="M192 48 Q226 70 220 104 Q216 124 196 130 L150 92Z" fill="#F2B8B5"/><path d="M54 116 L118 92 L150 92 L172 128 L86 132 Q60 130 54 116Z" fill="#C9D8F0"/>` +
  BRAIN + `<path d="M172 132 Q200 156 176 172 Q150 176 148 154Z" fill="#D9CFE8" stroke="${NAVY}" stroke-width="1.6"/><path d="M134 132 L132 180" stroke="${NAVY}" stroke-width="9"/>` +
  T(80, 74, 'Frontal', { size: 10 }) + T(84, 85, 'movement, speech', { size: 6.5, w: 400 }) + T(156, 56, 'Parietal', { size: 10 }) + T(156, 66, 'touch & sensation', { size: 6.5, w: 400 }) +
  T(196, 96, 'Occipital', { size: 9.5 }) + T(196, 106, 'vision', { size: 6.5, w: 400 }) + T(110, 116, 'Temporal', { size: 10 }) + T(110, 126, 'hearing, memory', { size: 6.5, w: 400 }) +
  L(170, 162, 198, 160, 'Cerebellum', 'start') + T(200, 171, 'balance', { size: 7, a: 'start', w: 400 }) + L(133, 170, 112, 184, 'Brainstem: breathing, HR', 'end');
out['meninges'] = [['Skull (bone)', '#E3EAEE', 0], ['Dura mater (tough)', '#D9CFE8', 1], ['Arachnoid mater', '#F2E6F5', 2], ['Subarachnoid space: CSF', '#DCEFF0', 3], ['Pia mater (on the brain)', '#F6D98B', 4], ['Brain', '#F8DADA', 5]]
  .map(([n, c, i]) => `<path d="M20 ${30 + i * 24} Q130 ${10 + i * 24} 240 ${30 + i * 24} V${54 + i * 24} Q130 ${34 + i * 24} 20 ${54 + i * 24}Z" fill="${c}" stroke="${NAVY}" stroke-width="1"/>` + T(130, 44 + i * 24 - (i ? 6 : 6), n, { size: 9 })).join('') +
  T(130, 186, 'Epidural / subdural / subarachnoid bleeding = between these layers', { size: 7.5, w: 400, c: '#5b6b75' });
out['reflex-arc'] =
  `<path d="M140 20 Q186 20 186 80 Q186 140 140 140 Q94 140 94 80 Q94 20 140 20Z" fill="#F2F5F7" stroke="${NAVY}" stroke-width="2"/><path d="M128 50 Q140 80 128 110 Q150 110 152 80 Q150 50 128 50Z" fill="#D9CFE8"/>` +
  `<path d="M24 150 Q40 120 70 110 Q100 96 128 76" stroke="${BLUE}" stroke-width="3"/><circle cx="24" cy="150" r="6" fill="${BLUE}"/>` +
  `<path d="M128 76 H150" stroke="${YEL}" stroke-width="3"/><path d="M150 80 Q120 120 80 150 Q60 162 46 170" stroke="${RED}" stroke-width="3"/><path d="M30 162 Q46 156 58 178" stroke="${RED}" stroke-width="7"/>` +
  arrow('M58 120 L80 108', 'b', 2) + arrow('M100 130 L82 144', 'r', 2) +
  L(24, 150, 4, 120, '1 Receptor (stimulus)', 'start') + L(76, 108, 4, 92, '2 Sensory neuron', 'start') + L(140, 76, 196, 22, '3 Spinal cord', 'start') +
  L(110, 124, 196, 150, '4 Motor neuron', 'start') + L(46, 172, 92, 186, '5 Muscle responds', 'start');
out['spinal-cord'] =
  `<path d="M130 18 Q206 18 206 96 Q206 174 130 174 Q54 174 54 96 Q54 18 130 18Z" fill="#F2F5F7" stroke="${NAVY}" stroke-width="2"/>` +
  `<path d="M130 50 Q110 40 98 56 Q88 72 104 86 Q92 100 98 118 Q112 136 130 124 Q148 136 162 118 Q168 100 156 86 Q172 72 162 56 Q150 40 130 50Z" fill="#D9CFE8" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<circle cx="130" cy="90" r="3" fill="${NAVY}"/><path d="M54 70 Q30 64 12 70 M206 70 Q230 64 248 70" stroke="${BLUE}" stroke-width="3"/><path d="M54 120 Q30 128 12 124 M206 120 Q230 128 248 124" stroke="${RED}" stroke-width="3"/>` +
  L(110, 70, 22, 30, 'Grey matter (H-shape)', 'start') + L(186, 96, 200, 30, 'White matter', 'start') + L(130, 90, 170, 186, 'Central canal', 'start') +
  T(30, 62, 'sensory in', { size: 7.5, c: BLUE }) + T(30, 138, 'motor out', { size: 7.5, c: RED });
out['spine'] = (() => {
  const seg = (y, n, c, w) => Array.from({ length: n }, (_, i) => `<rect x="${118 + Math.sin((y + i * 9) / 30) * 14}" y="${y + i * 9}" width="${w}" height="7" rx="2" fill="${c}" stroke="${NAVY}" stroke-width=".8"/>`).join('');
  return seg(6, 7, '#B9E0E2', 18) + seg(70, 12, '#F6D98B', 20) + seg(178 - 64 + 64 - 64 + 112, 0, '', 0) +
    `<g transform="translate(0 -6)">${seg(184 - 70 + 4, 5, '#F2B8B5', 22).replace(/y="(\d+)"/g, (m, v) => `y="${+v}"`)}</g>` +
    `<path d="M126 166 L148 166 L140 184 L134 184Z" fill="#D9CFE8" stroke="${NAVY}" stroke-width=".8"/><path d="M137 184 l-1 6" stroke="${NAVY}" stroke-width="2"/>` +
    T(70, 34, 'Cervical C1–C7', { size: 9 }) + T(70, 46, 'neck · curves forward', { size: 7, w: 400 }) + T(70, 112, 'Thoracic T1–T12', { size: 9 }) + T(70, 124, 'ribs attach', { size: 7, w: 400 }) +
    T(196, 140, 'Lumbar L1–L5', { size: 9 }) + T(196, 152, 'carries most weight', { size: 7, w: 400 }) + T(196, 178, 'Sacrum + Coccyx', { size: 9 });
})();
out['lumbar-puncture'] =
  `<path d="M60 10 H200 V180 H60Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M130 10 V180" stroke="${MID}" stroke-width="2" stroke-dasharray="4 3"/>` +
  Array.from({ length: 7 }, (_, i) => `<rect x="120" y="${16 + i * 24}" width="20" height="14" rx="3" fill="#fff" stroke="${NAVY}" stroke-width="1"/>`).join('') +
  `<path d="M64 110 Q130 98 196 110" stroke="${RED}" stroke-width="2.5" stroke-dasharray="6 4"/>` + T(130, 106, '', {}) +
  L(70, 108, 6, 90, 'Iliac crests line', 'start') + T(6, 102, '= L4 level', { size: 8, a: 'start' }) +
  arrow('M236 126 L144 126', 'n', 2.4) + T(206, 140, 'Needle: L3–L4 or L4–L5', { size: 8 }) +
  T(150, 26, 'L1', { size: 7.5, a: 'start' }) + T(150, 98, 'L4', { size: 7.5, a: 'start' }) + T(130, 188, 'spinal cord ends at L1–L2, so lower is safe', { size: 7.5, w: 400, c: '#5b6b75' });

// ---------------------------------------------------------------- skin, eye, ear
out['skin-layers'] =
  `<path d="M30 30 Q70 22 110 30 T190 30 T230 30 V60 H30Z" fill="#F4C9A8" stroke="${NAVY}" stroke-width="1.2"/>` +
  `<path d="M30 60 H230 V120 H30Z" fill="#F8DADA" stroke="${NAVY}" stroke-width="1.2"/><path d="M30 120 H230 V176 H30Z" fill="${FAT}" stroke="${NAVY}" stroke-width="1.2"/>` +
  [50, 80, 110, 140, 170, 200].map((x) => `<circle cx="${x}" cy="${148 + (x % 3) * 4}" r="10" fill="#FBE7A8" stroke="#C9A227" stroke-width="1"/>`).join('') +
  `<path d="M80 14 L84 40 L88 100" stroke="${NAVY}" stroke-width="2"/><ellipse cx="88" cy="104" rx="6" ry="9" fill="#fff" stroke="${NAVY}" stroke-width="1.2"/>` +
  `<path d="M150 30 V80 Q160 90 152 100 Q144 108 156 112" stroke="${TEAL}" stroke-width="2"/><path d="M120 80 Q170 70 200 84" stroke="${RED}" stroke-width="2"/>` +
  T(244, 48, 'Epidermis', { size: 9, a: 'end' }) + T(244, 94, 'Dermis', { size: 9, a: 'end' }) + T(226, 136, 'Hypodermis (fat)', { size: 9, a: 'end' }) +
  L(84, 40, 6, 10, 'Hair', 'start') + L(156, 106, 168, 112, 'Sweat gland', 'start') + L(170, 76, 190, 70, 'Vessels', 'start') +
  T(30, 186, 'ID → dermis · SC → fat · IM → muscle below', { size: 7.5, w: 400, a: 'start', c: '#5b6b75' });
out['eye'] =
  `<circle cx="128" cy="96" r="70" fill="#fff" stroke="${NAVY}" stroke-width="2.2"/><path d="M128 26 A70 70 0 0 1 128 166" stroke="${RED}" stroke-width="5" opacity=".7"/>` +
  `<path d="M60 70 Q48 96 60 122" stroke="${TEAL}" stroke-width="4"/><path d="M66 68 V82 M66 110 V124" stroke="${BLUE}" stroke-width="6"/><ellipse cx="80" cy="96" rx="8" ry="16" fill="#DCEFF0" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M196 96 H246" stroke="${YEL}" stroke-width="9"/>` + arrow('M8 96 H40', 'y', 2) +
  L(52, 96, 6, 140, 'Cornea', 'start') + L(66, 76, 6, 40, 'Iris (pupil = hole)', 'start') + L(82, 96, 100, 170, 'Lens', 'start') +
  L(190, 60, 196, 24, 'Retina (sees light)', 'start') + L(220, 96, 226, 120, 'Optic nerve', 'start');
const EAR = (hi) => `<path d="M20 50 Q10 96 30 130 Q44 140 46 118 Q40 96 50 80 Q46 54 20 50Z" fill="${hi === 'outer' ? '#B9E0E2' : '#F4E3D7'}" stroke="${NAVY}" stroke-width="1.6"/>` +
  `<path d="M46 96 H102" stroke="${hi === 'outer' ? TEAL : MID}" stroke-width="12"/><path d="M104 80 V112" stroke="${hi === 'middle' ? RED : NAVY}" stroke-width="3"/>` +
  `<path d="M106 92 L118 86 L128 96 L140 92" stroke="${hi === 'middle' ? RED : NAVY}" stroke-width="4"/><path d="M118 112 L138 130" stroke="${hi === 'middle' ? RED : MID}" stroke-width="5"/>` +
  `<path d="M150 74 Q152 54 168 56 Q182 60 176 76 M160 70 Q166 44 182 50 Q196 58 186 76" stroke="${hi === 'inner' ? TEAL : MID}" stroke-width="3"/>` +
  `<path d="M150 104 Q150 84 168 86 Q186 90 182 108 Q176 122 164 116 Q156 108 166 102" stroke="${hi === 'inner' ? TEAL : MID}" stroke-width="4"/><path d="M186 100 H240" stroke="${hi === 'inner' ? YEL : MID}" stroke-width="5"/>`;
out['ear-outer-middle'] = EAR('middle') + `<path d="M46 96 H102" stroke="${TEAL}" stroke-width="12" opacity=".6"/>` +
  L(30, 70, 4, 30, 'Pinna', 'start') + L(74, 96, 40, 156, 'Ear canal', 'start') + L(104, 84, 80, 20, 'Tympanic membrane', 'start') +
  L(124, 94, 130, 40, 'Ossicles: malleus · incus · stapes', 'start') + L(130, 124, 140, 160, 'Eustachian tube → throat', 'start');
out['ear-inner'] = EAR('inner') + L(176, 60, 186, 16, 'Semicircular canals', 'start') + T(188, 27, '(balance)', { size: 7, a: 'start', w: 400 }) + L(166, 112, 120, 172, 'Cochlea: hearing', 'start') + L(220, 100, 214, 136, 'Auditory nerve', 'start') +
  T(60, 186, 'sound → canal → drum → ossicles → cochlea → nerve', { size: 7.5, w: 400, a: 'start', c: '#5b6b75' });

// ---------------------------------------------------------------- breast, cycle, joints
out['breast-quadrants'] =
  `<circle cx="120" cy="100" r="66" fill="#F8E4E0" stroke="${NAVY}" stroke-width="2"/><path d="M54 100 H186 M120 34 V166" stroke="${NAVY}" stroke-width="1.4" stroke-dasharray="4 3"/>` +
  `<path d="M168 52 Q196 30 214 22" stroke="${TEAL}" stroke-width="16" opacity=".55"/><circle cx="120" cy="100" r="9" fill="${PINK}" stroke="${NAVY}" stroke-width="1.5"/>` +
  T(150, 72, 'UOQ', { size: 11 }) + T(150, 84, 'most cancers', { size: 7, w: 400, c: RED }) + T(90, 72, 'UIQ', { size: 11 }) + T(90, 136, 'LIQ', { size: 11 }) + T(150, 136, 'LOQ', { size: 11 }) +
  L(204, 28, 216, 50, 'Tail of Spence', 'start') + T(216, 62, '→ axilla nodes', { size: 7.5, a: 'start', w: 400 }) + T(120, 186, 'right breast as you face the patient', { size: 7.5, w: 400, c: '#5b6b75' });
out['menstrual-cycle'] = (() => {
  const x = (d) => 24 + (d / 28) * 220;
  return `<path d="M24 160 H244" stroke="${NAVY}" stroke-width="1.5"/>` +
    [[0, 5, '#F2B8B5', 'Menses'], [5, 13, '#DCEFF0', 'Follicular'], [13, 15, '#F6D98B', 'Ov.'], [15, 28, '#E7E0F2', 'Luteal']]
      .map(([a, b, c, n]) => `<rect x="${x(a)}" y="164" width="${x(b) - x(a)}" height="16" fill="${c}"/>` + T((x(a) + x(b)) / 2, 175, n, { size: 7.5 })).join('') +
    `<path d="M${x(0)} 140 Q${x(8)} 130 ${x(12)} 60 Q${x(14)} 110 ${x(18)} 100 Q${x(22)} 90 ${x(28)} 140" stroke="${TEAL}" stroke-width="2.5"/>` +
    `<path d="M${x(0)} 150 Q${x(14)} 150 ${x(16)} 130 Q${x(21)} 50 ${x(28)} 150" stroke="#8E6BBF" stroke-width="2.5"/>` +
    `<path d="M${x(0)} 152 Q${x(12)} 150 ${x(13.5)} 20 Q${x(15)} 150 ${x(28)} 152" stroke="${RED}" stroke-width="2"/>` +
    T(x(13.5) + 4, 20, 'LH surge → ovulation (day 14)', { size: 8, a: 'start', c: RED }) + T(x(9) - 18, 72, 'Estrogen', { size: 8.5, c: TEAL }) + T(x(23), 66, 'Progesterone', { size: 8.5, c: '#8E6BBF' }) +
    [1, 7, 14, 21, 28].map((d) => T(x(d), 188, `d${d}`, { size: 7, w: 400 })).join('');
})();
out['joint-movements'] = [
  ['Flexion', 'angle smaller', `<path d="M0 0 L0 -40" stroke="${NAVY}" stroke-width="7"/><path d="M0 0 L26 -26" stroke="${TEAL}" stroke-width="7"/>`, 'M8 -40 Q24 -40 26 -32'],
  ['Extension', 'angle opens', `<path d="M0 0 L0 -40" stroke="${NAVY}" stroke-width="7"/><path d="M0 0 L0 40" stroke="${TEAL}" stroke-width="7"/>`, 'M20 -10 Q24 10 12 30'],
  ['Rotation', 'own axis', `<path d="M0 -40 V40" stroke="${NAVY}" stroke-width="7"/><ellipse cx="0" cy="-10" rx="22" ry="8" stroke="${TEAL}" stroke-width="2.5"/>`, ''],
  ['Circumduction', 'shoulder, hip', `<path d="M0 -40 L18 30" stroke="${NAVY}" stroke-width="7"/><ellipse cx="0" cy="34" rx="24" ry="8" stroke="${TEAL}" stroke-width="2.5" stroke-dasharray="4 3"/>`, ''],
].map(([n, sub, g, arc], i) => { const X = 34 + i * 64; return `<g transform="translate(${X} 80)">${g}${arc ? `<path d="${arc}" stroke="${RED}" stroke-width="2" marker-end="url(#ar)"/>` : ''}<circle cx="0" cy="0" r="6" fill="#fff" stroke="${NAVY}" stroke-width="2"/></g>` + T(X, 150, n, { size: 9 }) + T(X, 162, sub, { size: 6.5, w: 400 }); }).join('');

for (const [name, body] of Object.entries(out)) writeFileSync(join(OUT, `anat-${name}.svg`), svg(body));
console.log(`anatomy diagrams: ${Object.keys(out).length} → public/cards/art/anat-*.svg`);
