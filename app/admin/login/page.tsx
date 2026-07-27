// ============================================================
// المسار المتوقع: app/admin/login/page.tsx
// ============================================================
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkPassword, createSessionToken, COOKIE_NAME } from '@/lib/adminAuth'

async function login(formData: FormData) {
  'use server'
  const password = String(formData.get('password') || '')

  if (!checkPassword(password)) {
    redirect('/admin/login?error=1')
  }

  const token = createSessionToken()
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // يوم واحد
    path: '/',
  })

  redirect('/admin/orders')
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main dir="rtl" className="max-w-sm mx-auto p-6 mt-20">
      <h1 className="text-xl font-bold mb-4">دخول لوحة التحكم</h1>
      <form action={login} className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder="كلمة السر"
          required
          className="w-full border rounded-lg p-3"
        />
        <button className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg">
          دخول
        </button>
      </form>
      {searchParams.error && (
        <p className="text-red-600 text-sm mt-2">كلمة السر غلط</p>
      )}
    </main>
  )
}
