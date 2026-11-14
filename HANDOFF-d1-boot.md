# NurseHub Egypt — handoff (D1 read reduction + fast boot)

## Rules still in force (from the user)
No Push / Merge / Deploy without explicit approval. No requests to production, no SQL on production, no medical content or user data changes.
Merge into `main` only after the user says "اعمل دمج" (CLAUDE.md). Error messages / "قريبًا" wording is a SEPARATE task, not started.

## Branch: `fix/d1-read-reduction` (local only, NOT pushed)
- `b54b7f0` fix(d1): D1 quota -> HTTP 429 (not retried), static fallback only on real outage, never for JWT/admin, never caches snapshot data;
  topic pages read by primary key; travel counts/search from static files; admin stats tiered memo; edge page check no longer 500s on quota.
- `ab9ed46` perf(boot): HydrationGate shows a skeleton; 43 store-free routes (sections, topics, travel, exams, drug reference pages) render at once;
  a failed table in the bundle is dropped and the partial bundle is never cached.

## Deliverables
- Migration (NOT applied on production): `cloudflare/migrations/0002_read_indexes.sql` (12 indexes) + `0002_read_indexes_rollback.sql`.
- Tests: `npm run test:d1` (37 unit). E2E need a build against the local stand-in:
  `VITE_SUPABASE_URL=http://localhost:4180 VITE_SUPABASE_ANON_KEY=anon_key_1234567890_abcdef npm run build`, then
  `node --no-warnings tests/d1/e2e/e2e-local.mjs` (8 checks) and `tests/d1/e2e/e2e-boot.mjs` (6 checks).
- tsc: 98 errors (baseline 99).

## Open risks / next steps
1. Run the migration on D1 yourself (existing prod indexes unverified).
2. Snapshot is dated 2026-11-12; regenerate after content changes (`node scripts/snapshot-supabase.mjs`).
3. Bundle-dependent pages (home, articles, drugs) still wait for all 17 queries (now with skeleton). Idea: split the bundle per page.
4. Maintenance mode: store-free pages flash for a moment before the maintenance screen.
5. All-time admin stats still scan once per 24h per cache; suggest a rollup table. Functions requests (100k/day) is a separate limit.
6. Separate task: misleading empty states / raw D1 error text / "coming soon".
7. Phase 3 (static-first for public content) was only studied, not implemented.
8. Dashboard calibration: 13.48M reads / 13.19k queries / 270 writes (my earlier crawls + admin polling were the likely bulk).
