/**
 * E-mail OTP password reset: calls /auth/v1/otp/* on the site's own auth backend (functions/_lib/sbauth.js).
 * The server never says whether an e-mail is registered: step 1 always answers the same way.
 */
import { getSupabaseStatus } from "./supabase";

export interface OtpResult<T = Record<string, unknown>> {
  ok: boolean;
  data?: T;
  /** server error code (otp_invalid, otp_locked, …) or "network" */
  code?: string;
  /** Arabic message for the page */
  message?: string;
  /** the flow must start again from step 1 */
  restart?: boolean;
  retryAfter?: number;
  attemptsLeft?: number;
}

const RESTART = new Set(["otp_request_invalid", "otp_request_expired", "otp_locked", "otp_resend_limit", "reset_invalid"]);

const minutes = (sec: number) => {
  const m = Math.max(1, Math.ceil(sec / 60));
  return m === 1 ? "دقيقة" : m === 2 ? "دقيقتين" : m <= 10 ? `${m} دقائق` : `${m} دقيقة`;
};

export function otpMessage(code: string, extra: { retryAfter?: number; attemptsLeft?: number } = {}): string {
  switch (code) {
    case "email_not_configured": return "استعادة كلمة المرور بالبريد غير متاحة حاليًا. تواصل معنا من صفحة «تواصل معنا».";
    case "email_daily_limit": return "الخدمة وصلت لحدّها اليومي من الرسائل. جرّب تاني بكرة أو تواصل معنا.";
    case "over_request_rate_limit": return `محاولات كتير. استنى ${minutes(extra.retryAfter ?? 60)} وجرّب تاني.`;
    case "otp_resend_wait": return `تقدر تطلب رمز جديد بعد ${extra.retryAfter ?? 60} ثانية.`;
    case "otp_resend_limit": return "وصلت للحد الأقصى لإعادة إرسال الرمز. ابدأ طلبًا جديدًا.";
    case "otp_invalid": return extra.attemptsLeft === 1 ? "الرمز غير صحيح. باقي لك محاولة واحدة." : `الرمز غير صحيح. باقي لك ${extra.attemptsLeft ?? ""} محاولات.`;
    case "otp_locked": return "تم تجاوز عدد المحاولات المسموح (5). اطلب رمزًا جديدًا.";
    case "otp_expired": return "انتهت صلاحية الرمز (10 دقائق). اضغط «إعادة إرسال الرمز».";
    case "otp_request_invalid":
    case "otp_request_expired":
    case "reset_invalid": return "انتهت صلاحية طلب الاستعادة. ابدأ من جديد.";
    case "weak_password": return "كلمة المرور لازم تكون 8 أحرف على الأقل.";
    case "validation_failed": return "راجع البيانات المكتوبة.";
    case "network": return "تعذّر الاتصال. تأكد من الإنترنت وجرّب تاني.";
    default: return "حصل خطأ غير متوقع. جرّب تاني.";
  }
}

async function call<T>(route: string, body: Record<string, unknown>): Promise<OtpResult<T>> {
  const base = getSupabaseStatus().url;
  if (!base) return { ok: false, code: "email_not_configured", message: otpMessage("email_not_configured") };
  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, "")}/auth/v1/${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, code: "network", message: otpMessage("network") };
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, data: json as T };
  const code = String(json.error_code || "unknown");
  const retryAfter = Number(json.retry_after || res.headers.get("retry-after") || 0) || undefined;
  const attemptsLeft = typeof json.attempts_left === "number" ? json.attempts_left : undefined;
  return { ok: false, code, retryAfter, attemptsLeft, restart: RESTART.has(code), message: otpMessage(code, { retryAfter, attemptsLeft }) };
}

export const requestOtp = (email: string) =>
  call<{ request_id: string; expires_in: number; resend_after: number }>("otp/request", { email });
export const resendOtp = (email: string, requestId: string) =>
  call<{ expires_in: number; resend_after: number; resends_left: number }>("otp/resend", { email, request_id: requestId });
export const verifyOtp = (email: string, requestId: string, code: string) =>
  call<{ reset_token: string; expires_in: number }>("otp/verify", { email, request_id: requestId, code });
export const resetWithToken = (requestId: string, resetToken: string, password: string) =>
  call<{ ok: true }>("otp/reset", { request_id: requestId, reset_token: resetToken, password });
