import type { Quiz, CustomType, HomeCategory, PaymentGateway, Coupon, CommerceSettings } from "./types";

// Payment gateways — all start DISABLED & DISCONNECTED. They only become
// "connected" after the admin enters real keys and tests the connection.
export const seedGateways: PaymentGateway[] = [
  { id: "paymob", name: "Paymob", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "fawry", name: "Fawry", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "meeza", name: "Meeza", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "vodafone", name: "Vodafone Cash", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "orange", name: "Orange Cash", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "etisalat", name: "Etisalat Cash", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "wepay", name: "WE Pay", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "instapay", name: "InstaPay", region: "eg", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "stripe", name: "Stripe (Visa/Mastercard/Apple/Google Pay)", region: "intl", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
  { id: "paypal", name: "PayPal", region: "intl", enabled: false, mode: "sandbox", apiKey: "", secretKey: "", connected: false },
];

export const seedCoupons: Coupon[] = [
  { id: "c-nurse10", code: "NURSE10", type: "percent", value: 10, maxUses: 100, used: 0, minPurchase: 0, expires: "2026-12-31", active: true, demo: true },
];

export const defaultCommerce: CommerceSettings = { currency: "EGP", taxPercent: 0, serviceFee: 0, country: "Egypt" };

// Default homepage category cards (editable & deletable from the admin panel).
export const seedHomeCategories: HomeCategory[] = [
  { id: "hc1", title: "المقالات", icon: "📝", description: "مقالات تعليمية في التمريض", color: "from-sky-500 to-blue-500", order: 0, visible: true, link: "/category/articles", demo: true },
  { id: "hc2", title: "الملخصات", icon: "📚", description: "ملخصات مركّزة للمواد", color: "from-emerald-500 to-teal-500", order: 1, visible: true, link: "/category/summaries", demo: true },
  { id: "hc3", title: "الأدوية", icon: "💊", description: "دليل الأدوية والجرعات", color: "from-violet-500 to-purple-500", order: 2, visible: true, link: "/drugs", demo: true },
  { id: "hc4", title: "المهارات", icon: "🩺", description: "مهارات سريرية عملية", color: "from-amber-500 to-orange-500", order: 3, visible: true, link: "/category/skills", demo: true },
  { id: "hc5", title: "خطط الرعاية", icon: "📋", description: "خطط رعاية تمريضية", color: "from-rose-500 to-pink-500", order: 4, visible: true, link: "/category/careplans", demo: true },
  { id: "hc6", title: "الكتب وPDF", icon: "📖", description: "كتب وملفات قابلة للتحميل", color: "from-cyan-500 to-sky-500", order: 5, visible: true, link: "/category/books", demo: true },
];

// All seed content here is DEMO data (demo:true) so it can be deleted with one click.
export const seedQuizzes: Quiz[] = [
  {
    id: "q1",
    title: "NCLEX — أساسيات التمريض",
    description: "اختبار تجريبي على غرار NCLEX يغطي أساسيات التمريض والعناية بالمريض.",
    category: "NCLEX",
    difficulty: "متوسط",
    timeLimit: 10,
    passScore: 60,
    status: "published",
    demo: true,
    questions: [
      {
        id: "q1a", text: "ما هي القيمة الطبيعية لمعدل ضربات القلب للبالغين؟",
        options: ["40-60 نبضة/دقيقة", "60-100 نبضة/دقيقة", "100-120 نبضة/دقيقة", "120-140 نبضة/دقيقة"],
        correct: 1, explanation: "المعدل الطبيعي لضربات القلب لدى البالغين هو 60-100 نبضة في الدقيقة.",
      },
      {
        id: "q1b", text: "أي مما يلي يعتبر أولوية عند تقييم مريض في حالة طوارئ؟",
        options: ["قياس درجة الحرارة", "تأمين مجرى الهواء (Airway)", "أخذ التاريخ المرضي", "قياس الوزن"],
        correct: 1, explanation: "وفق نهج ABC يأتي تأمين مجرى الهواء أولاً.",
      },
      {
        id: "q1c", text: "ما وضعية المريض المناسبة لتقليل ضيق التنفس؟",
        options: ["وضعية الاستلقاء", "وضعية فاولر (Fowler)", "وضعية ترندلنبرغ", "الوضعية الجانبية"],
        correct: 1, explanation: "وضعية فاولر (الجلوس شبه المنتصب) تحسّن التنفس.",
      },
    ],
  },
  {
    id: "q2",
    title: "Prometric — علم الأدوية",
    description: "أسئلة على غرار امتحان بروميتريك في علم الأدوية والجرعات.",
    category: "Prometric",
    difficulty: "صعب",
    timeLimit: 8,
    passScore: 70,
    status: "published",
    demo: true,
    questions: [
      {
        id: "q2a", text: "أي فحص يُراقب مع مريض يتناول الوارفارين؟",
        options: ["مستوى السكر", "INR", "الهيموغلوبين", "البوتاسيوم"],
        correct: 1, explanation: "يُراقب INR لضبط جرعة الوارفارين.",
      },
      {
        id: "q2b", text: "الترياق (المضاد) لجرعة الهيبارين الزائدة هو؟",
        options: ["فيتامين K", "بروتامين سلفات", "النالوكسون", "الأتروبين"],
        correct: 1, explanation: "بروتامين سلفات هو الترياق للهيبارين.",
      },
    ],
  },
];

export const seedCustomTypes: CustomType[] = [
  {
    id: "ct1",
    name: "دراسات حالة",
    slug: "case-studies",
    icon: "🏥",
    demo: true,
    fields: [
      { key: "patient", label: "بيانات المريض", type: "text" },
      { key: "presentation", label: "العرض السريري", type: "textarea" },
      { key: "management", label: "الخطة العلاجية", type: "textarea" },
    ],
  },
];
