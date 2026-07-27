// ============================================================
// المسار المتوقع: app/admin/actions.ts
// Server Actions فقط — بتستخدم service_role key (سري تمامًا،
// حطه في .env على Vercel كـ SUPABASE_SERVICE_ROLE_KEY ومتحطوش
// في أي متغير NEXT_PUBLIC_)
// ============================================================
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updateOrderStatus(
  orderId: string,
  status: 'paid' | 'delivered' | 'cancelled'
) {
  const update: Record<string, unknown> = { status }
  if (status === 'paid') update.confirmed_at = new Date().toISOString()

  await supabaseAdmin.from('orders').update(update).eq('id', orderId)
  revalidatePath('/admin/orders')
}

// بيرجع رابط تحميل مؤقت (صالح ساعة واحدة) من bucket "pdf-store" الخاص
// بيقرأ المسار من products.file_url (لازم ترفع الملف وتحط مساره هناك أولًا)
export async function getDownloadLink(filePath: string) {
  const { data, error } = await supabaseAdmin.storage
    .from('pdf-store')
    .createSignedUrl(filePath, 60 * 60)

  if (error) return null
  return data.signedUrl
}
