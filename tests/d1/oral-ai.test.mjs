// /api/oral: daily neuron budget, automatic switch to the free mode, per-IP limits, admin switch, output parsing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const oral = await import(pathToFileURL(join(ROOT, 'functions/api/oral.js')).href);
globalThis.caches = undefined; // no edge cache in tests

const fakeAI = (reply, usage = { prompt_tokens: 1000, completion_tokens: 300 }) => {
  const calls = [];
  return { calls, async run(model, input) { calls.push({ model, input }); if (reply instanceof Error) throw reply; return { response: typeof reply === 'function' ? reply(input) : reply, usage }; } };
};
const env = (ai, extra = {}) => { const { db } = newDb(); return { DB: mockD1(db), AI: ai, db, ...extra }; };
const post = (e, body, ip = '1.2.3.4') => oral.onRequestPost({ request: new Request('https://x.test/api/oral', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), env: e });
const GEN = { action: 'generate', lang: 'ar', title: 'Heart failure', text: 'x'.repeat(50), topic: 'cardio', count: 5 };
const GOOD_Q = { questions: [{ q: 'What is HF?', points: ['pump failure'] }, { q: 'Name a sign', points: ['edema', 'dyspnea'] }, { q: 'Priority?', points: ['airway'] }] };

test('generate: returns questions and records the neurons used today (one row per day)', async () => {
  const e = env(fakeAI(GOOD_Q));
  const r = await post(e, GEN);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.questions.length, 3);
  const expected = oral.neuronsFor(oral.DEFAULT_MODEL, { prompt_tokens: 1000, completion_tokens: 300 });
  assert.ok(Math.abs(j.neurons - expected) < 0.01 && expected > 80 && expected < 100, String(expected));
  const s = await oral.readStatus(e);
  assert.equal(s.calls, 1); assert.equal(s.used, Math.round(expected)); assert.equal(s.ai, true);
  await post(e, GEN);
  const rows = e.db.prepare("SELECT key FROM nh_settings WHERE key LIKE 'ai_usage:%'").all();
  assert.equal(rows.length, 1, 'still one usage row');
  assert.equal((await oral.readStatus(e)).calls, 2);
});

test('budget used up → no AI call, fallback answer (the page switches to the free exam)', async () => {
  const ai = fakeAI(GOOD_Q);
  const e = env(ai, { AI_DAILY_NEURONS: '150' });
  assert.equal((await post(e, GEN)).status, 200);        // ~92 neurons
  assert.equal((await post(e, GEN)).status, 200);        // ~184 ≥ 150 now
  const r = await post(e, GEN);
  assert.equal(r.status, 429);
  const j = await r.json();
  assert.equal(j.fallback, true); assert.equal(j.reason, 'daily_limit');
  assert.equal(ai.calls.length, 2, 'the third request never reached Workers AI');
  assert.equal((await oral.readStatus(e)).pct, 100);
  assert.equal((await oral.readStatus(e, Date.now() + 86400e3)).ai, true, 'a new UTC day starts from zero');
});

test('Workers AI "daily free allocation" error marks the day as spent', async () => {
  const e = env(fakeAI(new Error('4006: you have used up your daily free allocation of 10,000 neurons')));
  const r = await post(e, GEN);
  assert.equal(r.status, 429); assert.equal((await r.json()).reason, 'daily_limit');
  const s = await oral.readStatus(e);
  assert.equal(s.ai, false); assert.equal(s.pct, 100);
});

test('no AI binding / admin switch off → fallback, nothing counted', async () => {
  const e1 = env(undefined);
  assert.equal((await (await post(e1, GEN)).json()).reason, 'ai_unavailable');
  const ai = fakeAI(GOOD_Q);
  const e2 = env(ai);
  e2.db.prepare("INSERT INTO nh_settings (key, value) VALUES ('oral_ai', ?)").run(JSON.stringify({ enabled: false }));
  assert.equal((await (await post(e2, GEN)).json()).reason, 'ai_off');
  assert.equal(ai.calls.length, 0);
  e2.db.prepare("UPDATE nh_settings SET value = ? WHERE key = 'oral_ai'").run(JSON.stringify({ enabled: true, dailyLimit: 3000 }));
  assert.equal((await oral.readStatus(e2)).limit, 3000, 'admin can lower the daily budget');
});

test('per-IP limit: 10 new exams an hour, other visitors unaffected', async () => {
  const e = env(fakeAI(GOOD_Q), { AI_DAILY_NEURONS: '9000' });
  const codes = [];
  for (let i = 0; i < 11; i++) codes.push((await post(e, GEN, '9.9.9.9')).status);
  assert.deepEqual(codes.slice(0, 10), Array(10).fill(200)); assert.equal(codes[10], 429);
  assert.equal((await post(e, GEN, '8.8.8.8')).status, 200);
});

test('grade: clamps the score, reads JSON wrapped in prose, rejects a missing question', async () => {
  const ai = fakeAI('Sure! ```json\n{"score": 7, "feedback": "Correct, well done.", "missing": []}\n```');
  const e = env(ai);
  const r = await post(e, { action: 'grade', lang: 'en', q: 'Name a sign of HF', points: ['edema'], answer: 'leg edema' });
  const j = await r.json();
  assert.equal(r.status, 200); assert.equal(j.score, 2); assert.equal(j.feedback, 'Correct, well done.');
  assert.match(ai.calls[0].input.messages[1].content, /leg edema/);
  assert.equal((await post(e, { action: 'grade', q: '', points: [] })).status, 400);
});

test('study text is cut to 3500 characters; short pages fall back to the topic', () => {
  const long = oral.buildGenerate({ lang: 'ar', title: 'T', text: 'a '.repeat(5000) });
  const studied = long.messages[1].content.split('"""')[1];
  assert.ok(studied.length <= 3500, String(studied.length));
  assert.match(oral.buildGenerate({ lang: 'ar', text: '' }).messages[1].content, /Egyptian colloquial Arabic/, 'Arabic questions are in Egyptian colloquial');
  assert.match(long.messages[1].content, /Study text/);
  const short = oral.buildGenerate({ lang: 'en', title: 'Home', text: 'short', topic: 'Cardiovascular' });
  assert.match(short.messages[1].content, /Topic: "Cardiovascular"/);
});
