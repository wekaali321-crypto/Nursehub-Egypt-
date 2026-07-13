import { useState } from "react";
import { Breadcrumbs } from "../components/common";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="mb-6 text-3xl font-black dark:text-white">{title}</h1>
      <div className="prose-content text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function About() {
  const { settings } = useStore();
  return (
    <Wrap title="من نحن">
      <p>{settings.siteName} هي منصة عربية رائدة متخصصة في تعليم التمريض، تهدف إلى تمكين طلاب وممارسي التمريض في مصر والعالم العربي من خلال محتوى تعليمي عالي الجودة.</p>
      <h2>رؤيتنا</h2>
      <p>أن نكون المرجع الأول لتعليم التمريض باللغة العربية، ونساهم في رفع مستوى الرعاية الصحية.</p>
      <h2>رسالتنا</h2>
      <p>تقديم محتوى موثوق ومبسط يشمل المقالات، الملخصات، الأدوية، المهارات السريرية، وخطط الرعاية، إلى جانب أدوات حسابية ذكية.</p>
      <h2>قيمنا</h2>
      <ul><li>الدقة العلمية</li><li>سهولة الوصول</li><li>التطوير المستمر</li><li>دعم المجتمع التمريضي</li></ul>
      <div className="mt-6 grid grid-cols-3 gap-4 not-prose">
        {[["12K+","متعلم"],["150+","مقال"],["50+","ملف"]].map(([n,l])=>(
          <div key={l} className="rounded-2xl bg-sky-50 p-5 text-center dark:bg-sky-500/10"><div className="text-2xl font-black text-sky-600">{n}</div><div className="text-sm text-slate-500">{l}</div></div>
        ))}
      </div>
    </Wrap>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <Wrap title="اتصل بنا">
      <p>نسعد بتواصلك معنا! املأ النموذج التالي وسنرد عليك في أقرب وقت.</p>
      <div className="grid gap-6 not-prose md:grid-cols-2">
        <div className="space-y-3">
          {[["📧","البريد","info@nursehub.eg"],["📞","الهاتف","+20 100 000 0000"],["📍","العنوان","القاهرة، مصر"],["🕐","الدوام","يومياً 9ص - 9م"]].map(([i,t,v])=>(
            <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><span className="text-2xl">{i}</span><div><div className="font-bold dark:text-white">{t}</div><div className="text-sm text-slate-500">{v}</div></div></div>
          ))}
        </div>
        {sent ? (
          <div className="flex items-center justify-center rounded-2xl bg-emerald-50 p-8 text-center font-bold text-emerald-600 dark:bg-emerald-500/10">✅ تم إرسال رسالتك بنجاح!</div>
        ) : (
          <form onSubmit={(e)=>{e.preventDefault();setSent(true);}} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <input required placeholder="الاسم" className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
            <input required type="email" placeholder="البريد الإلكتروني" className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
            <textarea required placeholder="رسالتك" rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
            <button className="w-full rounded-full bg-sky-500 py-2.5 font-bold text-white">إرسال</button>
          </form>
        )}
      </div>
    </Wrap>
  );
}

export function FAQ() {
  const faqs = [
    ["هل المحتوى مجاني؟", "نعم، معظم المقالات والملخصات مجانية. بعض الكتب والكورسات المتقدمة متاحة في المتجر بأسعار رمزية."],
    ["كيف أحمّل ملفات PDF؟", "اذهب لقسم الكتب وملفات PDF، اختر الملف ثم اضغط زر التحميل."],
    ["هل يمكنني المساهمة بمحتوى؟", "نعم! تواصل معنا عبر صفحة اتصل بنا لتصبح كاتباً معتمداً."],
    ["هل المحتوى موثوق علمياً؟", "كل المحتوى يراجعه مختصون في مجال التمريض قبل النشر."],
    ["كيف أستخدم الأدوات الحسابية؟", "اذهب لصفحة الأدوات، اختر الحاسبة المناسبة وأدخل القيم المطلوبة."],
    ["هل يوجد تطبيق للموبايل؟", "الموقع متجاوب بالكامل ويعمل بسلاسة على جميع الأجهزة، وقريباً تطبيق مخصص."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  useSEO({
    title: "الأسئلة الشائعة | NurseHub Egypt",
    description: "إجابات لأكثر الأسئلة شيوعاً حول منصة NurseHub Egypt للتمريض.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  });
  return (
    <Wrap title="الأسئلة الشائعة">
      <div className="space-y-3 not-prose">
        {faqs.map(([q, a], i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between p-4 text-right font-bold dark:text-white">
              <span>{q}</span><span>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <div className="border-t border-slate-200 p-4 text-slate-600 dark:border-slate-800 dark:text-slate-300">{a}</div>}
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function Privacy() {
  return (
    <Wrap title="سياسة الخصوصية">
      <p>نحن في NurseHub Egypt نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام بياناتك.</p>
      <h2>المعلومات التي نجمعها</h2>
      <p>قد نجمع بريدك الإلكتروني عند الاشتراك في النشرة، ومعلومات التصفح لتحسين تجربتك.</p>
      <h2>استخدام المعلومات</h2>
      <ul><li>تحسين المحتوى والخدمات</li><li>إرسال التحديثات والعروض</li><li>تحليل أداء الموقع</li></ul>
      <h2>ملفات تعريف الارتباط (Cookies)</h2>
      <p>نستخدم الكوكيز لتحسين تجربة التصفح وعرض إعلانات مناسبة.</p>
      <h2>أمان البيانات</h2>
      <p>نطبق إجراءات أمنية متقدمة لحماية بياناتك من الوصول غير المصرح به.</p>
    </Wrap>
  );
}

export function Terms() {
  return (
    <Wrap title="شروط الاستخدام">
      <p>باستخدامك لمنصة NurseHub Egypt فإنك توافق على الشروط التالية.</p>
      <h2>استخدام المحتوى</h2>
      <p>المحتوى لأغراض تعليمية فقط ولا يغني عن استشارة المختصين. يُمنع إعادة نشر المحتوى دون إذن.</p>
      <h2>المسؤولية</h2>
      <p>المعلومات الطبية إرشادية، والمنصة غير مسؤولة عن أي استخدام خاطئ للمعلومات.</p>
      <h2>حقوق الملكية الفكرية</h2>
      <p>جميع المحتويات محمية بحقوق الملكية الفكرية الخاصة بالمنصة.</p>
      <h2>التعديلات</h2>
      <p>نحتفظ بحق تعديل هذه الشروط في أي وقت مع إشعار المستخدمين.</p>
    </Wrap>
  );
}
