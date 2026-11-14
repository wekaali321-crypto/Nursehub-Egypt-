import { useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/common";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

function Wrap({ titleAr, titleEn, descAr, descEn, children }: { titleAr: string; titleEn: string; descAr?: string; descEn?: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  const title = bilingual(titleAr, titleEn, lang).text;
  useSEO({ title: `${title} | NurseHub Egypt`, description: descAr ? bilingual(descAr, descEn ?? descAr, lang).text : undefined });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: title }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="nh-hero mb-6 rounded-3xl px-6 py-6 text-white"><h1 className="text-3xl font-black">{title}</h1></div>
      <div className="prose-content text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function About() {
  const { settings } = useStore();
  const { lang } = useI18n();
  const isEn = lang === "en";
  return (
    <Wrap
      titleAr="من نحن" titleEn="About Us"
      descAr="تعرّف على منصة NurseHub Egypt: محتوى تعليمي عربي لطلاب وممارسي التمريض يشمل أدلة الأمراض والأدوية والحالات السريرية والتخصصات."
      descEn="About NurseHub Egypt: Arabic educational content for nursing students and practitioners, including condition guides, drugs, clinical cases and specialties."
    >
      {isEn ? (
        <>
          <p>{settings.siteName} is an Arabic educational platform for nursing students and practitioners. It explains nursing topics in simple Arabic, keeps the key English medical terms next to them, and organizes everything by clinical area so it is easy to find and study.</p>
          <h2>What you will find here</h2>
          <ul>
            <li>Nursing guides for diseases and conditions: what it is, signs, investigations, treatment, nursing role and patient teaching</li>
            <li>A drug guide with doses, indications, side effects and nursing considerations</li>
            <li>Interactive clinical cases and practice quizzes</li>
            <li>Specialty sections: ICU, emergency and reception, pediatrics and NICU, obstetrics and gynecology, operating room, dialysis, radiology, first aid, anatomy, pharmacology and medical terminology</li>
            <li>Laboratory reference, medical calculators, courses and downloadable study files in the store</li>
          </ul>
          <h2>Our approach</h2>
          <p>We write in plain language and try to keep every page clear, structured and easy to read on a phone. We review and improve content continuously, and we welcome corrections from readers.</p>
          <h2>Our mission</h2>
          <p>To make nursing education in Arabic easier to access and to support nursing students and practitioners in Egypt and the Arab world in their studies and daily work.</p>
          <h2>Important note</h2>
          <p>The content is for education only. It is not medical advice and does not replace your hospital's protocols, clinical judgment, or the instructions of the treating physician. Always verify drug doses and procedures against your institution's approved guidelines.</p>
          <h2>Who runs the platform</h2>
          <p>The platform is run by RN. Ali Ashour. For questions, suggestions or corrections please use the <Link to="/contact">Contact Us</Link> page.</p>
        </>
      ) : (
        <>
          <p>{settings.siteName} منصة تعليمية عربية لطلاب وممارسي التمريض. نشرح موضوعات التمريض بعربية مبسّطة مع إبقاء المصطلحات الطبية الإنجليزية الأساسية بجانبها، ونرتّب كل شيء حسب المجال الإكلينيكي ليسهل الوصول إليه ومذاكرته.</p>
          <h2>ماذا ستجد هنا</h2>
          <ul>
            <li>أدلة تمريضية للأمراض والحالات: ما هو المرض، وعلاماته، وفحوصاته، وعلاجه، ودور التمريض، وتثقيف المريض</li>
            <li>دليل أدوية بالجرعات ودواعي الاستعمال والأعراض الجانبية والاعتبارات التمريضية</li>
            <li>حالات سريرية تفاعلية واختبارات تدريبية</li>
            <li>أقسام تخصصية: العناية المركزة، الاستقبال والطوارئ، الأطفال والحضانة، النساء والتوليد، العمليات، الغسيل الكلوي، الأشعة، الإسعافات الأولية، التشريح، الفارماكولوجي، والمصطلحات الطبية</li>
            <li>مرجع للتحاليل، وحاسبات طبية، وكورسات، وملفات مذاكرة قابلة للتحميل في المتجر</li>
          </ul>
          <h2>أسلوبنا</h2>
          <p>نكتب بلغة بسيطة ونحاول أن تكون كل صفحة واضحة ومنظمة وسهلة القراءة على الموبايل. نراجع المحتوى ونطوّره باستمرار، ونرحّب بتصحيحات القرّاء.</p>
          <h2>رسالتنا</h2>
          <p>تيسير الوصول إلى تعليم التمريض باللغة العربية، ودعم طلاب وممارسي التمريض في مصر والعالم العربي في دراستهم وعملهم اليومي.</p>
          <h2>تنبيه مهم</h2>
          <p>المحتوى لأغراض تعليمية فقط، وليس نصيحة طبية، ولا يغني عن بروتوكولات المستشفى والحكم الإكلينيكي وتعليمات الطبيب المعالج. تأكّد دائمًا من جرعات الأدوية والإجراءات وفق الإرشادات المعتمدة في مؤسستك.</p>
          <h2>من يدير المنصة</h2>
          <p>تُدار المنصة بواسطة RN. Ali Ashour. للأسئلة أو الاقتراحات أو التصحيحات يرجى استخدام صفحة <Link to="/contact">اتصل بنا</Link>.</p>
        </>
      )}
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
    <Wrap titleAr="اتصل بنا" titleEn="Contact Us" descAr="تواصل مع فريق NurseHub Egypt لأي سؤال أو اقتراح أو تصحيح." descEn="Contact the NurseHub Egypt team with any question, suggestion or correction.">
      <p>{isEn ? "We'd love to hear from you! Fill out the form below, or email us directly, and we'll get back to you as soon as possible." : "نسعد بتواصلك معنا! املأ النموذج التالي أو راسلنا مباشرة على البريد وسنرد عليك في أقرب وقت."}</p>
      <div className="grid gap-6 not-prose md:grid-cols-2">
        <div className="space-y-3">
          {details.map(([i, t, v]) => (
            <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><span className="text-2xl">{i}</span><div><div className="font-bold dark:text-white">{t}</div><div className="text-sm text-slate-600 dark:text-slate-400">{v}</div></div></div>
          ))}
        </div>
        {sent ? (
          <div className="flex items-center justify-center rounded-2xl bg-emerald-50 p-8 text-center font-bold text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/10">{isEn ? "✅ Your email app opened with the message. Press send there to deliver it." : "✅ تم فتح تطبيق البريد برسالتك، اضغط إرسال هناك لإتمام الإرسال."}</div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isEn ? "Name" : "الاسم"} className={inp} />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={isEn ? "Email" : "البريد الإلكتروني"} className={inp} />
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isEn ? "Your message" : "رسالتك"} rows={4} className={inp} />
            <button className="w-full rounded-full bg-teal-500 py-2.5 font-bold text-white">{isEn ? "Send" : "إرسال"}</button>
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
  const { settings } = useStore();
  const isEn = lang === "en";
  const email = settings.contactEmail || "wekaali321@gmail.com";
  return (
    <Wrap
      titleAr="سياسة الخصوصية" titleEn="Privacy Policy"
      descAr="كيف يجمع موقع NurseHub Egypt بياناتك ويستخدمها ويحميها، بما في ذلك الحسابات والإشعارات والإعلانات وملفات تعريف الارتباط."
      descEn="How NurseHub Egypt collects, uses and protects your data, including accounts, notifications, advertising and cookies."
    >
      {isEn ? (
        <>
          <p><strong>Last updated: November 13, 2026.</strong></p>
          <p>At NurseHub Egypt we respect your privacy. This policy explains what data the website and the installed app collect, why, which services process it, and what choices you have.</p>
          <h2>Who we are and how to contact us</h2>
          <p>NurseHub Egypt is an Arabic nursing education website. For any privacy question or request, write to <a href={`mailto:${email}`}>{email}</a> or use the <Link to="/contact">Contact Us</Link> page.</p>
          <h2>Information we collect</h2>
          <ul>
            <li><strong>Account:</strong> if you create an account we store your email, name and the sign-in method. With email sign-up your password is stored only as a one-way hash. With Google sign-in we receive your Google account name and email address; we never see your Google password. For signed-in users we also save bookmarks and reading history.</li>
            <li><strong>Store orders:</strong> name, email, phone number (optional), payment method, payment reference and order amount. We do not collect or store payment card numbers.</li>
            <li><strong>Comments:</strong> the name and text you submit; comments are shown only after moderation.</li>
            <li><strong>Anonymous usage statistics:</strong> a random visitor identifier kept in your browser, the pages visited, device type (mobile, tablet or desktop), the type of referring source, and whether the installed app was used. This is not linked to your name or email, and we do not store your IP address in these statistics.</li>
            <li><strong>Notifications:</strong> if you enable them, we store your browser's push-subscription address and keys so we can send notifications. You can turn them off at any time in your browser or device settings.</li>
            <li><strong>Technical data:</strong> like any website, our hosting and security provider processes technical data such as IP address and browser type to deliver the site, prevent abuse and limit excessive requests. We also keep short security logs that include an IP address, such as failed administrator sign-in attempts and order-lookup requests, to prevent abuse.</li>
            <li><strong>Messages:</strong> the contact form opens your own email app, so we receive only what you choose to send.</li>
          </ul>
          <h2>How we use information</h2>
          <ul><li>To provide the site, accounts, store orders and notifications</li><li>To understand which content is useful and improve it</li><li>To secure the service and prevent abuse</li><li>To show advertising (see below)</li></ul>
          <h2>Browser storage and cookies</h2>
          <p>We use your browser's local storage, IndexedDB and cache to remember preferences (language, theme, display options), favorites, cart, study progress, cached content and the anonymous visitor identifier, and to let the app work with a weak connection. We use a session cookie only for administrator login. Advertising cookies are set by Google and its partners (see below). You can clear or block storage and cookies in your browser settings; some features may then stop working.</p>
          <h2>Advertising (Google AdSense)</h2>
          <p>We use Google AdSense to display ads. Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</p>
          <p>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. You can also opt out of third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. To learn how Google uses data, see <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data from sites that use its services</a>.</p>
          <h2>Services that process data for us</h2>
          <ul>
            <li><strong>Cloudflare:</strong> hosting, content delivery, security and bot protection, and the database and file storage that hold the site's content and accounts.</li>
            <li><strong>Google:</strong> AdSense advertising, optional Google sign-in, and Google Fonts. Fonts are loaded from Google servers, which receive your IP address when the page loads.</li>
            <li><strong>WhatsApp and Telegram:</strong> links to our community channels; they are used only if you click them and are governed by their own policies.</li>
          </ul>
          <h2>Your choices and rights</h2>
          <p>You may ask us to access, correct or delete your personal data, or to delete your account, at any time by contacting us at the email above. You can also sign out, clear your browser storage, disable notifications, and opt out of personalized ads as described above.</p>
          <h2>Data security</h2>
          <p>We take reasonable technical and organizational measures to protect your data, but no online service can guarantee absolute security.</p>
          <h2>Changes to this policy</h2>
          <p>We may update this policy when our services change. The date at the top shows when it was last updated.</p>
        </>
      ) : (
        <>
          <p><strong>آخر تحديث: 13 نوفمبر 2026.</strong></p>
          <p>نحن في NurseHub Egypt نحترم خصوصيتك. توضح هذه السياسة ما البيانات التي يجمعها الموقع والتطبيق المثبّت، ولماذا، وما الخدمات التي تعالجها، وما الخيارات المتاحة لك.</p>
          <h2>من نحن وكيف تتواصل معنا</h2>
          <p>NurseHub Egypt موقع عربي لتعليم التمريض. لأي سؤال أو طلب يخص الخصوصية راسلنا على <a href={`mailto:${email}`}>{email}</a> أو استخدم صفحة <Link to="/contact">اتصل بنا</Link>.</p>
          <h2>المعلومات التي نجمعها</h2>
          <ul>
            <li><strong>الحساب:</strong> عند إنشاء حساب نحفظ بريدك الإلكتروني واسمك وطريقة تسجيل الدخول. عند التسجيل بالبريد تُحفظ كلمة المرور في صورة مشفّرة أحادية الاتجاه فقط. وعند الدخول بجوجل نستلم اسم حسابك وبريدك على جوجل ولا نرى كلمة مرور جوجل أبدًا. وللمستخدمين المسجّلين نحفظ أيضًا المفضّلة وسجل القراءة.</li>
            <li><strong>طلبات المتجر:</strong> الاسم والبريد ورقم الهاتف (اختياري) وطريقة الدفع ومرجع الدفع ومبلغ الطلب. لا نجمع ولا نخزّن أرقام بطاقات الدفع.</li>
            <li><strong>التعليقات:</strong> الاسم ونص التعليق الذي ترسله، ولا يظهر التعليق إلا بعد المراجعة.</li>
            <li><strong>إحصاءات استخدام مجهولة:</strong> معرّف عشوائي للزائر محفوظ في متصفحك، والصفحات التي زرتها، ونوع الجهاز (موبايل أو تابلت أو كمبيوتر)، ونوع مصدر الزيارة، وهل استُخدم التطبيق المثبّت. هذه البيانات غير مرتبطة باسمك أو بريدك، ولا نحفظ عنوان IP الخاص بك ضمن هذه الإحصاءات.</li>
            <li><strong>الإشعارات:</strong> إذا فعّلتها نحفظ عنوان اشتراك متصفحك في الإشعارات ومفاتيحه لنتمكن من إرسالها. يمكنك إيقافها في أي وقت من إعدادات المتصفح أو الجهاز.</li>
            <li><strong>البيانات التقنية:</strong> كأي موقع، يعالج مزوّد الاستضافة والحماية لدينا بيانات تقنية مثل عنوان IP ونوع المتصفح لتقديم الموقع ومنع إساءة الاستخدام والحد من الطلبات الزائدة. كما نحتفظ بسجلات أمنية قصيرة تتضمن عنوان IP، مثل محاولات دخول المشرف الفاشلة وطلبات الاستعلام عن الطلبات، لمنع إساءة الاستخدام.</li>
            <li><strong>الرسائل:</strong> نموذج الاتصال يفتح تطبيق البريد لديك، فلا نستلم إلا ما تختار إرساله.</li>
          </ul>
          <h2>كيف نستخدم المعلومات</h2>
          <ul><li>لتشغيل الموقع والحسابات وطلبات المتجر والإشعارات</li><li>لمعرفة المحتوى المفيد وتحسينه</li><li>لتأمين الخدمة ومنع إساءة الاستخدام</li><li>لعرض الإعلانات (انظر أدناه)</li></ul>
          <h2>تخزين المتصفح وملفات تعريف الارتباط</h2>
          <p>نستخدم التخزين المحلي وIndexedDB وذاكرة التخزين المؤقت في متصفحك لتذكّر التفضيلات (اللغة والمظهر وخيارات العرض) والمفضّلة وسلة المشتريات وتقدّم المذاكرة والمحتوى المخزّن مؤقتًا والمعرّف المجهول للزائر، ولتمكين التطبيق من العمل مع الاتصال الضعيف. ونستخدم كوكي جلسة لتسجيل دخول المشرف فقط. أما كوكيز الإعلانات فتضعها Google وشركاؤها (انظر أدناه). يمكنك مسح أو حظر التخزين والكوكيز من إعدادات المتصفح، وقد تتوقف بعض المزايا عن العمل عندها.</p>
          <h2>الإعلانات (Google AdSense)</h2>
          <p>نستخدم خدمة Google AdSense لعرض الإعلانات. تستخدم أطراف ثالثة، ومنها Google، ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لموقعنا ولمواقع أخرى. ويتيح استخدام Google لكوكيز الإعلانات لها ولشركائها عرض إعلانات لك بناءً على زيارتك لموقعنا و/أو مواقع أخرى على الإنترنت.</p>
          <p>يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">إعدادات إعلانات Google</a>، كما يمكنك إلغاء استخدام الأطراف الثالثة للكوكيز في الإعلانات المخصصة عبر <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. ولمعرفة كيف تستخدم Google البيانات راجع <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">كيف تستخدم Google البيانات من المواقع التي تستخدم خدماتها</a>.</p>
          <h2>الخدمات التي تعالج البيانات لصالحنا</h2>
          <ul>
            <li><strong>Cloudflare:</strong> الاستضافة وتسريع توصيل المحتوى والأمان وحماية الموقع من البوتات، وقاعدة البيانات وتخزين الملفات التي تحفظ محتوى الموقع والحسابات.</li>
            <li><strong>Google:</strong> إعلانات AdSense، وتسجيل الدخول الاختياري بجوجل، وخطوط Google Fonts. تُحمَّل الخطوط من خوادم Google، وتستلم عنوان IP الخاص بك عند تحميل الصفحة.</li>
            <li><strong>WhatsApp وTelegram:</strong> روابط لقنوات المجتمع لدينا، ولا تُستخدم إلا إذا ضغطت عليها، وتخضع لسياساتها الخاصة.</li>
          </ul>
          <h2>خياراتك وحقوقك</h2>
          <p>يمكنك في أي وقت أن تطلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، أو حذف حسابك، بالتواصل معنا على البريد أعلاه. ويمكنك أيضًا تسجيل الخروج ومسح تخزين المتصفح وإيقاف الإشعارات وإلغاء الإعلانات المخصصة كما هو موضح أعلاه.</p>
          <h2>أمان البيانات</h2>
          <p>نطبّق إجراءات تقنية وتنظيمية معقولة لحماية بياناتك، لكن لا توجد خدمة على الإنترنت تضمن الأمان المطلق.</p>
          <h2>التغييرات على هذه السياسة</h2>
          <p>قد نحدّث هذه السياسة عند تغيّر خدماتنا. يوضح التاريخ في أعلاها آخر مرة تم فيها التحديث.</p>
        </>
      )}
    </Wrap>
  );
}

export function Terms() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  return (
    <Wrap titleAr="شروط الاستخدام" titleEn="Terms of Use" descAr="شروط استخدام منصة NurseHub Egypt التعليمية." descEn="Terms of use for the NurseHub Egypt educational platform.">
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
