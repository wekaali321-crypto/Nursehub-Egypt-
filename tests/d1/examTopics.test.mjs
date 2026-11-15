// Exam topics (static, approximate) and per-topic weakness on this device. No network, no D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';
import { topicOf } from '../../scripts/build-question-topics.mjs';

const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

test('classifier: the stem decides (examples that were wrong before stem weighting)', () => {
  assert.equal(topicOf({ question_en: 'The pathological process causing esophageal varices is:', choices: [{ text: 'Portal hypertension' }] }), 'gi');
  assert.equal(topicOf({ question_en: 'A preterm infant is at greatest risk for which problem related to low body fat?', choices: [{ text: 'Hypothermia' }] }), 'pediatrics');
  assert.equal(topicOf({ question_en: 'A client in labor has contractions every 3 minutes', choices: [] }), 'maternity');
  assert.equal(topicOf({ question_en: 'Which of the following describes the ultimate goal?', choices: [] }), 'general');
});

test('every question bank has a topic file and every question of the bank is in it', () => {
  const ex = JSON.parse(readFileSync(join(ROOT, 'public/data/exam_questions.json'), 'utf8'));
  const bank = ex[0].exam_id;
  const f = join(ROOT, 'public/exams/topics', `licensure-${bank}.json`);
  assert.ok(existsSync(f));
  const t = JSON.parse(readFileSync(f, 'utf8')).topics;
  for (const q of ex.filter((q) => q.exam_id === bank)) assert.ok(t[q.id], q.id);
});

test('per-topic breakdown is saved with the attempt and weak topics aggregate across attempts', async () => {
  mem.clear();
  const { topicBreakdown } = await loadTs('src/lib/examTopics.ts');
  const h = await loadTs('src/lib/examHistory.ts');
  const topics = { a: 'cardio', b: 'cardio', c: 'renal', d: 'renal', e: 'renal', f: 'general' };
  const b = topicBreakdown(['a', 'b', 'c', 'd', 'e', 'f'], (id) => id === 'a' || id === 'c' || id === 'd' || id === 'e', topics);
  assert.deepEqual(b, { cardio: [1, 2], renal: [3, 3], general: [0, 1] });
  h.addAttempt({ key: 'k', group: 'licensure', title: 't', path: '/p', date: 1, correct: 4, total: 6, seconds: 60 });
  h.attachTopics('k', 1, b);
  h.addAttempt({ key: 'k', group: 'licensure', title: 't', path: '/p', date: 2, correct: 0, total: 3, seconds: 60 });
  h.attachTopics('k', 2, { cardio: [0, 3] });
  const w = h.weakTopics(3);
  assert.deepEqual(w.map((x) => [x.topic, x.correct, x.total]), [['cardio', 1, 5], ['renal', 3, 3]]);
  h.attachTopics('k', 1, { cardio: [9, 9] });
  assert.equal(h.weakTopics(3)[0].total, 5, 'an attempt keeps its first breakdown');
});
