// Nursing care plans (static JSON in public/careplans): data shape, crawler view and real 404s.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const DIR = join(ROOT, 'public/careplans');
const ids = readdirSync(join(DIR, 'plans')).map((f) => f.replace(/\.json$/, ''));

test('index builds and every plan passes the bilingual / column checks', () => {
  execFileSync('node', ['scripts/build-careplans-index.mjs'], { cwd: ROOT });
  const idx = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'));
  assert.equal(idx.plans.length, ids.length);
  assert.ok(ids.length >= 12);
});

test('student plan order: assessment (S/O) → diagnosis → goals → interventions with rationale → evaluation', () => {
  for (const id of ids) {
    const p = JSON.parse(readFileSync(join(DIR, 'plans', `${id}.json`), 'utf8'));
    for (const d of p.student) {
      assert.deepEqual(Object.keys(d), ['diagnosis', 'assessment', 'goals', 'interventions', 'evaluation'], id);
      assert.ok(d.interventions.every((x) => x.rationale.ar && x.rationale.en), `${id}: every intervention has its rationale`);
    }
    for (const r of p.hospital) assert.deepEqual(Object.keys(r), ['diagnosis', 'need', 'actions', 'outcome', 'timeframe'], id);
  }
});

const { onRequest } = await import(pathToFileURL(join(ROOT, 'functions/[[path]].js')).href);
const { db } = newDb();
const SHELL = '<!doctype html><html><head><title>NurseHub Egypt | منصة تعليم التمريض</title><meta name="description" content="home" /></head><body><div id="root"></div></body></html>';
const env = { DB: mockD1(db), CF_PAGES_COMMIT_SHA: 'test' };
env.ASSETS = { fetch: async (req) => {
  const u = new URL(req.url ?? req);
  if (u.pathname.startsWith('/careplans/')) {
    try { return new Response(readFileSync(join(ROOT, 'public', u.pathname)), { headers: { 'content-type': 'application/json' } }); } catch { return new Response('nf', { status: 404 }); }
  }
  return new Response(SHELL, { headers: { 'content-type': 'text/html' } });
} };
const store = new Map();
globalThis.caches = { default: { async match(r) { return store.get(r.url)?.clone(); }, async put(r, res) { store.set(r.url, res.clone()); } } };
const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const get = (path) => onRequest({ request: new Request(`https://nursehubegypt.com${path}`, { headers: { 'user-agent': BOT, accept: 'text/html' } }), env, next: async () => new Response(SHELL, { headers: { 'content-type': 'text/html' } }) });

test('crawlers get the list and each plan with its own title and canonical; unknown plan is a 404', async () => {
  const list = await get('/care-plans');
  assert.equal(list.status, 200);
  const lh = await list.text();
  assert.match(lh, /<title>خطط الرعاية التمريضية/);
  assert.ok(lh.includes('/care-plans/diabetes-type2'));
  const r = await get('/care-plans/diabetes-type2');
  const h = await r.text();
  assert.equal(r.status, 200);
  assert.match(h, /<title>خطة رعاية تمريضية السكري من النوع الثاني/);
  assert.ok(h.includes('<link rel="canonical" href="https://nursehubegypt.com/care-plans/diabetes-type2" />'));
  assert.ok(h.includes('التدخلات التمريضية والمبررات'));
  assert.equal((await get('/care-plans/not-a-plan')).status, 404);
});
