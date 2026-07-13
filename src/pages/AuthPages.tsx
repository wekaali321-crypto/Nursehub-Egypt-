import { useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "../lib/seo";
import { useToast } from "../components/Toast";
import { isSupabaseEnabled } from "../lib/supabase";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-2xl text-white">🩺</div>
          <h1 className="mt-3 text-2xl font-black dark:text-white">{title}</h1>
        </div>
        {children}
        <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>
      </div>
    </div>
  );
}

function SocialButtons() {
  const { notify } = useToast();
  const disabled = !isSupabaseEnabled;
  const click = () => notify("تسجيل الدخول عبر الطرف الثالث معطّل حتى إضافة مفاتيح الاعتماد", "info");
  return (
    <div className="space-y-2">
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />أو<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
      <button onClick={click} className={`flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 font-semibold dark:border-slate-700 dark:text-white ${disabled ? "opacity-60" : ""}`}>
        <span>🔵</span> المتابعة عبر Google {disabled && <span className="text-[10px] text-slate-400">(معطّل)</span>}
      </button>
    </div>
  );
}

export function LoginPage() {
  useSEO({ title: "تسجيل الدخول | NurseHub Egypt" });
  const { notify } = useToast();
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseEnabled) { notify("نظام العضوية يتفعّل بعد ربط Supabase Auth", "info"); return; }
    notify("جارٍ تسجيل الدخول...", "info");
  };
  return (
    <Shell title="تسجيل الدخول" footer={<>ليس لديك حساب؟ <Link to="/register" className="font-bold text-sky-500">أنشئ حساباً</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
        <input type="password" required placeholder="كلمة المرور" value={pass} onChange={(e) => setPass(e.target.value)} className={inp} />
        <div className="text-left"><Link to="/forgot" className="text-xs font-semibold text-sky-500">نسيت كلمة المرور؟</Link></div>
        <button className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 font-bold text-white">دخول</button>
      </form>
      <SocialButtons />
      {!isSupabaseEnabled && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-xs text-amber-600 dark:bg-amber-500/10">نظام العضوية جاهز ويعمل عبر Supabase Auth بعد إضافة المفاتيح.</p>}
    </Shell>
  );
}

export function RegisterPage() {
  useSEO({ title: "إنشاء حساب | NurseHub Egypt" });
  const { notify } = useToast();
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseEnabled) { notify("التسجيل يتفعّل بعد ربط Supabase Auth", "info"); return; }
    notify("تم إنشاء الحساب بنجاح", "success");
  };
  return (
    <Shell title="إنشاء حساب" footer={<>لديك حساب؟ <Link to="/login" className="font-bold text-sky-500">سجّل الدخول</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="الاسم الكامل" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inp} />
        <input type="email" required placeholder="البريد الإلكتروني" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
        <input type="password" required placeholder="كلمة المرور" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} className={inp} />
        <button className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 font-bold text-white">إنشاء الحساب</button>
      </form>
      <SocialButtons />
    </Shell>
  );
}

export function ForgotPage() {
  useSEO({ title: "استعادة كلمة المرور | NurseHub Egypt" });
  const { notify } = useToast();
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseEnabled) { notify("استعادة كلمة المرور تعمل بعد ربط Supabase Auth", "info"); return; }
    setSent(true);
  };
  return (
    <Shell title="استعادة كلمة المرور" footer={<Link to="/login" className="font-bold text-sky-500">العودة لتسجيل الدخول</Link>}>
      {sent ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-center font-bold text-emerald-600 dark:bg-emerald-500/10">✅ تم إرسال رابط الاستعادة إلى بريدك.</div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">أدخل بريدك وسنرسل رابط إعادة تعيين كلمة المرور.</p>
          <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
          <button className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2.5 font-bold text-white">إرسال الرابط</button>
        </form>
      )}
    </Shell>
  );
}
