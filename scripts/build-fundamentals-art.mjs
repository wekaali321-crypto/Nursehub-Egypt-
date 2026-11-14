// Section diagrams for the Fundamentals section → public/cards/art/fun-*.svg (content follows the section texts).
// Re-run: node scripts/build-fundamentals-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F4E3D7';

// side-lying + supine bodies with the bony prominences that take the pressure
out['pressure-sites'] = `<path d="M10 80 H250" stroke="${MID}" stroke-width="3"/>` +
  `<circle cx="30" cy="62" r="14" fill="${SKIN}" stroke="${MID}"/><path d="M44 66 H200 Q220 66 236 70" stroke="${SKIN}" stroke-width="22"/><path d="M44 66 H200 Q220 66 236 70" stroke="${MID}" stroke-width="1" fill="none"/>` +
  [[24, 76, 'Occiput'], [66, 77, 'Shoulder blade'], [100, 77, 'Elbow'], [140, 77, 'Sacrum'], [170, 77, 'Buttock'], [236, 76, 'Heel']].map(([x, y, n], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${RED}"/>` + T(x, 96 + (i % 2) * 11, n, { size: 7.5 })).join('') +
  T(10, 24, 'Lying on the back (supine)', { size: 9, a: 'start' }) +
  `<path d="M10 172 H250" stroke="${MID}" stroke-width="3"/><circle cx="30" cy="150" r="14" fill="${SKIN}" stroke="${MID}"/><path d="M44 152 H190 L232 158" stroke="${SKIN}" stroke-width="26"/>` +
  [[34, 166, 'Ear'], [70, 166, 'Shoulder'], [150, 167, 'Hip'], [206, 168, 'Knee'], [236, 168, 'Ankle']].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="5" fill="${RED}"/>` + N(x, 186, n, 'middle', 7)).join('') +
  T(10, 124, 'Lying on the side', { size: 9, a: 'start' }) + N(250, 124, 'turn at least every 2 hours', 'end');

const layers = `<rect x="10" y="40" width="240" height="18" fill="#F4C9A8"/><rect x="10" y="58" width="240" height="30" fill="${LRED}"/><rect x="10" y="88" width="240" height="34" fill="#F6D98B"/><rect x="10" y="122" width="240" height="44" fill="#E3B9B0"/>` +
  T(248, 52, 'epidermis', { size: 7, a: 'end', w: 400 }) + T(248, 76, 'dermis', { size: 7, a: 'end', w: 400 }) + T(248, 108, 'subcutaneous fat', { size: 7, a: 'end', w: 400 }) + T(248, 150, 'muscle', { size: 7, a: 'end', w: 400 });
const needle = (x, ang, len) => { const r = (ang * Math.PI) / 180, x2 = x + Math.cos(r) * len, y2 = 40 + Math.sin(r) * len; return `<path d="M${x - Math.cos(r) * 26} ${40 - Math.sin(r) * 26} L${x2} ${y2}" stroke="${NAVY}" stroke-width="2.4"/><circle cx="${x2}" cy="${y2}" r="3" fill="${TEAL}"/>`; };
out['injection-angles'] = layers + needle(36, 15, 28) + needle(92, 45, 66) + needle(150, 90, 110) + `<ellipse cx="208" cy="72" rx="16" ry="6" fill="${BLUE}" opacity=".7"/>` + needle(186, 25, 26) +
  T(40, 16, 'ID 15°', { size: 9 }) + T(92, 16, 'SC 45–90°', { size: 9 }) + T(150, 16, 'IM 90°', { size: 9 }) + T(204, 16, 'IV 15–30°', { size: 9 }) +
  N(38, 178, '≤ 0.1 mL') + N(38, 188, 'tests · BCG') + N(96, 178, 'insulin') + N(96, 188, 'some vaccines') + N(152, 178, 'up to 5 mL') + N(210, 178, 'into a vein');

out['cannula-sizes'] = [['14G', '#E8782F', 'trauma, rapid blood'], ['16G', '#8A8F94', 'rapid fluids'], ['18G', '#3AA55B', 'adults · blood'], ['20G', '#E77FA4', 'adults · general'], ['22G', '#3B78C4', 'small veins'], ['24G', '#E8C93A', 'children · fine veins']]
  .map(([g, c, s], i) => { const y = 10 + i * 29; const w = 120 - i * 14; return `<rect x="10" y="${y}" width="44" height="22" rx="5" fill="${c}"/>` + T(32, y + 15, g, { size: 9, c: '#fff' }) +
    `<path d="M60 ${y + 11} H${60 + w}" stroke="${NAVY}" stroke-width="${8 - i}"/>` + T(196, y + 15, s, { size: 8, a: 'start', w: i >= 2 && i <= 5 ? 700 : 400 }); }).join('') +
  N(10, 188, 'smaller number = wider cannula = faster flow · 18–24G are named in the section', 'start', 7);

out['suture-removal'] = `<svg x="30" y="0" width="140" height="190" viewBox="0 0 160 250"><circle cx="80" cy="30" r="20" fill="${LTEAL}" stroke="${MID}" stroke-width="2"/><rect x="72" y="48" width="16" height="12" rx="4" fill="${LTEAL}"/><path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" fill="#FBE3C8" stroke="${MID}" stroke-width="2"/><path d="M46 64 Q36 70 34 92 L28 146" stroke="#DCE7F5" stroke-width="12"/><path d="M114 64 Q124 70 126 92 L132 146" stroke="#DCE7F5" stroke-width="12"/><path d="M62 150 L58 236" stroke="#DCE7F5" stroke-width="15"/><path d="M98 150 L102 236" stroke="#DCE7F5" stroke-width="15"/><circle cx="26" cy="152" r="7" fill="${LRED}"/><circle cx="134" cy="152" r="7" fill="${LRED}"/><ellipse cx="58" cy="242" rx="10" ry="5" fill="${LRED}"/><ellipse cx="102" cy="242" rx="10" ry="5" fill="${LRED}"/></svg>` +
  [['Face & neck', '3 – 4 days', LTEAL], ['Scalp & limbs', '5 – 7 days', '#DCE7F5'], ['Abdomen', '8 – 10 days', '#FBE3C8'], ['Hand & foot', '10 – 14 days', LRED]]
    .map(([n, d, c], i) => `<rect x="172" y="${18 + i * 40}" width="12" height="12" rx="3" fill="${c}" stroke="${MID}"/>` + T(190, 28 + i * 40, n, { size: 8.5, a: 'start' }) + T(190, 40 + i * 40, d, { size: 9, a: 'start', c: TEAL })).join('') +
  N(172, 186, 'non-absorbable skin sutures', 'start');

out['blood-groups'] = (() => {
  const g = ['O', 'A', 'B', 'AB'];
  const ok = { O: ['O'], A: ['O', 'A'], B: ['O', 'B'], AB: ['O', 'A', 'B', 'AB'] };
  return T(140, 14, 'Donor red cells →', { size: 8.5 }) + g.map((d, i) => T(102 + i * 36, 32, d, { size: 10, c: RED })).join('') + T(30, 32, 'Patient', { size: 8.5 }) +
    g.map((r, j) => T(30, 58 + j * 28, r, { size: 10, c: BLUE }) + g.map((d, i) => `<rect x="${86 + i * 36}" y="${42 + j * 28}" width="32" height="24" rx="5" fill="${ok[r].includes(d) ? LTEAL : '#fff'}" stroke="${MID}"/>` + T(102 + i * 36, 58 + j * 28, ok[r].includes(d) ? '✓' : '✗', { size: 11, c: ok[r].includes(d) ? TEAL : RED })).join('')).join('') +
    N(30, 168, 'O = universal red-cell donor · AB = universal recipient', 'start') + T(30, 184, 'Rh too — and ALWAYS cross-match before any transfusion', { size: 8, a: 'start', c: RED });
})();

out['adpie'] = (() => {
  const items = [['A', 'Assessment', 'collect data'], ['D', 'Diagnosis', 'name the problem'], ['P', 'Planning', 'measurable goals'], ['I', 'Implementation', 'do the care'], ['E', 'Evaluation', 'goal met? adjust']];
  return `<circle cx="130" cy="98" r="62" stroke="${MID}" stroke-width="2" stroke-dasharray="5 4"/>` + T(130, 96, 'Nursing', { size: 9 }) + T(130, 108, 'process', { size: 9 }) +
    items.map(([l, n, s], i) => { const a = (-90 + i * 72) * Math.PI / 180, x = 130 + Math.cos(a) * 62, y = 98 + Math.sin(a) * 62; const right = Math.cos(a) > 0.2, left = Math.cos(a) < -0.2;
      return `<circle cx="${x}" cy="${y}" r="15" fill="${TEAL}"/>` + T(x, y + 5, l, { size: 13, c: '#fff' }) + T(x + (right ? 20 : left ? -20 : 0), y + (i === 0 ? -30 : i === 2 || i === 3 ? 28 : 0), n, { size: 8.5, a: right ? 'start' : left ? 'end' : 'middle' }) + N(x + (right ? 20 : left ? -20 : 0), y + (i === 0 ? -19 : i === 2 || i === 3 ? 38 : 11), s, right ? 'start' : left ? 'end' : 'middle', 7); }).join('') +
    arrow('M174 52 Q186 62 190 74', 'n', 1.4) + arrow('M188 128 Q180 146 168 152', 'n', 1.4) + arrow('M100 156 Q86 148 76 136', 'n', 1.4) + arrow('M70 76 Q76 60 90 50', 'n', 1.4);
})();

out['maslow'] = [['Self-actualization', '#D9CFE8'], ['Esteem', LBLUE], ['Love & belonging', LTEAL], ['Safety', '#FBE3C8'], ['Physiological: air · food · water · sleep', LRED]]
  .map(([n, c], i) => { const top = 10 + i * 34, half = 22 + i * 26; return `<path d="M${130 - half} ${top + 32} L${130 - half + 13} ${top} H${130 + half - 13} L${130 + half} ${top + 32}Z" fill="${c}" stroke="${NAVY}" stroke-width="1"/>` + T(130, top + 20, n, { size: i === 4 ? 8 : i === 0 ? 6.5 : 8.5 }); }).join('') +
  arrow('M246 176 V20', 't', 2) + T(250, 186, 'priority: bottom first', { size: 7.5, a: 'end', c: TEAL }) + N(10, 186, 'e.g. breathing before anxiety', 'start');

out['isolation'] = [['Contact', 'touch (e.g. resistant bacteria)', 'gloves + gown', LTEAL, (x) => `<path d="M${x - 12} 80 q12 -18 24 0 v14 h-24z" fill="${YEL}" stroke="${NAVY}"/>`],
  ['Droplet', 'large droplets, short distance (influenza)', 'surgical mask', '#FBE3C8', (x) => `<rect x="${x - 16}" y="72" width="32" height="18" rx="6" fill="#B9E0E2" stroke="${NAVY}"/>` + [0, 1, 2].map((k) => `<circle cx="${x + 26 + k * 7}" cy="${80 + (k % 2) * 4}" r="3" fill="${BLUE}"/>`).join('')],
  ['Airborne', 'tiny particles stay in the air (TB, measles)', 'N95 + negative-pressure room', LRED, (x) => `<path d="M${x - 16} 72 Q${x} 64 ${x + 16} 72 L${x + 14} 92 Q${x} 98 ${x - 14} 92Z" fill="#fff" stroke="${NAVY}" stroke-width="1.5"/>` + [0, 1, 2, 3].map((k) => `<circle cx="${x + 24 + k * 5}" cy="${66 + k * 5}" r="1.6" fill="${RED}"/>`).join('')]]
  .map(([n, s, p, c, icon], i) => { const x = 6 + i * 84; return `<rect x="${x}" y="10" width="80" height="170" rx="10" fill="${c}"/>` + T(x + 40, 32, n, { size: 10 }) + icon(x + 34) +
    s.split(' (')[0].split(', ').map((line, j) => N(x + 40, 116 + j * 10, line, 'middle', 6.6)).join('') + (s.includes('(') ? N(x + 40, 140, '(' + s.split(' (')[1], 'middle', 6.6) : '') + T(x + 40, 164, p.split(' + ')[0], { size: 7.5, c: TEAL }) + (p.includes(' + ') ? T(x + 40, 174, '+ ' + p.split(' + ')[1], { size: 6.5, c: TEAL }) : ''); }).join('') +
  N(130, 189, 'always on top of standard precautions', 'middle', 6.5);

out['pain-scale'] = (() => {
  const faces = [0, 2, 4, 6, 8, 10];
  return `<rect x="10" y="94" width="240" height="14" rx="7" fill="url(#pg)"/>` + `<defs><linearGradient id="pg"><stop offset="0" stop-color="#3AA55B"/><stop offset=".5" stop-color="#E8C93A"/><stop offset="1" stop-color="#D64545"/></linearGradient></defs>` +
    Array.from({ length: 11 }, (_, i) => T(10 + i * 24, 126, String(i), { size: 9 })).join('') +
    faces.map((v, i) => { const x = 10 + v * 24, mouth = [`M${x - 7} 62 Q${x} 70 ${x + 7} 62`, `M${x - 7} 64 Q${x} 68 ${x + 7} 64`, `M${x - 7} 66 H${x + 7}`, `M${x - 7} 68 Q${x} 64 ${x + 7} 68`, `M${x - 7} 70 Q${x} 62 ${x + 7} 70`, `M${x - 7} 72 Q${x} 60 ${x + 7} 72`][i];
      return `<circle cx="${x}" cy="60" r="16" fill="#FFF4D6" stroke="${NAVY}" stroke-width="1.4"/><circle cx="${x - 5}" cy="54" r="1.8" fill="${NAVY}"/><circle cx="${x + 5}" cy="54" r="1.8" fill="${NAVY}"/><path d="${mouth}" stroke="${NAVY}" stroke-width="1.6"/>`; }).join('') +
    T(10, 22, 'Numeric 0–10 + faces scale (children, can’t speak)', { size: 8.5, a: 'start' }) + N(10, 146, 'no pain', 'start') + N(250, 146, 'worst pain', 'end') +
    N(130, 172, 'pain is whatever the patient says it is') + N(130, 184, 'acute: clear cause, improves · chronic: > 3 months');
})();

writeAll('fun', out);
