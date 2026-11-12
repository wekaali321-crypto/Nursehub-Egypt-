// Snapshots the PUBLIC (anon-readable) Supabase tables into public/data/<table>.json.
// The site falls back to these files if Supabase is restricted/unavailable (see src/lib/staticFallback.ts).
// Usage:  SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... node scripts/snapshot-supabase.mjs
// Only the public key is used (same as the browser) — never a service key.
import { mkdirSync, writeFileSync } from 'node:fs';
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !KEY) { console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY'); process.exit(1); }
const TABLES = `travel_questions exam_questions applied_pharm_items articles drugs course_chapters icu_topics course_questions interview_questions rx_prescriptions icu_medications nicu_topics pharmacology_topics pediatric_topics quiz_questions er_medications fundamentals_topics first_aid_topics operating_room_topics terminology_topics peds_medications organ_dose_adjustments clinical_protocols obgyn_topics travel_review_sections dialysis_topics otc_conditions anatomy_topics er_reception_topics radiology_topics terminology_quiz_questions pediatric_quiz_questions pharmacy_facts pregnancy_lactation_safety iv_compatibility high_alert_ref lasa_pairs pharm_mnemonics drug_suffixes drug_classifications products exams ads exam_categories disease_images interview_categories tags site_settings drug_antidotes cardiac_med_groups courses media categories drug_interactions travel_categories pages affiliates redirects`.split(/\s+/);
mkdirSync('public/data', { recursive: true });
const manifest = {};
for (const t of TABLES) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${t}?select=*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } });
    if (!r.ok) { console.error(t, r.status); break; }
    const page = await r.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  writeFileSync(`public/data/${t}.json`, JSON.stringify(rows));
  manifest[t] = rows.length;
  console.log(t, rows.length);
}
writeFileSync('public/data/manifest.json', JSON.stringify({ updated: new Date().toISOString().slice(0, 10), tables: manifest }));
