// Builds public/careplans/index.json from public/careplans/plans/*.json and checks every plan.
//  - format 2 (diagnoses[]): every diagnosis has Arabic + English for title, definition, related to, evidenced by / risk factors,
//    subjective + objective data, short + long goals, typed interventions each with a rationale (Arabic action = full sentence
//    starting with يتم / تتم / يُـ), evaluation with a status,
//    and hospital rows (need / actions / outcome / timeframe).
//  - format 1 (student[] + hospital[]): older plans, still accepted until they are rewritten.
// Run: node scripts/build-careplans-index.mjs   (also run by `npm run build`)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'public/careplans';
const errors = [];
const bi = (v, where) => { if (!v?.ar?.trim() || !v?.en?.trim()) errors.push(`${where}: missing Arabic or English`); };
const biList = (v, where, { allowEmpty = false } = {}) => {
  if (!Array.isArray(v?.ar) || !Array.isArray(v?.en) || (!allowEmpty && !v.ar.length)) return errors.push(`${where}: empty list`);
  if (v.ar.length !== v.en.length) errors.push(`${where}: ${v.ar.length} Arabic vs ${v.en.length} English items`);
  [...v.ar, ...v.en].forEach((x, i) => { if (!String(x).trim()) errors.push(`${where}: empty item ${i}`); });
};
const SAFE = /^[a-z0-9-]+$/;
const TYPES = ['assess', 'independent', 'collab', 'teach'];
const STATUS = ['met', 'partial', 'not'];
const FOLDERS = ['disease', 'general'];

// same rule as src/lib/carePlansApi.ts legacyTitle()
const head = (s, re) => { const t = s.split(re)[0].replace(/\s*\([^)]*\)\s*$/, '').trim(); return t.length < s.length ? t : s; };
const legacyTitle = (d) => ({ ar: head(d.ar, /\s(?:مرتبط|مرتبطة)\s/), en: head(d.en, /\s(?:related to|r\/t)\s/i) });

function checkV2(p, w) {
  if (!FOLDERS.includes(p.folder)) errors.push(`${w}: folder must be disease or general`);
  if (!p.diagnoses?.length) errors.push(`${w}: no diagnoses`);
  const ids = new Set();
  (p.diagnoses || []).forEach((d, i) => {
    const k = `${w} dx[${i}] ${d.id}`;
    if (!SAFE.test(d.id || '') || ids.has(d.id)) errors.push(`${k}: id must be unique (a-z, 0-9, -)`);
    ids.add(d.id);
    if (!['actual', 'risk', 'health-promotion'].includes(d.kind)) errors.push(`${k}: kind`);
    bi(d.title, `${k} title`); bi(d.definition, `${k} definition`);
    biList(d.relatedTo, `${k} relatedTo`, { allowEmpty: d.kind === 'risk' });
    if (d.kind === 'risk') biList(d.riskFactors, `${k} riskFactors`); else biList(d.evidencedBy, `${k} evidencedBy`);
    biList(d.assessment?.subjective, `${k} subjective`); biList(d.assessment?.objective, `${k} objective`);
    biList(d.goals?.short, `${k} short goals`); biList(d.goals?.long, `${k} long goals`);
    if ((d.interventions || []).length < 6) errors.push(`${k}: at least 6 interventions`);
    (d.interventions || []).forEach((x, j) => {
      if (!TYPES.includes(x.type)) errors.push(`${k} intervention ${j}: type`);
      bi(x.action, `${k} intervention ${j}`); bi(x.rationale, `${k} rationale ${j}`);
      // house style: every Arabic action is a full sentence that starts with a passive verb (يتم / تتم / يُـ)
      const a = x.action?.ar?.trim() || '';
      if (a && !/^(يتم|تتم|يُ)/.test(a)) errors.push(`${k} intervention ${j}: Arabic action must start with يتم / تتم / يُـ`);
      if (a && a.split(/\s+/).length < 6) errors.push(`${k} intervention ${j}: Arabic action is too short (write a full sentence)`);
    });
    if (!d.evaluation?.length) errors.push(`${k}: no evaluation`);
    (d.evaluation || []).forEach((e, j) => { if (!STATUS.includes(e.status)) errors.push(`${k} evaluation ${j}: status`); bi(e.text, `${k} evaluation ${j}`); });
    if (!d.hospital?.length) errors.push(`${k}: no hospital rows`);
    (d.hospital || []).forEach((r, j) => { bi(r.need, `${k} hospital ${j} need`); biList(r.actions, `${k} hospital ${j} actions`); bi(r.outcome, `${k} hospital ${j} outcome`); bi(r.timeframe, `${k} hospital ${j} timeframe`); });
  });
  return (p.diagnoses || []).map((d) => ({ id: d.id, title: d.title }));
}

function checkV1(p, w) {
  if (!p.student?.length) errors.push(`${w}: no student diagnoses`);
  (p.student || []).forEach((d, i) => {
    const k = `${w} student[${i}]`;
    bi(d.diagnosis, `${k} diagnosis`);
    biList(d.assessment?.subjective, `${k} subjective`); biList(d.assessment?.objective, `${k} objective`);
    biList(d.goals, `${k} goals`); biList(d.evaluation, `${k} evaluation`);
    (d.interventions || []).forEach((x, j) => { bi(x.action, `${k} intervention ${j}`); bi(x.rationale, `${k} rationale ${j}`); });
  });
  (p.hospital || []).forEach((r, i) => { bi(r.diagnosis, `${w} hospital[${i}]`); bi(r.need, `${w} hospital[${i}] need`); biList(r.actions, `${w} hospital[${i}] actions`); });
  return (p.student || []).map((d, i) => ({ id: `dx-${i + 1}`, title: legacyTitle(d.diagnosis) }));
}

const plans = readdirSync(join(DIR, 'plans')).filter((f) => f.endsWith('.json')).sort().map((f) => {
  const p = JSON.parse(readFileSync(join(DIR, 'plans', f), 'utf8'));
  const w = p.id || f;
  if (`${p.id}.json` !== f || !SAFE.test(p.id)) errors.push(`${f}: id must match the file name (a-z, 0-9, -)`);
  bi(p.title, `${w} title`); bi(p.summary, `${w} summary`);
  const diagnoses = Array.isArray(p.diagnoses) ? checkV2(p, w) : checkV1(p, w);
  const item = { id: p.id, icon: p.icon, system: p.system, folder: p.folder || 'disease', title: p.title, summary: p.summary, diagnoses };
  if (p.group) item.group = p.group;
  return item;
});

const ORDER = ['surgery', 'cardiology', 'endocrine', 'gastro', 'renal', 'hematology', 'infection', 'integumentary', 'obstetrics', 'mental', 'orthopedics', 'neurology', 'ophthalmic', 'pediatrics', 'respiratory', 'general'];
const rank = (s) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
plans.sort((a, b) => (a.folder === b.folder ? 0 : a.folder === 'disease' ? -1 : 1) || rank(a.system) - rank(b.system) || a.title.en.localeCompare(b.title.en));

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
writeFileSync(join(DIR, 'index.json'), JSON.stringify({ plans }, null, 1) + '\n');
console.log(`${plans.length} care plans indexed (${plans.reduce((n, p) => n + p.diagnoses.length, 0)} nursing diagnoses)`);
