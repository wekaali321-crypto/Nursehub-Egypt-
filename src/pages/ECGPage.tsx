import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";

type Category = "lethal" | "critical" | "urgent" | "watch" | "normal";
type WaveKind =
  | "flat"
  | "chaotic-coarse"
  | "chaotic-fine"
  | "wide-regular"
  | "wide-twisting"
  | "narrow-fast"
  | "narrow-irregular"
  | "sawtooth"
  | "sinus-normal"
  | "sinus-fast"
  | "sinus-slow"
  | "block2"
  | "block3"
  | "pvc"
  | "wenckebach"
  | "bbb-notch"
  | "junctional"
  | "stemi"
  | "ischemia"
  | "wpw"
  | "sinus-arrhythmia"
  | "pac"
  | "paced"
  | "shortqt"
  | "longqt"
  | "hypokalemia"
  | "hyperkalemia"
  | "pe-pattern";

type ECGPattern = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: Category;
  desc: string;
  needsCPR: boolean;
  shockable: boolean;
  rate: string;
  wave: WaveKind;
  causes?: string[];
  treatment?: string[];
  memoryTrick?: string;
};

const CATEGORY_META: Record<Category, { label: string; color: string; badge: string }> = {
  lethal: { label: "مميت", color: "slate", badge: "bg-slate-700 text-white" },
  critical: { label: "حرج", color: "rose", badge: "bg-rose-600 text-white" },
  urgent: { label: "عاجل", color: "amber", badge: "bg-amber-500 text-white" },
  watch: { label: "مراقبة", color: "sky", badge: "bg-sky-500 text-white" },
  normal: { label: "طبيعي", color: "emerald", badge: "bg-emerald-500 text-white" },
};

const PATTERNS: ECGPattern[] = [
  // مميت
  { id: "pea", nameAr: "النشاط الكهربائي بلا نبض (PEA)", nameEn: "Pulseless Electrical Activity", category: "lethal", desc: "إيقاع منظم على الشاشة لكن بدون نبض فعلي — عالج السبب فورًا.", needsCPR: true, shockable: false, rate: "متغير", wave: "sinus-slow",
    causes: ["نقص حجم الدم الشديد", "نقص الأكسجين", "استرواح الصدر الضاغط", "الانصمام الرئوي", "اضطراب شديد في الكهارل"],
    treatment: ["CPR فوري", "علاج السبب الكامن (H's & T's)", "أدرينالين حسب البروتوكول"],
    memoryTrick: "شاشة منظمة... لكن لا نبض حقيقي" },
  { id: "vf-coarse", nameAr: "الرجفان البطيني (خشن)", nameEn: "Coarse Ventricular Fibrillation", category: "lethal", desc: "نشاط كهربائي فوضوي بلا نتاج قلبي — صدمة كهربائية فورية.", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-coarse",
    causes: ["تسرع بطيني غير معالَج", "احتشاء عضلة القلب", "اختلال شديد في الكهارل", "أدوية مسببة لاضطراب النظم"],
    treatment: ["صدفة كهربائية فورية (لا تزامن)", "أوقف CPR فقط لحظة الصدمة", "أدوية: ليدوكايين، أميودارون، بروكاييناميد (LAP)"],
    memoryTrick: "Fib is flopping - خط متعرج فوضوي" },
  { id: "asystole", nameAr: "الإيقاع المسطح (توقف القلب)", nameEn: "Asystole", category: "lethal", desc: "خط مستوٍ — توقف قلبي كامل غير قابل للصدمة.", needsCPR: true, shockable: false, rate: "0", wave: "flat",
    causes: ["توقف قلبي تام", "نقص أكسجين شديد", "اختلال كهارل شديد", "توقف تنفسي طويل بدون تدخل"],
    treatment: ["CPR مستمر", "أدرينالين + أتروبين حسب البروتوكول", "لا صدمة كهربائية إطلاقًا"],
    memoryTrick: "Assist Fully! المريض على خط مسطح" },

  // حرج
  { id: "torsades", nameAr: "تواء الأطراف (Torsades de Pointes)", nameEn: "Torsades de Pointes", category: "critical", desc: "شكل خاص من VT متعدد الأشكال مرتبط بإطالة QT — يُعالج بشكل مختلف عن VT العادي.", needsCPR: true, shockable: true, rate: "200-250", wave: "wide-twisting",
    causes: ["احتشاء عضلة القلب", "نقص الأكسجين", "نقص المغنيسيوم الشديد", "إطالة QT (خلقية أو دوائية)"],
    treatment: ["كبريتات المغنيسيوم وريديًا (العلاج الأساسي)", "صدمة كهربائية لو غير مستقر", "أوقف أي دواء يطيل QT"],
    memoryTrick: "Tornado Pointes — دوامة ملتفة حول الخط" },
  { id: "vt-mono", nameAr: "تسرع القلب البطيني (أحادي الشكل)", nameEn: "Monomorphic Ventricular Tachycardia", category: "critical", desc: "تسرع واسع القالب ومنتظم — قد يكون مميتًا إن لم يُعالج.", needsCPR: true, shockable: true, rate: "100-250", wave: "wide-regular",
    causes: ["احتشاء عضلة القلب", "نقص الأكسجين", "نقص البوتاسيوم أو المغنيسيوم"],
    treatment: ["بدون نبض: صدمة كهربائية فورية + CPR", "بنبض غير مستقر: تقويم نظم متزامن (Cardioversion)", "بنبض مستقر: أدوية مضادة لاضطراب النظم"],
    memoryTrick: "V Tach Tombstone pattern — شكل شاهد القبر" },
  { id: "vf-fine", nameAr: "الرجفان البطيني (ناعم)", nameEn: "Fine Ventricular Fibrillation", category: "critical", desc: "رجفان بطيني بسعة منخفضة — قد يُشتبه بخطأ بالإيقاع المسطح.", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-fine",
    causes: ["رجفان بطيني خشن لم يُعالج وتراجعت طاقته", "نقص أكسجين مطوّل", "احتشاء واسع"],
    treatment: ["تأكد أنه ليس إيقاعًا مسطحًا (تحقق من التوصيلات أولاً)", "صدمة كهربائية فورية إذا تأكد التشخيص", "CPR مستمر"],
    memoryTrick: "شبيه بالمسطح لكنه ليس كذلك — تحقق دائمًا من التوصيلات" },
  { id: "block3", nameAr: "الإحصار الأذيني البطيني الكامل (الدرجة الثالثة)", nameEn: "Complete (3rd-Degree) Heart Block", category: "critical", desc: "انفصال تام بين نشاط الأذين والبطين — كل منهما بمعدله الخاص.", needsCPR: false, shockable: false, rate: "متغير (تفكك أذيني بطيني)", wave: "block3",
    causes: ["احتشاء عضلة القلب (خصوصًا السفلي)", "تليّف نظام التوصيل مع التقدم بالعمر", "تسمم دوائي (ديجوكسين، حاصرات بيتا)"],
    treatment: ["استعد لناظمة قلب مؤقتة/دائمة", "أتروبين قد لا يكون فعالًا في هذا المستوى", "راقب علامات نقص التروية"],
    memoryTrick: "P وQRS كل واحد ماشي لوحده — لا علاقة بينهما" },

  // عاجل
  { id: "svt", nameAr: "تسرع فوق البطيني (SVT)", nameEn: "Supraventricular Tachycardia", category: "urgent", desc: "تسرع ضيق القالب ومنتظم بمعدل مرتفع جدًا، غالبًا بدون موجة P واضحة.", needsCPR: false, shockable: false, rate: "150-250", wave: "narrow-fast",
    causes: ["المنبهات (كافيين، مخدرات)", "المجهود الشديد", "نقص الأكسجين", "أمراض قلبية كامنة"],
    treatment: ["مناورة مبهمية (حبس نفس، ماء بارد على الوجه)", "أدينوزين دفعة سريعة ثم محلول ملحي فورًا", "تقويم نظم متزامن إذا فشل ما سبق"],
    memoryTrick: "Super fast = Supraventricular" },
  { id: "afib-rvr", nameAr: "رجفان أذيني بمعدل بطيني سريع (AFib RVR)", nameEn: "Atrial Fibrillation with RVR", category: "urgent", desc: "إيقاع ضيق القالب وغير منتظم تمامًا (irregularly irregular) بمعدل سريع.", needsCPR: false, shockable: false, rate: "100-175", wave: "narrow-irregular",
    causes: ["مرض صمامي", "قصور القلب", "ارتفاع ضغط الدم الرئوي", "COPD", "بعد جراحة قلب"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات بالإيكو عبر المريء", "ديجوكسين (تحقق من ATP: النبض، السمية، البوتاسيوم قبل الإعطاء)", "مضادات تخثر (وارفارين) مع متابعة INR"],
    memoryTrick: "No P wave = Fibrillation Flopping" },
  { id: "block2-2", nameAr: "الإحصار من الدرجة الثانية (النوع الثاني — موبيتز 2)", nameEn: "2nd-Degree AV Block, Type II (Mobitz II)", category: "urgent", desc: "قد يتطور فجأة لإحصار كامل — يحتاج مراقبة عاجلة واستعداد للناظمة.", needsCPR: false, shockable: false, rate: "متغير", wave: "block2",
    causes: ["مرض في نظام التوصيل (كلا الحزمتين)", "احتشاء عضلة القلب", "تليّف نظام التوصيل"],
    treatment: ["استعد لناظمة قلب — قد يتطور فجأة لإحصار كامل", "راقب باستمرار ولا تعتمد على أتروبين وحده"],
    memoryTrick: "إسقاط منتظم للـQRS — النمط ثابت ومتوقع" },
  { id: "aflutter", nameAr: "رفرفة أذينية (Atrial Flutter)", nameEn: "Atrial Flutter", category: "urgent", desc: "موجات أذينية منتظمة بشكل سن المنشار، غالبًا بنسبة توصيل 2:1.", needsCPR: false, shockable: false, rate: "غالبًا حوالي 150", wave: "sawtooth",
    causes: ["مرض صمامي", "قصور القلب", "ارتفاع ضغط الدم الرئوي", "COPD", "بعد جراحة قلب"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات", "ديجوكسين (تحقق من ATP قبل الإعطاء)", "مضادات تخثر مع متابعة INR"],
    memoryTrick: "A Flutter = Sawtooth (شكل سن المنشار)" },

  // مراقبة
  { id: "afib-controlled", nameAr: "رجفان أذيني بمعدل متحكم", nameEn: "Atrial Fibrillation, Rate-Controlled", category: "watch", desc: "نفس عدم الانتظام لكن بمعدل ضمن الطبيعي — راقب فقط.", needsCPR: false, shockable: false, rate: "60-100", wave: "narrow-irregular",
    causes: ["نفس أسباب AFib RVR لكن معدل مضبوط بالعلاج"], treatment: ["استمرار متابعة معدل النظم والأدوية الحالية"], memoryTrick: "No P wave لكن المعدل طبيعي" },
  { id: "block1", nameAr: "الإحصار من الدرجة الأولى", nameEn: "1st-Degree AV Block", category: "watch", desc: "فترة PR مطوّلة فقط (>0.20 ثانية)، كل موجة P متبوعة بـQRS.", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-normal",
    causes: ["زيادة توتر العصب المبهم", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم)", "تليّف بسيط في العقدة الأذينية البطينية"],
    treatment: ["غالبًا لا يحتاج علاج — راقب فقط", "راجع الأدوية المسببة إذا كانت هي السبب"],
    memoryTrick: "PR interval طويل وثابت فقط — لا إسقاط للـQRS" },
  { id: "wenckebach", nameAr: "الإحصار من الدرجة الثانية (النوع الأول — فينكباخ)", nameEn: "2nd-Degree AV Block, Type I (Wenckebach)", category: "watch", desc: "إطالة تدريجية في PR interval حتى يسقط QRS، ثم تتكرر الدورة.", needsCPR: false, shockable: false, rate: "متغير", wave: "wenckebach",
    causes: ["زيادة توتر العصب المبهم", "احتشاء عضلة القلب السفلي", "أدوية تبطئ التوصيل"],
    treatment: ["غالبًا حميد — راقب فقط ما لم يظهر أعراض", "أتروبين إذا كان المريض عرضيًا (شحوب، برودة، هبوط ضغط)"],
    memoryTrick: "PR بيطول... بيطول... لحد ما يسقط ضربة" },
  { id: "rbbb", nameAr: "إحصار الحزمة اليمنى (RBBB)", nameEn: "Right Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليمنى — QRS عريض مع شكل RSR' (أذنين أرنب) في V1.", needsCPR: false, shockable: false, rate: "60-100", wave: "bbb-notch",
    causes: ["الانصمام الرئوي", "أمراض الرئة المزمنة", "أمراض القلب الخلقية", "قد يكون موجودًا طبيعيًا عند بعض الأشخاص"],
    treatment: ["غالبًا لا يحتاج علاج طارئ بمفرده", "قيّم السبب الكامن (خصوصًا لو ظهر حديثًا)"],
    memoryTrick: "شكل M أو أذنين أرنب في V1" },
  { id: "lbbb", nameAr: "إحصار الحزمة اليسرى (LBBB)", nameEn: "Left Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليسرى — QRS عريض، قد يخفي علامات احتشاء أخرى على ECG.", needsCPR: false, shockable: false, rate: "60-100", wave: "bbb-notch",
    causes: ["أمراض القلب الإقفارية", "ارتفاع ضغط الدم المزمن", "اعتلال عضلة القلب"],
    treatment: ["إذا ظهر حديثًا مع أعراض صدرية عامله كاحتشاء حتى يثبت العكس", "قيّم وظيفة القلب (إيكو)"],
    memoryTrick: "LBBB جديد + ألم صدر = عامله زي الاحتشاء" },
  { id: "junctional", nameAr: "الإيقاع العقدي (Junctional Rhythm)", nameEn: "Junctional Rhythm", category: "watch", desc: "العقدة الأذينية البطينية تتولى تنظيم القلب بدل SA node — موجة P غائبة أو مقلوبة.", needsCPR: false, shockable: false, rate: "40-60", wave: "junctional",
    causes: ["ضعف أو توقف العقدة الجيبية", "زيادة توتر العصب المبهم", "تسمم بالديجوكسين"],
    treatment: ["راقب الأعراض وعلامات ضعف التروية", "أتروبين إذا كان عرضيًا", "راجع أدوية الديجوكسين"],
    memoryTrick: "P wave غائبة أو مقلوبة — القلب اتحكم فيه العقدة مش SA node" },
  { id: "pvcs", nameAr: "انقباضات بطينية مبكرة متكررة (PVCs)", nameEn: "Frequent Premature Ventricular Contractions", category: "watch", desc: "نبضات مبكرة واسعة القالب وسط إيقاع منتظم — راقب النمط والتكرار.", needsCPR: false, shockable: false, rate: "متغير", wave: "pvc",
    causes: ["نقص الأكسجين", "اختلال كهارل (بوتاسيوم، مغنيسيوم)", "كافيين أو منبهات", "إجهاد أو قلق", "أمراض قلبية كامنة"],
    treatment: ["راقب التكرار (متكررة/زوجية/ثلاثية)", "صحح اختلال الكهارل", "أبلغ الطبيب لو تحولت لأنماط خطيرة (Runs of VT)"],
    memoryTrick: "نبضة مبكرة واسعة وسط إيقاع منتظم" },
  { id: "sinus-tach", nameAr: "تسرع الجيوب الأنفية", nameEn: "Sinus Tachycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل مرتفع — ابحث عن السبب (ألم، حمى، جفاف).", needsCPR: false, shockable: false, rate: "100-150", wave: "sinus-fast",
    causes: ["الألم", "الحمى", "الجفاف أو نقص حجم الدم", "القلق", "فرط نشاط الغدة الدرقية"],
    treatment: ["لا علاج مباشر — عالج السبب الكامن", "راقب العلامات الحيوية"],
    memoryTrick: "شكل جيبي طبيعي لكن أسرع" },
  { id: "sinus-brady", nameAr: "بطء الجيوب الأنفية", nameEn: "Sinus Bradycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل منخفض — قد يكون طبيعيًا في الرياضيين.", needsCPR: false, shockable: false, rate: "أقل من 60", wave: "sinus-slow",
    causes: ["مناورة مبهمية (الشد أثناء التبرز)", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم)", "طبيعي عند الرياضيين"],
    treatment: ["أتروبين فقط إذا كان عرضيًا (شحوب، برودة، انخفاض تروية)", "لا علاج إذا كان بدون أعراض"],
    memoryTrick: "BRADYcardia = أقل من 60" },

  // طبيعي
  { id: "nsr", nameAr: "الإيقاع الجيبي الطبيعي", nameEn: "Normal Sinus Rhythm", category: "normal", desc: "موجة P منتظمة تسبق كل QRS، معدل ومسافات طبيعية.", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-normal",
    causes: ["قلب سليم يعمل بشكل طبيعي"], treatment: ["لا علاج — استمر بالمراقبة الروتينية"], memoryTrick: "نبضة منتظمة ومتباعدة بالتساوي" },
  { id: "wpw", nameAr: "متلازمة وولف-باركنسون-وايت (WPW)", nameEn: "Wolff-Parkinson-White Syndrome", category: "watch", desc: "مسار توصيل إضافي بين الأذين والبطين — PR قصير وQRS عريض مع موجة دلتا مميزة.", needsCPR: false, shockable: false, rate: "60-100 (أو تسرع نوبي)", wave: "wpw",
    causes: ["مسار توصيل شاذ خلقي (Accessory pathway) يتخطى العقدة الأذينية البطينية"],
    treatment: ["خطر الإصابة بتسرعات نوبية سريعة", "قد يحتاج استئصال بالقسطرة (Ablation) لاحقًا"],
    memoryTrick: "Short PR + Wide QRS + Delta wave" },
  { id: "stemi", nameAr: "احتشاء بارتفاع ST (STEMI)", nameEn: "ST-Elevation Myocardial Infarction", category: "critical", desc: "ارتفاع في قطعة ST فوق الخط الأساسي — انسداد كامل في شريان تاجي، حالة طارئة قصوى.", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد كامل مفاجئ لشريان تاجي"],
    treatment: ["تفعيل بروتوكول المختبر القسطري فورًا (Door-to-balloon)", "أكسجين، أسبرين، نيتروجليسرين، مسكن حسب البروتوكول", "ECG متكرر ومراقبة قريبة"],
    memoryTrick: "ST مرتفع = عضلة قلب بتموت الآن" },
  { id: "ischemia", nameAr: "نقص تروية عضلة القلب (انخفاض ST)", nameEn: "Myocardial Ischemia (ST Depression)", category: "urgent", desc: "انخفاض في قطعة ST — نقص تروية دون انسداد كامل بعد؛ فرّق بينه وبين الذبحة الصدرية بالإنزيمات والتوقيت.", needsCPR: false, shockable: false, rate: "متغير", wave: "ischemia",
    causes: ["ذبحة صدرية غير مستقرة", "نقص تروية تحت الشغاف", "زيادة الحمل على القلب مع مرض تاجي كامن"],
    treatment: ["أكسجين، نيترات، مراقبة إنزيمات القلب", "ECG متسلسل لمتابعة التطور نحو احتشاء"],
    memoryTrick: "ST منخفض = القلب تعبان لكن لسه مايتش" },

  // إضافات — أنماط أخرى (طبيعي / مراقبة / عاجل / حرج)
  { id: "sinus-arrhythmia", nameAr: "عدم انتظام الإيقاع الجيبي", nameEn: "Sinus Arrhythmia", category: "normal", desc: "المعدل يتغير بشكل طبيعي مع التنفس (يزيد بالشهيق ويقل بالزفير) — شائع عند الشباب والرياضيين.", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-arrhythmia",
    causes: ["تغير طبيعي مرتبط بالتنفس عبر العصب المبهم"], treatment: ["لا علاج — نتيجة طبيعية"], memoryTrick: "المعدل يتغير مع التنفس — طبيعي تمامًا" },
  { id: "pac", nameAr: "الانقباض الأذيني المبكر (PAC)", nameEn: "Premature Atrial Contraction", category: "normal", desc: "ضربة مبكرة ضيقة القالب بموجة P مختلفة الشكل عن باقي الموجات.", needsCPR: false, shockable: false, rate: "طبيعي", wave: "pac",
    causes: ["كافيين أو منبهات", "إجهاد", "قلة نوم", "طبيعي أحيانًا بدون سبب واضح"],
    treatment: ["غالبًا لا يحتاج علاج", "قلل المنبهات لو متكررة ومزعجة"], memoryTrick: "ضربة مبكرة ضيقة بموجة P مختلفة الشكل" },
  { id: "paced", nameAr: "إيقاع المنظّم الكهربائي (Paced Rhythm)", nameEn: "Paced Rhythm", category: "watch", desc: "إشارات المنظم تسبق كل QRS عريض — تحقق من الالتقاط (Capture) والاستشعار (Sensing).", needsCPR: false, shockable: false, rate: "حسب إعداد الجهاز", wave: "paced",
    causes: ["مريض لديه منظم قلب كهربائي دائم أو مؤقت"],
    treatment: ["تحقق من نجاح الالتقاط (كل Spike يتبعه QRS)", "تحقق من الاستشعار الصحيح", "أبلغ الطبيب لو فشل الالتقاط أو الاستشعار"],
    memoryTrick: "خط رأسي حاد (Spike) قبل كل QRS عريض" },
  { id: "shortqt", nameAr: "متلازمة QT القصير", nameEn: "Short QT Syndrome", category: "urgent", desc: "فترة QT قصيرة بشكل غير طبيعي — نادرة لكنها ترفع خطر الرجفان البطيني والموت المفاجئ.", needsCPR: false, shockable: false, rate: "طبيعي", wave: "shortqt",
    causes: ["خلل خلقي في قنوات البوتاسيوم (وراثي غالبًا)", "فرط كالسيوم الدم أحيانًا"],
    treatment: ["إحالة لطبيب قلب متخصص بالنظم", "قد يحتاج مزيل رجفان مزروع (ICD) في الحالات عالية الخطورة"],
    memoryTrick: "QT قصير جدًا = خطر VF نادر لكن خطير" },
  { id: "mat", nameAr: "تسرع الأذيني متعدد البؤر (MAT)", nameEn: "Multifocal Atrial Tachycardia", category: "urgent", desc: "3 أشكال مختلفة على الأقل لموجة P في نفس الشريط — غالبًا مرتبط بأمراض الرئة المزمنة (COPD).", needsCPR: false, shockable: false, rate: "100-180", wave: "narrow-irregular",
    causes: ["تفاقم مرض الانسداد الرئوي المزمن (COPD)", "نقص الأكسجين", "اختلال كهارل"],
    treatment: ["عالج المرض الرئوي الكامن ونقص الأكسجين أولًا", "حاصرات قنوات الكالسيوم قد تُستخدم", "تجنب الديجوكسين عادة"],
    memoryTrick: "3 أشكال مختلفة لموجة P على الأقل" },
  { id: "pericarditis", nameAr: "نمط ECG في التهاب التامور", nameEn: "Pericarditis ECG Pattern", category: "urgent", desc: "ارتفاع ST منتشر بشكل سرج (Saddle-shaped) مع انخفاض PR — يختلف عن احتشاء واحد بمنطقة محددة.", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["عدوى فيروسية", "ما بعد احتشاء عضلة القلب (متلازمة درسلر)", "أمراض المناعة الذاتية", "الفشل الكلوي"],
    treatment: ["مضادات الالتهاب اللاستيرويدية (NSAIDs)", "كولشيسين", "راقب علامات الاندحاس القلبي (Tamponade)"],
    memoryTrick: "ارتفاع ST منتشر في كل الـLeads تقريبًا، مش منطقة واحدة بس" },
  { id: "hypokalemia-ecg", nameAr: "تغيرات ECG في نقص بوتاسيوم الدم", nameEn: "Hypokalemia ECG Changes", category: "urgent", desc: "تسطح موجة T وظهور موجة U واضحة، مع إطالة QT.", needsCPR: false, shockable: false, rate: "متغير", wave: "hypokalemia",
    causes: ["فقدان بوتاسيوم عبر القيء أو الإسهال", "مدرات البول", "الأنسولين الزائد"],
    treatment: ["تعويض بوتاسيوم وريدي/فموي حسب الشدة", "مراقبة القلب المستمرة أثناء التعويض", "راقب خطر اضطراب النظم (خصوصًا Torsades)"],
    memoryTrick: "T مسطحة + U واضحة = بوتاسيوم واطي" },
  { id: "longqt", nameAr: "متلازمة QT الطويل", nameEn: "Long QT Syndrome", category: "urgent", desc: "إطالة فترة QT — خطر التطور لتواء الأطراف (Torsades) والموت المفاجئ.", needsCPR: false, shockable: false, rate: "متغير", wave: "longqt",
    causes: ["خلقي (وراثي)", "أدوية تطيل QT (بعض المضادات الحيوية والنفسية)", "نقص المغنيسيوم أو البوتاسيوم أو الكالسيوم"],
    treatment: ["أوقف أي دواء يطيل QT", "صحح اختلال الكهارل", "راقب تطور تواء الأطراف"],
    memoryTrick: "QT طويل = القلب مستني وقت أطول قبل الاستعداد للضربة الجاية" },
  { id: "hypocalcemia-ecg", nameAr: "تغيرات ECG في نقص كالسيوم الدم", nameEn: "Hypocalcemia ECG Changes", category: "urgent", desc: "إطالة قطعة ST بشكل رئيسي (يمدد QT بدون تغيير كبير في شكل T).", needsCPR: false, shockable: false, rate: "متغير", wave: "longqt",
    causes: ["قصور الغدة جار الدرقية", "الفشل الكلوي", "نقص فيتامين د الشديد"],
    treatment: ["تعويض كالسيوم وريدي في الحالات العرضية", "راقب تشنجات العضلات وعلامات تيتاني"],
    memoryTrick: "ST طويل = السبب غالبًا كالسيوم واطي" },
  { id: "hyperkalemia-ecg", nameAr: "تغيرات ECG في فرط بوتاسيوم الدم", nameEn: "Hyperkalemia ECG Changes", category: "critical", desc: "موجات T مدببة وضيقة (Peaked/Tented) — إذا لم تُعالَج تتطور لتوقف قلبي.", needsCPR: false, shockable: false, rate: "متغير", wave: "hyperkalemia",
    causes: ["الفشل الكلوي", "تحلل عضلي أو خلوي شديد", "بعض الأدوية (مثبطات ACE، مدرات موفرة للبوتاسيوم)"],
    treatment: ["كالسيوم جلوكونات وريدي لحماية القلب فورًا", "إنسولين + جلوكوز، وسالبوتامول لخفض البوتاسيوم داخل الخلايا", "قد يحتاج غسيل كلوي عاجل"],
    memoryTrick: "T مدببة وضيقة = بوتاسيوم عالي حتى يثبت العكس" },
  { id: "nstemi", nameAr: "احتشاء بدون ارتفاع ST / ذبحة غير مستقرة", nameEn: "NSTEMI / Unstable Angina", category: "critical", desc: "انخفاض ST أو انقلاب موجة T بدون ارتفاع ST — فرّق بينهما بإنزيمات القلب والتوقيت.", needsCPR: false, shockable: false, rate: "متغير", wave: "ischemia",
    causes: ["انسداد جزئي أو مؤقت لشريان تاجي"],
    treatment: ["أسبرين، مضادات تخثر حسب البروتوكول", "إنزيمات قلب متسلسلة لتفريق NSTEMI عن الذبحة", "تنظير قسطري حسب تصنيف الخطورة"],
    memoryTrick: "بدون ارتفاع ST — لازم إنزيمات القلب تفرّق الحالة" },
  { id: "mi-lateral", nameAr: "احتشاء عضلة القلب الحاد الجانبي", nameEn: "Acute Lateral Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في I، aVL، V5، V6 — منطقة الشريان الظرفي (LCx) أو القطري.", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان الظرفي الأيسر (LCx) أو فرع قطري"],
    treatment: ["تفعيل بروتوكول القسطرة القلبية فورًا", "أكسجين، أسبرين، نيتروجليسرين حسب البروتوكول"],
    memoryTrick: "ارتفاع ST في I وaVL وV5-V6 = جانبي" },
  { id: "mi-anterior", nameAr: "احتشاء عضلة القلب الحاد الأمامي", nameEn: "Acute Anterior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في V1-V4 — منطقة الشريان الأمامي النازل (LAD)، الأكثر خطورة لأنه يغذي جزءًا كبيرًا من البطين الأيسر.", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان الأمامي النازل الأيسر (LAD)"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا (الأولوية القصوى)", "راقب علامات قصور القلب الحاد وصدمة قلبية"],
    memoryTrick: "V1-V4 = أمامي = LAD = الأخطر" },
  { id: "mi-inferior", nameAr: "احتشاء عضلة القلب الحاد السفلي", nameEn: "Acute Inferior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في II، III، aVF — منطقة الشريان التاجي الأيمن غالبًا؛ راقب بطء القلب والإحصار.", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان التاجي الأيمن (RCA) غالبًا"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا", "تجنب النيترات لو فيه احتشاء بالبطين الأيمن (قد يهبط الضغط بشدة)", "راقب بطء القلب أو إحصار AV"],
    memoryTrick: "II وIII وaVF = سفلي = راقب بطء القلب" },
  { id: "pe-ecg", nameAr: "نمط ECG في الانسداد الرئوي", nameEn: "Pulmonary Embolism ECG Pattern (S1Q3T3)", category: "critical", desc: "نمط S1Q3T3 (موجة S في I، موجة Q في III، T مقلوبة في III) + تسرع جيبي — غير نوعي لكن مشير.", needsCPR: false, shockable: false, rate: "متغير (غالبًا تسرع جيبي)", wave: "pe-pattern",
    causes: ["انصمام رئوي حاد يسبب إجهادًا مفاجئًا على البطين الأيمن"],
    treatment: ["أكسجين ودعم تنفسي", "مضادات تخثر عاجلة أو حل الجلطة حسب الشدة", "تصوير مقطعي للشريان الرئوي للتأكيد"],
    memoryTrick: "S1Q3T3 — غير نوعي لكنه مشير للانصمام الرئوي" },
];

function pr(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildWavePath(kind: WaveKind): string {
  const W = 800;
  const base = 50;
  const pts: [number, number][] = [];
  const push = (x: number, y: number) => pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);

  const sinusBeat = (start: number, width: number, wide = false) => {
    push(start, base);
    push(start + width * 0.06, base - 6);
    push(start + width * 0.11, base - 9);
    push(start + width * 0.15, base);
    push(start + width * 0.19, base);
    if (!wide) {
      push(start + width * 0.21, base + 3);
      push(start + width * 0.23, base - 32);
      push(start + width * 0.25, base + 14);
      push(start + width * 0.27, base);
    } else {
      push(start + width * 0.21, base + 6);
      push(start + width * 0.25, base - 40);
      push(start + width * 0.30, base + 22);
      push(start + width * 0.34, base);
    }
    push(start + width * 0.45, base - 9);
    push(start + width * 0.55, base);
    push(start + width, base);
  };

  const wideBeat = (start: number, width: number, amp = 1) => {
    push(start, base);
    push(start + width * 0.15, base - 38 * amp);
    push(start + width * 0.30, base + 30 * amp);
    push(start + width * 0.45, base - 10 * amp);
    push(start + width * 0.6, base);
    push(start + width, base);
  };

  switch (kind) {
    case "flat": {
      for (let x = 0; x <= W; x += 20) push(x, base + (pr(x) - 0.5) * 2);
      break;
    }
    case "chaotic-coarse": {
      for (let x = 0; x <= W; x += 9) push(x, base + (pr(x) - 0.5) * 70);
      break;
    }
    case "chaotic-fine": {
      for (let x = 0; x <= W; x += 8) push(x, base + (pr(x) - 0.5) * 22);
      break;
    }
    case "wide-regular": {
      const width = 65;
      for (let x = 0; x < W; x += width) wideBeat(x, width);
      break;
    }
    case "wide-twisting": {
      const width = 45;
      let i = 0;
      for (let x = 0; x < W; x += width) {
        const envelope = Math.sin((i * Math.PI) / 4);
        wideBeat(x, width, envelope);
        i++;
      }
      break;
    }
    case "narrow-fast": {
      const width = 32;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.4, base - 34);
        push(x + width * 0.55, base + 10);
        push(x + width, base);
      }
      break;
    }
    case "narrow-irregular": {
      let x = 0;
      let i = 0;
      while (x < W) {
        const width = 30 + pr(i) * 35;
        push(x, base + (pr(i + 50) - 0.5) * 6);
        push(x + width * 0.4, base - 30);
        push(x + width * 0.55, base + 8);
        push(x + width, base + (pr(i + 60) - 0.5) * 6);
        x += width;
        i++;
      }
      break;
    }
    case "sawtooth": {
      const width = 22;
      for (let x = 0; x < W; x += width) {
        push(x, base + 12);
        push(x + width * 0.7, base - 14);
        push(x + width, base + 12);
      }
      break;
    }
    case "sinus-normal": {
      const width = 130;
      for (let x = 0; x < W; x += width) sinusBeat(x, width);
      break;
    }
    case "sinus-fast": {
      const width = 82;
      for (let x = 0; x < W; x += width) sinusBeat(x, width);
      break;
    }
    case "sinus-slow": {
      const width = 220;
      for (let x = 0; x < W; x += width) sinusBeat(x, width);
      break;
    }
    case "pvc": {
      const width = 130;
      let i = 0;
      for (let x = 0; x < W; x += width) {
        if (i % 3 === 2) wideBeat(x, width * 0.7);
        else sinusBeat(x, width);
        i++;
      }
      break;
    }
    case "block2": {
      // P waves regular; every 3rd P is not followed by a QRS
      const width = 90;
      let i = 0;
      for (let x = 0; x < W; x += width) {
        if (i % 3 === 2) {
          // P wave only, no QRS/T
          push(x, base);
          push(x + width * 0.2, base - 7);
          push(x + width * 0.3, base);
          push(x + width, base);
        } else {
          sinusBeat(x, width);
        }
        i++;
      }
      break;
    }
    case "block3": {
      // independent P waves (fast, small) and QRS complexes (slow, wide) overlaid
      for (let x = 0; x < W; x += 60) {
        push(x, base);
        push(x + 10, base - 6);
        push(x + 16, base);
      }
      for (let x = 20; x < W; x += 190) wideBeat(x, 60);
      pts.sort((a, b) => a[0] - b[0]);
      break;
    }
    case "wenckebach": {
      // PR (P-to-QRS gap) progressively lengthens over 4 beats, then a P wave with no QRS, repeat
      const cycle = 260;
      for (let c = 0; c < W; c += cycle) {
        for (let n = 0; n < 4; n++) {
          const start = c + n * (cycle / 4);
          const prGap = 6 + n * 8;
          push(start, base);
          push(start + 6, base - 6);
          push(start + 10, base);
          push(start + 10 + prGap, base);
          if (n < 3) {
            push(start + 10 + prGap + 2, base + 3);
            push(start + 10 + prGap + 4, base - 32);
            push(start + 10 + prGap + 6, base + 12);
            push(start + 10 + prGap + 8, base);
            push(start + 10 + prGap + 18, base - 8);
            push(start + 10 + prGap + 26, base);
          }
        }
      }
      break;
    }
    case "bbb-notch": {
      // wide QRS with an RSR' (M-shaped / rabbit-ears) notch
      const width = 130;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.15, base);
        push(x + width * 0.19, base + 3);
        push(x + width * 0.22, base - 30);
        push(x + width * 0.26, base - 8);
        push(x + width * 0.30, base - 26);
        push(x + width * 0.35, base + 14);
        push(x + width * 0.4, base);
        push(x + width * 0.55, base - 9);
        push(x + width * 0.65, base);
        push(x + width, base);
      }
      break;
    }
    case "junctional": {
      // narrow regular QRS at a slow rate; P wave absent or inverted (small dip right after QRS)
      const width = 170;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.05, base + 3);
        push(x + width * 0.08, base - 34);
        push(x + width * 0.11, base + 12);
        push(x + width * 0.14, base);
        push(x + width * 0.18, base + 6);
        push(x + width * 0.22, base);
        push(x + width * 0.35, base - 8);
        push(x + width * 0.45, base);
        push(x + width, base);
      }
      break;
    }
    case "stemi": {
      // sinus beats with a raised (elevated) ST segment plateau before the T wave
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 34);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base - 16);
        push(x + width * 0.42, base - 16);
        push(x + width * 0.55, base - 20);
        push(x + width * 0.68, base);
        push(x + width, base);
      }
      break;
    }
    case "ischemia": {
      // sinus beats with a depressed ST segment before the T wave
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 34);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base + 8);
        push(x + width * 0.42, base + 8);
        push(x + width * 0.55, base - 4);
        push(x + width * 0.68, base);
        push(x + width, base);
      }
      break;
    }
    case "wpw": {
      // short PR interval and a slurred upstroke (delta wave) into a wide QRS
      const width = 130;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.14, base);
        push(x + width * 0.17, base - 4);
        push(x + width * 0.21, base - 14);
        push(x + width * 0.24, base + 3);
        push(x + width * 0.26, base - 36);
        push(x + width * 0.29, base + 16);
        push(x + width * 0.33, base);
        push(x + width * 0.45, base - 9);
        push(x + width * 0.55, base);
        push(x + width, base);
      }
      break;
    }
    case "sinus-arrhythmia": {
      // normal-looking beats but the cycle width varies gently with a slow sine wave (breathing)
      let x = 0;
      let i = 0;
      while (x < W) {
        const width = 130 + Math.sin(i * 0.9) * 40;
        sinusBeat(x, width);
        x += width;
        i++;
      }
      break;
    }
    case "pac": {
      // normal sinus beats with one early, slightly different beat every cycle group
      const width = 130;
      let i = 0;
      for (let x = 0; x < W; ) {
        if (i % 3 === 2) {
          const early = width * 0.7;
          sinusBeat(x, early);
          x += early;
        } else {
          sinusBeat(x, width);
          x += width;
        }
        i++;
      }
      break;
    }
    case "paced": {
      // a sharp vertical pacer spike immediately followed by a wide QRS
      const width = 140;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + 2, base - 45);
        push(x + 4, base);
        push(x + width * 0.08, base + 8);
        push(x + width * 0.14, base - 30);
        push(x + width * 0.22, base + 14);
        push(x + width * 0.30, base);
        push(x + width * 0.5, base - 8);
        push(x + width * 0.62, base);
        push(x + width, base);
      }
      break;
    }
    case "shortqt": {
      // normal QRS but the T wave arrives very soon after (short QT interval)
      const width = 130;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base);
        push(x + width * 0.32, base - 10);
        push(x + width * 0.38, base);
        push(x + width, base);
      }
      break;
    }
    case "longqt": {
      // normal QRS but a long flat stretch before a delayed, broad T wave (long QT interval)
      const width = 190;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.05, base - 5);
        push(x + width * 0.08, base);
        push(x + width * 0.14, base);
        push(x + width * 0.16, base + 3);
        push(x + width * 0.18, base - 32);
        push(x + width * 0.20, base + 14);
        push(x + width * 0.22, base);
        push(x + width * 0.55, base);
        push(x + width * 0.68, base - 10);
        push(x + width * 0.80, base);
        push(x + width, base);
      }
      break;
    }
    case "hypokalemia": {
      // flattened T wave followed by a small extra U wave bump
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base);
        push(x + width * 0.40, base - 3);
        push(x + width * 0.50, base);
        push(x + width * 0.58, base - 5);
        push(x + width * 0.66, base);
        push(x + width, base);
      }
      break;
    }
    case "hyperkalemia": {
      // tall, narrow, peaked (tented) T wave right after a normal QRS
      const width = 140;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base);
        push(x + width * 0.36, base - 42);
        push(x + width * 0.42, base);
        push(x + width, base);
      }
      break;
    }
    case "pe-pattern": {
      // deep S in a narrow-fast-ish complex to hint at the S1Q3T3 strain pattern
      const width = 120;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 5);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.22, base - 30);
        push(x + width * 0.27, base + 22);
        push(x + width * 0.34, base);
        push(x + width * 0.45, base + 6);
        push(x + width * 0.55, base);
        push(x + width, base);
      }
      break;
    }
  }

  if (pts.length === 0) return `M0,${base} L${W},${base}`;
  return "M" + pts.map(([x, y]) => `${x},${y}`).join(" L");
}

function ECGWave({ kind, colorClass }: { kind: WaveKind; colorClass: string }) {
  const d = useMemo(() => buildWavePath(kind), [kind]);
  return (
    <svg viewBox="0 0 800 100" preserveAspectRatio="none" className={`h-20 w-full ${colorClass}`}>
      <g className="ecg-trace-group" style={{ animationDuration: "3.5s" }}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="ecg-glow-line" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="ecg-glow-line" transform="translate(800,0)" />
      </g>
      <circle cx="792" cy="50" r="4" fill="currentColor" className="ecg-cursor-dot" />
    </svg>
  );
}

const waveColor: Record<Category, string> = {
  lethal: "text-slate-300",
  critical: "text-rose-400",
  urgent: "text-amber-400",
  watch: "text-sky-400",
  normal: "text-emerald-400",
};

function ECGCard({ p }: { p: ECGPattern }) {
  const [open, setOpen] = useState(false);
  const hasDetails = (p.causes && p.causes.length > 0) || (p.treatment && p.treatment.length > 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_META[p.category].badge}`}>{CATEGORY_META[p.category].label}</span>
        <span className="text-xs font-bold text-slate-400" dir="ltr">{p.rate} bpm</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">{p.nameEn}</h3>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{p.nameAr}</p>

      <div className="my-3 rounded-lg ecg-monitor-bg p-2">
        <ECGWave kind={p.wave} colorClass={waveColor[p.category]} />
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{p.desc}</p>

      {p.memoryTrick && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          💡 {p.memoryTrick}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {p.needsCPR && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">🫀 CPR</span>}
        {p.shockable && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">⚡ Shock</span>}
        {hasDetails && (
          <button type="button" onClick={() => setOpen((s) => !s)} className="mr-auto text-xs font-bold text-sky-600 dark:text-sky-400">
            {open ? "− إخفاء الأسباب والعلاج" : "+ الأسباب والعلاج"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          {p.causes && p.causes.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">🔍 الأسباب</div>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                {p.causes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}
          {p.treatment && p.treatment.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">💚 العلاج</div>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                {p.treatment.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ECGPage() {
  const { settings } = useStore();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "">("");

  useSEO({
    title: `مكتبة ECG | ${settings.siteName}`,
    description: "مكتبة أنماط تخطيط القلب (ECG) مصنفة حسب الخطورة، مع الأسباب والتوجيهات التمريضية — أداة تعليمية للممرضين.",
    keywords: "ECG, تخطيط القلب, رسم القلب, رجفان بطيني, تسرع بطيني, تمريض",
  });

  const list = useMemo(() => {
    return PATTERNS.filter((p) => {
      const m = (p.nameAr + p.nameEn + p.desc).toLowerCase().includes(q.toLowerCase());
      const c = !cat || p.category === cat;
      return m && c;
    });
  }, [q, cat]);

  const counts = useMemo(() => {
    const cprCount = PATTERNS.filter((p) => p.needsCPR).length;
    const shockCount = PATTERNS.filter((p) => p.shockable).length;
    return { cprCount, shockCount, total: PATTERNS.length };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "مكتبة ECG" }]} />
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-rose-600 to-slate-800 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🫀</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">مكتبة ECG</h1>
        <p className="mt-1 text-rose-50">{counts.total} نمط مصنّف حسب الخطورة — للمساعدة التعليمية فقط</p>
      </div>

      <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        هذه المكتبة تعليمية ومرجعية فقط، والأشكال تخطيطية مبسّطة وليست تسجيلات حقيقية. لا تُستخدم بديلاً عن تفسير ECG الفعلي للمريض أو تقييم الطبيب.
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search") + "..."} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
          <span className="absolute right-3 top-3 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">CPR {counts.cprCount}</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">قابل للصدمة {counts.shockCount}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCat("")} className={`rounded-full px-3 py-1.5 text-sm font-bold ${!cat ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>الكل</button>
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${cat === c ? CATEGORY_META[c].badge : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
            {CATEGORY_META[c].label}
          </button>
        ))}
      </div>

      <div className="mb-6"><AdSlot label="إعلان مكتبة ECG" /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => <ECGCard key={p.id} p={p} />)}
        {list.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">لا توجد نتائج مطابقة.</div>}
      </div>
    </div>
  );
}
