// Builds public/careplans/index.json from public/careplans/plans/*.json and checks every plan:
// each text has Arabic + English, the student plan keeps the order Assessment → Diagnosis → Goals → Interventions (+ Rationale) → Evaluation,
// and the hospital plan has diagnosis / need / actions / outcome / timeframe on every row.
// Run: node scripts/build-careplans-index.mjs   (also run by `npm run build`)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'public/careplans';
const errors = [];
const bi = (v, where) => { if (!v?.ar?.trim() || !v?.en?.trim()) errors.push(`${where}: missing Arabic or English`); };
const biList = (v, where) => {
  if (!Array.isArray(v?.ar) || !Array.isArray(v?.en) || !v.ar.length) return errors.push(`${where}: empty list`);
  if (v.ar.length !== v.en.length) errors.push(`${where}: ${v.ar.length} Arabic vs ${v.en.length} English items`);
};
const SAFE = /^[a-z0-9-]+$/;

const plans = readdirSync(join(DIR, 'plans')).filter((f) => f.endsWith('.json')).sort().map((f) => {
  const p = JSON.parse(readFileSync(join(DIR, 'plans', f), 'utf8'));
  const w = p.id || f;
  if (`${p.id}.json` !== f || !SAFE.test(p.id)) errors.push(`${f}: id must match the file name (a-z, 0-9, -)`);
  bi(p.title, `${w} title`); bi(p.summary, `${w} summary`);
  if (!p.student?.length) errors.push(`${w}: no student diagnoses`);
  (p.student || []).forEach((d, i) => {
    const k = `${w} student[${i}]`;
    bi(d.diagnosis, `${k} diagnosis`);
    biList(d.assessment?.subjective, `${k} subjective`); biList(d.assessment?.objective, `${k} objective`);
    biList(d.goals, `${k} goals`); biList(d.evaluation, `${k} evaluation`);
    if (!d.interventions?.length) errors.push(`${k}: no interventions`);
    (d.interventions || []).forEach((x, j) => { bi(x.action, `${k} intervention ${j}`); bi(x.rationale, `${k} rationale ${j}`); });
  });
  if (!p.hospital?.length) errors.push(`${w}: no hospital rows`);
  (p.hospital || []).forEach((r, i) => {
    const k = `${w} hospital[${i}]`;
    bi(r.diagnosis, `${k} diagnosis`); bi(r.need, `${k} need`); biList(r.actions, `${k} actions`); bi(r.outcome, `${k} outcome`); bi(r.timeframe, `${k} timeframe`);
  });
  return { id: p.id, icon: p.icon, system: p.system, title: p.title, summary: p.summary, diagnoses: p.student?.length || 0, rows: p.hospital?.length || 0 };
});

const ORDER = ['cardiology', 'respiratory', 'neurology', 'endocrine', 'gastro', 'renal', 'hematology', 'surgery', 'orthopedics', 'obstetrics', 'womens-health', 'pediatrics', 'integumentary', 'infection', 'general'];
const rank = (s) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
plans.sort((a, b) => rank(a.system) - rank(b.system) || a.title.en.localeCompare(b.title.en));

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
writeFileSync(join(DIR, 'index.json'), JSON.stringify({ plans }, null, 1) + '\n');
console.log(`${plans.length} care plans indexed`);
