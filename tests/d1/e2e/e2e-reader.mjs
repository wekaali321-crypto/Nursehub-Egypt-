// Site reader + oral exam with the unified Tarek voice — end to end, 100% local.
// The REAL Pages Functions (/rest/v1, /api/tts, /api/ali-reader) run on an in-memory SQLite (D1 stand-in) with the snapshot data;
// ElevenLabs is replaced by a local stand-in (globalThis.fetch) that returns a short MP3. Every non-localhost request is blocked.
//   VITE_SUPABASE_URL=http://localhost:4180 VITE_SUPABASE_ANON_KEY=anon_key_1234567890_abcdef npm run build
//   node --no-warnings tests/d1/e2e/e2e-reader.mjs
import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { ROOT, newDb, mockD1 } from '../helpers.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);
const { onRequest: rest } = await imp('functions/rest/v1/[[path]].js');
const ttsFn = await imp('functions/api/tts.js');
const readerFn = await imp('functions/api/ali-reader.js');

// a 2.5 s MP3 standing in for Tarek's audio
const dir = mkdtempSync(join(tmpdir(), 'tarek-'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=180:duration=2.5', '-af', 'volume=0.6', '-ar', '44100', '-ac', '1', '-b:a', '64k', join(dir, 't.mp3')]);
const MP3 = readFileSync(join(dir, 't.mp3'));

const SNAP = JSON.parse(readFileSync(join(ROOT, 'public/data/manifest.json'), 'utf8')).tables;
const { db } = newDb({ migrate0002: true, tables: Object.keys(SNAP) });
const env = { DB: mockD1(db), ELEVENLABS_API_KEY: 'local-test-key' };
const edge = new Map();
globalThis.caches = { default: {
  async match(r) { const v = edge.get(r.url); return v ? new Response(v.body, { status: v.status, headers: v.headers }) : undefined; },
  async put(r, res) { edge.set(r.url, { body: Buffer.from(await res.arrayBuffer()), status: res.status, headers: [...res.headers] }); },
} };
// ElevenLabs stand-in: records every request; `elevenMode` switches to failures
let elevenMode = 'ok';
const elevenCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith('https://api.elevenlabs.io/')) return realFetch(url, init);
  elevenCalls.push({ url: String(url), body: JSON.parse(init.body), key: init.headers['xi-api-key'] });
  if (elevenMode === 'quota') return new Response(JSON.stringify({ detail: { status: 'quota_exceeded' } }), { status: 401, headers: { 'content-type': 'application/json' } });
  await new Promise((r) => setTimeout(r, 120));
  return new Response(MP3, { status: 200, headers: { 'content-type': 'audio/mpeg' } });
};

const apiLog = [];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4180');
  const body = async () => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c); };
  const send = async (r) => { res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); };
  if (u.pathname.startsWith('/rest/v1/')) {
    const b = await body();
    const request = new Request(u.href, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : b });
    const waits = [];
    const r = await rest({ request, env, params: { path: u.pathname.replace('/rest/v1/', '').split('/') }, waitUntil: (p) => waits.push(p) });
    await Promise.all(waits); return send(r);
  }
  if (u.pathname === '/api/tts' || u.pathname === '/api/ali-reader') {
    const fn = u.pathname === '/api/tts' ? ttsFn : readerFn;
    const b = req.method === 'POST' ? await body() : null;
    const request = new Request(u.href, { method: req.method, headers: { ...req.headers, 'cf-connecting-ip': '127.0.0.1' }, body: b });
    if (b) apiLog.push({ path: u.pathname, ...JSON.parse(b.toString()) });
    return send(await (req.method === 'POST' ? fn.onRequestPost({ request, env }) : fn.onRequestGet({ request, env })));
  }
  if (/^\/(auth|api|storage|functions)\//.test(u.pathname)) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
  const DIST = join(ROOT, 'dist');
  let f = join(DIST, u.pathname); if (!existsSync(f) || !statSync(f).isFile()) f = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4180, r));

const U = 'http://localhost:4180';
const results = [];
const ok = (name, detail = '') => { results.push(name); console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); };
const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
async function ctx(opts = {}) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block', locale: 'ar-EG', ...opts });
  await c.route('**/*', (route) => (new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort()));
  await c.addInitScript(() => {
    // count any use of the phone's own voice (must stay 0) and of <audio>.play()
    window.__phoneVoice = 0; window.__plays = 0;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => { window.__phoneVoice++; };
    const p = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) { if (!String(this.src).startsWith('data:')) window.__plays++; return p.apply(this, a); };
    try { localStorage.setItem('nh_oral_hint', '1'); } catch { /* ignore */ }
  });
  return c;
}
const readerPosts = () => apiLog.filter((x) => x.path === '/api/ali-reader');
const usage = (prefix) => db.prepare("SELECT key, value FROM nh_settings WHERE key LIKE ?").all(`${prefix}%`).map((r) => JSON.parse(r.value));
const article = JSON.parse(readFileSync(join(ROOT, 'public/data/articles.json'), 'utf8')).filter((a) => a.status === 'published' && a.content).sort((a, b) => b.content.length - a.content.length)[0];
const LISTEN = 'button:has-text("استمع للمحتوى")';

try {
  console.log('\nE2E — Tarek voice: site reader + oral exam (local)\n');

  // 1. no autoplay: a page sits open, nothing is fetched or played
  {
    const c = await ctx(); const p = await c.newPage();
    await p.goto(`${U}/article/${article.slug}`); await p.waitForSelector('main h1', { timeout: 30000 }); await p.waitForTimeout(2500);
    assert.equal(readerPosts().length, 0); assert.equal(await p.evaluate(() => window.__plays), 0);
    assert.equal(await p.locator(LISTEN).count(), 1, 'the listen button is there');
    assert.equal(await p.locator('#main-content').getByText('استمع للمحتوى').count(), 0, 'button is outside #main-content');
    ok('no audio and no voice request until the visitor taps "استمع للمحتوى"');

    // 2. long Arabic article: read in order, in parts ≤ 1000 chars, no navbar / footer / buttons
    await p.click(LISTEN);
    await p.waitForSelector('text=Tarek بيقرأ', { timeout: 15000 });
    const posts = readerPosts();
    assert.ok(posts.length >= 1); for (const x of posts) assert.ok(x.text.length <= 1000, String(x.text.length));
    const first = posts[0].text;
    const h1 = (await p.locator('main h1').first().innerText()).trim();
    assert.ok(first.startsWith(h1.slice(0, 12)), `starts with the title: ${first.slice(0, 60)}`);
    const navText = (await p.locator('nav').first().innerText()).split('\n').map((s) => s.trim()).filter((s) => s.length > 3);
    for (const n of navText.slice(0, 8)) assert.ok(!first.startsWith(n) || h1.includes(n), `navbar text read: ${n}`);
    assert.ok(!posts.some((x) => /استمع للمحتوى|إيقاف مؤقت|Listen to this page/.test(x.text)), 'reader controls never read');
    const parts = Number((await p.locator('text=/جزء \\d+ من \\d+/').innerText()).match(/من (\d+)/)[1]);
    assert.ok(parts >= 10, `long article split into ${parts} parts`);
    assert.ok(posts.length <= 2, 'only the current part and the next one are requested (not the whole page at once)');
    ok('long Arabic article read in order, starting with its title', `${parts} parts, ${posts.length} requested so far, max part ${Math.max(...posts.map((x) => x.text.length))} chars`);

    // 3. pause / resume / stop
    await p.click('button:has-text("إيقاف مؤقت")'); await p.waitForSelector('text=متوقف مؤقتًا');
    await p.click('button:has-text("متابعة")'); await p.waitForSelector('text=Tarek بيقرأ');
    await p.locator('[role=region]').getByRole('button', { name: 'إيقاف', exact: true }).click(); await p.waitForTimeout(300);
    assert.equal(await p.locator('[role=region][aria-label="قارئ الصفحة"]').count(), 0);
    ok('pause → resume → stop work; the player closes on stop');

    // 4. navigation while reading stops the audio
    await p.click(LISTEN); await p.waitForSelector('text=Tarek بيقرأ', { timeout: 15000 });
    const before = readerPosts().length;
    await p.evaluate(() => { window.history.pushState({}, '', '/drugs'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await p.waitForTimeout(1500);
    assert.equal(await p.locator('[role=region][aria-label="قارئ الصفحة"]').count(), 0, 'player gone after navigation');
    await p.waitForTimeout(2500);
    assert.ok(readerPosts().length <= before + 1, 'no more parts requested after leaving the page');
    assert.equal(await p.evaluate(() => window.__phoneVoice), 0);
    ok('leaving the page stops the reading (no further parts, player closed)');
    await c.close();
  }

  // 5. drug page: English medical terms kept as written
  {
    const drug = JSON.parse(readFileSync(join(ROOT, 'public/data/drugs.json'), 'utf8')).find((d) => d.slug === 'olfen') ?? JSON.parse(readFileSync(join(ROOT, 'public/data/drugs.json'), 'utf8'))[0];
    const c = await ctx(); const p = await c.newPage(); const n0 = readerPosts().length;
    await p.goto(`${U}/drug/${drug.slug}`); await p.waitForSelector('main h1', { timeout: 30000 }); await p.waitForTimeout(800);
    await p.click(LISTEN); await p.waitForSelector('text=Tarek بيقرأ', { timeout: 15000 });
    const sent = readerPosts().slice(n0).map((x) => x.text).join(' ');
    const term = (drug.generic_name || drug.name).split(/[ ,(]/)[0];
    assert.ok(sent.includes(term), `English term "${term}" kept: ${sent.slice(0, 120)}`);
    ok('drug page: English names kept for Tarek to read', `"${term}"`);
    await c.close();
  }

  // 6. mobile: player sits above the bottom nav and inside the screen; exam button hidden meanwhile
  {
    const c = await ctx({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage();
    await p.goto(`${U}/article/${article.slug}`); await p.waitForSelector('main h1', { timeout: 30000 });
    await p.tap(LISTEN); await p.waitForSelector('text=Tarek بيقرأ', { timeout: 15000 });
    const player = await p.locator('[role=region][aria-label="قارئ الصفحة"]').boundingBox();
    const nav = await p.locator('nav.fixed, nav[class*="bottom-0"]').last().boundingBox();
    assert.ok(player.x >= 0 && player.x + player.width <= 390, 'inside the screen width');
    if (nav) assert.ok(player.y + player.height <= nav.y + 1, `above the bottom nav (${player.y + player.height} ≤ ${nav.y})`);
    assert.equal(await p.locator('button[aria-label^="امتحان شفوي مع"]').count(), 0, 'exam button hidden while the reader is open');
    await p.screenshot({ path: join(dir, 'mobile-reader.png') });
    ok('mobile: player above the bottom navigation, nothing hidden behind it', `screenshot ${join(dir, 'mobile-reader.png')}`);
    await c.close();
  }

  // 7. oral exam: Tarek voice through /api/tts, students' spoken answers + results unchanged; separate counters
  {
    const c = await ctx();
    await c.addInitScript(() => {
      const Rec = function () { const r = this; r.start = () => setTimeout(() => { r.onresult && r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'B' }], { isFinal: true })] }); setTimeout(() => r.onend && r.onend(), 50); }, 200); r.stop = () => r.onend && r.onend(); };
      window.SpeechRecognition = Rec; window.webkitSpeechRecognition = Rec;
    });
    const p = await c.newPage(); const t0 = apiLog.filter((x) => x.path === '/api/tts').length;
    await p.goto(`${U}/ecg`); await p.waitForTimeout(1500);
    await p.click('button[aria-label^="امتحان شفوي مع"]');
    await p.waitForSelector('text=✓ الصوت: Tarek', { timeout: 15000 });
    await p.click('text=مجاني (بنك الأسئلة)');
    await p.selectOption('select >> nth=0', '3').catch(() => {});
    await p.click('text=ابدأ الامتحان');
    await p.waitForSelector('text=/(صح|غلط)/', { timeout: 40000 });
    const ttsPosts = apiLog.filter((x) => x.path === '/api/tts').slice(t0);
    assert.ok(ttsPosts.length >= 2, 'examiner lines spoken by Tarek');
    assert.equal(await p.evaluate(() => window.__phoneVoice), 0, 'phone voice never used');
    assert.ok(elevenCalls.every((x) => /ckGEQg6YnSVooU5uDRsF/.test(x.url) && x.body.model_id === 'eleven_multilingual_v2' && x.key === 'local-test-key'));
    await p.click('text=إنهاء'); await p.waitForSelector('text=امتحان جديد');
    const hist = await p.evaluate(() => JSON.parse(localStorage.getItem('nh_exam_history_v1') || '[]'));
    assert.ok(hist[0]?.group === 'oral' && hist[0].total >= 1, 'result saved as before');
    const oralUse = usage('tts_usage:'), readUse = usage('reader_usage:');
    assert.ok(oralUse[0]?.chars > 0 && readUse[0]?.chars > 0, 'both counters used');
    ok('oral exam: Tarek speaks, spoken answer recognised, result saved; counters separate', `oral ${oralUse[0].chars} chars / reader ${readUse[0].chars} chars`);

    // 8. Tarek unavailable mid-way → clear notice, exam goes on as text, still no phone voice
    elevenMode = 'quota'; edge.clear();
    db.prepare("DELETE FROM nh_settings WHERE key LIKE 'tts_usage:%'").run();
    const p2 = await c.newPage();
    await p2.goto(`${U}/ecg`); await p2.waitForTimeout(1200);
    await p2.click('button[aria-label^="امتحان شفوي مع"]');
    await p2.click('text=مجاني (بنك الأسئلة)'); await p2.click('text=ابدأ الامتحان');
    await p2.waitForSelector('text=/صوت Tarek|رصيد صوت Tarek/', { timeout: 20000 });
    await p2.waitForSelector('text=/(صح|غلط)/', { timeout: 40000 });
    assert.equal(await p2.evaluate(() => window.__phoneVoice), 0);
    ok('voice unavailable → notice shown, exam continues as text, no substitute voice');
    elevenMode = 'ok';
    await c.close();
  }

  console.log(`\n${results.length} checks passed`);
} catch (e) {
  console.error('\nFAIL:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close(); server.close();
}
