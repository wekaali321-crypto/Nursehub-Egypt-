// Boot-experience e2e (skeleton / non-blocking first paint). Same local stand-in backend as e2e-local.mjs; nothing reaches production.
// Original header: End-to-end, 100% local: the REAL Pages Function code (functions/rest/v1 + functions/_lib/sb.js) on an in-memory SQLite loaded with the
// snapshot data (a D1 stand-in), serving the built app (dist/). Playwright drives Chromium against it; every non-localhost request is blocked,
// so nothing can reach production.
//   VITE_SUPABASE_URL=http://localhost:4180 VITE_SUPABASE_ANON_KEY=anon_key_1234567890_abcdef npm run build
//   node --no-warnings tests/d1/e2e/e2e-local.mjs
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { ROOT, newDb, mockD1, rowsRead } from '../helpers.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { onRequest } = await import(pathToFileURL(join(ROOT, 'functions/rest/v1/[[path]].js')).href);

const SNAP = JSON.parse(readFileSync(join(ROOT, 'public/data/manifest.json'), 'utf8')).tables;
const { db } = newDb({ migrate0002: true, tables: Object.keys(SNAP) });
const QUOTA = new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");
let quota = false; const d1 = mockD1(db);
const env = { get DB() { return quota ? mockD1(db, { failWith: QUOTA }) : d1; } };
const edge = new Map(); // Cache API stand-in: stores raw bytes so every match() returns a fresh Response (like the real Cache API)
globalThis.caches = { default: {
  async match(r) { const v = edge.get(r.url); return v ? new Response(v.body, { status: v.status, headers: v.headers }) : undefined; },
  async put(r, res) { edge.set(r.url, { body: Buffer.from(await res.arrayBuffer()), status: res.status, headers: [...res.headers] }); },
} };
let rows = 0, stmts = 0; const sqlSeen = [];
const account = () => { for (const q of d1.log.splice(0)) { if (!/^\s*SELECT/i.test(q.sql)) continue; stmts++; sqlSeen.push(q.sql); try { rows += rowsRead(db, q.sql, q.params).reads; } catch { /* ignore */ } } };

// Only the bundle's `articles` query is slow: Chromium allows 6 HTTP/1.1 sockets per host, so delaying all 18 bundle queries would starve every other request (production uses HTTP/2).
const ctl = { delay: 0, slow: new Set(['articles']), fail: new Set() };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4180');
  if (u.pathname.startsWith('/rest/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const waits = [];
    const tbl = u.pathname.replace('/rest/v1/', '').split('/')[0];
    if (ctl.delay && ctl.slow.has(tbl)) await new Promise((r) => setTimeout(r, ctl.delay));
    if (ctl.fail.has(tbl)) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ code: 'PGRST100', message: 'forced failure', details: null, hint: null })); return; }
    const r = await onRequest({ request, env, params: { path: u.pathname.replace('/rest/v1/', '').split('/') }, waitUntil: (p) => waits.push(p) });
    await Promise.all(waits);
    if (process.env.E2E_DEBUG && /dialysis_topics/.test(u.pathname)) console.log('   [rest]', r.status, r.headers.get('x-edge-cache'), u.search.slice(0, 60), 'accept=', req.headers.accept, 'prefer=', req.headers.prefer, 'range=', req.headers.range);
    if (r.status >= 500 && process.env.E2E_DEBUG) console.log('   [503]', req.method, u.pathname + u.search.slice(0, 90));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (/^\/(auth|api|storage|functions)\//.test(u.pathname)) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
  if (process.env.E2E_DEBUG && u.pathname.startsWith('/data/')) console.log('   [data]', u.pathname, existsSync(join(ROOT, 'dist', u.pathname)));
  const DIST = process.env.DIST_DIR || join(ROOT, 'dist');
  let f = join(DIST, u.pathname); if (!existsSync(f) || !statSync(f).isFile()) f = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4180, r));

if (process.argv.includes('--serve')) { console.log('serving on http://localhost:4180 (local stand-in backend); Ctrl+C to stop'); await new Promise(() => {}); }
const results = [];

const ok = (name, detail = '') => { results.push(name); console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); };
const browser = await chromium.launch();
const newPage = async (viewport = { width: 1280, height: 800 }) => {
  const c = await browser.newContext({ viewport, serviceWorkers: 'block' });
  await c.route('**/*', (route) => (new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()));
  const p = await c.newPage();
  if (process.env.E2E_DEBUG) { const t = Date.now(); p.on('request', (r) => r.url().includes('/rest/v1/') && console.log('   [req +' + (Date.now() - t) + ']', r.url().split('/rest/v1/')[1].slice(0, 60))); p.on('pageerror', (e) => console.log('   [pageerror]', e.message.slice(0, 160))); }
  await p.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {} });
  return { c, p };
};
const idbKeys = (page) => page.evaluate(() => new Promise((resolve) => { const r = indexedDB.open('nh_cache', 1); r.onerror = () => resolve([]); r.onupgradeneeded = () => {}; r.onsuccess = () => { try { const tx = r.result.transaction('kv', 'readonly'); const k = tx.objectStore('kv').getAllKeys(); k.onsuccess = () => resolve(k.result); k.onerror = () => resolve([]); } catch { resolve([]); } }; }));
const U = 'http://localhost:4180';
const BUNDLE_SLOW = 6000;
const firstTopic = JSON.parse(readFileSync(join(ROOT, 'public/data/dialysis_topics.json'), 'utf8'))[0].id;
const SECTION_TABLES = ['dialysis_topics', 'fundamentals_topics'];
const HEADER = 'header, nav'; // the shared layout

try {
  console.log('\nBoot-experience e2e (local)\n');
  // 1. normal load
  {
    const { c, p } = await newPage(); const t0 = Date.now();
    await p.goto(U + '/', { waitUntil: 'commit' });
    await p.waitForSelector(HEADER, { timeout: 15000 }); const tHeader = Date.now() - t0;
    await p.waitForSelector('main h1, main h2, main a', { timeout: 30000 });
    await p.waitForTimeout(1500);
    const cls = await p.evaluate(() => window.__cls);
    const spinner = await p.evaluate(() => document.body.innerText.includes('جارٍ التحميل...'));
    assert.equal(spinner, false);
    assert.ok(cls < 0.25, 'CLS ' + cls);
    ok('normal load: header first, then content', `header after ${tHeader} ms, layout shift ${cls.toFixed(3)}`);
    await c.close();
  }
  // 2. slow bundle
  {
    ctl.delay = BUNDLE_SLOW;
    {
      const { c, p } = await newPage(); const t0 = Date.now();
      await p.goto(U + '/', { waitUntil: 'commit' });
      await p.waitForSelector(HEADER, { timeout: 15000 }); const tHeader = Date.now() - t0;
      await p.waitForSelector('[role=status][aria-busy=true]', { timeout: 15000 }); const tSkel = Date.now() - t0;
      assert.ok(tSkel < BUNDLE_SLOW - 1500, `skeleton at ${tSkel} ms`);
      const txt = await p.evaluate(() => document.body.innerText.includes('جارٍ التحميل...'));
      assert.equal(txt, false, 'old blocking spinner must be gone');
      ok('slow data (6 s): header + skeleton appear immediately instead of a blank screen', `header ${tHeader} ms, skeleton ${tSkel} ms`);
      await c.close();
    }
    {
      const { c, p } = await newPage(); const t0 = Date.now();
      await p.goto(`${U}/dialysis`, { waitUntil: 'commit' });
      await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 15000 }); const t = Date.now() - t0;
      assert.ok(t < BUNDLE_SLOW - 1500, `section page ready at ${t} ms`);
      assert.equal(await p.$('[role=status][aria-busy=true]'), null);
      ok('slow bundle: a section page renders its own content without waiting for the bundle', `${t} ms`);
      await p.goto(`${U}/dialysis/${firstTopic}`, { waitUntil: 'commit' });
      await p.waitForSelector('main h2', { timeout: 15000 });
      ok('slow bundle: a topic page renders without waiting for the bundle');
      await c.close();
    }
    ctl.delay = 0;
  }
  // 3. one query fails
  {
    ctl.fail.add('articles');
    const { c, p } = await newPage();
    await p.goto(U + '/', { waitUntil: 'commit' });
    await p.waitForSelector('main h1, main h2, main a', { timeout: 30000 }); await p.waitForTimeout(2000);
    assert.ok((await p.$$('main a')).length > 0, 'home still shows links');
    await p.goto(`${U}/dialysis`); await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 30000 });
    const keys = await idbKeys(p);
    assert.ok(!keys.includes('public_bundle_v1'), 'partial bundle must not be cached: ' + JSON.stringify(keys));
    ok('one failing query: home and sections still render; the partial bundle is not cached', `cache keys: ${keys.length}`);
    ctl.fail.clear(); await c.close();
  }
  // 4. D1 quota exhausted, cold edge, phone width
  {
    quota = true; edge.clear();
    const { c, p } = await newPage({ width: 375, height: 812 }); const t0 = Date.now();
    await p.goto(U + '/', { waitUntil: 'commit' });
    await p.waitForSelector(HEADER, { timeout: 15000 }); const tHeader = Date.now() - t0;
    await p.waitForSelector('main h1, main h2, main a', { timeout: 30000 }); const tMain = Date.now() - t0;
    assert.ok(tMain < 8000, `home during quota outage took ${tMain} ms`);
    await p.goto(`${U}/dialysis`); await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 30000 });
    await p.waitForTimeout(1500);
    const keys = await idbKeys(p);
    assert.equal(keys.length, 0, 'IndexedDB must stay empty during the outage: ' + JSON.stringify(keys));
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow on phone width');
    ok('D1 quota exhausted (phone width): shell and content from the snapshot, nothing cached as fresh', `header ${tHeader} ms, content ${tMain} ms`);
    quota = false; await c.close();
  }
  console.log(`\n${results.length} boot checks passed.\n`);
} finally { await browser.close(); server.close(); }
