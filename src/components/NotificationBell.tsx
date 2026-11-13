import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { cacheGet, cacheSet } from "../lib/remoteCache";
import { useI18n } from "../lib/i18n";
import { enablePushNotifications, hasActivePushSubscription, isPushSupported } from "../lib/push";

type Notif = { id: string; title: string; body: string | null; title_en: string | null; body_en: string | null; link: string | null; kind: string | null; created_at: string };

const SEEN_KEY = "nh_notif_seen";
const CACHE_KEY = "nh_notifs";
const KIND_ICON: Record<string, string> = { article: "📰", product: "📚", welcome: "🩺", broadcast: "📣" };

const getSeen = () => {
  try { return Number(localStorage.getItem(SEEN_KEY) || 0); } catch { return 0; }
};

function ago(iso: string, ar: boolean) {
  const ms = Date.now() - new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z").getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return ar ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return ar ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return ar ? `منذ ${d} يوم` : `${d}d ago`;
}

/** In-app notification center: the latest announcements sent to visitors (also the ones the visitor missed as a push). */
export default function NotificationBell() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const nav = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(getSeen());
  const [pushOn, setPushOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = await cacheGet<Notif[]>(CACHE_KEY, 2 * 60 * 1000);
      if (cached && cached.length) { setItems(cached); return; }
    }
    if (!supabase) return;
    const { data } = await supabase
      .from("user_notifications")
      .select("id,title,body,title_en,body_en,link,kind,created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) { setItems(data as Notif[]); if (data.length) void cacheSet(CACHE_KEY, data); }
  }, []);

  useEffect(() => {
    void load();
    if (isPushSupported()) hasActivePushSubscription().then(setPushOn).catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const ts = (n: Notif) => new Date(n.created_at.includes("T") ? n.created_at : n.created_at.replace(" ", "T") + "Z").getTime();
  const unread = items.filter((n) => ts(n) > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      void load(true); // always fresh when the panel is opened (one small request)
      const now = Date.now();
      try { localStorage.setItem(SEEN_KEY, String(now)); } catch { /* ignore */ }
      setSeen(now);
    }
  };

  const enable = async () => {
    setBusy(true);
    const res = await enablePushNotifications("visitor");
    setBusy(false);
    if (res.ok) setPushOn(true);
  };

  const go = (n: Notif) => {
    setOpen(false);
    const l = n.link || "/";
    if (/^https?:/i.test(l)) window.open(l, "_blank", "noopener");
    else nav(l);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={ar ? "الإشعارات" : "Notifications"}
        title={ar ? "الإشعارات" : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg hover:bg-slate-100 sm:h-10 sm:w-10 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div
          dir={ar ? "rtl" : "ltr"}
          className="fixed inset-x-3 top-16 z-[70] max-h-[75vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-96 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-sky-500 to-emerald-500 px-4 py-3 text-white dark:border-slate-800">
            <b>{ar ? "🔔 مركز الإشعارات" : "🔔 Notifications"}</b>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-lg leading-none">✕</button>
          </div>
          {isPushSupported() && !pushOn && (
            <button
              onClick={enable}
              disabled={busy}
              className="w-full border-b border-slate-100 bg-amber-50 px-4 py-2.5 text-start text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-slate-800 dark:bg-amber-500/10 dark:text-amber-300"
            >
              {ar ? "🔕 فعّل الإشعارات لتصلك الجديد على موبايلك" : "🔕 Turn on alerts to get updates on your phone"}
            </button>
          )}
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">{ar ? "لا توجد إشعارات بعد." : "No notifications yet."}</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n)}
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-start hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className="mt-0.5 text-xl">{KIND_ICON[n.kind || ""] || "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{(!ar && n.title_en) || n.title}</span>
                    {((!ar && n.body_en) || n.body) && <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-300">{(!ar && n.body_en) || n.body}</span>}
                    <span className="mt-1 block text-[11px] text-slate-400">{ago(n.created_at, ar)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
