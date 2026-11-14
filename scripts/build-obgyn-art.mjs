// Section diagrams for the OB/GYN section → public/cards/art/ob-*.svg (content follows the section texts).
// Re-run: node scripts/build-obgyn-art.mjs
import { C, T, N, L, arrow, box, dot, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, GREY, MID, RED, BLUE, YEL, LTEAL, LRED, LBLUE, PURP } = C;
const out = {};
const SKIN = '#F4E3D7';
// pregnant abdomen (front), 260x190 grid
const BELLY = `<path d="M70 10 Q130 0 190 10 L200 70 Q230 120 196 170 L64 170 Q30 120 60 70Z" fill="${SKIN}" stroke="${MID}" stroke-width="2"/>`;

out['fundal-height'] = BELLY + [[160, 'Pubic bone', '12 wk'], [112, 'Umbilicus', '20–22 wk'], [36, 'Xiphoid', '36 wk']].map(([y, n, w]) => `<path d="M60 ${y} H200" stroke="${MID}" stroke-width="1" stroke-dasharray="4 3"/>` + T(204, y + 3, n, { size: 8, a: 'start' }) + T(56, y + 3, w, { size: 8.5, a: 'end', c: TEAL })).join('') +
  `<path d="M80 150 Q130 120 180 150" stroke="${TEAL}" stroke-width="2"/><path d="M76 104 Q130 70 184 104" stroke="${TEAL}" stroke-width="2"/><path d="M72 46 Q130 14 188 46" stroke="${TEAL}" stroke-width="2.5"/>` +
  `<path d="M74 74 Q130 42 186 74" stroke="${PURP}" stroke-width="1.6" stroke-dasharray="3 3"/>` + T(130, 66, '≈ 7th month', { size: 7.5, c: PURP }) +
  T(130, 186, 'Naegele: LMP + 7 days − 3 months = EDD', { size: 8.5 });

out['leopold'] = [['1 Fundus', ['head: hard, round', 'buttocks: soft'], [[110, 36], [150, 36]]], ['2 Sides', ['back: smooth', 'limbs: small parts'], [[78, 100], [182, 100]]], ['3 Above pubis', ['presenting part', '& its descent'], [[130, 154]]], ['4 Toward pelvis', ['engagement', 'of the head'], [[104, 150], [156, 150]]]]
  .map(([n, lines, hands], i) => { const x = 4 + (i % 2) * 130, y = 6 + Math.floor(i / 2) * 94, s = 0.3;
    return `<g transform="translate(${x} ${y + 14}) scale(${s})">${BELLY}${hands.map(([hx, hy]) => `<ellipse cx="${hx}" cy="${hy}" rx="18" ry="13" fill="#E7B795" stroke="${NAVY}" stroke-width="2.5"/>`).join('')}</g>` +
      T(x + 84, y + 30, n, { size: 8.5, a: 'start' }) + lines.map((l, k) => N(x + 84, y + 44 + k * 11, l, 'start', 6.8)).join(''); }).join('');

out['fetal-heart'] = BELLY + `<path d="M130 20 V170 M64 96 H196" stroke="${MID}" stroke-width="1" stroke-dasharray="4 3"/>` +
  `<circle cx="104" cy="130" r="9" fill="${RED}" opacity=".85"/><circle cx="104" cy="62" r="9" fill="${BLUE}" opacity=".85"/>` +
  T(234, 120, 'Cephalic', { size: 9, a: 'end', c: RED }) + N(234, 132, 'lower quadrant,', 'end') + N(234, 142, 'on the back’s side', 'end') +
  T(234, 54, 'Breech', { size: 9, a: 'end', c: BLUE }) + N(234, 66, 'upper quadrant,', 'end') + N(234, 76, 'on the back’s side', 'end') + N(130, 186, 'listen where Leopold found the fetal back · normal FHR 110–160');

out['supine-hypotension'] = `<path d="M10 120 H120" stroke="${MID}" stroke-width="3"/><ellipse cx="66" cy="96" rx="44" ry="22" fill="${SKIN}" stroke="${MID}"/><ellipse cx="70" cy="80" rx="30" ry="22" fill="#F2C9C3" stroke="${RED}"/>` +
  `<path d="M30 110 H110" stroke="${BLUE}" stroke-width="6"/><path d="M56 110 H86" stroke="${RED}" stroke-width="3"/>` + T(66, 24, 'On the back', { size: 9.5, c: RED }) + N(66, 36, 'uterus presses on the IVC') + N(66, 140, '↓ venous return → ↓ BP, dizzy, pale') +
  `<path d="M140 120 H250" stroke="${MID}" stroke-width="3"/><ellipse cx="196" cy="94" rx="40" ry="26" fill="${SKIN}" stroke="${MID}"/><ellipse cx="206" cy="102" rx="26" ry="18" fill="#F2C9C3" stroke="${RED}"/><path d="M160 80 H232" stroke="${BLUE}" stroke-width="6"/>` +
  T(196, 24, 'LEFT side', { size: 9.5, c: TEAL }) + N(196, 36, 'uterus falls away from the IVC') + N(196, 140, 'blood flow back to the heart restored') + N(130, 176, '2nd–3rd trimester: rest and lie tilted to the left');

const UTERUS = (inner) => `<path d="M70 20 Q130 4 190 20 Q214 90 170 150 L150 172 H110 L90 150 Q46 90 70 20Z" fill="#FBEDEC" stroke="${RED}" stroke-width="2"/>${inner}<rect x="118" y="168" width="24" height="16" rx="4" fill="${SKIN}" stroke="${MID}"/>`;
out['placenta-previa'] = UTERUS(`<ellipse cx="130" cy="156" rx="34" ry="12" fill="#B1475E" opacity=".85"/><circle cx="130" cy="80" r="26" fill="${SKIN}" stroke="${MID}"/>`) +
  L(150, 156, 206, 138, 'Placenta over', 'start') + T(208, 152, 'the cervix', { size: 8.5, a: 'start' }) + N(208, 164, 'lower segment', 'start') +
  T(8, 30, 'PAINLESS', { size: 9.5, a: 'start', c: RED }) + N(8, 42, 'bright red bleeding', 'start') + N(8, 52, '3rd trimester', 'start') + T(8, 160, 'NO vaginal exam', { size: 8.5, a: 'start', c: RED }) + N(8, 172, 'until ultrasound', 'start');
out['abruptio'] = UTERUS(`<ellipse cx="90" cy="46" rx="30" ry="12" fill="#B1475E" opacity=".85" transform="rotate(-20 90 46)"/><path d="M74 40 Q84 62 106 54" fill="#7a1f2a" opacity=".7"/><circle cx="140" cy="100" r="26" fill="${SKIN}" stroke="${MID}"/>`) +
  L(92, 54, 30, 90, 'Hidden blood behind', 'start') + N(32, 102, 'the placenta', 'start') +
  T(252, 30, 'PAINFUL', { size: 9.5, a: 'end', c: RED }) + N(252, 42, 'rigid, board-like uterus', 'end') + N(252, 52, 'little visible bleeding', 'end') + T(252, 160, 'watch the FHR', { size: 8.5, a: 'end', c: RED }) + N(252, 172, 'risk: pre-eclampsia', 'end');

out['cervix-dilation'] = [[1, 'Latent'], [3, ''], [5, 'Active'], [7, ''], [9, 'Transition'], [10, '']]
  .map(([cm, n], i) => { const x = 22 + i * 44, r = 3 + cm * 1.8; return `<circle cx="${x}" cy="76" r="22" fill="#F7D6DA" stroke="${MID}"/><circle cx="${x}" cy="76" r="${Math.min(r, 21)}" fill="#fff" stroke="${RED}" stroke-width="1.5"/>` + T(x, 112, `${cm} cm`, { size: 9 }) + (n ? T(x + 22, 136, n, { size: 8.5, c: TEAL }) : ''); }).join('') +
  `<path d="M8 124 H252" stroke="${MID}" stroke-width="1"/>` + T(130, 24, 'Stage 1: regular contractions → full dilation (10 cm)', { size: 9 }) + N(130, 162, 'longest stage, especially in a first pregnancy') + N(130, 174, 'transition: strongest contractions, shortest rests');

out['labor-stages'] = [['1', 'Dilation', 'contractions → 10 cm', 'longest', LTEAL], ['2', 'Delivery of baby', 'pushing + contractions', '', '#FBE3C8'], ['3', 'Placenta', 'placenta & membranes out', 'shortest', LBLUE], ['4', 'Recovery', 'first 1–2 h: fundus, bleeding, vitals', '', LRED]]
  .map(([n, a, b, c, col], i) => { const y = 8 + i * 45; return `<rect x="6" y="${y}" width="248" height="38" rx="9" fill="${col}"/>` + `<circle cx="26" cy="${y + 19}" r="13" fill="#fff" stroke="${NAVY}"/>` + T(26, y + 24, n, { size: 12, c: TEAL }) + T(48, y + 16, a, { size: 9.5, a: 'start' }) + N(48, y + 29, b, 'start', 7.5) + (c ? T(248, y + 24, c, { size: 8, a: 'end', c: TEAL }) : ''); }).join('');

const curve = (y0, start, depth, w = 70) => `M10 ${y0} H${start} Q${start + w / 2} ${y0 + depth} ${start + w} ${y0} H250`;
out['fhr-decels'] = [['Early', 'mirrors the contraction', 'head compression — normal', 0, TEAL], ['Late', 'starts after the peak', 'low oxygen — act NOW', 30, RED], ['Variable', 'any time, V / U shape', 'cord compression', 0, PURP]]
  .map(([n, a, b, shift, c], i) => { const y = 34 + i * 56; return `<path d="M10 ${y + 22} H70 Q100 ${y + 2} 130 ${y + 22} H250" stroke="${MID}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
    (n === 'Variable' ? `<path d="M10 ${y} H150 L156 ${y + 24} L162 ${y} H250" stroke="${c}" stroke-width="2.5"/>` : `<path d="${curve(y, 70 + shift, 22, 60)}" stroke="${c}" stroke-width="2.5"/>`) +
    T(10, y - 10, n, { size: 9.5, a: 'start', c }) + N(70, y - 10, a, 'start') + N(250, y - 10, b, 'end'); }).join('') +
  N(130, 188, 'teal = fetal heart rate · dashed = contraction · baseline 110–160 bpm');

out['involution'] = BELLY + [[100, 'Day 1: umbilicus', ''], [124, 'Day ~5', ''], [146, 'Day ~10', ''], [164, '2 weeks: gone', '']].map(([y, d, s]) => `<circle cx="130" cy="${y}" r="5" fill="${TEAL}"/>` + T(204, y + 3, d, { size: 8, a: 'start' }) + (s ? N(204, y + 13, s, 'start', 7) : '')).join('') +
  `<path d="M130 100 V160" stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="3 3"/>` + T(56, 104, '≈ 1 cm', { size: 8.5, a: 'end', c: TEAL }) + N(56, 116, 'per day', 'end') +
  [['Rubra', '#C0392B'], ['Serosa', '#C9877A'], ['Alba', '#EADDB5']].map(([n, c], i) => `<rect x="${12 + i * 26}" y="20" width="22" height="22" rx="5" fill="${c}"/>` + N(23 + i * 26, 54, n, 'middle', 6.5)).join('') + T(12, 14, 'Lochia', { size: 8.5, a: 'start' }) +
  N(130, 188, 'boggy uterus → massage, call for help · foul lochia = infection');

out['cord-prolapse'] = `<path d="M10 160 H250" stroke="${MID}" stroke-width="3"/>` + `<circle cx="70" cy="136" r="12" fill="${SKIN}" stroke="${NAVY}"/><path d="M82 140 L130 150 L170 90 L196 150" stroke="${SKIN}" stroke-width="18"/><path d="M82 140 L130 150 L170 90 L196 150" stroke="${MID}" stroke-width="1" fill="none"/>` +
  arrow('M170 56 V84', 'r', 2.4) + T(170, 46, 'hips up', { size: 8.5, c: RED }) + T(130, 22, 'Knee-chest position', { size: 10 }) + N(130, 36, '(or Trendelenburg)') +
  N(10, 182, 'do NOT push the cord back · lift the presenting part off the cord · call for help', 'start', 7.2);

const inlet = (x, shape) => `<g transform="translate(${x} 70)">${shape}</g>`;
out['pelvis-types'] = [['Gynecoid', '≈ 50% · round — best', `<ellipse cx="0" cy="0" rx="26" ry="22" fill="${LTEAL}" stroke="${TEAL}" stroke-width="2"/>`],
  ['Android', '≈ 23% · triangular, male-like', `<path d="M0 -20 Q26 -16 22 12 L0 22 L-22 12 Q-26 -16 0 -20Z" fill="#FBE3C8" stroke="${NAVY}" stroke-width="2"/>`],
  ['Anthropoid', '≈ 24% · long front-to-back', `<ellipse cx="0" cy="0" rx="17" ry="26" fill="${LBLUE}" stroke="${BLUE}" stroke-width="2"/>`],
  ['Platypelloid', '≈ 3% · wide, shallow — hardest', `<ellipse cx="0" cy="0" rx="30" ry="13" fill="${LRED}" stroke="${RED}" stroke-width="2"/>`]]
  .map(([n, s, sh], i) => { const x = 34 + i * 64; return inlet(x, sh) + T(x, 116, n, { size: 8.5 }) + s.split(' · ').map((l, j) => N(x, 128 + j * 10, l, 'middle', 6.6)).join(''); }).join('') +
  T(130, 22, 'Pelvic inlet seen from above (Caldwell–Moloy)', { size: 9 }) + N(130, 36, 'front ↑') + N(130, 184, 'easiest → hardest for a vaginal birth: left → right');

out['fertilization'] = `<path d="M60 160 Q60 110 90 100 Q130 92 170 100 Q200 110 200 160 Q170 180 130 180 Q90 180 60 160Z" fill="#FBEDEC" stroke="${RED}" stroke-width="2"/>` +
  `<path d="M92 100 Q60 60 30 70 M168 100 Q200 60 230 70" stroke="${RED}" stroke-width="5"/><ellipse cx="22" cy="80" rx="12" ry="9" fill="#F2C9C3" stroke="${NAVY}"/><circle cx="34" cy="72" r="4" fill="${YEL}"/>` +
  `<circle cx="50" cy="66" r="4" fill="${YEL}" stroke="${NAVY}"/><path d="M58 64 l8 -3" stroke="${NAVY}" stroke-width="1.2"/>` + `<circle cx="110" cy="118" r="5" fill="${TEAL}"/>` + arrow('M58 72 Q80 90 104 114', 't', 1.6) +
  L(22, 80, 6, 120, 'Ovary', 'start') + L(50, 66, 60, 26, 'Fertilization: outer ⅓ of the tube', 'start') + L(110, 118, 150, 150, 'Implants in the upper uterus', 'start') +
  N(130, 186, '3–4 days through the tube · implants 6–10 days after fertilization');

writeAll('ob', out);
