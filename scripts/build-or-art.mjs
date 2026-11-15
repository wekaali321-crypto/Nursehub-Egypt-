// Section diagrams for the Operating Room section → public/cards/art/or-*.svg (content follows the section texts).
// Re-run: node scripts/build-or-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F4E3D7';
const person = (x, y, label, c = TEAL, sub = '') => `<circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="${NAVY}" stroke-width="1.2"/>` + T(x, y + 24, label, { size: 7.5 }) + (sub ? N(x, y + 33, sub, 'middle', 6.5) : '');

out['team-layout'] = `<rect x="70" y="56" width="120" height="44" rx="8" fill="#fff" stroke="${NAVY}" stroke-width="2"/><rect x="100" y="66" width="60" height="24" rx="10" fill="${SKIN}" stroke="${MID}"/>` + T(130, 82, 'patient', { size: 7, w: 400 }) +
  `<rect x="50" y="36" width="160" height="84" rx="12" stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="5 4"/>` + N(208, 32, 'sterile field', 'end') +
  person(26, 78, 'Anesthesia', PURP, 'head end') + person(110, 140, 'Surgeon') + person(160, 140, 'Assistant') + person(232, 78, 'Scrub nurse', TEAL, 'instrument table') +
  `<rect x="214" y="118" width="38" height="18" rx="4" fill="${GREY}" stroke="${MID}"/>` + person(232, 152, 'Circulating', GREY, 'outside the field') + N(10, 186, 'scrubbed team stays inside the dashed zone', 'start');

out['sterile-field'] = `<path d="M60 40 Q80 26 100 40 L104 120 H56Z" fill="#B9E0E2" stroke="${NAVY}" stroke-width="1.5"/><circle cx="80" cy="26" r="11" fill="${SKIN}" stroke="${MID}"/>` +
  `<path d="M60 56 H100 V100 H60Z" fill="${TEAL}" opacity=".55"/><path d="M60 46 L36 92 M100 46 L124 92" stroke="#B9E0E2" stroke-width="9"/><path d="M46 70 L36 92 M114 70 L124 92" stroke="${TEAL}" stroke-width="9" opacity=".7"/>` +
  L(80, 78, 10, 150, 'Sterile: chest to waist + sleeves', 'start') + N(10, 162, 'back, below waist, above shoulders = not sterile', 'start') +
  `<circle cx="176" cy="44" r="9" fill="${TEAL}"/><circle cx="216" cy="44" r="9" fill="${TEAL}"/>` + arrow('M184 34 Q196 20 208 34', 'n', 1.5) + T(196, 70, 'face-to-face', { size: 8 }) +
  `<circle cx="176" cy="104" r="9" fill="${TEAL}"/><circle cx="216" cy="104" r="9" fill="${TEAL}"/><path d="M168 104 h-6 M224 104 h6" stroke="${NAVY}" stroke-width="2"/>` + T(196, 130, 'or back-to-back', { size: 8 }) + N(196, 142, 'when changing places');

out['scrub'] = `<path d="M60 170 L120 60 L150 20" stroke="${SKIN}" stroke-width="26"/><path d="M60 170 L120 60 L150 20" stroke="${MID}" stroke-width="1" fill="none"/>` +
  `<circle cx="150" cy="18" r="16" fill="${SKIN}" stroke="${MID}"/>` + [['1', 158, 10], ['2', 140, 32], ['3', 112, 78], ['4', 72, 148]].map(([n, x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${TEAL}"/>` + T(x, y + 3, n, { size: 8, c: '#fff' })).join('') +
  arrow('M96 120 L76 156', 'b', 2) + N(70, 186, 'water runs off at the elbow') +
  T(170, 60, '1 fingertips', { size: 8.5, a: 'start' }) + T(170, 76, '2 palm & back of hand', { size: 8.5, a: 'start' }) + T(170, 92, '3 forearm', { size: 8.5, a: 'start' }) + T(170, 108, '4 up to the elbow', { size: 8.5, a: 'start' }) +
  T(170, 136, 'Hands UP,', { size: 9, a: 'start', c: TEAL }) + T(170, 148, 'elbows down', { size: 9, a: 'start', c: TEAL }) + N(170, 160, 'clean → less clean', 'start');

out['cssd-flow'] = [['Decontamination', 'receive · clean', LRED], ['Clean / packing', 'inspect · arrange · wrap', '#FBE3C8'], ['Sterile storage', 'sterilize · store until needed', LTEAL]]
  .map(([n, s, c], i) => { const x = 4 + i * 86; return `<rect x="${x}" y="50" width="78" height="80" rx="10" fill="${c}" stroke="${NAVY}" stroke-width="1.2"/>` + T(x + 39, 82, n, { size: 8.5 }) + N(x + 39, 98, s.split(' · ')[0], 'middle', 6.5) + N(x + 39, 108, s.split(' · ').slice(1).join(' · '), 'middle', 6.5) + (i < 2 ? arrow(`M${x + 80} 90 H${x + 88}`, 'n', 2.5) : ''); }).join('') +
  T(130, 30, 'ONE-WAY flow: dirty → clean → sterile', { size: 9.5, c: TEAL }) + N(130, 158, 'instruments never travel backwards') + T(46, 44, 'dirty', { size: 7.5, c: RED }) + T(218, 44, 'sterile', { size: 7.5, c: TEAL });

const tbl = (x, y) => `<path d="M${x - 50} ${y} H${x + 50}" stroke="${MID}" stroke-width="4"/><path d="M${x} ${y} v12" stroke="${MID}" stroke-width="3"/>`;
const ppl = (x, y, inner) => `<g transform="translate(${x} ${y})">${inner}</g>`;
out['positions'] = [
  ['Supine', 'most abdominal & chest', (x, y) => tbl(x, y) + ppl(x, y - 3, `<circle cx="-36" cy="-6" r="6" fill="${SKIN}" stroke="${NAVY}"/><path d="M-29 -5 H34" stroke="${NAVY}" stroke-width="7"/>`)],
  ['Lithotomy', 'gyn · obstetric · urology', (x, y) => tbl(x, y) + ppl(x, y - 3, `<circle cx="-36" cy="-6" r="6" fill="${SKIN}" stroke="${NAVY}"/><path d="M-29 -5 H10 L24 -26 L38 -24" stroke="${NAVY}" stroke-width="7"/><path d="M24 -26 v26" stroke="${MID}" stroke-width="2"/>`)],
  ['Lateral', 'kidney · chest side', (x, y) => tbl(x, y) + ppl(x, y - 3, `<circle cx="-36" cy="-9" r="6" fill="${SKIN}" stroke="${NAVY}"/><path d="M-29 -9 H16 Q26 -9 30 -2" stroke="${NAVY}" stroke-width="10"/>`)],
  ['Prone', 'spine · back of body', (x, y) => tbl(x, y) + ppl(x, y - 3, `<circle cx="-36" cy="-6" r="6" fill="${NAVY}"/><path d="M-29 -5 H34" stroke="${NAVY}" stroke-width="7"/>`)],
].map(([n, s, f], i) => { const x = 66 + (i % 2) * 128, y = 64 + Math.floor(i / 2) * 82; return f(x, y) + T(x, y + 26, n, { size: 9 }) + N(x, y + 37, s); }).join('');

out['table-parts'] = `<rect x="20" y="70" width="40" height="22" rx="4" fill="${LTEAL}" stroke="${NAVY}" stroke-width="1.5"/><rect x="62" y="70" width="70" height="22" rx="3" fill="#fff" stroke="${NAVY}" stroke-width="1.5"/><rect x="134" y="70" width="44" height="22" rx="3" fill="#fff" stroke="${NAVY}" stroke-width="1.5"/><rect x="180" y="70" width="64" height="22" rx="3" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.5"/>` +
  `<path d="M96 70 L84 30 M96 92 L84 132" stroke="${NAVY}" stroke-width="6"/><rect x="74" y="20" width="22" height="12" rx="3" fill="${GREY}" stroke="${NAVY}"/><rect x="74" y="130" width="22" height="12" rx="3" fill="${GREY}" stroke="${NAVY}"/>` +
  `<path d="M140 92 V150 M120 150 H160" stroke="${MID}" stroke-width="6"/>` +
  L(40, 70, 20, 40, 'Head plate', 'start') + L(97, 81, 70, 170, 'Back plate', 'start') + L(156, 81, 170, 130, 'Seat', 'start') + L(212, 81, 224, 40, 'Leg board', 'start') + L(85, 26, 120, 16, 'Arm boards', 'start') +
  N(130, 186, 'sections raise, lower or come off to make each position');

const handle = (x, y, w, label) => `<rect x="${x}" y="${y}" width="${w}" height="10" rx="4" fill="${GREY}" stroke="${NAVY}" stroke-width="1.2"/>` + N(x + w / 2, y + 22, label);
const blade = (x, y, kind) => kind === 20 ? `<path d="M${x} ${y} h26 q14 0 16 6 q-8 6 -42 4z" fill="#D5DCE0" stroke="${NAVY}" stroke-width="1.2"/>` : kind === 10 ? `<path d="M${x} ${y} h20 q12 0 14 5 q-8 5 -34 3z" fill="#D5DCE0" stroke="${NAVY}" stroke-width="1.2"/>` : `<path d="M${x} ${y} h14 q8 0 10 4 q-6 4 -24 2z" fill="#D5DCE0" stroke="${NAVY}" stroke-width="1.2"/>`;
out['scalpel'] = T(10, 20, 'Large handle', { size: 9, a: 'start' }) + handle(10, 30, 80, '') + blade(90, 32, 20) + T(150, 40, 'No. 20 — skin incision', { size: 8.5, a: 'start' }) +
  T(10, 72, 'Small handle', { size: 9, a: 'start' }) + handle(10, 82, 60, '') + blade(70, 84, 10) + T(124, 92, 'No. 10 — skin', { size: 8.5, a: 'start' }) + blade(70, 104, 15) + T(124, 110, 'No. 15 — fine areas', { size: 8.5, a: 'start' }) +
  T(10, 140, 'Long handle', { size: 9, a: 'start' }) + handle(10, 150, 120, '') + blade(130, 152, 15) + T(168, 158, 'No. 15 — deep areas', { size: 8.5, a: 'start' }) + N(10, 186, 'pass the scalpel handle-first, blade down, never hand-to-hand loose', 'start', 7);

out['needles'] = T(60, 18, 'Cutting needle', { size: 9.5 }) + `<path d="M48 40 L72 40 L60 60Z" fill="${LRED}" stroke="${RED}" stroke-width="2"/>` + N(60, 76, 'triangular tip') + N(60, 88, 'skin · fascia · scalp') +
  T(196, 18, 'Round (taper) needle', { size: 9.5 }) + `<circle cx="196" cy="50" r="12" fill="${LTEAL}" stroke="${TEAL}" stroke-width="2"/>` + N(196, 76, 'round tip') + N(196, 88, 'vessels · nerves · bowel') +
  `<path d="M20 140 H110" stroke="${NAVY}" stroke-width="3"/><circle cx="110" cy="140" r="2" fill="${NAVY}"/>` + T(65, 160, 'Straight', { size: 9 }) + N(65, 172, 'superficial skin (rarely now)') +
  `<path d="M160 150 A40 40 0 0 1 240 150" stroke="${NAVY}" stroke-width="3"/>` + T(200, 170, 'Curved', { size: 9 }) + N(200, 182, 'most suturing, deep tissue');

out['electrosurgery'] = T(66, 16, 'Monopolar', { size: 10 }) + `<rect x="16" y="100" width="100" height="40" rx="18" fill="${SKIN}" stroke="${MID}"/>` + `<path d="M40 30 L58 96" stroke="${NAVY}" stroke-width="5"/><path d="M58 96 l3 6" stroke="${YEL}" stroke-width="3"/>` +
  `<rect x="78" y="146" width="40" height="12" rx="3" fill="${YEL}" stroke="${NAVY}"/>` + `<path d="M62 104 Q80 126 96 146" stroke="${RED}" stroke-width="2" stroke-dasharray="4 3"/>` + arrow('M98 158 Q124 172 130 110 Q132 40 70 30', 'r', 1.6) +
  L(46, 50, 6, 60, 'Pencil', 'start') + L(98, 152, 60, 170, 'Return pad', 'end') + N(66, 190, 'current crosses the patient') +
  T(200, 16, 'Bipolar', { size: 10 }) + `<rect x="150" y="100" width="100" height="40" rx="18" fill="${SKIN}" stroke="${MID}"/><path d="M190 30 L196 100 M210 30 L204 100" stroke="${NAVY}" stroke-width="4"/>` + `<path d="M196 100 H204" stroke="${RED}" stroke-width="3"/>` +
  N(200, 160, 'current only between the tips') + N(200, 172, 'no pad needed · fine work');

out['tourniquet'] = `<path d="M20 90 H230 Q246 90 246 104 Q246 118 230 118 H20Z" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>` + `<rect x="60" y="80" width="40" height="48" rx="6" fill="${LBLUE}" stroke="${BLUE}" stroke-width="2"/>` +
  `<path d="M80 80 V40 H120" stroke="${NAVY}" stroke-width="2"/>` + box(120, 26, 58, 28, '', { fill: '#fff' }) + T(149, 44, 'mmHg', { size: 8 }) + `<path d="M120 104 H246" stroke="${RED}" stroke-width="2" stroke-dasharray="4 4" opacity=".4"/>` +
  `<path d="M170 96 l10 8 l10 -8 l10 8" stroke="${TEAL}" stroke-width="2"/>` + L(80, 128, 40, 160, 'Cuff ABOVE the operative site', 'start') + L(185, 104, 190, 150, 'Bloodless field', 'start') +
  N(130, 186, 'elevate / wrap the limb first, then inflate · record the inflation time');

out['safety-checklist'] = [['SIGN IN', 'before anesthesia', 'identity · site · consent · allergies', LTEAL], ['TIME OUT', 'before the incision', 'whole team pauses · re-confirm · introduce roles', '#FBE3C8'], ['SIGN OUT', 'before leaving the room', 'procedure · counts · specimens · problems', LBLUE]]
  .map(([n, w, s, c], i) => { const y = 10 + i * 58; return `<rect x="6" y="${y}" width="248" height="50" rx="10" fill="${c}"/>` + `<circle cx="28" cy="${y + 25}" r="14" fill="#fff" stroke="${NAVY}"/>` + T(28, y + 29, String(i + 1), { size: 11, c: TEAL }) + T(52, y + 20, n, { size: 10, a: 'start' }) + N(140, y + 20, w, 'start', 8) + N(52, y + 37, s, 'start', 7.5); }).join('') +
  N(130, 190, 'read aloud by the team');

out['laparoscopy'] = `<path d="M10 150 Q130 10 250 150Z" fill="#F7EDE6" stroke="${MID}" stroke-width="2"/><path d="M10 150 H250" stroke="${MID}" stroke-width="2"/>` +
  `<path d="M40 150 Q130 90 220 150" fill="#EED7C6" stroke="none"/>` + [[80, 56], [130, 38], [180, 56]].map(([x, y]) => `<rect x="${x - 5}" y="${y - 20}" width="10" height="26" rx="2" fill="${GREY}" stroke="${NAVY}"/>`).join('') +
  `<path d="M130 38 L130 100" stroke="${NAVY}" stroke-width="4"/><circle cx="130" cy="102" r="4" fill="${YEL}"/><path d="M80 56 L112 112 M180 56 L150 112" stroke="${NAVY}" stroke-width="3"/>` +
  T(130, 76, 'CO₂', { size: 10, c: BLUE }) + L(135, 20, 160, 10, 'Camera (laparoscope)', 'start') + L(75, 40, 10, 22, 'Trocar', 'start') + L(150, 108, 210, 128, 'Long instruments', 'start') +
  N(130, 172, 'CO₂ lifts the abdominal wall to make space') + N(130, 184, 'small cuts → less pain, shorter stay, smaller scars');

out['anesthesia-types'] = [['General', 'unconscious · breathing tube', PURP], ['Regional', 'spinal / epidural · awake', TEAL], ['Local', 'small area · minor procedure', YEL]]
  .map(([n, s, c], i) => `<rect x="${6 + i * 84}" y="8" width="80" height="40" rx="8" fill="${c}" opacity=".25"/>` + T(46 + i * 84, 24, n, { size: 9 }) + N(46 + i * 84, 38, s, 'middle', 6.3)).join('') +
  `<rect x="40" y="64" width="180" height="22" rx="4" fill="${GREY}" stroke="${MID}"/>` + T(130, 79, 'vertebra', { size: 7.5, w: 400 }) + `<rect x="40" y="90" width="180" height="14" fill="#FBE3C8"/><rect x="40" y="104" width="180" height="4" fill="${NAVY}"/><rect x="40" y="108" width="180" height="26" fill="${LBLUE}"/><rect x="40" y="134" width="180" height="16" fill="#D9CFE8"/>` +
  `<path d="M90 50 L90 96" stroke="${NAVY}" stroke-width="2.5"/><path d="M170 50 L170 120" stroke="${NAVY}" stroke-width="2.5"/><circle cx="90" cy="97" r="3" fill="${TEAL}"/><circle cx="170" cy="121" r="3" fill="${TEAL}"/>` +
  L(40, 97, 8, 168, 'Epidural space (outside dura)', 'start') + L(220, 106, 252, 182, 'Dura', 'end') + L(150, 121, 252, 158, 'CSF: spinal goes here', 'end') + T(90, 60, 'epidural', { size: 7, a: 'end', w: 400 }) + T(174, 60, 'spinal', { size: 7, a: 'start', w: 400 });

out['wound-classes'] = [['I', 'Clean', 'no GI / respiratory tract entered', LTEAL], ['II', 'Clean-contaminated', 'tract entered, no real spillage', '#FBE3C8'], ['III', 'Contaminated', 'spillage or acute inflammation', '#F6C8A0'], ['IV', 'Dirty / infected', 'pus or established infection', LRED]]
  .map(([r, n, s, c], i) => { const y = 10 + i * 38; return `<rect x="6" y="${y}" width="200" height="32" rx="7" fill="${c}"/>` + T(22, y + 21, r, { size: 12, c: TEAL }) + T(42, y + 15, n, { size: 9, a: 'start' }) + N(42, y + 26, s, 'start', 7); }).join('') +
  arrow('M232 18 V160', 'r', 4) + T(232, 176, 'infection', { size: 7.5, c: RED }) + T(232, 186, 'risk', { size: 7.5, c: RED });

out['wound-healing'] = [['Inflammatory', 'first days', 'clot stops bleeding · cells clean · mild redness normal', LRED], ['Proliferative', 'several weeks', 'new tissue · new vessels · fill the wound', '#FBE3C8'], ['Maturation', 'months', 'scar gets stronger · and flatter', LTEAL]]
  .map(([n, t, s, c], i) => { const x = 6 + i * 84; return `<rect x="${x}" y="40" width="80" height="54" rx="8" fill="${c}"/>` + T(x + 40, 60, n, { size: 9 }) + N(x + 40, 74, t, 'middle', 7.5) + (i < 2 ? arrow(`M${x + 80} 67 H${x + 86}`, 'n', 2) : '') +
    s.split(' · ').map((line, j) => N(x + 40, 112 + j * 11, line, 'middle', 6.5)).join(''); }).join('') + T(130, 22, 'Surgical wound healing', { size: 9.5 }) + N(130, 180, 'redness that spreads, pus or fever after day 3 = suspect infection');

out['fire-triad'] = `<path d="M130 32 L206 142 H54Z" fill="#FFF4E8" stroke="${RED}" stroke-width="2.5"/>` +
  `<path d="M130 120 Q110 104 117 80 Q124 94 130 82 Q133 98 142 90 Q148 106 130 120Z" fill="${RED}"/>` +
  T(130, 22, 'Oxidizer — O₂', { size: 9.5 }) + N(130, 10, 'lowest O₂ needed (head & neck)', 'middle', 7) +
  T(30, 160, 'Ignition', { size: 9.5, a: 'start' }) + N(30, 172, 'diathermy · laser', 'start') + T(230, 160, 'Fuel', { size: 9.5, a: 'end' }) + N(230, 172, 'alcohol prep · gauze · hair', 'end') +
  T(130, 136, 'keep the three apart', { size: 7.5, c: RED }) + N(130, 190, 'let alcohol antiseptic DRY before draping');

out['radiation'] = [['TIME', 'shortest fluoroscopy time', `<circle cx="0" cy="0" r="22" fill="#fff" stroke="${NAVY}" stroke-width="2"/><path d="M0 0 V-14 M0 0 L10 6" stroke="${NAVY}" stroke-width="2"/>`],
  ['DISTANCE', 'step back — dose falls fast', `<path d="M-26 0 H26" stroke="${NAVY}" stroke-width="2" marker-end="url(#an)" marker-start="url(#an)"/><circle cx="-30" cy="0" r="6" fill="${YEL}"/>`],
  ['SHIELDING', 'lead apron + thyroid shield', `<path d="M-16 -22 H16 L18 22 H-18Z" fill="#6F7F8C" stroke="${NAVY}" stroke-width="1.5"/><rect x="-8" y="-30" width="16" height="7" rx="3" fill="#6F7F8C"/>`]]
  .map(([n, s, g], i) => { const x = 44 + i * 86; return `<g transform="translate(${x} 70)">${g}</g>` + T(x, 120, n, { size: 10, c: TEAL }) + N(x, 134, s, 'middle', 7); }).join('') + T(130, 20, 'C-arm radiation safety', { size: 9.5 }) + N(130, 172, 'pregnant staff should not stand near the C-arm');

out['ipc'] = `<path d="M90 20 Q70 90 86 170 H130 Q144 90 128 20Z" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>` +
  [[150, 130, '1'], [118, 100, '2'], [96, 70, '3']].map(([y, x, n], i) => `<rect x="76" y="${y - 22}" width="${62 - i * 4}" height="${30}" rx="10" fill="${LBLUE}" stroke="${BLUE}" stroke-width="1.5" opacity=".9"/>` + T(160, y - 4, `${n} ${['ankle', 'calf', 'thigh'][i]}`, { size: 8.5, a: 'start' })).join('') +
  arrow('M64 160 V40', 'b', 3) + T(40, 100, 'venous', { size: 8, a: 'end', c: BLUE }) + T(40, 110, 'return', { size: 8, a: 'end', c: BLUE }) +
  N(196, 170, 'inflate & deflate in turn') + N(196, 182, 'on before induction, off when mobile');

writeAll('or', out);
