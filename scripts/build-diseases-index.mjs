// Builds public/diseases/index.json (+ rx.json) from public/diseases/items/dis-NNN.json
// Usage: node scripts/build-diseases-index.mjs
// Guides carry an optional `target`: "diseases" (default), an existing site section
// (er-reception, obgyn, pediatrics, operating-room, pharmacology, fundamentals, first-aid, prescriptions …)
// or "new:<slug>|<اسم القسم>" which creates a new section (listed under `sections` in the index).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'public/diseases/items';
mkdirSync(dir, { recursive: true });
const problems = [];
const items = [];
const sections = {};
const rx = [];
const RX_CAT = {
  'نساء': 'النساء والتناسلية',
  'عيون': 'العين',
  'أنف وأذن وحنجرة': 'الأنف والأذن والحنجرة',
  'أعصاب': 'الأعصاب والنفسية',
  'أخرى': 'عام ومكمّلات',
  'أطفال': 'عام ومكمّلات',
};
for (const f of readdirSync(dir).filter((x) => /^dis-\d{3,4}\.json$/.test(x)).sort()) {
  let c;
  try {
    c = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  } catch (e) {
    problems.push(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  let target = c.target || 'diseases';
  const m = /^new:([a-z0-9-]+)\|(.+)$/.exec(target);
  if (m) {
    target = m[1];
    sections[target] = { ar: m[2].trim() };
  }
  const listed = !(target === 'prescriptions' && !c.sections?.overview);
  for (const k of ['id', 'num', 'system', 'title', 'teaser', 'sections']) if (listed && !c[k]) problems.push(`${f}: missing ${k}`);
  for (const k of ['overview', 'signs', 'treatment', 'nursing', 'redflags']) if (listed && !c.sections?.[k]?.ar) problems.push(`${f}: missing section ${k}`);
  if (listed && !c.quiz?.length) problems.push(`${f}: no quiz`);
  const html = JSON.stringify(c.sections);
  for (const mm of html.matchAll(/\/diseases\/img\/[^"'\\\s)<>\]]+/g)) if (!existsSync(join('public', mm[0]))) problems.push(`${f}: missing image ${mm[0]}`);
  if (listed) items.push({ id: c.id, num: c.num, system: c.system, icon: c.icon, title: c.title, teaser: c.teaser, chips: c.chips, level: c.level, target });
  (c.rx || []).forEach((r, i) => {
    if (!r.items?.length || !r.condition_ar) return;
    rx.push({
      id: `hb-${c.id.slice(4)}-${i + 1}`,
      order_num: 100000 + rx.length,
      category: RX_CAT[r.category] || r.category || 'عام ومكمّلات',
      condition_ar: r.condition_ar,
      condition_en: r.condition_en || null,
      doctor_name: null,
      items: r.items.map((x) => ({ drug_name: x.drug_name, dose: x.dose, note: x.note })),
      clinical_note: r.clinical_note || null,
      items_en: r.items_en?.length === r.items.length ? r.items_en.map((x) => ({ drug_name: x.drug_name, dose: x.dose, note: x.note })) : null,
      clinical_note_en: r.clinical_note_en || null,
      guide: c.id,
    });
  });
}
writeFileSync('public/diseases/index.json', JSON.stringify({ updated: new Date().toISOString().slice(0, 10), count: items.length, sections, items }));
writeFileSync('public/diseases/rx.json', JSON.stringify({ count: rx.length, rx }));
const counts = {};
items.forEach((i) => (counts[i.target] = (counts[i.target] || 0) + 1));
console.log(`index.json: ${items.length} guides`, counts, `| rx.json: ${rx.length} prescriptions`);
if (problems.length) console.log('PROBLEMS:\n' + problems.join('\n'));
