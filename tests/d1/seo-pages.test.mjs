// Crawler view of pages (functions/[[path]].js): medication detail pages get their own title / description / canonical,
// unknown ids and garbage paths are real 404s (not "soft 404" copies of the home page).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const { onRequest } = await import(pathToFileURL(join(ROOT, 'functions/[[path]].js')).href);
const { db } = newDb({ tables: ['er_medications', 'icu_medications', 'peds_medications', 'obgyn_topics', 'otc_conditions', 'clinical_protocols', 'rx_prescriptions', 'courses', 'course_chapters'] });
const env = { DB: mockD1(db), CF_PAGES_COMMIT_SHA: 'test' };
const SHELL = '<!doctype html><html><head><title>NurseHub Egypt | منصة تعليم التمريض</title><meta name="description" content="home" /><meta property="og:url" content="https://nursehubegypt.com/" /></head><body><div id="root"></div></body></html>';
env.ASSETS = { fetch: async () => new Response(SHELL, { headers: { 'content-type': 'text/html' } }) };
const store = new Map();
globalThis.caches = { default: { async match(r) { return store.get(r.url)?.clone(); }, async put(r, res) { store.set(r.url, res.clone()); } } };
const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const get = (path, ua = BOT) => onRequest({
  request: new Request(`https://nursehubegypt.com${path}`, { headers: { 'user-agent': ua, accept: 'text/html' } }),
  env, next: async () => new Response(SHELL, { status: 200, headers: { 'content-type': 'text/html', 'x-spa': '1' } }),
});
const first = (t) => JSON.parse(readFileSync(join(ROOT, 'public/data', `${t}.json`), 'utf8'))[0];

test('ER / ICU / pediatric medication pages: own title, description and canonical for crawlers', async () => {
  for (const [list, table] of [['er-medications', 'er_medications'], ['icu-medications', 'icu_medications'], ['peds-medications', 'peds_medications']]) {
    const row = first(table);
    const r = await get(`/drugs/${list}/${row.id}`);
    const html = await r.text();
    assert.equal(r.status, 200, list);
    assert.equal(r.headers.get('x-seo-injected'), '1', list);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nursehubegypt.com/drugs/${list}/${row.id}" />`));
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.notEqual(title, 'NurseHub Egypt | منصة تعليم التمريض', 'not the home page title');
    assert.ok(!/content="home"/.test(html), 'description replaced');
    assert.match(html, /"@type":"MedicalWebPage"/);
  }
});

test('the reported page er4 now has its drug name in the title', async () => {
  const html = await (await get('/drugs/er-medications/er4')).text();
  assert.match(html, /<title>Anti-Tetanus/);
});

test('unknown medication id and garbage paths are real 404s with noindex', async () => {
  for (const p of ['/drugs/er-medications/does-not-exist', '/drugs/icu-medications/x9999', '/guide/lib/reader/reader/stream/nodejs/ConvertWorker', '/terminology/lib/lib/reader/stream/zlib/stream/DataWorker']) {
    const r = await get(p);
    assert.equal(r.status, 404, p);
    assert.equal(r.headers.get('x-robots-tag'), 'noindex', p);
  }
});

test('topic page keeps its canonical; normal visitors get the app as before', async () => {
  const t = await (await get('/obgyn/obgyn-contraception-methods')).text();
  assert.match(t, /<link rel="canonical" href="https:\/\/nursehubegypt.com\/obgyn\/obgyn-contraception-methods" \/>/);
  const r = await get('/drugs/er-medications/er4', 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile');
  assert.equal(r.status, 200); assert.equal(r.headers.get('x-spa'), '1');
});

test('OTC guide, protocols, prescriptions, courses and chapters: own title / description / canonical; unknown ids 404', async () => {
  const ch = first('course_chapters');
  const cases = [
    [`/drugs/otc-guide/${first('otc_conditions').id}`, first('otc_conditions').name_ar],
    [`/drugs/protocols/${first('clinical_protocols').id}`, first('clinical_protocols').name_ar],
    [`/drugs/prescriptions/${first('rx_prescriptions').id}`, first('rx_prescriptions').condition_ar],
    [`/courses/${first('courses').id}`, first('courses').title_ar.slice(0, 10)],
    [`/courses/${ch.course_id}/chapter/${ch.id}`, ch.title_ar.slice(0, 10)],
  ];
  for (const [path, name] of cases) {
    const r = await get(path);
    const html = await r.text();
    assert.equal(r.status, 200, path);
    assert.equal(r.headers.get('x-seo-injected'), '1', path);
    assert.ok(html.includes(`<link rel="canonical" href="https://nursehubegypt.com${path}" />`), path);
    assert.ok(html.match(/<title>([^<]*)<\/title>/)[1].includes(name), `${path} title has "${name}"`);
    assert.ok(!/content="home"/.test(html), `${path} description replaced`);
  }
  for (const p of ['/drugs/otc-guide/nope', '/drugs/protocols/nope', '/drugs/prescriptions/nope', '/courses/nope', `/courses/${ch.course_id}/chapter/nope`, `/courses/wrong-course/chapter/${ch.id}`]) {
    assert.equal((await get(p)).status, 404, p);
  }
});
