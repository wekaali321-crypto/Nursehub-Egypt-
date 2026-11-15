import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { useMaintenance, saveMaintenance, refreshMaintenance } from "../lib/maintenance";
import { CATEGORY_LABELS } from "../lib/types";
import { supabase } from "../lib/supabase";
import { enablePushNotifications, hasPushSubscription, sendPushToAll } from "../lib/push";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

/* ---------------- Trash ---------------- */
export function TrashAdmin() {
  const { trash, restoreFromTrash, purgeTrash, emptyTrash } = useStore();
  const { notify } = useToast();
  const typeLabels: Record<string, string> = { article: "📝 مقال", media: "🖼️ ملف", user: "👤 مستخدم" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">العناصر المحذوفة: <span className="font-bold text-sky-500">{trash.length}</span></p>
        {trash.length > 0 && <button onClick={() => { if (confirm("حذف كل العناصر نهائياً؟")) { emptyTrash(); notify("تم تفريغ السلة"); } }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white">تفريغ السلة</button>}
      </div>
      {trash.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          <div className="text-5xl">🗑️</div><p className="mt-3">سلة المحذوفات فارغة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trash.map((t) => (
            <div key={t.id} className={`flex items-center justify-between ${card} py-3`}>
              <div><span className="font-bold dark:text-white">{typeLabels[t.type]} — {t.label}</span><div className="text-xs text-slate-400">حُذف في {t.deletedAt}</div></div>
              <div className="flex gap-1">
                <button onClick={() => { restoreFromTrash(t.id); notify("تمت الاستعادة"); }} className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">استعادة</button>
                <button onClick={() => { if (confirm("حذف نهائي؟")) { purgeTrash(t.id); notify("تم الحذف نهائياً"); } }} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف نهائي</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Version History (global list) ---------------- */
export function VersionsAdmin() {
  const { versions, articles, setData } = useStore();
  const { notify } = useToast();
  const [compare, setCompare] = useState<{ a: string; b: string } | null>(null);

  const articleTitle = (id: string) => articles.find((a) => a.id === id)?.title ?? (id === "draft" ? "مسودة جديدة" : "—");

  const restore = (articleId: string, content: string, title: string) => {
    const exists = articles.find((a) => a.id === articleId);
    if (!exists) { notify("المقال الأصلي غير موجود", "error"); return; }
    setData((d) => ({ ...d, articles: d.articles.map((a) => (a.id === articleId ? { ...a, content, title } : a)) }));
    notify("تم استعادة النسخة إلى المقال");
  };

  return (
    <div className="space-y-3">
      <p className="text-slate-500 dark:text-slate-400">إجمالي النسخ المحفوظة: <span className="font-bold text-sky-500">{versions.length}</span></p>
      {versions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700"><div className="text-5xl">🕘</div><p className="mt-3">لا توجد نسخ محفوظة بعد</p></div>}
      {versions.map((v) => (
        <div key={v.id} className={`${card} py-3`}>
          <div className="flex items-center justify-between">
            <div><span className="font-bold dark:text-white">{v.title}</span><div className="text-xs text-slate-400">{articleTitle(v.articleId)} • {v.savedAt} • {v.author}</div></div>
            <div className="flex gap-1">
              <button onClick={() => setCompare(compare?.a === v.id ? null : { a: v.id, b: v.content })} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800 dark:text-white">معاينة</button>
              <button onClick={() => restore(v.articleId, v.content, v.title)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">استعادة</button>
            </div>
          </div>
          {compare?.a === v.id && <div className="prose-content mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700" dangerouslySetInnerHTML={{ __html: compare.b }} />}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Maintenance Mode ---------------- */
// The switch is read from / written to nh_settings directly (saveMaintenance); the store then mirrors the result.
// While the server state is unknown (read failed or still running) the switch is disabled: a failed read must never be saved as OFF.
// The message can still be saved: saveMaintenance re-reads the live switch and keeps it, or saves nothing if that read fails.
export function MaintenanceAdmin() {
  const { settings, logActivity } = useStore();
  const { notify } = useToast();
  const maint = useMaintenance();
  const known = !!maint && maint.status !== "unknown";
  const isOn = known ? maint!.status === "on" : !!settings.maintenanceMode;
  const [msg, setMsg] = useState(maint?.message || settings.maintenanceMessage || "الموقع تحت الصيانة حالياً، سنعود قريباً 🛠️");
  const [until, setUntil] = useState(maint?.until ?? settings.maintenanceUntil ?? "");
  const [busy, setBusy] = useState(false);
  const touched = useRef(false);
  // Show the server's message once it is known (unless the admin already started editing).
  useEffect(() => {
    if (!known || touched.current) return;
    if (maint!.message) setMsg(maint!.message);
    setUntil(maint!.until ?? "");
  }, [known, maint]);

  const toggle = async (on: boolean) => {
    if (!known || busy) return;
    setBusy(true);
    try {
      await saveMaintenance({ on, message: msg, until });
      logActivity(on ? "تفعيل وضع الصيانة" : "إيقاف وضع الصيانة", "الموقع");
      notify(on ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة");
    } catch {
      notify("تعذّر حفظ حالة الصيانة — لم يتغيّر شيء", "error");
    } finally { setBusy(false); }
  };
  const saveCfg = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveMaintenance({ message: msg, until }); // keeps the current ON/OFF as stored on the server
      notify("تم الحفظ");
    } catch {
      notify("تعذّر الحفظ: لم نتمكن من قراءة حالة الصيانة الحالية، فلم يُحفظ شيء", "error");
    } finally { setBusy(false); }
  };
  const retry = async () => { setBusy(true); try { await refreshMaintenance(); } finally { setBusy(false); } };

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
  return (
    <div className="max-w-2xl space-y-4">
      {!known && (
        <div role="alert" data-testid="maint-unknown" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          <span>⚠️ {maint === null ? "جارٍ قراءة حالة الصيانة..." : "تعذّرت قراءة حالة الصيانة من الخادم. زر التشغيل/الإيقاف معطّل حتى تنجح القراءة."}</span>
          {maint !== null && <button onClick={retry} disabled={busy} className="rounded-lg bg-amber-500 px-4 py-1.5 text-white disabled:opacity-60">إعادة المحاولة</button>}
        </div>
      )}
      <div className={`flex items-center justify-between ${card}`}>
        <div>
          <h3 className="font-bold dark:text-white">🛠️ وضع الصيانة</h3>
          <p className="text-sm text-slate-500">عند التفعيل يرى الزوار صفحة صيانة. يبقى للمشرفين وصول كامل للوحة التحكم.</p>
        </div>
        <label className={`relative inline-flex items-center ${known && !busy ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
          <input type="checkbox" checked={isOn} disabled={!known || busy} onChange={(e) => void toggle(e.target.checked)} className="peer sr-only" aria-label="وضع الصيانة" />
          <div className="h-7 w-12 rounded-full bg-slate-300 after:absolute after:right-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:-translate-x-5 dark:bg-slate-600" />
        </label>
      </div>
      <div className={`space-y-3 ${card}`}>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">رسالة الصيانة</label><textarea value={msg} onChange={(e) => { touched.current = true; setMsg(e.target.value); }} rows={3} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">العودة المتوقعة (عداد تنازلي)</label><input type="datetime-local" value={until} onChange={(e) => { touched.current = true; setUntil(e.target.value); }} className={inp} /></div>
        <button onClick={() => void saveCfg()} disabled={busy} className="rounded-lg bg-sky-500 px-6 py-2 font-bold text-white disabled:opacity-60">حفظ الإعدادات</button>
      </div>
      {known && isOn && <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-600 dark:bg-amber-500/10">⚠️ وضع الصيانة مفعّل حالياً — الزوار يرون صفحة الصيانة.</div>}
    </div>
  );
}

/* ---------------- Enable real push notifications on THIS admin device ---------------- */
function EnableAdminPush() {
  const { notify } = useToast();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { hasPushSubscription().then(setSubscribed); }, []);

  const enable = async () => {
    setBusy(true);
    const res = await enablePushNotifications("admin");
    setBusy(false);
    if (res.ok) {
      setSubscribed(true);
      notify("تم تفعيل إشعارات الطلبات على هذا الجهاز", "success");
    } else {
      notify(res.reason || "تعذر التفعيل", "error");
    }
  };

  if (subscribed) {
    return (
      <div className={`${card} space-y-2 p-4`}>
        <p className="text-sm font-bold text-emerald-600">🔔 الإشعارات مفعّلة على هذا الجهاز — هتوصلك حتى لو الموقع أو المتصفح مقفول.</p>
        <button onClick={enable} disabled={busy} className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400">
          {busy ? "جارٍ التأكد..." : "إعادة المزامنة (لو الإشعارات مش وصلتك)"}
        </button>
      </div>
    );
  }

  return (
    <div className={`${card} space-y-2 p-4`}>
      <h3 className="font-bold dark:text-white">🔔 فعّل إشعارات الطلبات الجديدة</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        فعّلها من هنا عشان توصلك إشعارات فورية بكل طلب جديد على شاشة الموبايل، حتى لو التاب أو المتصفح مقفول — المهم إن الجهاز يكون متصل بالنت.
        فعّلها على كل جهاز/متصفح بتتابع منه الطلبات.
      </p>
      <button onClick={enable} disabled={busy} className="rounded-full bg-sky-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "جارٍ التفعيل..." : "تفعيل الآن"}
      </button>
    </div>
  );
}

/* ---------------- Manual broadcast to visitors ---------------- */
function BroadcastToVisitors() {
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/");
  const [titleEn, setTitleEn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [kind, setKind] = useState("broadcast");
  const [sending, setSending] = useState(false);

  const useWelcome = () => {
    setTitle("🩺 أهلاً بك في NurseHub Egypt");
    setBody("زور منصتك الأولى للتمريض — مجانًا بالكامل: أدوية، أمراض، مصطلحات، اختبارات وأكتر.");
    setTitleEn("🩺 Welcome to NurseHub Egypt");
    setBodyEn("Visit your first nursing platform — completely free: drugs, diseases, terminology, quizzes and more.");
    setLink("/");
    setKind("welcome");
  };

  const send = async () => {
    if (!title.trim() || !body.trim()) return notify("اكتب العنوان والنص", "error");
    if (!supabase) return notify("قاعدة البيانات غير متصلة", "error");
    setSending(true);
    const { data, error } = await sendPushToAll({ title, body, title_en: titleEn || undefined, body_en: bodyEn || undefined, kind, link: link || "/", tag: "broadcast-" + Date.now(), role: "visitor" });
    setSending(false);
    if (error) return notify("فشل الإرسال: " + error.message, "error");
    notify(`تم الإرسال إلى ${data?.sent ?? 0} من أصل ${data?.total ?? 0} جهاز مشترك`, "success");
    setTitle(""); setBody(""); setTitleEn(""); setBodyEn(""); setKind("broadcast");
  };

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
  return (
    <div className={`${card} space-y-3 p-4`}>
      <h3 className="font-bold dark:text-white">📣 ابعت إشعار/عرض لكل الزوار المشتركين</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">بيوصل كإشعار حقيقي على شاشة الموبايل حتى لو الزائر مش فاتح الموقع.</p>
      <button type="button" onClick={useWelcome} className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">🩺 قالب: ترحيب «منصتك الأولى للتمريض مجانًا»</button>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان (مثال: 🎉 عرض خاص اليوم فقط)" className={inp} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="نص الإشعار" rows={2} className={inp} />
      {(titleEn || bodyEn) && <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">EN: {titleEn} — {bodyEn}</p>}
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="رابط يفتح عند الضغط (مثال: /store)" className={inp} />
      <button onClick={send} disabled={sending} className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2 font-bold text-white disabled:opacity-50">{sending ? "جارٍ الإرسال..." : "إرسال الآن لكل الزوار"}</button>
    </div>
  );
}

/* ---------------- Notifications page ---------------- */
export function NotificationsAdmin() {
  const { notifications, markAllRead, markRead, clearNotifications } = useStore();
  const icons: Record<string, string> = { comment: "💬", user: "👤", system: "⚙️", backup: "💾", revenue: "💰", error: "⚠️" };
  return (
    <div className="space-y-3">
      <EnableAdminPush />
      <BroadcastToVisitors />
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">الإشعارات: <span className="font-bold text-sky-500">{notifications.length}</span></p>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="rounded-lg bg-sky-100 px-4 py-2 text-sm font-bold text-sky-600 dark:bg-sky-500/10">تعليم الكل كمقروء</button>
          <button onClick={clearNotifications} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600 dark:bg-red-500/10">مسح الكل</button>
        </div>
      </div>
      {notifications.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700"><div className="text-5xl">🔔</div><p className="mt-3">لا توجد إشعارات</p></div>}
      {notifications.map((n) => {
        const row = (
          <>
            <span className="text-2xl">{icons[n.type]}</span>
            <div className="flex-1"><div className="font-semibold dark:text-white">{n.message}</div><div className="text-xs text-slate-400">{n.date}</div></div>
            {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />}
            {n.link && <span className="text-slate-300 dark:text-slate-600">‹</span>}
          </>
        );
        return n.link ? (
          <Link key={n.id} to={n.link} onClick={() => markRead(n.id)} className={`flex items-center gap-3 ${card} py-3 transition hover:border-sky-300 ${!n.read ? "border-r-4 border-r-sky-500" : ""}`}>
            {row}
          </Link>
        ) : (
          <div key={n.id} onClick={() => markRead(n.id)} className={`flex cursor-pointer items-center gap-3 ${card} py-3 ${!n.read ? "border-r-4 border-r-sky-500" : ""}`}>
            {row}
          </div>
        );
      })}
    </div>
  );
}

// Re-export for convenience used in dashboard activity
export { CATEGORY_LABELS };
