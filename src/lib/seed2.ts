import type {
  Drug,
  DrugInteraction,
  DrugAntidote,
  DrugClassification,
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
    isHighAlert: true,
    highAlertWarnings: "دواء عالي الخطورة (High-Alert Medication): هامش الأمان الدوائي ضيق جدًا — أي خطأ في الجرعة أو معدل التسريب قد يسبب نزيفًا مميتًا. يتطلب تحققًا مزدوجًا (Independent Double-Check) من ممرضتين قبل الإعطاء، ضبط دقيق بمضخة تسريب معايرة، مراجعة aPTT/مستوى الصفائح بانتظام، ومعرفة مكان وجرعة الترياق (Protamine sulfate) مقدمًا في حالة الجرعة الزائدة.",
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
  {
    id: "d7",
    name: "Insulin (Regular)",
    genericName: "Insulin Human",
    drugClass: "هرمون خافض سكر",
    category: "أدوية السكري",
    dose: "حسب بروتوكول الجرعة المتغيرة (Sliding Scale) أو حسب الطبيب — يُعطى بوحدات (Units) فقط.",
    indications: "علاج السكري من النوع الأول والثاني، وحالات ارتفاع السكر الحاد.",
    sideEffects: "هبوط السكر الحاد (Hypoglycemia)، نقص البوتاسيوم.",
    nursingConsiderations: "قياس السكر قبل كل جرعة، التأكد من نوع الأنسولين والتركيز، عدم الخلط بين وحدات الأنسولين ومل.",
    slug: "insulin-regular",
    isHighAlert: true,
    highAlertWarnings: "دواء عالي الخطورة: الخلط بين أنواع الأنسولين المختلفة أو بين وحدة (Unit) ومل هو من أشهر أخطاء الأدوية المميتة عالميًا. يتطلب تحققًا مزدوجًا قبل الإعطاء، استخدام سرنجة أنسولين مخصصة فقط (أبدًا سرنجة إنسولين U-100 مع أنسولين مركّز)، وقياس السكر قبل وبعد الجرعة لمتابعة هبوط السكر.",
  },
  {
    id: "d8",
    name: "Potassium Chloride (IV)",
    genericName: "Potassium Chloride",
    drugClass: "إلكتروليت",
    category: "أدوية القلب والدم",
    dose: "يجب تخفيفه دائمًا قبل الإعطاء الوريدي — لا يُعطى أبدًا بشكل مباشر (IV push).",
    indications: "علاج نقص البوتاسيوم في الدم (Hypokalemia).",
    sideEffects: "اضطراب نظم القلب، إيقاف القلب إذا أُعطي مركّزًا أو بسرعة.",
    nursingConsiderations: "التأكد من التخفيف الكامل ومعدل التسريب ببطء عبر مضخة، عدم إعطائه Push أبدًا، مراقبة رسم القلب أثناء التسريب.",
    slug: "potassium-chloride-iv",
    isHighAlert: true,
    highAlertWarnings: "دواء عالي الخطورة قاتل إذا أُعطي بشكل مركّز أو دفعة واحدة (IV push) — يسبب توقف القلب فورًا. يُمنع تخزينه جاهزًا في وحدات الرعاية العادية بدون بروتوكول صارم، ويجب تخفيفه دائمًا واستخدام مضخة تسريب معايرة مع تحقق مزدوج من التركيز والمعدل قبل الإعطاء.",
  },
];

export const seedDrugInteractions: DrugInteraction[] = [
  {
    id: "di1",
    drugAId: "d2", // Heparin
    drugBId: "d3", // Furosemide
    severity: "moderate",
    description: "قد يزيد الفوروسيميد من تأثير الهيبارين المضاد للتخثر (تنافس على الارتباط ببروتينات البلازما)، مما يرفع خطر النزيف.",
    management: "مراقبة علامات النزيف وقيمة aPTT بانتظام عند إعطاء الدوائين معًا.",
  },
  {
    id: "di2",
    drugAId: "d3", // Furosemide
    drugBId: "d4", // Metformin
    severity: "moderate",
    description: "الفوروسيميد قد يرفع من مستوى الميتفورمين في الدم بسبب التأثير على إفرازه الكلوي، مما يزيد خطر الحماض اللبني عند ضعف وظائف الكلى.",
    management: "مراقبة وظائف الكلى وعلامات الحماض اللبني (غثيان، تعب، تنفس سريع).",
  },
  {
    id: "di3",
    drugAId: "d1", // Paracetamol
    drugBId: "d2", // Heparin
    severity: "minor",
    description: "الاستخدام المنتظم للباراسيتامول بجرعات عالية لفترة طويلة قد يعزز تأثير الهيبارين المضاد للتخثر بشكل طفيف.",
    management: "غير مهم في الجرعات القصيرة والعرضية؛ يُراعى فقط عند الاستخدام المزمن.",
  },
  {
    id: "di4",
    drugAId: "d3", // Furosemide
    drugBId: "d6", // Salbutamol
    severity: "moderate",
    description: "كلا الدوائين قد يسببان نقص بوتاسيوم الدم، والجمع بينهما يزيد من هذا الخطر بشكل تراكمي.",
    management: "مراقبة مستوى البوتاسيوم في الدم ورسم القلب عند الاستخدام المشترك.",
  },
];

export const seedDrugAntidotes: DrugAntidote[] = [
  { id: "at1", toxin: "Acetaminophen (Paracetamol)", antidotes: "N-acetylcysteine (NAC)", notes: "أفضل النتائج عند الإعطاء خلال 8-10 ساعات من التسمم." },
  { id: "at2", toxin: "Acetylsalicylic Acid (Aspirin)", antidotes: "Sodium bicarbonate, Activated charcoal", notes: "بيكربونات الصوديوم لقلونة البول وتسريع الإخراج." },
  { id: "at3", toxin: "Opioids (Morphine, Heroin, Fentanyl)", antidotes: "Naloxone", notes: "قد يحتاج جرعات متكررة لقصر مدة تأثيره عن بعض المواد الأفيونية." },
  { id: "at4", toxin: "Benzodiazepines (Diazepam, Lorazepam)", antidotes: "Flumazenil", notes: "يُستخدم بحذر مع مرضى الإدمان المزمن لخطر التشنجات." },
  { id: "at5", toxin: "Anticoagulants (Heparin)", antidotes: "Protamine sulfate", notes: "" },
  { id: "at6", toxin: "Anticoagulants (Warfarin)", antidotes: "Vitamin K, Fresh Frozen Plasma", notes: "FFP للنزيف الحاد الشديد، فيتامين K لعكس التأثير تدريجيًا." },
  { id: "at7", toxin: "Beta Blockers / Calcium Channel Blockers", antidotes: "Glucagon, Calcium gluconate (لحاصرات الكالسيوم)", notes: "" },
  { id: "at8", toxin: "Digoxin", antidotes: "Digoxin Immune Fab (Digibind)", notes: "يُستخدم في حالات التسمم الشديد بالديجوكسين." },
  { id: "at9", toxin: "Anticholinesterase Agents (Organophosphates)", antidotes: "Atropine, Pralidoxime (2-PAM)", notes: "الأتروبين للأعراض المسكارينية، براليدوكسيم لإعادة تنشيط الإنزيم." },
  { id: "at10", toxin: "Antihistamines / Anticholinergic Toxicity", antidotes: "Physostigmine", notes: "" },
  { id: "at11", toxin: "Antipsychotics (EPS من الفينوثيازينات)", antidotes: "Benztropine, Diphenhydramine", notes: "" },
  { id: "at12", toxin: "Barbiturates", antidotes: "Activated charcoal, Sodium bicarbonate", notes: "قلونة البول تسرّع إخراج الفينوباربيتال تحديدًا." },
  { id: "at13", toxin: "Iron", antidotes: "Deferoxamine", notes: "" },
  { id: "at14", toxin: "Methotrexate", antidotes: "Leucovorin (Folinic acid)", notes: "" },
  { id: "at15", toxin: "Insulin (هبوط السكر الحاد)", antidotes: "Glucose (Dextrose 50%), Glucagon", notes: "" },
  { id: "at16", toxin: "Magnesium Sulfate (جرعة زائدة)", antidotes: "Calcium gluconate", notes: "مراقبة منعكس الرضفة ومعدل التنفس." },
  { id: "at17", toxin: "Lead Poisoning", antidotes: "EDTA (Calcium disodium edetate), Dimercaprol (BAL)", notes: "" },
  { id: "at18", toxin: "Cyanide", antidotes: "Hydroxocobalamin, Sodium thiosulfate", notes: "" },
  { id: "at19", toxin: "Ethylene Glycol / Methanol", antidotes: "Fomepizole, Ethanol", notes: "" },
  { id: "at20", toxin: "Amphetamines", antidotes: "Benzodiazepines, Haloperidol", notes: "علاج داعم للأعراض العصبية والنفسية أساسًا." },
];

export const seedDrugClassifications: DrugClassification[] = [
  { id: "cl1", name: "المسكنات (Analgesics)", description: "أدوية لتخفيف الألم بدرجاته المختلفة، تشمل المسكنات الأفيونية ومضادات الالتهاب غير الستيرويدية وخافضات الحرارة.", examples: "Morphine, Ibuprofen, Paracetamol" },
  { id: "cl2", name: "المضادات الحيوية (Antibiotics)", description: "تُستخدم لعلاج العدوى البكتيرية، وتنقسم لعدة عائلات حسب آلية عملها وطيف تأثيرها.", examples: "Penicillins, Cephalosporins, Macrolides, Fluoroquinolones" },
  { id: "cl3", name: "مضادات الاكتئاب (Antidepressants)", description: "تُستخدم لعلاج الاكتئاب واضطرابات المزاج، وتشمل عدة فئات حسب آلية التأثير على النواقل العصبية.", examples: "SSRIs, TCAs, SNRIs" },
  { id: "cl4", name: "مضادات الذهان (Antipsychotics)", description: "تُستخدم لعلاج الاضطرابات الذهانية مثل الفصام، وتنقسم إلى نمطية (الجيل الأول) وغير نمطية (الجيل الثاني).", examples: "Haloperidol, Risperidone, Olanzapine" },
  { id: "cl5", name: "مضادات التخثر (Anticoagulants)", description: "تمنع تكوّن الجلطات الدموية وتقلل خطر السكتة الدماغية والجلطات الوريدية العميقة.", examples: "Heparin, Warfarin" },
  { id: "cl6", name: "مضادات اضطراب النظم (Antiarrhythmics)", description: "تُستخدم لعلاج اضطرابات نظم القلب غير المنتظمة، وتُصنّف إلى أربع فئات رئيسية (Class I-IV).", examples: "Amiodarone, Lidocaine, Procainamide" },
  { id: "cl7", name: "خافضات ضغط الدم (Antihypertensives)", description: "تُستخدم للسيطرة على ارتفاع ضغط الدم، وتضم عدة فئات بآليات مختلفة.", examples: "ACE Inhibitors, Beta Blockers, Calcium Channel Blockers, Diuretics" },
  { id: "cl8", name: "مدرات البول (Diuretics)", description: "تزيد من إخراج الماء والصوديوم عبر البول، وتُستخدم في الوذمة وفشل القلب وارتفاع الضغط.", examples: "Furosemide (Loop), Hydrochlorothiazide (Thiazide), Spironolactone (Potassium-sparing)" },
  { id: "cl9", name: "موسّعات الشعب الهوائية (Bronchodilators)", description: "تُستخدم لتوسيع الشعب الهوائية في الربو والانسداد الرئوي المزمن.", examples: "Salbutamol (Beta-2 agonist), Ipratropium (Anticholinergic)" },
  { id: "cl10", name: "مضادات الهيستامين (Antihistamines)", description: "تُستخدم لعلاج الحساسية عن طريق حصار مستقبلات الهيستامين H1.", examples: "Diphenhydramine, Cetirizine, Loratadine" },
  { id: "cl11", name: "الكورتيكوستيرويدات (Corticosteroids)", description: "أدوية مضادة للالتهاب وكابتة للمناعة، تُستخدم في حالات كثيرة من الحساسية للأمراض المناعية.", examples: "Prednisolone, Dexamethasone, Hydrocortisone" },
  { id: "cl12", name: "خافضات السكر (Hypoglycemics)", description: "تُستخدم للسيطرة على سكر الدم في مرضى السكري، وتشمل الأنسولين والأدوية الفموية.", examples: "Insulin, Metformin (Biguanide), Glimepiride (Sulfonylurea)" },
  { id: "cl13", name: "مضادات الاختلاج (Anticonvulsants)", description: "تُستخدم للسيطرة على نوبات الصرع ومنع تكرارها.", examples: "Phenytoin, Valproic acid, Carbamazepine" },
  { id: "cl14", name: "المهدئات ومضادات القلق (Sedative-Hypnotics/Anxiolytics)", description: "تُستخدم لعلاج القلق واضطرابات النوم عن طريق تثبيط الجهاز العصبي المركزي.", examples: "Diazepam, Lorazepam (Benzodiazepines), Phenobarbital (Barbiturates)" },
  { id: "cl15", name: "مضادات القيء (Antiemetics)", description: "تُستخدم للسيطرة على الغثيان والقيء الناتج عن أسباب متعددة كالعلاج الكيميائي أو دوار الحركة.", examples: "Ondansetron, Metoclopramide" },
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
