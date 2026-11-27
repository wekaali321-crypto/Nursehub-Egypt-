// Builds public/travel-extra/ from the authored chunks in scripts/travel-extra/*.json.
// Each chunk: [{ id, category_id, question_en, question_ar, choices:[{letter,text}], choices_ar, correct_letter,
// rationale_en, rationale_ar }]. Output: <category_id>.json per category, counts.json, lite.json (global search).
// Static so the questions cost no Supabase egress; travelQuestionsApi merges them with the table rows.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';

const SRC = 'scripts/travel-extra';
const OUT = 'public/travel-extra';
const cats = new Set(JSON.parse(readFileSync('public/data/travel_categories.json', 'utf8')).filter((c) => c.type !== 'review').map((c) => c.id));
const tableIds = new Set(JSON.parse(readFileSync('public/data/travel_questions.json', 'utf8')).map((q) => q.id));

const errors = [];
const byCat = {};
const seen = new Set();
const seenStem = new Map();
for (const f of readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
  for (const q of JSON.parse(readFileSync(`${SRC}/${f}`, 'utf8'))) {
    const where = `${f}:${q.id}`;
    if (seen.has(q.id) || tableIds.has(q.id)) errors.push(`${where} duplicate id`);
    seen.add(q.id);
    if (!cats.has(q.category_id)) errors.push(`${where} unknown category ${q.category_id}`);
    for (const k of ['question_en', 'question_ar', 'rationale_en', 'rationale_ar']) if (!q[k] || String(q[k]).trim().length < 8) errors.push(`${where} missing ${k}`);
    const n = q.choices?.length ?? 0;
    if (n < 2 || n > 5) errors.push(`${where} needs 2-5 choices`);
    if (q.choices_ar?.length !== n) errors.push(`${where} choices_ar length`);
    const letters = (q.choices ?? []).map((c) => c.letter);
    if (!letters.includes(q.correct_letter)) errors.push(`${where} correct_letter ${q.correct_letter} not in choices`);
    if (/[؀-ۿ]/.test(q.question_en + q.rationale_en)) errors.push(`${where} Arabic inside English field`);
    const stem = q.question_en.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const key = stem + '|' + (q.choices ?? []).map((c) => c.text.toLowerCase()).sort().join('|');
    if (seenStem.has(key)) errors.push(`${where} same question as ${seenStem.get(key)}`);
    seenStem.set(key, q.id);
    (byCat[q.category_id] ??= []).push(q);
  }
}
if (errors.length) {
  console.error(errors.slice(0, 40).join('\n'));
  console.error(`${errors.length} error(s)`);
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const counts = {};
const lite = [];
let total = 0;
for (const [cat, list] of Object.entries(byCat)) {
  list.forEach((q, i) => (q.order_num = 100000 + i));
  writeFileSync(`${OUT}/${cat}.json`, JSON.stringify(list));
  counts[cat] = list.length;
  total += list.length;
  for (const q of list) lite.push({ id: q.id, category_id: q.category_id, question_en: q.question_en, question_ar: q.question_ar });
}
writeFileSync(`${OUT}/counts.json`, JSON.stringify(counts));
writeFileSync(`${OUT}/lite.json`, JSON.stringify(lite));
console.log(`${total} extra travel questions in ${Object.keys(counts).length} categories`, counts);
