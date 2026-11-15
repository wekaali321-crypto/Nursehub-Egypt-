// Section diagrams for the NICU section → public/cards/art/nicu-*.svg (values follow the section texts).
// Re-run: node scripts/build-nicu-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F6DCCB';

// simple newborn seen from above (head left)
const baby = (x, y, s = 1, prone = false) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-46" cy="0" r="20" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>` +
  `<ellipse cx="0" cy="0" rx="34" ry="24" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M-14 -22 Q-22 -40 -34 -40 M-14 22 Q-22 40 -34 40 M28 -14 Q44 -30 58 -28 M28 14 Q44 30 58 28" stroke="${SKIN}" stroke-width="9"/>` +
  `<path d="M-14 -22 Q-22 -40 -34 -40 M-14 22 Q-22 40 -34 40 M28 -14 Q44 -30 58 -28 M28 14 Q44 30 58 28" stroke="${MID}" stroke-width="1" fill="none"/>` + (prone ? `<path d="M-20 0 H24" stroke="${MID}" stroke-width="1.5" stroke-dasharray="3 3"/>` : `<circle cx="6" cy="2" r="2" fill="${MID}"/>`) + `</g>`;

out['temp-probe'] = baby(70, 80, 1) + dot(62, 72, 6, YEL) + T(70, 150, 'Supine', { size: 10 }) + N(70, 162, 'abdomen or over the liver') +
  baby(196, 80, 1, true) + dot(214, 58, 6, YEL) + T(196, 150, 'Prone', { size: 10 }) + N(196, 162, 'on the flank') + T(130, 14, 'Where to put the skin temperature probe', { size: 9 }) +
  N(130, 186, 'yellow = probe');

out['gestational-age'] = (() => {
  const x = (w) => 10 + ((w - 24) / 20) * 240;
  return `<path d="M10 100 H250" stroke="${NAVY}" stroke-width="1.5"/>` +
    [[24, 34, LRED, 'Preterm', '< 37 weeks'], [34, 37, '#FBE3C8', 'Late preterm', '34 – 36⁶⁄₇'], [37, 42, LTEAL, 'Term', '37 – 42 weeks'], [42, 44, LBLUE, 'Post-term', '> 42']]
      .map(([a, b, c, n, s], i) => `<rect x="${x(a)}" y="70" width="${x(b) - x(a)}" height="30" fill="${c}" stroke="${NAVY}" stroke-width=".8"/>` + T((x(a) + x(b)) / 2, i % 2 ? 56 : 128, n, { size: 9 }) + N((x(a) + x(b)) / 2, i % 2 ? 44 : 140, s)).join('') +
    `<path d="M${x(24)} 66 V104 M${x(37)} 60 V110" stroke="${NAVY}" stroke-width="1.5"/>` + [24, 28, 32, 34, 37, 40, 42, 44].map((w) => N(x(w), 116, String(w), 'middle', 7)).join('') + T(130, 182, 'gestational age at birth (weeks)', { size: 8.5 });
})();

out['birth-weight'] = (() => {
  const x = (kg) => 10 + (kg / 4.5) * 240;
  return [[0, 1, '#E59B9B', 'ELBW', '< 1 kg'], [1, 1.5, '#F2B8B5', 'VLBW', '< 1.5'], [1.5, 2.5, '#FBE3C8', 'LBW', '< 2.5 kg'], [2.5, 4, LTEAL, 'Normal', '2.5 – 4 kg']]
    .map(([a, b, c, n, s], i) => `<rect x="${x(a)}" y="70" width="${x(b) - x(a)}" height="34" fill="${c}" stroke="${NAVY}" stroke-width=".8"/>` + T((x(a) + x(b)) / 2, i === 1 ? 56 : 130, n, { size: 9 }) + N((x(a) + x(b)) / 2, i === 1 ? 44 : 142, s)).join('') +
    [0, 1, 1.5, 2.5, 4, 4.5].map((k) => N(x(k), 118, `${k}`, 'middle', 7)).join('') + T(130, 182, 'birth weight (kg)', { size: 8.5 }) + N(130, 18, 'each lower group = higher risk', 'middle', 8);
})();

out['fontanelles'] = `<ellipse cx="130" cy="96" rx="76" ry="88" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M130 8 V184 M60 70 Q130 60 200 70 M66 132 Q130 150 194 132" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M130 50 L148 70 L130 90 L112 70Z" fill="#fff" stroke="${TEAL}" stroke-width="2.5"/><path d="M130 132 L140 146 L120 146Z" fill="#fff" stroke="${MID}" stroke-width="2"/>` +
  L(148, 70, 210, 40, 'Anterior', 'start') + N(212, 53, 'open, ~2 cm', 'start') + L(140, 146, 210, 158, 'Posterior', 'start') + N(212, 171, 'normally closed', 'start') + L(130, 30, 40, 18, 'Sutures', 'start') + T(30, 186, 'face ↑', { size: 7, a: 'start', w: 400 }) +
  N(46, 110, 'bulging → CNS problem', 'middle', 7) + N(46, 120, 'sunken → dehydration', 'middle', 7);

out['ett-size'] = [['< 1 kg', '2.5', '00'], ['1 – 2 kg', '3.0', '0'], ['> 2 kg', '3.5', '0 / 1'], ['> 3 kg', '4.0', '1']]
  .map(([w, s, b], i) => { const x = 8 + i * 62; return `<rect x="${x}" y="22" width="56" height="96" rx="8" fill="${[LRED, '#FBE3C8', LTEAL, LBLUE][i]}"/>` + T(x + 28, 40, w, { size: 9 }) +
    `<path d="M${x + 28} 50 V94" stroke="${NAVY}" stroke-width="${3 + i * 1.6}"/>` + T(x + 28, 108, `${s} mm`, { size: 10, c: TEAL }); }).join('') +
  T(8, 140, 'Blade: 00 < 1 kg · 0 preterm · 1 full-term', { size: 8.5, a: 'start' }) + T(8, 160, 'Depth (cm) = weight (kg) + 6', { size: 9.5, a: 'start', c: TEAL }) + N(8, 174, 'or nasal septum → ear tragus + 1 cm', 'start');

out['heat-loss'] = baby(130, 96, 0.95) +
  `<rect x="76" y="128" width="108" height="10" rx="3" fill="${LBLUE}" stroke="${BLUE}"/>` + arrow('M130 120 V138', 'b', 2) + T(130, 156, 'Conduction', { size: 9 }) + N(130, 167, 'cold mattress, scale') +
  `<path d="M14 60 Q30 52 46 60 T78 60 M14 72 Q30 64 46 72 T78 72" stroke="${BLUE}" stroke-width="2"/>` + T(20, 40, 'Convection', { size: 9, a: 'start' }) + N(20, 28, 'air currents', 'start') +
  `<rect x="214" y="30" width="34" height="60" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.2"/><path d="M231 30 V90 M214 60 H248" stroke="${NAVY}" stroke-width="1"/>` + arrow('M168 76 L208 64', 'r', 2) + T(236, 108, 'Radiation', { size: 9 }) + N(236, 119, 'cold walls, window') +
  [[112, 52], [124, 44], [140, 48]].map(([x, y]) => `<path d="M${x} ${y} q3 -8 0 -14" stroke="${TEAL}" stroke-width="1.5"/>`).join('') + T(130, 14, 'Evaporation', { size: 9 }) + N(130, 24, 'wet skin — dry the baby at once');

out['apgar'] = [['A', 'Appearance', 'colour'], ['P', 'Pulse', 'heart rate'], ['G', 'Grimace', 'reflex'], ['A', 'Activity', 'muscle tone'], ['R', 'Respiration', 'breathing']]
  .map(([l, n, s], i) => { const x = 6 + i * 50; return `<rect x="${x}" y="10" width="46" height="62" rx="8" fill="${LTEAL}"/>` + T(x + 23, 36, l, { size: 18, c: TEAL }) + T(x + 23, 52, n, { size: 7 }) + N(x + 23, 63, s, 'middle', 6); }).join('') +
  N(130, 86, 'each scored 0 – 2 · at 1 and 5 minutes · total 0 – 10') +
  [['7 – 10', 'healthy, adapting well', LTEAL], ['4 – 6', 'some difficulty — observe closely', '#FBE3C8'], ['0 – 3', 'severe difficulty', LRED]]
    .map(([a, b, c], i) => `<rect x="6" y="${98 + i * 30}" width="248" height="26" rx="6" fill="${c}"/>` + T(14, 115 + i * 30, a, { size: 10, a: 'start' }) + T(70, 115 + i * 30, b, { size: 8.5, a: 'start', w: 400 })).join('') + N(250, 190, 'score at 5 min', 'end');

out['fetal-circulation'] = box(8, 140, 52, 40, '', { fill: '#E9C1D8' }) + T(34, 163, 'Placenta', { size: 8 }) +
  `<path d="M60 150 Q90 150 96 120" stroke="${RED}" stroke-width="3.5"/>` + T(70, 136, 'umb. vein', { size: 7, w: 400, a: 'start' }) +
  `<ellipse cx="104" cy="104" rx="20" ry="12" fill="#EED0C0" stroke="${MID}"/>` + `<path d="M96 120 Q108 110 116 96" stroke="${PURP}" stroke-width="3"/>` + T(104, 86, 'D. venosus', { size: 7.5, c: PURP }) +
  `<path d="M116 96 Q130 92 140 80" stroke="${RED}" stroke-width="3.5" opacity=".75"/>` + T(140, 104, 'IVC', { size: 7.5 }) +
  box(140, 50, 34, 26, 'RA', { fill: LBLUE, size: 9 }) + box(184, 50, 34, 26, 'LA', { fill: LRED, size: 9 }) + box(140, 82, 34, 26, 'RV', { fill: LBLUE, size: 9 }) + box(184, 82, 34, 26, 'LV', { fill: LRED, size: 9 }) +
  `<path d="M174 62 H184" stroke="${YEL}" stroke-width="5"/>` + L(179, 62, 248, 122, 'Foramen ovale', 'end') +
  `<path d="M157 82 Q150 30 186 18 H232" stroke="${BLUE}" stroke-width="3"/><path d="M201 82 Q206 40 232 32" stroke="${RED}" stroke-width="3"/>` + `<path d="M196 20 Q212 24 216 34" stroke="${YEL}" stroke-width="5"/>` +
  L(206, 26, 120, 22, 'Ductus arteriosus', 'end') + T(240, 26, 'Aorta', { size: 7.5, a: 'start' }) + T(144, 44, 'Pulm. artery', { size: 7, w: 400, a: 'end' }) +
  `<path d="M201 108 Q210 170 60 172" stroke="${BLUE}" stroke-width="2.5" stroke-dasharray="5 3"/>` + T(140, 186, 'umbilical arteries back to placenta', { size: 7, w: 400 }) +
  N(250, 140, 'yellow = shunts', 'end') + N(250, 150, 'that close after birth', 'end');

out['birth-transition'] = [[['Dry the baby', 'clamp the cord'], LTEAL], [['Cold receptors', '↑CO₂ ↓O₂ ↑acidosis'], '#FBE3C8'], [['FIRST BREATH', ''], LTEAL], [['Pulmonary artery', 'pressure falls'], LBLUE], [['↑PO₂ →', 'ductus arteriosus closes'], LRED], [['Left > right pressure →', 'foramen ovale closes'], LRED], [['Ductus venosus', 'closes'], LRED], [['Umbilical vessels', 'close'], GREY]]
  .map(([[a, b], c], i) => { const col = i % 2, row = Math.floor(i / 2), x = 4 + col * 128, y = 8 + row * 46; return `<rect x="${x}" y="${y}" width="122" height="38" rx="7" fill="${c}"/>` + T(x + 8, y + 24, `${i + 1}`, { size: 11, c: TEAL, a: 'start' }) + T(x + 22, y + (b ? 17 : 24), a, { size: 7.5, a: 'start' }) + (b ? T(x + 22, y + 29, b, { size: 7.5, a: 'start', w: 400 }) : ''); }).join('') +
  [0, 1, 2, 3].map((r) => arrow(`M126 ${25 + r * 46} H130`, 'n', 1.5)).join('');

out['umbilical-lines'] = `<circle cx="80" cy="96" r="62" fill="#F3E6EE" stroke="${MID}" stroke-width="2"/>` +
  `<circle cx="80" cy="66" r="18" fill="#fff" stroke="${BLUE}" stroke-width="3"/><circle cx="56" cy="118" r="9" fill="#fff" stroke="${RED}" stroke-width="5"/><circle cx="104" cy="118" r="9" fill="#fff" stroke="${RED}" stroke-width="5"/>` +
  T(80, 70, '1 vein', { size: 8, c: BLUE }) + T(80, 148, '2 arteries', { size: 8, c: RED }) + N(80, 172, 'cord cross-section') +
  box(156, 20, 98, 64, '', { fill: LBLUE, stroke: BLUE }) + T(205, 38, 'UVC (vein)', { size: 9, c: BLUE }) + N(205, 52, 'up to 14 days') + N(205, 64, 'TPN, fluids, blood,') + N(205, 74, 'medications') +
  box(156, 98, 98, 64, '', { fill: LRED, stroke: RED }) + T(205, 116, 'UAC (artery)', { size: 9, c: RED }) + N(205, 130, 'up to 5 days') + N(205, 142, 'blood sampling,') + N(205, 152, 'invasive BP');

out['bag-mask'] = `<circle cx="70" cy="86" r="40" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M102 74 Q120 70 122 86" stroke="${MID}" stroke-width="2" fill="none"/>` +
  `<path d="M100 66 Q132 64 134 92 Q132 112 102 110 Z" fill="${LTEAL}" stroke="${TEAL}" stroke-width="2.5" opacity=".9"/><path d="M134 88 H160" stroke="${NAVY}" stroke-width="6"/>` +
  `<ellipse cx="196" cy="88" rx="38" ry="22" fill="#fff" stroke="${NAVY}" stroke-width="2"/>` + arrow('M40 30 Q30 50 34 64', 'n', 2) +
  T(38, 22, 'mild head extension', { size: 8 }) + L(120, 108, 120, 140, 'mask seals nose + mouth', 'middle') + L(196, 70, 210, 40, 'Ambu bag', 'start') +
  T(8, 166, 'Start if:', { size: 9, a: 'start', c: RED }) + N(60, 166, 'HR < 100 · apnea / gasping · cyanosis on 100% O₂', 'start') + N(8, 182, 'open orogastric (Ryle) tube if ventilating repeatedly', 'start');

out['two-thumb'] = `<ellipse cx="130" cy="96" rx="64" ry="56" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M130 50 V130" stroke="${MID}" stroke-width="3"/>` +
  `<path d="M60 70 Q50 96 60 122 Q100 132 120 112" stroke="#E7B795" stroke-width="16" fill="none"/><path d="M200 70 Q210 96 200 122 Q160 132 140 112" stroke="#E7B795" stroke-width="16" fill="none"/>` +
  `<ellipse cx="124" cy="106" rx="7" ry="10" fill="#E7B795" stroke="${NAVY}" stroke-width="1.2"/><ellipse cx="136" cy="106" rx="7" ry="10" fill="#E7B795" stroke="${NAVY}" stroke-width="1.2"/>` +
  L(130, 106, 196, 24, 'Two thumbs on', 'start') + T(198, 37, 'lower sternum', { size: 8.5, a: 'start' }) + L(60, 96, 6, 40, 'Fingers support the back', 'start') +
  N(130, 172, 'start if HR keeps falling despite good ventilation') + N(130, 184, 'compression : breath ratio — follow your NRP protocol');

writeAll('nicu', out);
