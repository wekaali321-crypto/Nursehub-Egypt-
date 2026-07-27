// ============================================================
// المسار: middleware.ts (في جذر المشروع، جنب app/)
// بيحمي كل مسارات /admin ما عدا /admin/login
// ============================================================
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/adminAuth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  if (isAdminRoute) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!verifySessionToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
