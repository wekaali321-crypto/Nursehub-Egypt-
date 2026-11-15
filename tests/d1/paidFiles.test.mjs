// Paid product files: the file link is never in public reads; /api/order-lookup gives it only for a PAID order. Local only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1, loadSb } from './helpers.mjs';

const sb = await loadSb();
const { onRequestPost: lookup } = await import(pathToFileURL(join(ROOT, 'functions/api/order-lookup.js')).href);
globalThis.caches = { default: { match: async () => undefined, put: async () => {}, delete: async () => true } };

function setup() {
  const { db } = newDb();
  db.exec(`INSERT INTO products (id, title, type, price, file_url) VALUES ('p1', 'ICU book', 'pdf', 100, 'https://x.test/storage/v1/object/public/media/secret.pdf')`);
  db.exec(`INSERT INTO orders (id, customer_name, phone, invoice_no, status, items) VALUES ('o1', 'A', '010', 'INV-2026-0001', 'paid', '[{"productId":"p1","title":"ICU book"}]'), ('o2', 'B', '011', 'INV-2026-0002', 'pending', '[{"productId":"p1","title":"ICU book"}]')`);
  db.exec(`INSERT INTO profiles (id, role) VALUES ('admin-1', 'admin')`);
  return { DB: mockD1(db), JWT_SECRET: 'test-secret' };
}

test('public product reads never include file_url (select=* or explicit)', async () => {
  const env = setup();
  for (const qs of ['select=*', 'select=id,file_url']) {
    const rows = await (await sb.handleRest(new Request(`https://x.test/rest/v1/products?${qs}`), env, ['products'])).json();
    assert.equal(rows.length, 1); assert.equal(rows[0].file_url, undefined, qs); assert.equal(rows[0].title ?? 'ok', qs.includes('title') || qs === 'select=*' ? 'ICU book' : 'ok');
  }
});

test('the admin still sees file_url', async () => {
  const env = setup();
  const token = await sb.signJwt(env, { sub: 'admin-1', role: 'authenticated', email: 'a@x.test' });
  const rows = await (await sb.handleRest(new Request('https://x.test/rest/v1/products?select=*', { headers: { authorization: `Bearer ${token}` } }), env, ['products'])).json();
  assert.match(rows[0].file_url, /secret\.pdf$/);
});

test('order lookup: download link only for a paid order', async () => {
  const env = setup();
  const call = async (inv) => (await lookup({ request: new Request('https://x.test/api/order-lookup', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '9.9.9.9' }, body: JSON.stringify({ invoiceNo: inv }) }), env })).json();
  const paid = await call('INV-2026-0001');
  assert.match(paid.downloads.p1, /secret\.pdf$/);
  const pending = await call('INV-2026-0002');
  assert.deepEqual(pending.downloads, {});
});
