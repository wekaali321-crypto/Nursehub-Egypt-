// Builds public/shift/drugs-lite.json for Shift mode (/shift) from the public snapshot public/data/drugs.json.
// Static file served by Cloudflare Pages (no D1 / Supabase reads), cached on the device for offline use.
// Re-run after refreshing the snapshot:  node scripts/build-shift-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const drugs = JSON.parse(readFileSync(join(ROOT, 'public/data/drugs.json'), 'utf8'));
const s = (v) => (typeof v === 'string' ? v.trim() : '') || undefined;

const out = drugs
  .filter((d) => d.slug && (d.name || d.name_en))
  .map((d) => ({
    s: d.slug,
    n: s(d.name), ne: s(d.name_en),
    g: s(d.generic_name), ge: s(d.generic_name_en),
    c: s(d.drug_class), ce: s(d.drug_class_en),
    d: s(d.dose), de: s(d.dose_en),
    x: s(d.contraindications), xe: s(d.contraindications_en),
    k: s(d.nursing_considerations), ke: s(d.nursing_considerations_en),
    h: d.is_high_alert ? 1 : undefined,
    w: s(d.high_alert_warnings), we: s(d.high_alert_warnings_en),
  }))
  .sort((a, b) => (a.ne || a.n || '').localeCompare(b.ne || b.n || ''));

mkdirSync(join(ROOT, 'public/shift'), { recursive: true });
const body = JSON.stringify({ v: 1, built: new Date().toISOString().slice(0, 10), drugs: out });
writeFileSync(join(ROOT, 'public/shift/drugs-lite.json'), body);
console.log(`drugs-lite.json: ${out.length} drugs, ${(body.length / 1024).toFixed(0)} KB`);

// Small names-only index for "related drugs" on articles/topics (slug, names, generic, high-alert flag): a few KB instead of the full file.
const names = out.map((d) => [d.s, d.n || '', d.ne || '', d.ge || d.g || '', d.h ? 1 : 0, d.c || '', d.ce || '']);
const nb = JSON.stringify({ v: 1, drugs: names });
writeFileSync(join(ROOT, 'public/shift/drug-names.json'), nb);
console.log(`drug-names.json: ${names.length} drugs, ${(nb.length / 1024).toFixed(0)} KB`);
