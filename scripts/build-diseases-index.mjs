// Builds public/diseases/index.json from public/diseases/items/dis-NNN.json
// Usage: node scripts/build-diseases-index.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'public/diseases/items';
const out = 'public/diseases/index.json';
mkdirSync(dir, { recursive: true });
const problems = [];
const items = [];
for (const f of readdirSync(dir).filter((x) => /^dis-\d{3}\.json$/.test(x)).sort()) {
  let c;
  try {
    c = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  } catch (e) {
    problems.push(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  for (const k of ['id', 'num', 'system', 'title', 'teaser', 'sections']) if (!c[k]) problems.push(`${f}: missing ${k}`);
  for (const k of ['overview', 'signs', 'treatment', 'nursing', 'redflags']) if (!c.sections?.[k]?.ar) problems.push(`${f}: missing section ${k}`);
  if (!c.quiz?.length) problems.push(`${f}: no quiz`);
  const html = JSON.stringify(c.sections);
  for (const m of html.matchAll(/\/diseases\/img\/[^"'\\\s)<>\]]+/g)) if (!existsSync(join('public', m[0]))) problems.push(`${f}: missing image ${m[0]}`);
  items.push({ id: c.id, num: c.num, system: c.system, icon: c.icon, title: c.title, teaser: c.teaser, chips: c.chips, level: c.level });
}
writeFileSync(out, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), count: items.length, items }));
console.log(`index.json: ${items.length} diseases`);
if (problems.length) console.log('PROBLEMS:\n' + problems.join('\n'));
