// ============================================================
// المسار المتوقع: lib/adminAuth.ts
// نظام دخول بسيط بكلمة سر واحدة (بدون قاعدة بيانات مستخدمين)
// يعتمد على ADMIN_PASSWORD و ADMIN_SESSION_SECRET في .env
// ============================================================
import crypto from 'crypto'

const COOKIE_NAME = 'nh_admin_session'
const SECRET = process.env.ADMIN_SESSION_SECRET! // سر عشوائي طويل، حطه في .env

export function checkPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD
}

// بيولّد توكن موقّع (HMAC) صالح لمدة يوم، بدون تخزين في قاعدة بيانات
export function createSessionToken() {
  const expiry = Date.now() + 24 * 60 * 60 * 1000 // صالح ليوم واحد
  const payload = `${expiry}`
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')
  return `${payload}.${signature}`
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')

  if (signature !== expected) return false
  if (Date.now() > Number(payload)) return false // انتهت الصلاحية

  return true
}

export { COOKIE_NAME }
