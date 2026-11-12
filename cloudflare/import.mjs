// Imports the site's data into the Cloudflare D1 backend through its own /rest/v1 API.
//   SITE_URL=https://nursehubegypt.com ADMIN_EMAIL=... ADMIN_PASSWORD=... node cloudflare/import.mjs
// Optional (pull FRESH data, including private tables, straight from the old Supabase project):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...   (kept in GitHub secrets, never in the repo)
//   TRACK_DAYS=7  (how many days of visit tracking to carry over)
import { readFileSync, existsSync } from 'node:fs';
const SITE = (process.env.SITE_URL || 'http://localhost:8788').replace(/\/$/, '');
const SB = process.env.SUPABASE_URL, SBKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRACK_DAYS = Number(process.env.TRACK_DAYS || 7);
const PUBLIC = (readFileSync('cloudflare/tables.txt', 'utf8').match(/^[a-z_]+(?=\|)/gm) || []);
const SKIP = new Set(['admin_login_attempts', 'order_lookup_attempts', 'profiles', 'site_pings', 'activity_log']);
const TRACK = new Set(['site_visits', 'site_installs']);

const login = await fetch(`${SITE}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) { console.error('admin login failed', login.status, await login.text()); process.exit(1); }
const token = (await login.json()).access_token;
const H = { 'content-type': 'application/json', apikey: 'import', authorization: `Bearer ${token}`, prefer: 'resolution=merge-duplicates,return=minimal' };

async function rowsFromSupabase(table) {
  const out = [];
  const since = new Date(Date.now() - TRACK_DAYS * 864e5).toISOString();
  const filter = TRACK.has(table) ? `&created_at=gte.${since}` : '';
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/${table}?select=*${filter}`, { headers: { apikey: SBKEY, authorization: `Bearer ${SBKEY}`, range: `${from}-${from + 999}`, 'range-unit': 'items' } });
    if (!r.ok) return null;
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}
function rowsFromSnapshot(table) {
  const f = `public/data/${table}.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
}

let total = 0;
for (const table of PUBLIC) {
  if (SKIP.has(table)) continue;
  let rows = SB && SBKEY ? await rowsFromSupabase(table) : null;
  const src = rows ? 'supabase' : 'snapshot';
  rows ??= rowsFromSnapshot(table);
  if (!rows) { console.log(table.padEnd(28), 'no source, skipped'); continue; }
  let ok = 0;
  for (let i = 0; i < rows.length; i += 80) {
    const batch = rows.slice(i, i + 80);
    const r = await fetch(`${SITE}/rest/v1/${table}?on_conflict=${table === 'disease_images' ? 'slot' : 'id'}`, { method: 'POST', headers: H, body: JSON.stringify(batch) });
    if (!r.ok) { console.error(table, 'batch', i, r.status, (await r.text()).slice(0, 200)); break; }
    ok += batch.length;
  }
  total += ok;
  console.log(table.padEnd(28), `${ok}/${rows.length}`.padEnd(12), src);
}
console.log('imported rows:', total);
