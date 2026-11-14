// Section diagrams for the First Aid section → public/cards/art/fa-*.svg (content follows the section texts).
// Re-run: node scripts/build-firstaid-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F4E3D7';

const letters = (items, colour = TEAL) => items.map(([l, n, s], i) => { const y = 8 + i * (178 / items.length); const h = 178 / items.length - 6;
  return `<rect x="6" y="${y}" width="248" height="${h}" rx="8" fill="${i % 2 ? '#fff' : LTEAL}" stroke="${MID}" stroke-width=".8"/>` + T(26, y + h / 2 + 6, l, { size: 16, c: colour }) + T(48, y + h / 2 - 1, n, { size: 9, a: 'start' }) + N(48, y + h / 2 + 10, s, 'start', 7.3); }).join('');

out['drsabc'] = letters([['D', 'Danger', 'make sure you and others are safe'], ['R', 'Response', 'shake shoulders: “Are you alright?” — shout for help'], ['S', 'Severe bleeding', 'stop major bleeding first'], ['A', 'Airway', 'head tilt – chin lift (jaw thrust if spine injury)'], ['B', 'Breathing', 'look · listen · feel — no more than 10 s'], ['C', 'Circulation', 'signs of life · control bleeding']]);
out['avpu'] = letters([['A', 'Alert', 'fully awake and aware'], ['V', 'Voice', 'responds only when spoken to loudly'], ['P', 'Pain', 'responds only to a painful stimulus'], ['U', 'Unresponsive', 'no response to voice or pain']], PURP);

out['recovery-position'] = `<path d="M10 150 H250" stroke="${MID}" stroke-width="3"/>` +
  `<circle cx="52" cy="118" r="15" fill="${SKIN}" stroke="${NAVY}" stroke-width="1.5"/><path d="M40 128 Q46 140 60 136" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M66 116 Q120 96 168 116 Q176 132 168 146 Q120 152 70 144Z" fill="#B9E0E2" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M80 124 Q62 130 58 138" stroke="${SKIN}" stroke-width="9"/><path d="M84 140 Q100 150 120 148" stroke="${SKIN}" stroke-width="8"/>` +
  `<path d="M166 124 L200 100 L232 118" stroke="#6B7F8F" stroke-width="10"/><path d="M168 140 L240 144" stroke="#6B7F8F" stroke-width="10"/>` +
  L(46, 118, 14, 80, 'Head tilted back — airway open', 'start') + L(58, 136, 20, 172, 'Hand under the cheek', 'start') + L(200, 100, 250, 60, 'Top knee bent = stable', 'end') + L(110, 148, 130, 178, 'Lower arm out', 'start') +
  T(130, 18, 'Recovery position (unconscious, breathing)', { size: 9 }) + N(130, 32, 'roll the casualty toward you, then keep checking breathing');

out['child-infant-cpr'] = `<ellipse cx="66" cy="110" rx="46" ry="38" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M66 78 V140" stroke="${MID}" stroke-width="2"/>` +
  `<ellipse cx="66" cy="112" rx="14" ry="10" fill="#E7B795" stroke="${NAVY}" stroke-width="1.2"/>` + T(66, 30, 'Child', { size: 10 }) + N(66, 44, '1 – 2 hands, lower half of sternum') + N(66, 164, 'start with 2 rescue breaths') +
  `<ellipse cx="194" cy="110" rx="34" ry="28" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M194 86 V134" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M188 100 v20 M200 100 v20" stroke="#E7B795" stroke-width="7"/>` + T(194, 30, 'Baby (< 1 year)', { size: 10 }) + N(194, 44, '2 fingers, just below the nipple line') + N(194, 164, 'gentle head tilt — do NOT over-extend') +
  N(130, 186, 'if unsure, doing something is far better than nothing');

const stoop = (x, y) => `<circle cx="${x}" cy="${y - 34}" r="9" fill="${SKIN}" stroke="${NAVY}"/><path d="M${x} ${y - 25} Q${x + 14} ${y - 12} ${x + 4} ${y + 12} L${x} ${y + 40}" stroke="#B9E0E2" stroke-width="14"/>`;
out['choking'] = [['Adult & older', ['1. 5 back slaps', '2. 5 abdominal', 'thrusts'], ['fist above', 'the navel']], ['Child (1 yr +)', ['1. 5 back slaps', '2. 5 CHEST', 'thrusts'], ['not', 'abdominal']], ['Baby (< 1 yr)', ['1. 5 back slaps', '2. 5 chest thrusts', '(2 fingers)'], ['face down on', 'forearm, head low']]]
  .map(([n, steps, note], i) => { const x = 6 + i * 84; return `<rect x="${x}" y="8" width="80" height="170" rx="10" fill="${i === 2 ? LRED : i === 1 ? '#FBE3C8' : LTEAL}"/>` + T(x + 40, 26, n, { size: 8.5 }) +
    (i < 2 ? stoop(x + 32, 82) : `<path d="M${x + 12} 80 L${x + 70} 70" stroke="#E7B795" stroke-width="10"/><ellipse cx="${x + 42}" cy="66" rx="20" ry="8" fill="${SKIN}" stroke="${NAVY}"/><circle cx="${x + 20}" cy="70" r="6" fill="${SKIN}" stroke="${NAVY}"/>`) +
    steps.map((s, j) => T(x + 40, 134 + j * 11, s, { size: 7.5 })).join('') + note.map((s, j) => N(x + 40, 164 + j * 8, s, 'middle', 6.3)).join(''); }).join('') + N(130, 190, 'encourage coughing first · check the mouth between steps', 'middle', 6.5);

out['seep'] = [['S', 'Sit or lay', 'the casualty down'], ['E', 'Examine', 'the wound & the cause'], ['E', 'Elevate', 'above heart level'], ['P', 'Pressure', 'direct, firm, continuous']]
  .map(([l, n, s], i) => { const x = 6 + i * 63; return `<rect x="${x}" y="20" width="58" height="96" rx="10" fill="${i === 3 ? LRED : LTEAL}"/>` + T(x + 29, 52, l, { size: 22, c: i === 3 ? RED : TEAL }) + T(x + 29, 78, n, { size: 8.5 }) + N(x + 29, 92, s.split(' ')[0] + ' ' + (s.split(' ')[1] || ''), 'middle', 6.5) + N(x + 29, 102, s.split(' ').slice(2).join(' '), 'middle', 6.5); }).join('') +
  `<path d="M60 150 H200" stroke="${SKIN}" stroke-width="16"/><rect x="118" y="138" width="24" height="24" rx="4" fill="${RED}" opacity=".6"/>` + `<path d="M130 120 V136" stroke="${NAVY}" stroke-width="3" marker-end="url(#an)"/>` + N(130, 186, 'goal: stop bleeding fast → prevent shock and infection');

out['pressure-points'] = `<svg x="40" y="0" width="140" height="190" viewBox="0 0 160 250"><circle cx="80" cy="30" r="20" fill="${GREY}" stroke="${MID}" stroke-width="2"/><rect x="72" y="48" width="16" height="12" rx="4" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M46 62 Q80 54 114 62 L112 112 Q112 132 106 150 L54 150 Q48 132 48 112 Z" fill="${GREY}" stroke="${MID}" stroke-width="2"/><path d="M46 64 Q36 70 34 92 L28 146" stroke="${MID}" stroke-width="11"/><path d="M114 64 Q124 70 126 92 L132 146" stroke="${MID}" stroke-width="11"/><path d="M62 150 L58 240" stroke="${MID}" stroke-width="15"/><path d="M98 150 L102 240" stroke="${MID}" stroke-width="15"/>` +
  [[64, 26], [70, 42], [76, 54], [92, 62], [38, 88], [70, 150], [29, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${RED}" stroke="#fff" stroke-width="1.5"/>`).join('') + `</svg>` +
  [['1 Temporal', 64, 26], ['2 Facial', 70, 42], ['3 Carotid*', 76, 54], ['4 Subclavian', 92, 62], ['5 Brachial', 38, 88], ['6 Femoral', 70, 150], ['7 Radial / ulnar', 29, 140]]
    .map(([n, x, y], i) => { const X = 40 + (x * 140) / 160, Y = (y * 190) / 250; return L(X, Y, i % 2 ? 196 : 4, 16 + i * 22, n, 'start'); }).join('') +
  N(130, 188, '* never press both sides of the neck');

const skinBlock = (x, depth, label, sub) => `<g transform="translate(${x} 22)"><rect width="74" height="24" fill="#F4C9A8"/><rect y="24" width="74" height="40" fill="${LRED}"/><rect y="64" width="74" height="30" fill="#F6D98B"/><rect y="94" width="74" height="22" fill="#E3B9B0"/>` +
  `<rect width="74" height="${[24, 64, 116][depth - 1]}" fill="${['#E46A5B', '#C8452F', '#3A2A26'][depth - 1]}" opacity="${[0.35, 0.45, 0.75][depth - 1]}"/>` + (depth === 2 ? `<ellipse cx="37" cy="0" rx="14" ry="7" fill="#fff" stroke="${RED}"/>` : '') + `</g>` +
  T(x + 37, 156, label, { size: 9.5 }) + sub.map((s, j) => N(x + 37, 168 + j * 10, s, 'middle', 6.6)).join('');
out['burn-degrees'] = skinBlock(6, 1, '1st degree', ['outer layer only', 'red, painful']) + skinBlock(93, 2, '2nd degree', ['into the dermis', 'blisters, very painful']) + skinBlock(180, 3, '3rd degree', ['all layers ± muscle', 'white/charred, may not hurt']) +
  N(4, 14, 'epidermis · dermis · fat · muscle', 'start', 7);

out['fast'] = [['F', 'Face', ['smile —', 'one side', 'drooping?']], ['A', 'Arms', ['raise both —', 'one drifts', 'down?']], ['S', 'Speech', ['slurred or', 'not', 'understood?']], ['T', 'Time', ['call the', 'ambulance', 'NOW']]]
  .map(([l, n, lines], i) => { const x = 6 + i * 63; return `<rect x="${x}" y="14" width="58" height="150" rx="10" fill="${i === 3 ? LRED : LTEAL}"/>` + T(x + 29, 52, l, { size: 28, c: i === 3 ? RED : TEAL }) + T(x + 29, 76, n, { size: 9.5 }) +
    lines.map((line, j) => N(x + 29, 92 + j * 10, line, 'middle', 7)).join('') +
    (i === 0 ? `<circle cx="${x + 29}" cy="138" r="13" fill="${SKIN}" stroke="${NAVY}"/><path d="M${x + 22} 143 Q${x + 29} 147 ${x + 36} 140" stroke="${NAVY}" stroke-width="1.5"/>` : i === 1 ? `<path d="M${x + 18} 148 V128 M${x + 40} 148 V138" stroke="${NAVY}" stroke-width="4"/>` : i === 2 ? `<path d="M${x + 18} 138 q6 -8 12 0 t12 0" stroke="${NAVY}" stroke-width="2"/>` : `<circle cx="${x + 29}" cy="140" r="12" fill="#fff" stroke="${RED}" stroke-width="2"/><path d="M${x + 29} 140 v-8 M${x + 29} 140 l6 4" stroke="${RED}" stroke-width="2"/>`); }).join('') +
  N(130, 184, 'any one sign = suspect stroke · note the time it started');

out['shock-position'] = `<path d="M10 150 H250" stroke="${MID}" stroke-width="3"/><circle cx="40" cy="136" r="12" fill="${SKIN}" stroke="${NAVY}"/><path d="M52 138 H150" stroke="#B9E0E2" stroke-width="16"/><path d="M150 138 L226 100" stroke="#6B7F8F" stroke-width="12"/>` +
  `<rect x="190" y="112" width="44" height="38" rx="6" fill="${GREY}" stroke="${MID}"/><path d="M250 100 V150" stroke="${RED}" stroke-width="1.5"/><path d="M246 100 H254 M246 150 H254" stroke="${RED}" stroke-width="1.5"/>` +
  T(244, 92, '20–30 cm', { size: 8.5, c: RED, a: 'end' }) + `<path d="M50 120 Q90 110 140 122" stroke="${YEL}" stroke-width="2" stroke-dasharray="4 3"/>` + N(90, 108, 'cover — keep warm') +
  T(130, 20, 'Lay down, raise the legs', { size: 10 }) + N(130, 34, 'unless it worsens another injury (e.g. a broken leg)') + N(130, 48, 'loosen tight clothing · call for help · nothing by mouth') + N(130, 176, 'keep checking breathing and response');

out['nosebleed'] = `<circle cx="110" cy="96" r="54" fill="${SKIN}" stroke="${MID}" stroke-width="2"/><path d="M148 92 L170 116 L150 120" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M150 104 Q166 114 160 124" stroke="${NAVY}" stroke-width="5"/><circle cx="164" cy="112" r="6" fill="#E7B795" stroke="${NAVY}"/>` + arrow('M70 30 Q100 18 128 30', 'n', 2) +
  T(90, 16, 'lean FORWARD', { size: 9, c: TEAL }) + L(162, 116, 196, 150, 'Pinch the SOFT part', 'start') + N(198, 162, 'below the bony bridge', 'start') +
  T(196, 54, '10 min', { size: 14, c: RED, a: 'start' }) + N(198, 68, 'continuous — no peeking', 'start') + N(10, 176, 'breathe through the mouth · do not tilt the head back', 'start');

out['splint'] = `<path d="M20 110 H240" stroke="${SKIN}" stroke-width="26"/><circle cx="56" cy="110" r="14" fill="#E7B795" stroke="${MID}"/><circle cx="204" cy="110" r="14" fill="#E7B795" stroke="${MID}"/>` +
  `<path d="M128 96 L120 110 L132 112 L124 124" stroke="${RED}" stroke-width="3"/>` + `<rect x="36" y="80" width="188" height="10" rx="3" fill="${YEL}" stroke="${NAVY}"/><rect x="36" y="130" width="188" height="10" rx="3" fill="${YEL}" stroke="${NAVY}"/>` +
  [60, 96, 164, 200].map((x) => `<path d="M${x} 76 V144" stroke="${TEAL}" stroke-width="4"/>`).join('') +
  L(56, 110, 30, 40, 'Joint ABOVE', 'start') + L(204, 110, 230, 40, 'Joint BELOW', 'end') + L(126, 110, 130, 30, 'Fracture', 'middle') + L(130, 85, 160, 170, 'Splint covers both joints', 'start');

writeAll('fa', out);
