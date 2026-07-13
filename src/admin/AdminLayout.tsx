import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useTheme } from "../lib/theme";
import { useStore } from "../lib/store";
import Logo from "../components/Logo";

type NavItem = { p: string; l: string; i: string } | { section: string };

const nav: NavItem[] = [
  { p: "/admin", l: "لوحة المعلومات", i: "📊" },
  { section: "المحتوى" },
  { p: "/admin/articles", l: "المقالات", i: "📝" },
  { p: "/admin/editor", l: "إنشاء مقال", i: "✍️" },
  { p: "/admin/import-wizard", l: "معالج الاستيراد الذكي", i: "🪄" },
  { p: "/admin/recovery", l: "مركز الاسترجاع", i: "🛟" },
  { p: "/admin/drugs", l: "إدارة الأدوية", i: "💊" },
  { p: "/admin/quizzes", l: "الاختبارات (MCQ)", i: "📝" },
  { p: "/admin/pages", l: "الصفحات", i: "📄" },
  { p: "/admin/categories", l: "التصنيفات", i: "📂" },
  { p: "/admin/tags", l: "الوسوم", i: "🏷️" },
  { p: "/admin/media", l: "مكتبة الوسائط", i: "🖼️" },
  { section: "التفاعل" },
  { p: "/admin/comments", l: "التعليقات", i: "💬" },
  { p: "/admin/subscribers", l: "النشرة البريدية", i: "📧" },
  { p: "/admin/emails", l: "قوالب البريد", i: "✉️" },
  { section: "تحقيق الدخل" },
  { p: "/admin/earnings", l: "لوحة الأرباح", i: "💰" },
  { p: "/admin/products", l: "المتجر الرقمي", i: "🛒" },
  { p: "/admin/ads", l: "إدارة الإعلانات", i: "📢" },
  { p: "/admin/affiliates", l: "إدارة الأفلييت", i: "🔗" },
  { p: "/admin/payment-settings", l: "إعدادات الدفع", i: "💳" },
  { p: "/admin/orders", l: "الطلبات والفواتير", i: "🧾" },
  { p: "/admin/coupons", l: "الكوبونات", i: "🎟️" },
  { section: "التحليلات والإدارة" },
  { p: "/admin/analytics", l: "التحليلات", i: "📈" },
  { p: "/admin/users", l: "المستخدمون والصلاحيات", i: "👥" },
  { p: "/admin/home-categories", l: "بطاقات الرئيسية", i: "🃏" },
  { p: "/admin/home-builder", l: "ترتيب أقسام الرئيسية", i: "🏠" },
  { p: "/admin/menu", l: "القائمة الرئيسية", i: "🧭" },
  { p: "/admin/seo", l: "SEO والإعدادات", i: "🔎" },
  { p: "/admin/redirects", l: "إعادة التوجيه 301", i: "↪️" },
  { p: "/admin/activity", l: "سجل النشاط", i: "📋" },
  { section: "إدارة المحتوى" },
  { p: "/admin/content-ops", l: "مركز عمليات المحتوى", i: "📚" },
  { section: "ضمان الجودة" },
  { p: "/admin/qa", l: "مركز ضمان الجودة", i: "✅" },
  { section: "النظام والإعدادات" },
  { p: "/admin/settings", l: "إعدادات الموقع", i: "⚙️" },
  { p: "/admin/features", l: "مفاتيح الميزات", i: "🎚️" },
  { p: "/admin/notifications", l: "مركز الإشعارات", i: "🔔" },
  { p: "/admin/trash", l: "سلة المحذوفات", i: "🗑️" },
  { p: "/admin/versions", l: "سجل النسخ", i: "🕘" },
  { p: "/admin/maintenance", l: "وضع الصيانة", i: "🛠️" },
  { p: "/admin/biometrics", l: "المصادقة البيومترية", i: "🔐" },
  { p: "/admin/backup", l: "النسخ والاستعادة", i: "💾" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { notifications } = useStore();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 transform border-l border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <Logo size={38} />
          <div className="mt-1 text-[10px] font-semibold text-teal-500">لوحة التحكم</div>
        </div>
        <nav className="max-h-[calc(100vh-180px)] space-y-0.5 overflow-y-auto p-3">
          {nav.map((n, idx) =>
            "section" in n ? (
              <div key={"s" + idx} className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{n.section}</div>
            ) : (
              <Link key={n.p} to={n.p} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${loc.pathname === n.p ? "bg-sky-500 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <span>{n.i}</span>{n.l}
              </Link>
            )
          )}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <Link to="/" className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">🌐 عرض الموقع</Link>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">🚪 تسجيل الخروج</button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 lg:hidden dark:border-slate-700">☰</button>
          <h1 className="font-bold dark:text-white">{(nav.find((n) => "p" in n && n.p === loc.pathname) as { l: string } | undefined)?.l ?? "لوحة التحكم"}</h1>
          <div className="flex items-center gap-2">
            <Link to="/admin/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700" title="الإشعارات">
              🔔
              {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
            <button onClick={toggle} className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700">{theme === "dark" ? "☀️" : "🌙"}</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
