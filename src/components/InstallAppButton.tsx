import { trackInstallEvent } from "../lib/siteTracker";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "../lib/i18n";
import { detectInstallPlatform, isStandalone, usePwaInstall, type InstallPlatform } from "../lib/pwaInstall";

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-text-bottom" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-text-bottom" fill="currentColor" aria-hidden>
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
);

const APK_URL = "/NurseHub-Egypt.apk";

interface Guide { title: string; steps: ReactNode[]; note?: string }

function guideFor(platform: InstallPlatform, ar: boolean): Guide {
  const b = (text: string) => <b className="text-sky-700 dark:text-sky-300">{text}</b>;
  const t = (a: string, e: string) => (ar ? a : e);
  switch (platform) {
    case "ios-safari":
      return {
        title: t("التثبيت على الآيفون (Safari)", "Install on iPhone (Safari)"),
        steps: [
          <>{t("اضغط زر المشاركة", "Tap the Share button")} <ShareIcon /> {t("في شريط Safari (أسفل الشاشة، وأعلاها في الآيباد).", "in the Safari toolbar (bottom of the screen, top on iPad).")}</>,
          <>{t("مرّر القائمة لأسفل واختر", "Scroll down and choose")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home Screen”"))}.</>,
          <>{t("اضغط", "Tap")} {b(t("«إضافة»", "“Add”"))} {t("— هتلاقي أيقونة NurseHub على شاشتك الرئيسية.", "— the NurseHub icon appears on your home screen.")}</>,
        ],
      };
    case "ios-chrome":
      return {
        title: t("التثبيت على الآيفون (Chrome)", "Install on iPhone (Chrome)"),
        steps: [
          <>{t("اضغط زر المشاركة", "Tap the Share button")} <ShareIcon /> {t("بجوار شريط العنوان (أعلى الشاشة).", "next to the address bar (top of the screen).")}</>,
          <>{t("اختر", "Choose")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home Screen”"))} {t("ثم اضغط «إضافة».", "then tap “Add”.")}</>,
        ],
        note: t("لو الخيار مش ظاهر، انسخ الرابط وافتحه في Safari ثم كرّر الخطوات.", "If you don’t see it, copy the link, open it in Safari and repeat the steps."),
      };
    case "ios-other":
      return {
        title: t("التثبيت على الآيفون", "Install on iPhone"),
        steps: [
          <>{t("افتح قائمة المتصفح", "Open the browser menu")} <DotsIcon /> {t("أو زر المشاركة", "or the Share button")} <ShareIcon />.</>,
          <>{t("اختر", "Choose")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home Screen”"))}.</>,
        ],
        note: t("لو الخيار مش ظاهر، انسخ الرابط وافتحه في Safari ثم اتبع خطوات Safari.", "If you don’t see it, copy the link, open it in Safari and follow the Safari steps."),
      };
    case "ios-inapp":
      return {
        title: t("افتح الموقع في Safari أولًا", "Open the site in Safari first"),
        steps: [
          <>{t("أنت داخل متصفح تطبيق (فيسبوك / إنستجرام / تيك توك ...) وهو لا يسمح بتثبيت المواقع.", "You are inside an app’s built-in browser (Facebook / Instagram / TikTok …) which cannot install sites.")}</>,
          <>{t("اضغط", "Tap")} <DotsIcon /> {t("أو", "or")} <ShareIcon /> {t("واختر", "and choose")} {b(t("«فتح في Safari»", "“Open in Safari”"))} {t("(أو انسخ الرابط من الزر أدناه وافتحه في Safari).", "(or copy the link with the button below and open it in Safari).")}</>,
          <>{t("بعدها اضغط", "Then tap")} <ShareIcon /> → {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home Screen”"))}.</>,
        ],
      };
    case "android-chrome":
      return {
        title: t("التثبيت على أندرويد (Chrome)", "Install on Android (Chrome)"),
        steps: [
          <>{t("اضغط قائمة Chrome", "Tap the Chrome menu")} <DotsIcon /> {t("(أعلى الشاشة).", "(top of the screen).")}</>,
          <>{t("اختر", "Choose")} {b(t("«تثبيت التطبيق»", "“Install app”"))} {t("أو", "or")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home screen”"))}.</>,
          <>{t("اضغط", "Tap")} {b(t("«تثبيت»", "“Install”"))} {t("— وهتلاقي أيقونة التطبيق في قائمة تطبيقاتك.", "— the app icon appears in your app list.")}</>,
        ],
      };
    case "android-samsung":
      return {
        title: t("التثبيت على أندرويد (Samsung Internet)", "Install on Android (Samsung Internet)"),
        steps: [
          <>{t("اضغط قائمة المتصفح", "Tap the browser menu")} <DotsIcon /> {t("أو ≡ (أسفل الشاشة).", "or ≡ (bottom of the screen).")}</>,
          <>{t("اختر", "Choose")} {b(t("«إضافة الصفحة إلى»", "“Add page to”"))} → {b(t("«الشاشة الرئيسية»", "“Home screen”"))} {t("(أو «تثبيت»).", "(or “Install”).")}</>,
          <>{t("اضغط «إضافة».", "Tap “Add”.")}</>,
        ],
      };
    case "android-firefox":
      return {
        title: t("التثبيت على أندرويد (Firefox)", "Install on Android (Firefox)"),
        steps: [
          <>{t("اضغط القائمة", "Tap the menu")} <DotsIcon />.</>,
          <>{t("اختر", "Choose")} {b(t("«تثبيت»", "“Install”"))} {t("أو", "or")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home screen”"))}.</>,
        ],
      };
    case "android-edge":
      return {
        title: t("التثبيت على أندرويد (Edge)", "Install on Android (Edge)"),
        steps: [
          <>{t("اضغط القائمة ≡ (أسفل الشاشة).", "Tap the ≡ menu (bottom of the screen).")}</>,
          <>{t("اختر", "Choose")} {b(t("«إضافة إلى الهاتف»", "“Add to phone”"))} {t("أو «تثبيت».", "or “Install”.")}</>,
        ],
      };
    case "android-inapp":
      return {
        title: t("افتح الموقع في Chrome أولًا", "Open the site in Chrome first"),
        steps: [
          <>{t("أنت داخل متصفح تطبيق (فيسبوك / إنستجرام / واتساب ...) وهو لا يسمح بتثبيت المواقع.", "You are inside an app’s built-in browser (Facebook / Instagram / WhatsApp …) which cannot install sites.")}</>,
          <>{t("اضغط", "Tap")} <DotsIcon /> {t("واختر", "and choose")} {b(t("«فتح في المتصفح»", "“Open in browser”"))} {t("(أو انسخ الرابط من الزر أدناه وافتحه في Chrome).", "(or copy the link with the button below and open it in Chrome).")}</>,
          <>{t("بعدها اضغط", "Then tap")} <DotsIcon /> → {b(t("«تثبيت التطبيق»", "“Install app”"))}.</>,
        ],
      };
    case "android-other":
      return {
        title: t("التثبيت على أندرويد", "Install on Android"),
        steps: [
          <>{t("افتح قائمة المتصفح", "Open the browser menu")} <DotsIcon /> {t("وابحث عن", "and look for")} {b(t("«تثبيت التطبيق»", "“Install app”"))} {t("أو", "or")} {b(t("«إضافة إلى الشاشة الرئيسية»", "“Add to Home screen”"))}.</>,
        ],
        note: t("لو الخيار مش موجود، انسخ الرابط وافتحه في Chrome.", "If the option isn’t there, copy the link and open it in Chrome."),
      };
    default:
      return {
        title: t("التثبيت على الكمبيوتر", "Install on desktop"),
        steps: [
          <>{t("في Chrome أو Edge: اضغط أيقونة التثبيت في يمين شريط العنوان", "In Chrome or Edge: click the install icon at the right of the address bar")} {t("أو افتح القائمة", "or open the menu")} <DotsIcon /> → {b(t("«تثبيت NurseHub»", "“Install NurseHub”"))}.</>,
        ],
      };
  }
}

/** Home-page button that installs the site as an app (Android, iPhone and browsers that hide the install option). */
export default function InstallAppButton() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { canPrompt, justInstalled, promptInstall } = usePwaInstall();
  const [standalone, setStandalone] = useState(() => isStandalone());
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platform] = useState<InstallPlatform>(() => detectInstallPlatform());

  useEffect(() => {
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const update = () => setStandalone(isStandalone());
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (standalone || justInstalled) return null;

  const onClick = async () => {
    trackInstallEvent("install_click");
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome) return;
    }
    setOpen(true);
  };

  const url = typeof window !== "undefined" ? window.location.origin : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const guide = guideFor(platform, ar);
  const isAndroid = platform.startsWith("android");
  const apkLink = (
    <a
      href={APK_URL}
      download="NurseHub-Egypt.apk"
      onClick={() => trackInstallEvent("apk_download")}
      className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/25 sm:text-sm"
    >
      <span aria-hidden>⬇️</span>
      {ar ? "أو حمّل ملف التطبيق (APK) لأندرويد" : "Or download the Android app (APK)"}
    </a>
  );

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-sky-700 shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:text-base"
      >
        <span className="text-xl" aria-hidden>📲</span>
        {ar ? "حمّل الموقع كتطبيق على موبايلك" : "Install the site as an app"}
      </button>
      {isAndroid && <div className="mx-auto flex max-w-xs justify-center">{apkLink}</div>}

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={guide.title}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 text-start text-slate-800 shadow-2xl dark:bg-slate-900 dark:text-slate-100 sm:rounded-3xl"
            dir={ar ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <img src="/icon-192.png" alt="NurseHub" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-black">{ar ? "ثبّت NurseHub Egypt كتطبيق" : "Install NurseHub Egypt as an app"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{ar ? "بنفس الشكل والسرعة من شاشتك الرئيسية" : "Open it from your home screen like any app"}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-full px-2 text-xl leading-none text-slate-400 hover:text-slate-600" aria-label={ar ? "إغلاق" : "Close"}>✕</button>
            </div>

            <div className="mb-2 text-sm font-bold text-sky-700 dark:text-sky-300">{guide.title}</div>
            <ol className="space-y-3">
              {guide.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">{i + 1}</span>
                  <span className="min-w-0 flex-1">{s}</span>
                </li>
              ))}
            </ol>
            {isAndroid && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <div className="mb-1 text-sm font-bold">{ar ? "طريقة أسهل: ملف التطبيق (APK)" : "Easier: the app file (APK)"}</div>
                <ol className="list-decimal space-y-1 ps-5">
                  <li>{ar ? "اضغط زر «تحميل APK» أدناه." : "Tap the “Download APK” button below."}</li>
                  <li>{ar ? "افتح الملف بعد التحميل واسمح بالتثبيت من هذا المصدر لو طلب منك الهاتف." : "Open the file and allow installing from this source if your phone asks."}</li>
                  <li>{ar ? "اضغط «تثبيت» — وهتلاقي أيقونة NurseHub في تطبيقاتك." : "Tap “Install” — the NurseHub icon appears in your apps."}</li>
                </ol>
                <a href={APK_URL} download="NurseHub-Egypt.apk" onClick={() => trackInstallEvent("apk_download")} className="mt-2 block rounded-lg bg-emerald-600 py-2 text-center text-sm font-bold text-white hover:bg-emerald-700">
                  ⬇️ {ar ? "تحميل APK" : "Download APK"}
                </a>
              </div>
            )}
            {guide.note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{guide.note}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="flex-1 rounded-xl border border-sky-300 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/30">
                {copied ? (ar ? "✓ تم نسخ الرابط" : "✓ Link copied") : ar ? "📋 نسخ رابط الموقع" : "📋 Copy site link"}
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button type="button" onClick={() => navigator.share({ title: "NurseHub Egypt", url }).catch(() => undefined)} className="flex-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600">
                  {ar ? "↗ مشاركة" : "↗ Share"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
