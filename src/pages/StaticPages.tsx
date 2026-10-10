import { useState } from "react";
import { Breadcrumbs } from "../components/common";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

function Wrap({ titleAr, titleEn, children }: { titleAr: string; titleEn: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  const title = bilingual(titleAr, titleEn, lang).text;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: title }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <h1 className="mb-6 text-3xl font-black dark:text-white">{title}</h1>
      <div className="prose-content text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function About() {
  const { settings } = useStore();
  const { lang } = useI18n();
  const isEn = lang === "en";
  const stats: [string, string][] = isEn
    ? [["12K+", "Learners"], ["150+", "Articles"], ["50+", "Files"]]
    : [["12K+", "متعلم"], ["150+", "مقال"], ["50+", "ملف"]];
  return (
    <Wrap titleAr="من نحن" titleEn="About Us">
      {isEn ? (
        <>
          <p>{settings.siteName} is a leading Arabic platform specialized in nursing education, aiming to empower nursing students and practitioners in Egypt and the Arab world through high-quality educational content.</p>
          <h2>Our Vision</h2>
          <p>To be the primary reference for nursing education in Arabic, and to contribute to raising the standard of healthcare.</p>
          <h2>Our Mission</h2>
          <p>Providing reliable, simplified content covering articles, summaries, drugs, clinical skills, and care plans, alongside smart calculators.</p>
          <h2>Our Values</h2>
          <ul><li>Scientific accuracy</li><li>Ease of access</li><li>Continuous improvement</li><li>Support for the nursing community</li></ul>
        </>
      ) : (
        <>
          <p>{settings.siteName} هي منصة عربية رائدة متخصصة في تعليم التمريض، تهدف إلى تمكين طلاب وممارسي التمريض في مصر والعالم العربي من خلال محتوى تعليمي عالي الجودة.</p>
          <h2>رؤيتنا</h2>
          <p>أن نكون المرجع الأول لتعليم التمريض باللغة العربية، ونساهم في رفع مستوى الرعاية الصحية.</p>
          <h2>رسالتنا</h2>
          <p>تقديم محتوى موثوق ومبسط يشمل المقالات، الملخصات، الأدوية، المهارات السريرية، وخطط الرعاية، إلى جانب أدوات حسابية ذكية.</p>
          <h2>قيمنا</h2>
          <ul><li>الدقة العلمية</li><li>سهولة الوصول</li><li>التطوير المستمر</li><li>دعم المجتمع التمريضي</li></ul>
        </>
      )}
      <div className="mt-6 grid grid-cols-3 gap-4 not-prose">
        {stats.map(([n, l]) => (
          <div key={l} className="rounded-2xl bg-sky-50 p-5 text-center dark:bg-sky-500/10"><div className="text-2xl font-black text-sky-600">{n}</div><div className="text-sm text-slate-500">{l}</div></div>
        ))}
      </div>
    </Wrap>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { settings } = useStore();
  const { lang } = useI18n();
  const isEn = lang === "en";
  const email = settings.contactEmail || "wekaali321@gmail.com";
  const details: [string, string, string][] = [["📧", isEn ? "Email" : "البريد", email]];
  if (settings.contactPhone) details.push(["📞", isEn ? "Phone" : "الهاتف", settings.contactPhone]);
  details.push(["📍", isEn ? "Address" : "العنوان", settings.contactAddress || (isEn ? "Egypt" : "مصر")]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`NurseHub Egypt - ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name} <${form.email}>`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  };
  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800";
  return (
    <Wrap titleAr="اتصل بنا" titleEn="Contact Us">
      <p>{isEn ? "We'd love to hear from you! Fill out the form below, or email us directly, and we'll get back to you as soon as possible." : "نسعد بتواصلك معنا! املأ النموذج التالي أو راسلنا مباشرة على البريد وسنرد عليك في أقرب وقت."}</p>
      <div className="grid gap-6 not-prose md:grid-cols-2">
        <div className="space-y-3">
          {details.map(([i, t, v]) => (
            <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><span className="text-2xl">{i}</span><div><div className="font-bold dark:text-white">{t}</div><div className="text-sm text-slate-500">{v}</div></div></div>
          ))}
        </div>
        {sent ? (
          <div className="flex items-center justify-center rounded-2xl bg-emerald-50 p-8 text-center font-bold text-emerald-600 dark:bg-emerald-500/10">{isEn ? "✅ Your email app opened with the message. Press send there to deliver it." : "✅ تم فتح تطبيق البريد برسالتك، اضغط إرسال هناك لإتمام الإرسال."}</div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isEn ? "Name" : "الاسم"} className={inp} />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={isEn ? "Email" : "البريد الإلكتروني"} className={inp} />
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isEn ? "Your message" : "رسالتك"} rows={4} className={inp} />
            <button className="w-full rounded-full bg-sky-500 py-2.5 font-bold text-white">{isEn ? "Send" : "إرسال"}</button>
          </form>
        )}
      </div>
    </Wrap>
  );
}

export function FAQ() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const faqsAr: [string, string][] = [
    ["هل المحتوى مجاني؟", "نعم، معظم المقالات والملخصات مجانية. بعض الكتب والكورسات المتقدمة متاحة في المتجر بأسعار رمزية."],
    ["كيف أحمّل ملفات PDF؟", "اذهب لقسم الكتب وملفات PDF، اختر الملف ثم اضغط زر التحميل."],
    ["هل يمكنني المساهمة بمحتوى؟", "نعم! تواصل معنا عبر صفحة اتصل بنا لتصبح كاتباً معتمداً."],
    ["هل المحتوى موثوق علمياً؟", "كل المحتوى يراجعه مختصون في مجال التمريض قبل النشر."],
    ["كيف أستخدم الأدوات الحسابية؟", "اذهب لصفحة الأدوات، اختر الحاسبة المناسبة وأدخل القيم المطلوبة."],
    ["هل يوجد تطبيق للموبايل؟", "الموقع متجاوب بالكامل ويعمل بسلاسة على جميع الأجهزة، وقريباً تطبيق مخصص."],
  ];
  const faqsEn: [string, string][] = [
    ["Is the content free?", "Yes, most articles and summaries are free. Some advanced books and courses are available in the store at nominal prices."],
    ["How do I download PDF files?", "Go to the Books & PDFs section, choose the file, then click the download button."],
    ["Can I contribute content?", "Yes! Contact us via the Contact Us page to become a verified writer."],
    ["Is the content scientifically reliable?", "All content is reviewed by nursing specialists before publishing."],
    ["How do I use the calculators?", "Go to the Tools page, choose the appropriate calculator, and enter the required values."],
    ["Is there a mobile app?", "The site is fully responsive and works smoothly on all devices, with a dedicated app coming soon."],
  ];
  const faqs = isEn ? faqsEn : faqsAr;
  const [open, setOpen] = useState<number | null>(0);
  useSEO({
    title: "الأسئلة الشائعة | NurseHub Egypt",
    description: "إجابات لأكثر الأسئلة شيوعاً حول منصة NurseHub Egypt للتمريض.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqsAr.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  });
  return (
    <Wrap titleAr="الأسئلة الشائعة" titleEn="FAQ">
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
  const { lang } = useI18n();
  const isEn = lang === "en";
  return (
    <Wrap titleAr="سياسة الخصوصية" titleEn="Privacy Policy">
      {isEn ? (
        <>
          <p>At NurseHub Egypt, we are committed to protecting our users' privacy. This policy explains how we collect and use your data.</p>
          <h2>Information We Collect</h2>
          <p>We may collect your email when you subscribe to the newsletter, and browsing information to improve your experience.</p>
          <h2>Use of Information</h2>
          <ul><li>Improving content and services</li><li>Sending updates and offers</li><li>Analyzing site performance</li></ul>
          <h2>Cookies</h2>
          <p>We use cookies to improve the browsing experience and display relevant ads.</p>
          <h2>Advertising (Google AdSense)</h2>
          <p>We use Google AdSense to display ads. Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</p>
          <p>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. You can also opt out of third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. To learn how Google uses data, see <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data from sites that use its services</a>.</p>
          <h2>Third-Party Services</h2>
          <p>We use Supabase to store site data and Vercel for hosting. These providers process technical data (such as IP address) as needed to operate the service.</p>
          <h2>Your Rights</h2>
          <p>You may request access to or deletion of your personal data at any time through the Contact Us page.</p>
          <h2>Data Security</h2>
          <p>We apply advanced security measures to protect your data from unauthorized access.</p>
        </>
      ) : (
        <>
          <p>نحن في NurseHub Egypt نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام بياناتك.</p>
          <h2>المعلومات التي نجمعها</h2>
          <p>قد نجمع بريدك الإلكتروني عند الاشتراك في النشرة، ومعلومات التصفح لتحسين تجربتك.</p>
          <h2>استخدام المعلومات</h2>
          <ul><li>تحسين المحتوى والخدمات</li><li>إرسال التحديثات والعروض</li><li>تحليل أداء الموقع</li></ul>
          <h2>ملفات تعريف الارتباط (Cookies)</h2>
          <p>نستخدم الكوكيز لتحسين تجربة التصفح وعرض إعلانات مناسبة.</p>
          <h2>الإعلانات (Google AdSense)</h2>
          <p>نستخدم خدمة Google AdSense لعرض الإعلانات. تستخدم أطراف ثالثة، ومنها Google، ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لموقعنا ولمواقع أخرى. ويتيح استخدام Google لكوكيز الإعلانات لها ولشركائها عرض إعلانات لك بناءً على زيارتك لموقعنا و/أو مواقع أخرى على الإنترنت.</p>
          <p>يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">إعدادات إعلانات Google</a>، كما يمكنك إلغاء استخدام الأطراف الثالثة للكوكيز في الإعلانات المخصصة عبر <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. ولمعرفة كيف تستخدم Google البيانات راجع <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">كيف تستخدم Google البيانات من المواقع التي تستخدم خدماتها</a>.</p>
          <h2>خدمات الأطراف الثالثة</h2>
          <p>نستخدم Supabase لتخزين بيانات الموقع وVercel للاستضافة، وتعالج هذه الخدمات بيانات تقنية (مثل عنوان IP) بالقدر اللازم لتشغيل الخدمة.</p>
          <h2>حقوقك</h2>
          <p>يمكنك في أي وقت طلب الاطلاع على بياناتك الشخصية أو حذفها عبر صفحة اتصل بنا.</p>
          <h2>أمان البيانات</h2>
          <p>نطبق إجراءات أمنية متقدمة لحماية بياناتك من الوصول غير المصرح به.</p>
        </>
      )}
    </Wrap>
  );
}

export function Terms() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  return (
    <Wrap titleAr="شروط الاستخدام" titleEn="Terms of Use">
      {isEn ? (
        <>
          <p>By using the NurseHub Egypt platform, you agree to the following terms.</p>
          <h2>Use of Content</h2>
          <p>The content is for educational purposes only and does not replace consulting specialists. Republishing content without permission is prohibited.</p>
          <h2>Liability</h2>
          <p>The medical information is for guidance only, and the platform is not responsible for any misuse of the information.</p>
          <h2>Intellectual Property Rights</h2>
          <p>All content is protected by the platform's intellectual property rights.</p>
          <h2>Amendments</h2>
          <p>We reserve the right to amend these terms at any time with notice to users.</p>
        </>
      ) : (
        <>
          <p>باستخدامك لمنصة NurseHub Egypt فإنك توافق على الشروط التالية.</p>
          <h2>استخدام المحتوى</h2>
          <p>المحتوى لأغراض تعليمية فقط ولا يغني عن استشارة المختصين. يُمنع إعادة نشر المحتوى دون إذن.</p>
          <h2>المسؤولية</h2>
          <p>المعلومات الطبية إرشادية، والمنصة غير مسؤولة عن أي استخدام خاطئ للمعلومات.</p>
          <h2>حقوق الملكية الفكرية</h2>
          <p>جميع المحتويات محمية بحقوق الملكية الفكرية الخاصة بالمنصة.</p>
          <h2>التعديلات</h2>
          <p>نحتفظ بحق تعديل هذه الشروط في أي وقت مع إشعار المستخدمين.</p>
        </>
      )}
    </Wrap>
  );
}
