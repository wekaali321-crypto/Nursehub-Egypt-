import { supabase } from "./supabase";

// Public VAPID key — safe to expose in the client bundle by design (this is
// only the "public" half of the keypair; the private half stays server-side
// inside the send-push Edge Function).
export const VAPID_PUBLIC_KEY =
  "BFmnRQ4pF0ZO1kka4q2wPsSF7oXLz8WxpVB0tc-VzzEhecKKMnVnKnh1wlXP5dbRrrrQpoYC5VTIXJUKkmPUuA4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type PushRole = "admin" | "visitor";

/** Registers /sw.js if it isn't already, and waits until it's active. Safe to call repeatedly. */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("المتصفح لا يدعم الإشعارات");
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/**
 * Asks for notification permission, subscribes this device to Web Push, and
 * saves the subscription in Supabase. After this resolves, the device will
 * receive real push notifications even with the site/browser fully closed
 * (as long as the OS/browser is running and connected to the internet).
 */
export async function enablePushNotifications(role: PushRole = "visitor") {
  if (!("PushManager" in window)) throw new Error("المتصفح لا يدعم الإشعارات");
  if (!supabase) throw new Error("قاعدة البيانات غير متصلة");

  const reg = await ensureServiceWorker();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("لم يتم منح إذن الإشعارات");

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
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
  if (error) throw error;
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

/**
 * Fires a push notification via the send-push Edge Function. Never throws —
 * failures are logged and swallowed so a notification hiccup can never break
 * the calling flow (e.g. checkout).
 */
export async function triggerPush(opts: { title: string; body: string; link?: string; tag?: string; role?: PushRole }) {
  if (!supabase) return;
  try {
    await supabase.functions.invoke("send-push", { body: opts });
  } catch (e) {
    console.error("triggerPush failed:", e);
  }
}
