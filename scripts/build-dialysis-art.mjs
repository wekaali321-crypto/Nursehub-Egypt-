// Section diagrams for the Dialysis section → public/cards/art/dial-*.svg (labels follow the section texts).
// Re-run: node scripts/build-dialysis-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE } = C;
const out = {};

// membrane in the middle, blood left, dialysate right
const MEM = (x = 130) => `<path d="M${x} 20 V160" stroke="${NAVY}" stroke-width="2" stroke-dasharray="6 4"/>`;
const sides = `<rect x="10" y="20" width="120" height="140" fill="${LRED}" opacity=".5"/><rect x="130" y="20" width="120" height="140" fill="${LTEAL}" opacity=".6"/>` + T(70, 14, 'Blood', { size: 9, c: RED }) + T(190, 14, 'Dialysate', { size: 9, c: TEAL });

out['solute-forces'] = sides + MEM() +
  [[30, 40], [50, 60], [36, 80], [64, 44], [80, 70], [46, 100], [70, 92], [90, 50]].map(([x, y]) => dot(x, y, 4, RED)).join('') + [[170, 50], [210, 80]].map(([x, y]) => dot(x, y, 4, RED)).join('') +
  arrow('M96 64 H160', 'r') + T(70, 120, 'Diffusion', { size: 10 }) + N(70, 132, 'high → low concentration') +
  arrow('M40 146 H220', 't', 4) + dot(110, 146, 3.5, RED) + dot(150, 146, 3.5, RED) + T(190, 120, 'Convection', { size: 10 }) + N(190, 132, 'solutes dragged by water') +
  N(130, 184, 'membrane lets small toxins through, keeps cells & proteins');
out['water-forces'] =
  `<rect x="10" y="20" width="110" height="140" fill="${LRED}" opacity=".5"/><rect x="140" y="20" width="110" height="140" fill="${LTEAL}" opacity=".6"/>` + `<path d="M130 20 V160" stroke="${NAVY}" stroke-width="2" stroke-dasharray="6 4"/>` +
  T(65, 36, 'HIGH pressure', { size: 8.5, c: RED }) + T(195, 36, 'low pressure', { size: 8.5 }) + arrow('M70 60 H190', 'b', 4) + T(16, 80, 'Ultrafiltration', { size: 9.5, a: 'start' }) + N(16, 91, 'high → low pressure', 'start') +
  [[170, 120], [190, 132], [210, 116], [230, 130], [186, 148], [216, 146]].map(([x, y]) => dot(x, y, 3.5, NAVY)).join('') + dot(60, 128, 3.5, NAVY) +
  arrow('M80 130 H160', 'b', 2.5) + T(16, 112, 'Osmosis', { size: 9.5, a: 'start' }) + N(130, 176, 'water moves toward the side with MORE dissolved solutes');
out['toxin-sizes'] =
  `<path d="M20 120 H240" stroke="${NAVY}" stroke-width="3"/>` + [40, 80, 120, 160, 200].map((x) => `<rect x="${x}" y="114" width="16" height="12" fill="#fff"/>`).join('') +
  dot(48, 100, 4, TEAL) + dot(132, 84, 11, YEL) + dot(212, 72, 22, RED) +
  T(48, 150, 'Small', { size: 9.5 }) + N(48, 162, '< 500 Da') + N(48, 172, 'urea, creatinine') +
  T(132, 150, 'Middle', { size: 9.5 }) + N(132, 162, '500 – 12,000 Da') +
  T(212, 150, 'Large', { size: 9.5 }) + N(212, 162, '> 12,000 Da') + N(212, 172, 'β2-microglobulin') +
  arrow('M48 106 V140', 't', 2) + T(130, 22, 'membrane pores (gaps) — small pass easily', { size: 8 }) + N(130, 186, 'middle & large need high-flux dialyzers or hemofiltration');

// dialyzer drawn as a vertical cylinder
const DIALYZER = (x, y, h = 90) => `<rect x="${x}" y="${y}" width="30" height="${h}" rx="12" fill="#fff" stroke="${NAVY}" stroke-width="2"/>` + Array.from({ length: 5 }, (_, i) => `<path d="M${x + 6 + i * 4.5} ${y + 10} V${y + h - 10}" stroke="${RED}" stroke-width="1" opacity=".6"/>`).join('');
out['two-circuits'] = DIALYZER(115, 45) +
  `<path d="M20 160 Q20 30 120 40" stroke="${RED}" stroke-width="3.5"/>` + arrow('M60 70 Q80 48 110 44', 'r', 3) + `<path d="M135 140 Q140 172 60 172 Q24 172 22 162" stroke="${BLUE}" stroke-width="3.5"/>` + arrow('M120 156 Q110 170 80 172', 'b', 3) +
  `<path d="M145 120 Q200 130 220 110 V70 Q200 52 147 62" stroke="${TEAL}" stroke-width="3.5"/>` + arrow('M220 96 V74', 't', 3) + box(196, 76, 48, 20, 'machine', { size: 7.5, fill: LTEAL, stroke: TEAL }) +
  T(30, 22, '1 Blood circuit', { size: 9.5, c: RED, a: 'start' }) + N(30, 32, 'patient → dialyzer → patient', 'start') + T(208, 160, '2 Dialysate circuit', { size: 9.5, c: TEAL }) + N(208, 170, 'flows opposite to blood') + L(130, 92, 170, 30, 'Dialyzer', 'start');
out['blood-circuit'] =
  `<path d="M10 170 Q10 120 30 110 H70" stroke="${RED}" stroke-width="3"/><circle cx="80" cy="110" r="12" fill="#fff" stroke="${NAVY}" stroke-width="2"/><path d="M74 104 L86 116 M86 104 L74 116" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M92 110 H112 V50 H120" stroke="${RED}" stroke-width="3"/>` + DIALYZER(120, 30, 70) + `<path d="M150 50 H170 V80" stroke="${BLUE}" stroke-width="3"/>` +
  `<rect x="162" y="80" width="16" height="30" rx="5" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.5"/><path d="M170 110 V130 H220 Q246 130 246 170" stroke="${BLUE}" stroke-width="3"/><rect x="190" y="124" width="12" height="12" rx="2" fill="${YEL}" stroke="${NAVY}" stroke-width="1"/>` +
  dot(10, 172, 5, RED) + dot(246, 172, 5, BLUE) +
  L(10, 168, 4, 186, '1 Arterial needle', 'start') + L(80, 98, 40, 80, '2 Blood pump', 'end') + L(135, 30, 150, 14, '3 Dialyzer', 'start') +
  L(178, 92, 196, 72, '4 Venous chamber', 'start') + N(222, 84, '(venous pressure)') + L(196, 136, 172, 166, '5 Air detector', 'end') + L(246, 168, 236, 186, '6 Venous needle', 'end');

const stage = (x, y, w, label, sub, fill) => box(x, y, w, 30, '', { fill, r: 8 }) + T(x + w / 2, y + 14, label, { size: 7.5 }) + N(x + w / 2, y + 24, sub, 'middle', 6.5);
out['pre-ro'] = [['Tank', 'city water', GREY], ['Sand', '> 50 µm', '#F6E7C1'], ['Cartridge', '25 µm', '#fff'], ['Carbon', 'chlorine, odor', '#D5D9DD'], ['Cartridge', '10 → 5 µm', '#fff'], ['Softener', 'Ca, Mg', LTEAL]]
  .map(([n, s, f], i) => stage(4 + (i % 3) * 86, 34 + Math.floor(i / 3) * 70, 70, `${i + 1} ${n}`, s, f) + (i % 3 < 2 ? arrow(`M${76 + (i % 3) * 86} ${49 + Math.floor(i / 3) * 70} H${88 + (i % 3) * 86}`, 'b', 2) : '')).join('') +
  arrow('M246 64 Q256 84 220 94 Q60 92 40 100', 'b', 2) + arrow('M246 134 Q256 150 246 166', 'b', 2) + T(232, 182, '→ RO unit', { size: 8.5 }) + T(130, 14, 'Water treatment before reverse osmosis', { size: 9 });
out['ro-post'] =
  `<rect x="20" y="40" width="110" height="80" rx="8" fill="${LTEAL}" stroke="${NAVY}" stroke-width="1.5"/><path d="M75 40 V120" stroke="${NAVY}" stroke-width="2.5" stroke-dasharray="3 3"/>` +
  [[34, 60], [46, 86], [58, 66], [38, 104], [62, 102]].map(([x, y]) => dot(x, y, 3.5, RED)).join('') + arrow('M30 30 H60', 'n', 2) + T(40, 24, 'high pressure', { size: 7.5 }) +
  arrow('M80 80 H122', 'b', 3) + T(102, 142, 'pure water only', { size: 7.5 }) + N(44, 131, 'salts, microbes rejected') + T(75, 16, 'RO membrane', { size: 9.5 }) +
  arrow('M134 80 H150', 'b', 2) + box(150, 64, 40, 32, 'UV', { fill: '#EDE4F7' }) + arrow('M190 80 H204', 'b', 2) + box(204, 64, 46, 32, '0.2 µm', { size: 7.5 }) +
  N(170, 108, 'kills microbes') + N(227, 108, 'bacteria filter') + arrow('M227 98 V150 H40 V126', 'b', 2) + T(134, 164, 'unused water loops back to the tank', { size: 8 });

const ARM = `<path d="M10 70 Q120 40 250 64 L250 128 Q120 140 10 120Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/>`;
out['fistula'] = ARM + `<path d="M10 104 Q120 100 196 96" stroke="${RED}" stroke-width="5"/><path d="M196 96 Q214 90 250 80" stroke="${RED}" stroke-width="5" opacity=".4"/>` +
  `<path d="M196 96 Q170 78 120 74 Q60 72 10 80" stroke="${BLUE}" stroke-width="9"/>` + `<circle cx="196" cy="96" r="6" fill="${YEL}" stroke="${NAVY}" stroke-width="1.5"/>` +
  arrow('M230 88 L204 95', 'r', 2.4) + arrow('M170 80 L120 75', 'b', 2.4) +
  L(196, 96, 222, 150, 'Anastomosis', 'start') + L(60, 104, 40, 150, 'Radial artery', 'start') + L(100, 74, 70, 30, 'Cephalic vein (enlarges)', 'start') + N(130, 184, 'radio-cephalic: artery joined directly to vein') + T(240, 160, 'wrist', { size: 7, w: 400 });
out['fistula-check'] = ARM + `<path d="M196 96 Q170 78 120 74 Q60 72 10 80" stroke="${BLUE}" stroke-width="9"/><circle cx="196" cy="96" r="5" fill="${YEL}" stroke="${NAVY}" stroke-width="1.2"/>` +
  [['1 LOOK', 'redness, swelling, warmth', 40], ['2 FEEL', 'thrill (vibration)', 130], ['3 LISTEN', 'bruit (whoosh) — stethoscope', 220]].map(([a, b, x]) => T(x, 20, a, { size: 9.5, c: TEAL }) + N(x, 31, b)).join('') +
  `<path d="M130 48 l-6 18 M136 48 l0 20 M142 48 l6 18" stroke="${NAVY}" stroke-width="2"/>` + `<circle cx="214" cy="62" r="7" stroke="${NAVY}" stroke-width="2"/><path d="M214 55 Q214 40 230 36" stroke="${NAVY}" stroke-width="2"/>` +
  `<path d="M60 140 h70" stroke="${RED}" stroke-width="2"/>` + T(130, 160, 'Never on the fistula arm:', { size: 8.5, c: RED }) + N(130, 172, 'BP cuff · blood samples · tight clothes or jewelry · sleeping on it');
out['graft'] = ARM + `<path d="M40 104 Q120 102 200 100" stroke="${RED}" stroke-width="4"/><path d="M40 80 Q120 76 200 78" stroke="${BLUE}" stroke-width="4"/>` +
  `<path d="M190 100 Q236 100 236 90 Q236 78 190 78" stroke="${YEL}" stroke-width="0"/><path d="M160 101 Q232 106 232 90 Q232 70 160 79" stroke="#C9A227" stroke-width="7" opacity=".85"/>` +
  L(232, 90, 236, 150, 'Synthetic loop graft', 'end') + L(80, 103, 40, 150, 'Artery', 'start') + L(80, 79, 40, 30, 'Vein', 'start') +
  N(130, 172, 'ready in 2–4 weeks · higher risk of infection, clotting, venous-end stenosis');
out['cvc'] =
  `<path d="M70 10 Q60 60 70 180 H190 Q200 60 190 10Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M120 120 Q104 136 118 160 Q140 172 150 150 Q156 128 136 118Z" fill="${LRED}" stroke="${RED}" stroke-width="1.5"/>` +
  `<path d="M104 20 Q100 60 112 118" stroke="${BLUE}" stroke-width="6" opacity=".55"/>` + `<path d="M160 70 Q140 64 120 56 Q106 50 106 70 Q108 100 120 128" stroke="${NAVY}" stroke-width="3"/>` +
  `<rect x="140" y="62" width="10" height="7" rx="2" fill="${YEL}" stroke="${NAVY}" stroke-width="1"/><path d="M160 70 L196 84 M160 70 L196 70" stroke="${RED}" stroke-width="3"/><path d="M160 72 L196 98" stroke="${BLUE}" stroke-width="3"/>` +
  L(104, 30, 30, 24, 'Internal jugular vein', 'start') + L(122, 128, 30, 150, 'Tip: right atrium', 'start') + L(145, 65, 210, 40, 'Cuff (anchors, blocks bacteria)', 'end') +
  L(196, 84, 206, 120, 'Red = arterial', 'start') + L(196, 98, 206, 140, 'Blue = venous', 'start') + N(130, 188, 'tunneled (permanent) catheter · avoid subclavian if possible');
out['pressures'] = `<path d="M10 130 H60" stroke="${RED}" stroke-width="3"/><circle cx="70" cy="130" r="10" fill="#fff" stroke="${NAVY}" stroke-width="2"/><path d="M80 130 H112 V60 H118" stroke="${RED}" stroke-width="3"/>` + `<g transform="translate(118 40)"><rect width="30" height="90" rx="12" fill="#fff" stroke="${NAVY}" stroke-width="2"/></g>` +
  `<path d="M148 60 H190 V140 H250" stroke="${BLUE}" stroke-width="3"/>` +
  `<circle cx="40" cy="104" r="12" fill="${LRED}" stroke="${NAVY}" stroke-width="1.5"/><path d="M40 116 V130" stroke="${NAVY}" stroke-width="1.2"/>` + T(40, 108, '−', { size: 14 }) +
  `<circle cx="210" cy="114" r="12" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.5"/><path d="M210 126 V140" stroke="${NAVY}" stroke-width="1.2"/>` + T(210, 118, '+', { size: 13 }) +
  `<path d="M133 50 V120" stroke="${TEAL}" stroke-width="2" stroke-dasharray="4 3"/>` + arrow('M124 86 H142', 't', 2) +
  T(40, 84, 'Arterial', { size: 9 }) + N(40, 160, 'before the pump (negative)') + T(210, 94, 'Venous', { size: 9 }) + N(210, 160, 'after the dialyzer (positive)') +
  T(133, 30, 'TMP', { size: 9.5, c: TEAL }) + N(133, 20, 'blood side − dialysate side') + N(130, 184, 'rising TMP → think of dialyzer clotting');
const crrt = (x, y, name, sub, rep, dia) => `<g transform="translate(${x} ${y})">${box(0, 0, 112, 74, '', { fill: '#fff', r: 10 })}<rect x="44" y="14" width="22" height="46" rx="9" fill="#fff" stroke="${NAVY}" stroke-width="1.6"/>` +
  arrow('M10 22 H44', 'r', 2) + arrow('M66 52 H100', 'b', 2) + (dia ? arrow('M100 22 H68', 't', 2) : '') + (rep ? `<path d="M30 6 V20" stroke="${C.PURP}" stroke-width="2" marker-end="url(#ap)"/>` : '') +
  T(56, 70, name, { size: 8.5 }) + `</g>` + N(x + 56, y + 86, sub);
out['crrt-types'] = crrt(4, 6, 'CVVH', 'convection · replacement fluid', true, false) + crrt(144, 6, 'CVVHD', 'diffusion · dialysate, 24 h', false, true) + crrt(74, 100, 'CVVHDF', 'both · highest clearance', true, true) +
  `<path d="M196 118 H206" stroke="${C.PURP}" stroke-width="2"/>` + N(210, 121, 'replacement', 'start') + `<path d="M196 132 H206" stroke="${TEAL}" stroke-width="2"/>` + N(210, 135, 'dialysate', 'start');
out['ktv'] = [['K', 'urea clearance', 'mL/min', 40], ['t', 'session time', 'minutes', 130], ['V', 'urea volume', '≈ 55–60% of kg', 220]]
  .map(([k, a, b, x]) => `<circle cx="${x}" cy="62" r="30" fill="${k === 'V' ? LBLUE : LTEAL}" stroke="${NAVY}" stroke-width="1.5"/>` + T(x, 72, k, { size: 26 }) + T(x, 108, a, { size: 8.5 }) + N(x, 119, b)).join('') +
  T(85, 70, '×', { size: 18 }) + T(175, 70, '÷', { size: 18 }) + box(70, 138, 120, 32, '', { fill: LTEAL, stroke: TEAL }) + T(130, 152, 'Kt/V ≥ 1.2', { size: 11, c: TEAL }) + N(130, 164, 'per session, 3× weekly');
out['urr'] = `<path d="M30 160 H230" stroke="${NAVY}" stroke-width="1.5"/>` + `<rect x="60" y="40" width="50" height="120" rx="4" fill="${LRED}" stroke="${RED}" stroke-width="1.5"/>` + `<rect x="150" y="118" width="50" height="42" rx="4" fill="${LTEAL}" stroke="${TEAL}" stroke-width="1.5"/>` +
  T(85, 32, 'Pre BUN', { size: 9 }) + T(175, 110, 'Post BUN', { size: 9 }) + `<path d="M110 40 H200 V118" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/>` + arrow('M216 46 V112', 'r', 2) +
  T(250, 70, 'removed', { size: 8, a: 'end', c: RED }) + T(130, 182, 'URR = (Pre − Post) ÷ Pre × 100', { size: 9.5 }) + N(130, 14, 'how much urea one session removed');
out['dry-weight'] = (() => {
  const pts = [[20, 140], [60, 70], [70, 140], [110, 72], [120, 140], [170, 60], [180, 140], [230, 74], [240, 140]];
  return `<path d="M14 30 V160 H250" stroke="${NAVY}" stroke-width="1.5"/>` + `<path d="M14 140 H250" stroke="${TEAL}" stroke-width="2.5" stroke-dasharray="6 4"/>` +
    `<path d="M${pts.map((p) => p.join(' ')).join(' L')}" stroke="${BLUE}" stroke-width="2.4"/>` + T(250, 136, 'Dry weight', { size: 9, a: 'end', c: TEAL }) +
    [[60, 70], [110, 72], [170, 60]].map(([x, y]) => arrow(`M${x + 4} ${y + 6} L${x + 8} 132`, 'r', 1.8)).join('') +
    N(64, 50, 'gain between sessions') + N(150, 174, 'each session removes the extra fluid (UF) back to dry weight') + T(8, 24, 'weight', { size: 7.5, w: 400, a: 'start' });
})();
out['five-moments'] = `<circle cx="130" cy="96" r="54" fill="${LTEAL}" stroke="${TEAL}" stroke-width="2" stroke-dasharray="6 4"/>` + `<rect x="104" y="80" width="52" height="30" rx="6" fill="#fff" stroke="${MID}" stroke-width="2"/><circle cx="116" cy="86" r="6" fill="${GREY}" stroke="${MID}" stroke-width="1.5"/>` +
  N(130, 128, 'patient zone') +
  // WHO order: 1 before touching patient, 2 before aseptic task, 3 after body fluid, 4 after touching patient, 5 after surroundings
  [[['Before touching', 'the patient'], -162, 'end', -14, 0], [['Before a clean /', 'aseptic task'], -90, 'middle', 0, -26], [['After body-fluid', 'exposure'], -18, 'start', 14, 0], [['After touching', 'the patient'], 54, 'start', 12, 10], [['After touching', 'surroundings'], 126, 'end', -12, 10]]
    .map(([lines, deg, a, dx, dy], i) => { const ang = deg * Math.PI / 180, px = 130 + Math.cos(ang) * 54, py = 96 + Math.sin(ang) * 54;
      return `<circle cx="${px}" cy="${py}" r="9" fill="${TEAL}"/>` + T(px, py + 3.5, String(i + 1), { size: 9, c: '#fff' }) + T(px + dx, py + dy, lines[0], { size: 8, a }) + T(px + dx, py + dy + 10, lines[1], { size: 8, a }); }).join('');

writeAll('dial', out);
