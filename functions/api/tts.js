// Cloudflare Pages Function: /api/tts — the oral exam's voice: Tarek (ElevenLabs), see functions/_lib/tarek.js.
//   GET  /api/tts                                   → { tts, enabled, configured, used, limit, pct, calls, month, voice }
//   POST /api/tts { text, lang, gender }            → audio/mpeg  (gender is accepted for compatibility and ignored: always Tarek)
// Own monthly counter (tts_usage:YYYY-MM), own admin setting (oral_tts), own cap (ELEVENLABS_TTS_MONTHLY_CHARS), own per-IP limit.
// When ElevenLabs cannot speak, the answer is { fallback: true, reason } and the exam shows the text with a clear notice.
import { json, readJson } from '../_lib/auth.js';
import { handleSpeak, handleStatus } from '../_lib/tarek.js';

export { readStatus as readTtsStatusFor, monthKey, TAREK } from '../_lib/tarek.js';
export const onRequestGet = ({ request, env }) => handleStatus(request, env, 'oral');
export async function onRequestPost({ request, env }) { return handleSpeak(request, env, 'oral', await readJson(request)); }
export const onRequest = () => json({ error: 'Method not allowed' }, 405);
