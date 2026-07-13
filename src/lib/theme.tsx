import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authenticate, startSession, endSession, hasValidSession, adminExists, setupAvailable } from "./auth";

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
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  needsSetup: boolean;
  refresh: () => void;
}
const AuthCtx = createContext<AuthValue | null>(null);

// Simple client-side rate limiting for login attempts.
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(() => hasValidSession());
  const [needsSetup, setNeedsSetup] = useState(() => setupAvailable());

  const refresh = () => { setNeedsSetup(setupAvailable()); setLoggedIn(hasValidSession()); };

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!adminExists()) return { ok: false, error: "لا يوجد حساب مدير بعد. يرجى إتمام الإعداد الأولي." };
    const att = readAttempts();
    if (att.until > Date.now()) {
      const mins = Math.ceil((att.until - Date.now()) / 60000);
      return { ok: false, error: `تم تجاوز عدد المحاولات. حاول بعد ${mins} دقيقة.` };
    }
    const ok = await authenticate(email, password);
    if (ok) {
      writeAttempts({ count: 0, until: 0 });
      startSession();
      setLoggedIn(true);
      return { ok: true };
    }
    const count = att.count + 1;
    const locked = count >= MAX_ATTEMPTS;
    writeAttempts({ count: locked ? 0 : count, until: locked ? Date.now() + LOCK_MS : 0 });
    return { ok: false, error: locked ? "تم قفل الدخول مؤقتاً بسبب المحاولات المتكررة." : "بيانات الدخول غير صحيحة." };
  };

  const logout = () => { endSession(); setLoggedIn(false); };

  return <AuthCtx.Provider value={{ loggedIn, login, logout, needsSetup, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
