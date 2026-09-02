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
  { id: "hc7", title: "مكتبة ECG", icon: "🫀", description: "45 نمط تخطيط قلب مصنّف حسب الخطورة", color: "from-rose-600 to-slate-800", order: 6, visible: true, link: "/ecg", demo: false },
  { id: "hc8", title: "مكافحة العدوى", icon: "🦠", description: "نظافة اليدين والوقاية من العدوى", color: "from-red-500 to-orange-500", order: 7, visible: true, link: "/category/infection-control", demo: false },
  { id: "hc9", title: "الأدوات", icon: "🧮", description: "حاسبات طبية تساعدك في عملك", color: "from-indigo-500 to-purple-500", order: 8, visible: true, link: "/tools", demo: false },
  { id: "hc10", title: "المتجر", icon: "🛍️", description: "كتب وكورسات واشتراكات مميزة", color: "from-emerald-500 to-teal-500", order: 9, visible: true, link: "/store", demo: false },
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
  {
    id: "q_med_calc",
    title: "حساب الجرعات الدوائية — تمرين تفاعلي",
    description: "مسائل حسابية عملية: قواعد جرعة الطفل، معدل التنقيط والتسريب الوريدي، التخفيف، والجرعات المحسوبة على الوزن ومساحة سطح الجسم.",
    category: "حساب الجرعات",
    difficulty: "متوسط",
    timeLimit: 20,
    passScore: 70,
    status: "published",
    demo: true,
    questions: [
      {
        id: "qmc1",
        text: "طفل عمره 6 سنوات، جرعة البالغ للدواء 500 مجم. احسبي جرعة الطفل باستخدام قاعدة Young (Age ÷ (Age+12) × جرعة البالغ).",
        options: ["100 مجم", "167 مجم", "250 مجم", "300 مجم"],
        correct: 1, explanation: "6 ÷ (6+12) × 500 = 6/18 × 500 ≈ 167 مجم.",
      },
      {
        id: "qmc2",
        text: "طفل وزنه 20 كجم، جرعة البالغ 300 مجم (بافتراض وزن بالغ قياسي 68 كجم). احسبي جرعة الطفل بقاعدة Clark (وزن الطفل ÷ وزن البالغ القياسي × جرعة البالغ).",
        options: ["44 مجم", "88 مجم", "120 مجم", "150 مجم"],
        correct: 1, explanation: "20 ÷ 68 × 300 ≈ 88 مجم.",
      },
      {
        id: "qmc3",
        text: "مريض وزنه 70 كجم، والجرعة الموصوفة 5 مجم/كجم. كم الجرعة الكلية المطلوبة؟",
        options: ["70 مجم", "140 مجم", "350 مجم", "700 مجم"],
        correct: 2, explanation: "70 × 5 = 350 مجم.",
      },
      {
        id: "qmc4",
        text: "لازم تُعطي 1000 مل محلول خلال 8 ساعات بمجموعة تسريب (drop factor) = 15 تنقيطة/مل. كم معدل التنقيط بالتنقيطة/دقيقة؟",
        options: ["21 تنقيطة/دقيقة", "31 تنقيطة/دقيقة", "42 تنقيطة/دقيقة", "63 تنقيطة/دقيقة"],
        correct: 1, explanation: "(1000 × 15) ÷ (8 × 60) = 15000 ÷ 480 ≈ 31 تنقيطة/دقيقة.",
      },
      {
        id: "qmc5",
        text: "محلول 500 مل يُعطى خلال 4 ساعات عبر مضخة تسريب. كم معدل التسريب بالمل/ساعة؟",
        options: ["100 مل/ساعة", "125 مل/ساعة", "150 مل/ساعة", "200 مل/ساعة"],
        correct: 1, explanation: "500 ÷ 4 = 125 مل/ساعة.",
      },
      {
        id: "qmc6",
        text: "الطبيب طلب 0.25 مجم من دواء، والأمبولة المتاحة تركيزها 500 ميكروجرام/مل. كم مل ستسحبين؟",
        options: ["0.25 مل", "0.5 مل", "1 مل", "2 مل"],
        correct: 1, explanation: "0.25 مجم = 250 ميكروجرام؛ 250 ÷ 500 = 0.5 مل.",
      },
      {
        id: "qmc7",
        text: "أمبولة تركيزها 40 مجم/مل، ومطلوب تحضير 40 مل بتركيز 1 مجم/مل. كم مل من الأمبولة الأصلية تحتاجين (باستخدام C1V1=C2V2)؟",
        options: ["0.5 مل", "1 مل", "2 مل", "4 مل"],
        correct: 1, explanation: "40 × V1 = 1 × 40 → V1 = 1 مل.",
      },
      {
        id: "qmc8",
        text: "المريض محتاج 24 وحدة إنسولين، والحقنة المدرّجة U-100 (1 مل = 100 وحدة). كم مل ستسحبين؟",
        options: ["0.12 مل", "0.24 مل", "0.4 مل", "2.4 مل"],
        correct: 1, explanation: "24 ÷ 100 = 0.24 مل.",
      },
      {
        id: "qmc9",
        text: "مساحة سطح جسم المريض 1.5 م²، والجرعة الموصوفة 100 مجم/م². كم الجرعة الكلية؟",
        options: ["100 مجم", "150 مجم", "175 مجم", "200 مجم"],
        correct: 1, explanation: "100 × 1.5 = 150 مجم.",
      },
      {
        id: "qmc10",
        text: "الطبيب طلب إعطاء دواء دفعة وريدية (IV push) بمعدل 1 مل/دقيقة، والجرعة المطلوبة 4 مل. كم دقيقة سيستغرق الإعطاء الكامل؟",
        options: ["1 دقيقة", "2 دقيقة", "4 دقائق", "8 دقائق"],
        correct: 2, explanation: "4 مل ÷ 1 مل/دقيقة = 4 دقائق.",
      },
      {
        id: "qmc11",
        text: "بروتوكول الهيبارين يبدأ بجرعة تحميل 80 وحدة/كجم، لمريض وزنه 90 كجم. كم وحدة جرعة التحميل؟",
        options: ["720 وحدة", "4500 وحدة", "7200 وحدة", "9000 وحدة"],
        correct: 2, explanation: "80 × 90 = 7200 وحدة.",
      },
      {
        id: "qmc12",
        text: "كم جرام دكستروز موجود في 500 مل من محلول دكستروز 5% (D5W)؟",
        options: ["5 جم", "25 جم", "50 جم", "100 جم"],
        correct: 1, explanation: "5% تعني 5 جم لكل 100 مل؛ 500 × 5 ÷ 100 = 25 جم.",
      },
      {
        id: "qmc13",
        text: "طفل وزنه 15 كجم، الحد الأقصى الآمن للدواء 40 مجم/كجم/يوم مقسومة كل 8 ساعات. الطبيب كتب 200 مجم كل 8 ساعات. هل الجرعة اليومية الكلية آمنة؟",
        options: ["آمنة ومطابقة تمامًا للحد الأقصى", "تتجاوز الحد الأقصى بالضعف", "أقل من اللازم بكثير", "تحتاج مضاعفة الجرعة"],
        correct: 0, explanation: "الحد الأقصى = 40 × 15 = 600 مجم/يوم. الجرعة الموصوفة = 200 × 3 = 600 مجم/يوم — مطابقة تمامًا للحد الأقصى.",
      },
      {
        id: "qmc14",
        text: "معدل التسريب المطلوب 50 مل/ساعة، وحجم الكيس الكلي 1000 مل. كم ساعة سيستغرق تسريب الكيس بالكامل؟",
        options: ["10 ساعات", "15 ساعة", "20 ساعة", "25 ساعة"],
        correct: 2, explanation: "1000 ÷ 50 = 20 ساعة.",
      },
      {
        id: "qmc15",
        text: "أمبولة بودرة تحتوي 1 جم دواء، أُذيبت في 10 مل ماء للحقن. كم التركيز الناتج بالمجم/مل؟",
        options: ["10 مجم/مل", "50 مجم/مل", "100 مجم/مل", "1000 مجم/مل"],
        correct: 2, explanation: "1 جم = 1000 مجم؛ 1000 ÷ 10 = 100 مجم/مل.",
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
