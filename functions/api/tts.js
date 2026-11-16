// Cloudflare Pages Function: /api/tts — Ali's Egyptian voice (Microsoft Azure Speech, neural ar-EG voices).
//   GET  /api/tts                                  → { tts, enabled, used, limit, pct, month }   (cached ~60 s per colo)
//   POST /api/tts { text, lang: 'ar'|'en', gender: 'male'|'female' } → audio/mpeg
// Azure's free tier (F0) = 500,000 characters a month for neural voices. Characters used are counted in ONE nh_settings row
// per month (key tts_usage:YYYY-MM); the default cap is 450,000 (AZURE_TTS_MONTHLY_CHARS) to keep a margin. At the cap, when
// the key is missing, or when Azure refuses, the answer is 429|503 { fallback: true } and the page uses the phone's own voice.
// Same sentence + same voice → served from the edge cache (no Azure call, nothing counted, no D1 write).
// Secrets (Cloudflare Pages → Settings → Variables and Secrets): AZURE_SPEECH_KEY (Secret), AZURE_SPEECH_REGION (e.g. westeurope).
import { clientIp, json, readJson } from '../_lib/auth.js';

export const VOICES = {
  ar: { male: 'ar-EG-ShakirNeural', female: 'ar-EG-SalmaNeural' },
  en: { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
};
const MAX_CHARS = 700;
const SSML_OVERHEAD = 120; // counted per request on top of the text, to stay on the safe side
const PER_IP = { max: 150, windowSec: 3600 }; // uncached sentences per visitor per hour

export const monthKey = (now = Date.now()) => `tts_usage:${new Date(now).toISOString().slice(0, 7)}`;
const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v || {}; } catch { return {}; } };
export const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const clean = (s) => String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);

export async function readTtsStatus(env, now = Date.now()) {
  let limit = Math.min(500000, Number(env.AZURE_TTS_MONTHLY_CHARS) || 450000);
  let enabled = !!(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION), used = 0, calls = 0;
  try {
    const rs = await env.DB.prepare('SELECT key, value FROM nh_settings WHERE key IN (?, ?)').bind(monthKey(now), 'oral_tts').all();
    for (const r of rs.results || []) {
      const v = parse(r.value);
      if (r.key === 'oral_tts') { if (v.enabled === false) enabled = false; if (Number(v.monthlyLimit) > 0) limit = Math.min(limit, Number(v.monthlyLimit)); }
      else { used = Number(v.chars) || 0; calls = Number(v.calls) || 0; }
    }
  } catch { /* unreadable → Azure itself still stops at the free tier */ }
  return { tts: enabled && used < limit, enabled, used, limit, pct: Math.min(100, Math.round((used / limit) * 100)), calls, month: monthKey(now).slice(10) };
}

async function addChars(env, chars, ip, now = Date.now()) {
  const up = env.DB.prepare(
    `INSERT INTO nh_settings (key, value) VALUES (?, json_object('chars', ?, 'calls', 1))
     ON CONFLICT(key) DO UPDATE SET value = json_object('chars', coalesce(json_extract(nh_settings.value, '$.chars'), 0) + ?, 'calls', coalesce(json_extract(nh_settings.value, '$.calls'), 0) + 1)`,
  ).bind(monthKey(now), chars, chars);
  const hit = env.DB.prepare('INSERT INTO admin_login_attempts (ip, success, created_at) VALUES (?, 0, ?)').bind(`tts:${ip}`, new Date(now).toISOString());
  try { await env.DB.batch([up, hit]); } catch { /* best effort */ }
}

async function ipLocked(env, ip) {
  try {
    const r = await env.DB.prepare('SELECT COUNT(*) n FROM admin_login_attempts WHERE ip = ? AND success = 0 AND created_at >= ?')
      .bind(`tts:${ip}`, new Date(Date.now() - PER_IP.windowSec * 1000).toISOString()).first();
    return (r?.n ?? 0) >= PER_IP.max;
  } catch { return false; }
}

export function ssml(text, lang, gender) {
  const voice = (VOICES[lang] || VOICES.ar)[gender === 'female' ? 'female' : 'male'];
  const xmlLang = lang === 'en' ? 'en-US' : 'ar-EG';
  return { voice, body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}"><voice name="${voice}"><prosody rate="-4%">${escapeXml(text)}</prosody></voice></speak>` };
}

async function cacheKey(request, voice, text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${voice}|${text}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request(new URL(`/api/tts/c/${hex}`, request.url).toString());
}

const fallback = (reason, status = 429) => json({ fallback: true, reason }, status);

export async function onRequestGet({ request, env }) {
  const cache = globalThis.caches?.default;
  const key = new Request(new URL('/api/tts?status=1', request.url).toString());
  if (cache) { const hit = await cache.match(key).catch(() => null); if (hit) return hit; }
  const s = await readTtsStatus(env);
  const res = json(s, 200, { 'cache-control': 'public, max-age=60' });
  if (cache) await cache.put(key, res.clone()).catch(() => {});
  return res;
}

export async function onRequestPost({ request, env }) {
  const b = await readJson(request);
  const text = clean(b?.text);
  if (!text) return json({ error: 'empty' }, 400);
  const lang = b?.lang === 'en' ? 'en' : 'ar';
  const { voice, body } = ssml(text, lang, b?.gender);

  // the same sentence in the same voice was already made → no Azure call, nothing counted
  const cache = globalThis.caches?.default;
  const ck = cache ? await cacheKey(request, voice, text) : null;
  if (cache && ck) { const hit = await cache.match(ck).catch(() => null); if (hit) return hit; }

  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return fallback('tts_unavailable', 503);
  const status = await readTtsStatus(env);
  if (!status.enabled) return fallback('tts_off', 503);
  if (!status.tts) return fallback('monthly_limit', 429);
  const ip = clientIp(request);
  if (await ipLocked(env, ip)) return fallback('rate_limited', 429);

  let r;
  try {
    r = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'nursehub-tts',
      },
      body,
    });
  } catch { return fallback('tts_error', 503); }
  if (!r.ok) {
    // 429 / 403 from Azure = quota used up or key refused → mark the month as spent so nobody waits for the same error
    if (r.status === 429 || r.status === 403) await addChars(env, Math.max(0, status.limit - status.used), ip);
    console.warn('[tts] azure', r.status);
    return fallback(r.status === 429 ? 'monthly_limit' : 'tts_error', r.status === 429 ? 429 : 503);
  }
  const audio = await r.arrayBuffer();
  await addChars(env, text.length + SSML_OVERHEAD, ip);
  const res = new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=2592000' } });
  if (cache && ck) await cache.put(ck, res.clone()).catch(() => {});
  return res;
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
