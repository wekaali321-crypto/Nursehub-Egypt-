import { useState } from "react";
import { useAuth } from "../lib/theme";
import Logo from "../components/Logo";

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function Login() {
  const { login, needsSetup } = useAuth();
  const [email, setEmail] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha] = useState(() => ({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 }));
  const [cap, setCap] = useState("");

  if (needsSetup) return <SetupRequired />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (Number(cap) !== captcha.a + captcha.b) { setErr("إجابة التحقق غير صحيحة"); return; }
    setBusy(true);
    const res = await login(email, p);
    setBusy(false);
    if (!res.ok) setErr(res.error || "بيانات الدخول غير صحيحة.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-600 to-emerald-600 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="flex justify-center"><Logo size={52} /></div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">لوحة التحكم</h1>
          <p className="text-sm text-slate-500">تسجيل دخول آمن للمشرفين</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">البريد الإلكتروني</label>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">كلمة المرور</label>
            <input type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">التحقق الأمني: كم يساوي {captcha.a} + {captcha.b}؟</label>
            <input value={cap} onChange={(e) => setCap(e.target.value)} className={inputCls} />
          </div>
          {err && <div className="rounded-lg bg-red-50 p-2 text-center text-sm font-semibold text-red-600 dark:bg-red-500/10">{err}</div>}
          <button disabled={busy} className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 font-bold text-white disabled:opacity-60">{busy ? "جارٍ التحقق..." : "دخول"}</button>
        </form>
      </div>
    </div>
  );
}

/**
 * Shown when VITE_ADMIN_EMAIL isn't configured. This is informational
 * only — it can never create an admin account. The admin account must be
 * created once, server-side, via the Supabase Dashboard (Authentication ->
 * Users -> Add user), and its email set as VITE_ADMIN_EMAIL in the
 * deployment's environment variables.
 */
function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 to-sky-600 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 text-center">
          <div className="flex justify-center"><Logo size={48} /></div>
          <div className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-xl text-white">🔐</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">إعداد المدير مطلوب</h1>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          لأسباب أمنية، لا يمكن إنشاء حساب المدير من المتصفح. اتبع الخطوات التالية من جهة الخادم:
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>من لوحة تحكم Supabase: Authentication ← Users ← Add user، وأنشئ حساب المدير ببريده الحقيقي وكلمة مرور قوية.</li>
          <li>اضبط متغير البيئة <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">VITE_ADMIN_EMAIL</code> في إعدادات النشر (Vercel) على نفس البريد.</li>
          <li>أعد نشر الموقع، ثم سجّل الدخول من هنا بنفس البيانات.</li>
        </ol>
      </div>
    </div>
  );
}
