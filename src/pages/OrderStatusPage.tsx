import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fromOrder } from "../lib/dataApi";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";
import type { Order } from "../lib/types";

const MANUAL_WHATSAPP = "201095652098"; // international format, no + or leading 0

const statusMeta: Record<Order["paymentStatus"], { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
  paid: { label: "مدفوع ✅", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
  failed: { label: "فشل", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
  refunded: { label: "مسترجع", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
};

// Public order-tracking page. Lives at /order/:invoiceNo and can be revisited
// at any time (bookmarked, sent on WhatsApp, etc). It reads the order LIVE
// from Supabase — not from local app state — so it reflects whatever the
// admin has confirmed, even from a completely different device. While the
// page is open it also listens for live updates via Supabase Realtime, so if
// the admin confirms payment while the customer has this page open, the
// download button appears without a refresh.
export default function OrderStatusPage() {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const { products, trackDownload } = useStore();
  useSEO({ title: `تتبع الطلب ${invoiceNo ?? ""} | NurseHub Egypt` });

  const [order, setOrder] = useState<Order | null | undefined>(undefined); // undefined = still loading

  useEffect(() => {
    if (!invoiceNo || !supabase) return;

    let cancelled = false;
    const load = async () => {
      const { data } = await supabase!
        .from("orders")
        .select("*")
        .eq("invoice_no", invoiceNo)
        .maybeSingle();
      if (!cancelled) setOrder(data ? fromOrder(data) : null);
    };
    load();

    const channel = supabase
      .channel(`order-${invoiceNo}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `invoice_no=eq.${invoiceNo}` },
        (payload) => setOrder(fromOrder(payload.new))
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase?.removeChannel(channel);
    };
  }, [invoiceNo]);

  if (order === undefined) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-slate-400">جارٍ التحميل...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">لم يتم العثور على الطلب</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">تأكد من رقم الفاتورة في الرابط.</p>
        <Link to="/store" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">المتجر</Link>
      </div>
    );
  }

  const meta = statusMeta[order.paymentStatus];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="text-6xl">{order.paymentStatus === "paid" ? "🎉" : "🧾"}</div>
      <h1 className="mt-3 text-2xl font-black dark:text-white">تتبع الطلب</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">رقم الفاتورة: <b>{order.invoiceNo}</b></p>
      <span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${meta.color}`}>{meta.label}</span>

      {order.paymentStatus === "pending" && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-600 dark:bg-amber-500/10">
          <p>الدفع لسه قيد المراجعة. زرار التحميل هيظهر هنا تلقائياً فور تأكيد الدفع — احتفظ بالرابط ده وارجعله في أي وقت.</p>
          <a
            href={`https://wa.me/${MANUAL_WHATSAPP}?text=${encodeURIComponent(`مرحباً، بستفسر عن حالة طلبي رقم ${order.invoiceNo}`)}`}
            target="_blank" rel="noreferrer"
            className="mt-3 inline-block rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white"
          >
            📲 تواصل على واتساب
          </a>
        </div>
      )}

      {order.paymentStatus === "paid" && (
        <div className="mt-5 space-y-2 text-right">
          <p className="text-sm font-bold text-emerald-600">ملفاتك جاهزة للتحميل:</p>
          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <span className="text-sm font-semibold dark:text-white">{item.title}</span>
                {product?.fileUrl ? (
                  <a
                    href={product.fileUrl} target="_blank" rel="noreferrer" download
                    onClick={() => trackDownload()}
                    className="shrink-0 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white"
                  >
                    📥 تحميل
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-slate-400">الملف غير متاح بعد</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {order.paymentStatus === "failed" && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10">فشلت عملية الدفع. تواصل معنا على واتساب لإعادة المحاولة.</p>
      )}
      {order.paymentStatus === "refunded" && (
        <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800">تم استرجاع قيمة هذا الطلب.</p>
      )}

      <div className="mt-6">
        <Link to="/store" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">المتجر</Link>
      </div>
    </div>
  );
}
