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

test('format 2: one form per nursing diagnosis, columns in order, every intervention has its rationale', () => {
  let v2 = 0;
  for (const id of ids) {
    const p = JSON.parse(readFileSync(join(DIR, 'plans', `${id}.json`), 'utf8'));
    if (!Array.isArray(p.diagnoses)) continue; // older format, still accepted until rewritten
    v2++;
    for (const d of p.diagnoses) {
      for (const k of ['title', 'definition', 'relatedTo', d.kind === 'risk' ? 'riskFactors' : 'evidencedBy', 'assessment', 'goals', 'interventions', 'evaluation', 'hospital']) assert.ok(d[k], `${id}/${d.id}: ${k}`);
      assert.ok(d.goals.short.ar.length && d.goals.long.ar.length, `${id}/${d.id}: short and long goals`);
      assert.ok(d.interventions.length >= 6 && d.interventions.every((x) => x.rationale.ar && x.rationale.en), `${id}/${d.id}: interventions with rationale`);
      assert.ok(d.evaluation.every((e) => ['met', 'partial', 'not'].includes(e.status)), `${id}/${d.id}: evaluation status`);
    }
  }
  assert.ok(v2 >= 2, 'heart failure and VAP use format 2');
  const hf = JSON.parse(readFileSync(join(DIR, 'plans', 'heart-failure.json'), 'utf8'));
  assert.ok(hf.diagnoses.length >= 6, 'heart failure has 6–8 diagnoses');
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

test('crawlers: list, each diagnosis as its own page with title and canonical; unknown plan or diagnosis is a 404', async () => {
  const list = await get('/care-plans');
  assert.equal(list.status, 200);
  const lh = await list.text();
  assert.match(lh, /<title>خطط الرعاية التمريضية/);
  assert.ok(lh.includes('/care-plans/heart-failure/excess-fluid-volume'));
  const r = await get('/care-plans/heart-failure/excess-fluid-volume');
  const h = await r.text();
  assert.equal(r.status, 200);
  assert.match(h, /<title>زيادة حجم السوائل — خطة رعاية تمريضية هبوط القلب/);
  assert.ok(h.includes('<link rel="canonical" href="https://nursehubegypt.com/care-plans/heart-failure/excess-fluid-volume" />'));
  assert.ok(h.includes('التدخلات التمريضية والمبررات') && h.includes('مرتبط بـ'));
  assert.equal((await get('/care-plans/heart-failure')).status, 200, 'plan page = first diagnosis');
  const old = await get('/care-plans/hypertension/dx-3');
  assert.equal(old.status, 301, 'numbered pages of rewritten plans move to the plan');
  assert.match(old.headers.get('location') || '', /\/care-plans\/hypertension$/);
  const g = await get('/care-plans/guide/nursing-process');
  assert.equal(g.status, 200);
  const gh = await g.text();
  assert.match(gh, /<title>دليل العملية التمريضية/);
  assert.ok(gh.includes('ADPIE') && gh.includes('<table>'), 'guide content is in the HTML for crawlers');
  assert.equal((await get('/care-plans/guide/not-a-guide')).status, 404);
  assert.ok(lh.includes('/care-plans/guide/care-plan'), 'hub links the guides');
  assert.equal((await get('/care-plans/not-a-plan')).status, 404);
  assert.equal((await get('/care-plans/heart-failure/not-a-diagnosis')).status, 404);
});
