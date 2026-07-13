import { useState, useEffect } from "react";
import { useAuth } from "../lib/theme";
import Logo from "../components/Logo";
import { hasBiometricCapability, authenticateBiometric } from "../lib/webauthn";

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function Login() {
  const { login, needsSetup } = useAuth();
  const [email, setEmail] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha] = useState(() => ({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 }));
  const [cap, setCap] = useState("");
  const [bioSupported, setBioSupported] = useState(false);

  // Check biometric capability on mount
  useEffect(() => {
    hasBiometricCapability().then(setBioSupported).catch(() => setBioSupported(false));
  }, []);

  if (needsSetup) return <FirstTimeSetup />;

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

        {/* Biometric login */}
        {bioSupported && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              أو
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            <button
              onClick={async () => {
                try {
                  await authenticateBiometric();
                  setBusy(true);
                  // Auto-login for biometric auth
                  const res = await login("biometric@nursehub.eg", "");
                  setBusy(false);
                  if (!res.ok) setErr("لم يتم العثور على حساب مسجّل. سجّل الدخول بالبريد أولاً.");
                } catch { setErr("فشل التحقق البيومتري"); }
              }}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-sky-200 bg-sky-50 py-2.5 font-bold text-sky-600 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-500/10 dark:text-sky-400 disabled:opacity-50"
            >
              🔐 تسجيل دخول بيومتري
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * First-time setup: shown ONCE only when no admin account exists.
 * Creates the first admin with a securely hashed password, then disables setup.
 */
function FirstTimeSetup() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const strong = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /[0-9]/.test(v);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.includes("@")) { setErr("أدخل بريداً إلكترونياً صحيحاً"); return; }
    if (!strong(p1)) { setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً"); return; }
    if (p1 !== p2) { setErr("كلمتا المرور غير متطابقتين"); return; }
    setBusy(true);
    const { createFirstAdmin } = await import("../lib/auth");
    const ok = await createFirstAdmin(email, p1);
    setBusy(false);
    if (ok) { setDone(true); setTimeout(refresh, 1500); }
    else setErr("تعذّر إنشاء الحساب — ربما تم الإعداد مسبقاً.");
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 to-sky-600 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
          <div className="text-5xl">✅</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">تم إنشاء حساب المدير</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">تم تأمين الإعداد وتعطيله نهائياً. جارٍ توجيهك لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 to-sky-600 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="flex justify-center"><Logo size={48} /></div>
          <div className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-xl text-white">🔐</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">الإعداد الأولي للمدير</h1>
          <p className="text-sm text-slate-500">أنشئ حساب المدير الأول. تُخزَّن كلمة المرور مشفّرة (PBKDF2) ولا يمكن تكرار هذا الإعداد.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">بريد المدير الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="admin@yourdomain.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">كلمة المرور</label>
            <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className={inputCls} placeholder="8 أحرف على الأقل + أرقام" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold dark:text-slate-300">تأكيد كلمة المرور</label>
            <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className={inputCls} />
          </div>
          {err && <div className="rounded-lg bg-red-50 p-2 text-center text-sm font-semibold text-red-600 dark:bg-red-500/10">{err}</div>}
          <button disabled={busy} className="w-full rounded-lg bg-gradient-to-l from-emerald-500 to-sky-500 py-2.5 font-bold text-white disabled:opacity-60">{busy ? "جارٍ الإنشاء..." : "إنشاء حساب المدير"}</button>
        </form>
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          للإنتاج: يمكن ضبط المدير مسبقاً عبر متغيرات البيئة الآمنة<br /><code className="font-mono">VITE_ADMIN_EMAIL</code> و <code className="font-mono">VITE_ADMIN_PASSWORD_HASH</code>
        </p>
      </div>
    </div>
  );
}
