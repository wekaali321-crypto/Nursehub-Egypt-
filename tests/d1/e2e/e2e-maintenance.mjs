// Maintenance-gate e2e: no page content may render before the maintenance screen, and the check must not wait for the store bundle.
// Same local stand-in backend as e2e-boot.mjs / e2e-local.mjs (real Pages Function on in-memory SQLite); nothing reaches production.
// Original header: End-to-end, 100% local: the REAL Pages Function code (functions/rest/v1 + functions/_lib/sb.js) on an in-memory SQLite loaded with the
// snapshot data (a D1 stand-in), serving the built app (dist/). Playwright drives Chromium against it; every non-localhost request is blocked,
// so nothing can reach production.
//   VITE_SUPABASE_URL=http://localhost:4180 VITE_SUPABASE_ANON_KEY=anon_key_1234567890_abcdef VITE_ADMIN_EMAIL=admin@test.local npm run build
//   (VITE_ADMIN_EMAIL is a local test address: the admin checks below sign in through the real auth function on the in-memory DB)
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
const { onRequest: onAuth } = await import(pathToFileURL(join(ROOT, 'functions/auth/v1/[[path]].js')).href);

const SNAP = JSON.parse(readFileSync(join(ROOT, 'public/data/manifest.json'), 'utf8')).tables;
const { db } = newDb({ migrate0002: true, tables: Object.keys(SNAP) });
const QUOTA = new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit.");
let quota = false; const d1 = mockD1(db);
// writes (upsert) go through D1 batch(): same semantics as the real binding, on the in-memory DB
d1.batch = async (stmts) => { const out = []; db.exec('BEGIN'); try { for (const st of stmts) out.push(await st.all()); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return out; };
// local-only test credentials for the in-memory DB (not production values)
const ADMIN = { email: 'admin@test.local', password: 'local-only-pass-1' };
const env = { get DB() { return quota ? mockD1(db, { failWith: QUOTA }) : d1; }, JWT_SECRET: 'local-e2e-secret', ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password };
const edge = new Map(); // Cache API stand-in: stores raw bytes so every match() returns a fresh Response (like the real Cache API)
globalThis.caches = { default: {
  async match(r) { const v = edge.get(r.url); return v ? new Response(v.body, { status: v.status, headers: v.headers }) : undefined; },
  async put(r, res) { edge.set(r.url, { body: Buffer.from(await res.arrayBuffer()), status: res.status, headers: [...res.headers] }); },
} };
let rows = 0, stmts = 0; const sqlSeen = [];
const account = () => { for (const q of d1.log.splice(0)) { if (!/^\s*SELECT/i.test(q.sql)) continue; stmts++; sqlSeen.push(q.sql); try { rows += rowsRead(db, q.sql, q.params).reads; } catch { /* ignore */ } } };

// Only the bundle's `articles` query is slow: Chromium allows 6 HTTP/1.1 sockets per host, so delaying all 18 bundle queries would starve every other request (production uses HTTP/2).
const ctl = { delay: 0, slow: new Set(['articles']), fail: new Set(), flagDelay: 0, flagFailGet: false };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4180');
  if (u.pathname.startsWith('/auth/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = await onAuth({ request, env, params: { path: u.pathname.replace('/auth/v1/', '').split('/') } });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (u.pathname.startsWith('/rest/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const waits = [];
    const tbl = u.pathname.replace('/rest/v1/', '').split('/')[0];
    if (ctl.delay && ctl.slow.has(tbl)) await new Promise((r) => setTimeout(r, ctl.delay));
    if (ctl.flagDelay && tbl === 'nh_settings') await new Promise((r) => setTimeout(r, ctl.flagDelay));
    if (ctl.flagFailGet && tbl === 'nh_settings' && req.method === 'GET') { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ code: 'PGRST000', message: 'forced read failure', details: null, hint: null })); return; }
    if (ctl.fail.has(tbl)) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ code: 'PGRST100', message: 'forced failure', details: null, hint: null })); return; }
    const r = await onRequest({ request, env, params: { path: u.pathname.replace('/rest/v1/', '').split('/') }, waitUntil: (p) => waits.push(p) });
    await Promise.all(waits);
    if (process.env.E2E_DEBUG && /dialysis_topics/.test(u.pathname)) console.log('   [rest]', r.status, r.headers.get('x-edge-cache'), u.search.slice(0, 60), 'accept=', req.headers.accept, 'prefer=', req.headers.prefer, 'range=', req.headers.range);
    if (r.status >= 500 && process.env.E2E_DEBUG) console.log('   [503]', req.method, u.pathname + u.search.slice(0, 90));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (/^\/(api|storage|functions)\//.test(u.pathname)) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
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
const MSG = 'صيانة مجدولة — اختبار محلي';
const setFlag = (v) => { edge.clear(); if (v === null) db.prepare(`DELETE FROM nh_settings WHERE key='maintenance'`).run(); else db.prepare(`INSERT OR REPLACE INTO nh_settings (key, value) VALUES ('maintenance', ?)`).run(JSON.stringify(v)); };
// Records, from the very first paint, whether section content or the maintenance screen was ever in the DOM.
const watch = (p) => p.addInitScript(() => {
  window.__seen = { content: 0, maint: 0 }; const t0 = performance.now();
  const check = () => {
    if (!window.__seen.content && document.querySelector('main a[href^="/dialysis/"]')) window.__seen.content = performance.now() - t0 || 1;
    if (!window.__seen.maint && document.body && document.body.innerText.includes('دخول المشرفين')) window.__seen.maint = performance.now() - t0 || 1;
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, characterData: true });
});

try {
  console.log('\nMaintenance-gate e2e (local)\n');
  ctl.delay = BUNDLE_SLOW; // the big bundle is slow in every case: the gate must not depend on it
  // 1. maintenance ON: a store-free section page never shows its content, the maintenance screen comes without waiting for the bundle
  {
    setFlag({ on: true, message: MSG, until: '' });
    const { c, p } = await newPage(); await watch(p); const t0 = Date.now();
    await p.goto(`${U}/dialysis`, { waitUntil: 'commit' });
    await p.waitForSelector(`text=${MSG}`, { timeout: 15000 }); const t = Date.now() - t0;
    await p.waitForTimeout(BUNDLE_SLOW + 1000); // let the bundle arrive too: content must still never appear
    const seen = await p.evaluate(() => window.__seen);
    assert.equal(seen.content, 0, 'section content rendered before/instead of the maintenance screen');
    assert.ok(t < BUNDLE_SLOW - 1500, `maintenance screen at ${t} ms (waited for the bundle?)`);
    assert.ok(await p.isVisible(`text=${MSG}`), 'maintenance screen still shown after the bundle loaded');
    ok('maintenance ON: /dialysis never renders its content; maintenance screen without waiting for the bundle', `${t} ms`);
    await c.close();
  }
  // 2. maintenance OFF (flag check itself a bit slow): content renders without the bundle, maintenance screen never flashes
  {
    setFlag({ on: false }); ctl.flagDelay = 800;
    const { c, p } = await newPage(); await watch(p); const t0 = Date.now();
    await p.goto(`${U}/dialysis`, { waitUntil: 'commit' });
    await p.waitForSelector('header, nav', { timeout: 15000 }); const tHeader = Date.now() - t0;
    await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 15000 }); const t = Date.now() - t0;
    const seen = await p.evaluate(() => window.__seen);
    assert.equal(seen.maint, 0, 'maintenance screen flashed while maintenance is off');
    assert.ok(t < BUNDLE_SLOW - 1500, `section content at ${t} ms`);
    ok('maintenance OFF: shell first, section content without waiting for the bundle, no maintenance flash', `header ${tHeader} ms, content ${t} ms`);
    ctl.flagDelay = 0; await c.close();
  }
  // 3. flag check fails: fail open (an outage must not look like maintenance)
  {
    setFlag(null); ctl.fail.add('nh_settings');
    const { c, p } = await newPage(); await watch(p);
    await p.goto(`${U}/dialysis`, { waitUntil: 'commit' });
    await p.waitForSelector('main a[href^="/dialysis/"]', { timeout: 15000 });
    assert.equal((await p.evaluate(() => window.__seen)).maint, 0);
    ok('flag check fails: the page is shown (fail open)');
    ctl.fail.clear(); await c.close();
  }
  // 4. maintenance ON but the check answers after the 2.5 s timeout: pages stop waiting (fail open), then the late 'on' answer
  //    switches the visitor to the maintenance screen instead of being ignored.
  {
    setFlag({ on: true, message: MSG, until: '' }); ctl.flagDelay = 4000;
    const { c, p } = await newPage(); await watch(p); const t0 = Date.now();
    await p.goto(`${U}/dialysis`, { waitUntil: 'commit' });
    await p.waitForSelector(`text=${MSG}`, { timeout: 15000 }); const t = Date.now() - t0;
    await p.waitForTimeout(500);
    const seen = await p.evaluate(() => window.__seen);
    const contentNow = await p.$('main a[href^="/dialysis/"]');
    assert.ok(seen.maint > 2500, `maintenance screen at ${seen.maint} ms (expected after the 2.5 s timeout)`);
    assert.equal(contentNow, null, 'section content still on screen after the late ON answer');
    ok('timeout + maintenance ON: the late ON answer switches the page to the maintenance screen', `screen at ${t} ms, content shown before it: ${seen.content ? Math.round(seen.content) + ' ms' : 'no'}`);
    ctl.flagDelay = 0; await c.close();
  }
  ctl.delay = 0;
  // 5. admin: the flag read fails while maintenance is ON. The panel warns and disables the switch; saving the message must
  //    not write anything (live re-read fails), and once reads work it saves the message and keeps on:true.
  {
    setFlag({ on: true, message: 'رسالة أصلية', until: '' }); ctl.flagFailGet = true;
    const row = () => JSON.parse(db.prepare(`SELECT value FROM nh_settings WHERE key='maintenance'`).get().value);
    const { c, p } = await newPage();
    await p.goto(`${U}/admin`); await p.waitForSelector('input[type=email]', { timeout: 15000 });
    const [a, b] = (await p.textContent('label:has-text("التحقق الأمني")')).match(/(\d+)\s*\+\s*(\d+)/).slice(1).map(Number);
    await p.fill('input[type=email]', ADMIN.email); await p.fill('input[type=password]', ADMIN.password); await p.fill('form input:not([type])', String(a + b));
    await p.click('form button'); await p.waitForSelector('text=تسجيل الخروج', { timeout: 20000 });
    await p.goto(`${U}/admin/maintenance`);
    await p.waitForSelector('[data-testid=maint-unknown] >> text=تعذّرت قراءة حالة الصيانة', { timeout: 20000 });
    const box = p.locator('input[type=checkbox][aria-label="وضع الصيانة"]');
    assert.equal(await box.isDisabled(), true, 'switch must be disabled while the state is unknown');
    await p.fill('textarea', 'رسالة جديدة'); await p.click('button:has-text("حفظ الإعدادات")');
    await p.waitForSelector('text=تعذّر الحفظ', { timeout: 10000 });
    const r1 = row();
    assert.equal(r1.on, true, 'on:true was turned into on:false by a save after a failed read');
    assert.equal(r1.message, 'رسالة أصلية', 'nothing may be written while the state is unknown');
    ctl.flagFailGet = false;
    await p.click('button:has-text("حفظ الإعدادات")'); await p.waitForSelector('text=تم الحفظ', { timeout: 10000 });
    const r2 = row();
    assert.equal(r2.on, true, 'message-only save changed the switch');
    assert.equal(r2.message, 'رسالة جديدة');
    ok('admin, failed read: warning + switch disabled; message save writes nothing, then (reads OK) saves the message and keeps on:true', JSON.stringify({ afterFailedSave: r1.on, afterRetry: r2 }));
    await c.close();
  }
  console.log(`\n${results.length} maintenance checks passed.\n`);
} finally { await browser.close(); server.close(); }
