// Client data access: the query shapes the app sends (checked with a recording stand-in for the Supabase client) and their caching.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { ROOT, loadTs } from './helpers.mjs';

const FAKE = join(ROOT, 'tests/d1/fake-supabase.mjs');
const EXTRA_COUNTS = JSON.parse(readFileSync(join(ROOT, 'public/travel-extra/counts.json'), 'utf8'));
const EXTRA_TOTAL = Object.values(EXTRA_COUNTS).reduce((a, b) => a + b, 0);
function storage() { const m = new Map(); return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
function fakeIndexedDB() {
  const kv = new Map();
  const req = (run) => { const r = {}; queueMicrotask(() => { r.result = run(); r.onsuccess && r.onsuccess({ target: r }); }); return r; };
  return { kv, open() { const r = {}; queueMicrotask(() => { r.result = { createObjectStore() {}, transaction: () => ({ objectStore: () => ({ get: (k) => req(() => kv.get(k)), put: (v, k) => req(() => { kv.set(k, v); }) }) }) }; r.onupgradeneeded && r.onupgradeneeded(); r.onsuccess && r.onsuccess({ target: r }); }); return r; } };
}
async function env(entry) {
  globalThis.sessionStorage = storage(); globalThis.localStorage = storage(); globalThis.indexedDB = fakeIndexedDB();
  const fetched = []; globalThis.fetch = async (u) => { fetched.push(String(u)); const f = String(u).replace(/^\//, ''); try { return new Response(readFileSync(join(ROOT, 'public', f)), { status: 200 }); } catch { return new Response('nf', { status: 404 }); } };
  const mod = await loadTs(entry, { './supabase': { external: FAKE } }) // the same module instance is imported below;
  const sup = await import(new URL(`file://${FAKE}`).href);
  sup.reset();
  return { mod, sup, fetched, idb: globalThis.indexedDB };
}
const settle = () => new Promise((r) => setTimeout(r, 15));
const names = (call) => call.steps.map((s) => s[0]);

test('topic page reads ONE row by primary key (no ORDER BY, no full table)', async () => {
  const { mod, sup } = await env('src/lib/dialysisTopicsApi.ts');
  sup.answers.set('dialysis_topics', { data: { id: 'd1', title_ar: 'x' }, error: null });
  const t = await mod.fetchDialysisTopic('d1');
  assert.equal(t.id, 'd1');
  assert.equal(sup.calls.length, 1);
  const c = sup.calls[0];
  assert.equal(c.table, 'dialysis_topics');
  assert.deepEqual(c.steps.map((s) => s.join(':')), ['select:*', 'eq:id:d1', 'maybeSingle']);
  assert.equal(await mod.fetchDialysisTopic(''), null, 'no id -> no query');
});

test('every section API exposes the primary-key reader', async () => {
  for (const [file, fn, table] of [['anatomy', 'fetchAnatomyTopic', 'anatomy_topics'], ['nicu', 'fetchNicuTopic', 'nicu_topics'], ['firstAid', 'fetchFirstAidTopic', 'first_aid_topics'], ['terminology', 'fetchTerminologyTopic', 'terminology_topics'], ['erReception', 'fetchERReceptionTopic', 'er_reception_topics'], ['icu', 'fetchIcuTopic', 'icu_topics']]) {
    const { mod, sup } = await env(`src/lib/${file}TopicsApi.ts`);
    sup.answers.set(table, { data: { id: 'z' }, error: null });
    assert.equal((await mod[fn]('z')).id, 'z', fn);
    assert.deepEqual(sup.calls[0].steps.map((s) => s[0]), ['select', 'eq', 'maybeSingle'], fn);
  }
});

test('travel counts: one RPC, cached; static counts file when the RPC fails', async () => {
  const { mod, sup, fetched } = await env('src/lib/travelQuestionsApi.ts');
  sup.rpcAnswers.set('travel_question_counts', { data: { medsurg: 3, saudi: 2 }, error: null });
  const merged = { saudi: 2, ...EXTRA_COUNTS, medsurg: 3 + EXTRA_COUNTS.medsurg };
  assert.deepEqual(await mod.fetchTravelQuestionCounts(), merged);
  await settle();
  assert.deepEqual(await mod.fetchTravelQuestionCounts(), merged);
  assert.equal(sup.calls.filter((c) => c.rpc).length, 1, 'second read came from the client cache');
  assert.equal(sup.calls.filter((c) => c.table).length, 0, 'no per-category COUNT queries any more');

  const e2 = await env('src/lib/travelQuestionsApi.ts');
  e2.sup.rpcAnswers.set('travel_question_counts', { data: null, error: { message: 'boom' } });
  const stat = await e2.mod.fetchTravelQuestionCounts();
  assert.equal(stat.medsurg, 1752 + EXTRA_COUNTS.medsurg, 'table counts plus the static extras');
  assert.ok(e2.fetched.includes('/data/travel_counts.json'));
});

test('global search index: travel questions come from the static file, never from the database', async () => {
  const { mod, sup, fetched } = await env('src/lib/travelQuestionsApi.ts');
  const lite = await mod.fetchTravelQuestionsLite();
  assert.equal(lite.length, 9307 + EXTRA_TOTAL);
  assert.deepEqual(Object.keys(lite[0]).sort(), ['category_id', 'id', 'question_ar', 'question_en']);
  assert.deepEqual(Object.keys(lite[lite.length - 1]).sort(), ['category_id', 'id', 'question_ar', 'question_en']);
  assert.equal(sup.calls.length, 0);
  assert.deepEqual(fetched.sort(), ['/data/travel_questions_lite.json', '/travel-extra/lite.json']);
});

test('travel category page: one query for the whole category, cached afterwards', async () => {
  const { mod, sup } = await env('src/lib/travelQuestionsApi.ts');
  sup.answers.set('travel_questions', (steps) => ({ data: Array.from({ length: 1752 }, (_, i) => ({ id: `q${i}`, category_id: 'medsurg' })), error: null }));
  const rows = await mod.fetchTravelQuestions('medsurg');
  assert.equal(rows.length, 1752 + EXTRA_COUNTS.medsurg, 'table rows plus the static extras (served from Cloudflare, not Supabase)');
  const q = sup.calls.filter((c) => c.table === 'travel_questions');
  assert.equal(q.length, 1, 'was 2 sorted 1,000-row pages');
  assert.deepEqual(q[0].steps.find((s) => s[0] === 'range'), ['range', 0, 4999]);
  assert.ok(q[0].steps.some((s) => s[0] === 'eq' && s[1] === 'category_id' && s[2] === 'medsurg'));
  await settle();
  await mod.fetchTravelQuestions('medsurg');
  assert.equal(sup.calls.filter((c) => c.table === 'travel_questions').length, 1);
});

test('exam questions and applied pharmacology are cached on the client', async () => {
  const e = await env('src/lib/examLicensureApi.ts');
  e.sup.answers.set('exam_questions', { data: [{ id: 'a' }], error: null });
  await e.mod.fetchExamQuestions('exam-1'); await settle(); await e.mod.fetchExamQuestions('exam-1');
  assert.equal(e.sup.calls.length, 1);
  const a = await env('src/lib/appliedPharmApi.ts');
  a.sup.answers.set('applied_pharm_items', { data: [{ id: 'p' }], error: null });
  await a.mod.fetchAppliedPharmItems(1); await settle(); await a.mod.fetchAppliedPharmItems(1);
  assert.equal(a.sup.calls.length, 1);
});

test('signed-in (admin) sessions bypass the client cache', async () => {
  const e = await env('src/lib/examLicensureApi.ts');
  globalThis.localStorage.setItem('sb-site-auth-token', JSON.stringify({ access_token: 'a.b.c' }));
  e.sup.answers.set('exam_questions', { data: [{ id: 'a' }], error: null });
  await e.mod.fetchExamQuestions('exam-1'); await settle(); await e.mod.fetchExamQuestions('exam-1');
  assert.equal(e.sup.calls.length, 2);
});

test('static lite search file keeps the database order (ORDER BY order_num, id) so search results do not reshuffle', async () => {
  const { mod } = await env('src/lib/travelQuestionsApi.ts');
  const lite = await mod.fetchTravelQuestionsLite();
  const full = JSON.parse(readFileSync(join(ROOT, 'public/data/travel_questions.json'), 'utf8'));
  const order = new Map(full.map((r) => [r.id, r.order_num]));
  const base = lite.filter((r) => order.has(r.id)); // the static extras follow the table rows
  assert.equal(base.length, full.length);
  for (let i = 1; i < base.length; i++) {
    const a = order.get(base[i - 1].id), b = order.get(base[i].id);
    assert.ok(a < b || (a === b && base[i - 1].id < base[i].id), `row ${i}`);
  }
});

test('articles: visitors get light rows (no text); a light row is never written back; the text loads per article', async () => {
  const { mod, sup } = await env('src/lib/dataApi.ts');
  const light = await mod.loadAllFromSupabase(true);
  const artCall = sup.calls.find((c) => c.table === 'articles');
  const sel = artCall.steps.find((s) => s[0] === 'select')[1];
  assert.ok(!/\bcontent\b|content_en/.test(sel), `light select has no text columns: ${sel}`);
  assert.equal(light.articles.length, 0);

  sup.reset();
  const partial = { id: 'a1', title: 'T', slug: 's', content: '', partial: true, views: 1, tags: [] };
  await mod.syncEntity('articles', [{ ...partial, views: 2 }], [partial]);
  assert.equal(sup.calls.length, 0, 'a changed light row is NOT upserted (would erase the text)');
  await mod.syncEntity('articles', [{ ...partial, partial: undefined, content: '<p>x</p>', views: 2 }], [partial]);
  assert.equal(sup.calls.filter((c) => c.steps.some((s) => s[0] === 'upsert')).length, 1, 'a full row is saved normally');

  sup.reset();
  sup.answers.set('articles', { data: { id: 'a1', slug: 's', title: 'T', content: '<p>full</p>', tags: [] }, error: null });
  const full = await mod.loadArticleFull('s');
  assert.equal(full.content, '<p>full</p>'); assert.equal(full.partial, undefined);
  assert.deepEqual(sup.calls[0].steps.map((s) => s[0]), ['select', 'eq', 'eq', 'maybeSingle']);
});

test('static extra travel questions: valid shape, unique ids, never stored in Supabase', async () => {
  const counts = EXTRA_COUNTS;
  const ids = new Set(JSON.parse(readFileSync(join(ROOT, 'public/data/travel_questions.json'), 'utf8')).map((q) => q.id));
  for (const [cat, n] of Object.entries(counts)) {
    const list = JSON.parse(readFileSync(join(ROOT, `public/travel-extra/${cat}.json`), 'utf8'));
    assert.equal(list.length, n);
    for (const q of list) {
      assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
      ids.add(q.id);
      assert.equal(q.category_id, cat);
      assert.ok(q.question_ar && q.rationale_ar && q.rationale_en);
      assert.equal(q.choices.length, q.choices_ar.length);
      assert.ok(q.choices.some((c) => c.letter === q.correct_letter));
    }
  }
  const { mod, sup } = await env('src/lib/travelQuestionsApi.ts');
  sup.answers.set('travel_questions', { data: [], error: null });
  const admin = await mod.fetchTravelQuestions('maternity', false);
  assert.equal(admin.length, 0, 'the admin screen lists only editable table rows');
});
