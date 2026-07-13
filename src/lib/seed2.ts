import type {
  Drug,
  Page,
  Taxonomy,
  Subscriber,
  Ad,
  Affiliate,
  Redirect,
  ActivityEntry,
} from "./types";

export const seedDrugs: Drug[] = [
  {
    id: "d1",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    drugClass: "مسكن وخافض حرارة",
    category: "مسكنات",
    dose: "500-1000 مجم كل 4-6 ساعات (بحد أقصى 4 جم يومياً)",
    indications: "تخفيف الألم الخفيف إلى المتوسط وخفض الحرارة.",
    sideEffects: "نادرة عند الجرعات العادية؛ سمية كبدية عند الجرعات العالية.",
    nursingConsiderations: "مراقبة وظائف الكبد، عدم تجاوز الجرعة القصوى، الحذر مع مدمني الكحول.",
    slug: "paracetamol",
  },
  {
    id: "d2",
    name: "Heparin",
    genericName: "Heparin Sodium",
    drugClass: "مضاد تخثر",
    category: "أدوية القلب والدم",
    dose: "حسب الوزن ووفق بروتوكول aPTT",
    indications: "الوقاية وعلاج الجلطات الوريدية والانصمام الرئوي.",
    sideEffects: "نزيف، نقص الصفائح الدموية (HIT).",
    nursingConsiderations: "مراقبة aPTT وعلامات النزيف، توفر الترياق (Protamine sulfate).",
    slug: "heparin",
  },
  {
    id: "d3",
    name: "Furosemide",
    genericName: "Furosemide",
    drugClass: "مدر بول (Loop diuretic)",
    category: "أدوية القلب والدم",
    dose: "20-80 مجم فموياً/وريدياً",
    indications: "الوذمة، فشل القلب، ارتفاع ضغط الدم.",
    sideEffects: "نقص البوتاسيوم، الجفاف، انخفاض الضغط.",
    nursingConsiderations: "مراقبة الإلكتروليتات والمدخلات/المخرجات والوزن اليومي.",
    slug: "furosemide",
  },
  {
    id: "d4",
    name: "Metformin",
    genericName: "Metformin HCl",
    drugClass: "خافض سكر (Biguanide)",
    category: "أدوية السكري",
    dose: "500-1000 مجم مرتين يومياً مع الطعام",
    indications: "علاج السكري من النوع الثاني.",
    sideEffects: "اضطرابات هضمية، حماض لبني (نادر).",
    nursingConsiderations: "إيقافه قبل الفحوص بالصبغة، مراقبة وظائف الكلى.",
    slug: "metformin",
  },
  {
    id: "d5",
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    drugClass: "مضاد حيوي (Penicillin)",
    category: "المضادات الحيوية",
    dose: "250-500 مجم كل 8 ساعات",
    indications: "العدوى البكتيرية للجهاز التنفسي والمسالك البولية.",
    sideEffects: "طفح جلدي، إسهال، حساسية.",
    nursingConsiderations: "السؤال عن حساسية البنسلين، إكمال الكورس كاملاً.",
    slug: "amoxicillin",
  },
  {
    id: "d6",
    name: "Salbutamol",
    genericName: "Albuterol",
    drugClass: "موسع شعب (Beta-2 agonist)",
    category: "أدوية الجهاز التنفسي",
    dose: "100-200 ميكروجرام بالاستنشاق عند الحاجة",
    indications: "الربو والانسداد الرئوي المزمن.",
    sideEffects: "رعشة، تسارع القلب، صداع.",
    nursingConsiderations: "مراقبة معدل القلب، تعليم المريض الاستخدام الصحيح للبخاخ.",
    slug: "salbutamol",
  },
];

export const seedPages: Page[] = [
  { id: "pg1", title: "من نحن", slug: "about", content: "<p>صفحة من نحن.</p>", status: "published" },
  { id: "pg2", title: "سياسة الخصوصية", slug: "privacy", content: "<p>سياسة الخصوصية.</p>", status: "published" },
];

export const seedCategories: Taxonomy[] = [
  { id: "cat1", name: "المقالات", slug: "articles" },
  { id: "cat2", name: "الملخصات", slug: "summaries" },
  { id: "cat3", name: "الأدوية", slug: "drugs" },
  { id: "cat4", name: "المهارات", slug: "skills" },
  { id: "cat5", name: "خطط الرعاية", slug: "careplans" },
  { id: "cat6", name: "الكتب وملفات PDF", slug: "books" },
];

export const seedTags: Taxonomy[] = [
  { id: "t1", name: "مهارات", slug: "skills" },
  { id: "t2", name: "أدوية", slug: "drugs" },
  { id: "t3", name: "تعقيم", slug: "sterilization" },
  { id: "t4", name: "سكري", slug: "diabetes" },
  { id: "t5", name: "قلب", slug: "cardiology" },
];

export const seedSubscribers: Subscriber[] = [
  { id: "s1", email: "student1@example.com", date: "2026-01-12", status: "active", demo: true },
  { id: "s2", email: "nurse2@example.com", date: "2026-01-18", status: "active", demo: true },
];

export const seedAds: Ad[] = [
  { id: "ad1", name: "AdSense - أعلى المقال", placement: "article-top", type: "adsense", code: "<!-- AdSense slot -->", active: true },
  { id: "ad2", name: "بانر جانبي 300x250", placement: "sidebar", type: "banner", code: "<img src='#'/>", active: true },
];

export const seedAffiliates: Affiliate[] = [
  { id: "af1", name: "كتب التمريض - أمازون", url: "https://example.com/aff1", network: "Amazon", commission: "8%", clicks: 142 },
  { id: "af2", name: "أجهزة طبية", url: "https://example.com/aff2", network: "Jumia", commission: "5%", clicks: 87 },
];

export const seedRedirects: Redirect[] = [
  { id: "r1", from: "/old-article", to: "/article/wound-care-basics", type: 301 },
];

export const seedActivity: ActivityEntry[] = [
  { id: "log1", action: "نشر مقال", target: "أساسيات العناية بالجروح", user: "المدير العام", date: "2026-01-10 10:24" },
  { id: "log2", action: "تعديل إعدادات SEO", target: "إعدادات الموقع", user: "المدير العام", date: "2026-01-15 14:02" },
];
