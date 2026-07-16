import { supabase, isSupabaseConfigured } from "./supabase";

// Must match the VAPID_PUBLIC_KEY used by the send-push Edge Function.
const VAPID_PUBLIC_KEY = "BP72d1He96SllU7JOtwJQRDOeuqxH-9FxVUUVrPR4bdxz4os5yQDYG8gCfo7x8tPZiVjjZW7Et_ip4xkEJtQk-o";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Requests notification permission, subscribes this device to Web Push,
 * and stores the subscription in Supabase so the send-push Edge Function
 * can reach it later — even if this tab/app is fully closed.
 */
export async function enablePushNotifications(role: "admin" | "visitor" = "visitor"): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "المتصفح ده مش بيدعم الإشعارات" };
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "قاعدة البيانات غير متصلة" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "تم رفض إذن الإشعارات" };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
      user_agent: navigator.userAgent,
      role,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false, reason: error.message };

  return { ok: true };
}

/** True if this device already has an active push subscription. */
export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}
