// Account sync merge rules (pure): newest review per card wins, exam attempts united without duplicates. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { mergeProgress } = await loadTs('src/lib/progressSync.ts', { './supabase': { external: join(ROOT, 'tests/d1/fake-supabase.mjs') } });
const ex = (key, date, correct) => ({ key, group: 'travel', title: key, path: '/', date, correct, total: 10, seconds: 60 });

test('per card the most recent review wins (phone and laptop studied different cards)', () => {
  const phone = { v: 1, at: 1, cards: { a: [3, 900, 5, 5, 200], b: [1, 50, 1, 1, 100] }, exams: [] };
  const laptop = { v: 1, at: 2, cards: { a: [0, 10, 6, 5, 300], c: [2, 70, 2, 2, 150] }, exams: [] };
  const m = mergeProgress(phone, laptop);
  assert.deepEqual(m.cards.a, [0, 10, 6, 5, 300], 'laptop reviewed a later');
  assert.deepEqual(Object.keys(m.cards).sort(), ['a', 'b', 'c']);
});

test('exam attempts are united, duplicates dropped, newest first, capped at 300', () => {
  const m = mergeProgress({ v: 1, at: 1, cards: {}, exams: [ex('x', 5, 7), ex('y', 3, 4)] }, { v: 1, at: 1, cards: {}, exams: [ex('x', 5, 7), ex('z', 9, 8)] });
  assert.deepEqual(m.exams.map((e) => `${e.key}${e.date}`), ['z9', 'x5', 'y3']);
  const many = Array.from({ length: 400 }, (_, i) => ex('k', i, 1));
  assert.equal(mergeProgress(null, { v: 1, at: 1, cards: {}, exams: many }).exams.length, 300);
});

test('first sync from a device with nothing remote keeps everything local', () => {
  const local = { v: 1, at: 5, cards: { a: [1, 1, 1, 1, 1] }, exams: [ex('x', 1, 1)] };
  const m = mergeProgress(undefined, local);
  assert.deepEqual(m.cards, local.cards); assert.equal(m.exams.length, 1);
});
