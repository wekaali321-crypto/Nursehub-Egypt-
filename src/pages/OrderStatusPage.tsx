import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";
import type { Order, OrderItem } from "../lib/types";
import { useI18n } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const MANUAL_WHATSAPP = "201095652098"; // international format, no + or leading 0
const POLL_MS = 20000;

// The tracking page only ever needs these three fields, and the secure
// lookup endpoint below only ever returns these three fields — customers
// have no read access to the `orders` table itself (it holds other
// people's PII/payment data), by design.
interface TrackedOrder {
  invoiceNo: string;
  paymentStatus: Order["paymentStatus"];
  items: OrderItem[];
}

// Public order-tracking page. Lives at /order/:invoiceNo and can be revisited
// at any time (bookmarked, sent on WhatsApp, etc). It looks the order up
// through /api/order-lookup — a narrow, rate-limited server endpoint —
// rather than querying `orders` directly: guest customers have no Supabase
// Auth session, so a direct client-side query would need a broad anon-read
// RLS policy on `orders`, which would let anyone list every customer's
// order. While the page is open it polls periodically so a payment the
// admin confirms while the customer has this tab open still appears
// without a manual refresh.
export default function OrderStatusPage() {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const { products, trackDownload } = useStore();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("order.tracking")} ${invoiceNo ?? ""} | NurseHub Egypt` });

  const statusMeta: Record<Order["paymentStatus"], { label: string; color: string }> = {
    pending: { label: t("order.status.pending"), color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
    paid: { label: t("order.status.paid"), color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    failed: { label: t("order.status.failed"), color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    refunded: { label: t("order.status.refunded"), color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
  };

  const [order, setOrder] = useState<TrackedOrder | null | undefined>(undefined); // undefined = still loading

  useEffect(() => {
    if (!invoiceNo) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/order-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceNo }),
        });
        if (cancelled) return;
        if (!res.ok) { setOrder(null); return; }
        const json = await res.json();
        setOrder({ invoiceNo: json.invoiceNo, paymentStatus: json.paymentStatus, items: json.items ?? [] });
      } catch {
        if (!cancelled) setOrder(null);
      }
    };
    load();
    const interval = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [invoiceNo]);

  if (order === undefined) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{t("order.notFound")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("order.checkInvoiceNote")}</p>
        <Link to="/store" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("nav.store")}</Link>
      </div>
    );
  }

  const meta = statusMeta[order.paymentStatus];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="text-6xl">{order.paymentStatus === "paid" ? "🎉" : "🧾"}</div>
      <h1 className="mt-3 text-2xl font-black dark:text-white">{t("order.tracking")}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{t("order.invoiceNumber")} <b>{order.invoiceNo}</b></p>
      <span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${meta.color}`}>{meta.label}</span>

      {order.paymentStatus === "pending" && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-600 dark:bg-amber-500/10">
          <p>{t("order.pendingNote")}</p>
          <a
            href={`https://wa.me/${MANUAL_WHATSAPP}?text=${encodeURIComponent(isEn ? `Hello, I'm asking about the status of my order ${order.invoiceNo}` : `مرحباً، بستفسر عن حالة طلبي رقم ${order.invoiceNo}`)}`}
            target="_blank" rel="noreferrer"
            className="mt-3 inline-block rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white"
          >
            {t("order.contactWhatsApp")}
          </a>
        </div>
      )}

      {order.paymentStatus === "paid" && (
        <div className="mt-5 space-y-2 text-right">
          <p className="text-sm font-bold text-emerald-600">{t("order.filesReady")}</p>
          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <span className="text-sm font-semibold dark:text-white">{item.title}</span>
                {product?.fileUrl ? (
                  <a
                    href={`${product.fileUrl}${product.fileUrl.includes("?") ? "&" : "?"}download=`}
                    onClick={() => trackDownload()}
                    className="shrink-0 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white"
                  >
                    {t("order.download")}
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-slate-400">{t("order.fileNotAvailable")}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {order.paymentStatus === "failed" && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10">{t("order.paymentFailed")}</p>
      )}
      {order.paymentStatus === "refunded" && (
        <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800">{t("order.refunded")}</p>
      )}

      <div className="mt-6">
        <Link to="/store" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">{t("nav.store")}</Link>
      </div>
    </div>
  );
}
