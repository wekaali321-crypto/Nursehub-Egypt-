import { useState } from "react";
import { useStore, slugify } from "../lib/store";
import { useToast } from "../components/Toast";
import type { Page, Taxonomy, Ad, Affiliate, Redirect } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

/* ---------------- Pages ---------------- */
export function PagesAdmin() {
  const { pages, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<Page>>({ status: "published" });

  const save = () => {
    if (!form.title) return notify("أدخل عنوان الصفحة", "error");
    const p: Page = { id: form.id || "pg" + Date.now(), title: form.title!, slug: form.slug || slugify(form.title!), content: form.content || "", status: (form.status as Page["status"]) || "published" };
    setData((d) => ({ ...d, pages: form.id ? d.pages.map((x) => (x.id === form.id ? p : x)) : [p, ...d.pages] }));
    logActivity(form.id ? "تعديل صفحة" : "إنشاء صفحة", p.title);
    setForm({ status: "published" });
    notify("تم حفظ الصفحة");
  };
  const del = (id: string) => { setData((d) => ({ ...d, pages: d.pages.filter((p) => p.id !== id) })); notify("تم حذف الصفحة"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.id} className={`flex items-center justify-between ${card}`}>
            <div><div className="font-bold dark:text-white">{p.title}</div><div className="text-sm text-slate-400">/{p.slug} • {p.status === "published" ? "منشورة" : "مسودة"}</div></div>
            <div className="flex gap-1">
              <button onClick={() => setForm(p)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
              <button onClick={() => del(p.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
        {pages.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا توجد صفحات</div>}
      </div>
      <div className={`space-y-3 ${card}`}>
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل صفحة" : "➕ صفحة جديدة"}</h3>
        <input placeholder="عنوان الصفحة" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
        <input placeholder="الرابط (slug)" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inp} />
        <textarea placeholder="محتوى الصفحة (HTML)" rows={6} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inp} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Page["status"] })} className={inp}><option value="published">منشورة</option><option value="draft">مسودة</option></select>
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({ status: "published" })} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

/* --------- Categories & Tags (reusable taxonomy) --------- */
function TaxonomyAdmin({ kind }: { kind: "categories" | "tags" }) {
  const store = useStore();
  const { setData, logActivity } = store;
  const { notify } = useToast();
  const items = store[kind] as Taxonomy[];
  const [name, setName] = useState("");
  const label = kind === "categories" ? "تصنيف" : "وسم";

  const add = () => {
    if (!name.trim()) return;
    const t: Taxonomy = { id: kind[0] + Date.now(), name, slug: slugify(name) };
    setData((d) => ({ ...d, [kind]: [...(d[kind] as Taxonomy[]), t] }));
    logActivity(`إضافة ${label}`, name);
    setName(""); notify(`تم إضافة ${label}`);
  };
  const del = (id: string) => setData((d) => ({ ...d, [kind]: (d[kind] as Taxonomy[]).filter((x) => x.id !== id) }));

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`اسم ${label} جديد`} className={inp} />
        <button onClick={add} className="rounded-lg bg-sky-500 px-6 font-bold text-white">إضافة</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t.id} className="flex items-center gap-2 rounded-full bg-slate-100 py-1.5 pr-3 pl-2 dark:bg-slate-800">
            <span className="text-sm font-semibold dark:text-white">{t.name}</span>
            <button onClick={() => del(t.id)} className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600 dark:bg-red-500/10">✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}
export function CategoriesAdmin() { return <TaxonomyAdmin kind="categories" />; }
export function TagsAdmin() { return <TaxonomyAdmin kind="tags" />; }

/* ---------------- Subscribers / Newsletter ---------------- */
export function SubscribersAdmin() {
  const { subscribers, setData } = useStore();
  const { notify } = useToast();
  const exportCsv = () => {
    const csv = "email,date,status\n" + subscribers.map((s) => `${s.email},${s.date},${s.status}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "subscribers.csv"; a.click();
    notify("تم تصدير المشتركين");
  };
  const del = (id: string) => setData((d) => ({ ...d, subscribers: d.subscribers.filter((s) => s.id !== id) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">إجمالي المشتركين: <span className="font-bold text-sky-500">{subscribers.length}</span></p>
        <button onClick={exportCsv} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">⬇️ تصدير CSV</button>
      </div>
      <div className={`overflow-x-auto ${card} p-0`}>
        <table className="w-full text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><th className="p-3">البريد</th><th className="p-3">التاريخ</th><th className="p-3">الحالة</th><th className="p-3"></th></tr></thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-white">{s.email}</td>
                <td className="p-3 text-slate-500">{s.date}</td>
                <td className="p-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">{s.status === "active" ? "نشط" : "ملغى"}</span></td>
                <td className="p-3"><button onClick={() => del(s.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Ads ---------------- */
export function AdsAdmin() {
  const { ads, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<Ad>>({ type: "adsense", active: true });
  const add = () => {
    if (!form.name) return notify("أدخل اسم الإعلان", "error");
    const a: Ad = { id: "ad" + Date.now(), name: form.name!, placement: form.placement || "sidebar", type: (form.type as Ad["type"]) || "adsense", code: form.code || "", active: form.active ?? true };
    setData((d) => ({ ...d, ads: [a, ...d.ads] }));
    logActivity("إضافة إعلان", a.name); setForm({ type: "adsense", active: true }); notify("تم إضافة الإعلان");
  };
  const toggle = (id: string) => setData((d) => ({ ...d, ads: d.ads.map((a) => (a.id === id ? { ...a, active: !a.active } : a)) }));
  const del = (id: string) => setData((d) => ({ ...d, ads: d.ads.filter((a) => a.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {ads.map((a) => (
          <div key={a.id} className={`flex items-center justify-between ${card}`}>
            <div><div className="font-bold dark:text-white">{a.name}</div><div className="text-sm text-slate-400">{a.placement} • {a.type}</div></div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(a.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${a.active ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>{a.active ? "مفعّل" : "معطّل"}</button>
              <button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
      </div>
      <div className={`space-y-3 ${card}`}>
        <h3 className="font-bold dark:text-white">➕ إعلان جديد</h3>
        <input placeholder="اسم الإعلان" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <input placeholder="الموضع (مثل sidebar)" value={form.placement ?? ""} onChange={(e) => setForm({ ...form, placement: e.target.value })} className={inp} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Ad["type"] })} className={inp}><option value="adsense">AdSense</option><option value="banner">Banner</option><option value="sponsored">Sponsored</option></select>
        <textarea placeholder="كود الإعلان / الرابط" rows={3} value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inp} />
        <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}

/* ---------------- Affiliates ---------------- */
export function AffiliatesAdmin() {
  const { affiliates, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<Affiliate>>({});
  const add = () => {
    if (!form.name || !form.url) return notify("أكمل البيانات", "error");
    const a: Affiliate = { id: "af" + Date.now(), name: form.name!, url: form.url!, network: form.network || "—", commission: form.commission || "0%", clicks: 0 };
    setData((d) => ({ ...d, affiliates: [a, ...d.affiliates] }));
    logActivity("إضافة شريك", a.name); setForm({}); notify("تم إضافة الشريك");
  };
  const del = (id: string) => setData((d) => ({ ...d, affiliates: d.affiliates.filter((a) => a.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className={`overflow-x-auto ${card} p-0`}>
        <table className="w-full text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><th className="p-3">الاسم</th><th className="p-3">الشبكة</th><th className="p-3">العمولة</th><th className="p-3">النقرات</th><th className="p-3"></th></tr></thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-white">{a.name}</td>
                <td className="p-3 text-slate-500">{a.network}</td>
                <td className="p-3 text-emerald-500 font-bold">{a.commission}</td>
                <td className="p-3 text-slate-500">{a.clicks}</td>
                <td className="p-3"><button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`space-y-3 ${card}`}>
        <h3 className="font-bold dark:text-white">➕ شريك جديد</h3>
        <input placeholder="اسم الشريك/المنتج" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <input placeholder="رابط الإحالة" value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inp} />
        <input placeholder="الشبكة (مثل Amazon)" value={form.network ?? ""} onChange={(e) => setForm({ ...form, network: e.target.value })} className={inp} />
        <input placeholder="نسبة العمولة" value={form.commission ?? ""} onChange={(e) => setForm({ ...form, commission: e.target.value })} className={inp} />
        <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}

/* ---------------- Redirects (301/302) ---------------- */
export function RedirectsAdmin() {
  const { redirects, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<{ from: string; to: string; type: 301 | 302 }>({ from: "", to: "", type: 301 });
  const add = () => {
    if (!form.from || !form.to) return notify("أكمل الحقول", "error");
    const r: Redirect = { id: "r" + Date.now(), from: form.from, to: form.to, type: form.type };
    setData((d) => ({ ...d, redirects: [r, ...d.redirects] }));
    logActivity("إضافة إعادة توجيه", `${form.from} → ${form.to}`);
    setForm({ from: "", to: "", type: 301 }); notify("تم إضافة إعادة التوجيه");
  };
  const del = (id: string) => setData((d) => ({ ...d, redirects: d.redirects.filter((r) => r.id !== id) }));

  return (
    <div className="max-w-3xl space-y-4">
      <div className={`grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] ${card}`}>
        <input placeholder="من /old-url" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className={inp} />
        <input placeholder="إلى /new-url" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={inp} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) as 301 | 302 })} className={inp}><option value={301}>301</option><option value={302}>302</option></select>
        <button onClick={add} className="rounded-lg bg-sky-500 px-5 font-bold text-white">إضافة</button>
      </div>
      <div className="space-y-2">
        {redirects.map((r) => (
          <div key={r.id} className={`flex items-center justify-between ${card}`}>
            <div className="text-sm dark:text-white"><span className="font-mono text-slate-500">{r.from}</span> <span className="text-sky-500">→</span> <span className="font-mono">{r.to}</span> <span className="ms-2 rounded bg-slate-100 px-1.5 text-xs dark:bg-slate-800">{r.type}</span></div>
            <button onClick={() => del(r.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Activity Log ---------------- */
export function ActivityAdmin() {
  const { activity } = useStore();
  return (
    <div className="space-y-2">
      {activity.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا يوجد نشاط بعد</div>}
      {activity.map((a) => (
        <div key={a.id} className={`flex items-center gap-3 ${card} py-3`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/10">📌</span>
          <div className="flex-1"><span className="font-semibold dark:text-white">{a.action}</span> <span className="text-slate-500">— {a.target}</span></div>
          <div className="text-xs text-slate-400">{a.user} • {a.date}</div>
        </div>
      ))}
    </div>
  );
}
