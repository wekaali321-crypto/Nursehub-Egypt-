// GET /api/vapid-key → the PUBLIC VAPID key (safe to expose). The browser uses it to subscribe to push.
export const onRequestGet = ({ env }) =>
  new Response(JSON.stringify({ key: env.VAPID_PUBLIC_KEY || null }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' } });
