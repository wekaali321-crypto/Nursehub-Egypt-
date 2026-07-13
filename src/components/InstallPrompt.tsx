import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Floating "Install App" button shown when the browser offers PWA install. */
export default function InstallPrompt() {
  const { lang } = useI18n();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("nursehub_pwa_dismissed") === "1");

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };
  const dismiss = () => { setDismissed(true); localStorage.setItem("nursehub_pwa_dismissed", "1"); };

  return (
    <div className="fixed bottom-4 left-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-xl text-white">🩺</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold dark:text-white">{lang === "ar" ? "ثبّت تطبيق NurseHub Egypt" : "Install NurseHub Egypt"}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{lang === "ar" ? "وصول أسرع وعمل دون اتصال" : "Faster access & offline-ready"}</div>
        </div>
        <button onClick={install} className="shrink-0 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-bold text-white">{lang === "ar" ? "تثبيت" : "Install"}</button>
        <button onClick={dismiss} className="shrink-0 rounded-full px-2 text-slate-400 hover:text-slate-600">✕</button>
      </div>
    </div>
  );
}
