// Term → teaching drawing (src/lib/termArt.ts + public/cards/art from scripts/build-term-art.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

const { termArt } = await loadTs('src/lib/termArt.ts');
const name = (t) => termArt(t)?.replace('/cards/art/', '').replace('.svg', '') ?? null;

test('roots, derived words and prefixes get the right drawing', () => {
  const cases = {
    'Gastr-': 'body-stomach', Gastritis: 'body-stomach', 'Cardi-': 'body-heart', 'Myocardial infarction': 'body-heart',
    'My- / Muscul-': 'body-muscle', 'Hepat-': 'body-liver', 'Nephr-': 'body-kidneys', 'Abdomin-': 'body-abdomen',
    'Ab-': 'pos-away', 'Ad-': 'pos-toward', 'Supra-/Super-': 'pos-above', 'Inter-': 'pos-between', 'Circum-': 'pos-around',
    Abduction: 'move-abduction', Adduction: 'move-adduction', Tachycardia: 'idea-fast', Bradycardia: 'idea-slow',
    'Hypo-': 'idea-decrease', 'Hyper-': 'idea-increase', Hemiplegia: 'idea-half',
    // exceptions where the first word would mislead
    'Multiple sclerosis': 'body-brain', 'Polycystic kidney': 'body-kidneys', 'Hypodermis / Subcutaneous fat': 'body-skin',
    'Crani- / Cox-': 'body-hip', Hypothermia: 'idea-cold',
  };
  for (const [term, want] of Object.entries(cases)) assert.equal(name(term), want, term);
});

test('terms without a meaningful drawing get none', () => {
  for (const t of ['Prognosis', 'Diagnosis', 'Idiopathic', 'Homeostasis', '']) assert.equal(termArt(t), null, t);
});

test('every drawing a rule can return exists on disk', async () => {
  const src = (await import('node:fs')).readFileSync(join(ROOT, 'src/lib/termArt.ts'), 'utf8');
  const names = [...src.matchAll(/"((?:body|pos|idea|move)-[\w]+)"/g)].map((m) => m[1]);
  const files = new Set(readdirSync(join(ROOT, 'public/cards/art')).map((f) => f.replace('.svg', '')));
  for (const n of new Set(names)) assert.ok(files.has(n), `missing public/cards/art/${n}.svg`);
  assert.ok(existsSync(join(ROOT, 'scripts/build-term-art.mjs')));
});

test('every Anatomy topic drawing exists on disk', async () => {
  const src = (await import('node:fs')).readFileSync(join(ROOT, 'src/pages/AnatomyPage.tsx'), 'utf8');
  const block = src.slice(src.indexOf('const ART'), src.indexOf('};', src.indexOf('const ART')));
  const names = [...block.matchAll(/:\s*"(\w+)"/g)].map((m) => m[1]);
  assert.ok(names.length >= 19, 'all 19 anatomy topics mapped');
  for (const n of names) assert.ok(existsSync(join(ROOT, `public/cards/art/body-${n}.svg`)), `missing body-${n}.svg`);
});

test('every Anatomy section diagram exists and belongs to a real section', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(join(ROOT, 'src/pages/AnatomyPage.tsx'), 'utf8');
  const block = src.slice(src.indexOf('const SECTION_ART'), src.indexOf('};', src.indexOf('const SECTION_ART')));
  const pairs = [...block.matchAll(/"?([\w-]+)"?:\s*"([\w-]+)"/g)].map((m) => [m[1], m[2]]);
  const ids = new Set(JSON.parse(fs.readFileSync(join(ROOT, 'public/data/anatomy_topics.json'), 'utf8'))
    .flatMap((t) => (typeof t.sections === 'string' ? JSON.parse(t.sections) : t.sections).map((s) => s.id)));
  assert.ok(pairs.length >= 30);
  for (const [sec, art] of pairs) {
    assert.ok(ids.has(sec), `unknown anatomy section ${sec}`);
    assert.ok(existsSync(join(ROOT, `public/cards/art/${art}.svg`)), `missing ${art}.svg`);
  }
});
