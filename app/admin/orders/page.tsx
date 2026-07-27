// ============================================================
// المسار المتوقع: app/admin/orders/page.tsx
// ============================================================
import { createClient } from '@supabase/supabase-js'
import OrderRow from './OrderRow'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*, products(title, price, file_url)')
    .order('created_at', { ascending: false })

  return (
    <main dir="rtl" className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">الطلبات</h1>

      <div className="space-y-3">
        {orders?.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
        {orders?.length === 0 && <p className="text-gray-500">مفيش طلبات لسه</p>}
      </div>
    </main>
  )
}
