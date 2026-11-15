// Auth rate limits: 3 wrong passwords → 5 min lock (before any hashing), per-IP caps, signup and reset limits.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const { handleAuth } = await import(pathToFileURL(join(ROOT, 'functions/_lib/sbauth.js')).href);

let clock = 0; const realNow = Date.now; Date.now = () => realNow() + clock;
function fakeCaches() {
  const store = new Map();
  globalThis.caches = { default: {
    async match(req) { const v = store.get(req.url); if (!v || v.exp < Date.now()) return undefined; return new Response(v.body); },
    async put(req, res) { const age = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 0); store.set(req.url, { body: await res.text(), exp: Date.now() + age * 1000 }); },
    async delete(req) { return store.delete(req.url); },
  } };
}
const env = () => {
  const { db } = newDb();
  return { DB: mockD1(db), JWT_SECRET: 'test-secret', ADMIN_EMAIL: 'owner@test.local', ADMIN_PASSWORD: 'right-pass-1', PBKDF2_ITER: '1000' };
};
const req = (path, body, ip = '1.1.1.1', qs = '') => new Request(`https://x.test/auth/v1/${path}${qs}`, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) });
const login = (e, email, password, ip) => handleAuth(req('token', { email, password }, ip, '?grant_type=password'), e, ['token']);

test('3 wrong passwords → locked 5 minutes (even the right one is refused); unlocks after the lock', async () => {
  fakeCaches(); clock = 0; const e = env();
  await handleAuth(req('signup', { email: 'u@test.local', password: 'secret12' }, '9.9.9.9'), e, ['signup']);
  assert.equal((await login(e, 'u@test.local', 'bad1')).status, 400);
  assert.equal((await login(e, 'u@test.local', 'bad2')).status, 400);
  const third = await login(e, 'u@test.local', 'bad3');
  assert.equal(third.status, 429); assert.ok(Number(third.headers.get('retry-after')) > 250);
  const queries = e.DB.log.length;
  assert.equal((await login(e, 'u@test.local', 'secret12')).status, 429, 'locked even with the right password');
  assert.equal(e.DB.log.length, queries, 'a locked attempt reads nothing from D1 (and hashes nothing)');
  assert.equal((await login(e, 'u@test.local', 'secret12', '2.2.2.2')).status, 200, 'another IP is not affected');
  clock += 5 * 60 * 1000 + 1000;
  assert.equal((await login(e, 'u@test.local', 'secret12')).status, 200, 'unlocked after 5 minutes');
});

test('a successful login clears the failure count', async () => {
  fakeCaches(); clock = 0; const e = env();
  await handleAuth(req('signup', { email: 'u@test.local', password: 'secret12' }, '9.9.9.8'), e, ['signup']);
  await login(e, 'u@test.local', 'bad1'); await login(e, 'u@test.local', 'bad2');
  assert.equal((await login(e, 'u@test.local', 'secret12')).status, 200);
  assert.equal((await login(e, 'u@test.local', 'bad3')).status, 400, 'counting restarted');
});

test('the owner (ADMIN_PASSWORD) account is limited the same way', async () => {
  fakeCaches(); clock = 0; const e = env();
  for (const p of ['a', 'b']) assert.equal((await login(e, 'owner@test.local', p)).status, 400);
  assert.equal((await login(e, 'owner@test.local', 'c')).status, 429);
  assert.equal((await login(e, 'owner@test.local', 'right-pass-1')).status, 429);
});

test('one IP trying many e-mails is capped (credential stuffing)', async () => {
  fakeCaches(); clock = 0; const e = env();
  const codes = [];
  for (let i = 0; i < 22; i++) codes.push((await login(e, `x${i}@test.local`, 'wrong', '3.3.3.3')).status);
  assert.ok(codes.slice(0, 19).every((c) => c === 400), 'first attempts are normal failures');
  assert.ok(codes.slice(19).every((c) => c === 429), 'then the IP is locked');
});

test('signup: 5 per IP per hour; password reset: limited per IP and per e-mail', async () => {
  fakeCaches(); clock = 0; const e = env();
  const s = [];
  for (let i = 0; i < 6; i++) s.push((await handleAuth(req('signup', { email: `n${i}@test.local`, password: 'secret12' }, '4.4.4.4'), e, ['signup'])).status);
  assert.deepEqual(s.slice(0, 4), [200, 200, 200, 200]); assert.equal(s[5], 429);
  const r = [];
  for (let i = 0; i < 4; i++) r.push((await handleAuth(req('recover', { email: 'same@test.local' }, '5.5.5.5'), e, ['recover'])).status);
  assert.deepEqual(r, [200, 200, 429, 429]);
});

test('admin password reset: admin only, members only, old sessions dropped, temp password works', async () => {
  fakeCaches(); clock = 0; const e = env();
  const { loadSb } = await import('./helpers.mjs'); const sb = await loadSb();
  await handleAuth(req('signup', { email: 'm@test.local', password: 'oldpass1' }, '6.6.6.6'), e, ['signup']);
  const rpc = async (token, email) => {
    const r = await sb.handleRest(new Request('https://x.test/rest/v1/rpc/admin_set_user_password', { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ email }) }), e, ['rpc', 'admin_set_user_password']);
    return { status: r.status, body: await r.json() };
  };
  const member = await (await login(e, 'm@test.local', 'oldpass1', '6.6.6.7')).json();
  assert.equal((await rpc(null, 'm@test.local')).status, 403, 'anonymous refused');
  assert.equal((await rpc(member.access_token, 'm@test.local')).status, 403, 'a member cannot reset passwords');
  const owner = await (await login(e, 'owner@test.local', 'right-pass-1', '6.6.6.8')).json();
  const r = await rpc(owner.access_token, 'M@test.local ');
  assert.equal(r.status, 200); assert.equal(r.body.ok, true); assert.match(r.body.temp_password, /^[A-Za-z2-9]{10}$/);
  assert.equal((await login(e, 'm@test.local', 'oldpass1', '6.6.6.9')).status, 400, 'old password no longer works');
  assert.equal((await login(e, 'm@test.local', r.body.temp_password, '6.6.6.9')).status, 200, 'temp password works');
  const refresh = await handleAuth(new Request('https://x.test/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refresh_token: member.refresh_token }) }), e, ['token']);
  assert.equal(refresh.status, 400, 'sessions from before the reset are gone');
  assert.equal((await rpc(owner.access_token, 'owner@test.local')).body.error, 'staff_account');
  assert.equal((await rpc(owner.access_token, 'nobody@test.local')).body.error, 'not_found');
});

test('visitor inserts (newsletter) are capped per IP; other visitors unaffected', async () => {
  fakeCaches(); clock = 0; const e = env();
  const { loadSb } = await import('./helpers.mjs'); const sb = await loadSb();
  const sub = (i, ip = '7.7.7.7') => sb.handleRest(new Request('https://x.test/rest/v1/subscribers', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify({ id: `s${i}`, email: `s${i}@test.local`, status: 'active' }) }), e, ['subscribers']);
  const codes = []; for (let i = 0; i < 7; i++) codes.push((await sub(i)).status);
  assert.ok(codes.slice(0, 5).every((c) => c === 201), JSON.stringify(codes)); assert.equal(codes[6], 429);
  assert.equal((await sub(99, '8.8.8.8')).status, 201, 'other visitors unaffected');
});
