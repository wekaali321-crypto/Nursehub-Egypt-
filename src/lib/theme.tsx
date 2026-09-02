import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { adminConfigured, isAllowedAdminEmail } from "./auth";
import { supabase, isSupabaseEnabled } from "./supabase";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("nursehub_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("nursehub_theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

interface AuthValue {
  loggedIn: boolean;
  checking: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  needsSetup: boolean;
}
const AuthCtx = createContext<AuthValue | null>(null);

// Simple client-side rate limiting for login attempts. This is a UX
// nicety only (an attacker can trivially clear localStorage) — the real
// brute-force defense is Supabase Auth's own server-side protection on
// signInWithPassword, which cannot be bypassed from the browser.
const ATTEMPTS_KEY = "nursehub_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function readAttempts(): { count: number; until: number } {
  try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "") ?? { count: 0, until: 0 }; }
  catch { return { count: 0, until: 0 }; }
}
function writeAttempts(v: { count: number; until: number }) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(v));
}

/**
 * loggedIn is derived ONLY from a real, currently-valid Supabase Auth
 * session whose verified email matches the configured admin allowlist.
 * There is no separate localStorage session flag: tampering with
 * localStorage cannot fabricate a session, because Supabase verifies the
 * JWT signature server-side on every request and getSession() here only
 * ever reflects a session Supabase itself issued.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const needsSetup = !adminConfigured();

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) { setChecking(false); return; }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setLoggedIn(isAllowedAdminEmail(data.session?.user?.email));
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(isAllowedAdminEmail(session?.user?.email));
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (needsSetup) return { ok: false, error: "لم يتم ضبط بريد المدير بعد. يرجى إعداد VITE_ADMIN_EMAIL من إعدادات النشر." };
    if (!isSupabaseEnabled || !supabase) return { ok: false, error: "قاعدة البيانات غير متصلة." };

    const att = readAttempts();
    if (att.until > Date.now()) {
      const mins = Math.ceil((att.until - Date.now()) / 60000);
      return { ok: false, error: `تم تجاوز عدد المحاولات. حاول بعد ${mins} دقيقة.` };
    }

    // The account itself must already exist in Supabase Auth (created
    // server-side, once, via the Dashboard/CLI) — this call can never
    // create a new admin, only verify real credentials.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session && isAllowedAdminEmail(data.session.user?.email)) {
      writeAttempts({ count: 0, until: 0 });
      setLoggedIn(true);
      // Best-effort: also establish the separate httpOnly-cookie session
      // used by privileged server endpoints (e.g. /api/admin-orders, which
      // needs the Supabase service-role key and so cannot rely on RLS).
      // If ADMIN_PASSWORD isn't configured or doesn't match, the admin can
      // still use the rest of the dashboard — only those specific
      // endpoints stay unavailable, with their own clear error.
      fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      }).catch(() => {});
      return { ok: true };
    }

    // Either the credentials were wrong, or they were valid for a real
    // Supabase user who simply isn't the configured admin — sign out
    // either way so no non-admin session lingers.
    if (!error) await supabase.auth.signOut().catch(() => {});

    const count = att.count + 1;
    const locked = count >= MAX_ATTEMPTS;
    writeAttempts({ count: locked ? 0 : count, until: locked ? Date.now() + LOCK_MS : 0 });
    return { ok: false, error: locked ? "تم قفل الدخول مؤقتاً بسبب المحاولات المتكررة." : "بيانات الدخول غير صحيحة." };
  };

  const logout = () => {
    if (isSupabaseEnabled && supabase) supabase.auth.signOut().catch(() => {});
    fetch("/api/admin-logout", { method: "POST", credentials: "include" }).catch(() => {});
    setLoggedIn(false);
  };

  return <AuthCtx.Provider value={{ loggedIn, checking, login, logout, needsSetup }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
