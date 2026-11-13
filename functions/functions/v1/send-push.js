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
  const out = await pushToRole(env, b.role === 'admin' ? 'admin' : 'visitor', { title: String(b.title).slice(0, 120), body: String(b.body).slice(0, 300), link: b.link || '/', id: b.tag || 'default' }, Number(b.offset) || 0);
  return respond(out, out.error ? 503 : 200);
}
