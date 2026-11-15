// Related-drugs matching (pure, no network): brand names link to the product; a shared active ingredient appears once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

const { matchDrugs } = await loadTs('src/lib/drugMatch.ts');
const rows = JSON.parse(readFileSync(join(ROOT, 'public/shift/drug-names.json'), 'utf8')).drugs;

test('an ingredient shared by several brands is listed once, not as several brands', () => {
  const hits = matchDrugs('Give amoxicillin 500 mg every 8 hours.', rows);
  const amox = hits.filter((h) => h.kind === 'generic' && h.name.toLowerCase() === 'amoxicillin');
  assert.equal(amox.length, 1, JSON.stringify(hits));
  assert.equal(hits.filter((h) => h.kind === 'brand').length, 0, 'no arbitrary brand page for a generic mention');
});

test('a product named exactly like the ingredient gives ONE link to that page', () => {
  const hits = matchDrugs('Give paracetamol 1 g for fever.', rows);
  assert.equal(hits.length, 1, JSON.stringify(hits));
  assert.equal(hits[0].kind, 'brand'); assert.equal(hits[0].row[0], 'paracetamol');
});

test('a brand name links to that product', () => {
  const brand = rows.find((r) => r[2] && r[2].length >= 6 && r[2].toLowerCase() !== r[3].split(/[+(/,]/)[0].trim().toLowerCase() && /^[A-Za-z]+$/.test(r[2]));
  const hits = matchDrugs(`The patient takes ${brand[2]} daily.`, rows);
  assert.ok(hits.some((h) => h.kind === 'brand' && h.row[0] === brand[0]), brand[2]);
});

test('whole words only, short names ignored, HTML stripped, limit respected', () => {
  assert.equal(matchDrugs('<p>paracetamolx and xparacetamol</p>', rows).length, 0);
  assert.equal(matchDrugs('<b>Paracetamol</b>', rows).length, 1);
  const many = rows.slice(0, 60).map((r) => r[2]).filter(Boolean).join(', ');
  assert.ok(matchDrugs(many, rows).length <= 8);
});
