import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { BarChart } from "../components/Charts";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";
const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

/* ============ Earnings Dashboard ============
   Revenue is computed ONLY from successful completed payments.
   No payment/orders system is connected yet → all revenue figures are 0.
   We never fabricate CTR/RPM/revenue. Affiliate clicks shown are the real
   tracked click counts (not revenue). */
export function EarningsAdmin() {
  const { affiliates } = useStore();

  // Completed payments (from an orders/payments source). None connected → 0.
  const completedPayments: { amount: number; date: string; source: string; product: string }[] = [];
  const total = completedPayments.reduce((s, p) => s + p.amount, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  const today = completedPayments.filter((p) => p.date.startsWith(todayStr)).reduce((s, p) => s + p.amount, 0);
  const thisMonth = completedPayments.filter((p) => p.date.startsWith(monthStr)).reduce((s, p) => s + p.amount, 0);

  const kpis = [
    { l: "أرباح اليوم", v: today, i: "📅", c: "from-emerald-500 to-teal-500" },
    { l: "هذا الشهر", v: thisMonth, i: "📆", c: "from-sky-500 to-blue-500" },
    { l: "إجمالي الأرباح", v: total, i: "💰", c: "from-amber-500 to-orange-500" },
    { l: "عمليات مكتملة", v: completedPayments.length, i: "🧾", c: "from-violet-500 to-purple-500", unit: "" },
  ];

  const topAffiliates = [...affiliates].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  const hasAffiliateClicks = topAffiliates.some((a) => a.clicks > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className={`rounded-2xl bg-gradient-to-br ${k.c} p-4 text-white shadow-lg`}>
            <div className="text-2xl">{k.i}</div>
            <div className="mt-1 text-2xl font-black">{k.v.toLocaleString("ar-EG")}{"unit" in k ? "" : " ج.م"}</div>
            <div className="text-xs opacity-90">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <div className="text-4xl">💳</div>
        <h3 className="mt-2 font-bold dark:text-white">لا توجد مدفوعات مكتملة بعد</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          تُحتسب الأرباح حصرياً من المدفوعات الناجحة المكتملة. عند ربط بوابة دفع (Paymob / Stripe / PayPal)
          ستظهر الأرباح والرسوم البيانية هنا تلقائياً من العمليات الحقيقية.
        </p>
        <a href="/admin/payments" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-bold text-white">إعداد وسائل الدفع</a>
      </div>

      <div className={card}>
        <h3 className="mb-4 font-bold dark:text-white">🔗 نقرات روابط الأفلييت (تتبّع فعلي)</h3>
        {hasAffiliateClicks
          ? <BarChart data={topAffiliates.map((a) => ({ label: a.name.slice(0, 6) + "…", value: a.clicks }))} color="#0ea5e9" />
          : <div className="flex h-32 items-center justify-center text-sm text-slate-400">لا توجد نقرات مسجّلة بعد</div>}
      </div>
    </div>
  );
}

/* ============ Advertisement Management ============ */
const AD_LOCATIONS = ["رأس الصفحة (Header)", "الشريط الجانبي (Sidebar)", "داخل المقال (In-Article)", "تذييل الصفحة (Footer)", "إعلان ثابت (Sticky)", "إعلانات الموبايل", "إعلانات الديسكتوب"];

export function AdsManager() {
  const { ads, settings, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<{ name: string; placement: string; type: string; code: string }>({ name: "", placement: AD_LOCATIONS[0], type: "adsense", code: "" });

  const add = () => {
    if (!form.name) return notify("أدخل اسم الإعلان", "error");
    setData((d) => ({ ...d, ads: [{ id: "ad" + Date.now(), name: form.name, placement: form.placement, type: form.type as "adsense" | "banner" | "sponsored", code: form.code, active: true }, ...d.ads] }));
    logActivity("إضافة إعلان", form.name);
    setForm({ name: "", placement: AD_LOCATIONS[0], type: "adsense", code: "" });
    notify("تم إضافة الإعلان");
  };
  const toggle = (id: string) => setData((d) => ({ ...d, ads: d.ads.map((a) => (a.id === id ? { ...a, active: !a.active } : a)) }));
  const del = (id: string) => setData((d) => ({ ...d, ads: d.ads.filter((a) => a.id !== id) }));
  const saveAdsense = (client: string, enabled: boolean) => setData((d) => ({ ...d, settings: { ...d.settings, adsenseClient: client, adsenseEnabled: enabled } }));

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="mb-3 font-bold dark:text-white">🟢 Google AdSense / Ad Manager</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={settings.adsenseClient} onChange={(e) => saveAdsense(e.target.value, settings.adsenseEnabled)} placeholder="ca-pub-XXXXXXXXXXXX" className={inp} />
          <label className="flex items-center gap-2 text-sm font-semibold dark:text-white"><input type="checkbox" checked={settings.adsenseEnabled} onChange={(e) => saveAdsense(settings.adsenseClient, e.target.checked)} /> تفعيل الإعلانات</label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {ads.map((a) => (
            <div key={a.id} className={`flex items-center justify-between ${card} py-3`}>
              <div><div className="font-bold dark:text-white">{a.name}</div><div className="text-sm text-slate-400">{a.placement} • {a.type}</div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(a.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${a.active ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>{a.active ? "مفعّل" : "معطّل"}</button>
                <button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
          ))}
          {ads.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا توجد إعلانات</div>}
        </div>
        <div className={`space-y-3 ${card}`}>
          <h3 className="font-bold dark:text-white">➕ إعلان جديد</h3>
          <input placeholder="اسم الإعلان" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className={inp}>{AD_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}</select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inp}><option value="adsense">AdSense</option><option value="banner">Banner</option><option value="sponsored">Sponsored</option></select>
          <textarea placeholder="كود الإعلان / HTML" rows={3} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inp} />
          <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
        </div>
      </div>
    </div>
  );
}

/* ============ Affiliate Manager (enhanced) ============ */
export function AffiliateManager() {
  const { affiliates, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<{ name: string; url: string; network: string; commission: string }>({ name: "", url: "", network: "", commission: "" });

  const add = () => {
    if (!form.name || !form.url) return notify("أكمل البيانات", "error");
    setData((d) => ({ ...d, affiliates: [{ id: "af" + Date.now(), name: form.name, url: form.url, network: form.network || "—", commission: form.commission || "0%", clicks: 0 }, ...d.affiliates] }));
    logActivity("إضافة شريك", form.name);
    setForm({ name: "", url: "", network: "", commission: "" });
    notify("تم إضافة الشريك");
  };
  const del = (id: string) => setData((d) => ({ ...d, affiliates: d.affiliates.filter((a) => a.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className={`overflow-x-auto ${card} p-0`}>
        <table className="w-full text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><th className="p-3">الاسم</th><th className="p-3">الشبكة</th><th className="p-3">العمولة</th><th className="p-3">النقرات (فعلية)</th><th className="p-3"></th></tr></thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-white">{a.name}</td>
                <td className="p-3 text-slate-500">{a.network}</td>
                <td className="p-3 font-bold text-emerald-500">{a.commission}</td>
                <td className="p-3 text-slate-500">{a.clicks.toLocaleString("ar-EG")}</td>
                <td className="p-3"><button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button></td>
              </tr>
            ))}
            {affiliates.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">لا توجد روابط أفلييت</td></tr>}
          </tbody>
        </table>
      </div>
      <div className={`space-y-3 ${card}`}>
        <h3 className="font-bold dark:text-white">➕ شريك / منتج أفلييت</h3>
        <input placeholder="اسم المنتج/الشريك" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <input placeholder="رابط الإحالة" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inp} />
        <input placeholder="الشبكة (Amazon, Jumia...)" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className={inp} />
        <input placeholder="نسبة العمولة" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className={inp} />
        <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}

/* ============ Payment Dashboard ============ */
const PAYMENTS = [
  { id: "stripe", name: "Stripe", i: "💳", desc: "بطاقات عالمية" },
  { id: "paypal", name: "PayPal", i: "🅿️", desc: "محفظة عالمية" },
  { id: "paymob", name: "Paymob", i: "🏦", desc: "بوابة مصرية" },
  { id: "fawry", name: "Fawry", i: "🟡", desc: "دفع مصري" },
  { id: "vodafone", name: "Vodafone Cash", i: "📱", desc: "محفظة موبايل" },
  { id: "instapay", name: "InstaPay (يدوي)", i: "⚡", desc: "تحويل فوري" },
  { id: "bank", name: "تحويل بنكي", i: "🏛️", desc: "حوالة بنكية" },
];

export function PaymentsAdmin() {
  const { notify } = useToast();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ paymob: true, fawry: true, vodafone: true, instapay: true });
  const [custom, setCustom] = useState("");

  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">💡 فعّل وسائل الدفع التي تريد دعمها. يمكن إضافة المزيد لاحقاً. مفاتيح الـ API تُضبط بأمان عبر متغيرات بيئة Supabase Edge Functions.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAYMENTS.map((p) => (
          <div key={p.id} className={card}>
            <div className="flex items-center justify-between">
              <span className="text-3xl">{p.i}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={!!enabled[p.id]} onChange={(e) => setEnabled({ ...enabled, [p.id]: e.target.checked })} className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:right-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:-translate-x-5 dark:bg-slate-600" />
              </label>
            </div>
            <div className="mt-2 font-bold dark:text-white">{p.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{p.desc}</div>
            <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${enabled[p.id] ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>{enabled[p.id] ? "مفعّل" : "معطّل"}</div>
          </div>
        ))}
      </div>
      <div className={`flex gap-2 ${card}`}>
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="إضافة وسيلة دفع جديدة..." className={inp} />
        <button onClick={() => { if (custom) { notify("تمت إضافة وسيلة الدفع"); setCustom(""); } }} className="rounded-lg bg-sky-500 px-5 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}
