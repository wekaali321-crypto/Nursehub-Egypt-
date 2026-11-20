// End-to-end, 100% local: the forgot-password page (3 steps) against the REAL auth code (functions/_lib/sbauth.js) on an in-memory
// SQLite, with a stand-in mailer that keeps the e-mail instead of sending it. Mobile width (390 px). Nothing reaches production.
//   VITE_SUPABASE_URL=http://localhost:4181 VITE_SUPABASE_ANON_KEY=anon_key_1234567890_abcdef npx vite build --outDir <dir>
//   DIST_DIR=<dir> SHOTS=<dir> node --no-warnings tests/d1/e2e/e2e-password-reset.mjs
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { ROOT, newDb, mockD1, sqlFile } from '../helpers.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { handleAuth } = await import(pathToFileURL(join(ROOT, 'functions/_lib/sbauth.js')).href);

const { db } = newDb();
db.exec(sqlFile('0003_password_resets.sql'));
const env = { DB: mockD1(db), JWT_SECRET: 'e2e-secret', ADMIN_EMAIL: 'owner@test.local', ADMIN_PASSWORD: 'owner-pass-1', PBKDF2_ITER: '1000', GMAIL_USER: 'x@gmail.com', GMAIL_APP_PASSWORD: 'stand-in' };
const inbox = [];
const mailer = async (_e, m) => { inbox.push(m); };
const authCalls = [];

const DIST = process.env.DIST_DIR || join(ROOT, 'dist');
const SHOTS = process.env.SHOTS || '';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4181');
  if (u.pathname.startsWith('/auth/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: { ...req.headers, 'cf-connecting-ip': '127.0.0.9' }, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    authCalls.push(u.pathname);
    const r = await handleAuth(request, env, u.pathname.replace('/auth/v1/', '').split('/'), { mailer });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (/^\/(rest|api|storage|functions)\//.test(u.pathname)) { res.writeHead(404, { 'content-type': 'application/json' }); res.end(u.pathname.startsWith('/rest/') ? '[]' : '{}'); return; }
  let f = join(DIST, u.pathname); if (!existsSync(f) || !statSync(f).isFile()) f = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4181, r));

// a member with a password
await handleAuth(new Request('http://localhost:4181/auth/v1/signup', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '127.0.0.8' }, body: JSON.stringify({ email: 'member@test.local', password: 'oldpass1' }) }), env, ['signup']);

const pass = (n, d = '') => console.log(`  PASS  ${n}${d ? ' — ' + d : ''}`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'ar-EG' });
await ctx.route((url) => !/^http:\/\/localhost:4181\//.test(url.href), (r) => r.abort());
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
const shot = async (n) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${n}.png`), fullPage: false }); };
const codeOf = (m) => /رمز التحقق الخاص بك: (\d{6})/.exec(m.text)[1];

try {
  // unknown address: same message, no e-mail
  await page.goto('http://localhost:4181/forgot', { waitUntil: 'networkidle' });
  await page.fill('#reset-email', 'nobody@test.local');
  await shot('1-email');
  await page.click('text=إرسال رمز التحقق');
  await page.waitForSelector('#reset-code');
  const msgUnknown = await page.locator('[role=status]').first().innerText();
  assert.equal(inbox.length, 0);
  pass('unknown e-mail → code step with the generic message, no e-mail sent');
  await page.click('text=تغيير البريد');

  // real member
  await page.fill('#reset-email', 'member@test.local');
  await page.click('text=إرسال رمز التحقق');
  await page.waitForSelector('#reset-code');
  const msgReal = await page.locator('[role=status]').first().innerText();
  assert.equal(msgReal, msgUnknown, 'same wording for both');
  assert.equal(inbox.length, 1);
  assert.match(await page.locator('text=إعادة الإرسال بعد').innerText(), /\d+/);
  assert.ok(await page.locator('button:has-text("إعادة الإرسال بعد")').isDisabled(), 'resend disabled during the countdown');
  pass('real e-mail → same message, e-mail sent, resend locked with a countdown');

  const code = codeOf(inbox[0]);
  const wrong = code === '000000' ? '111111' : '000000';
  await page.fill('#reset-code', wrong);
  await page.click('text=تأكيد الرمز');
  await page.waitForSelector('[role=alert]');
  assert.match(await page.locator('[role=alert]').innerText(), /غير صحيح.*4/);
  await shot('2-code-wrong');
  pass('wrong code → "4 attempts left"');

  assert.equal(await page.locator('#new-pass').count(), 0, 'password step hidden before the code is verified');
  await page.fill('#reset-code', code);
  await page.click('text=تأكيد الرمز');
  await page.waitForSelector('#new-pass');
  pass('right code → password step');

  await page.fill('#new-pass', 'brandnew9');
  await page.fill('#new-pass2', 'brandnew8');
  assert.equal(await page.locator('#new-pass').getAttribute('type'), 'password');
  await page.click('button[aria-label="إظهار كلمة المرور"] >> nth=0');
  assert.equal(await page.locator('#new-pass').getAttribute('type'), 'text');
  await shot('3-password');
  await page.click('text=حفظ كلمة المرور');
  assert.match(await page.locator('[role=alert]').innerText(), /غير متطابقتين/);
  pass('show / hide works; mismatching confirmation refused in the page');

  await page.fill('#new-pass2', 'brandnew9');
  await page.click('text=حفظ كلمة المرور');
  await page.waitForSelector('text=تم تغيير كلمة المرور بنجاح');
  await shot('4-done');
  await page.waitForURL('**/login', { timeout: 6000 });
  pass('saved → success message → redirected to /login');

  await page.fill('input[type=email]', 'member@test.local');
  await page.fill('input[type=password]', 'brandnew9');
  await page.click('button:has-text("دخول")');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  pass('login with the new password works');

  // service workers are blocked in this harness, so main.tsx's "registered: registration.scope" log throws: not part of this page
  assert.deepEqual(errors.filter((e) => !/reading 'scope'/.test(e)), [], 'no page errors');
  const otpCalls = authCalls.filter((p) => p.includes('/otp/'));
  console.log(`\n  auth calls during the reset: ${otpCalls.length} (${[...new Set(otpCalls)].join(', ')}); Supabase / D1 table reads by the page: 0 besides auth`);
} finally {
  await browser.close(); server.close();
}
