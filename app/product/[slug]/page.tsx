// ============================================================
// المسار المتوقع: app/product/[slug]/page.tsx
// ملحوظة: عندك جدول products بالفعل، id عبارة عن slug نصي
// (مثال: "p-vital-signs-pdf") مش uuid، فاستخدمناه زي ما هو.
// ============================================================
import { createClient } from '@supabase/supabase-js'
import BuyButton from '@/components/BuyButton'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function ProductPage({
  params,
}: {
  params: { slug: string } // ده فعليًا هو products.id عندك
}) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.slug)
    .single()

  if (error || !product) {
    notFound()
  }

  const price = Number(product.price)
  const oldPrice = product.old_price ? Number(product.old_price) : null
  const discountPercent = oldPrice
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : null

  return (
    <main dir="rtl" className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
      {product.description && (
        <p className="text-gray-500 mb-6">{product.description}</p>
      )}

      <div className="bg-teal-50 border border-teal-300 rounded-xl p-5 mb-6 text-center">
        {oldPrice && (
          <span className="text-gray-400 line-through ml-2">
            {oldPrice} جنيه
          </span>
        )}
        <span className="text-3xl font-extrabold text-teal-700">
          {price} جنيه
        </span>
        {discountPercent && (
          <div className="text-sm text-red-600 font-bold mt-1">
            خصم {discountPercent}% لفترة محدودة
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-6">
        <h2 className="font-bold mb-3">طريقة الدفع</h2>
        <ol className="list-decimal pr-5 space-y-2 text-sm leading-7">
          <li>
            حوّل <strong>{price} جنيه</strong> على فودافون كاش أو InstaPay
            (هتلاقي التفاصيل في رسالة الواتساب اللي هتفتح بعد الضغط تحت).
          </li>
          <li>اضغط الزرار وابعت صورة إثبات التحويل على واتساب.</li>
          <li>هيتم تفعيل ملف الـPDF وإرساله لك خلال وقت قصير.</li>
        </ol>
      </div>

      <BuyButton productId={product.id} productTitle={product.title} price={price} />
    </main>
  )
}
