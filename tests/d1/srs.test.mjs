// Flashcard scheduling (device-local): 4 grades, review stats, and progress saved by the previous version still works.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers.mjs';

const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const srs = await loadTs('src/lib/srs.ts');
const DAY = 864e5;
const card = (id) => JSON.parse(mem.get('nh_srs_v1')).cards[id];

test('old saved progress (box + due only) keeps working and gains stats on the next review', () => {
  mem.clear();
  const now = Date.now();
  mem.set('nh_srs_v1', JSON.stringify({ cards: { a: { b: 2, due: now - 1000 }, b: { b: 0, due: now + DAY } }, day: '2000-01-01', done: 5 }));
  const s = srs.buildSession(['a', 'b', 'c']);
  assert.deepEqual(s.queue, ['a', 'c'], 'due old card first, then the new one; not-yet-due card left out');
  assert.equal(srs.deckStats(['a', 'b', 'c']).known, 1);
  srs.rate('a', 'good');
  assert.equal(card('a').b, 3); assert.equal(card('a').n, 1); assert.equal(card('a').ok, 1);
});

test('again / hard / good / easy schedule as documented', () => {
  mem.clear();
  const t0 = Date.now();
  srs.rate('x', 'again'); assert.equal(card('x').b, 0); assert.ok(card('x').due <= Date.now()); assert.equal(card('x').ok, 0);
  srs.rate('x', 'hard'); assert.equal(card('x').b, 0); assert.ok(Math.abs(card('x').due - (t0 + DAY)) < 5000);
  srs.rate('x', 'good'); assert.equal(card('x').b, 1); assert.ok(Math.abs(card('x').due - (t0 + 3 * DAY)) < 5000);
  srs.rate('x', 'easy'); assert.equal(card('x').b, 3); assert.ok(Math.abs(card('x').due - (t0 + 14 * DAY)) < 5000);
  for (let i = 0; i < 5; i++) srs.rate('x', 'easy');
  assert.equal(card('x').b, 5, 'capped at the last box (60 days)');
  assert.equal(card('x').n, 9); assert.equal(card('x').ok, 8);
});

test('dashboard summary counts due / learned / learning', () => {
  mem.clear();
  srs.rate('p', 'again'); srs.rate('q', 'easy'); srs.rate('r', 'good');
  const s = srs.srsSummary();
  assert.equal(s.due, 1); assert.equal(s.learned, 1); assert.equal(s.learning, 2); assert.equal(s.reviews, 3);
});
