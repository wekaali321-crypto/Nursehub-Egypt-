// Section diagrams for the Pediatrics section → public/cards/art/peds-*.svg (values follow the section texts).
// Re-run: node scripts/build-peds-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F4E3D7';

out['growth-percentiles'] = `<path d="M24 14 V166 H250" stroke="${NAVY}" stroke-width="1.5"/>` +
  [[97, 98, RED], [50, 64, TEAL], [3, 30, BLUE]].map(([p, off, c]) => `<path d="M24 ${166 - off * 0.3} C90 ${120 - off} 160 ${80 - off} 244 ${70 - off * 0.6}" stroke="${c}" stroke-width="${p === 50 ? 3 : 2}" ${p === 50 ? '' : 'stroke-dasharray="5 3"'}/>` + T(248, 70 - off * 0.6 + 3, p === 3 ? '3rd' : `${p}th`, { size: 8.5, c, a: 'start' })).join('') +
  `<circle cx="150" cy="22" r="5" fill="${YEL}" stroke="${NAVY}"/>` + L(150, 22, 240, 140, 'This child: between 50th and 97th', 'end') +
  T(20, 12, 'height', { size: 7.5, a: 'end', w: 400 }) + T(250, 182, 'age', { size: 7.5, a: 'end', w: 400 }) + N(130, 188, '50th = average · a child crossing lines over time matters more than one point');

out['pulse-by-age'] = (() => {
  const rows = [['Newborn', 80, 125, 190], ['2 y', 70, 110, 160], ['4 y', 70, 100, 130], ['6 y', 75, 100, 115], ['10 y', 70, 90, 110], ['14 y', 60, 80, 100], ['18 y', 50, 70, 90]];
  const x = (v) => 60 + ((v - 40) / 160) * 190;
  return rows.map(([a, lo, av, hi], i) => { const y = 20 + i * 22; return T(54, y + 4, a, { size: 8.5, a: 'end' }) + `<path d="M${x(lo)} ${y} H${x(hi)}" stroke="${LTEAL}" stroke-width="12" stroke-linecap="round"/>` + `<path d="M${x(av)} ${y - 7} V${y + 7}" stroke="${TEAL}" stroke-width="3"/>` + N(x(lo) - 4, y + 3, String(lo), 'end', 6.6) + N(x(hi) + 4, y + 3, String(hi), 'start', 6.6); }).join('') +
    [40, 80, 120, 160, 200].map((v) => N(x(v), 178, String(v), 'middle', 7)).join('') + N(130, 190, 'resting pulse (beats/min) · bar = normal range · line = average');
})();

out['rr-by-age'] = [['0 – 2 months', 40, 60], ['2 – 12 months', 30, 50], ['1 – 5 years', 25, 40], ['5 – 12 years', 20, 30]]
  .map(([a, n, f], i) => { const y = 20 + i * 40; return T(6, y + 12, a, { size: 8.5, a: 'start' }) + `<rect x="96" y="${y}" width="${n * 2.2}" height="18" rx="4" fill="${LTEAL}"/>` + T(100, y + 13, `≤ ${n} normal`, { size: 8, a: 'start', c: TEAL }) +
    `<path d="M${96 + f * 2.2} ${y - 4} V${y + 22}" stroke="${RED}" stroke-width="2.5"/>` + T(100 + f * 2.2, y + 13, `> ${f} fast`, { size: 8, a: 'start', c: RED }); }).join('') +
  N(130, 186, 'breaths/min — count a full minute while the child is calm');

out['erikson'] = [['Trust vs mistrust', '0 – 18 mo', 'needs met consistently'], ['Autonomy vs shame', '18 mo – 3 y', 'toilet training, choices'], ['Initiative vs guilt', '3 – 6 y', 'plans own play'], ['Industry vs inferiority', '6 – 12 y', 'school, skills'], ['Identity vs role confusion', '12 – 18 y', 'who am I?']]
  .map(([n, a, s], i) => { const y = 8 + i * 36; return `<rect x="${6 + i * 10}" y="${y}" width="${248 - i * 10}" height="30" rx="8" fill="${[LTEAL, '#FBE3C8', LBLUE, LRED, '#E7E0F2'][i]}"/>` + T(14 + i * 10, y + 13, n, { size: 8.5, a: 'start' }) + N(14 + i * 10, y + 24, s, 'start', 7) + T(248, y + 19, a, { size: 8.5, a: 'end', c: TEAL }); }).join('');

out['reflexes'] = (() => {
  const x = (m) => 104 + (m / 12) * 108;
  return [['Rooting', 4], ['Palmar grasp', 4], ['Moro', 6], ['Plantar grasp', 10], ['Sucking', 12]]
    .map(([n, m], i) => { const y = 24 + i * 28; return T(8, y + 4, n, { size: 9, a: 'start' }) + `<path d="M${x(0)} ${y} H${x(m)}" stroke="${TEAL}" stroke-width="10" stroke-linecap="round"/>` + N(x(m) + 8, y + 3, `gone by ${m} mo`, 'start', 7); }).join('') +
    `<path d="M${x(0)} 160 H${x(12)}" stroke="${NAVY}" stroke-width="1"/>` + [0, 3, 6, 9, 12].map((m) => N(x(m), 172, `${m}`, 'middle', 7)).join('') + N(176, 186, 'age (months)') + N(8, 12, 'present at birth → should disappear on time', 'start');
})();

const HEART = (inner) => `<path d="M130 178 Q50 132 46 82 Q42 40 86 34 Q114 30 130 54 Q146 30 174 34 Q218 40 214 82 Q210 132 130 178Z" fill="#FBEDEC" stroke="${RED}" stroke-width="2"/>` +
  `<path d="M128 70 V160" stroke="${NAVY}" stroke-width="3"/>` + T(100, 120, 'RV', { size: 9, c: BLUE }) + T(158, 120, 'LV', { size: 9, c: RED }) + inner;
out['acyanotic'] = HEART(`<rect x="124" y="112" width="8" height="16" fill="#fff" stroke="${NAVY}"/><path d="M110 40 Q110 10 140 8 H170 M150 40 Q154 20 170 16" stroke="${MID}" stroke-width="7"/><path d="M146 18 L146 30" stroke="${PURP}" stroke-width="5"/><path d="M196 18 Q206 18 210 26" stroke="${RED}" stroke-width="7"/><path d="M186 14 l6 10" stroke="${NAVY}" stroke-width="2"/>`) +
  L(128, 120, 4, 150, 'VSD: hole between ventricles', 'start') + N(6, 162, 'harsh holosystolic murmur', 'start') +
  L(146, 24, 4, 20, 'PDA: aorta ↔ pulmonary artery', 'start') + N(6, 32, 'continuous “machine” murmur', 'start') +
  L(206, 22, 254, 60, 'Coarctation:', 'end') + N(252, 72, 'narrowed aorta — arm vs', 'end') + N(252, 82, 'leg BP & pulses differ', 'end');
out['tof'] = HEART(`<rect x="124" y="104" width="8" height="18" fill="#fff" stroke="${NAVY}"/><path d="M84 70 Q80 110 92 150" stroke="${NAVY}" stroke-width="7" opacity=".5"/><path d="M104 44 Q100 20 112 10" stroke="${BLUE}" stroke-width="7"/><path d="M104 40 l10 -2" stroke="${RED}" stroke-width="4"/><path d="M128 64 Q130 30 160 18" stroke="${RED}" stroke-width="9"/>`) +
  [['1 Pulmonary stenosis', 108, 40, 6, 20], ['2 VSD', 128, 112, 6, 150], ['3 RV hypertrophy', 86, 120, 6, 176], ['4 Overriding aorta', 134, 40, 196, 18]].map(([n, x, y, tx, ty]) => L(x, y, tx, ty, n, tx > 150 ? 'start' : 'start')).join('') +
  T(254, 140, 'Tet spell →', { size: 8.5, a: 'end', c: RED }) + N(254, 152, 'knee-chest position,', 'end') + N(254, 162, 'oxygen, calm', 'end');

out['pyloric-stenosis'] = `<path d="M30 70 Q40 30 90 30 Q150 30 160 70 Q166 110 120 120 L170 118" fill="#F7E1D9" stroke="${NAVY}" stroke-width="2"/>` +
  `<ellipse cx="180" cy="118" rx="20" ry="12" fill="#E8B4A2" stroke="${RED}" stroke-width="2.5"/><path d="M200 118 H244" stroke="${NAVY}" stroke-width="6"/>` +
  arrow('M80 26 Q60 0 40 10', 'r', 2.4) + T(40, 6, 'projectile', { size: 8, a: 'start', c: RED }) + N(40, 16, 'non-bilious vomiting', 'start') +
  L(180, 118, 160, 156, '“Olive”: thick pylorus muscle', 'start') + N(162, 168, 'right upper abdomen', 'start') + L(90, 70, 20, 150, 'Stomach', 'start') + N(130, 188, 'age 2–8 weeks · hungry right after vomiting · fix: pyloromyotomy');

out['intussusception'] = `<path d="M20 90 H240" stroke="#F2C9C3" stroke-width="40"/><path d="M20 70 H240 M20 110 H240" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M60 76 H150 Q170 76 170 90 Q170 104 150 104 H60" fill="#E8B4A2" stroke="${RED}" stroke-width="2"/><path d="M150 76 Q130 90 150 104" stroke="${RED}" stroke-width="1.2"/>` +
  arrow('M80 90 H140', 'r', 2) + L(160, 90, 150, 30, 'Bowel slides into the next part', 'end') + N(148, 42, '(telescoping)', 'end') +
  T(8, 150, 'Signs:', { size: 8.5, a: 'start', c: RED }) + N(44, 150, 'colicky pain — knees to chest · vomiting', 'start') + N(44, 162, '“currant jelly” stool · sausage-shaped mass', 'start') + N(8, 182, '3 months – 3 years · air / saline enema can treat it', 'start');

const hip = (x, out_) => `<path d="M${x - 36} 40 Q${x} 20 ${x + 36} 40 L${x + 30} 80 Q${x} 90 ${x - 30} 80Z" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/>` +
  `<path d="M${x - 20} 74 Q${x} 92 ${x + 20} 74" stroke="${NAVY}" stroke-width="2.5"/>` + `<circle cx="${x + (out_ ? 26 : 0)}" cy="${out_ ? 92 : 82}" r="13" fill="#fff" stroke="${NAVY}" stroke-width="2"/>` + `<path d="M${x + (out_ ? 26 : 0)} ${out_ ? 104 : 94} L${x + (out_ ? 36 : 8)} 160" stroke="#fff" stroke-width="12"/><path d="M${x + (out_ ? 26 : 0)} ${out_ ? 104 : 94} L${x + (out_ ? 36 : 8)} 160" stroke="${NAVY}" stroke-width="1.5" fill="none"/>`;
out['ddh'] = hip(66, false) + T(66, 178, 'Normal', { size: 9.5, c: TEAL }) + N(66, 190, 'head in the socket') + hip(186, true) + T(186, 178, 'Dislocated (DDH)', { size: 9.5, c: RED }) + N(186, 190, 'head out of the acetabulum') +
  T(130, 12, 'Signs: uneven thigh folds · leg-length difference · limited abduction', { size: 7.5 });

out['hydrocephalus'] = `<circle cx="120" cy="88" r="76" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M70 80 Q90 40 120 52 Q150 40 170 80 Q160 110 120 100 Q80 110 70 80Z" fill="#B9D7F0" stroke="${BLUE}" stroke-width="2"/>` +
  `<path d="M100 18 l20 -6 l20 6" stroke="${RED}" stroke-width="2.5"/><circle cx="102" cy="132" r="8" fill="#fff" stroke="${NAVY}"/><circle cx="138" cy="132" r="8" fill="#fff" stroke="${NAVY}"/><circle cx="102" cy="137" r="4" fill="${NAVY}"/><circle cx="138" cy="137" r="4" fill="${NAVY}"/>` +
  L(120, 72, 200, 46, 'Enlarged', 'start') + T(202, 59, 'ventricles (CSF)', { size: 8.5, a: 'start' }) + L(120, 14, 200, 16, 'Bulging', 'start') + T(202, 29, 'fontanel', { size: 8.5, a: 'start' }) + L(138, 133, 200, 140, '“Sunset eyes”', 'start') + N(6, 186, 'infant: head grows fast · treatment: shunt to drain CSF', 'start');

writeAll('peds', out);
