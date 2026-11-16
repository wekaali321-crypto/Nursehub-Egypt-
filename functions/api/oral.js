// Cloudflare Pages Function: /api/oral — "Ali" smart oral exam (Workers AI), with a daily budget kept under the free tier.
//   GET  /api/oral                     → { ai, used, limit, pct, calls, resetsAt }   (live usage meter, cached ~20 s per colo)
//   POST /api/oral { action:'generate', lang, title, text, topic, count } → { questions: [{ q, points[] }] }
//   POST /api/oral { action:'grade', lang, q, points[], answer }          → { score 0..2, feedback, missing[] }
// When the AI is off / the day's budget is used / Workers AI refuses, the answer is 429|503 with { fallback: true } and the
// page switches to the free oral exam (static question bank, browser voice) on its own.
//
// Cost control (D1 + neurons):
//  - usage lives in ONE nh_settings row per UTC day (key ai_usage:YYYY-MM-DD, value {neurons, calls}); one upsert per AI call
//  - neurons are worked out from the token counts Workers AI returns (price table below; unknown model → the dearest rates)
//  - the budget (AI_DAILY_NEURONS, default 9000 of the 10,000 free) leaves a margin; an admin can lower it or switch the AI off
//    with nh_settings key 'oral_ai' = { enabled, dailyLimit }
//  - per visitor (IP): 10 new exams and 80 graded answers per hour, counted in admin_login_attempts like the other limits
import { clientIp, json, readJson } from '../_lib/auth.js';

export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
// neurons per 1M tokens [input, output] (Workers AI pricing: $0.011 per 1,000 neurons)
export const NEURON_RATES = {
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': [26668, 204805],
  '@cf/meta/llama-3.1-8b-instruct-fast': [4119, 34868],
  '@cf/meta/llama-3.1-8b-instruct-fp8': [4119, 34868],
  '@cf/meta/llama-4-scout-17b-16e-instruct': [24545, 77273],
  '@cf/google/gemma-3-12b-it': [31371, 50560],
};
const FREE_NEURONS = 10000;
const LIMITS = { gen: { max: 10, windowSec: 3600 }, grade: { max: 80, windowSec: 3600 } };
const MAX_TEXT = 3500;

export const dayKey = (now = Date.now()) => `ai_usage:${new Date(now).toISOString().slice(0, 10)}`;
const resetsAt = (now = Date.now()) => { const d = new Date(now); d.setUTCHours(24, 0, 0, 0); return d.toISOString(); };
const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v || {}; } catch { return {}; } };

export function neuronsFor(model, usage, promptChars = 0, outChars = 0) {
  const [ri, ro] = NEURON_RATES[model] || [26668, 204805];
  // no usage block → estimate (≈3 characters per token for mixed Arabic / English)
  const pin = Number(usage?.prompt_tokens) || Math.ceil(promptChars / 3);
  const pout = Number(usage?.completion_tokens) || Math.ceil(outChars / 3);
  return Math.round(((pin * ri + pout * ro) / 1e6) * 100) / 100;
}

/** { ai, used, limit, pct, calls, resetsAt, model } — reads the setting + today's row in one query. */
export async function readStatus(env, now = Date.now()) {
  const model = env.AI_MODEL || DEFAULT_MODEL;
  let limit = Math.min(FREE_NEURONS, Number(env.AI_DAILY_NEURONS) || 9000);
  let enabled = true, used = 0, calls = 0;
  try {
    const rs = await env.DB.prepare('SELECT key, value FROM nh_settings WHERE key IN (?, ?)').bind(dayKey(now), 'oral_ai').all();
    for (const r of rs.results || []) {
      const v = parse(r.value);
      if (r.key === 'oral_ai') { if (v.enabled === false) enabled = false; if (Number(v.dailyLimit) > 0) limit = Math.min(limit, Number(v.dailyLimit)); }
      else { used = Number(v.neurons) || 0; calls = Number(v.calls) || 0; }
    }
  } catch { /* D1 unreadable → treat as no usage yet; Workers AI itself still refuses past the free tier */ }
  const ai = !!env.AI && enabled && used < limit;
  return { ai, enabled: enabled && !!env.AI, used: Math.round(used), limit, pct: Math.min(100, Math.round((used / limit) * 100)), calls, resetsAt: resetsAt(now), model };
}

async function addUsage(env, neurons, extraStmt, now = Date.now()) {
  const up = env.DB.prepare(
    `INSERT INTO nh_settings (key, value) VALUES (?, json_object('neurons', ?, 'calls', 1))
     ON CONFLICT(key) DO UPDATE SET value = json_object('neurons', round(coalesce(json_extract(nh_settings.value, '$.neurons'), 0) + ?, 2), 'calls', coalesce(json_extract(nh_settings.value, '$.calls'), 0) + 1)`,
  ).bind(dayKey(now), neurons, neurons);
  try { await env.DB.batch(extraStmt ? [up, extraStmt] : [up]); } catch { /* counting is best effort */ }
  // drop rows older than a week now and then
  if (Math.random() < 0.02) { try { await env.DB.prepare("DELETE FROM nh_settings WHERE key LIKE 'ai_usage:%' AND key < ?").bind(dayKey(now - 7 * 86400e3)).run(); } catch { /* ignore */ } }
}

async function lockedFor(env, key, rule) {
  try {
    const r = await env.DB.prepare('SELECT COUNT(*) n FROM admin_login_attempts WHERE ip = ? AND success = 0 AND created_at >= ?')
      .bind(key, new Date(Date.now() - rule.windowSec * 1000).toISOString()).first();
    return (r?.n ?? 0) >= rule.max;
  } catch { return false; }
}
const hitStmt = (env, key) => env.DB.prepare('INSERT INTO admin_login_attempts (ip, success, created_at) VALUES (?, 0, ?)').bind(key, new Date().toISOString());

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
// Arabic = Egyptian colloquial, the way an Egyptian nurse talks to a colleague on the ward (medical terms stay in English)
const langName = (l) => (l === 'en'
  ? 'English'
  : 'Egyptian colloquial Arabic (العامية المصرية), the way an experienced Egyptian nurse talks to a younger colleague on the ward: friendly and short, e.g. "طيب قولّي…", "إيه أول حاجة هتعملها؟", "ليه؟", "تمام كده", "بص يا سيدي". Write it in Arabic letters, NOT Modern Standard Arabic (no "ماذا", "لماذا", "يجب"). Keep drug, disease, lab and procedure names in English as nurses say them (e.g. "heart failure", "Lasix", "CVP")');

// the examiner the learner chose: Ali Ashour (male voice) or Donia (female voice); Arabic verbs follow the gender
const who = (b) => (b?.gender === 'female'
  ? 'Donia, a friendly female registered-nurse examiner (in Arabic she speaks of herself in the feminine, e.g. "أنا متأكدة", "هسألك")'
  : 'Ali Ashour, a friendly male registered-nurse examiner');

export function buildGenerate(b) {
  const count = Math.min(6, Math.max(3, Number(b.count) || 5));
  const text = clean(b.text, MAX_TEXT);
  const title = clean(b.title, 160);
  const topic = clean(b.topic, 80);
  const source = text.length >= 300
    ? `Study text (title: "${title}"):\n"""${text}"""\nAsk ONLY about facts stated in this text.`
    : `Topic: "${topic || title || 'general nursing'}". Ask core, well-established nursing knowledge about this topic (no rare trivia, no exact numbers that vary by guideline).`;
  return {
    count,
    messages: [
      { role: 'system', content: `You are ${who(b)} on NurseHub Egypt. You run short ORAL exams for nursing students and nurses. Questions must be answerable out loud in one to three sentences, clinically safe and accurate. Never ask for patient-identifying data. Reply with JSON only.` },
      { role: 'user', content: `${source}\nWrite exactly ${count} oral questions in ${langName(b.lang)}, from easy to harder (recall, then understanding, then a nursing action / priority). For each question give 2-4 short key points a good answer must mention (the marking guide), in the same language.\nJSON shape: {"questions":[{"q":"question","points":["key point","key point"]}]}` },
    ],
  };
}

export function buildGrade(b) {
  const q = clean(b.q, 400);
  const points = (Array.isArray(b.points) ? b.points : []).map((p) => clean(p, 200)).filter(Boolean).slice(0, 5);
  const answer = clean(b.answer, 1000);
  return {
    q, points, answer,
    messages: [
      { role: 'system', content: `You are ${who(b)}, kind but exact, marking a spoken answer (it came from speech-to-text, so ignore spelling, grammar, filler words and Egyptian colloquial wording). Judge ONLY against the marking guide. Score 2 = covers the main points correctly; 1 = partly right or vague; 0 = wrong, unsafe, empty or off-topic. Never praise an unsafe answer. Reply with JSON only.` },
      { role: 'user', content: `Question: ${q}\nMarking guide: ${points.map((p, i) => `(${i + 1}) ${p}`).join(' ')}\nStudent answer: "${answer || '(no answer)'}"\nWrite the feedback in ${langName(b.lang)} as ${b?.gender === 'female' ? 'Donia' : 'Ali'} speaking to the student: 1-2 short sentences, start by saying if it is right, then give the missing or correct point. List the key points the answer missed.\nJSON shape: {"score":0,"feedback":"...","missing":["..."]}` },
    ],
  };
}

const SCHEMAS = {
  generate: { type: 'object', properties: { questions: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, points: { type: 'array', items: { type: 'string' } } }, required: ['q', 'points'] } } }, required: ['questions'] },
  grade: { type: 'object', properties: { score: { type: 'integer' }, feedback: { type: 'string' }, missing: { type: 'array', items: { type: 'string' } } }, required: ['score', 'feedback'] },
};

/** The model's answer as an object (some models return a string, sometimes wrapped in ``` fences or extra words). */
export function readModelJson(out) {
  const r = out?.response ?? out?.result?.response ?? out;
  if (r && typeof r === 'object') return r;
  const s = String(r ?? '');
  try { return JSON.parse(s); } catch { /* look for the first JSON object */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
  return null;
}

const fallback = (reason, status = 429, extra = {}) => json({ fallback: true, reason, ...extra }, status);

export async function onRequestGet({ request, env }) {
  const cache = globalThis.caches?.default;
  const key = new Request(new URL('/api/oral?status=1', request.url).toString());
  if (cache) { const hit = await cache.match(key).catch(() => null); if (hit) return hit; }
  const s = await readStatus(env);
  const res = json(s, 200, { 'cache-control': 'public, max-age=20' });
  if (cache) await cache.put(key, res.clone()).catch(() => {});
  return res;
}

export async function onRequestPost({ request, env }) {
  const b = await readJson(request);
  const action = b?.action;
  if (action !== 'generate' && action !== 'grade') return json({ error: 'bad action' }, 400);
  const status = await readStatus(env);
  if (!env.AI) return fallback('ai_unavailable', 503, { status });
  if (!status.enabled) return fallback('ai_off', 503, { status });
  if (!status.ai) return fallback('daily_limit', 429, { status });

  const ip = clientIp(request);
  const rlKey = `oral-${action === 'generate' ? 'gen' : 'grade'}:${ip}`;
  if (await lockedFor(env, rlKey, action === 'generate' ? LIMITS.gen : LIMITS.grade)) return fallback('rate_limited', 429, { status });

  const p = action === 'generate' ? buildGenerate(b) : buildGrade(b);
  if (action === 'grade' && (!p.q || !p.points.length)) return json({ error: 'missing question' }, 400);
  const model = status.model;
  let out;
  try {
    out = await env.AI.run(model, {
      messages: p.messages,
      max_tokens: action === 'generate' ? 900 : 260,
      temperature: action === 'generate' ? 0.4 : 0.1,
      response_format: { type: 'json_schema', json_schema: SCHEMAS[action] },
    });
  } catch (e) {
    const msg = String(e?.message || e);
    // Workers AI says the free allocation is used up → mark the day as spent so nobody else waits for the same error
    if (/4006|daily free allocation|neurons/i.test(msg)) { await addUsage(env, Math.max(0, status.limit - status.used), null); return fallback('daily_limit', 429); }
    console.warn('[oral] AI error', msg);
    return fallback('ai_error', 503);
  }
  const promptChars = p.messages.reduce((n, m) => n + m.content.length, 0);
  const data = readModelJson(out);
  const neurons = neuronsFor(model, out?.usage, promptChars, JSON.stringify(data ?? out?.response ?? '').length);
  await addUsage(env, neurons, hitStmt(env, rlKey));
  if (!data) return fallback('bad_output', 503);

  if (action === 'generate') {
    const questions = (Array.isArray(data.questions) ? data.questions : [])
      .map((x) => ({ q: clean(x?.q, 400), points: (Array.isArray(x?.points) ? x.points : []).map((s) => clean(s, 200)).filter(Boolean).slice(0, 4) }))
      .filter((x) => x.q && x.points.length)
      .slice(0, p.count);
    if (questions.length < 2) return fallback('bad_output', 503);
    return json({ questions, neurons });
  }
  const score = Math.max(0, Math.min(2, Math.round(Number(data.score) || 0)));
  return json({ score, feedback: clean(data.feedback, 500), missing: (Array.isArray(data.missing) ? data.missing : []).map((s) => clean(s, 200)).filter(Boolean).slice(0, 4), neurons });
}

export const onRequest = () => json({ error: 'Method not allowed' }, 405);
