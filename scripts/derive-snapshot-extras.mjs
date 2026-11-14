// Derives small helper files from the existing snapshot in public/data (NO network, NO database access):
//   travel_counts.json         { category_id: number_of_questions }          -> static fallback for the question counts
//   travel_questions_lite.json [{id,category_id,question_en,question_ar}]    -> global search index (instead of scanning the table)
// Run after scripts/snapshot-supabase.mjs (it is called automatically at the end of that script) or on its own:
//   node scripts/derive-snapshot-extras.mjs
import { readFileSync, writeFileSync } from 'node:fs';

export function deriveExtras(dir = 'public/data') {
  const rows = JSON.parse(readFileSync(`${dir}/travel_questions.json`, 'utf8'));
  const counts = {};
  for (const r of rows) counts[r.category_id] = (counts[r.category_id] || 0) + 1;
  // same order as the database query it replaces: ORDER BY order_num, id (SQLite BINARY collation = plain string comparison)
  const byKey = (a, b) => (a.order_num ?? 0) - (b.order_num ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const lite = [...rows].sort(byKey).map((r) => ({ id: r.id, category_id: r.category_id, question_en: r.question_en, question_ar: r.question_ar ?? null }));
  writeFileSync(`${dir}/travel_counts.json`, JSON.stringify(counts));
  writeFileSync(`${dir}/travel_questions_lite.json`, JSON.stringify(lite));
  return { questions: rows.length, categories: Object.keys(counts).length };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(deriveExtras());
