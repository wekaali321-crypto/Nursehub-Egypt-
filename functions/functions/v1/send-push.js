// POST /functions/v1/send-push  body: { title, body, link, tag, role, offset }
// Admin only. Sends in batches of 40 and returns `next` (offset) while more subscribers remain — the client keeps calling.
import { respond, CORS, identify, isAdmin } from '../../_lib/sb.js';
import { pushToRole } from '../../_lib/push.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return respond({ error: 'POST only' }, 405);
  const who = await identify(request, env);
  if (!(await isAdmin(env, who))) return respond({ error: 'Admin only' }, 401);
  const b = await request.json().catch(() => ({}));
  if (!b.title || !b.body) return respond({ error: 'title and body are required' }, 400);
  const role = b.role === 'admin' ? 'admin' : 'visitor';
  const offset = Number(b.offset) || 0;
  // keep a copy in the in-app notification center (once per broadcast, on the first batch)
  if (role === 'visitor' && offset === 0 && b.kind !== 'silent') {
    try {
      await env.DB.prepare('INSERT INTO user_notifications (title, body, title_en, body_en, link, kind) VALUES (?,?,?,?,?,?)')
        .bind(String(b.title).slice(0, 120), String(b.body).slice(0, 300), b.title_en ? String(b.title_en).slice(0, 120) : null, b.body_en ? String(b.body_en).slice(0, 300) : null, b.link || '/', b.kind || 'broadcast').run();
      await env.DB.prepare("DELETE FROM user_notifications WHERE id NOT IN (SELECT id FROM user_notifications ORDER BY created_at DESC LIMIT 50)").run();
    } catch { /* the push itself must still go out */ }
  }
  const out = await pushToRole(env, role, { title: String(b.title).slice(0, 120), body: String(b.body).slice(0, 300), link: b.link || '/', id: b.tag || 'default' }, offset);
  return respond(out, out.error ? 503 : 200);
}
