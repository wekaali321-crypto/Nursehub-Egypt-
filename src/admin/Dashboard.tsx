import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { BarChart, LineChart, DonutChart } from "../components/Charts";

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function Dashboard() {
  const {
    articles, comments, products, users, media, drugs, quizzes, attempts,
    categories, subscribers, dailyViews, downloads,
  } = useStore();

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");

  // Real metrics only — derived from actual stored data.
  const totalViews = articles.reduce((s, a) => s + a.views, 0);
  const pendingComments = comments.filter((c) => c.status === "pending").length;
  const images = media.filter((m) => m.type === "image").length;
  const videos = media.filter((m) => m.type === "video").length;
  const pdfs = media.filter((m) => m.type === "pdf").length;
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;
  const completedAttempts = attempts.length; // attempts are only recorded on completion

  // Real revenue = sum of SUCCESSFUL COMPLETED payments only.
  // No payment/orders system is connected yet → revenue is 0 (never fabricated).
  const totalRevenue = 0;

  // Real monthly views from the daily-view log.
  const now = new Date();
  const thisMonthPrefix = now.toISOString().slice(0, 7); // "2026-06"
  const monthlyViews = Object.entries(dailyViews)
    .filter(([d]) => d.startsWith(thisMonthPrefix))
    .reduce((s, [, v]) => s + v, 0);

  const stats = [
    { l: "المقالات", v: articles.length, i: "📝", c: "from-sky-500 to-blue-500", to: "/admin/articles" },
    { l: "منشورة", v: published.length, i: "✅", c: "from-emerald-500 to-teal-500", to: "/admin/articles" },
    { l: "مسودات", v: drafts.length, i: "📄", c: "from-slate-500 to-slate-600", to: "/admin/articles" },
    { l: "التصنيفات", v: categories.length, i: "📂", c: "from-violet-500 to-purple-500", to: "/admin/categories" },
    { l: "ملفات PDF", v: pdfs, i: "📕", c: "from-rose-500 to-pink-500", to: "/admin/media" },
    { l: "الفيديوهات", v: videos, i: "🎬", c: "from-orange-500 to-amber-500", to: "/admin/media" },
    { l: "الصور", v: images, i: "🖼️", c: "from-cyan-500 to-sky-500", to: "/admin/media" },
    { l: "التعليقات", v: comments.length, i: "💬", c: "from-amber-500 to-yellow-500", to: "/admin/comments" },
    { l: "المستخدمون", v: users.length, i: "👥", c: "from-indigo-500 to-blue-600", to: "/admin/users" },
    { l: "المنتجات", v: products.length, i: "🛒", c: "from-fuchsia-500 to-pink-500", to: "/admin/products" },
    { l: "الأدوية", v: drugs.length, i: "💊", c: "from-teal-500 to-emerald-500", to: "/admin/drugs" },
    { l: "المشاهدات", v: totalViews, i: "👁", c: "from-green-500 to-lime-500", to: "/admin/articles" },
    { l: "الاختبارات", v: quizzes.length, i: "📝", c: "from-purple-500 to-fuchsia-500", to: "/admin/quizzes" },
    { l: "محاولات الاختبار", v: completedAttempts, i: "🎯", c: "from-blue-500 to-indigo-500", to: "/admin/quizzes" },
    { l: "التحميلات", v: downloads, i: "⬇️", c: "from-slate-600 to-slate-700", to: "/admin/media" },
    { l: "المشتركون النشطون", v: activeSubscribers, i: "📧", c: "from-pink-500 to-rose-500", to: "/admin/subscribers" },
  ];

  // Real 6-month views trend from the daily-view log (0 where no data).
  const viewsTrend = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const prefix = d.toISOString().slice(0, 7);
    const value = Object.entries(dailyViews).filter(([k]) => k.startsWith(prefix)).reduce((s, [, v]) => s + v, 0);
    return { label: AR_MONTHS[d.getMonth()], value };
  });
  const hasViewData = viewsTrend.some((v) => v.value > 0);

  const topArticles = [...articles].filter((a) => a.views > 0).sort((a, b) => b.views - a.views).slice(0, 5);

  const CAT_KEYS = ["articles", "summaries", "drugs", "skills", "careplans", "books"] as const;
  const CAT_LABELS: Record<string, string> = { articles: "مقالات", summaries: "ملخصات", drugs: "أدوية", skills: "مهارات", careplans: "خطط", books: "كتب" };
  const categoryDist = CAT_KEYS.map((c, i) => ({
    label: CAT_LABELS[c],
    value: articles.filter((a) => a.category === c).length,
    color: ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"][i],
  })).filter((x) => x.value > 0);

  const Empty = ({ label }: { label: string }) => (
    <div className="flex h-40 items-center justify-center text-sm text-slate-400">{label}</div>
  );

  return (
    <div className="space-y-6">
      {/* Stat cards — all values are real counts from the database */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {stats.map((c) => (
          <Link key={c.l} to={c.to} className={`rounded-2xl bg-gradient-to-br ${c.c} p-4 text-white shadow-lg transition hover:scale-[1.03]`}>
            <div className="text-2xl">{c.i}</div>
            <div className="mt-2 text-2xl font-black">{c.v.toLocaleString("ar-EG")}</div>
            <div className="text-xs opacity-90">{c.l}</div>
          </Link>
        ))}
      </div>

      {/* Revenue & key figures — real values (0 until a payment system records completed payments) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="text-sm opacity-90">💰 إجمالي الأرباح (مدفوعات مكتملة)</div>
          <div className="mt-1 text-3xl font-black">{totalRevenue.toLocaleString("ar-EG")} ج.م</div>
          <Link to="/admin/earnings" className="mt-2 inline-block text-xs underline opacity-90">لوحة الأرباح ←</Link>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="text-sm opacity-90">📈 مشاهدات هذا الشهر</div>
          <div className="mt-1 text-3xl font-black">{monthlyViews.toLocaleString("ar-EG")}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
          <div className="text-sm opacity-90">💬 تعليقات بانتظار المراجعة</div>
          <div className="mt-1 text-3xl font-black">{pendingComments.toLocaleString("ar-EG")}</div>
          <Link to="/admin/comments" className="mt-2 inline-block text-xs underline opacity-90">مراجعة ←</Link>
        </div>
      </div>

      {/* Charts — generated only from live data; empty states when there is none */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold dark:text-white">📈 المشاهدات الشهرية</h3>
          {hasViewData ? <LineChart data={viewsTrend} /> : <Empty label="لا توجد بيانات مشاهدات بعد" />}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold dark:text-white">🍩 توزيع المحتوى حسب القسم</h3>
          {categoryDist.length > 0 ? <DonutChart data={categoryDist} /> : <Empty label="لا توجد بيانات" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold dark:text-white">🔥 أكثر المقالات مشاهدة</h3>
          {topArticles.length > 0 ? (
            <>
              <BarChart data={topArticles.map((a) => ({ label: a.title.slice(0, 6) + "…", value: a.views }))} />
              <div className="mt-3 space-y-2">
                {topArticles.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">{i + 1}</span>
                    <span className="flex-1 truncate dark:text-white">{a.title}</span>
                    <span className="text-slate-400">{a.views.toLocaleString("ar-EG")}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty label="لا توجد مشاهدات بعد" />}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold dark:text-white">⚡ إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "مقال جديد", i: "✍️", to: "/admin/editor" },
              { l: "اختبار جديد", i: "📝", to: "/admin/quizzes" },
              { l: "مكتبة الوسائط", i: "🖼️", to: "/admin/media" },
              { l: "لوحة الأرباح", i: "💰", to: "/admin/earnings" },
              { l: "التحليلات", i: "📊", to: "/admin/analytics" },
              { l: "النسخ الاحتياطي", i: "💾", to: "/admin/backup" },
            ].map((a) => (
              <Link key={a.l} to={a.to} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-4 text-center hover:border-sky-400 hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800">
                <span className="text-2xl">{a.i}</span><span className="text-sm font-semibold dark:text-white">{a.l}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
