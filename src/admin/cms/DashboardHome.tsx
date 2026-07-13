import { Link } from "react-router-dom";
import { useStore } from "../../lib/store";
import { BarChart, LineChart, DonutChart } from "../../components/Charts";
import { useAdminStats, formatBytes, formatEGP } from "./useAdminData";
import { PageHeader, StatCard, cardCls, Badge } from "./ui";

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function DashboardHome() {
  const s = useAdminStats();
  const store = useStore();
  const now = new Date();

  const stats = [
    { l: "إجمالي المستخدمين", v: s.totalUsers, i: "👥", c: "from-indigo-500 to-blue-600", to: "/admin/users" },
    { l: "المستخدمون النشطون", v: s.activeUsers, i: "🟢", c: "from-emerald-500 to-green-600", to: "/admin/users" },
    { l: "المشتركون Premium", v: s.premiumUsers, i: "⭐", c: "from-amber-500 to-yellow-500", to: "/admin/users" },
    { l: "المقالات", v: s.articles, i: "📝", c: "from-sky-500 to-blue-500", to: "/admin/articles" },
    { l: "منشورة", v: s.publishedArticles, i: "✅", c: "from-emerald-500 to-teal-500", to: "/admin/articles" },
    { l: "مسودات", v: s.draftArticles, i: "📄", c: "from-slate-500 to-slate-600", to: "/admin/articles" },
    { l: "التصنيفات", v: s.categories, i: "📂", c: "from-violet-500 to-purple-500", to: "/admin/categories" },
    { l: "الكتب", v: s.books, i: "📚", c: "from-rose-500 to-pink-500", to: "/admin/products" },
    { l: "ملفات PDF", v: s.pdfs, i: "📕", c: "from-red-500 to-rose-500", to: "/admin/media" },
    { l: "الفيديوهات", v: s.videos, i: "🎬", c: "from-orange-500 to-amber-500", to: "/admin/media" },
    { l: "الاختبارات", v: s.exams, i: "🎯", c: "from-purple-500 to-fuchsia-500", to: "/admin/quizzes" },
    { l: "الشهادات", v: s.certificates, i: "🏆", c: "from-yellow-500 to-amber-600", to: "/admin/quizzes" },
    { l: "الطلبات", v: s.orders, i: "🛍️", c: "from-fuchsia-500 to-pink-500", to: "/admin/orders" },
    { l: "التحميلات", v: s.downloads, i: "⬇️", c: "from-slate-600 to-slate-700", to: "/admin/media" },
    { l: "التعليقات", v: s.comments, i: "💬", c: "from-amber-500 to-yellow-500", to: "/admin/comments" },
    { l: "التخزين", v: formatBytes(s.storageBytes), i: "💾", c: "from-cyan-500 to-sky-500", to: "/admin/media" },
  ];

  // Real 6-month views trend from daily-view log
  const viewsTrend = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const prefix = d.toISOString().slice(0, 7);
    const value = Object.entries(store.dailyViews || {})
      .filter(([k]) => k.startsWith(prefix))
      .reduce((sum, [, v]) => sum + (v as number), 0);
    return { label: AR_MONTHS[d.getMonth()], value };
  });

  // Content distribution donut
  const contentDist = [
    { label: "مقالات", value: s.articles, color: "#0ea5e9" },
    { label: "كتب", value: s.books, color: "#f43f5e" },
    { label: "اختبارات", value: s.exams, color: "#a855f7" },
    { label: "أدوية", value: store.drugs.length, color: "#14b8a6" },
  ].filter((x) => x.value > 0);

  // Articles by status bar chart
  const statusBar = [
    { label: "منشورة", value: s.publishedArticles },
    { label: "مسودات", value: s.draftArticles },
    { label: "تعليقات", value: s.comments },
    { label: "اختبارات", value: s.exams },
  ];

  const recentArticles = [...store.articles]
    .sort((a: any, b: any) => (b.publishDate || "").localeCompare(a.publishDate || ""))
    .slice(0, 6);

  const recentActivity = (store.activity || []).slice(0, 8);

  const quickActions = [
    { l: "مقال جديد", i: "✍️", to: "/admin/editor", c: "from-sky-500 to-blue-500" },
    { l: "رفع وسائط", i: "📤", to: "/admin/media", c: "from-emerald-500 to-teal-500" },
    { l: "دواء جديد", i: "💊", to: "/admin/drugs", c: "from-teal-500 to-cyan-500" },
    { l: "اختبار جديد", i: "🎯", to: "/admin/quizzes", c: "from-purple-500 to-fuchsia-500" },
    { l: "التصنيفات", i: "📂", to: "/admin/categories", c: "from-violet-500 to-purple-500" },
    { l: "الإعدادات", i: "⚙️", to: "/admin/settings", c: "from-slate-500 to-slate-600" },
  ];

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`مرحباً بك في نظام إدارة NurseHub Egypt`}
        icon="📊"
        actions={
          <Badge tone={s.source === "supabase" ? "green" : "amber"}>
            {s.source === "supabase" ? "🟢 متصل بـ Supabase" : "🟡 وضع محلي"}
          </Badge>
        }
      />

      {/* Revenue banner */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="text-sm opacity-90">💰 إجمالي الإيرادات</div>
          <div className="mt-1 text-3xl font-black">{formatEGP(s.revenue)}</div>
          <div className="mt-1 text-xs opacity-80">مدفوعات مكتملة فقط</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg shadow-sky-500/20">
          <div className="text-sm opacity-90">📅 إيرادات الشهر</div>
          <div className="mt-1 text-3xl font-black">{formatEGP(s.monthlyRevenue)}</div>
          <div className="mt-1 text-xs opacity-80">{AR_MONTHS[now.getMonth()]} {now.getFullYear()}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="text-sm opacity-90">🛍️ الطلبات</div>
          <div className="mt-1 text-3xl font-black">{s.orders}</div>
          <div className="mt-1 text-xs opacity-80">إجمالي الطلبات</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="text-sm opacity-90">💬 تعليقات معلّقة</div>
          <div className="mt-1 text-3xl font-black">{s.pendingComments}</div>
          <div className="mt-1 text-xs opacity-80">بانتظار المراجعة</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to} className={`${cardCls} group flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.c} text-xl text-white shadow-md transition group-hover:scale-110`}>{a.i}</div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{a.l}</span>
          </Link>
        ))}
      </div>

      {/* Stat grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {stats.map((st) => (
          <StatCard key={st.l} label={st.l} value={s.loading ? "…" : st.v} icon={st.i} gradient={st.c} />
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className={`${cardCls} p-5 lg:col-span-2`}>
          <h3 className="mb-4 font-black text-slate-800 dark:text-white">📈 المشاهدات (آخر 6 أشهر)</h3>
          <LineChart data={viewsTrend} />
        </div>
        <div className={`${cardCls} p-5`}>
          <h3 className="mb-4 font-black text-slate-800 dark:text-white">🍩 توزيع المحتوى</h3>
          {contentDist.length ? <DonutChart data={contentDist} /> : <p className="py-10 text-center text-sm text-slate-400">لا توجد بيانات</p>}
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} p-5`}>
          <h3 className="mb-4 font-black text-slate-800 dark:text-white">📊 ملخص النشاط</h3>
          <BarChart data={statusBar} />
        </div>

        {/* Recent activity */}
        <div className={`${cardCls} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-slate-800 dark:text-white">🕐 آخر النشاطات</h3>
            <Link to="/admin/activity" className="text-xs font-bold text-sky-500 hover:underline">عرض الكل</Link>
          </div>
          {recentActivity.length ? (
            <div className="space-y-2">
              {recentActivity.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-700 dark:text-slate-200">{a.action}</div>
                    <div className="truncate text-xs text-slate-400">{a.target}</div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{a.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">لا توجد نشاطات بعد</p>
          )}
        </div>
      </div>

      {/* Recent articles */}
      <div className={`${cardCls} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-slate-800 dark:text-white">📝 أحدث المقالات</h3>
          <Link to="/admin/articles" className="text-xs font-bold text-sky-500 hover:underline">إدارة المقالات</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 dark:border-slate-800">
                <th className="pb-2 font-medium">العنوان</th>
                <th className="pb-2 font-medium">الحالة</th>
                <th className="pb-2 font-medium">المشاهدات</th>
                <th className="pb-2 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentArticles.map((a: any) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                  <td className="py-2.5">
                    <Link to={`/admin/editor?id=${a.id}`} className="font-medium text-slate-700 hover:text-sky-500 dark:text-slate-200">{a.title}</Link>
                  </td>
                  <td className="py-2.5">
                    <Badge tone={a.status === "published" ? "green" : a.status === "draft" ? "slate" : "amber"}>
                      {a.status === "published" ? "منشور" : a.status === "draft" ? "مسودة" : a.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-slate-500">{a.views ?? 0}</td>
                  <td className="py-2.5 text-slate-400">{a.publishDate || "—"}</td>
                </tr>
              ))}
              {!recentArticles.length && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">لا توجد مقالات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
