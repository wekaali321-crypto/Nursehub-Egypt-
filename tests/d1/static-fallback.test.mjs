import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

const BASE = 'https://site.test';
const QUOTA_BODY = { code: 'PGRST100', message: "D1_ERROR: Your account has exceeded D1's free tier daily row read limit.", details: null, hint: null };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function store() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }

/** Fresh module instance + scripted network. `backend(url, init)` answers /rest/v1 calls; /data/*.json comes from public/data. */
async function setup(backend) {
  globalThis.sessionStorage = store();
  const calls = { rest: 0, data: 0, writes: 0 };
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/data/') || url.includes('/media/')) {
      calls.data++;
      const f = join(ROOT, 'public', new URL(url, BASE).pathname);
      return existsSync(f) ? new Response(readFileSync(f), { status: 200, headers: { 'content-type': 'application/json' } }) : new Response('nf', { status: 404 });
    }
    calls.rest++;
    if ((init.method || 'GET') !== 'GET' && (init.method || 'GET') !== 'HEAD') calls.writes++;
    return backend(url, init);
  };
  const mod = await loadTs(process.env.FALLBACK_SRC || 'src/lib/staticFallback.ts');
  return { f: mod.withStaticFallback(BASE), mod, calls };
}
const anon = { apikey: 'ANON_KEY_VALUE_1234567890', authorization: 'Bearer ANON_KEY_VALUE_1234567890' };
const user = { apikey: 'ANON_KEY_VALUE_1234567890', authorization: 'Bearer aaa.bbb.ccc' };
const T = `${BASE}/rest/v1/dialysis_topics?select=*&order=order_num.asc`;

test('daily D1 quota (400 + D1 message) switches reads to the snapshot', async () => {
  const { f, mod, calls } = await setup(async () => json(QUOTA_BODY, 400));
  const r = await f(T, { headers: anon });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-static-fallback'), '1');
  assert.ok((await r.json()).length > 0);
  assert.equal(mod.isStaticFallbackActive(), true);
  // the next reads in the session do not hit the backend again
  const before = calls.rest;
  await f(T, { headers: anon });
  assert.equal(calls.rest, before);
});

test('429 from the backend (the new quota answer) and any 5xx use the snapshot', async () => {
  for (const status of [429, 503]) {
    const { f } = await setup(async () => json({ code: 'PGRST000', message: QUOTA_BODY.message }, status));
    const r = await f(T, { headers: anon });
    assert.equal(r.status, 200, String(status));
    assert.equal(r.headers.get('x-static-fallback'), '1');
  }
});

test('ordinary application errors are NOT hidden by the snapshot', async () => {
  for (const [status, body] of [[400, { code: 'PGRST100', message: 'D1_ERROR: no such column: nope: SQLITE_ERROR' }], [400, { code: 'PGRST100', message: 'near "FROM": syntax error' }], [401, { message: 'no' }], [403, { message: 'no' }], [404, { message: 'no' }], [406, { code: 'PGRST116' }]]) {
    const { f, mod } = await setup(async () => json(body, status));
    const r = await f(T, { headers: anon });
    assert.equal(r.status, status, `status ${status} ${body.message}`);
    assert.equal(r.headers.get('x-static-fallback'), null);
    assert.equal(mod.isStaticFallbackActive(), false);
  }
});

test('healthy responses pass through untouched', async () => {
  const { f, mod } = await setup(async () => json([{ id: 'live' }]));
  const r = await f(T, { headers: anon });
  assert.deepEqual(await r.json(), [{ id: 'live' }]);
  assert.equal(mod.isStaticFallbackActive(), false);
});

test('admin / signed-in requests (user JWT) are never answered from the snapshot', async () => {
  const { f, mod, calls } = await setup(async () => json(QUOTA_BODY, 400));
  const r = await f(T, { headers: user });
  assert.equal(r.status, 400); // the real error, not stale data
  assert.equal(r.headers.get('x-static-fallback'), null);
  assert.equal(calls.data, 0);
  assert.equal(mod.isStaticFallbackActive(), false);
  // even after an anonymous reader already flipped the session into fallback mode
  await f(T, { headers: anon });
  assert.equal(mod.isStaticFallbackActive(), true);
  const before = calls.rest;
  const r2 = await f(T, { headers: user });
  assert.equal(r2.status, 400);
  assert.equal(calls.rest, before + 1, 'admin read still goes to the network');
});

test('writes always reach the network and are never faked', async () => {
  const { f, calls } = await setup(async () => json(QUOTA_BODY, 400));
  await f(T, { headers: anon }); // fallback mode is on
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
    const r = await f(`${BASE}/rest/v1/dialysis_topics?id=eq.x`, { method, headers: anon, body: method === 'DELETE' ? undefined : '{}' });
    assert.equal(r.status, 400, method);
    assert.equal(r.headers.get('x-static-fallback'), null, method);
  }
  assert.equal(calls.writes, 4);
});

test('tables outside the snapshot list (comments, notifications) are not answered from it', async () => {
  const { f } = await setup(async () => json(QUOTA_BODY, 400));
  const r = await f(`${BASE}/rest/v1/comments?select=*`, { headers: anon });
  assert.equal(r.status, 400);
});

test('snapshot honours eq / limit (primary-key topic read)', async () => {
  const { f } = await setup(async () => json(QUOTA_BODY, 400));
  const all = JSON.parse(readFileSync(join(ROOT, 'public/data/dialysis_topics.json'), 'utf8'));
  const one = await (await f(`${BASE}/rest/v1/dialysis_topics?select=*&id=eq.${all[3].id}`, { headers: anon })).json();
  assert.equal(one.length, 1);
  assert.equal(one[0].id, all[3].id);
  const two = await (await f(`${BASE}/rest/v1/dialysis_topics?select=id&limit=2`, { headers: anon })).json();
  assert.equal(two.length, 2);
});

test('D1 comes back: after the 10 minute window the network is used again', async () => {
  let healthy = false;
  const { f, mod, calls } = await setup(async () => (healthy ? json([{ id: 'live' }]) : json(QUOTA_BODY, 400)));
  const realNow = Date.now; let t = realNow();
  Date.now = () => t;
  try {
    await f(T, { headers: anon });
    assert.equal(mod.isStaticFallbackActive(), true);
    healthy = true;
    t += 5 * 60 * 1000; // still inside the window: still the snapshot
    assert.equal((await (await f(T, { headers: anon })).json()).length > 1, true);
    t += 6 * 60 * 1000; // window over
    const before = calls.rest;
    const r = await f(T, { headers: anon });
    assert.deepEqual(await r.json(), [{ id: 'live' }]);
    assert.equal(calls.rest, before + 1);
    assert.equal(mod.isStaticFallbackActive(), false);
  } finally { Date.now = realNow; }
});
