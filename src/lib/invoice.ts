import { logoMarkSVG, creditFooterHTML, BRAND_NAME } from "./brand";
import type { Order } from "./types";

/** Generate & print a branded PDF invoice (with QR code) for an order. */
export function printInvoice(order: Order, currency = "EGP") {
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return;
  const qrData = encodeURIComponent(`${BRAND_NAME}|${order.invoiceNo}|${order.total}${currency}|${order.transactionId ?? ""}`);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}`;
  const rows = order.items.map((it) => `<tr><td>${it.title}</td><td>${it.qty}</td><td>${it.price} ${currency}</td><td>${it.price * it.qty} ${currency}</td></tr>`).join("");
  const statusColor = order.paymentStatus === "paid" ? "#10b981" : order.paymentStatus === "refunded" ? "#f59e0b" : order.paymentStatus === "failed" ? "#ef4444" : "#64748b";
  const statusLabel: Record<string, string> = { paid: "مدفوع", pending: "قيد الانتظار", failed: "فشل", refunded: "مسترجع" };

  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>فاتورة ${order.invoiceNo}</title>
    <style>
      body{font-family:'Cairo',Arial,sans-serif;color:#0f172a;margin:0;padding:32px;background:#fff}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px}
      .brand{display:flex;align-items:center;gap:10px}
      .wm{font-weight:800;font-size:22px}.wm span{color:#0ea5e9}
      h1{font-size:20px;margin:16px 0 4px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:right;font-size:14px}
      th{background:#f1f5f9}
      .totals{margin-inline-start:auto;width:280px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      .badge{display:inline-block;color:#fff;padding:3px 12px;border-radius:9999px;font-weight:700;font-size:12px;background:${statusColor}}
    </style></head><body>
    <div class="head">
      <div class="brand">${logoMarkSVG(46)}<div><div class="wm">Nurse<span>Hub</span> Egypt</div><div style="font-size:12px;color:#64748b">${BRAND_NAME}</div></div></div>
      <div style="text-align:left"><img src="${qr}" alt="QR" width="90" height="90"/></div>
    </div>
    <h1>فاتورة ضريبية</h1>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px">
      <div><b>رقم الفاتورة:</b> ${order.invoiceNo}<br/><b>التاريخ:</b> ${order.date}<br/><b>رقم العملية:</b> ${order.transactionId ?? "—"}</div>
      <div><b>العميل:</b> ${order.customerName}<br/><b>البريد:</b> ${order.email}<br/><b>الهاتف:</b> ${order.phone || "—"}</div>
    </div>
    <div style="margin-bottom:8px"><b>الحالة:</b> <span class="badge">${statusLabel[order.paymentStatus]}</span> &nbsp; <b>وسيلة الدفع:</b> ${order.gateway}</div>
    <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="totals">
      <div><span>المجموع الفرعي</span><span>${order.subtotal} ${currency}</span></div>
      ${order.discount ? `<div><span>الخصم${order.couponCode ? ` (${order.couponCode})` : ""}</span><span>- ${order.discount} ${currency}</span></div>` : ""}
      ${order.tax ? `<div><span>الضريبة</span><span>${order.tax} ${currency}</span></div>` : ""}
      <div style="border-top:2px solid #0ea5e9;font-weight:800;font-size:16px;margin-top:6px;padding-top:6px"><span>الإجمالي</span><span>${order.total} ${currency}</span></div>
    </div>
    ${creditFooterHTML()}
    <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
  </body></html>`);
  w.document.close();
}
