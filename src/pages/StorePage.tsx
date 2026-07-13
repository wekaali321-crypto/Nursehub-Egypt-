import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useCart } from "../lib/cart";
import { useToast } from "../components/Toast";
import { Breadcrumbs, AdSlot } from "../components/common";
import OptimizedImage from "../components/OptimizedImage";

const typeLabels: Record<string, string> = { pdf: "ملف PDF", course: "كورس", subscription: "اشتراك" };

export default function StorePage() {
  const { products } = useStore();
  const { add, count } = useCart();
  const { notify } = useToast();
  const nav = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<number>(0);
  const [filter, setFilter] = useState("all");

  const list = filter === "all" ? products : products.filter((p) => p.type === filter);

  const applyCoupon = () => {
    const codes: Record<string, number> = { NURSE10: 10, STUDENT20: 20, WELCOME15: 15 };
    setApplied(codes[coupon.toUpperCase()] ?? 0);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "المتجر الرقمي" }]} />
      <div className="mb-6 flex items-center justify-between rounded-3xl bg-gradient-to-l from-emerald-500 to-sky-500 p-8 text-white">
        <div>
          <h1 className="text-3xl font-black">🛒 المتجر الرقمي</h1>
          <p className="mt-1 text-sky-50">كتب، ملخصات، كورسات واشتراكات بأفضل الأسعار</p>
        </div>
        <Link to="/checkout" className="relative rounded-full bg-white/20 px-5 py-2.5 font-bold backdrop-blur hover:bg-white/30">
          🛒 السلة
          {count > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-black text-emerald-600">{count}</span>}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["all", "pdf", "course", "subscription"].map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === t ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{t === "all" ? "الكل" : typeLabels[t]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="كود الخصم" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <button onClick={applyCoupon} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-bold text-white">تطبيق</button>
        </div>
      </div>
      {applied > 0 && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-center font-bold text-emerald-600 dark:bg-emerald-500/10">✅ تم تطبيق خصم {applied}%! جرب: NURSE10, STUDENT20, WELCOME15</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const finalPrice = applied ? Math.round(p.price * (1 - applied / 100)) : p.price;
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <Link to={`/product/${p.id}`} className="relative block">
                <OptimizedImage src={p.cover} alt={p.title} width={600} ratio="16/10" />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-slate-900/90">{typeLabels[p.type]}</span>
              </Link>
              <div className="p-5">
                <Link to={`/product/${p.id}`}><h3 className="font-bold hover:text-sky-600 dark:text-white">{p.title}</h3></Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{p.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-500">{finalPrice} ج.م</span>
                  {(p.oldPrice || applied > 0) && <span className="text-sm text-slate-400 line-through">{p.oldPrice ?? p.price} ج.م</span>}
                </div>
                <div className="mt-1 text-xs text-slate-400">🛍 {p.sales} عملية شراء</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { add({ productId: p.id, title: p.title, price: finalPrice, qty: 1, cover: p.cover }); notify("أُضيف إلى السلة", "success"); }} className="flex-1 rounded-full border border-sky-500 py-2.5 text-sm font-bold text-sky-500">🛒 أضف للسلة</button>
                  <button onClick={() => { add({ productId: p.id, title: p.title, price: finalPrice, qty: 1, cover: p.cover }); nav("/checkout"); }} className="flex-1 rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 text-sm font-bold text-white hover:opacity-90">شراء الآن</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10"><AdSlot label="إعلان أسفل المتجر" /></div>
    </div>
  );
}
