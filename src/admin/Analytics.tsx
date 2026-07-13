import { useStore } from "../lib/store";
import { LineChart } from "../components/Charts";
import { useToast } from "../components/Toast";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

export function AnalyticsAdmin() {
  const { articles, dailyViews, downloads, attempts } = useStore();
  const { notify } = useToast();

  // Real metrics only.
  const totalViews = articles.reduce((s, a) => s + a.views, 0);
  const daysTracked = Object.keys(dailyViews).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayViews = dailyViews[todayStr] || 0;

  const kpis = [
    { l: "إجمالي المشاهدات", v: totalViews, i: "👁" },
    { l: "مشاهدات اليوم", v: todayViews, i: "📅" },
    { l: "التحميلات", v: downloads, i: "⬇️" },
    { l: "محاولات الاختبار", v: attempts.length, i: "🎯" },
  ];

  // Real 14-day views trend from the daily-view log.
  const now = new Date();
  const trend = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: dailyViews[key] || 0 };
  });
  const hasTrend = trend.some((t) => t.value > 0);

  const topPages = [...articles].filter((a) => a.views > 0).sort((a, b) => b.views - a.views).slice(0, 8);

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
        <h2 className="text-lg font-bold dark:text-white">📊 التحليلات (بيانات فعلية)</h2>
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
        <h3 className="mb-4 font-bold dark:text-white">📈 المشاهدات آخر 14 يوماً {daysTracked > 0 && <span className="text-xs font-normal text-slate-400">({daysTracked} يوم مُسجّل)</span>}</h3>
        {hasTrend ? <LineChart data={trend} height={180} /> : <Empty label="لا توجد بيانات مشاهدات بعد — ستُسجَّل تلقائياً مع زيارات الموقع" />}
      </div>

      <div className={card}>
        <h3 className="mb-4 font-bold dark:text-white">🔝 أكثر الصفحات زيارة</h3>
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

      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        📍 تحليلات الزوار حسب الدولة والجهاز ومصدر الزيارة تتطلب ربط مزوّد تحليلات (مثل Google Analytics / Plausible).
        عند ربطه ستظهر هذه التقارير من بيانات حقيقية. لا نعرض أرقاماً تقديرية.
      </div>
    </div>
  );
}
