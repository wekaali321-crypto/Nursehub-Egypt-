// /api/tts (Azure Egyptian voice): monthly character budget, edge cache, fallback to the phone's voice, SSML safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const tts = await import(pathToFileURL(join(ROOT, 'functions/api/tts.js')).href);

function fakeCache() {
  const m = new Map();
  globalThis.caches = { default: { async match(r) { const v = m.get(r.url); return v ? new Response(v.body, { headers: v.headers }) : undefined; }, async put(r, res) { m.set(r.url, { body: await res.arrayBuffer(), headers: Object.fromEntries(res.headers) }); } } };
}
const azure = (status = 200) => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(status === 200 ? new Uint8Array([1, 2, 3]) : 'no', { status }); };
  return calls;
};
const env = (extra = {}) => { const { db } = newDb(); return { DB: mockD1(db), db, AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'westeurope', ...extra }; };
const post = (e, body, ip = '1.1.1.1') => tts.onRequestPost({ request: new Request('https://x.test/api/tts', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), env: e });

test('Egyptian male / female voices; the text is escaped inside SSML', async () => {
  fakeCache(); const calls = azure(); const e = env();
  const r = await post(e, { text: 'طيب قولّي <b> & إيه أول حاجة؟', lang: 'ar', gender: 'female' });
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'audio/mpeg');
  assert.match(calls[0].url, /westeurope\.tts\.speech\.microsoft\.com/);
  assert.match(calls[0].init.body, /ar-EG-SalmaNeural/); assert.match(calls[0].init.body, /&lt;b&gt; &amp;/);
  assert.match(tts.ssml('x', 'ar', 'male').body, /ar-EG-ShakirNeural/);
});

test('same sentence again → edge cache: no Azure call, nothing counted', async () => {
  fakeCache(); const calls = azure(); const e = env();
  await post(e, { text: 'صح! برافو.', lang: 'ar', gender: 'male' });
  const before = (await tts.readTtsStatus(e)).used;
  const r = await post(e, { text: 'صح! برافو.', lang: 'ar', gender: 'male' });
  assert.equal(r.status, 200); assert.equal(calls.length, 1);
  assert.equal((await tts.readTtsStatus(e)).used, before);
  assert.equal(before, 'صح! برافو.'.length + 120);
});

test('monthly cap reached → fallback, Azure not called; a new month starts from zero', async () => {
  fakeCache(); const calls = azure(); const e = env({ AZURE_TTS_MONTHLY_CHARS: '300' });
  assert.equal((await post(e, { text: 'a'.repeat(200) })).status, 200); // 320 counted ≥ 300
  const r = await post(e, { text: 'something else' });
  assert.equal(r.status, 429); assert.equal((await r.json()).reason, 'monthly_limit');
  assert.equal(calls.length, 1);
  assert.equal((await tts.readTtsStatus(e, Date.now() + 32 * 86400e3)).tts, true);
});

test('no key / admin switch off / Azure quota error → fallback to the phone voice', async () => {
  fakeCache(); azure();
  assert.equal((await (await post(env({ AZURE_SPEECH_KEY: '' }), { text: 'hi' })).json()).reason, 'tts_unavailable');
  const e = env(); e.db.prepare("INSERT INTO nh_settings (key, value) VALUES ('oral_tts', ?)").run(JSON.stringify({ enabled: false }));
  assert.equal((await (await post(e, { text: 'hi' })).json()).reason, 'tts_off');
  azure(429); const e2 = env();
  assert.equal((await post(e2, { text: 'hello there' })).status, 429);
  assert.equal((await tts.readTtsStatus(e2)).tts, false, 'month marked as spent after Azure said 429');
});

test('text is capped at 700 characters; empty text refused', async () => {
  fakeCache(); const calls = azure(); const e = env();
  await post(e, { text: 'x'.repeat(5000) });
  assert.ok(calls[0].init.body.length < 1000);
  assert.equal((await post(e, { text: '  ' })).status, 400);
});
