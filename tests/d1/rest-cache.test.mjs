import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const { onRequest } = await import(pathToFileURL(join(ROOT, 'functions/rest/v1/[[path]].js')).href);

function fakeCaches() {
  const store = new Map(); const stats = { match: 0, put: 0 };
  globalThis.caches = { default: {
    async match(req) { stats.match++; const v = store.get(req.url); return v ? new Response(v.body, { status: v.status, headers: v.headers }) : undefined; },
    async put(req, res) { stats.put++; store.set(req.url, { body: Buffer.from(await res.arrayBuffer()), status: res.status, headers: [...res.headers] }); },
  } };
  return { store, stats };
}
const call = async (env, table, { method = 'GET', headers = {}, qs = 'select=*' } = {}) => {
  const pending = [];
  const res = await onRequest({ request: new Request(`https://x.test/rest/v1/${table}?${qs}`, { method, headers }), env, params: { path: [table] }, waitUntil: (p) => pending.push(p) });
  await Promise.all(pending); // like the runtime: cache writes registered with waitUntil finish before the next request
  return res;
};
const maxAge = (res) => /max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1];
const QUOTA = new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");

test('public content is edge-cached (long TTL for stable tables, short for settings); a HIT costs no D1 query', async () => {
  const c = fakeCaches();
  const { db } = newDb({ tables: ['dialysis_topics', 'site_settings'] });
  const d1 = mockD1(db); const env = { DB: d1 };
  const r1 = await call(env, 'dialysis_topics');
  assert.equal(r1.status, 200); assert.equal(r1.headers.get('x-edge-cache'), 'MISS');
  const queries = d1.log.length;
  const r2 = await call(env, 'dialysis_topics');
  assert.equal(r2.headers.get('x-edge-cache'), 'HIT');
  assert.equal(d1.log.length, queries, 'second request did not touch D1');
  assert.equal(maxAge({ headers: new Headers(c.store.get([...c.store.keys()][0]).headers) }), '600', 'stored with the long TTL');
  assert.equal(maxAge(r2), '60', 'browsers only keep it for 60 s');
  await call(env, 'site_settings');
  assert.equal(maxAge({ headers: new Headers(c.store.get([...c.store.keys()][1]).headers) }), '60', 'settings stay on the short TTL');
});

test('admin / signed-in requests (JWT) are never read from or written to the edge cache', async () => {
  const c = fakeCaches();
  const { db } = newDb({ tables: ['dialysis_topics'] });
  const d1 = mockD1(db); const env = { DB: d1 };
  const h = { authorization: 'Bearer aaa.bbb.ccc' };
  await call(env, 'dialysis_topics', { headers: h });
  await call(env, 'dialysis_topics', { headers: h });
  assert.equal(c.stats.match, 0); assert.equal(c.stats.put, 0);
  assert.equal(d1.log.filter((q) => /FROM "dialysis_topics"/.test(q.sql)).length, 2, 'each admin read hits D1 live');
});

test('private tables, writes and error responses are not cached', async () => {
  const c = fakeCaches();
  const { db } = newDb();
  const env = { DB: mockD1(db) };
  await call(env, 'orders'); await call(env, 'profiles');
  assert.equal(c.stats.put, 0, 'non-public tables');
  await onRequest({ request: new Request('https://x.test/rest/v1/dialysis_topics', { method: 'POST', body: '{}' }), env, params: { path: ['dialysis_topics'] }, waitUntil: () => {} });
  assert.equal(c.stats.put, 0, 'POST');
  const down = await call({ DB: mockD1(db, { failWith: QUOTA }) }, 'dialysis_topics');
  assert.equal(down.status, 429);
  assert.equal(c.stats.put, 0, '429 is never cached');
});
