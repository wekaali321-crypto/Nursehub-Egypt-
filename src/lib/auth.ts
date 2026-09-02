/**
 * Admin identity allowlist.
 *
 * Real authentication is handled entirely by Supabase Auth
 * (supabase.auth.signInWithPassword — see lib/theme.tsx). There is NO
 * client-side credential store and NO way to create an admin account from
 * the browser: the admin account itself must be created server-side, once,
 * via the Supabase Dashboard / CLI (Authentication -> Users -> Add user).
 *
 * This module only answers one question: "is this authenticated Supabase
 * user allowed to see the admin area?" — by comparing their verified email
 * against VITE_ADMIN_EMAIL. It never stores or trusts anything from
 * localStorage as a security boundary.
 */

/** The single allowed admin email, configured at build/deploy time. */
export function allowedAdminEmail(): string | null {
  const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  return email ? email.trim().toLowerCase() : null;
}

/** True once an admin email has been configured (i.e. setup is complete). */
export function adminConfigured(): boolean {
  return allowedAdminEmail() !== null;
}

/** Whether a verified (server-checked) email is the allowed admin. */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const allowed = allowedAdminEmail();
  if (!allowed || !email) return false;
  return email.trim().toLowerCase() === allowed;
}
