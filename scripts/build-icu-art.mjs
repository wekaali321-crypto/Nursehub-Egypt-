// Section diagrams for the ICU section → public/cards/art/icu-*.svg (numbers follow the section texts).
// Re-run: node scripts/build-icu-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};

// shared torso (front) 260 x 190 grid
const TORSO = `<path d="M70 20 Q130 6 190 20 L196 120 Q196 170 186 186 H74 Q64 170 64 120Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M102 22 Q130 34 158 22" stroke="${MID}" stroke-width="1.5"/><path d="M130 30 V104" stroke="${MID}" stroke-width="3"/>`;

out['care-levels'] = [[3, 'Level 3', 'ventilated + ≥ 2 other failing organs', '#F2B8B5'], [2, 'Level 2', 'one failing organ / major post-op', '#F6D98B'], [1, 'Level 1', 'step-down · at risk of deteriorating', LTEAL], [0, 'Level 0', 'normal ward care', GREY]]
  .map(([lv, n, d, c], i) => { const top = 14 + i * 42, half = 30 + i * 30; return `<path d="M${130 - half} ${top + 40} L${130 - half + 15} ${top} H${130 + half - 15} L${130 + half} ${top + 40}Z" fill="${c}" stroke="${NAVY}" stroke-width="1.2"/>` + T(130, top + 18, n, { size: 9.5 }) + N(130, top + 30, d, 'middle', 7); }).join('') +
  T(250, 30, 'more', { size: 8, a: 'end', c: RED }) + T(250, 40, 'support', { size: 8, a: 'end', c: RED }) + arrow('M240 170 V50', 'r', 2);

out['monitor'] = `<rect x="6" y="10" width="248" height="170" rx="10" fill="#0E1A22" stroke="${NAVY}" stroke-width="2"/>` +
  `<path d="M16 46 H40 L46 26 L52 62 L58 46 H96 L102 26 L108 62 L114 46 H150" stroke="#3BD16F" stroke-width="2"/>` + T(205, 50, 'HR', { size: 8, c: '#3BD16F', a: 'start' }) + T(240, 50, '78', { size: 20, c: '#3BD16F', a: 'end' }) + T(240, 60, '60–100', { size: 7, c: '#9fe3b5', a: 'end', w: 400 }) +
  `<path d="M16 96 Q30 76 44 96 T72 96 T100 96 T128 96 T150 96" stroke="#E14B4B" stroke-width="2"/>` + T(244, 80, 'BP', { size: 8, c: '#E14B4B', a: 'end' }) + T(244, 98, '120/80', { size: 14, c: '#E14B4B', a: 'end' }) +
  `<path d="M16 140 Q30 122 40 140 T64 140 T88 140 T112 140 T136 140 T150 140" stroke="#5BC8F5" stroke-width="2"/>` + T(205, 130, 'SpO₂', { size: 8, c: '#5BC8F5', a: 'start' }) + T(240, 142, '97%', { size: 16, c: '#5BC8F5', a: 'end' }) + T(240, 152, '95–100%', { size: 7, c: '#bfe9fb', a: 'end', w: 400 }) +
  T(20, 172, 'RR 12–20 /min', { size: 8.5, c: '#F2D35B', a: 'start' }) + T(150, 172, 'Temp 36.5–37.5 °C', { size: 8.5, c: '#F5A3E0', a: 'start' });

out['circle-of-willis'] = `<path d="M130 40 L104 60 L104 100 L130 118 L156 100 L156 60Z" stroke="${NAVY}" stroke-width="2.5"/>` +
  `<path d="M104 60 L70 30 M156 60 L190 30 M104 60 L120 40 L130 40 L140 40 L156 60" stroke="${TEAL}" stroke-width="3.5"/>` + `<path d="M104 80 L40 80 M156 80 L220 80" stroke="${TEAL}" stroke-width="4"/>` +
  `<path d="M104 100 L76 140 M156 100 L184 140" stroke="${PURP}" stroke-width="3.5"/>` + `<path d="M130 118 V160 M130 160 L112 186 M130 160 L148 186" stroke="${PURP}" stroke-width="4"/>` +
  `<circle cx="104" cy="80" r="6" fill="${TEAL}"/><circle cx="156" cy="80" r="6" fill="${TEAL}"/>` +
  L(70, 30, 6, 14, 'Anterior cerebral', 'start') + L(44, 80, 6, 64, 'Middle cerebral', 'start') + L(104, 80, 60, 104, 'Internal carotid', 'end') +
  L(76, 140, 6, 150, 'Posterior cerebral', 'start') + L(130, 140, 170, 160, 'Basilar', 'start') + L(148, 184, 176, 186, 'Vertebral', 'start') +
  T(250, 30, 'Anterior circulation', { size: 8.5, c: TEAL, a: 'end' }) + T(252, 178, 'Posterior circulation', { size: 8.5, c: PURP, a: 'end' });

const HEART = `<path d="M130 178 Q50 132 46 82 Q42 40 86 34 Q114 30 130 54 Q146 30 174 34 Q218 40 214 82 Q210 132 130 178Z" fill="#FBEDEC" stroke="${RED}" stroke-width="2"/>`;
out['ecg-territories'] = HEART + `<path d="M98 70 Q110 120 134 168" stroke="${BLUE}" stroke-width="4"/><path d="M150 50 Q190 70 200 110" stroke="${PURP}" stroke-width="4"/><path d="M60 100 Q80 150 128 172" stroke="${RED}" stroke-width="4"/>` +
  T(130, 96, 'ANTERIOR', { size: 9, c: BLUE }) + N(130, 106, 'V1–V4 · LAD') + T(220, 140, 'LATERAL', { size: 9, c: PURP }) + N(220, 150, 'I, aVL, V5–V6 · LCx') + T(40, 160, 'INFERIOR', { size: 9, c: RED }) + N(40, 170, 'II, III, aVF · RCA') +
  N(130, 14, 'ST elevation in a lead group → that wall → the culprit artery');

out['chest-tube'] = `<path d="M10 20 Q60 10 100 24 L100 110 Q60 120 10 110Z" fill="#F4E3D7" stroke="${MID}" stroke-width="2"/><path d="M40 40 Q20 70 40 100 L84 100 Q100 70 84 40Z" fill="${LTEAL}" stroke="${NAVY}" stroke-width="1"/>` +
  `<path d="M92 60 Q130 60 150 90 L170 90 V158" stroke="${NAVY}" stroke-width="4"/>` + `<rect x="140" y="100" width="70" height="80" rx="8" fill="#fff" stroke="${NAVY}" stroke-width="2"/><rect x="141" y="138" width="68" height="41" rx="6" fill="${LBLUE}"/>` +
  `<path d="M141 138 H209" stroke="${BLUE}" stroke-width="1.5"/>` + `<circle cx="174" cy="150" r="2.5" fill="#fff" stroke="${BLUE}"/><circle cx="178" cy="142" r="2" fill="#fff" stroke="${BLUE}"/>` +
  `<path d="M224 138 V158" stroke="${RED}" stroke-width="1.5"/><path d="M220 138 H228 M220 158 H228" stroke="${RED}" stroke-width="1.5"/>` + T(232, 152, '~2 cm', { size: 8, a: 'start', c: RED }) +
  L(170, 158, 200, 186, 'tube end under water = seal', 'end') + L(60, 70, 30, 150, 'Pleural space', 'start') + N(176, 98, 'underwater-seal bottle') +
  T(250, 26, 'Keep the bottle', { size: 8, a: 'end' }) + T(250, 36, 'BELOW the chest', { size: 8, a: 'end', c: RED }) + N(250, 48, 'check bubbling, swing,', 'end') + N(250, 58, 'drainage volume', 'end');

out['cpr'] = TORSO + `<path d="M118 70 h24 v20 h-24z" fill="${TEAL}" opacity=".85"/>` + `<path d="M108 60 Q130 46 152 60 L148 74 Q130 64 112 74Z" fill="${NAVY}" opacity=".7"/>` +
  arrow('M130 30 V64', 'n', 3) + L(140, 82, 200, 56, 'Lower half', 'start') + T(202, 69, 'of sternum', { size: 8.5, a: 'start' }) +
  [['100–120', '/min'], ['5–6 cm', 'depth'], ['Full recoil', 'no leaning'], ['< 10 s', 'pauses'], ['30 : 2', 'no advanced airway']]
    .map(([a, b], i) => box(4 + i * 51, 136, 47, 42, '', { fill: i === 4 ? LTEAL : '#fff', r: 8 }) + T(27.5 + i * 51, 155, a, { size: 9, c: TEAL }) + N(27.5 + i * 51, 168, b, 'middle', 6.5)).join('');

out['aed-pads'] = TORSO + `<rect x="80" y="40" width="34" height="24" rx="4" fill="${YEL}" stroke="${NAVY}" stroke-width="1.5" transform="rotate(-8 97 52)"/><rect x="166" y="88" width="26" height="36" rx="4" fill="${YEL}" stroke="${NAVY}" stroke-width="1.5" transform="rotate(12 179 106)"/>` +
  L(90, 52, 8, 34, 'Right, below the clavicle', 'start') + L(184, 112, 210, 150, 'Left side, below the armpit', 'end') +
  T(30, 132, 'Shock', { size: 8.5, c: RED }) + N(30, 142, 'VF · pulseless VT') + T(30, 162, 'No shock', { size: 8.5 }) + N(30, 172, 'asystole · PEA') + N(130, 188, 'shock → CPR 2 min → check rhythm');

const ecgLine = (y, rs) => { let d = `M10 ${y}`; for (const x of rs) d += ` L${x - 8} ${y} L${x - 3} ${y - 4} L${x} ${y - 28} L${x + 4} ${y + 10} L${x + 8} ${y} `; return `<path d="${d} L250 ${y}" stroke="${NAVY}" stroke-width="1.8"/>`; };
const bolt = (x, y, c) => `<path d="M${x} ${y} l-5 10 h5 l-4 10" stroke="${c}" stroke-width="2.2"/>`;
out['sync-shock'] = T(10, 18, 'Synchronized (cardioversion)', { size: 9, a: 'start', c: TEAL }) + ecgLine(64, [50, 110, 170, 230]) + [50, 110, 170, 230].map((x) => bolt(x + 2, 22, TEAL)).join('') + N(10, 84, 'shock is timed on the R wave · lower energy', 'start') +
  T(10, 112, 'Non-synchronized (defibrillation)', { size: 9, a: 'start', c: RED }) +
  `<path d="M10 148 ${[[18, 140], [26, 156], [34, 142], [42, 152], [50, 138], [58, 158], [66, 144], [74, 150], [82, 136], [90, 156], [98, 146], [106, 154], [114, 140], [122, 158], [130, 144], [138, 150], [146, 138], [154, 156], [162, 146], [170, 152], [178, 140], [186, 158], [194, 144], [202, 150], [210, 138], [218, 156], [226, 146], [234, 152], [242, 142], [250, 148]].map(([x, y]) => `L${x} ${y}`).join(' ')}" stroke="${NAVY}" stroke-width="1.6"/>` + bolt(120, 116, RED) + N(10, 178, 'immediate shock · VF / pulseless VT', 'start');

out['vent-pressure-curve'] = `<path d="M24 20 V170 H250" stroke="${NAVY}" stroke-width="1.5"/>` + T(20, 16, 'Paw', { size: 8, a: 'end' }) + T(250, 182, 'time', { size: 8, a: 'end', w: 400 }) +
  `<path d="M24 150 H50 L54 104 L120 60 L126 92 L170 92 L176 150 H250" stroke="${TEAL}" stroke-width="2.5"/>` + `<path d="M24 150 H250" stroke="${MID}" stroke-width="1" stroke-dasharray="4 4"/>` +
  [['A', 50, 154], ['B', 54, 100], ['C', 120, 56], ['D', 126, 88], ['E', 170, 88]].map(([l, x, y]) => T(x, y, l, { size: 8.5, c: RED })).join('') +
  `<path d="M120 60 H200" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/><path d="M170 92 H200" stroke="${MID}" stroke-width="1" stroke-dasharray="3 3"/>` +
  T(204, 63, 'Peak', { size: 8.5, a: 'start' }) + T(204, 95, 'Plateau', { size: 8.5, a: 'start' }) + T(204, 153, 'PEEP', { size: 8.5, a: 'start' }) +
  N(140, 120, 'Peak − Plateau ↑ = resistance problem', 'middle', 7.5) + N(140, 132, 'Plateau ↑ = low compliance (stiff lung)', 'middle', 7.5);

out['oxygen-cascade'] = [['Air', 160, '(760 × 21%)'], ['Trachea', 150, '(760 − 50) × 21%'], ['Alveoli', 110, '− PCO₂ / 0.8'], ['Arterial', 100, '≈ 102 − age/3']]
  .map(([n, v, s], i) => { const x = 20 + i * 58, h = v * 0.9; return `<rect x="${x}" y="${170 - h}" width="46" height="${h}" rx="4" fill="${[GREY, LTEAL, '#B9E0E2', LRED][i]}" stroke="${NAVY}" stroke-width="1.2"/>` + T(x + 23, 162 - h, String(v), { size: 10, c: TEAL }) + T(x + 23, 182, n, { size: 8.5 }) + N(x + 23, 170 - h / 2, s, 'middle', 6); }).join('') +
  T(254, 20, 'PO₂ mmHg', { size: 8, a: 'end' }) + N(254, 32, 'falls step by step', 'end');

out['vent-circuit'] = box(6, 50, 70, 90, '', { fill: '#fff', r: 10 }) + T(41, 70, 'Ventilator', { size: 9 }) + `<rect x="16" y="82" width="50" height="22" rx="4" fill="#0E1A22"/><path d="M20 96 l8 -8 l8 8 l8 -8 l8 8" stroke="#3BD16F" stroke-width="1.5"/>` +
  `<circle cx="20" cy="150" r="6" fill="#fff" stroke="${GREY}" stroke-width="3"/><circle cx="40" cy="150" r="6" fill="#fff" stroke="${YEL}" stroke-width="3"/>` + N(30, 168, 'O₂ · Air inlets') +
  `<path d="M76 66 H120" stroke="${TEAL}" stroke-width="5"/>` + box(120, 50, 40, 34, '', { fill: LBLUE }) + T(140, 64, 'Humid.', { size: 7.5 }) + N(140, 76, '37 °C', 'middle', 6.5) +
  `<path d="M160 66 Q200 66 210 96" stroke="${TEAL}" stroke-width="5"/><path d="M76 124 Q160 124 210 104" stroke="${PURP}" stroke-width="5"/>` + `<path d="M210 96 L210 104 L238 100" stroke="${NAVY}" stroke-width="5"/>` +
  L(98, 66, 92, 30, 'Inspiratory limb', 'start') + L(150, 122, 120, 160, 'Expiratory limb', 'start') + L(210, 100, 230, 140, 'Y-piece', 'start') + T(246, 92, 'ETT', { size: 8.5, a: 'end' }) + arrow('M100 60 H116', 't', 1.5) + arrow('M130 128 H96', 'p', 1.5);

out['ett'] = `<path d="M20 60 H40 Q190 60 220 120 Q232 146 236 168" stroke="${NAVY}" stroke-width="10"/><path d="M20 60 H40 Q190 60 220 120 Q232 146 236 168" stroke="#fff" stroke-width="6"/>` +
  `<rect x="6" y="50" width="20" height="20" rx="3" fill="${GREY}" stroke="${NAVY}" stroke-width="1.5"/>` + `<ellipse cx="222" cy="134" rx="13" ry="9" fill="${LTEAL}" stroke="${TEAL}" stroke-width="2" transform="rotate(60 222 134)"/>` +
  `<path d="M90 62 Q100 90 92 120" stroke="${TEAL}" stroke-width="1.5"/><ellipse cx="92" cy="128" rx="6" ry="8" fill="${LTEAL}" stroke="${TEAL}" stroke-width="1.5"/>` + `<circle cx="232" cy="156" r="2.5" fill="#fff" stroke="${NAVY}"/>` +
  [120, 140, 160].map((x) => `<path d="M${x} 56 V64" stroke="${NAVY}" stroke-width="1.2"/>`).join('') +
  L(16, 60, 6, 30, 'Connector', 'start') + L(92, 128, 60, 160, 'Pilot balloon', 'end') + L(140, 58, 140, 30, 'Depth marks', 'middle') + L(222, 134, 250, 100, 'Cuff', 'end') + L(232, 156, 200, 182, 'Murphy eye', 'end') +
  box(160, 160, 0, 0, '') + T(6, 186, 'Depth at lip: ♂ 23 cm · ♀ 21 cm', { size: 8.5, a: 'start', c: TEAL });

const breath = (x, y, h, w) => `M${x} ${y} L${x + 4} ${y - h} L${x + w - 4} ${y - h} L${x + w} ${y}`;
out['vent-modes'] = [['CMV', 'all breaths by the machine', 40, [[20, 30], [70, 30], [120, 30], [170, 30], [220, 30]], []], ['SIMV', 'set breaths + patient’s own', 100, [[20, 30], [120, 30], [220, 30]], [[70, 10], [170, 12]]], ['CPAP', 'patient breathes on a constant pressure', 160, [], [[20, 10], [64, 12], [110, 9], [156, 11], [204, 10]]]]
  .map(([n, s, y, m, sp]) => `<path d="M10 ${y} H250" stroke="${MID}" stroke-width="1" ${n === 'CPAP' ? '' : 'stroke-dasharray="3 3"'}/>` + m.map(([x, h]) => `<path d="${breath(x, y, h, 30)}" stroke="${TEAL}" stroke-width="2.4"/>`).join('') + sp.map(([x, h]) => `<path d="M${x} ${y} Q${x + 14} ${y - h} ${x + 28} ${y}" stroke="${PURP}" stroke-width="2.2"/>`).join('') + T(10, y - 34, n, { size: 9.5, a: 'start' }) + N(56, y - 34, s, 'start')).join('') +
  `<path d="M190 182 H200" stroke="${TEAL}" stroke-width="2.4"/>` + N(204, 185, 'machine', 'start') + `<path d="M130 182 H140" stroke="${PURP}" stroke-width="2.2"/>` + N(144, 185, 'patient', 'start');

out['rule-of-nines'] = `<svg x="40" y="0" width="130" height="190" viewBox="0 0 160 250"><circle cx="80" cy="30" r="20" fill="${LRED}" stroke="${MID}" stroke-width="2"/><rect x="72" y="48" width="16" height="12" rx="4" fill="${GREY}"/><path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" fill="#F6D98B" stroke="${MID}" stroke-width="2"/><path d="M46 64 Q36 70 34 92 L28 146" stroke="#B9E0E2" stroke-width="13"/><path d="M114 64 Q124 70 126 92 L132 146" stroke="#B9E0E2" stroke-width="13"/><path d="M62 150 L58 240" stroke="#D9CFE8" stroke-width="17"/><path d="M98 150 L102 240" stroke="#D9CFE8" stroke-width="17"/></svg>` +
  T(105, 26, '9', { size: 12 }) + T(105, 92, '18', { size: 12 }) + N(105, 102, 'front') + T(68, 96, '9', { size: 11 }) + T(142, 96, '9', { size: 11 }) + T(92, 160, '18', { size: 11 }) + T(120, 160, '18', { size: 11 }) +
  T(196, 30, 'Adult rule of nines', { size: 9.5, a: 'start' }) + N(196, 46, 'head & neck 9', 'start') + N(196, 58, 'each arm 9', 'start') + N(196, 70, 'trunk front 18', 'start') + N(196, 82, 'trunk back 18', 'start') + N(196, 94, 'each leg 18', 'start') + N(196, 106, 'perineum 1', 'start') +
  T(196, 136, 'Parkland', { size: 9, a: 'start', c: TEAL }) + N(196, 148, '4 mL × kg × % burn', 'start');

out['rass'] = [['+4', 'Combative', RED], ['+3', 'Very agitated', RED], ['+2', 'Agitated', '#E07B39'], ['+1', 'Restless', YEL], ['0', 'Alert & calm', TEAL], ['−1', 'Drowsy', LBLUE], ['−2', 'Light sedation', LBLUE], ['−3', 'Moderate sedation', '#9DB7E0'], ['−4', 'Deep sedation', '#7C8DA6'], ['−5', 'Unarousable', '#5B6B7F']]
  .map(([s, n, c], i) => `<rect x="20" y="${8 + i * 17.6}" width="30" height="15" rx="3" fill="${c}"/>` + T(35, 19 + i * 17.6, s, { size: 8.5, c: i >= 8 || i <= 1 ? '#fff' : NAVY }) + T(58, 19 + i * 17.6, n, { size: 8.5, a: 'start', w: s === '0' ? 700 : 400 })).join('') +
  `<path d="M160 148 H230 V188 H160Z" fill="${LRED}" stroke="${RED}" stroke-width="1.2"/>` + T(195, 162, '−4 / −5: STOP', { size: 8.5, c: RED }) + N(195, 176, 'CAM-ICU not possible yet') +
  T(195, 40, 'Step 1 of CAM-ICU', { size: 9 }) + N(195, 54, 'score the level first,') + N(195, 66, 'then test for delirium');

out['cam-icu'] = box(10, 10, 110, 36, '', { fill: LTEAL }) + T(65, 25, '1 Acute change or', { size: 8 }) + T(65, 36, 'fluctuating course', { size: 8 }) +
  T(130, 32, 'AND', { size: 8.5, c: RED }) + box(140, 10, 110, 36, '', { fill: LTEAL }) + T(195, 25, '2 Inattention', { size: 8 }) + N(195, 37, 'letters test (SAVEAHAART)') +
  arrow('M130 50 V68', 'n', 2) + T(130, 82, 'AND EITHER', { size: 8.5, c: RED }) +
  box(10, 92, 110, 36, '', { fill: '#FFF4D6' }) + T(65, 107, '3 Altered level of', { size: 8 }) + T(65, 118, 'consciousness (RASS ≠ 0)', { size: 7.5 }) + T(130, 114, 'OR', { size: 8.5, c: RED }) +
  box(140, 92, 110, 36, '', { fill: '#FFF4D6' }) + T(195, 107, '4 Disorganized', { size: 8 }) + T(195, 118, 'thinking', { size: 8 }) +
  arrow('M130 132 V150', 'n', 2) + box(70, 152, 120, 30, '', { fill: LRED, stroke: RED }) + T(130, 171, 'CAM-ICU positive = DELIRIUM', { size: 8.5, c: RED });

out['oxygen-devices'] = [['Nasal cannula', '0.5–6 L/min', 'FiO₂ 24–40%', LTEAL], ['High-flow cannula', '20–100 L/min', 'FiO₂ 21–100%', '#B9E0E2'], ['Venturi mask', 'colour-coded', 'FiO₂ up to 60%', LBLUE], ['Non-rebreather', 'with reservoir bag', 'FiO₂ 80–100%', LRED]]
  .map(([n, a, b, c], i) => { const y = 12 + i * 44; return `<rect x="6" y="${y}" width="248" height="38" rx="8" fill="${c}"/>` + T(14, y + 16, n, { size: 9.5, a: 'start' }) + N(14, y + 29, a, 'start', 8) + T(246, y + 24, b, { size: 10, a: 'end', c: NAVY }) +
    `<rect x="${110}" y="${y + 6}" width="${Math.round(((i === 0 ? 40 : i === 1 ? 100 : i === 2 ? 60 : 100) / 100) * 70)}" height="8" rx="4" fill="${TEAL}" opacity=".7"/>`; }).join('');

const skin = (x, depth, label, sub) => `<g transform="translate(${x} 20)"><rect width="56" height="22" fill="#F4C9A8"/><rect y="22" width="56" height="36" fill="${LRED}"/><rect y="58" width="56" height="32" fill="#F6D98B"/><rect y="90" width="56" height="26" fill="#E3B9B0"/><rect y="116" width="56" height="16" fill="#fff" stroke="${MID}"/>` +
  (depth === 1 ? `<rect width="56" height="22" fill="${RED}" opacity=".45"/>` : `<path d="M10 0 Q28 ${[0, 0, 30, 64, 126][depth]} 46 0Z" fill="#7a2b2b" opacity=".75"/>`) + `</g>` + T(x + 28, 168, label, { size: 9 }) + N(x + 28, 180, sub, 'middle', 6.5);
out['pressure-stages'] = skin(6, 1, 'Stage 1', 'red, non-blanchable') + skin(70, 2, 'Stage 2', 'partial: dermis') + skin(134, 3, 'Stage 3', 'full: fat visible') + skin(198, 4, 'Stage 4', 'muscle / bone') +
  T(4, 14, 'skin · dermis · fat · muscle · bone', { size: 7, a: 'start', w: 400, c: C.SUB });

out['drip-rate'] = [['Blood set', '10 drops = 1 mL', '÷ 6', 3], ['Standard set', '15 drops = 1 mL', '÷ 4', 4], ['Micro-drip', '60 drops = 1 mL', '÷ 1', 6]]
  .map(([n, a, b, k], i) => { const x = 10 + i * 84; return `<path d="M${x + 30} 14 h18 v30 l-9 10 l-9 -10z" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.4"/>` + Array.from({ length: k }, (_, j) => `<circle cx="${x + 39}" cy="${64 + j * 9}" r="${k > 4 ? 2 : 3.2}" fill="${BLUE}"/>`).join('') +
    T(x + 39, 140, n, { size: 9 }) + N(x + 39, 152, a) + T(x + 39, 166, `mL/h ${b}`, { size: 9, c: TEAL }); }).join('') + T(130, 188, 'drops/min = mL/hour ÷ (60 ÷ drop factor)', { size: 8.5 });

out['opa-npa'] = `<path d="M40 40 H80 Q120 40 120 80 Q120 120 90 140" stroke="${NAVY}" stroke-width="12"/><path d="M40 40 H80 Q120 40 120 80 Q120 120 90 140" stroke="#fff" stroke-width="6"/><rect x="28" y="28" width="12" height="24" rx="2" fill="${TEAL}"/>` +
  T(80, 170, 'Oropharyngeal (OPA)', { size: 9 }) + N(80, 182, 'unconscious only · mouth corner → jaw angle') + L(34, 30, 6, 14, 'Flange', 'start') + L(80, 40, 96, 18, 'Bite block', 'start') + L(118, 84, 122, 110, 'Curved body', 'start') +
  `<path d="M180 30 Q186 100 210 140" stroke="${NAVY}" stroke-width="9"/><path d="M180 30 Q186 100 210 140" stroke="#F6D98B" stroke-width="5"/><ellipse cx="180" cy="28" rx="12" ry="5" fill="${TEAL}"/>` +
  T(214, 170, 'Nasopharyngeal (NPA)', { size: 9 }) + N(214, 182, 'conscious OK · nostril → earlobe') + L(190, 28, 214, 14, 'Flange', 'start') + L(208, 136, 236, 120, 'Soft tip', 'end');

out['cvp'] = TORSO.replace('#F4E3D7', '#F4E3D7') + `<path d="M64 112 H196" stroke="${RED}" stroke-width="2" stroke-dasharray="6 4"/><circle cx="168" cy="112" r="5" fill="${RED}"/>` +
  L(168, 112, 206, 92, 'Zero: phlebostatic axis', 'end') + N(206, 104, '4th ICS · mid-axillary line', 'end') +
  T(130, 150, 'Normal CVP by catheter site (cmH₂O)', { size: 8.5 }) + N(130, 164, 'jugular 0–8 · subclavian 2–12 · SVC 8–16') + N(130, 178, 'high → fluid overload / CHF · low → bleeding / dehydration');

out['ngt-measure'] = `<path d="M30 70 Q30 30 70 26 Q100 26 106 50 L104 80 Q90 96 70 96 Q48 96 44 120 L44 186" stroke="${MID}" stroke-width="2" fill="#F4E3D7"/>` +
  `<circle cx="104" cy="58" r="3.5" fill="${RED}"/><circle cx="52" cy="62" r="3.5" fill="${RED}"/><circle cx="150" cy="120" r="3.5" fill="${RED}"/><circle cx="150" cy="168" r="3.5" fill="${RED}"/><circle cx="150" cy="144" r="4" fill="${TEAL}"/>` +
  `<path d="M104 58 L52 62 L150 120 L150 144" stroke="${TEAL}" stroke-width="2.4" stroke-dasharray="5 3"/>` + `<path d="M120 112 H200 V186 H120" stroke="${MID}" stroke-width="1.5"/>` +
  L(104, 58, 130, 40, 'Nose', 'start') + L(52, 62, 10, 40, 'Earlobe', 'start') + L(150, 120, 210, 112, 'Xiphoid', 'start') + L(150, 168, 210, 176, 'Umbilicus', 'start') + L(150, 144, 210, 144, 'Adult: midpoint', 'start') +
  N(10, 186, 'child: nose → earlobe → xiphoid', 'start');

out['ecg-leads'] = TORSO + [[124, 84, 'V1'], [140, 84, 'V2'], [151, 92, 'V3'], [160, 100, 'V4'], [176, 100, 'V5'], [190, 100, 'V6']].map(([x, y, n]) => dot(x, y, 5, YEL) + T(x, y - 8, n, { size: 7.5 })).join('') +
  `<path d="M160 100 h-30" stroke="${MID}" stroke-width="1" stroke-dasharray="2 2"/>` +
  [[64, 36, 'RA', '#fff'], [196, 36, 'LA', YEL], [80, 182, 'RL', GREY], [180, 182, 'LL', '#3BD16F']].map(([x, y, n, c]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="${NAVY}" stroke-width="1.2"/>` + T(x + (x < 130 ? -10 : 10), y + 3, n, { size: 8, a: x < 130 ? 'end' : 'start' })).join('') +
  N(6, 120, 'V1 · V2: 4th ICS', 'start') + N(6, 130, 'beside sternum', 'start') + N(6, 144, 'V4: 5th ICS mid-clav.', 'start') + N(6, 154, 'V3 between V2 & V4', 'start') + N(254, 140, 'V5 ant. axillary', 'end') + N(254, 150, 'V6 mid-axillary', 'end') + N(254, 172, 'RL = ground', 'end');

out['icp'] = `<path d="M30 30 Q130 -4 230 30 V170 H30Z" fill="${GREY}" stroke="${NAVY}" stroke-width="3"/>` + `<rect x="40" y="40" width="148" height="122" rx="10" fill="#F8DADA"/><rect x="188" y="40" width="16" height="122" fill="${LBLUE}"/><rect x="204" y="40" width="18" height="122" fill="${LRED}" opacity=".9"/>` +
  T(114, 96, 'Brain 80%', { size: 11 }) + T(194, 182, 'CSF 8%', { size: 8, c: BLUE, a: 'end' }) + T(204, 182, 'Blood 12%', { size: 8, c: RED, a: 'start' }) +
  N(130, 14, 'fixed skull: if one rises, another must fall (Monro–Kellie)') + N(114, 116, 'normal ICP 12–15 mmHg') + T(114, 136, 'Cushing’s triad: ↑BP · ↓HR · irregular breathing', { size: 7.5, c: RED });

out['ecmo'] = `<path d="M40 80 Q40 40 70 34 H100" stroke="${BLUE}" stroke-width="5"/>` + `<circle cx="112" cy="34" r="12" fill="#fff" stroke="${NAVY}" stroke-width="2"/><path d="M106 28 L118 40 M118 28 L106 40" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M124 34 H156" stroke="${BLUE}" stroke-width="5"/>` + box(156, 18, 54, 34, '', { fill: LTEAL }) + T(183, 33, 'Oxygenator', { size: 7.5 }) + N(183, 44, '+O₂ −CO₂', 'middle', 6.5) +
  `<path d="M210 34 H232 Q246 34 246 60 V130 Q246 150 220 150 H160" stroke="${RED}" stroke-width="5"/>` + `<path d="M60 90 Q60 150 100 150 H120" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M56 86 Q66 120 100 132 Q130 140 150 132 L156 150" fill="${LRED}" stroke="${MID}" stroke-width="1"/>` + T(100, 112, 'Patient', { size: 9 }) +
  L(40, 70, 6, 60, 'Drainage cannula', 'start') + L(112, 34, 112, 70, 'Pump', 'middle') + L(200, 150, 190, 176, 'Return cannula', 'end') + N(130, 188, 'VV-ECMO supports the lungs · VA-ECMO supports heart + lungs');

writeAll('icu', out);
