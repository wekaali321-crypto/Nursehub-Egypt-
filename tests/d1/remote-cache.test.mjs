import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers.mjs';

function storage() { const m = new Map(); return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
/** Minimal IndexedDB: enough for src/lib/remoteCache.ts (open / createObjectStore / transaction.get / put). */
function fakeIndexedDB() {
  const kv = new Map();
  const req = (run) => { const r = {}; queueMicrotask(() => { try { r.result = run(); r.onsuccess && r.onsuccess({ target: r }); } catch (e) { r.error = e; r.onerror && r.onerror(e); } }); return r; };
  return {
    kv,
    open() {
      const r = {};
      queueMicrotask(() => {
        r.result = { createObjectStore() {}, transaction: () => ({ objectStore: () => ({ get: (k) => req(() => kv.get(k)), put: (v, k) => req(() => { kv.set(k, v); }) }) }) };
        r.onupgradeneeded && r.onupgradeneeded(); r.onsuccess && r.onsuccess({ target: r });
      });
      return r;
    },
  };
}
async function setup() {
  globalThis.sessionStorage = storage(); globalThis.localStorage = storage(); globalThis.indexedDB = fakeIndexedDB();
  return { mod: await loadTs('src/lib/remoteCache.ts'), idb: globalThis.indexedDB };
}
const settle = () => new Promise((r) => setTimeout(r, 15));
const FALLBACK_ON = () => globalThis.sessionStorage.setItem('nh_sb_down', String(Date.now()));

test('cacheSet/cacheGet round trip and expiry', async () => {
  const { mod, idb } = await setup();
  await mod.cacheSet('k', { a: 1 });
  assert.deepEqual(await mod.cacheGet('k', 1000), { a: 1 });
  idb.kv.get('k').ts -= 5000;
  assert.equal(await mod.cacheGet('k', 1000), null);
});

test('nothing is stored while the static fallback is serving reads (bundle / search index / section lists)', async () => {
  const { mod, idb } = await setup();
  FALLBACK_ON();
  await mod.cacheSet('public_bundle_v1', { stale: true });
  await mod.cacheSet('search_index_v1', { stale: true });
  assert.equal(idb.kv.size, 0);
});

test('cachedQuery: second call is served from cache, concurrent calls share one request', async () => {
  const { mod } = await setup();
  let n = 0; const fn = async () => { n++; await settle(); return [{ id: 1 }]; };
  const [a, b] = await Promise.all([mod.cachedQuery('topics_v1_x', 1e6, fn), mod.cachedQuery('topics_v1_x', 1e6, fn)]);
  assert.deepEqual(a, b); assert.equal(n, 1);
  await settle();
  assert.deepEqual(await mod.cachedQuery('topics_v1_x', 1e6, fn), [{ id: 1 }]);
  assert.equal(n, 1);
});

test('cachedQuery: signed-in (admin) sessions always read live and never write the cache', async () => {
  const { mod, idb } = await setup();
  globalThis.localStorage.setItem('sb-site-auth-token', JSON.stringify({ access_token: 'a.b.c' }));
  let n = 0; const fn = async () => { n++; return [{ id: n }]; };
  assert.deepEqual(await mod.cachedQuery('topics_v1_x', 1e6, fn), [{ id: 1 }]);
  assert.deepEqual(await mod.cachedQuery('topics_v1_x', 1e6, fn), [{ id: 2 }]);
  assert.equal(n, 2); assert.equal(idb.kv.size, 0);
});

test('cachedQuery: empty results, errors and fallback-served results are not stored', async () => {
  const { mod, idb } = await setup();
  assert.deepEqual(await mod.cachedQuery('e1', 1e6, async () => []), []);
  await assert.rejects(mod.cachedQuery('e2', 1e6, async () => { throw new Error('boom'); }));
  await mod.cachedQuery('e3', 1e6, async () => { FALLBACK_ON(); return [{ id: 'snapshot' }]; });
  await settle();
  assert.equal(idb.kv.size, 0);
});
