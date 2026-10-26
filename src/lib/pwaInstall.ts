import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The browser fires `beforeinstallprompt` once, early — often before any component mounts —
// so it is captured at module load and shared with every component that needs it.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

/** True when the site is already running as an installed app (home-screen icon / standalone window). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

export type InstallPlatform =
  | "ios-safari"
  | "ios-chrome"
  | "ios-other"
  | "ios-inapp"
  | "android-chrome"
  | "android-samsung"
  | "android-firefox"
  | "android-edge"
  | "android-inapp"
  | "android-other"
  | "desktop";

/** Work out which manual install steps apply to this browser. */
export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || iPadOS) {
    if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Snapchat|Twitter|WhatsApp|Telegram/i.test(ua) || !/Safari/.test(ua)) return "ios-inapp";
    if (/CriOS/.test(ua)) return "ios-chrome";
    if (/FxiOS|EdgiOS|OPiOS|GSA/.test(ua)) return "ios-other";
    return "ios-safari";
  }
  if (/Android/i.test(ua)) {
    if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Snapchat|Twitter|WhatsApp|Telegram|; wv\)/i.test(ua)) return "android-inapp";
    if (/SamsungBrowser/i.test(ua)) return "android-samsung";
    if (/Firefox/i.test(ua)) return "android-firefox";
    if (/EdgA/i.test(ua)) return "android-edge";
    if (/Chrome\//.test(ua) && !/OPR|UCBrowser|MiuiBrowser|HuaweiBrowser/i.test(ua)) return "android-chrome";
    return "android-other";
  }
  return "desktop";
}

/** Shared state of the PWA install flow: whether the one-tap native prompt is available. */
export function usePwaInstall() {
  const key = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => `${deferred ? 1 : 0}${installed ? 1 : 0}`,
    () => "00"
  );
  const canPrompt = key[0] === "1";
  const justInstalled = key[1] === "1";

  /** Opens the browser's native install dialog. Returns the user's choice, or null if unavailable. */
  const promptInstall = async (): Promise<"accepted" | "dismissed" | null> => {
    if (!deferred) return null;
    const ev = deferred;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    deferred = null;
    emit();
    return outcome;
  };

  return { canPrompt, justInstalled, promptInstall };
}
