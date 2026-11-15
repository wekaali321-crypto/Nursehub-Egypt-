// Section diagrams for ER Reception → public/cards/art/er-*.svg (content follows the section texts).
// Re-run: node scripts/build-er-art.mjs
import { C, T, N, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, RED, BLUE, YEL, LTEAL, LRED, LBLUE, MID } = C;
const out = {};

// ESI triage: five stacked bars, widest = least urgent
out['triage-levels'] = (() => {
  const lv = [['I', 'Resuscitation', 'seen immediately', RED, ['cardiac arrest · shock', 'unconscious · eclampsia']], ['II', 'Emergent', 'within minutes', '#E07B39', ['head injury · overdose', 'chest pain · GI bleed']],
    ['III', 'Urgent', 'can wait a little', YEL, ['moderate asthma', 'GI bleed, stable vitals']], ['IV', 'Less urgent', 'can wait', '#4CAF50', ['minor trauma', 'earache']], ['V', 'Non-urgent', 'can wait longest', BLUE, ['sore throat', 'minor symptoms']]];
  return lv.map(([n, name, wait, c, ex], i) => {
    const y = 4 + i * 34, w = 96 + i * 13, x = 0;
    return `<rect x="${x}" y="${y}" width="${w}" height="28" rx="5" fill="${c}"/>` + T(x + 12, y + 18, n, { size: 10.5, c: '#fff' }) + T(x + 24 + (w - 24) / 2, y + 13, name, { size: 8.5, c: '#fff' }) +
      T(x + 24 + (w - 24) / 2, y + 23, wait, { size: 7, w: 400, c: '#fff' }) + N(164, y + 12, ex[0], 'start', 7.2) + N(164, y + 22, ex[1], 'start', 7.2);
  }).join('') + T(0, 186, 'ESI: sort by severity, not by arrival time', { size: 8, a: 'start', c: TEAL });
})();

// skin-suture techniques: cross-section of a wound edge pair with each stitch pattern from above
out['suture-techniques'] = (() => {
  const panel = (x, y, title, sub, body) => `<rect x="${x}" y="${y}" width="124" height="86" rx="6" fill="#fff" stroke="${MID}"/>` +
    `<path d="M${x + 62} ${y + 18} V${y + 62}" stroke="${RED}" stroke-width="1.6" stroke-dasharray="3 2"/>` + body + T(x + 62, y + 74, title, { size: 8.5 }) + N(x + 62, y + 83, sub, 'middle', 6.8);
  const thread = TEAL;
  const interrupted = (x, y) => [24, 38, 52].map(d => `<path d="M${x + 44} ${y + d} H${x + 80}" stroke="${thread}" stroke-width="2"/><circle cx="${x + 80}" cy="${y + d}" r="2" fill="${NAVY}"/>`).join('');
  const continuous = (x, y) => `<path d="M${x + 44} ${y + 20} L${x + 80} ${y + 28} L${x + 44} ${y + 36} L${x + 80} ${y + 44} L${x + 44} ${y + 52} L${x + 80} ${y + 60}" stroke="${thread}" stroke-width="2"/>`;
  const mattress = (x, y) => [26, 48].map(d => `<path d="M${x + 36} ${y + d} H${x + 88} M${x + 46} ${y + d + 6} H${x + 78}" stroke="${thread}" stroke-width="2"/><path d="M${x + 36} ${y + d} Q${x + 30} ${y + d + 3} ${x + 46} ${y + d + 6}" stroke="${thread}" stroke-width="1.4"/><circle cx="${x + 78}" cy="${y + d + 6}" r="2" fill="${NAVY}"/>`).join('');
  const subcut = (x, y) => `<path d="M${x + 30} ${y + 20} H${x + 94}" stroke="${MID}" stroke-width="1"/>` + `<path d="M${x + 50} ${y + 22} Q${x + 62} ${y + 30} ${x + 74} ${y + 30} Q${x + 62} ${y + 38} ${x + 50} ${y + 40} Q${x + 62} ${y + 48} ${x + 74} ${y + 50} Q${x + 62} ${y + 58} ${x + 54} ${y + 60}" stroke="${thread}" stroke-width="2" stroke-dasharray="4 2"/>`;
  return panel(4, 4, 'Simple interrupted', 'most used · each stitch tied alone', interrupted(4, 4)) + panel(136, 4, 'Simple continuous', 'one thread · rarely used for skin', continuous(136, 4)) +
    panel(4, 98, 'Mattress', 'high-tension wounds', mattress(4, 98)) + panel(136, 98, 'Subcuticular', 'under the skin · best cosmetic', subcut(136, 98));
})();

// fluid compartments: where each fluid ends up
out['fluid-compartments'] = (() => {
  const comp = (x, w, label, sub, fill) => `<rect x="${x}" y="22" width="${w}" height="92" rx="6" fill="${fill}" stroke="${NAVY}" stroke-width="1.3"/>` + T(x + w / 2, 40, label, { size: 8.5 }) + N(x + w / 2, 51, sub, 'middle', 7);
  const drop = (x, y, c) => `<path d="M${x} ${y} q-6 9 0 13 q6 -4 0 -13Z" fill="${c}"/>`;
  return T(130, 12, 'Where does the fluid stay?', { size: 9.5 }) +
    comp(4, 64, 'Vessels', 'intravascular', LRED) + comp(74, 78, 'Interstitial', 'between cells', LBLUE) + comp(158, 98, 'Inside cells', 'intracellular', LTEAL) +
    drop(28, 70, RED) + drop(40, 70, RED) + T(36, 100, 'COLLOIDS', { size: 7.5, c: RED }) + N(36, 109, 'stay longer', 'middle', 6.5) +
    drop(104, 70, BLUE) + drop(118, 70, BLUE) + T(112, 100, 'NS · Ringer', { size: 7.5, c: BLUE }) + N(112, 109, 'spread out fast', 'middle', 6.5) +
    drop(200, 70, TEAL) + drop(214, 70, TEAL) + T(207, 100, 'Dextrose 5%', { size: 7.5, c: TEAL }) + N(207, 109, 'sugar used → free water', 'middle', 6.5) +
    T(4, 136, 'Shock / bleeding:', { size: 8, a: 'start', c: RED }) + N(84, 136, 'colloids raise blood volume fast', 'start', 7.5) +
    T(4, 152, 'Crystalloids:', { size: 8, a: 'start', c: BLUE }) + N(84, 152, 'short effect — they leave the vessels', 'start', 7.5) +
    N(130, 176, 'colloids raise volume but do NOT replace red cells or clotting factors', 'middle', 7);
})();

writeAll('er', out);
