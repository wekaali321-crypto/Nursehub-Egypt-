// admin_site_stats: the dashboard polls it, so it must (1) return the same numbers as before and (2) stop rescanning site_visits on every poll.
// Old implementation = functions/_lib/sb.js from `main` (read with git), new = the working tree. Data is SYNTHETIC (clearly not production).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1, loadSb, rowsRead } from './helpers.mjs';

const dir = mkdtempSync(join(tmpdir(), 'nh-oldsb-'));
for (const f of ['push.js', 'sbschema.js', 'webpush.js']) copyFileSync(join(ROOT, 'functions/_lib', f), join(dir, f));
writeFileSync(join(dir, 'sb.js'), execSync('git show main:functions/_lib/sb.js', { cwd: ROOT, maxBuffer: 1e8 }));
const oldSb = await import(pathToFileURL(join(dir, 'sb.js')).href);
const newSb = await loadSb();

function seed(db) {
  const insV = db.prepare("INSERT INTO site_visits (visitor_id, path, is_app, device_type, source, created_at) VALUES (?,?,?,?,?, strftime('%Y-%m-%dT%H:%M:%fZ','now', ?))");
  const insI = db.prepare("INSERT INTO site_installs (visitor_id, kind, platform, created_at) VALUES (?,?,?, strftime('%Y-%m-%dT%H:%M:%fZ','now', ?))");
  const insP = db.prepare("INSERT INTO site_pings (visitor_id, is_app, created_at) VALUES (?,?, strftime('%Y-%m-%dT%H:%M:%fZ','now', ?))");
  db.exec('BEGIN');
  let seedN = 12345; const rnd = () => (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 20000; i++) {
    const v = `v${Math.floor(rnd() * 800)}`; const minsAgo = Math.floor(rnd() * 45 * 24 * 60);
    insV.run(v, `/p/${Math.floor(rnd() * 30)}`, rnd() < 0.2 ? 1 : 0, rnd() < 0.6 ? 'mobile' : 'desktop', rnd() < 0.5 ? 'google' : null, `-${minsAgo} minutes`);
  }
  for (let i = 0; i < 200; i++) insI.run(`v${i}`, i % 3 ? 'installed' : 'apk_download', i % 2 ? 'android' : 'ios', `-${Math.floor(rnd() * 40)} days`);
  for (let i = 0; i < 60; i++) insP.run(`v${i}`, i % 5 ? 0 : 1, `-${i * 4} seconds`);
  db.exec("INSERT INTO profiles (id, role) VALUES ('admin-1','admin')");
  db.exec('COMMIT');
}

async function adminCall(sb, d1) {
  const token = await sb.signJwt({ JWT_SECRET: 'test-secret' }, { sub: 'admin-1', role: 'authenticated', email: 'a@x.test' });
  const env = { DB: d1, JWT_SECRET: 'test-secret' };
  const res = await sb.handleRest(new Request('https://x.test/rest/v1/rpc/admin_site_stats', { method: 'POST', headers: { authorization: `Bearer ${token}` } }), env, ['rpc', 'admin_site_stats']);
  return { status: res.status, body: await res.json() };
}
/** Rows read by one statement: a real table SCAN reads the whole table; an index-bounded statement reads the rows inside its created_at window. */
function stmtReads(db, sql, params) {
  const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params).map((r) => r.detail);
  const real = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name));
  let full = 0;
  for (const p of plan) { const m = /^SCAN (\w+)/.exec(p); if (m && real.has(m[1])) full += db.prepare(`SELECT COUNT(*) n FROM ${m[1]}`).get().n; }
  if (full) return { reads: full, full: true };
  let reads = 0;
  for (const m of sql.matchAll(/FROM (site_\w+)/g)) {
    const t = m[1];
    const rng = /created_at >= \? AND created_at < \?/.exec(sql) && params.length >= 2
      ? db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE created_at >= ? AND created_at < ?`).get(params[0], params[1]).n
      : (() => { const w = /created_at > (datetime\('now','[^']+'\))/.exec(sql); return w ? db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE created_at > ${w[1]}`).get().n : 1; })();
    reads += rng;
  }
  return { reads: reads || 1, full: false };
}
const measure = (db, log) => log.filter((q) => /^\s*SELECT/i.test(q.sql)).reduce((a, q) => { const r = stmtReads(db, q.sql, q.params); return { reads: a.reads + r.reads, fullScans: a.fullScans + (r.full ? 1 : 0) }; }, { reads: 0, fullScans: 0 });

test('same numbers as the previous implementation', async () => {
  const a = newDb(); seed(a.db);
  newSb.__statsMemoReset();
  const o = await adminCall(oldSb, mockD1(a.db)), n = await adminCall(newSb, mockD1(a.db));
  assert.equal(o.status, 200); assert.equal(n.status, 200);
  for (const k of ['online_now', 'online_app', 'today', 'yesterday', 'totals', 'daily', 'installs_by_kind', 'installs_by_platform', 'devices_30d', 'sources_30d', 'top_pages_30d']) {
    assert.deepEqual(n.body[k], o.body[k], k);
  }
  // 12-month table: the data spans 45 days, so only the first months differ by being windowed; values in the window are identical
  assert.deepEqual(n.body.monthly, o.body.monthly);
});

test('rows read per poll: first call vs the polls that follow (same isolate)', async () => {
  const a = newDb({ migrate0002: true }); seed(a.db);
  newSb.__statsMemoReset();
  const dOld = mockD1(a.db), dNew = mockD1(a.db);
  await adminCall(oldSb, dOld); const oldFirst = measure(a.db, dOld.log); dOld.log.length = 0;
  await adminCall(oldSb, dOld); const oldNext = measure(a.db, dOld.log);
  await adminCall(newSb, dNew); const newFirst = measure(a.db, dNew.log); dNew.log.length = 0;
  await adminCall(newSb, dNew); const newNext = measure(a.db, dNew.log);
  const stmts = dNew.log.length;
  console.log(`\n  site_visits=${a.db.prepare('SELECT COUNT(*) n FROM site_visits').get().n} rows (synthetic)\n  old: every poll    ${oldFirst.reads.toLocaleString()} rows (${oldFirst.fullScans} full table scans), later polls ${oldNext.reads.toLocaleString()}\n  new: first poll    ${newFirst.reads.toLocaleString()} rows (${newFirst.fullScans} full scans), later polls ${newNext.reads.toLocaleString()} rows (${newNext.fullScans} full scans, ${stmts} statements)`);
  assert.equal(newNext.fullScans, 0, 'later polls never scan a whole table');
  assert.ok(newNext.reads < oldNext.reads / 20, 'later polls read at least 20x fewer rows');
  assert.ok(newFirst.reads < oldFirst.reads, 'even the first poll is cheaper');
  assert.ok(stmts <= 12);
});

test('only an admin can call it (no behaviour change in permissions)', async () => {
  const b = newDb(); seed(b.db);
  const env = { DB: mockD1(b.db), JWT_SECRET: 'test-secret' };
  const anon = await newSb.handleRest(new Request('https://x.test/rest/v1/rpc/admin_site_stats', { method: 'POST' }), env, ['rpc', 'admin_site_stats']);
  assert.equal(anon.status, 403);
  const tok = await newSb.signJwt(env, { sub: 'someone-else', role: 'authenticated' });
  const user = await newSb.handleRest(new Request('https://x.test/rest/v1/rpc/admin_site_stats', { method: 'POST', headers: { authorization: `Bearer ${tok}` } }), env, ['rpc', 'admin_site_stats']);
  assert.equal(user.status, 403);
});
