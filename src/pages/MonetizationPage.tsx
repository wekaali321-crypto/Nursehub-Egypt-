import { Breadcrumbs, AdSlot } from "../components/common";

export default function MonetizationPage() {
  const channels = [
    { i: "📢", t: "Google AdSense", d: "أماكن جاهزة ومُهيأة لإعلانات جوجل في كافة صفحات الموقع." },
    { i: "🖼️", t: "إعلانات Banner", d: "مساحات إعلانية مباشرة بأحجام قياسية (728×90, 300×250)." },
    { i: "🔗", t: "Affiliate Links", d: "روابط تسويق بالعمولة مدمجة بذكاء داخل المحتوى." },
    { i: "⭐", t: "Sponsored Posts", d: "مقالات ممولة ورعاية للمحتوى التعليمي." },
    { i: "📄", t: "بيع ملفات PDF", d: "بيع الكتب والملخصات الرقمية مباشرة عبر المتجر." },
    { i: "🎓", t: "بيع الكورسات", d: "كورسات فيديو احترافية بنظام دفع آمن." },
    { i: "💳", t: "الاشتراكات", d: "نظام عضويات بريميوم بدخل شهري متكرر." },
    { i: "🎟️", t: "نظام كوبونات", d: "إنشاء أكواد خصم وحملات ترويجية." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "تحقيق الدخل" }]} />
      <div className="mb-8 rounded-3xl bg-gradient-to-l from-amber-500 via-orange-500 to-emerald-500 p-8 text-white">
        <h1 className="text-3xl font-black">💵 مركز تحقيق الدخل</h1>
        <p className="mt-1 text-amber-50">كل قنوات الربح المدمجة في المنصة في مكان واحد</p>
      </div>

      <h2 className="mb-4 text-2xl font-bold dark:text-white">🚀 قنوات الربح</h2>
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c) => (
          <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="text-3xl">{c.i}</div>
            <h3 className="mt-2 font-bold dark:text-white">{c.t}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.d}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-bold dark:text-white">🖼️ نماذج المساحات الإعلانية</h2>
      <div className="space-y-4">
        <AdSlot label="إعلان أفقي (728×90)" />
        <div className="grid gap-4 md:grid-cols-2">
          <AdSlot label="إعلان مربع (300×250)" height="h-48" />
          <AdSlot label="إعلان مربع (300×250)" height="h-48" />
        </div>
      </div>
    </div>
  );
}
