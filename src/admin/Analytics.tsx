import { useStore } from "../lib/store";
import { LineChart } from "../components/Charts";
import { useToast } from "../components/Toast";
import { Link } from "react-router-dom";
import { useSiteTraffic } from "./useSiteTraffic";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

export function AnalyticsAdmin() {
  const { dailyViews, downloads, attempts } = useStore();
  const { notify } = useToast();
  const { stats: tr, error: trErr } = useSiteTraffic(10_000);

  // Real metrics only.
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayViews = dailyViews[todayStr] || 0;

  const kpis = [
    { l: "نشطون الآن", v: tr?.online_now ?? 0, i: "🟢" },
    { l: "زوار اليوم", v: tr?.today.visitors ?? 0, i: "👥" },
    { l: "مشاهدات اليوم", v: tr?.today.views ?? todayViews, i: "📅" },
    { l: "زوار هذا الشهر", v: tr?.monthly[0]?.visitors ?? 0, i: "🗓️" },
    { l: "نزّلوا التطبيق (إجمالي)", v: tr?.totals.installers ?? 0, i: "⬇️" },
    { l: "إجمالي الزوار", v: tr?.totals.visitors ?? 0, i: "🌍" },
    { l: "التحميلات", v: downloads, i: "📥" },
    { l: "محاولات الاختبار", v: attempts.length, i: "🎯" },
  ];

  // Real 14-day trend of page views from the live visit log
  const trend = (tr?.daily ?? []).slice(-14).map((d) => ({ label: d.day.slice(8), value: d.views }));
  const hasTrend = trend.some((t) => t.value > 0);

  const topPages = (tr?.top_pages_30d ?? []).slice(0, 8).map((p) => ({ id: p.path, title: p.path, views: p.views }));

  const exportReport = () => {
    const rows = topPages.map((p) => `${p.title.replace(/,/g, " ")},${p.views}`).join("\n");
    const csv = "page,views\n" + rows;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "analytics-report.csv"; a.click();
    notify("تم تصدير التقرير");
  };

  const Empty = ({ label }: { label: string }) => <div className="flex h-40 items-center justify-center text-sm text-slate-400">{label}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold dark:text-white">📊 التحليلات (بيانات فعلية ومباشرة)</h2>
        <Link to="/admin/traffic" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white">📡 صفحة الزوار والتنزيلات</Link>
        <button onClick={exportReport} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">⬇️ تصدير التقرير</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className={card}>
            <div className="text-2xl">{k.i}</div>
            <div className="mt-1 text-2xl font-black text-sky-600">{k.v.toLocaleString("ar-EG")}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{k.l}</div>
          </div>
        ))}
      </div>

      <div className={card}>
        <h3 className="mb-4 font-bold dark:text-white">📈 المشاهدات آخر 14 يوماً </h3>
        {hasTrend ? <LineChart data={trend} height={180} /> : <Empty label="لا توجد بيانات مشاهدات بعد — ستُسجَّل تلقائياً مع زيارات الموقع" />}
      </div>

      <div className={card}>
        <h3 className="mb-4 font-bold dark:text-white">🔝 أكثر الصفحات زيارة (آخر 30 يوم)</h3>
        {topPages.length > 0 ? (
          <div className="space-y-2">
            {topPages.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">{i + 1}</span>
                <span className="flex-1 truncate dark:text-white">{p.title}</span>
                <span className="text-slate-400">{p.views.toLocaleString("ar-EG")} مشاهدة</span>
              </div>
            ))}
          </div>
        ) : <Empty label="لا توجد مشاهدات بعد" />}
      </div>

      {trErr && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{trErr}</div>}
    </div>
  );
}
