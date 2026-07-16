import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { printInvoice } from "../lib/invoice";
import type { Order } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";

// Manual payment details — no payment gateway / API required. The customer
// transfers to these directly and sends a screenshot on WhatsApp to confirm.
const MANUAL_VODAFONE_CASH = "01013489017";
const MANUAL_INSTAPAY = "wekaali321@instapay";
const MANUAL_WHATSAPP = "201095652098"; // international format, no + or leading 0

const copyText = async (text: string, label: string, notify: (m: string, t?: "success" | "error" | "info") => void) => {
  try { await navigator.clipboard.writeText(text); notify(`تم نسخ ${label}`, "success"); }
  catch { notify("تعذر النسخ، انسخه يدوياً", "error"); }
};

export default function CheckoutPage() {
  const { items, subtotal, setQty, remove, clear, count } = useCart();
  const { gateways, coupons, commerce, recordOrder, pushNotification, logActivity } = useStore();
  const { notify } = useToast();
  useSEO({ title: "إتمام الشراء | NurseHub Egypt" });

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [gateway, setGateway] = useState("");
  const [agree, setAgree] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  const activeGateways = gateways.filter((g) => g.enabled && g.connected);
  const discount = applied?.discount ?? 0;
  const tax = Math.round(((subtotal - discount) * commerce.taxPercent) / 100);
  const total = Math.max(0, subtotal - discount + tax + (subtotal > 0 ? commerce.serviceFee : 0));
  const cur = commerce.currency;

  const applyCoupon = () => {
    const c = coupons.find((x) => x.code.toLowerCase() === couponCode.trim().toLowerCase() && x.active);
    if (!c) { notify("كود الخصم غير صالح", "error"); return; }
    if (c.expires && c.expires < new Date().toISOString().slice(0, 10)) { notify("انتهت صلاحية الكوبون", "error"); return; }
    if (c.minPurchase && subtotal < c.minPurchase) { notify(`الحد الأدنى للشراء ${c.minPurchase} ${cur}`, "error"); return; }
    const d = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
    setApplied({ code: c.code, discount: d });
    notify("تم تطبيق الخصم", "success");
  };

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return notify("أكمل بياناتك", "error");
    if (!gateway) return notify("اختر وسيلة الدفع", "error");
    if (!agree) return notify("يجب الموافقة على الشروط", "error");

    const now = new Date();
    const order: Order = {
      id: "ord" + Date.now(),
      invoiceNo: "INV-" + now.getFullYear() + "-" + String(Date.now()).slice(-6),
      customerName: form.name, email: form.email, phone: form.phone,
      items: items.map((i) => ({ productId: i.productId, title: i.title, price: i.price, qty: i.qty })),
      subtotal, discount, tax, total,
      couponCode: applied?.code,
      gateway: gateway === "manual" ? "تحويل يدوي (فودافون كاش / InstaPay)" : (gateways.find((g) => g.id === gateway)?.name ?? gateway),
      paymentStatus: "pending", // manual transfers are confirmed by an admin after checking WhatsApp; gateway ones via webhook
      transactionId: "TXN-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      date: now.toISOString().slice(0, 16).replace("T", " "),
    };
    recordOrder(order);
    logActivity("طلب جديد", order.invoiceNo);
    pushNotification("revenue", `طلب جديد: ${order.invoiceNo} (${order.total} ${cur})`, `/admin/orders?inv=${encodeURIComponent(order.invoiceNo)}`);
    clear();
    setPlaced(order);
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">🧾</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">تم استلام طلبك</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">رقم الفاتورة: <b>{placed.invoiceNo}</b></p>
        <p className="mt-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-500/10">الدفع قيد المعالجة عبر {placed.gateway}. سيتم تأكيد الطلب وتفعيل روابط التحميل الآمنة بعد نجاح الدفع.</p>
        {gateway === "manual" && (
          <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-right dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">خطوة أخيرة: أكّد التحويل</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">حوّل مبلغ <b>{placed.total} {cur}</b> على فودافون كاش <b dir="ltr">{MANUAL_VODAFONE_CASH}</b> أو InstaPay <b dir="ltr">{MANUAL_INSTAPAY}</b>، ثم ابعت سكرين شوت التحويل مع رقم فاتورتك <b>{placed.invoiceNo}</b> على واتساب.</p>
            <a href={`https://wa.me/${MANUAL_WHATSAPP}?text=${encodeURIComponent(`مرحباً، أرفقت إيصال تحويل الطلب رقم ${placed.invoiceNo}`)}`} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white">📲 إرسال الإيصال على واتساب</a>
          </div>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={() => printInvoice(placed, cur)} className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">🖨️ تحميل الفاتورة</button>
          <Link to="/store" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">المتجر</Link>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">سلة التسوق فارغة</h1>
        <Link to="/store" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">تصفح المتجر</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "المتجر", path: "/store" }, { label: "إتمام الشراء" }]} />
      <h1 className="mb-6 text-2xl font-black dark:text-white">🛒 إتمام الشراء</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Customer + payment */}
        <form onSubmit={placeOrder} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">بيانات العميل</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required placeholder="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
              <input required type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
              <input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inp} sm:col-span-2`} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">وسيلة الدفع</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold ${gateway === "manual" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                <input type="radio" name="gw" checked={gateway === "manual"} onChange={() => setGateway("manual")} /> 📲 فودافون كاش / InstaPay
              </label>
              {activeGateways.map((g) => (
                <label key={g.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold ${gateway === g.id ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                  <input type="radio" name="gw" checked={gateway === g.id} onChange={() => setGateway(g.id)} /> {g.name}
                </label>
              ))}
            </div>

            {gateway === "manual" && (
              <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="text-xs text-slate-600 dark:text-slate-300">حوّل قيمة الطلب ({total} {cur}) على أي من الرقمين، وبعد إتمام الطلب ابعت سكرين شوت التحويل على واتساب لتأكيده:</p>
                <div className="flex items-center justify-between rounded-lg bg-white p-2 dark:bg-slate-800">
                  <span className="text-sm font-bold dark:text-white">فودافون كاش: <span dir="ltr">{MANUAL_VODAFONE_CASH}</span></span>
                  <button type="button" onClick={() => copyText(MANUAL_VODAFONE_CASH, "الرقم", notify)} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">نسخ</button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-2 dark:bg-slate-800">
                  <span className="text-sm font-bold dark:text-white">InstaPay: <span dir="ltr">{MANUAL_INSTAPAY}</span></span>
                  <button type="button" onClick={() => copyText(MANUAL_INSTAPAY, "عنوان InstaPay", notify)} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">نسخ</button>
                </div>
              </div>
            )}

            {activeGateways.length === 0 && gateway !== "manual" && (
              <p className="mt-2 text-xs text-slate-400">وسائل الدفع الإلكترونية (بطاقات، بوابات API) غير مفعّلة حالياً — استخدم التحويل اليدوي بالأعلى.</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm dark:text-white">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> أوافق على <Link to="/terms" className="text-sky-500 underline">شروط الاستخدام</Link>
          </label>

          <button className="w-full rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 py-3 font-bold text-white disabled:opacity-50">إتمام الدفع ({total} {cur})</button>
        </form>

        {/* Order summary */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">ملخص الطلب</h3>
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.productId} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold dark:text-white">{i.title}</div><div className="text-xs text-slate-400">{i.price} {cur}</div></div>
                  <input type="number" min={1} value={i.qty} onChange={(e) => setQty(i.productId, +e.target.value)} className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm dark:border-slate-700 dark:bg-slate-800" />
                  <button onClick={() => remove(i.productId)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 dark:bg-red-500/10">✕</button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="كود الخصم" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <button onClick={applyCoupon} className="rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white">تطبيق</button>
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <div className="flex justify-between dark:text-slate-300"><span>المجموع الفرعي</span><span>{subtotal} {cur}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-500"><span>الخصم</span><span>- {discount} {cur}</span></div>}
              {tax > 0 && <div className="flex justify-between dark:text-slate-300"><span>الضريبة</span><span>{tax} {cur}</span></div>}
              {commerce.serviceFee > 0 && <div className="flex justify-between dark:text-slate-300"><span>رسوم الخدمة</span><span>{commerce.serviceFee} {cur}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-black text-sky-600 dark:border-slate-700"><span>الإجمالي</span><span>{total} {cur}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
