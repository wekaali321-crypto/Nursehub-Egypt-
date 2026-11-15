// Question pools for the free oral exam ("Ali" reads the question aloud, the learner answers by voice).
// Built from the static snapshot (public/data) — no D1 read at run time. One small file per topic:
//   public/exams/oral/<topic>.json  { v, topic, q: [{ id, en, ar, c: [en...], ca: [ar...], a: correctIndex, r, ra }] }
//   public/exams/oral/mixed.json    a random mix of all topics
// Re-run after refreshing the snapshot:  node scripts/build-oral-pools.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { topicOf } from './build-question-topics.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const read = (t) => JSON.parse(readFileSync(join(ROOT, 'public/data', t + '.json'), 'utf8'));
const PER_TOPIC = 80;
const MIXED = 120;
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; };

// deterministic shuffle (same output on every build → stable files, small diffs)
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function compact(q) {
  const ch = Array.isArray(q.choices) ? q.choices : [];
  const chAr = Array.isArray(q.choices_ar) ? q.choices_ar : [];
  if (ch.length < 2 || ch.length > 5 || q.image_url) return null;
  const a = ch.findIndex((c) => c?.letter === q.correct_letter);
  if (a < 0 || !q.question_en) return null;
  const c = ch.map((x) => cut(x?.text, 160));
  if (c.some((t) => !t)) return null;
  const ca = chAr.length === ch.length ? chAr.map((x) => cut(x?.text, 160)) : [];
  const en = cut(q.question_en, 420);
  // long case stems are hard to follow by ear
  if (en.length > 400) return null;
  return { id: q.id, en, ar: cut(q.question_ar, 420) || undefined, c, ca: ca.every(Boolean) && ca.length ? ca : undefined, a, r: cut(q.rationale_en, 320) || undefined, ra: cut(q.rationale_ar, 320) || undefined };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = join(ROOT, 'public/exams/oral');
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const byTopic = {};
  for (const q of [...read('exam_questions'), ...read('travel_questions')]) {
    const c = compact(q); if (!c) continue;
    (byTopic[topicOf(q)] ||= []).push(c);
  }
  const mixed = [];
  const counts = {};
  for (const [t, list] of Object.entries(byTopic)) {
    const pick = shuffle(list).slice(0, PER_TOPIC);
    counts[t] = pick.length;
    writeFileSync(join(OUT, `${t}.json`), JSON.stringify({ v: 1, topic: t, q: pick }));
    mixed.push(...pick.slice(0, 12));
  }
  writeFileSync(join(OUT, 'mixed.json'), JSON.stringify({ v: 1, topic: 'mixed', q: shuffle(mixed).slice(0, MIXED) }));
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ v: 1, topics: counts }));
  console.log('oral pools:', Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', '));
}
