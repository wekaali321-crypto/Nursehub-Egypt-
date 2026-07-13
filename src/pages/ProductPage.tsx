import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useCart } from "../lib/cart";
import { useToast } from "../components/Toast";
import { Breadcrumbs } from "../components/common";
import { useSEO, breadcrumbSchema } from "../lib/seo";
import PdfViewer from "../components/PdfViewer";

const typeLabels: Record<string, string> = { pdf: "ملف PDF", course: "كورس", subscription: "اشتراك" };

export default function ProductPage() {
  const { id } = useParams();
  const { products, commerce } = useStore();
  const { add } = useCart();
  const { notify } = useToast();
  const nav = useNavigate();
  const [preview, setPreview] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const product = products.find((p) => p.id === id || p.slug === id);
  const cur = commerce.currency;

  useSEO({
    title: product ? `${product.title} | متجر NurseHub Egypt` : "المنتج غير موجود",
    description: product?.description,
    image: product?.cover,
    type: "product",
    jsonLd: product
      ? [
          { "@context": "https://schema.org", "@type": "Product", name: product.title, description: product.description, image: product.cover, offers: { "@type": "Offer", price: product.price, priceCurrency: cur, availability: "https://schema.org/InStock" } },
          breadcrumbSchema([
            { name: "الرئيسية", url: window.location.origin },
            { name: "المتجر", url: `${window.location.origin}/store` },
            { name: product.title, url: window.location.href },
          ]),
        ]
      : undefined,
  });

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">المنتج غير موجود</h1>
        <Link to="/store" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">العودة للمتجر</Link>
      </div>
    );
  }

  const images = [product.cover, ...(product.gallery ?? [])];
  const related = products.filter((p) => p.id !== product.id && p.type === product.type).slice(0, 3);
  const addToCart = () => { add({ productId: product.id, title: product.title, price: product.price, qty: 1, cover: product.cover }); notify("أُضيف إلى السلة", "success"); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {preview && <PdfViewer url={product.previewPdf ?? "#"} title={`معاينة: ${product.title}`} onClose={() => setPreview(false)} />}
      <Breadcrumbs items={[{ label: "المتجر", path: "/store" }, { label: product.title }]} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <img src={images[activeImg]} alt={product.title} className="h-80 w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-sky-500" : "border-transparent"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">{typeLabels[product.type]}</span>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white md:text-3xl">{product.title}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            {product.author && <span>✍️ {product.author}</span>}
            {product.pages ? <span>📄 {product.pages} صفحة</span> : null}
            <span>🛍 {product.sales} عملية شراء</span>
          </div>
          <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">{product.description}</p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-black text-emerald-500">{product.price} {cur}</span>
            {product.oldPrice && <span className="text-lg text-slate-400 line-through">{product.oldPrice} {cur}</span>}
            {product.oldPrice && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-500/10">خصم {Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => { addToCart(); nav("/checkout"); }} className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white">شراء الآن</button>
            <button onClick={addToCart} className="rounded-full border border-sky-500 px-6 py-3 font-bold text-sky-500">🛒 أضف للسلة</button>
            {product.type === "pdf" && <button onClick={() => setPreview(true)} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">👁️ معاينة</button>}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">🔒 دفع آمن · تسليم رقمي فوري بعد الدفع · روابط تحميل محمية</div>
          </div>
        </div>
      </div>

      {product.fullContent && (
        <div className="prose-content mt-10 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: product.fullContent }} />
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold dark:text-white">منتجات مشابهة</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <img src={p.cover} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
                <div className="p-4"><h3 className="font-bold dark:text-white">{p.title}</h3><div className="mt-1 font-black text-emerald-500">{p.price} {cur}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
