import { sendWebPush } from './webpush.js';

export const PUSH_BATCH = 40; // Pages Functions (free) allow ~50 subrequests per request: 1 D1 read + N pushes + 1 D1 cleanup

/** Sends `payload` to push subscriptions of a role, `PUSH_BATCH` at a time. Returns { total, sent, failed, removed, next }. */
export async function pushToRole(env, role, payload, offset = 0) {
  if (!env.DB || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return { error: 'push keys are not configured', total: 0, sent: 0, failed: 0, removed: 0, next: null };
  const total = (await env.DB.prepare('SELECT COUNT(*) n FROM push_subscriptions WHERE role = ?').bind(role).first()).n;
  const subs = (await env.DB.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE role = ? ORDER BY id LIMIT ? OFFSET ?').bind(role, PUSH_BATCH, offset).all()).results;
  const results = await Promise.all(subs.map((s) => sendWebPush(s, payload, env)));
  const dead = subs.filter((_, i) => results[i].gone).map((s) => s.id);
  if (dead.length) await env.DB.batch(dead.map((id) => env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(id)));
  const nextOffset = offset + PUSH_BATCH - dead.length; // deleted rows shift the remaining ones up
  return { total, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok && !r.gone).length, removed: dead.length, next: subs.length === PUSH_BATCH && nextOffset < total ? nextOffset : null };
}
