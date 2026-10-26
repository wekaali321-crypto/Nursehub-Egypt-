import { supabase, isSupabaseConfigured } from "./supabase";
import { detectInstallPlatform, isStandalone } from "./pwaInstall";

/**
 * Real, anonymous site-wide traffic tracking.
 * - one random visitor id per browser (localStorage), no IP / personal data
 * - a page-view row per route change, a heartbeat every minute while the tab is visible
 * - install events (PWA installed, APK downloaded, install button clicked, installed-app launches)
 * Everything is best-effort: it never throws and never blocks the UI.
 */

const VID_KEY = "nh_vid";
const SID_KEY = "nh_sid";
const BOT_RE = /bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|preview|pingdom|monitor/i;

function rand(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function stored(kind: "local" | "session", key: string): string {
  // Merely touching window.localStorage can throw in some in-app browsers (blocked storage), so everything is guarded.
  try {
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    let v = storage.getItem(key) || "";
    if (!v) {
      v = rand();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    return rand();
  }
}

export function getVisitorId(): string {
  return stored("local", VID_KEY);
}

function getSessionId(): string {
  return stored("session", SID_KEY);
}

function isBot(): boolean {
  return typeof navigator === "undefined" || BOT_RE.test(navigator.userAgent) || (navigator as Navigator & { webdriver?: boolean }).webdriver === true;
}

/** Running as an installed app: home-screen PWA or the Android TWA (referrer android-app://). */
export function runningAsApp(): boolean {
  if (typeof document === "undefined") return false;
  return isStandalone() || document.referrer.startsWith("android-app://");
}

function deviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function sourceOf(): string {
  const ref = document.referrer;
  if (!ref || ref.startsWith("android-app://")) return "direct";
  try {
    if (new URL(ref).host === location.host) return "internal";
  } catch {
    /* ignore */
  }
  if (/google\./i.test(ref)) return "google";
  if (/facebook\.|fb\.com|l\.messenger/i.test(ref)) return "facebook";
  if (/twitter\.|x\.com|t\.co/i.test(ref)) return "twitter";
  if (/instagram\./i.test(ref)) return "instagram";
  if (/youtube\./i.test(ref)) return "youtube";
  if (/tiktok\./i.test(ref)) return "tiktok";
  if (/t\.me|telegram/i.test(ref)) return "telegram";
  if (/whatsapp/i.test(ref)) return "whatsapp";
  return "other";
}

const trackable = () => {
  try {
    return isSupabaseConfigured() && !!supabase && !isBot();
  } catch {
    return false;
  }
};

let lastPath = "";
let appOpenSent = false;

/** Call on every route change. Skips the admin area. */
export function trackPageview(path: string) {
  try {
    trackPageviewUnsafe(path);
  } catch {
    /* tracking must never break the app */
  }
}

function trackPageviewUnsafe(path: string) {
  if (!trackable() || path.startsWith("/admin") || path === lastPath) return;
  lastPath = path;
  const app = runningAsApp();
  void supabase!
    .from("site_visits")
    .insert({ visitor_id: getVisitorId(), session_id: getSessionId(), path: path.slice(0, 300), device_type: deviceType(), source: sourceOf(), is_app: app })
    .then(() => undefined, () => undefined);
  if (app && !appOpenSent) {
    appOpenSent = true;
    trackInstallEvent("app_open");
  }
}

/** Live presence: one lightweight ping per minute while the tab is visible. */
export function startHeartbeat(getPath: () => string) {
  try {
    return startHeartbeatUnsafe(getPath);
  } catch {
    return () => undefined;
  }
}

function startHeartbeatUnsafe(getPath: () => string) {
  if (!trackable()) return () => undefined;
  const ping = () => {
    if (document.visibilityState !== "visible" || getPath().startsWith("/admin")) return;
    void supabase!
      .from("site_pings")
      .insert({ visitor_id: getVisitorId(), path: getPath().slice(0, 300), device_type: deviceType(), is_app: runningAsApp() })
      .then(() => undefined, () => undefined);
  };
  ping();
  const id = window.setInterval(ping, 60_000);
  const onVis = () => document.visibilityState === "visible" && ping();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export type InstallEventKind = "install_click" | "installed" | "apk_download" | "app_open";

export function trackInstallEvent(kind: InstallEventKind) {
  try {
    trackInstallEventUnsafe(kind);
  } catch {
    /* tracking must never break the app */
  }
}

function trackInstallEventUnsafe(kind: InstallEventKind) {
  if (!trackable()) return;
  const platform = runningAsApp() && kind === "app_open" ? (document.referrer.startsWith("android-app://") ? "android-app" : "pwa") : detectInstallPlatform();
  void supabase!
    .from("site_installs")
    .insert({ visitor_id: getVisitorId(), kind, platform })
    .then(() => undefined, () => undefined);
}

try {
  if (typeof window !== "undefined") window.addEventListener("appinstalled", () => trackInstallEvent("installed"));
} catch {
  /* ignore */
}
