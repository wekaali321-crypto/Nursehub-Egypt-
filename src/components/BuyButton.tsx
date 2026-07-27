// ============================================================
// المسار المتوقع: components/BuyButton.tsx
// ملحوظة: جدول orders عندك بيطلب customer_name و phone و amount
// كحقول إجبارية (NOT NULL)، فحطينالهم فورم بسيط قبل الإرسال.
// ============================================================
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// غيّر الرقم ده لرقم الواتساب بتاعك (بصيغة دولية بدون +)
const WHATSAPP_NUMBER = '201095652098'

export default function BuyButton({
  productId,
  productTitle,
  price,
}: {
  productId: string
  productTitle: string
  price: number
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>(
    'vodafone_cash'
  )
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!name.trim() || !phone.trim()) {
      alert('اكتب اسمك ورقم موبايلك الأول')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          product_id: productId,
          customer_name: name.trim(),
          phone: phone.trim(),
          payment_method: paymentMethod,
          amount: price,
        })
        .select('id')
        .single()

      if (error || !data) {
        alert('حصل خطأ، حاول تاني')
        setLoading(false)
        return
      }

      const orderShortId = data.id.slice(0, 8)
      const payLabel = paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'InstaPay'
      const message = encodeURIComponent(
        `مرحبًا، عايز أشتري "${productTitle}" بسعر ${price} جنيه.\n` +
          `الاسم: ${name}\n` +
          `طريقة الدفع: ${payLabel}\n` +
          `رقم الطلب: ${orderShortId}\n` +
          `هرفق صورة إثبات التحويل دلوقتي.`
      )

      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
    } catch (e) {
      alert('حصل خطأ، حاول تاني')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اسمك"
        className="w-full border rounded-lg p-3"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="رقم موبايلك"
        className="w-full border rounded-lg p-3"
      />
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as 'vodafone_cash' | 'instapay')}
        className="w-full border rounded-lg p-3"
      >
        <option value="vodafone_cash">فودافون كاش</option>
        <option value="instapay">InstaPay</option>
      </select>

      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60"
      >
        {loading ? 'جاري التجهيز...' : '📲 اشترِ الآن عبر واتساب'}
      </button>
    </div>
  )
}
