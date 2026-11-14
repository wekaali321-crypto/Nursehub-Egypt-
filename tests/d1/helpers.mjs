// Shared helpers for the local D1 tests: an in-memory SQLite that behaves like the D1 binding used by functions/_lib/sb.js,
// loaded with the real snapshot data (public/data), plus a bundler for the TypeScript client modules.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

export const ROOT = resolve(new URL('../..', import.meta.url).pathname);
export const sqlFile = (n) => readFileSync(join(ROOT, 'cloudflare/migrations', n), 'utf8');

/** D1-like binding on top of node:sqlite. `log` records every statement (sql + bound params). */
export function mockD1(db, { failWith = null } = {}) {
  const log = [];
  const run = (sql, params, mode) => {
    if (failWith) throw (typeof failWith === 'function' ? failWith(sql) : failWith);
    log.push({ sql, params });
    const st = db.prepare(sql);
    if (mode === 'all') return { results: st.all(...params), success: true };
    if (mode === 'first') return st.get(...params) ?? null;
    const r = st.run(...params); return { success: true, meta: { changes: r.changes } };
  };
  return {
    log,
    prepare(sql) {
      // like the real D1 binding: statements can be run directly or after bind()
      const bound = (...params) => ({
        all: async () => run(sql, params, 'all'),
        first: async () => run(sql, params, 'first'),
        run: async () => run(sql, params, 'run'),
      });
      return { bind: bound, ...bound() };
    },
  };
}

const colsOf = (db, table) => db.prepare(`PRAGMA table_info("${table}")`).all().map((c) => c.name);

/** Insert rows of public/data/<table>.json into the matching table (unknown columns are skipped). */
export function loadSnapshot(db, table, limit = Infinity) {
  const f = join(ROOT, 'public/data', `${table}.json`);
  if (!existsSync(f)) return 0;
  const rows = JSON.parse(readFileSync(f, 'utf8')).slice(0, limit);
  if (!rows.length) return 0;
  const cols = colsOf(db, table);
  const use = Object.keys(rows[0]).filter((k) => cols.includes(k));
  const st = db.prepare(`INSERT OR REPLACE INTO "${table}" (${use.map((c) => `"${c}"`).join(',')}) VALUES (${use.map(() => '?').join(',')})`);
  db.exec('BEGIN');
  for (const r of rows) st.run(...use.map((k) => { const v = r[k]; return v == null ? null : typeof v === 'object' ? JSON.stringify(v) : typeof v === 'boolean' ? (v ? 1 : 0) : v; }));
  db.exec('COMMIT');
  return rows.length;
}

export function newDb({ migrate0002 = false, tables = [] } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(sqlFile('0001_init.sql'));
  if (migrate0002) db.exec(sqlFile('0002_read_indexes.sql'));
  const counts = {};
  for (const t of tables) counts[t] = loadSnapshot(db, t);
  return { db, counts };
}

/** Estimated rows read by one statement: SCAN = whole table, SEARCH = rows inside the index range (bounded by LIMIT+OFFSET when the index gives the order). */
export function rowsRead(db, sql, params = []) {
  const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params).map((r) => r.detail);
  const tables = [...new Set([...sql.matchAll(/\bFROM\s+"?(\w+)"?/gi)].map((m) => m[1]))];
  const main = tables[0];
  const total = db.prepare(`SELECT COUNT(*) n FROM "${main}"`).get().n;
  // any SCAN (table or whole index) visits every row/entry; SEARCH visits only the rows inside the index range
  const scan = plan.some((p) => /^SCAN /.test(p));
  if (scan) return { reads: total, plan: plan.join(' | '), kind: 'SCAN' };
  const base = sql.replace(/\s+LIMIT\s+\d+(\s+OFFSET\s+\d+)?\s*$/i, '').replace(/\s+ORDER BY .*$/i, '');
  let matched;
  try { matched = db.prepare(`SELECT COUNT(*) n FROM (${base})`).get(...params).n; } catch { matched = total; }
  const lim = /LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?\s*$/i.exec(sql);
  const sorted = plan.some((p) => /TEMP B-TREE FOR ORDER BY/.test(p));
  const reads = lim && !sorted ? Math.min(matched, Number(lim[1]) + Number(lim[2] || 0)) : matched;
  return { reads, plan: plan.join(' | '), kind: 'SEARCH' };
}

/** Bundle a TypeScript client module (browser code) for Node tests. `alias` maps import specifiers to files. */
export async function loadTs(entry, alias = {}) {
  const out = await build({
    entryPoints: [entry.startsWith('/') ? entry : join(ROOT, entry)], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
    plugins: [{ name: 'alias', setup(b) { b.onResolve({ filter: /.*/ }, (a) => { const v = alias[a.path]; return !v ? null : typeof v === 'object' ? { path: v.external, external: true } : { path: v }; }); } }],
  });
  const dir = join(tmpdir(), 'nh-d1-tests'); mkdirSync(dir, { recursive: true });
  const file = join(dir, `${entry.replace(/[^\w]+/g, '_')}_${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(file, out.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

export async function loadSb() { return import(pathToFileURL(join(ROOT, 'functions/_lib/sb.js')).href); }
