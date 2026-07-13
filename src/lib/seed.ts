import type { Article, Comment, MediaItem, Product, User } from "./types";

const html = (body: string) => body;

export const seedArticles: Article[] = [
  {
    id: "a1",
    title: "أساسيات العناية بالجروح للممرضين",
    slug: "wound-care-basics",
    category: "skills",
    excerpt:
      "دليل شامل لمبادئ العناية بالجروح، أنواع الضمادات، وخطوات التعقيم الصحيحة لتسريع الشفاء ومنع العدوى.",
    content: html(`
      <h2>مقدمة عن العناية بالجروح</h2>
      <p>تعد العناية بالجروح من أهم المهارات التمريضية الأساسية التي يجب على كل ممرض إتقانها. تهدف العناية الجيدة إلى تسريع عملية الشفاء ومنع حدوث العدوى.</p>
      <h3>أنواع الجروح</h3>
      <ul>
        <li>الجروح الحادة (Acute Wounds)</li>
        <li>الجروح المزمنة (Chronic Wounds)</li>
        <li>قرح الفراش (Pressure Ulcers)</li>
      </ul>
      <h3>خطوات تنظيف الجرح</h3>
      <ol>
        <li>غسل اليدين وارتداء القفازات المعقمة.</li>
        <li>إزالة الضمادة القديمة بعناية.</li>
        <li>تنظيف الجرح بمحلول ملحي معقم.</li>
        <li>تطبيق الضمادة المناسبة.</li>
      </ol>
      <blockquote>تذكر دائماً: التعقيم الجيد هو خط الدفاع الأول ضد العدوى.</blockquote>
      <table>
        <thead><tr><th>نوع الضمادة</th><th>الاستخدام</th></tr></thead>
        <tbody>
          <tr><td>Hydrocolloid</td><td>الجروح المتوسطة الإفراز</td></tr>
          <tr><td>Foam</td><td>الجروح كثيرة الإفراز</td></tr>
          <tr><td>Gauze</td><td>الجروح السطحية</td></tr>
        </tbody>
      </table>
    `),
    cover:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    tags: ["مهارات", "جروح", "تعقيم"],
    author: "د. منى السيد",
    status: "published",
    publishDate: "2026-01-10",
    views: 1240,
    featured: true,
  },
  {
    id: "a2",
    title: "ملخص دوائي: مضادات التخثر (Anticoagulants)",
    slug: "anticoagulants-summary",
    category: "drugs",
    excerpt:
      "ملخص مبسط لمضادات التخثر، آلية عملها، الجرعات الشائعة، والاحتياطات التمريضية المهمة.",
    content: html(`
      <h2>مضادات التخثر</h2>
      <p>هي أدوية تمنع تكوّن الجلطات الدموية وتستخدم في علاج والوقاية من الجلطات.</p>
      <h3>الأنواع الرئيسية</h3>
      <ul>
        <li>الهيبارين (Heparin)</li>
        <li>الوارفارين (Warfarin)</li>
        <li>مضادات التخثر الفموية الحديثة (DOACs)</li>
      </ul>
      <h3>الاحتياطات التمريضية</h3>
      <p>مراقبة علامات النزيف، متابعة قيم INR للوارفارين، وتثقيف المريض حول التفاعلات الغذائية.</p>
    `),
    cover:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
    tags: ["أدوية", "تخثر", "ملخص"],
    author: "د. أحمد كمال",
    status: "published",
    publishDate: "2026-01-15",
    views: 890,
    featured: true,
  },
  {
    id: "a3",
    title: "خطة رعاية تمريضية لمريض السكري",
    slug: "diabetes-care-plan",
    category: "careplans",
    excerpt:
      "خطة رعاية تمريضية متكاملة لمريض السكري تشمل التشخيصات التمريضية، الأهداف، والتدخلات.",
    content: html(`
      <h2>خطة الرعاية التمريضية - مرض السكري</h2>
      <h3>التشخيص التمريضي</h3>
      <p>عدم استقرار مستوى الجلوكوز في الدم المرتبط بنقص المعرفة بإدارة المرض.</p>
      <h3>الأهداف</h3>
      <ul>
        <li>الحفاظ على مستوى سكر طبيعي.</li>
        <li>تثقيف المريض حول النظام الغذائي.</li>
      </ul>
      <h3>التدخلات التمريضية</h3>
      <ol>
        <li>مراقبة مستوى السكر بانتظام.</li>
        <li>تعليم المريض كيفية حقن الأنسولين.</li>
        <li>مراقبة علامات نقص أو ارتفاع السكر.</li>
      </ol>
    `),
    cover:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
    tags: ["خطط رعاية", "سكري"],
    author: "د. سارة فؤاد",
    status: "published",
    publishDate: "2026-01-18",
    views: 654,
  },
  {
    id: "a4",
    title: "ملخص فسيولوجيا القلب والأوعية الدموية",
    slug: "cardiovascular-physiology",
    category: "summaries",
    excerpt:
      "ملخص مركز لأهم مفاهيم فسيولوجيا القلب، الدورة الدموية، وتنظيم ضغط الدم.",
    content: html(`
      <h2>فسيولوجيا القلب</h2>
      <p>القلب عضلة قوية تضخ الدم إلى جميع أنحاء الجسم عبر شبكة من الأوعية الدموية.</p>
      <h3>الدورة القلبية</h3>
      <p>تتكون من مرحلتين: الانقباض (Systole) والانبساط (Diastole).</p>
    `),
    cover:
      "https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=800&q=80",
    tags: ["ملخصات", "قلب", "فسيولوجيا"],
    author: "د. منى السيد",
    status: "published",
    publishDate: "2026-01-20",
    views: 1102,
  },
  {
    id: "a5",
    title: "كتاب: أساسيات التمريض الشامل (PDF)",
    slug: "fundamentals-nursing-book",
    category: "books",
    excerpt:
      "كتاب إلكتروني شامل يغطي أساسيات التمريض من البداية حتى الاحتراف، متاح للتحميل المجاني.",
    content: html(`
      <h2>كتاب أساسيات التمريض</h2>
      <p>هذا الكتاب مرجع متكامل لطلاب التمريض يغطي كافة المهارات الأساسية.</p>
    `),
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    tags: ["كتب", "PDF", "أساسيات"],
    author: "NurseHub Egypt",
    status: "published",
    publishDate: "2026-01-22",
    views: 2340,
    featured: true,
    attachments: [
      { name: "fundamentals-nursing.pdf", type: "pdf", url: "#" },
    ],
  },
  {
    id: "a6",
    title: "كيفية قياس العلامات الحيوية بدقة",
    slug: "vital-signs-measurement",
    category: "skills",
    excerpt:
      "دليل عملي لقياس العلامات الحيوية: درجة الحرارة، النبض، التنفس، وضغط الدم بطريقة صحيحة.",
    content: html(`
      <h2>قياس العلامات الحيوية</h2>
      <p>العلامات الحيوية مؤشرات أساسية لتقييم حالة المريض الصحية.</p>
      <h3>العلامات الأربعة الرئيسية</h3>
      <ul>
        <li>درجة الحرارة (Temperature)</li>
        <li>النبض (Pulse)</li>
        <li>معدل التنفس (Respiration)</li>
        <li>ضغط الدم (Blood Pressure)</li>
      </ul>
    `),
    cover:
      "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80",
    tags: ["مهارات", "علامات حيوية"],
    author: "د. أحمد كمال",
    status: "published",
    publishDate: "2026-01-25",
    views: 1560,
  },
];

export const seedComments: Comment[] = [
  {
    id: "c1",
    articleId: "a1",
    name: "محمد علي",
    text: "مقال رائع ومفيد جداً، شكراً لكم!",
    date: "2026-01-12",
    status: "approved",
  },
  {
    id: "c2",
    articleId: "a2",
    name: "فاطمة حسن",
    text: "هل يمكن إضافة المزيد عن الجرعات؟",
    date: "2026-01-16",
    status: "pending",
  },
];

export const seedMedia: MediaItem[] = [
  { id: "m1", name: "wound-care.jpg", type: "image", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80", size: "240 KB", date: "2026-01-10" },
  { id: "m2", name: "fundamentals.pdf", type: "pdf", url: "#", size: "4.2 MB", date: "2026-01-22" },
  { id: "m3", name: "intro-video.mp4", type: "video", url: "#", size: "18 MB", date: "2026-01-20" },
];

export const seedProducts: Product[] = [
  {
    id: "p1",
    title: "حزمة ملخصات التمريض الكاملة (PDF)",
    type: "pdf",
    price: 99,
    oldPrice: 199,
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80",
    description: "أكثر من 500 صفحة من الملخصات المنظمة لجميع مواد التمريض.",
    sales: 320,
  },
  {
    id: "p2",
    title: "كورس مهارات التمريض السريرية",
    type: "course",
    price: 349,
    oldPrice: 599,
    cover: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80",
    description: "كورس فيديو متكامل لتعلم المهارات السريرية خطوة بخطوة.",
    sales: 145,
  },
  {
    id: "p3",
    title: "اشتراك بريميوم سنوي",
    type: "subscription",
    price: 499,
    cover: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80",
    description: "وصول غير محدود لكل المحتوى والكورسات والأدوات الحصرية.",
    sales: 89,
  },
];

export const seedUsers: User[] = [
  { id: "u1", name: "المدير العام", email: "admin@nursehub.eg", role: "superadmin" },
  { id: "u2", name: "د. منى السيد", email: "mona@nursehub.eg", role: "editor" },
  { id: "u3", name: "د. أحمد كمال", email: "ahmed@nursehub.eg", role: "author" },
];
