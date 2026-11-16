// Cloudflare Pages Function: /api/ali-reader — "Listen to this page" (site reader), same voice as the oral exam (Tarek).
//   GET  /api/ali-reader                → { tts, enabled, configured, used, limit, pct, calls, month, voice }
//   POST /api/ali-reader { text, lang } → audio/mpeg (one part of the page, up to 1200 characters)
// Separate from the oral exam: own monthly counter (reader_usage:YYYY-MM), own admin setting (site_reader), own cap
// (SITE_READER_MONTHLY_CHARS) and own per-IP limit — reading pages can never use up the oral exam's characters.
import { json, readJson } from '../_lib/auth.js';
import { handleSpeak, handleStatus } from '../_lib/tarek.js';

export const onRequestGet = ({ request, env }) => handleStatus(request, env, 'reader');
export async function onRequestPost({ request, env }) { return handleSpeak(request, env, 'reader', await readJson(request)); }
export const onRequest = () => json({ error: 'Method not allowed' }, 405);
