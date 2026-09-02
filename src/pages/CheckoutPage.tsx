import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { printInvoice } from "../lib/invoice";
import type { Order } from "../lib/types";
import { useI18n } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";

// Manual payment details — no payment gateway / API required. The customer
// transfers to these directly and sends a screenshot on WhatsApp to confirm.
const MANUAL_VODAFONE_CASH = "01013489017";
const MANUAL_INSTAPAY = "wekaali321@instapay";
const MANUAL_WHATSAPP = "201095652098"; // international format, no + or leading 0

export default function CheckoutPage() {
  const { items, subtotal, setQty, remove, clear, count } = useCart();
  const { gateways, coupons, commerce, recordOrder, pushNotification, logActivity } = useStore();
  const { notify } = useToast();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("checkout.pageTitle")} | NurseHub Egypt` });

  const copyText = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); notify(label, "success"); }
    catch { notify(t("checkout.copyFailed"), "error"); }
  };

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
    if (!c) { notify(t("checkout.invalidCoupon"), "error"); return; }
    if (c.expires && c.expires < new Date().toISOString().slice(0, 10)) { notify(t("checkout.couponExpired"), "error"); return; }
    if (c.minPurchase && subtotal < c.minPurchase) { notify(`${t("checkout.minPurchase")} ${c.minPurchase} ${cur}`, "error"); return; }
    const d = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
    setApplied({ code: c.code, discount: d });
    notify(t("checkout.couponApplied"), "success");
  };

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return notify(t("checkout.fillYourData"), "error");
    if (!gateway) return notify(t("checkout.choosePaymentMethod"), "error");
    if (!agree) return notify(t("checkout.mustAgreeTerms"), "error");

    const now = new Date();
    const order: Order = {
      id: crypto.randomUUID(),
      invoiceNo: "INV-" + now.getFullYear() + "-" + String(Date.now()).slice(-6),
      customerName: form.name, email: form.email, phone: form.phone,
      items: items.map((i) => ({ productId: i.productId, title: i.title, price: i.price, qty: i.qty })),
      subtotal, discount, tax, total,
      couponCode: applied?.code,
      gateway: gateway === "manual" ? t("checkout.manualGatewayName") : (gateways.find((g) => g.id === gateway)?.name ?? gateway),
      paymentStatus: "pending", // manual transfers are confirmed by an admin after checking WhatsApp; gateway ones via webhook
      transactionId: "TXN-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      date: now.toISOString().slice(0, 16).replace("T", " "),
    };
    recordOrder(order);
    logActivity("طلب جديد", order.invoiceNo);
    pushNotification("revenue", `طلب جديد: ${order.invoiceNo} (${order.total} ${cur})`, `/admin/orders?inv=${encodeURIComponent(order.invoiceNo)}`);
    // Note: the real push notification to the admin's device is sent
    // server-side by a database trigger on `orders` (fires on INSERT and
    // calls the send-push Edge Function directly) — more reliable than a
    // client-side call, since it fires even if this tab closes immediately.
    clear();
    setPlaced(order);
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
        <div className="text-6xl">🧾</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{t("checkout.orderReceived")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("checkout.invoiceNumber")} <b>{placed.invoiceNo}</b></p>
        <p className="mt-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-500/10">
          {isEn
            ? <>Payment is being processed via {placed.gateway}. Your order will be confirmed and secure download links activated once payment succeeds.</>
            : <>الدفع قيد المعالجة عبر {placed.gateway}. سيتم تأكيد الطلب وتفعيل روابط التحميل الآمنة بعد نجاح الدفع.</>}
        </p>
        {gateway === "manual" && (
          <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-right dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t("checkout.finalStepConfirm")}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {isEn ? (
                <>Transfer <b>{placed.total} {cur}</b> to Vodafone Cash <b dir="ltr">{MANUAL_VODAFONE_CASH}</b> or InstaPay <b dir="ltr">{MANUAL_INSTAPAY}</b>, then send a screenshot of the transfer along with your invoice number <b>{placed.invoiceNo}</b> on WhatsApp.</>
              ) : (
                <>حوّل مبلغ <b>{placed.total} {cur}</b> على فودافون كاش <b dir="ltr">{MANUAL_VODAFONE_CASH}</b> أو InstaPay <b dir="ltr">{MANUAL_INSTAPAY}</b>، ثم ابعت سكرين شوت التحويل مع رقم فاتورتك <b>{placed.invoiceNo}</b> على واتساب.</>
              )}
            </p>
            <a href={`https://wa.me/${MANUAL_WHATSAPP}?text=${encodeURIComponent(isEn ? `Hello, I've attached the transfer receipt for order ${placed.invoiceNo}` : `مرحباً، أرفقت إيصال تحويل الطلب رقم ${placed.invoiceNo}`)}`} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white">{t("checkout.sendReceiptWhatsApp")}</a>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">{t("checkout.keepLinkNote")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to={`/order/${placed.invoiceNo}`} className="rounded-full bg-emerald-500 px-6 py-2 font-bold text-white">{t("checkout.trackOrderPage")}</Link>
          <button onClick={() => printInvoice(placed, cur, lang)} className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("checkout.downloadInvoice")}</button>
          <Link to="/store" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">{t("nav.store")}</Link>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
        <div className="text-6xl">🛒</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{t("checkout.emptyCart")}</h1>
        <Link to="/store" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("checkout.browseStore")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.store"), path: "/store" }, { label: t("checkout.pageTitle") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <h1 className="mb-6 text-2xl font-black dark:text-white">{t("checkout.heading")}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Customer + payment */}
        <form onSubmit={placeOrder} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">{t("checkout.customerData")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required placeholder={t("checkout.fullName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
              <input required type="email" placeholder={t("checkout.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
              <input placeholder={t("checkout.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${inp} sm:col-span-2`} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">{t("checkout.paymentMethod")}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold ${gateway === "manual" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                <input type="radio" name="gw" checked={gateway === "manual"} onChange={() => setGateway("manual")} /> {t("checkout.manualMethod")}
              </label>
              {activeGateways.map((g) => (
                <label key={g.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold ${gateway === g.id ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                  <input type="radio" name="gw" checked={gateway === g.id} onChange={() => setGateway(g.id)} /> {g.name}
                </label>
              ))}
            </div>

            {gateway === "manual" && (
              <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {isEn ? <>Transfer the order amount ({total} {cur}) to either number, then after placing the order send a screenshot of the transfer on WhatsApp to confirm it:</>
                    : <>حوّل قيمة الطلب ({total} {cur}) على أي من الرقمين، وبعد إتمام الطلب ابعت سكرين شوت التحويل على واتساب لتأكيده:</>}
                </p>
                <div className="flex items-center justify-between rounded-lg bg-white p-2 dark:bg-slate-800">
                  <span className="text-sm font-bold dark:text-white">{t("checkout.vodafoneCashLabel")} <span dir="ltr">{MANUAL_VODAFONE_CASH}</span></span>
                  <button type="button" onClick={() => copyText(MANUAL_VODAFONE_CASH, t("checkout.copiedNumber"))} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">{t("checkout.copy")}</button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-2 dark:bg-slate-800">
                  <span className="text-sm font-bold dark:text-white">{t("checkout.instapayLabel")} <span dir="ltr">{MANUAL_INSTAPAY}</span></span>
                  <button type="button" onClick={() => copyText(MANUAL_INSTAPAY, t("checkout.copiedInstapay"))} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">{t("checkout.copy")}</button>
                </div>
              </div>
            )}

            {activeGateways.length === 0 && gateway !== "manual" && (
              <p className="mt-2 text-xs text-slate-400">{t("checkout.noGatewaysNote")}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm dark:text-white">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> {t("checkout.agreeTo")} <Link to="/terms" className="text-sky-500 underline">{t("footer.terms")}</Link>
          </label>

          <button className="w-full rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 py-3 font-bold text-white disabled:opacity-50">{t("checkout.completePayment")} ({total} {cur})</button>
        </form>

        {/* Order summary */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 font-bold dark:text-white">{t("checkout.orderSummary")}</h3>
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
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder={t("store.couponPlaceholder")} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <button onClick={applyCoupon} className="rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white">{t("store.apply")}</button>
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <div className="flex justify-between dark:text-slate-300"><span>{t("checkout.subtotal")}</span><span>{subtotal} {cur}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-500"><span>{t("checkout.discount")}</span><span>- {discount} {cur}</span></div>}
              {tax > 0 && <div className="flex justify-between dark:text-slate-300"><span>{t("checkout.tax")}</span><span>{tax} {cur}</span></div>}
              {commerce.serviceFee > 0 && <div className="flex justify-between dark:text-slate-300"><span>{t("checkout.serviceFee")}</span><span>{commerce.serviceFee} {cur}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-black text-sky-600 dark:border-slate-700"><span>{t("checkout.total")}</span><span>{total} {cur}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
