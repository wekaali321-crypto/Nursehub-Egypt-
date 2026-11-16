// Tarek — the one voice of NurseHub Egypt (ElevenLabs "Tarek - Pleasant and Professional", eleven_multilingual_v2, MP3).
// Shared by /api/tts (oral exam) and /api/ali-reader (site reader). Each caller is a NAMESPACE with its own:
//   - monthly character counter   : one nh_settings row per month   (oral: tts_usage:YYYY-MM   reader: reader_usage:YYYY-MM)
//   - admin setting               : nh_settings key                 (oral: oral_tts            reader: site_reader) = { enabled, monthlyLimit }
//   - monthly cap from the env    : ELEVENLABS_TTS_MONTHLY_CHARS / SITE_READER_MONTHLY_CHARS (conservative defaults below)
//   - per-IP hourly limit         : rows in admin_login_attempts with key "<ns>:<ip>" (same mechanism as the other limits)
// No schema change: nh_settings(key, value) and admin_login_attempts(ip, success, created_at) already exist.
// Characters are counted only after ElevenLabs returned audio. A sentence already made (same voice + model + text) is served
// from the edge cache: no ElevenLabs call, nothing counted, no D1 write. Secret: ELEVENLABS_API_KEY (Cloudflare Pages Secret).
import { clientIp, json } from './auth.js';

export const TAREK = { voiceId: 'ckGEQg6YnSVooU5uDRsF', name: 'Tarek', model: 'eleven_multilingual_v2', format: 'mp3_44100_64' };
const PLAN_MAX = 1_000_000; // never trust an env value above this
const TIMEOUT_MS = 20000;

export const NAMESPACES = {
  oral: { usagePrefix: 'tts_usage:', settingsKey: 'oral_tts', settingsLimitField: 'monthlyLimit', envLimit: 'ELEVENLABS_TTS_MONTHLY_CHARS', defaultLimit: 20000, ipKey: 'tts', ip: { max: 150, windowSec: 3600 }, maxChars: 700 },
  reader: { usagePrefix: 'reader_usage:', settingsKey: 'site_reader', settingsLimitField: 'monthlyLimit', envLimit: 'SITE_READER_MONTHLY_CHARS', defaultLimit: 8000, ipKey: 'reader', ip: { max: 60, windowSec: 3600 }, maxChars: 1200 },
};

export const monthKey = (ns, now = Date.now()) => `${NAMESPACES[ns].usagePrefix}${new Date(now).toISOString().slice(0, 7)}`;
const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v || {}; } catch { return {}; } };
export const cleanText = (s, max) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** { tts, enabled, configured, used, limit, pct, calls, month, voice } — one indexed read (PK lookups). */
export async function readStatus(env, ns, now = Date.now()) {
  const cfg = NAMESPACES[ns];
  const configured = !!env.ELEVENLABS_API_KEY;
  let limit = Math.min(PLAN_MAX, Number(env[cfg.envLimit]) > 0 ? Number(env[cfg.envLimit]) : cfg.defaultLimit);
  let enabled = configured, used = 0, calls = 0;
  try {
    const rs = await env.DB.prepare('SELECT key, value FROM nh_settings WHERE key IN (?, ?)').bind(monthKey(ns, now), cfg.settingsKey).all();
    for (const r of rs.results || []) {
      const v = parse(r.value);
      if (r.key === cfg.settingsKey) {
        if (v.enabled === false) enabled = false;
        if (Number(v[cfg.settingsLimitField]) > 0) limit = Math.min(limit, Number(v[cfg.settingsLimitField]));
      } else { used = Number(v.chars) || 0; calls = Number(v.calls) || 0; }
    }
  } catch { /* unreadable → ElevenLabs' own quota still stops it */ }
  return { tts: enabled && used < limit, enabled, configured, used, limit, pct: Math.min(100, Math.round((used / limit) * 100)), calls, month: new Date(now).toISOString().slice(0, 7), voice: TAREK.name };
}

function usageStmt(env, ns, chars, now) {
  return env.DB.prepare(
    `INSERT INTO nh_settings (key, value) VALUES (?, json_object('chars', ?, 'calls', 1))
     ON CONFLICT(key) DO UPDATE SET value = json_object('chars', coalesce(json_extract(nh_settings.value, '$.chars'), 0) + ?, 'calls', coalesce(json_extract(nh_settings.value, '$.calls'), 0) + 1)`,
  ).bind(monthKey(ns, now), chars, chars);
}
const ipStmt = (env, key, now) => env.DB.prepare('INSERT INTO admin_login_attempts (ip, success, created_at) VALUES (?, 0, ?)').bind(key, new Date(now).toISOString());

async function ipLocked(env, key, rule) {
  try {
    const r = await env.DB.prepare('SELECT COUNT(*) n FROM admin_login_attempts WHERE ip = ? AND success = 0 AND created_at >= ?')
      .bind(key, new Date(Date.now() - rule.windowSec * 1000).toISOString()).first();
    return (r?.n ?? 0) >= rule.max;
  } catch { return false; }
}

async function cacheKey(request, text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${TAREK.voiceId}|${TAREK.model}|${TAREK.format}|${text}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request(new URL(`/api/tts/c/${hex}`, request.url).toString());
}

const fallback = (reason, status) => json({ fallback: true, reason, voice: TAREK.name }, status);

/** ElevenLabs request body (the voice is always Tarek; `gender` from older callers is accepted and ignored). */
export function elevenRequest(text) {
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${TAREK.voiceId}?output_format=${TAREK.format}`,
    body: JSON.stringify({ text, model_id: TAREK.model, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true } }),
  };
}

export async function handleStatus(request, env, ns) {
  const cache = globalThis.caches?.default;
  const key = new Request(new URL(`/api/${ns === 'reader' ? 'ali-reader' : 'tts'}?status=1`, request.url).toString());
  if (cache) { const hit = await cache.match(key).catch(() => null); if (hit) return hit; }
  const s = await readStatus(env, ns);
  const res = json(s, 200, { 'cache-control': 'public, max-age=60' });
  if (cache) await cache.put(key, res.clone()).catch(() => {});
  return res;
}

/** POST body { text, lang?, gender? } → audio/mpeg, or { fallback: true, reason } with 4xx/5xx (no secrets, no provider details). */
export async function handleSpeak(request, env, ns, body) {
  const cfg = NAMESPACES[ns];
  const text = cleanText(body?.text, cfg.maxChars);
  if (!text) return json({ error: 'empty' }, 400);

  const cache = globalThis.caches?.default;
  const ck = cache ? await cacheKey(request, text) : null;
  if (cache && ck) { const hit = await cache.match(ck).catch(() => null); if (hit) return hit; }

  if (!env.ELEVENLABS_API_KEY) return fallback('tts_unavailable', 503);
  const status = await readStatus(env, ns);
  if (!status.enabled) return fallback('tts_off', 503);
  if (!status.tts || status.used + text.length > status.limit) return fallback('monthly_limit', 429);
  const ip = clientIp(request);
  const ipKey = `${cfg.ipKey}:${ip}`;
  if (await ipLocked(env, ipKey, cfg.ip)) return fallback('rate_limited', 429);

  const now = Date.now();
  const { url, body: payload } = elevenRequest(text);
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: payload,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    console.warn(`[tarek:${ns}] network/timeout`, e?.name || 'error');
    return fallback(e?.name === 'TimeoutError' ? 'tts_timeout' : 'tts_error', 503);
  }
  if (!r.ok) {
    // ElevenLabs: 401 + detail.status "quota_exceeded" = the account's characters are used up; other 401 = bad key;
    // 429 = too many requests at once / busy (temporary); 5xx = their side. Nothing is counted for a failed call.
    let detail = '';
    try { const j = await r.json(); detail = String(j?.detail?.status || j?.detail?.code || ''); } catch { /* not JSON */ }
    console.warn(`[tarek:${ns}] elevenlabs`, r.status, detail);
    if (detail === 'quota_exceeded') {
      // mark this namespace's month as spent so nobody waits for the same error again
      try { await env.DB.batch([usageStmt(env, ns, Math.max(0, status.limit - status.used), now)]); } catch { /* ignore */ }
      return fallback('monthly_limit', 429);
    }
    if (r.status === 429) return fallback('tts_busy', 503);
    if (r.status === 401 || r.status === 403) return fallback('tts_unavailable', 503);
    return fallback('tts_error', 503);
  }
  const audio = await r.arrayBuffer();
  if (!audio.byteLength) return fallback('tts_error', 503);
  // counted only now that audio exists
  try { await env.DB.batch([usageStmt(env, ns, text.length, now), ipStmt(env, ipKey, now)]); } catch { /* best effort */ }
  if (Math.random() < 0.02) { try { await env.DB.prepare("DELETE FROM admin_login_attempts WHERE created_at < ? AND (ip LIKE 'tts:%' OR ip LIKE 'reader:%')").bind(new Date(now - 86400e3).toISOString()).run(); } catch { /* ignore */ } }
  const res = new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=2592000', 'x-voice': TAREK.name } });
  if (cache && ck) await cache.put(ck, res.clone()).catch(() => {});
  return res;
}
