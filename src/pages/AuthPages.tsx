import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { isSupabaseConfigured } from "../lib/supabase";
import { useUserAuth } from "../lib/userAuth";
import { otpMessage, requestOtp, resendOtp, resetWithToken, verifyOtp } from "../lib/passwordReset";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-800";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-nh-teal-dark hover:bg-nh-teal-darker text-2xl text-white">🩺</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">{title}</h1>
        </div>
        {children}
        <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
      </div>
    </div>
  );
}

function SocialButtons({ busy, onGoogle }: { busy: boolean; onGoogle: () => void }) {
  const disabled = !isSupabaseConfigured() || busy;
  return (
    <div className="space-y-2">
      <div className="my-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />أو<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
      <button type="button" onClick={onGoogle} disabled={disabled} className={`flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 font-semibold dark:border-slate-700 dark:text-white ${disabled ? "opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
        <span>🔵</span> المتابعة عبر Google
      </button>
    </div>
  );
}

export function LoginPage() {
  useSEO({ title: "تسجيل الدخول | NurseHub Egypt" });
  const { notify } = useToast();
  const nav = useNavigate();
  const { signInWithEmail, signInWithGoogle } = useUserAuth();
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) { notify("نظام العضوية يتفعّل بعد ربط Supabase Auth", "info"); return; }
    setBusy(true);
    const res = await signInWithEmail(email, pass);
    setBusy(false);
    if (res.ok) { notify("تم تسجيل الدخول بنجاح", "success"); nav("/dashboard"); }
    else notify(res.error || "تعذّر تسجيل الدخول", "error");
  };

  const google = async () => {
    setBusy(true);
    const res = await signInWithGoogle();
    setBusy(false);
    if (!res.ok) notify(res.error || "تعذّر الدخول عبر Google", "error");
  };

  return (
    <Shell title="تسجيل الدخول" footer={<>ليس لديك حساب؟ <Link to="/register" className="font-bold text-teal-700 dark:text-teal-300">أنشئ حساباً</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
        <input type="password" required placeholder="كلمة المرور" value={pass} onChange={(e) => setPass(e.target.value)} className={inp} />
        <div className="text-left"><Link to="/forgot" className="text-xs font-semibold text-teal-700 dark:text-teal-300">نسيت كلمة المرور؟</Link></div>
        <button disabled={busy} className="w-full rounded-lg bg-nh-teal-dark hover:bg-nh-teal-darker py-2.5 font-bold text-white disabled:opacity-60">{busy ? "جارٍ الدخول..." : "دخول"}</button>
      </form>
      <SocialButtons busy={busy} onGoogle={google} />
      {!isSupabaseConfigured() && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-xs text-amber-700 dark:text-amber-300 dark:bg-amber-500/10">نظام العضوية جاهز ويعمل عبر Supabase Auth بعد إضافة المفاتيح.</p>}
    </Shell>
  );
}

export function RegisterPage() {
  useSEO({ title: "إنشاء حساب | NurseHub Egypt" });
  const { notify } = useToast();
  const nav = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useUserAuth();
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) { notify("التسجيل يتفعّل بعد ربط Supabase Auth", "info"); return; }
    setBusy(true);
    const res = await signUpWithEmail(f.name, f.email, f.pass);
    setBusy(false);
    if (res.ok) { notify("تم إنشاء الحساب بنجاح", "success"); nav("/dashboard"); }
    else notify(res.error || "تعذّر إنشاء الحساب", "error");
  };

  const google = async () => {
    setBusy(true);
    const res = await signInWithGoogle();
    setBusy(false);
    if (!res.ok) notify(res.error || "تعذّر الدخول عبر Google", "error");
  };

  return (
    <Shell title="إنشاء حساب" footer={<>لديك حساب؟ <Link to="/login" className="font-bold text-teal-700 dark:text-teal-300">سجّل الدخول</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="الاسم الكامل" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inp} />
        <input type="email" required placeholder="البريد الإلكتروني" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
        <input type="password" required minLength={6} placeholder="كلمة المرور" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} className={inp} />
        <button disabled={busy} className="w-full rounded-lg bg-nh-teal-dark hover:bg-nh-teal-darker py-2.5 font-bold text-white disabled:opacity-60">{busy ? "جارٍ الإنشاء..." : "إنشاء الحساب"}</button>
      </form>
      <SocialButtons busy={busy} onGoogle={google} />
    </Shell>
  );
}

const RESET_KEY = "nh_pw_reset"; // this tab only: lets a refresh keep the step (no code or token is stored)
type ResetStep = "email" | "code" | "password" | "done";
const readSaved = (): { email: string; requestId: string; sentAt: number; expiresAt: number } | null => {
  try { const v = JSON.parse(sessionStorage.getItem(RESET_KEY) || "null"); return v && v.expiresAt > Date.now() - 30 * 60e3 ? v : null; } catch { return null; }
};
const save = (v: object | null) => { try { if (v) sessionStorage.setItem(RESET_KEY, JSON.stringify(v)); else sessionStorage.removeItem(RESET_KEY); } catch { /* private mode */ } };

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!active) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [active]);
  return now;
}
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function PasswordField({ id, label, value, onChange, show, onToggle, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} required minLength={8} maxLength={128} autoComplete={autoComplete} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className={`${inp} pl-11`} />
        <button type="button" onClick={onToggle} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={show} className="absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-500 hover:text-teal-700 dark:text-slate-400">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Notice({ kind, children }: { kind: "error" | "info" | "success"; children: React.ReactNode }) {
  const cls = kind === "error" ? "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300" : kind === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-teal-50 text-teal-900 dark:bg-teal-500/10 dark:text-teal-200";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-lg p-3 text-sm leading-6 ${cls}`}>{children}</p>;
}

export function ForgotPage() {
  // Password reset by e-mail: 1) e-mail → 2) 6-digit code (10 min, 5 tries, resend after 60 s) → 3) new password.
  // Step 1 answers the same way for every address, so the page never tells whether an account exists.
  useSEO({ title: "استعادة كلمة المرور | NurseHub Egypt" });
  const nav = useNavigate();
  const { notify } = useToast();
  const { signInWithGoogle } = useUserAuth();
  const saved = useMemo(readSaved, []);
  const [step, setStep] = useState<ResetStep>(saved ? "code" : "email");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [requestId, setRequestId] = useState(saved?.requestId ?? "");
  const [sentAt, setSentAt] = useState(saved?.sentAt ?? 0);
  const [expiresAt, setExpiresAt] = useState(saved?.expiresAt ?? 0);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [pass, setPass] = useState(""); const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false); const [show2, setShow2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(saved ? "لو البريد مسجّل عندنا، هيوصلك رمز تحقق من 6 أرقام." : "");
  const tick = useNow(step === "code");
  const now = Math.max(tick, sentAt); // the ticking clock may be older than the last send
  const codeRef = useRef<HTMLInputElement>(null);
  const resendIn = sentAt + 60_000 - now;
  const left = expiresAt - now;

  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);
  useEffect(() => { if (step !== "done") return; const t = window.setTimeout(() => nav("/login"), 3000); return () => clearTimeout(t); }, [step, nav]);

  const restart = (msg: string) => { save(null); setStep("email"); setRequestId(""); setCode(""); setResetToken(""); setInfo(""); setError(msg); };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setInfo("");
    const addr = email.trim().toLowerCase();
    const r = await requestOtp(addr);
    setBusy(false);
    if (!r.ok || !r.data) { setError(r.message || ""); return; }
    const t = Date.now();
    setEmail(addr); setRequestId(r.data.request_id); setSentAt(t); setExpiresAt(t + r.data.expires_in * 1000); setCode("");
    save({ email: addr, requestId: r.data.request_id, sentAt: t, expiresAt: t + r.data.expires_in * 1000 });
    setInfo("لو البريد مسجّل عندنا، هيوصلك رمز تحقق من 6 أرقام خلال دقيقة. راجع البريد الوارد ومجلد الرسائل غير المرغوب فيها (Spam).");
    setStep("code");
  };

  const resend = async () => {
    if (busy || resendIn > 0) return;
    setBusy(true); setError("");
    const r = await resendOtp(email, requestId);
    setBusy(false);
    if (!r.ok || !r.data) {
      if (r.restart) return restart(r.message || "");
      if (r.code === "otp_resend_wait" && r.retryAfter) setSentAt(Date.now() + r.retryAfter * 1000 - 60_000);
      setError(r.message || ""); return;
    }
    const t = Date.now();
    setSentAt(t); setExpiresAt(t + r.data.expires_in * 1000); setCode("");
    save({ email, requestId, sentAt: t, expiresAt: t + r.data.expires_in * 1000 });
    setInfo("تم إرسال رمز جديد. الرمز القديم لم يعد صالحًا.");
    codeRef.current?.focus();
  };

  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(code)) { setError("اكتب الرمز المكوّن من 6 أرقام."); return; }
    if (left <= 0) { setError(otpMessage("otp_expired")); return; }
    setBusy(true); setError("");
    const r = await verifyOtp(email, requestId, code);
    setBusy(false);
    if (!r.ok || !r.data) { if (r.restart) return restart(r.message || ""); setError(r.message || ""); setCode(""); codeRef.current?.focus(); return; }
    save(null);
    setResetToken(r.data.reset_token); setInfo(""); setStep("password");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pass.length < 8) { setError(otpMessage("weak_password")); return; }
    if (pass !== pass2) { setError("كلمتا المرور غير متطابقتين."); return; }
    setBusy(true); setError("");
    const r = await resetWithToken(requestId, resetToken, pass);
    setBusy(false);
    if (!r.ok) { if (r.restart) return restart(r.message || ""); setError(r.message || ""); return; }
    setPass(""); setPass2(""); setResetToken(""); setStep("done");
  };

  const btn = "flex w-full items-center justify-center gap-2 rounded-lg bg-nh-teal-dark py-2.5 font-bold text-white hover:bg-nh-teal-darker disabled:opacity-60";
  const stepNo = step === "email" ? 1 : step === "code" ? 2 : 3;
  return (
    <Shell title="استعادة كلمة المرور" footer={<Link to="/login" className="font-bold text-teal-700 dark:text-teal-300">العودة لتسجيل الدخول</Link>}>
      {step !== "done" && (
        <ol className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold" aria-label="خطوات الاستعادة">
          {["البريد", "رمز التحقق", "كلمة مرور جديدة"].map((l, i) => (
            <li key={l} aria-current={stepNo === i + 1 ? "step" : undefined} className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${stepNo === i + 1 ? "bg-nh-teal-dark text-white" : stepNo > i + 1 ? "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
              <span>{i + 1}</span><span className="hidden min-[380px]:inline">{l}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        {info && step === "code" && !error && <Notice kind="info">{info}</Notice>}

        {step === "email" && (
          <form onSubmit={sendEmail} className="space-y-3">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">اكتب البريد الإلكتروني اللي سجّلت بيه، وهنبعتلك رمز تحقق لإعادة تعيين كلمة المرور.</p>
            <label htmlFor="reset-email" className="sr-only">البريد الإلكتروني</label>
            <input id="reset-email" type="email" required autoComplete="email" dir="ltr" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
            <button disabled={busy} className={btn}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}</button>
          </form>
        )}
        {step === "email" && (
          <>
            <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">لو حسابك على Gmail، تقدر تدخل فورًا من غير كلمة مرور:</p>
            <SocialButtons busy={busy} onGoogle={async () => { setBusy(true); const r = await signInWithGoogle(); setBusy(false); if (!r.ok) notify(r.error || "تعذّر الدخول عبر Google", "error"); }} />
          </>
        )}

        {step === "code" && (
          <form onSubmit={checkCode} className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">الرمز مرسل إلى <bdi dir="ltr" className="font-semibold text-slate-800 dark:text-slate-200">{email}</bdi></p>
            <label htmlFor="reset-code" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">رمز التحقق (6 أرقام)</label>
            <input id="reset-code" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} dir="ltr" placeholder="••••••" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inp} text-center font-mono text-2xl tracking-[0.5em]`} />
            <p className={`text-xs ${left > 0 ? "text-slate-500 dark:text-slate-400" : "font-semibold text-rose-700 dark:text-rose-300"}`}>{left > 0 ? <>صالح لمدة <span dir="ltr">{mmss(left)}</span></> : "انتهت صلاحية الرمز. اطلب رمزًا جديدًا."}</p>
            <button disabled={busy || code.length !== 6} className={btn}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "جارٍ التحقق..." : "تأكيد الرمز"}</button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button type="button" onClick={resend} disabled={busy || resendIn > 0} className="font-semibold text-teal-700 disabled:text-slate-400 dark:text-teal-300 dark:disabled:text-slate-500">
                {resendIn > 0 ? <>إعادة الإرسال بعد <span dir="ltr">{Math.ceil(resendIn / 1000)}</span> ث</> : "إعادة إرسال الرمز"}
              </button>
              <button type="button" onClick={() => restart("")} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">تغيير البريد</button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={savePassword} className="space-y-3">
            <Notice kind="success">تم التحقق من بريدك. اختر كلمة مرور جديدة.</Notice>
            <PasswordField id="new-pass" label="كلمة المرور الجديدة" value={pass} onChange={setPass} show={show1} onToggle={() => setShow1((v) => !v)} autoComplete="new-password" />
            <PasswordField id="new-pass2" label="تأكيد كلمة المرور" value={pass2} onChange={setPass2} show={show2} onToggle={() => setShow2((v) => !v)} autoComplete="new-password" />
            <p className={`text-xs ${pass && pass.length < 8 ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>8 أحرف على الأقل.{pass2 && pass !== pass2 ? " — غير متطابقتين" : ""}</p>
            <button disabled={busy} className={btn}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <Notice kind="success">تم تغيير كلمة المرور بنجاح، وتم تسجيل الخروج من الأجهزة الأخرى. هيتم تحويلك لتسجيل الدخول…</Notice>
            <Link to="/login" className={btn}>تسجيل الدخول الآن</Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
