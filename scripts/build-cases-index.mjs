// Builds public/clinical-cases/index.json from public/clinical-cases/cases/*.json
// Usage: node scripts/build-cases-index.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'public/clinical-cases/cases';
const out = 'public/clinical-cases/index.json';
const problems = [];
const cases = [];
for (const f of readdirSync(dir).filter((x) => /^case-\d{3}\.json$/.test(x)).sort()) {
  let c;
  try {
    c = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  } catch (e) {
    problems.push(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  for (const k of ['id', 'num', 'specialty', 'title', 'teaser', 'story', 'questions', 'diagnosis', 'answer']) {
    if (c[k] === undefined || c[k] === null || c[k] === '') problems.push(`${f}: missing ${k}`);
  }
  const html = JSON.stringify([c.story, c.exam, c.investigations, c.answer]);
  for (const m of html.matchAll(/\/clinical-cases\/img\/[^"'\\\s)<>]+/g)) {
    if (!existsSync(join('public', m[0]))) problems.push(`${f}: missing image ${m[0]}`);
  }
  if (c.cover && !existsSync(join('public', c.cover))) problems.push(`${f}: missing cover ${c.cover}`);
  cases.push({
    id: c.id,
    num: c.num,
    specialty: c.specialty,
    icon: c.icon,
    difficulty: c.difficulty,
    title: c.title,
    teaser: c.teaser,
    chips: c.chips,
    cover: c.cover,
  });
}
const guides = [];
const gdir = 'public/clinical-cases/extra';
if (existsSync(gdir)) {
  for (const f of readdirSync(gdir).filter((x) => x.endsWith('.json') && x !== 'index.json').sort()) {
    try {
      const g = JSON.parse(readFileSync(join(gdir, f), 'utf8'));
      if (g.id && g.title && g.html) guides.push({ id: g.id, title: g.title, teaser: g.teaser });
      else problems.push(`extra/${f}: needs id, title, html`);
    } catch (e) {
      problems.push(`extra/${f}: invalid JSON (${e.message})`);
    }
  }
}
writeFileSync(out, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), count: cases.length, cases, guides }, null, 0));
console.log(`index.json: ${cases.length} cases`);
if (problems.length) console.log('PROBLEMS:\n' + problems.join('\n'));
