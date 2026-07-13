import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";

export function NotFound() {
  const { redirects } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  useSEO({ title: "الصفحة غير موجودة (404)" });

  // Honor configured 301/302 redirects
  useEffect(() => {
    const r = redirects.find((x) => x.from === loc.pathname);
    if (r) nav(r.to, { replace: true });
  }, [loc.pathname, redirects, nav]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="text-7xl">🩹</div>
      <h1 className="mt-4 text-6xl font-black text-sky-500">404</h1>
      <h2 className="mt-2 text-2xl font-bold dark:text-white">عذراً، الصفحة غير موجودة</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">ربما تم نقل الصفحة أو حذفها. دعنا نعيدك إلى المسار الصحيح.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-full bg-sky-500 px-6 py-2.5 font-bold text-white">الصفحة الرئيسية</Link>
        <Link to="/search" className="rounded-full border border-slate-200 px-6 py-2.5 font-bold dark:border-slate-700 dark:text-white">البحث في الموقع</Link>
      </div>
    </div>
  );
}

export function ServerError() {
  useSEO({ title: "خطأ في الخادم (500)" });
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="text-7xl">🛠️</div>
      <h1 className="mt-4 text-6xl font-black text-rose-500">500</h1>
      <h2 className="mt-2 text-2xl font-bold dark:text-white">حدث خطأ غير متوقع</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">نعمل على إصلاح المشكلة. يرجى المحاولة لاحقاً.</p>
      <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-sky-500 px-6 py-2.5 font-bold text-white">إعادة المحاولة</button>
    </div>
  );
}
