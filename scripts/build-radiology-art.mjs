// Section diagrams for the Radiology section → public/cards/art/rad-*.svg (signs follow the section texts).
// Chest X-rays are drawn as schematic films: dark = air, white = dense (bone, heart, fluid). Re-run: node scripts/build-radiology-art.mjs
import { C, T, N, L, arrow, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, RED, BLUE } = C;
const out = {};
const FILM = '#1C252C', BONE = '#E8ECEF', LUNG = '#33414B';

// film helpers (260x190 grid, chest occupies x 20..200)
const ribs = Array.from({ length: 6 }, (_, i) => `<path d="M40 ${40 + i * 20} Q70 ${28 + i * 20} 104 ${38 + i * 20} M116 ${38 + i * 20} Q150 ${28 + i * 20} 180 ${40 + i * 20}" stroke="${BONE}" stroke-width="2" opacity=".55"/>`).join('');
const lungR = (fill = LUNG) => `<path d="M104 30 Q60 26 40 70 Q30 130 42 160 Q74 150 104 154Z" fill="${fill}"/>`;
const lungL = (fill = LUNG) => `<path d="M116 30 Q160 26 180 70 Q190 130 178 160 Q146 150 116 154Z" fill="${fill}"/>`;
const heart = (x = 0, w = 1) => `<path d="M${106 + x} 80 Q${100 + x} 150 ${126 + x} 156 Q${170 * w + x} 160 ${160 * w + x} 104 Q${150 + x} 82 ${124 + x} 86Z" fill="${BONE}" opacity=".85"/>`;
const S = 0.8; // films are drawn on a 220-wide grid and scaled down so the labels fit on the right
const P = v => +(v * S).toFixed(1);
const filmRaw = (inner, trachX = 110) => `<rect x="10" y="6" width="200" height="176" rx="6" fill="${FILM}"/>` + inner + `<path d="M${trachX} 8 V60" stroke="#0E151A" stroke-width="7"/><path d="M110 8 V176" stroke="${BONE}" stroke-width="4" opacity=".35"/>` + ribs;
const film = (inner, trachX) => `<g transform="scale(${S})">${filmRaw(inner, trachX)}</g>`;
const LX = 182; // label column
const at = (x, y, lx, ly, s) => L(P(x), P(y), lx, ly, s, 'start');
const note = (lines, y0 = 30) => lines.map(([s, c], i) => T(LX, y0 + i * 14, s, { size: 8, a: 'start', c: c || NAVY, w: c ? 700 : 400 })).join('');

out['cxr-normal'] = film(lungR() + lungL() + heart() + `<path d="M40 160 Q72 150 104 156 M116 156 Q150 150 180 160" stroke="${BONE}" stroke-width="2"/>`) +
  at(110, 30, LX, 18, 'Trachea: midline') + at(146, 84, LX, 46, 'Aortic knuckle') + at(156, 120, LX, 74, 'Heart (LA + LV border)') +
  at(178, 158, LX, 102, 'Sharp CP angle') + at(110, 120, LX, 130, 'Spine: midline') + N(88, 162, 'PA view · dark = air · white = bone / heart / fluid');

out['cxr-effusion'] = film(lungR() + lungL() + heart() + `<path d="M116 154 L116 112 Q150 112 184 92 L180 160 Q146 152 116 154Z" fill="${BONE}" opacity=".92"/>`) +
  at(176, 100, LX, 40, 'Meniscus: fluid rises') + T(LX + 2, 54, 'at the outer edge', { size: 8.5, a: 'start' }) + at(178, 156, LX, 92, 'CP angle lost (first sign)') +
  note([['Massive: all white', RED], ['+ mediastinum'], ['PUSHED away']], 130);

out['cxr-pneumothorax'] = film(lungR() + `<path d="M116 30 Q160 26 180 70 Q190 130 178 160 Q146 150 116 154Z" fill="#0B1014"/>` + `<path d="M120 50 Q140 46 146 80 Q148 130 122 144Z" fill="${LUNG}" stroke="${BONE}" stroke-width="1.2"/>` + heart()) +
  at(146, 90, LX, 40, 'Collapsed lung edge') + at(170, 70, LX, 70, 'Jet black: no markings') +
  note([['Tension = EMERGENCY', RED], ['mediastinum & trachea'], ['shifted to the other side']], 120);

out['cxr-air-fluid'] = film(lungR() + `<path d="M116 30 Q160 26 180 70 Q190 130 178 160 Q146 150 116 154Z" fill="#0B1014"/>` + `<path d="M116 110 H186 L180 160 Q146 152 116 154Z" fill="${BONE}" opacity=".92"/>` + heart()) +
  `<path d="M${P(116)} ${P(110)} H${P(186)}" stroke="${RED}" stroke-width="1.5" stroke-dasharray="3 2"/>` + at(184, 110, LX, 70, 'STRAIGHT air-fluid level') + note([['air above (black)'], ['fluid below (white)'], ['effusion alone = curved', BLUE]], 92);

out['cxr-cardiomegaly'] = film(lungR() + lungL() + heart(-8, 1.18)) +
  `<path d="M${P(32)} 156 H${P(188)}" stroke="${TEAL}" stroke-width="1.5"/><path d="M${P(90)} 132 H${P(186)}" stroke="${RED}" stroke-width="2"/>` + T(88, 168, 'thoracic width (widest)', { size: 7.5, c: TEAL }) + T(P(138), 142, 'heart width', { size: 7.5, c: RED }) +
  note([['Cardio-thoracic ratio', NAVY], ['normal < 50%'], ['> 50% = cardiomegaly', RED], ['PA view only'], ['flask shape → pericardial'], ['effusion']], 34);

const mini = (x, trach, rFill, label, sub) => `<g transform="translate(${x} 14) scale(0.5)">${filmRaw(lungR(rFill) + lungL() + heart(trach - 110), trach)}</g>` + T(x + 55, 118, label, { size: 9.5, c: TEAL }) + sub.map((s, i) => N(x + 55, 132 + i * 11, s, 'middle', 7)).join('');
out['mediastinal-shift'] = mini(14, 132, BONE, 'PUSHED away', ['more volume on one side', 'massive effusion,', 'tension pneumothorax']) + mini(166, 90, '#9AA3A9', 'PULLED toward', ['less volume on one side', 'lobar collapse,', 'after pneumonectomy']) +
  N(152, 186, 'follow the trachea: which way did it move, and why?');

out['hounsfield'] = (() => {
  const items = [['Air', -1000, '#05080A'], ['Fat', -75, '#3A4248'], ['Water', 0, '#6B747A'], ['CSF', 15, '#747D83'], ['White matter', 25, '#8A9399'], ['Gray matter', 38, '#9AA3A9'], ['Blood', 55, '#B9C1C6'], ['Calcification', 170, '#DCE2E6'], ['Bone', 1000, '#FFFFFF']];
  return items.map(([n, v, c], i) => { const y = 8 + i * 20; return `<rect x="10" y="${y}" width="44" height="16" rx="3" fill="${c}" stroke="#5b6b75" stroke-width=".6"/>` + T(62, y + 12, n, { size: 8.5, a: 'start' }) + T(176, y + 12, `${v > 0 ? '+' : ''}${v}`, { size: 9, a: 'end', c: TEAL }); }).join('') +
    N(190, 40, 'blood (40–70) is', 'start') + N(190, 50, 'brighter than brain', 'start') + T(190, 72, 'not sure?', { size: 8, a: 'start', c: RED }) + N(190, 82, 'measure the HU', 'start') + N(190, 160, 'darker ↑  brighter ↓', 'start');
})();

writeAll('rad', out);
