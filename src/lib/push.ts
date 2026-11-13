import { supabase } from "./supabase";

// The PUBLIC VAPID key comes from the server (/api/vapid-key), so rotating keys needs no rebuild.
// The private half lives only in the Cloudflare env (VAPID_PRIVATE_KEY).
async function getVapidKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/vapid-key");
    const j = await r.json();
    return j?.key || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type PushRole = "admin" | "visitor";

/** True if this browser supports Web Push at all (feature-detection, not permission/subscription state). */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Registers /sw.js if it isn't already, and waits until it's active. Safe to call repeatedly. */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/**
 * Asks for notification permission, subscribes this device to Web Push, and
 * saves the subscription in Supabase. After a successful { ok: true }, the
 * device will receive real push notifications even with the site/browser
 * fully closed (as long as the OS/browser is running and connected to the
 * internet). Never throws — failures come back as { ok: false, reason }.
 */
export async function enablePushNotifications(role: PushRole = "visitor"): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "المتصفح لا يدعم الإشعارات" };
  if (!supabase) return { ok: false, reason: "قاعدة البيانات غير متصلة" };

  try {
    const reg = await ensureServiceWorker();

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "لم يتم منح إذن الإشعارات" };

    const vapid = await getVapidKey();
    if (!vapid) return { ok: false, reason: "الإشعارات غير مفعّلة على الخادم بعد" };
    const appKey = urlBase64ToUint8Array(vapid);

    let sub = await reg.pushManager.getSubscription();
    // A subscription made with a different server key (e.g. before the move to Cloudflare) can never receive pushes: renew it.
    if (sub) {
      const cur = sub.options?.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
      if (!cur || cur.length !== appKey.length || cur.some((b, i) => b !== appKey[i])) {
        await sub.unsubscribe().catch(() => {});
        sub = null;
      }
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    }

    const json = sub.toJSON() as any;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent,
        role,
      },
      { onConflict: "endpoint" }
    );
    if (error) return { ok: false, reason: error.message };
    try { localStorage.setItem("nh_push_role", role); } catch { /* ignore */ }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "حدث خطأ غير متوقع" };
  }
}

/**
 * Self-heal: devices that subscribed before the move to Cloudflare (old server key, never saved in the new database)
 * look "enabled" locally but receive nothing. When permission is already granted, silently renew + re-save the
 * subscription (no prompt is shown). Runs at most once a day per device and keeps the role the device chose.
 */
export async function syncPushSubscription(): Promise<void> {
  try {
    if (!isPushSupported() || Notification.permission !== "granted") return;
    const last = Number(localStorage.getItem("nh_push_sync") || 0);
    if (Date.now() - last < 24 * 3600 * 1000) return;
    if (!(await hasPushSubscription())) return;
    const role = (localStorage.getItem("nh_push_role") as PushRole) || "visitor";
    const res = await enablePushNotifications(role);
    if (res.ok) localStorage.setItem("nh_push_sync", String(Date.now()));
  } catch {
    /* never break the app */
  }
}

/** True if this device already has an active push subscription. */
export async function hasPushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

// Alias — some components (e.g. Navbar.tsx) import this under a different name.
export const hasActivePushSubscription = hasPushSubscription;

export type PushPayload = { title: string; body: string; link?: string; tag?: string; role?: PushRole; title_en?: string; body_en?: string; kind?: string };

/** Sends a push to all subscribers; the server sends 40 at a time, so this keeps calling until `next` is null. */
export async function sendPushToAll(opts: PushPayload): Promise<{ data: { total: number; sent: number } | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: "قاعدة البيانات غير متصلة" } };
  let offset = 0, sent = 0, total = 0;
  for (let guard = 0; guard < 200; guard++) {
    const { data, error } = await supabase.functions.invoke("send-push", { body: { ...opts, offset } });
    if (error) return { data: guard ? { total, sent } : null, error: { message: error.message } };
    sent += data?.sent ?? 0;
    total = data?.total ?? total;
    if (data?.next == null) break;
    offset = data.next;
  }
  return { data: { total, sent }, error: null };
}

/** Fires a push notification. Never throws — a notification hiccup must never break the calling flow. */
export async function triggerPush(opts: PushPayload) {
  try {
    await sendPushToAll(opts);
  } catch (e) {
    console.error("triggerPush failed:", e);
  }
}
