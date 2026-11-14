import test from 'node:test';
import assert from 'node:assert/strict';
import { newDb, mockD1, loadSb } from './helpers.mjs';

const QUOTA = "D1_ERROR: Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.";
const get = (path, headers = {}) => new Request(`https://x.test/rest/v1/${path}`, { headers });

test('quota message is classified; ordinary SQL/filter errors are not', async () => {
  const { isD1QuotaError } = await loadSb();
  assert.equal(isD1QuotaError(QUOTA), true);
  assert.equal(isD1QuotaError("D1_ERROR: Your account has exceeded D1's free tier daily rows written limit."), true);
  for (const m of ['D1_ERROR: no such column: foo: SQLITE_ERROR', 'near "FROM": syntax error', 'D1_ERROR: too many SQL variables', 'JSON object requested', '']) {
    assert.equal(isD1QuotaError(m), false, m);
  }
});

test('REST GET: quota exhaustion -> 429 + Retry-After; other D1 errors stay 400 PGRST100', async () => {
  const { handleRest } = await loadSb();
  const { db } = newDb();
  const quota = { DB: mockD1(db, { failWith: new Error(QUOTA) }) };
  const r1 = await handleRest(get('dialysis_topics?select=*'), quota, ['dialysis_topics']);
  assert.equal(r1.status, 429);
  assert.equal(r1.headers.get('x-d1-quota'), '1');
  assert.equal(r1.headers.get('retry-after'), '3600');
  assert.equal((await r1.json()).code, 'PGRST000');

  const bad = { DB: mockD1(db, { failWith: new Error('D1_ERROR: no such column: nope: SQLITE_ERROR') }) };
  const r2 = await handleRest(get('dialysis_topics?select=*'), bad, ['dialysis_topics']);
  assert.equal(r2.status, 400);
  assert.equal((await r2.json()).code, 'PGRST100');
  assert.equal(r2.headers.get('x-d1-quota'), null);
});

test('RPC path is also classified (it used to throw an unhandled 500)', async () => {
  const { handleRest } = await loadSb();
  const { db } = newDb();
  const env = { DB: mockD1(db, { failWith: new Error(QUOTA) }) };
  const r = await handleRest(new Request('https://x.test/rest/v1/rpc/travel_question_counts', { method: 'POST' }), env, ['rpc', 'travel_question_counts']);
  assert.equal(r.status, 429);
});

test('D1 comes back: the same endpoint answers 200 again with data', async () => {
  const { handleRest } = await loadSb();
  const { db } = newDb({ tables: ['dialysis_topics'] });
  const down = { DB: mockD1(db, { failWith: new Error(QUOTA) }) };
  assert.equal((await handleRest(get('dialysis_topics?select=id&limit=2'), down, ['dialysis_topics'])).status, 429);
  const up = { DB: mockD1(db) };
  const r = await handleRest(get('dialysis_topics?select=id&limit=2'), up, ['dialysis_topics']);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).length, 2);
});
