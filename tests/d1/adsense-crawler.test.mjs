// What the AdSense reviewer (Mediapartners-Google) sees: trust pages and list pages have real text; form pages carry no ad code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, newDb, mockD1 } from './helpers.mjs';

const { onRequest } = await import(pathToFileURL(join(ROOT, 'functions/[[path]].js')).href);
const { db } = newDb({ tables: ['courses', 'articles', 'products', 'drugs'] });
const SHELL = '<!doctype html><html><head><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1"></script><title>NurseHub Egypt | منصة تعليم التمريض</title><meta name="description" content="home" /></head><body><div id="root"></div></body></html>';
const env = { DB: mockD1(db), CF_PAGES_COMMIT_SHA: 'adsense-test', ASSETS: { fetch: async () => new Response(SHELL, { headers: { 'content-type': 'text/html' } }) } };
const store = new Map();
globalThis.caches = { default: { async match(r) { return store.get(r.url)?.clone(); }, async put(r, res) { store.set(r.url, res.clone()); } } };
const get = (path) => onRequest({ request: new Request(`https://nursehubegypt.com${path}`, { headers: { 'user-agent': 'Mediapartners-Google', accept: 'text/html' } }), env, next: async () => new Response(SHELL, { headers: { 'content-type': 'text/html' } }) });
const words = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

test('trust pages reach the crawler with their full text, own title and canonical', async () => {
  for (const [p, t, min] of [['/about', 'من نحن', 150], ['/privacy', 'سياسة الخصوصية', 400], ['/terms', 'شروط الاستخدام', 150], ['/contact', 'اتصل بنا', 60], ['/faq', 'الأسئلة الشائعة', 80]]) {
    const r = await get(p);
    const h = await r.text();
    assert.equal(r.status, 200, p);
    assert.match(h, new RegExp(`<title>${t} \\| NurseHub Egypt</title>`), p);
    assert.ok(h.includes(`<link rel="canonical" href="https://nursehubegypt.com${p}" />`), p);
    assert.ok(words(h) >= min, `${p}: ${words(h)} words`);
  }
  assert.ok((await (await get('/privacy')).text()).includes('Google AdSense'), 'privacy mentions AdSense and cookies');
});

test('list pages (courses, articles, store, all drugs, quizzes) are no longer empty for the crawler', async () => {
  for (const p of ['/courses', '/category/articles', '/store', '/drugs/all', '/quizzes']) {
    const r = await get(p);
    const h = await r.text();
    assert.equal(r.headers.get('x-seo-injected'), '1', p);
    assert.ok(words(h) > 60, `${p}: ${words(h)} words`);
  }
});

test('form / account pages: no ad code and noindex for crawlers', async () => {
  for (const p of ['/login', '/register', '/forgot', '/dashboard', '/cart', '/checkout']) {
    const r = await get(p);
    const h = await r.text();
    assert.ok(!h.includes('adsbygoogle'), `${p} has no ad code`);
    assert.equal(r.headers.get('x-robots-tag'), 'noindex', p);
  }
  assert.ok((await (await get('/about')).text()).includes('adsbygoogle'), 'content pages keep the ad code');
});
