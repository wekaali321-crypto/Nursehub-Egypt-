import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { printInvoice } from "../lib/invoice";
import type { Order } from "../lib/types";

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const statusStyle: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10",
  pending: "bg-amber-100 text-amber-600 dark:bg-amber-500/10",
  failed: "bg-red-100 text-red-600 dark:bg-red-500/10",
  refunded: "bg-slate-200 text-slate-600 dark:bg-slate-700",
};
const statusLabel: Record<string, string> = { paid: "مدفوع", pending: "قيد الانتظار", failed: "فشل", refunded: "مسترجع" };

export function OrdersAdmin() {
  const { orders, commerce, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [filter, setFilter] = useState("all");

  const setStatus = (id: string, paymentStatus: Order["paymentStatus"]) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, paymentStatus } : o)) }));
    logActivity("تحديث حالة طلب", id);
    notify("تم تحديث حالة الطلب");
  };

  const list = filter === "all" ? orders : orders.filter((o) => o.paymentStatus === filter);
  const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "إجمالي الطلبات", v: orders.length },
          { l: "مدفوعة", v: orders.filter((o) => o.paymentStatus === "paid").length },
          { l: "قيد الانتظار", v: orders.filter((o) => o.paymentStatus === "pending").length },
          { l: `الإيرادات المؤكدة (${commerce.currency})`, v: revenue.toLocaleString("ar-EG") },
        ].map((s) => (
          <div key={s.l} className={`${card} p-4`}><div className="text-xl font-black text-sky-600">{s.v}</div><div className="text-xs text-slate-500">{s.l}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "paid", "pending", "failed", "refunded"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{f === "all" ? "الكل" : statusLabel[f]}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700"><div className="text-4xl">🧾</div><p className="mt-2">لا توجد طلبات بعد</p></div>
      ) : (
        <div className={`overflow-x-auto ${card}`}>
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr><th className="p-3">الفاتورة</th><th className="p-3">العميل</th><th className="p-3">الإجمالي</th><th className="p-3">البوابة</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th><th className="p-3">إجراءات</th></tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-mono text-xs dark:text-white">{o.invoiceNo}</td>
                  <td className="p-3"><div className="font-semibold dark:text-white">{o.customerName}</div><div className="text-xs text-slate-400">{o.email}</div></td>
                  <td className="p-3 font-bold text-emerald-500">{o.total} {commerce.currency}</td>
                  <td className="p-3 text-slate-500">{o.gateway}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyle[o.paymentStatus]}`}>{statusLabel[o.paymentStatus]}</span></td>
                  <td className="p-3 text-xs text-slate-400">{o.date}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => printInvoice(o, commerce.currency)} className="rounded bg-sky-100 px-2 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">فاتورة</button>
                      {o.paymentStatus !== "paid" && <button onClick={() => setStatus(o.id, "paid")} className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">تأكيد الدفع</button>}
                      {o.paymentStatus === "paid" && <button onClick={() => setStatus(o.id, "refunded")} className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/10">استرجاع</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CouponsAdmin() {
  const { coupons, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<{ code: string; type: "percent" | "fixed"; value: number; minPurchase: number; maxUses: number; expires: string }>({ code: "", type: "percent", value: 10, minPurchase: 0, maxUses: 100, expires: "" });

  const add = () => {
    if (!form.code.trim()) return notify("أدخل كود الكوبون", "error");
    setData((d) => ({ ...d, coupons: [{ id: "cp" + Date.now(), code: form.code.toUpperCase(), type: form.type, value: form.value, minPurchase: form.minPurchase, maxUses: form.maxUses, used: 0, expires: form.expires, active: true }, ...d.coupons] }));
    logActivity("إضافة كوبون", form.code); notify("تم إضافة الكوبون");
    setForm({ code: "", type: "percent", value: 10, minPurchase: 0, maxUses: 100, expires: "" });
  };
  const toggle = (id: string) => setData((d) => ({ ...d, coupons: d.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) }));
  const del = (id: string) => setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className={`flex items-center justify-between ${card} p-3`}>
            <div>
              <span className="font-mono font-bold text-sky-600">{c.code}</span> {c.demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">Demo</span>}
              <div className="text-xs text-slate-400">{c.type === "percent" ? `${c.value}%` : `${c.value} خصم ثابت`} · حد أدنى {c.minPurchase} · استُخدم {c.used}/{c.maxUses}{c.expires ? ` · ينتهي ${c.expires}` : ""}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggle(c.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>{c.active ? "مفعّل" : "معطّل"}</button>
              <button onClick={() => del(c.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا توجد كوبونات</div>}
      </div>
      <div className={`space-y-2 ${card} p-4`}>
        <h3 className="font-bold dark:text-white">➕ كوبون جديد</h3>
        <input placeholder="الكود (مثل NURSE20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inp} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })} className={inp}><option value="percent">نسبة مئوية %</option><option value="fixed">خصم ثابت</option></select>
        <input type="number" placeholder="القيمة" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} className={inp} />
        <input type="number" placeholder="الحد الأدنى للشراء" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: +e.target.value })} className={inp} />
        <input type="number" placeholder="أقصى عدد استخدامات" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: +e.target.value })} className={inp} />
        <input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className={inp} />
        <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}
