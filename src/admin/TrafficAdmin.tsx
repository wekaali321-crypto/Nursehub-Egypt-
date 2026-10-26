import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { BarChart } from "../components/Charts";

type Daily = { day: string; visitors: number; views: number; installs: number };
type Monthly = { month: string; visitors: number; views: number; installs: number; app_users: number };
type Stats = {
  generated_at: string;
  online_now: number;
  online_app: number;
  today: { visitors: number; views: number; new_visitors: number; installs: number; app_users: number };
  yesterday: { visitors: number; views: number };
  totals: { visitors: number; views: number; installers: number; since: string | null };
  daily: Daily[];
  monthly: Monthly[];
  installs_by_kind: Record<string, number>;
  installs_by_platform: Record<string, number>;
  devices_30d: Record<string, number>;
  sources_30d: Record<string, number>;
  top_pages_30d: { path: string; views: number; visitors: number }[];
};

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";
const nf = (n: number) => n.toLocaleString("ar-EG");
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const DEVICE: Record<string, string> = { mobile: "📱 موبايل", tablet: "📲 تابلت", desktop: "💻 كمبيوتر", unknown: "غير معروف" };
const SOURCE: Record<string, string> = { direct: "مباشر", google: "جوجل", facebook: "فيسبوك", instagram: "إنستجرام", twitter: "تويتر / X", youtube: "يوتيوب", tiktok: "تيك توك", telegram: "تيليجرام", whatsapp: "واتساب", internal: "داخلي", other: "مواقع أخرى" };
const PLATFORM: Record<string, string> = {
  "android-chrome": "أندرويد (كروم)", "android-samsung": "أندرويد (سامسونج)", "android-firefox": "أندرويد (فايرفوكس)", "android-edge": "أندرويد (إيدج)",
  "android-inapp": "أندرويد (متصفح تطبيق)", "android-other": "أندرويد (أخرى)", "android-app": "تطبيق أندرويد (APK)", pwa: "تطبيق ويب مثبّت",
  "ios-safari": "آيفون (سفاري)", "ios-chrome": "آيفون (كروم)", "ios-other": "آيفون (أخرى)", "ios-inapp": "آيفون (متصفح تطبيق)", desktop: "كمبيوتر", unknown: "غير معروف",
};

function Delta({ now, before }: { now: number; before: number }) {
  if (!before && !now) return null;
  const diff = now - before;
  const cls = diff >= 0 ? "text-emerald-600" : "text-rose-600";
  return <span className={`text-xs font-bold ${cls}`}>{diff >= 0 ? "▲" : "▼"} {nf(Math.abs(diff))} عن أمس</span>;
}

function Breakdown({ title, data, labels }: { title: string; data: Record<string, number>; labels: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className={card}>
      <h3 className="mb-3 font-bold dark:text-white">{title}</h3>
      {entries.length === 0 ? <p className="text-sm text-slate-400">لا توجد بيانات بعد.</p> : (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-sm"><span className="dark:text-slate-200">{labels[k] ?? k}</span><span className="font-bold dark:text-white">{nf(v)} <span className="font-normal text-slate-400">({total ? Math.round((v / total) * 100) : 0}%)</span></span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-sky-500" style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrafficAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<"visitors" | "views" | "installs">("visitors");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) { setError("قاعدة البيانات غير متصلة."); return; }
    const { data, error: err } = await supabase.rpc("admin_site_stats");
    if (err) {
      setError(/admin_site_stats|does not exist|schema cache/i.test(err.message) ? "لم يتم تفعيل جداول الزوار بعد. شغّل ملف supabase/site_traffic.sql مرة واحدة في Supabase SQL Editor." : err.message);
      return;
    }
    setError("");
    setStats(data as Stats);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (error) return <div className={`${card} text-sm text-rose-600`}>{error}</div>;
  if (!stats) return <div className={card}>جارٍ التحميل…</div>;

  const t = stats.today;
  const month = stats.monthly[0];
  const prevMonth = stats.monthly[1];
  const chart = stats.daily.map((d) => ({ label: d.day.slice(8), value: d[metric] }));
  const metricName = { visitors: "الزوار", views: "مشاهدات الصفحات", installs: "تنزيلات التطبيق" }[metric];
  const kinds = stats.installs_by_kind;

  const kpis = [
    { l: "زوار اليوم", v: t.visitors, i: "👥", extra: <Delta now={t.visitors} before={stats.yesterday.visitors} /> },
    { l: "مشاهدات اليوم", v: t.views, i: "👁", extra: <Delta now={t.views} before={stats.yesterday.views} /> },
    { l: "زوار جدد اليوم", v: t.new_visitors, i: "🆕" },
    { l: "فتحوا من التطبيق اليوم", v: t.app_users, i: "📲" },
    { l: "نزّلوا التطبيق اليوم", v: t.installs, i: "⬇️" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black dark:text-white">📡 الزوار والتنزيلات</h1>
        <span className="text-xs text-slate-400">يتحدّث تلقائيًا كل 15 ثانية · آخر تحديث {new Date(stats.generated_at).toLocaleTimeString("ar-EG")}</span>
      </div>

      <div className="rounded-3xl bg-gradient-to-l from-emerald-500 to-sky-500 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white/90"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-white" /></span>نشطون الآن على الموقع</div>
            <div className="mt-1 text-6xl font-black">{nf(stats.online_now)}</div>
            <div className="text-sm text-white/85">زائر خلال آخر دقيقتين{stats.online_app ? ` · منهم ${nf(stats.online_app)} من التطبيق` : ""}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-white/15 px-5 py-3"><div className="text-2xl font-black">{nf(stats.totals.visitors)}</div><div className="text-white/85">إجمالي الزوار</div></div>
            <div className="rounded-2xl bg-white/15 px-5 py-3"><div className="text-2xl font-black">{nf(stats.totals.installers)}</div><div className="text-white/85">نزّلوا التطبيق</div></div>
          </div>
        </div>
        {stats.totals.since && <div className="mt-3 text-xs text-white/75">القياس بدأ في {new Date(stats.totals.since).toLocaleDateString("ar-EG")} · كل رقم هنا حقيقي من زيارات فعلية (متصفح واحد = زائر واحد).</div>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.l} className={card}>
            <div className="text-2xl">{k.i}</div>
            <div className="mt-1 text-3xl font-black dark:text-white">{nf(k.v)}</div>
            <div className="text-xs text-slate-500">{k.l}</div>
            {k.extra && <div className="mt-1">{k.extra}</div>}
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold dark:text-white">آخر 30 يومًا — {metricName}</h3>
          <div className="flex gap-1 text-xs">
            {(["visitors", "views", "installs"] as const).map((m) => (
              <button key={m} onClick={() => setMetric(m)} className={`rounded-full px-3 py-1 font-bold ${metric === m ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{{ visitors: "الزوار", views: "المشاهدات", installs: "التنزيلات" }[m]}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto"><div style={{ minWidth: 640 }}><BarChart data={chart} color={metric === "installs" ? "#10b981" : "#0ea5e9"} /></div></div>
      </div>

      <div className={card}>
        <h3 className="mb-1 font-bold dark:text-white">📅 الشهر الحالي ({monthLabel(month.month)})</h3>
        <p className="mb-3 text-sm text-slate-500">
          دخل الموقع <b className="text-sky-600">{nf(month.visitors)}</b> زائر مختلف{prevMonth ? <> (الشهر الماضي {nf(prevMonth.visitors)})</> : null}، و<b>{nf(month.app_users)}</b> منهم فتحوه من التطبيق، ونزّل التطبيق <b className="text-emerald-600">{nf(month.installs)}</b>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-slate-500 dark:border-slate-700"><th className="p-2 text-start">الشهر</th><th className="p-2 text-start">الزوار</th><th className="p-2 text-start">المشاهدات</th><th className="p-2 text-start">من التطبيق</th><th className="p-2 text-start">نزّلوا التطبيق</th></tr></thead>
            <tbody>
              {stats.monthly.map((m) => (
                <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800 dark:text-slate-200">
                  <td className="p-2 font-bold">{monthLabel(m.month)}</td><td className="p-2">{nf(m.visitors)}</td><td className="p-2">{nf(m.views)}</td><td className="p-2">{nf(m.app_users)}</td><td className="p-2">{nf(m.installs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h3 className="mb-3 font-bold dark:text-white">⬇️ تنزيلات التطبيق</h3>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            {[
              ["اضغطوا زر «حمّل التطبيق»", kinds.install_click ?? 0],
              ["ثبّتوه على الموبايل (PWA)", kinds.installed ?? 0],
              ["حمّلوا ملف APK", kinds.apk_download ?? 0],
              ["فتحوا التطبيق المثبّت", kinds.app_open ?? 0],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-2xl font-black dark:text-white">{nf(v as number)}</div><div className="text-xs text-slate-500">{l}</div></div>
            ))}
          </div>
        </div>
        <Breakdown title="📱 نظام/متصفح من نزّلوا التطبيق" data={stats.installs_by_platform} labels={PLATFORM} />
        <Breakdown title="الأجهزة (آخر 30 يوم)" data={stats.devices_30d} labels={DEVICE} />
        <Breakdown title="مصادر الزيارات (آخر 30 يوم)" data={stats.sources_30d} labels={SOURCE} />
      </div>

      <div className={card}>
        <h3 className="mb-3 font-bold dark:text-white">🔥 أكثر الصفحات زيارة (آخر 30 يوم)</h3>
        {stats.top_pages_30d.length === 0 ? <p className="text-sm text-slate-400">لا توجد بيانات بعد.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500 dark:border-slate-700"><th className="p-2 text-start">الصفحة</th><th className="p-2 text-start">المشاهدات</th><th className="p-2 text-start">الزوار</th></tr></thead>
              <tbody>
                {stats.top_pages_30d.map((p) => (
                  <tr key={p.path} className="border-b border-slate-100 dark:border-slate-800 dark:text-slate-200"><td className="p-2 font-mono text-xs" dir="ltr">{p.path}</td><td className="p-2">{nf(p.views)}</td><td className="p-2">{nf(p.visitors)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
