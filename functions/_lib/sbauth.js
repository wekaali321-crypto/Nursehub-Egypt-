// GoTrue-compatible auth subset on D1 (email/password, Google OAuth, PKCE, refresh tokens).
import { respond, perr, CORS, signJwt, verifyJwt, identify } from './sb.js';

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rid = () => hex(crypto.getRandomValues(new Uint8Array(16)));
const TTL = 3600;

async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256));
}
async function hashPassword(env, password) {
  const iter = Number(env.PBKDF2_ITER || 15000);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${hex(salt)}$${await pbkdf2(password, salt, iter)}`;
}
async function checkPassword(stored, password) {
  const [kind, iter, saltHex, h] = String(stored || '').split('$');
  if (kind !== 'pbkdf2') return false;
  const salt = Uint8Array.from(saltHex.match(/../g).map((x) => parseInt(x, 16)));
  const got = await pbkdf2(password, salt, Number(iter));
  let d = got.length ^ h.length;
  for (let i = 0; i < got.length; i++) d |= got.charCodeAt(i) ^ (h.charCodeAt(i) || 0);
  return d === 0;
}
const userJson = (u) => ({
  id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at,
  app_metadata: { provider: u.provider || 'email', providers: [u.provider || 'email'] },
  user_metadata: { ...(u.meta ? JSON.parse(u.meta) : {}), name: u.name || undefined, email: u.email },
  created_at: u.created_at, updated_at: u.created_at,
});
async function session(env, u) {
  const access = await signJwt(env, { sub: u.id, role: 'authenticated', email: u.email, user_metadata: { name: u.name } }, TTL);
  const refresh = rid() + rid();
  await env.DB.prepare('INSERT INTO auth_refresh (token,user_id,expires_at) VALUES (?,?,?)').bind(refresh, u.id, Date.now() + 60 * 86400e3).run();
  return { access_token: access, token_type: 'bearer', expires_in: TTL, expires_at: Math.floor(Date.now() / 1000) + TTL, refresh_token: refresh, user: userJson(u) };
}
async function ensureProfile(env, u, role = null) {
  await env.DB.prepare('INSERT INTO profiles (id,name,email,role) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(u.id, u.name || null, u.email, role).run();
}
const getUserByEmail = (env, email) => env.DB.prepare('SELECT * FROM auth_users WHERE email = ?').bind(email.toLowerCase()).first();

async function passwordLogin(env, email, password) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) return null;
  // The site owner signs in with the existing ADMIN_PASSWORD secret (no hash to migrate, no CPU-heavy hashing).
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD && email === String(env.ADMIN_EMAIL).toLowerCase()) {
    const a = enc.encode(password), b = enc.encode(env.ADMIN_PASSWORD);
    let d = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
    if (d !== 0) return null;
    let u = await getUserByEmail(env, email);
    if (!u) {
      await env.DB.prepare('INSERT INTO auth_users (email,name,provider) VALUES (?,?,?)').bind(email, 'Admin', 'email').run();
      u = await getUserByEmail(env, email);
    }
    await ensureProfile(env, u, 'superadmin');
    await env.DB.prepare("UPDATE profiles SET role='superadmin' WHERE id=? AND (role IS NULL OR role NOT IN ('admin','superadmin'))").bind(u.id).run();
    return u;
  }
  const u = await getUserByEmail(env, email);
  if (!u || !(await checkPassword(u.password_hash, password))) return null;
  return u;
}

export async function handleAuth(request, env, path) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (!env.DB || !env.JWT_SECRET) return perr(503, 'unexpected_failure', 'Auth is not configured (DB / JWT_SECRET)');
  const url = new URL(request.url);
  const route = path.join('/');
  const body = ['POST', 'PUT'].includes(request.method) ? await request.json().catch(() => ({})) : {};
  const bad = (code, msg, status = 400) => respond({ code: status, error_code: code, msg }, status);

  if (route === 'token') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const u = await passwordLogin(env, body.email, body.password);
      if (!u) return bad('invalid_credentials', 'Invalid login credentials');
      return respond(await session(env, u));
    }
    if (grant === 'refresh_token') {
      const r = await env.DB.prepare('SELECT * FROM auth_refresh WHERE token = ?').bind(body.refresh_token || '').first();
      if (!r || r.expires_at < Date.now()) return bad('refresh_token_not_found', 'Invalid Refresh Token', 400);
      const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(r.user_id).first();
      await env.DB.prepare('DELETE FROM auth_refresh WHERE token = ?').bind(r.token).run();
      return u ? respond(await session(env, u)) : bad('user_not_found', 'User not found');
    }
    if (grant === 'pkce') {
      const c = await env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(body.auth_code || '').first();
      if (!c || c.expires_at < Date.now()) return bad('flow_state_not_found', 'Invalid or expired code');
      const ver = b64u(await crypto.subtle.digest('SHA-256', enc.encode(body.code_verifier || '')));
      if (c.challenge && ver !== c.challenge) return bad('bad_code_verifier', 'Code verifier mismatch');
      await env.DB.prepare('DELETE FROM auth_codes WHERE code = ?').bind(c.code).run();
      const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(c.user_id).first();
      return respond(await session(env, u));
    }
    return bad('unsupported_grant_type', 'Unsupported grant type');
  }

  if (route === 'signup') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || String(body.password || '').length < 6) return bad('validation_failed', 'Invalid email or password (min 6 chars)', 422);
    if (await getUserByEmail(env, email)) return bad('user_already_exists', 'User already registered', 422);
    const name = body.data?.name || body.data?.full_name || null;
    await env.DB.prepare('INSERT INTO auth_users (email,password_hash,name,meta) VALUES (?,?,?,?)').bind(email, await hashPassword(env, body.password), name, JSON.stringify(body.data || {})).run();
    const u = await getUserByEmail(env, email);
    await ensureProfile(env, u, null);
    return respond(await session(env, u));
  }

  if (route === 'user') {
    const who = await identify(request, env);
    if (!who.uid) return bad('bad_jwt', 'invalid JWT', 401);
    const u = await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(who.uid).first();
    if (!u) return bad('user_not_found', 'User not found', 404);
    if (request.method === 'PUT') {
      if (body.password) {
        if (String(body.password).length < 6) return bad('weak_password', 'Password too short', 422);
        await env.DB.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').bind(await hashPassword(env, body.password), u.id).run();
      }
      if (body.data) await env.DB.prepare('UPDATE auth_users SET meta = ?, name = COALESCE(?, name) WHERE id = ?').bind(JSON.stringify(body.data), body.data.name || null, u.id).run();
      return respond(userJson(await env.DB.prepare('SELECT * FROM auth_users WHERE id = ?').bind(u.id).first()));
    }
    return respond(userJson(u));
  }

  if (route === 'logout') {
    const who = await identify(request, env);
    if (who.uid) await env.DB.prepare('DELETE FROM auth_refresh WHERE user_id = ?').bind(who.uid).run();
    return new Response(null, { status: 204, headers: CORS });
  }

  if (route === 'recover') return respond({}); // no outbound e-mail on the free plan; reset is done by the site owner (see cloudflare/README.md)

  if (route === 'settings') return respond({ external: { google: !!env.GOOGLE_CLIENT_ID, email: true }, disable_signup: false, mailer_autoconfirm: true });

  // Google OAuth (authorization-code flow handled here, PKCE hand-off to supabase-js)
  if (route === 'authorize') {
    if (!env.GOOGLE_CLIENT_ID) return bad('provider_disabled', 'Google sign-in is not configured', 400);
    const state = b64u(enc.encode(JSON.stringify({ r: url.searchParams.get('redirect_to') || url.origin, c: url.searchParams.get('code_challenge') || '', n: rid() })));
    const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    g.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/auth/v1/callback`, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString();
    return Response.redirect(g.toString(), 302);
  }
  if (route === 'callback') {
    try {
      const st = JSON.parse(atob(url.searchParams.get('state').replace(/-/g, '+').replace(/_/g, '/')));
      const tr = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/auth/v1/callback`, grant_type: 'authorization_code' }) })).json();
      const info = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { authorization: `Bearer ${tr.access_token}` } })).json();
      const email = String(info.email || '').toLowerCase();
      if (!email) throw new Error('no email');
      let u = await getUserByEmail(env, email);
      if (!u) { await env.DB.prepare('INSERT INTO auth_users (email,name,provider) VALUES (?,?,?)').bind(email, info.name || null, 'google').run(); u = await getUserByEmail(env, email); }
      await ensureProfile(env, u, null);
      const code = rid() + rid();
      await env.DB.prepare('INSERT INTO auth_codes (code,user_id,challenge,expires_at) VALUES (?,?,?,?)').bind(code, u.id, st.c, Date.now() + 5 * 60e3).run();
      const dest = new URL(st.r); dest.searchParams.set('code', code);
      return Response.redirect(dest.toString(), 302);
    } catch (e) {
      return Response.redirect(`${url.origin}/login?error=oauth`, 302);
    }
  }
  return perr(404, 'not_found', `Unknown auth route ${route}`);
}
void verifyJwt;
