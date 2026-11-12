// POST /functions/v1/send-push — placeholder until web-push is ported to Cloudflare.
import { respond, CORS, identify, isAdmin } from '../../_lib/sb.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const who = await identify(request, env);
  if (!(await isAdmin(env, who))) return respond({ error: 'Admin only' }, 401);
  return respond({ error: 'push sending is not enabled on the Cloudflare backend yet', total: 0, sent: 0 }, 501);
}
