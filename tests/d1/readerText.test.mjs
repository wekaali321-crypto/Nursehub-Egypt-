// Site reader text: cleaning for speech, splitting long pages into parts that fit one request, never mid-sentence when avoidable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers.mjs';

const r = await loadTs('src/components/ali-reader/readerText.ts');

test('cleaning keeps English medical terms, numbers and units; drops emoji, symbols and links', () => {
  assert.equal(r.cleanForSpeech('💊 <b>Furosemide (Lasix)</b> 40 mg IV ★ → see https://x.y/z'), 'Furosemide (Lasix) 40 mg IV see');
  assert.equal(r.cleanForSpeech('ضغط الدم ≥ 140/90 mmHg • K+ 3.5–5.0 mEq/L'), 'ضغط الدم ≥ 140/90 mmHg K+ 3.5–5.0 mEq/L');
});

test('a long Arabic article is split into parts ≤ 1000 chars, at sentence ends, nothing lost', () => {
  const sentence = 'فشل القلب الاحتقاني بيحصل لما القلب ميقدرش يضخ الدم بكفاءة، وده بيأدي لاحتباس السوائل في الرئة والرجلين. ';
  const paras = ['فشل القلب (Heart failure)', sentence.repeat(30).trim(), 'التمريض: راقب الوزن يوميًا وقيس الـ intake/output.'];
  const parts = r.splitChunks(paras);
  assert.ok(parts.length >= 4, String(parts.length));
  for (const p of parts) assert.ok(p.length <= 1000, String(p.length));
  for (const p of parts.slice(0, -1)) assert.match(p, /[.!?؟؛:…]$/, 'each part ends at a sentence end');
  const words = (s) => s.replace(/[.]/g, '').split(/\s+/).filter(Boolean).length;
  assert.equal(words(parts.join(' ')), words(paras.join(' ')), 'no words lost or duplicated');
  assert.ok(parts[0].startsWith('فشل القلب (Heart failure).'), 'heading gets a pause and keeps the English term');
});

test('a sentence longer than a part is cut at a comma or space, never inside a word', () => {
  const long = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
  const parts = r.splitChunks([long], 200);
  for (const p of parts) { assert.ok(p.length <= 200); assert.match(p, /^word\d+/); }
  assert.equal(parts.join(' ').split(' ').length, 300);
});

test('language per part: Arabic when it has Arabic letters (same Tarek voice either way)', () => {
  assert.equal(r.langOf('Digoxin toxicity: نبض أقل من 60'), 'ar');
  assert.equal(r.langOf('Digoxin toxicity: bradycardia'), 'en');
});
