import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

interface UserAuthValue {
  user: User | null;
  loggedIn: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const UserAuthCtx = createContext<UserAuthValue | null>(null);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: "نظام العضوية غير مفعّل حاليًا." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: "نظام العضوية غير مفعّل حاليًا." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const signUpWithEmail = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: "نظام العضوية غير مفعّل حاليًا." };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const resetPassword = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: "نظام العضوية غير مفعّل حاليًا." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const logout = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserAuthCtx.Provider value={{ user, loggedIn: !!user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout }}>
      {children}
    </UserAuthCtx.Provider>
  );
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (message.includes("User already registered")) return "هذا البريد الإلكتروني مسجل بالفعل.";
  if (message.includes("Password should be at least")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
  if (message.includes("Email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولاً (راجع صندوق الوارد).";
  return message;
}

export function useUserAuth() {
  const ctx = useContext(UserAuthCtx);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
