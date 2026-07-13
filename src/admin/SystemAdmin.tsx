import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { CATEGORY_LABELS } from "../lib/types";

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
export function MaintenanceAdmin() {
  const { settings, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [msg, setMsg] = useState(settings.maintenanceMessage ?? "الموقع تحت الصيانة حالياً، سنعود قريباً 🛠️");
  const [until, setUntil] = useState(settings.maintenanceUntil ?? "");

  const toggle = (on: boolean) => {
    setData((d) => ({ ...d, settings: { ...d.settings, maintenanceMode: on, maintenanceMessage: msg, maintenanceUntil: until } }));
    logActivity(on ? "تفعيل وضع الصيانة" : "إيقاف وضع الصيانة", "الموقع");
    notify(on ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة");
  };
  const saveCfg = () => { setData((d) => ({ ...d, settings: { ...d.settings, maintenanceMessage: msg, maintenanceUntil: until } })); notify("تم الحفظ"); };

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
  return (
    <div className="max-w-2xl space-y-4">
      <div className={`flex items-center justify-between ${card}`}>
        <div>
          <h3 className="font-bold dark:text-white">🛠️ وضع الصيانة</h3>
          <p className="text-sm text-slate-500">عند التفعيل يرى الزوار صفحة صيانة. يبقى للمشرفين وصول كامل للوحة التحكم.</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={!!settings.maintenanceMode} onChange={(e) => toggle(e.target.checked)} className="peer sr-only" />
          <div className="h-7 w-12 rounded-full bg-slate-300 after:absolute after:right-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:-translate-x-5 dark:bg-slate-600" />
        </label>
      </div>
      <div className={`space-y-3 ${card}`}>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">رسالة الصيانة</label><textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">العودة المتوقعة (عداد تنازلي)</label><input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} className={inp} /></div>
        <button onClick={saveCfg} className="rounded-lg bg-sky-500 px-6 py-2 font-bold text-white">حفظ الإعدادات</button>
      </div>
      {settings.maintenanceMode && <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-600 dark:bg-amber-500/10">⚠️ وضع الصيانة مفعّل حالياً — الزوار يرون صفحة الصيانة.</div>}
    </div>
  );
}

/* ---------------- Notifications page ---------------- */
export function NotificationsAdmin() {
  const { notifications, markAllRead, clearNotifications } = useStore();
  const icons: Record<string, string> = { comment: "💬", user: "👤", system: "⚙️", backup: "💾", revenue: "💰", error: "⚠️" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">الإشعارات: <span className="font-bold text-sky-500">{notifications.length}</span></p>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="rounded-lg bg-sky-100 px-4 py-2 text-sm font-bold text-sky-600 dark:bg-sky-500/10">تعليم الكل كمقروء</button>
          <button onClick={clearNotifications} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-600 dark:bg-red-500/10">مسح الكل</button>
        </div>
      </div>
      {notifications.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700"><div className="text-5xl">🔔</div><p className="mt-3">لا توجد إشعارات</p></div>}
      {notifications.map((n) => (
        <div key={n.id} className={`flex items-center gap-3 ${card} py-3 ${!n.read ? "border-r-4 border-r-sky-500" : ""}`}>
          <span className="text-2xl">{icons[n.type]}</span>
          <div className="flex-1"><div className="font-semibold dark:text-white">{n.message}</div><div className="text-xs text-slate-400">{n.date}</div></div>
          {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />}
        </div>
      ))}
    </div>
  );
}

// Re-export for convenience used in dashboard activity
export { CATEGORY_LABELS };
