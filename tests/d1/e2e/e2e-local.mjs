// End-to-end, 100% local: the REAL Pages Function code (functions/rest/v1 + functions/_lib/sb.js) on an in-memory SQLite loaded with the
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

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4180');
  if (u.pathname.startsWith('/rest/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const waits = [];
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
const ok = (name, detail = '') => { results.push([name, detail]); console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); };
const mark = () => { account(); return { rows, stmts, n: sqlSeen.length }; };
const since = (m) => { account(); return { rows: rows - m.rows, stmts: stmts - m.stmts, sql: sqlSeen.slice(m.n) }; };

const browser = await chromium.launch();
async function ctx() {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await c.route('**/*', (route) => (new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()));
  return c;
}
const idbKeys = (page) => page.evaluate(() => new Promise((resolve) => { const r = indexedDB.open('nh_cache', 1); r.onerror = () => resolve([]); r.onupgradeneeded = () => {}; r.onsuccess = () => { try { const q = r.result.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = () => resolve(q.result); q.onerror = () => resolve([]); } catch { resolve([]); } }; }));
const U = 'http://localhost:4180';
const firstTopic = JSON.parse(readFileSync(join(ROOT, 'public/data/dialysis_topics.json'), 'utf8'))[0].id;

try {
  console.log('\nE2E (local D1 stand-in)\n');
  // 1. normal operation: topic page = one primary-key read; no whole-table read of the section
  {
    const c = await ctx(); const p = await c.newPage(); const m = mark();
    await p.goto(`${U}/dialysis/${firstTopic}`); await p.waitForSelector('main h2', { timeout: 30000 });
    const d = since(m);
    const topicSql = d.sql.filter((s) => /FROM "dialysis_topics"/.test(s));
    assert.equal(topicSql.length, 1, topicSql.join('\n'));
    assert.match(topicSql[0], /WHERE .*"id" = \?/);
    assert.doesNotMatch(topicSql[0], /ORDER BY/);
    ok('topic page renders and reads dialysis_topics by primary key', `1 statement on the section table; page total ${d.stmts} statements / ~${d.rows} rows`);

    // 2. hub list is cached after the first visit; reload does not query the section again
    const m2 = mark(); await p.goto(`${U}/dialysis`); await p.waitForSelector('main a[href^="/dialysis/"]'); const first = since(m2);
    const m3 = mark(); await p.reload(); await p.waitForSelector('main a[href^="/dialysis/"]'); await p.waitForTimeout(500); const second = since(m3);
    assert.equal(second.sql.filter((s) => /FROM "dialysis_topics"/.test(s)).length, 0);
    assert.ok(second.stmts < first.stmts || second.stmts === 0);
    ok('section hub: second visit served from the client cache', `1st ${first.stmts} stmts, 2nd ${second.stmts} stmts`);
    await c.close();
  }
  // 3. travel hub: grouped counts, no per-category HEAD counts; category page: one query
  {
    const c = await ctx(); const p = await c.newPage(); let m = mark();
    await p.goto(`${U}/travel-questions`); await p.waitForSelector('main h1'); await p.waitForTimeout(1500);
    const d = since(m);
    const tq = d.sql.filter((s) => /travel_questions/.test(s));
    assert.equal(tq.length, 1, tq.join('\n')); assert.match(tq[0], /GROUP BY category_id/);
    ok('travel hub: ONE grouped count statement (was 12 HEAD counts, each running SELECT + COUNT)', `~${d.rows} rows`);
    m = mark(); await p.goto(`${U}/travel-questions/medsurg`); await p.waitForSelector('main h1'); await p.waitForTimeout(2500);
    const e = since(m); const cat = e.sql.filter((s) => /FROM "travel_questions"/.test(s) && !/GROUP BY/.test(s));
    assert.equal(cat.length, 1); assert.match(cat[0], /category_id" = \?/); assert.match(cat[0], /LIMIT 5000/);
    ok('travel category page: one indexed query for the whole category', `~${e.rows} rows`);
    // 4. global search: no database scan of travel_questions
    m = mark(); await p.goto(`${U}/search?q=heparin`); await p.waitForSelector('main h1'); await p.waitForTimeout(3500);
    const s = since(m); assert.equal(s.sql.filter((q) => /travel_questions/.test(q)).length, 0);
    ok('global search never queries travel_questions in the database', `page total ${s.stmts} statements / ~${s.rows} rows`);
    await c.close();
  }
  // 5a. quota exhausted but the edge cache is warm (public tables are cached for 10 min): visitors do not even notice
  {
    quota = true;
    const c = await ctx(); const p = await c.newPage();
    await p.goto(`${U}/dialysis`); await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 30000 });
    const flag = await p.evaluate(() => sessionStorage.getItem('nh_sb_down'));
    assert.equal(flag, null, 'edge cache answered; the fallback was not needed');
    ok('quota exhausted + warm edge cache: pages are served from the edge cache (no fallback needed)');
    await c.close();
  }
  // 5b. quota exhausted and a cold edge: pages keep working from the snapshot, nothing is cached as fresh, then D1 returns
  {
    quota = true; edge.clear();
    const c = await ctx(); const p = await c.newPage();
    if (process.env.E2E_DEBUG) { p.on('console', (m) => m.type() === 'error' && !/503/.test(m.text()) && console.log('   [console]', m.text().slice(0, 200))); p.on('requestfailed', (r) => console.log('   [reqfailed]', r.url().slice(0, 100))); }
    p.on('pageerror', (e) => console.log('   [pageerror]', String(e.message).slice(0, 300)));
    p.on('console', (m) => { if (process.env.E2E_DEBUG && m.type() !== 'error') console.log('   [log]', m.text().slice(0, 160)); });
    const pend = new Map(); p.on('request', (r) => pend.set(r, r.url())); p.on('requestfinished', (r) => pend.delete(r)); p.on('requestfailed', (r) => { console.log('   [failed]', r.url().slice(0, 90), r.failure()?.errorText); pend.delete(r); });
    await p.goto(`${U}/dialysis`);
    const t0 = Date.now();
    try { await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: Number(process.env.E2E_WAIT || 30000) }); console.log(`   [timing] outage page ready after ${Date.now() - t0} ms`); } catch (e) { console.log('   [dump]', JSON.stringify({ text: (await p.innerText('main')).slice(0, 300), flag: await p.evaluate(() => sessionStorage.getItem('nh_sb_down')), idb: await idbKeys(p), pending: [...pend.values()].map((u) => u.slice(0, 90)) })); throw e; }
    const cards = await p.$$eval('main a[href^="/dialysis/"]', (a) => a.length);
    assert.ok(cards >= 10, `cards ${cards}`);
    await p.goto(`${U}/dialysis/${firstTopic}`); await p.waitForSelector('main h2', { timeout: 30000 });
    await p.goto(`${U}/fundamentals`); await p.waitForSelector('main a[href^="/fundamentals/"]', { timeout: 30000 });
    await p.waitForTimeout(1500);
    const keys = await idbKeys(p);
    assert.equal(keys.length, 0, `IndexedDB must stay empty during the outage, found ${JSON.stringify(keys)}`);
    ok('quota exhausted: hub, topic and another section render from the static snapshot; IndexedDB stays empty', `${cards} cards`);

    quota = false;
    await p.evaluate(() => sessionStorage.removeItem('nh_sb_down')); // the 10-minute window has passed
    const m = mark(); await p.goto(`${U}/dialysis`); await p.waitForSelector('main a[href^="/dialysis/"]'); await p.waitForTimeout(1500);
    const back = since(m); assert.ok(back.sql.some((s) => /dialysis_topics/.test(s)), 'live data is read again');
    const keys2 = await idbKeys(p); assert.ok(keys2.some((k) => String(k).startsWith('topics_v1_dialysis')), JSON.stringify(keys2));
    ok('D1 back: live reads resume and the client cache is populated with real data', `${keys2.length} cache keys`);
    await c.close();
  }
  console.log(`\n${results.length} end-to-end checks passed.\n`);
} finally { await browser.close(); server.close(); }
