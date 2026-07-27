'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// رقم الواتساب بتاعك (بصيغة دولية بدون +)
const WHATSAPP_NUMBER = '201095652098'

// رابط PDF الثابت للتحميل المباشر
const PDF_URL = "https://vpgzbjbcbrbexpzoxrup.supabase.co/storage/v1/object/sign/pdf-store/vital%20signs%20.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMWUzODQ5MS04YzE5LTRmZjgtYjE3Yi01NzQ0ZDYwZDE4YzciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwZGYtc3RvcmUvdml0YWwgc2lnbnMgLnBkZiIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUxNzY5MjIsImV4cCI6MTgxNjcxMjkyMn0.nRglNCWrg4wJuAarqI7--u5RZP1PlauskAJ1Qd5v4g4";

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
  const [directLoading, setDirectLoading] = useState(false)

  // ============================================================
  // الزر الأول: الشراء عبر واتساب (الكود القديم نفسه)
  // ============================================================
  async function handleWhatsAppBuy() {
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

  // ============================================================
  // الزر الثاني: التحميل المباشر (جديد)
  // ============================================================
  function handleDirectDownload() {
    setDirectLoading(true)
    window.open(PDF_URL, '_blank')
    setDirectLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* ============================================================
          حقول الإدخال (خاصة بواتساب)
          ============================================================ */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
          className="w-full border rounded-lg p-3 dark:bg-slate-800 dark:border-slate-700"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم موبايلك"
          className="w-full border rounded-lg p-3 dark:bg-slate-800 dark:border-slate-700"
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'vodafone_cash' | 'instapay')}
          className="w-full border rounded-lg p-3 dark:bg-slate-800 dark:border-slate-700"
        >
          <option value="vodafone_cash">فودافون كاش</option>
          <option value="instapay">InstaPay</option>
        </select>
      </div>

      {/* ============================================================
          الزر الأول: واتساب (الأزرق)
          ============================================================ */}
      <button
        onClick={handleWhatsAppBuy}
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60 transition"
      >
        {loading ? 'جاري التجهيز...' : '📲 اشترِ الآن عبر واتساب'}
      </button>

      {/* ============================================================
          الفاصل
          ============================================================ */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        <span className="mx-4 text-sm text-slate-400 dark:text-slate-500">أو</span>
        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
      </div>

      {/* ============================================================
          الزر الثاني: تحميل مباشر (الجديد - باللون السماوي)
          ============================================================ */}
      <button
        onClick={handleDirectDownload}
        disabled={directLoading}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60 transition"
      >
        {directLoading ? 'جاري التحميل...' : '📥 تحميل PDF مباشر (30 ج.م)'}
      </button>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500">
        بسعر تعريفي 30 ج.م بدلاً من 50 (لفترة محدودة)
      </p>
    </div>
  )
}
