// Tarek voice (ElevenLabs) behind /api/tts (oral exam) and /api/ali-reader (site reader):
// one voice for everything, separate monthly counters / caps / per-IP limits, edge cache, safe error handling.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);
const tts = await imp('functions/api/tts.js');
const reader = await imp('functions/api/ali-reader.js');
const lib = await imp('functions/_lib/tarek.js');

function fakeCache() {
  const m = new Map();
  globalThis.caches = { default: { async match(r) { const v = m.get(r.url); return v ? new Response(v.body, { headers: v.headers }) : undefined; }, async put(r, res) { m.set(r.url, { body: await res.arrayBuffer(), headers: Object.fromEntries(res.headers) }); } } };
}
/** ElevenLabs stand-in: status 200 = 3 bytes of "audio"; otherwise a JSON error like the real API. */
const eleven = (status = 200, detail = null) => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (status === 'timeout') { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; }
    if (status === 200) return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
    return new Response(JSON.stringify({ detail: detail ? { status: detail, message: 'secret provider detail' } : 'x' }), { status, headers: { 'content-type': 'application/json' } });
  };
  return calls;
};
const env = (extra = {}) => { const { db } = newDb(); return { DB: mockD1(db), db, ELEVENLABS_API_KEY: 'test-key', ...extra }; };
const post = (mod, e, body, ip = '1.1.1.1') => mod.onRequestPost({ request: new Request('https://x.test/api/x', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), env: e });
const get = async (mod, e) => (await mod.onRequestGet({ request: new Request('https://x.test/api/x'), env: e })).json();

test('Tarek for Arabic and English, gender ignored, key only in the header, MP3 back', async () => {
  fakeCache(); const calls = eleven(); const e = env();
  for (const [text, lang, gender] of [['طيب قولّي، إيه أول حاجة هتعملها مع heart failure؟', 'ar', 'female'], ['What is the first nursing action?', 'en', 'male']]) {
    const r = await post(tts, e, { text, lang, gender });
    assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'audio/mpeg'); assert.equal(r.headers.get('x-voice'), 'Tarek');
  }
  for (const c of calls) {
    assert.match(c.url, /api\.elevenlabs\.io\/v1\/text-to-speech\/ckGEQg6YnSVooU5uDRsF\?output_format=mp3_/);
    assert.equal(c.body.model_id, 'eleven_multilingual_v2');
    assert.equal(c.init.headers['xi-api-key'], 'test-key');
    assert.ok(!JSON.stringify(c.body).includes('test-key'), 'key never in the body');
    assert.ok(c.init.signal, 'request has a timeout signal');
  }
  assert.equal(calls[0].body.text.includes('heart failure'), true, 'English medical terms kept');
});

test('GET status: oral and reader report separately', async () => {
  fakeCache(); eleven(); const e = env();
  await post(tts, e, { text: 'سؤال واحد' });
  await post(reader, e, { text: 'فقرة من مقال عن الضغط', lang: 'ar' });
  await post(reader, e, { text: 'فقرة تانية', lang: 'ar' });
  globalThis.caches = undefined; // status not from the edge cache here
  const o = await get(tts, e), rd = await get(reader, e);
  assert.equal(o.calls, 1); assert.equal(o.used, 'سؤال واحد'.length); assert.equal(o.voice, 'Tarek'); assert.equal(o.limit, 20000);
  assert.equal(rd.calls, 2); assert.equal(rd.used, 'فقرة من مقال عن الضغط'.length + 'فقرة تانية'.length); assert.equal(rd.limit, 8000);
});

test('same sentence again → edge cache: no ElevenLabs call, nothing counted twice (shared cache across oral and reader)', async () => {
  fakeCache(); const calls = eleven(); const e = env();
  await post(tts, e, { text: 'صح! برافو.' });
  const r = await post(tts, e, { text: 'صح! برافو.' });
  const r2 = await post(reader, e, { text: 'صح! برافو.' });
  assert.equal(r.status, 200); assert.equal(r2.status, 200); assert.equal(calls.length, 1);
  globalThis.caches = undefined;
  assert.equal((await get(tts, e)).calls, 1); assert.equal((await get(reader, e)).calls, 0);
});

test('reader cap reached → reader stops, oral exam still speaks (separate quotas)', async () => {
  fakeCache(); const calls = eleven(); const e = env({ SITE_READER_MONTHLY_CHARS: '50' });
  assert.equal((await post(reader, e, { text: 'a'.repeat(45) })).status, 200);
  const r = await post(reader, e, { text: 'b'.repeat(10) }); // 45 + 10 > 50
  assert.equal(r.status, 429); assert.equal((await r.json()).reason, 'monthly_limit');
  assert.equal((await post(tts, e, { text: 'oral still works' })).status, 200);
  assert.equal(calls.length, 2);
});

test('oral cap: env default 20,000, admin setting can only lower it; a new month starts from zero', async () => {
  fakeCache(); eleven(); const e = env({ ELEVENLABS_TTS_MONTHLY_CHARS: '30' });
  e.db.prepare("INSERT INTO nh_settings (key, value) VALUES ('oral_tts', ?)").run(JSON.stringify({ enabled: true, monthlyLimit: 450000 }));
  assert.equal((await lib.readStatus(e, 'oral')).limit, 30, 'old Azure-era 450,000 setting cannot raise the ElevenLabs cap');
  assert.equal((await post(tts, e, { text: 'x'.repeat(25) })).status, 200);
  assert.equal((await post(tts, e, { text: 'x'.repeat(10) })).status, 429);
  assert.equal((await lib.readStatus(e, 'oral', Date.now() + 32 * 86400e3)).tts, true);
  const d = env(); assert.equal((await lib.readStatus(d, 'oral')).limit, 20000);
});

test('per-IP limits are separate: reader 60 parts/hour does not block the oral exam', async () => {
  fakeCache(); eleven(); const e = env({ SITE_READER_MONTHLY_CHARS: '100000' });
  const codes = [];
  for (let i = 0; i < 61; i++) codes.push((await post(reader, e, { text: `part ${i}` }, '9.9.9.9')).status);
  assert.ok(codes.slice(0, 60).every((c) => c === 200)); assert.equal(codes[60], 429);
  assert.equal((await post(tts, e, { text: 'oral from same ip' }, '9.9.9.9')).status, 200);
  assert.equal((await post(reader, e, { text: 'other visitor' }, '8.8.8.8')).status, 200);
});

test('ElevenLabs failures: nothing counted, no provider details leaked; quota_exceeded marks the month', async () => {
  for (const [status, detail, reason, code] of [[401, 'invalid_api_key', 'tts_unavailable', 503], [429, 'too_many_concurrent_requests', 'tts_busy', 503], [500, null, 'tts_error', 503], ['timeout', null, 'tts_timeout', 503]]) {
    fakeCache(); eleven(status, detail); const e = env();
    const r = await post(tts, e, { text: 'hello' });
    const body = await r.text();
    assert.equal(r.status, code, String(status)); assert.equal(JSON.parse(body).reason, reason);
    assert.ok(!body.includes('secret provider detail') && !body.includes('test-key'));
    globalThis.caches = undefined; assert.equal((await get(tts, e)).calls, 0, `nothing counted after ${status}`);
  }
  fakeCache(); eleven(401, 'quota_exceeded'); const e = env();
  assert.equal((await (await post(tts, e, { text: 'hello' })).json()).reason, 'monthly_limit');
  assert.equal((await lib.readStatus(e, 'oral')).tts, false);
});

test('no key / admin switch off / empty text / long text capped and cleaned', async () => {
  fakeCache(); const calls = eleven();
  assert.equal((await (await post(tts, env({ ELEVENLABS_API_KEY: '' }), { text: 'hi' })).json()).reason, 'tts_unavailable');
  const e = env(); e.db.prepare("INSERT INTO nh_settings (key, value) VALUES ('site_reader', ?)").run(JSON.stringify({ enabled: false }));
  assert.equal((await (await post(reader, e, { text: 'hi' })).json()).reason, 'tts_off');
  assert.equal((await post(tts, e, { text: 'still on' })).status, 200, 'reader switch does not turn the oral voice off');
  assert.equal((await post(tts, e, { text: '   ' })).status, 400);
  await post(reader, e, { text: '<b>bold</b> ' + 'y'.repeat(5000) }).catch(() => {});
  await post(tts, env(), { text: 'z'.repeat(5000) });
  const last = calls[calls.length - 1].body.text;
  assert.equal(last.length, 700, 'oral parts capped at 700');
  assert.equal(lib.cleanText('<b>Lasix</b>\u0007 40 mg', 100), 'Lasix 40 mg');
});
