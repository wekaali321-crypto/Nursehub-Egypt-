// Free oral exam: spoken answer → choice; static question pools are present and small.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

const m = await loadTs('src/lib/oral/match.ts');
const CH = [
  ['Immediate intravenous replacement', 'تعويض وريدي فوري'],
  ['Respiratory support to keep the airway open', 'دعم تنفسي للحفاظ على مجرى الهواء مفتوح'],
  ['A tracheostomy set at the bedside', 'تجهيز طقم فتح القصبة الهوائية بجانب السرير'],
  ['Informing the parents about a tonsillectomy', 'إبلاغ الوالدين بعملية استئصال اللوزتين'],
];

test('letters and positions, in Arabic and English', () => {
  for (const [said, want] of [['C', 2], ['the answer is B', 1], ['الإجابة ب', 1], ['التالتة', 2], ['أنا اختار الرابع', 3], ['رقم ٣', 2], ['second', 1], ['دي', 3], ['A.', 0]]) {
    assert.equal(m.matchChoice(said, CH), want, said);
  }
});

test('the words of the answer itself (speech-to-text, Egyptian wording)', () => {
  assert.equal(m.matchChoice('tracheostomy set at the bedside', CH), 2);
  assert.equal(m.matchChoice('نجهز طقم فتح القصبه الهوائيه جنب السرير', CH), 2);
  assert.equal(m.matchChoice('respiratory support airway', CH), 1);
});

test('unclear answers return -1 (Ali asks again)', () => {
  assert.equal(m.matchChoice('', CH), -1);
  assert.equal(m.matchChoice('مش عارف والله', CH), -1);
  assert.equal(m.matchChoice('the patient', CH), -1);
});

test('oral pools: one file per topic + mixed, each well under 150 KB, valid answers', () => {
  const dir = join(ROOT, 'public/exams/oral');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');
  assert.ok(files.includes('mixed.json') && files.includes('cardio.json') && files.length >= 17);
  for (const f of files) {
    assert.ok(statSync(join(dir, f)).size < 150_000, f);
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    assert.ok(j.q.length >= 20, f);
    for (const q of j.q) { assert.ok(q.a >= 0 && q.a < q.c.length, q.id); assert.ok(!q.ca || q.ca.length === q.c.length, q.id); }
  }
  const routes = JSON.parse(readFileSync(join(ROOT, 'public/_routes.json'), 'utf8'));
  assert.ok(routes.exclude.includes('/exams/*'), 'pools are served as static files (no Function call)');
});

test('a sentence starting with "a" is not read as choice A', () => {
  assert.equal(m.matchChoice('a tracheostomy set at the bedside', CH), 2);
});
