// Section diagrams for Pharmacology → public/cards/art/pharm-*.svg (content follows the section texts).
// Re-run: node scripts/build-pharm-art.mjs
import { C, T, N, arrow, box, writeAll } from './art-kit.mjs';
const { NAVY, TEAL, RED, BLUE, YEL, LTEAL, LRED, LBLUE, MID, PURP, GREY, FAT } = C;
const out = {};

// ADME: drug journey through the body
out['adme'] = (() => {
  const step = (x, letter, name, sub, fill) => `<circle cx="${x}" cy="54" r="22" fill="${fill}" stroke="${NAVY}" stroke-width="1.4"/>` + T(x, 60, letter, { size: 17 }) + T(x, 92, name, { size: 8.5 }) + sub.map((s, i) => N(x, 103 + i * 9, s, 'middle', 6.8)).join('');
  return step(26, 'A', 'Absorption', ['site → blood', 'IV = 100%'], LTEAL) + arrow('M50 54 H70', 'n', 1.6) +
    step(96, 'D', 'Distribution', ['blood → tissues', 'free or bound'], LBLUE) + arrow('M120 54 H140', 'n', 1.6) +
    step(166, 'M', 'Metabolism', ['mainly liver', 'first-pass (oral)'], FAT) + arrow('M190 54 H210', 'n', 1.6) +
    step(236, 'E', 'Excretion', ['mainly kidney', 'urine'], LRED) +
    `<rect x="4" y="136" width="256" height="40" rx="6" fill="${GREY}"/>` + T(132, 152, 'Pharmacokinetics = what the BODY does to the drug', { size: 8.5, c: TEAL }) +
    T(132, 168, 'Pharmacodynamics = what the DRUG does to the body', { size: 8.5, c: PURP });
})();

// therapeutic index: two dose-response curves and the gap between them
out['therapeutic-index'] = (() => {
  const sig = (x0, c) => { let d = ''; for (let i = 0; i <= 40; i++) { const x = x0 - 50 + i * 2.5, y = 140 - 110 / (1 + Math.exp(-(x - x0) / 9)); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return `<path d="${d}" stroke="${c}" stroke-width="2.4"/>`; };
  return `<path d="M20 20 V140 H250" stroke="${NAVY}" stroke-width="1.3"/>` + N(14, 84, '% of', 'end', 7) + N(14, 93, 'patients', 'end', 7) + N(250, 152, 'dose →', 'end', 7.5) +
    `<path d="M20 85 H200" stroke="${MID}" stroke-dasharray="3 3"/>` + N(24, 81, '50%', 'start', 7) +
    sig(78, TEAL) + sig(176, RED) + `<path d="M78 85 V140 M176 85 V140" stroke="${NAVY}" stroke-dasharray="2 2"/>` +
    T(78, 152, 'ED50', { size: 8.5, c: TEAL }) + T(176, 152, 'LD50', { size: 8.5, c: RED }) + N(62, 34, 'effect', 'middle', 7.5) + N(206, 34, 'death', 'middle', 7.5) +
    arrow('M86 118 H168', 'y', 1.6) + T(127, 112, 'safety margin', { size: 7.5, c: '#B8860B' }) +
    `<rect x="40" y="162" width="184" height="24" rx="5" fill="${LTEAL}"/>` + T(132, 178, 'TI = LD50 ÷ ED50 · bigger = safer · digoxin: narrow', { size: 8 });
})();

// adrenergic receptors map
out['adrenergic-receptors'] = (() => {
  const row = (y, name, c, effects) => `<rect x="4" y="${y}" width="40" height="30" rx="6" fill="${c}"/>` + T(24, y + 19, name, { size: 11, c: '#fff' }) + effects.map((e, i) => N(52, y + 11 + i * 10, e, 'start', 7.6)).join('');
  return row(4, 'α1', RED, ['vasoconstriction → BP ↑', 'pupil dilates · urinary sphincter contracts']) +
    row(40, 'α2', '#E07B39', ['brakes NE release (feedback)', '→ sympathetic tone & BP ↓']) +
    row(76, 'β1', BLUE, ['HEART: rate ↑ + force ↑', 'kidney: renin ↑']) +
    row(112, 'β2', TEAL, ['LUNGS: bronchodilation', 'uterus relaxes · insulin ↑']) +
    row(148, 'β3', PURP, ['fat breakdown (lipolysis)', 'bladder relaxes']) +
    `<rect x="196" y="70" width="64" height="48" rx="8" fill="${GREY}"/>` + T(228, 86, 'β1 = 1 heart', { size: 8 }) + T(228, 100, 'β2 = 2 lungs', { size: 8 }) + N(228, 112, 'memory trick', 'middle', 6.8);
})();

// cholinergic receptors
out['cholinergic-receptors'] = (() => {
  const nerve = (y, preC, postC, nt, end, rec) => `<path d="M8 ${y} H96" stroke="${preC}" stroke-width="3"/><circle cx="102" cy="${y}" r="6" fill="${YEL}" stroke="${NAVY}"/>` +
    `<path d="M108 ${y} H190" stroke="${postC}" stroke-width="3"/>` + box(192, y - 12, 68, 24, end, { size: 7.5, fill: '#fff' }) + N(102, y - 9, 'ACh · N', 'middle', 7) + T(160, y - 6, nt, { size: 7.5, c: postC }) + N(226, y + 21, rec, 'middle', 7);
  return T(52, 14, 'ganglion', { size: 7.5, c: C.SUB }) +
    nerve(40, TEAL, TEAL, 'ACh', 'organ', 'muscarinic (M)') + T(4, 28, 'Parasympathetic', { size: 8.5, a: 'start', c: TEAL }) +
    nerve(96, RED, RED, 'NE', 'organ', 'α / β adrenergic') + T(4, 84, 'Sympathetic', { size: 8.5, a: 'start', c: RED }) +
    `<path d="M8 150 H190" stroke="${NAVY}" stroke-width="3"/>` + box(192, 138, 68, 24, 'skeletal muscle', { size: 7.5, fill: '#fff' }) + T(150, 144, 'ACh', { size: 7.5 }) + N(226, 171, 'nicotinic (N)', 'middle', 7) + T(4, 140, 'Somatic (voluntary)', { size: 8.5, a: 'start' }) +
    N(4, 186, 'ACh works at every ganglion · cholinergic receptors = muscarinic + nicotinic', 'start', 7);
})();

// diuretic sites along the nephron
out['diuretic-sites'] = (() => {
  const tube = `<path d="M30 30 Q20 30 22 44 L40 52 Q60 58 62 72 L66 150 Q70 170 82 150 L88 74 Q92 56 112 56 L140 56 Q160 56 164 76 L172 150" stroke="${MID}" stroke-width="10" fill="none"/>` +
    `<circle cx="26" cy="32" r="12" fill="${LRED}" stroke="${NAVY}"/>`;
  const tag = (x, y, lx, ly, name, sub, c) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><path d="M${x} ${y} L${lx} ${ly}" stroke="${c}" stroke-width="1"/>` + T(lx + 3, ly + 3, name, { size: 8.5, a: 'start', c }) + N(lx + 3, ly + 13, sub, 'start', 7);
  return tube + N(26, 16, 'glomerulus', 'middle', 7) + N(178, 166, 'collecting duct →', 'start', 7) +
    tag(54, 56, 8, 96, 'Osmotic', 'mannitol', PURP) +
    tag(85, 120, 96, 120, 'Loop', 'furosemide: fast, strong · K⁺ ↓', RED) +
    tag(120, 56, 120, 18, 'Thiazide', 'slow, long · K⁺ ↓ · Ca²⁺ ↑', BLUE) +
    tag(168, 108, 186, 70, 'K⁺-sparing', 'spironolactone,', TEAL) + N(189, 93, 'amiloride · K⁺ ↑', 'start', 7) +
    `<rect x="96" y="148" width="72" height="34" rx="5" fill="${LRED}"/>` + T(132, 162, 'watch K⁺', { size: 8, c: RED }) + N(132, 174, 'every diuretic', 'middle', 7);
})();

// antibiotic targets on the bacterial ribosome
out['ribosome-targets'] = (() =>
  `<ellipse cx="90" cy="64" rx="62" ry="38" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.4"/>` + T(90, 52, '50S', { size: 12 }) +
  `<ellipse cx="90" cy="118" rx="48" ry="24" fill="${LTEAL}" stroke="${NAVY}" stroke-width="1.4"/>` + T(90, 124, '30S', { size: 12 }) +
  `<path d="M14 98 Q90 92 168 98" stroke="${YEL}" stroke-width="3"/>` + N(170, 102, 'mRNA', 'start', 7) +
  T(176, 30, '50S blockers', { size: 9, a: 'start', c: BLUE }) + N(176, 42, 'Macrolides', 'start', 8) + N(176, 52, '(azithromycin…)', 'start', 7) + N(176, 63, 'Chloramphenicol', 'start', 8) +
  T(176, 128, '30S blockers', { size: 9, a: 'start', c: TEAL }) + N(176, 140, 'Aminoglycosides', 'start', 8) + N(176, 150, '(gentamicin…)', 'start', 7) + N(176, 161, 'Tetracyclines', 'start', 8) +
  arrow('M174 46 L150 58', 'b', 1.4) + arrow('M174 146 L136 124', 't', 1.4) +
  N(90, 172, 'no protein = bacteria cannot grow', 'middle', 7.5) + T(90, 186, 'penicillins act on the cell WALL instead', { size: 7.5, c: RED }))();

// parietal cell acid secretion and where each drug acts
out['acid-secretion'] = (() =>
  `<rect x="40" y="30" width="140" height="86" rx="14" fill="${LTEAL}" stroke="${NAVY}" stroke-width="1.4"/>` + T(110, 80, 'Parietal cell', { size: 9 }) +
  `<rect x="30" y="66" width="20" height="20" rx="4" fill="${BLUE}"/>` + T(40, 80, 'H2', { size: 7.5, c: '#fff' }) + N(30, 60, 'histamine', 'middle', 7) +
  `<circle cx="180" cy="76" r="12" fill="${RED}"/>` + T(180, 79, 'pump', { size: 6.5, c: '#fff' }) +
  arrow('M194 76 H220', 'r', 1.8) + T(232, 80, 'H⁺', { size: 11, c: RED }) + N(232, 92, 'stomach acid', 'middle', 7) +
  `<path d="M40 88 L40 122" stroke="${BLUE}" stroke-width="1"/>` + T(4, 132, 'H2 blockers', { size: 8, a: 'start', c: BLUE }) + N(4, 142, 'cimetidine, ranitidine', 'start', 7) +
  `<path d="M180 90 L180 122" stroke="${RED}" stroke-width="1"/>` + T(150, 132, 'PPIs block pump', { size: 8, a: 'start', c: RED }) + N(150, 142, 'omeprazole', 'start', 7) +
  `<rect x="4" y="156" width="256" height="28" rx="5" fill="${GREY}"/>` + T(132, 174, 'Antacids neutralise acid · Sucralfate coats & protects mucosa', { size: 7.8 }))();

// agonist vs antagonist: lock-and-key
out['agonist-antagonist'] = (() => {
  const receptor = (x) => `<path d="M${x} 110 V70 H${x + 18} V86 H${x + 38} V70 H${x + 56} V110Z" fill="${LBLUE}" stroke="${NAVY}" stroke-width="1.4"/>` + N(x + 28, 124, 'receptor', 'middle', 7);
  return receptor(20) + `<path d="M50 44 H76 V84 H58 V68 H50Z" fill="${TEAL}" stroke="${NAVY}"/>` + `<rect x="45" y="84" width="10" height="2"/>` +
    T(48, 22, 'AGONIST', { size: 10, c: TEAL }) + N(48, 34, 'fits + switches ON', 'middle', 7.5) + T(48, 146, '“A-GO”', { size: 11, c: TEAL }) + N(48, 160, 'stimulates action', 'middle', 7.5) +
    receptor(166) + `<path d="M180 52 H220 V68 H204 V86 H184 V68 H180Z" fill="${RED}" stroke="${NAVY}"/>` + `<path d="M180 52 L220 68 M220 52 L180 68" stroke="#fff" stroke-width="2"/>` +
    T(194, 22, 'ANTAGONIST', { size: 10, c: RED }) + N(194, 34, 'sits in the site, does nothing', 'middle', 7.5) + T(194, 146, '“ANTI · NO GO”', { size: 11, c: RED }) + N(194, 160, 'blocks the agonist', 'middle', 7.5) +
    `<path d="M120 30 V170" stroke="${MID}" stroke-dasharray="3 3"/>`;
})();

writeAll('pharm', out);
