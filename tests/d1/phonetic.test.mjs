// Sound-alike drug-name matching (src/lib/phonetic.ts): Arabic spelling and small typos find the English name,
// unrelated names do not match.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers.mjs';

const { phoneticKey: k, phoneticScore: score, drugPhoneticKeys } = await loadTs('src/lib/phonetic.ts');

test('Arabic spelling matches the English drug name', () => {
  const pairs = [
    ['باراسيتامول', 'Paracetamol'], ['بنادول', 'Panadol'], ['كتافلام', 'Cataflam'], ['اموكسيسيلين', 'Amoxicillin'],
    ['سيفترياكسون', 'Ceftriaxone'], ['اوجمنتين', 'Augmentin'], ['أوميبرازول', 'Omeprazole'], ['انسولين', 'Insulin'],
    ['ميتفورمين', 'Metformin'], ['جلوكوفاج', 'Glucophage'], ['فوروسيمايد', 'Furosemide'], ['لازكس', 'Lasix'],
    ['هيبارين', 'Heparin'], ['ديجوكسين', 'Digoxin'], ['ادرينالين', 'Adrenaline'],
  ];
  for (const [ar, en] of pairs) assert.ok(score(k(ar), [k(en)]) > 0, `${ar} should match ${en} (${k(ar)} vs ${k(en)})`);
});

test('small typos still match', () => {
  for (const [typo, en] of [['ceftriaxon', 'Ceftriaxone'], ['paracetmol', 'Paracetamol'], ['amoxcillin', 'Amoxicillin'], ['metformine', 'Metformin']]) {
    assert.ok(score(k(typo), [k(en)]) > 0, `${typo} → ${en}`);
  }
});

test('unrelated names and very short queries do not match', () => {
  assert.equal(score(k('بنادول'), [k('Ceftriaxone')]), 0);
  assert.equal(score(k('انسولين'), [k('Heparin')]), 0);
  assert.equal(score(k('ab'), [k('Abciximab')]), 0);
  assert.equal(score(k('بنادول'), [k('Benzyl')]), 0, 'short keys need an exact / prefix match');
});

test('first word of a generic name is indexed too', () => {
  const keys = drugPhoneticKeys(['Diclofenac potassium']);
  assert.ok(score(k('ديكلوفيناك'), keys) > 0);
});
