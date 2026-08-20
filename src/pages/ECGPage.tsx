import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { useFavorites } from "../lib/favorites";

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
  | "block1"
  | "sinus-fast"
  | "sinus-slow"
  | "block2"
  | "block3"
  | "pvc"
  | "wenckebach"
  | "bbb-notch"
  | "lbbb-wide"
  | "junctional"
  | "stemi"
  | "pericarditis"
  | "ischemia"
  | "wpw"
  | "sinus-arrhythmia"
  | "pac"
  | "paced"
  | "shortqt"
  | "longqt"
  | "hypokalemia"
  | "mat"
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
  { id: "block1", nameAr: "الإحصار من الدرجة الأولى", nameEn: "1st-Degree AV Block", category: "watch", desc: "فترة PR مطوّلة فقط (>0.20 ثانية)، كل موجة P متبوعة بـQRS.", needsCPR: false, shockable: false, rate: "60-100", wave: "block1",
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
  { id: "lbbb", nameAr: "إحصار الحزمة اليسرى (LBBB)", nameEn: "Left Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليسرى — QRS عريض، قد يخفي علامات احتشاء أخرى على ECG.", needsCPR: false, shockable: false, rate: "60-100", wave: "lbbb-wide",
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
  { id: "mat", nameAr: "تسرع الأذيني متعدد البؤر (MAT)", nameEn: "Multifocal Atrial Tachycardia", category: "urgent", desc: "3 أشكال مختلفة على الأقل لموجة P في نفس الشريط — غالبًا مرتبط بأمراض الرئة المزمنة (COPD).", needsCPR: false, shockable: false, rate: "100-180", wave: "mat",
    causes: ["تفاقم مرض الانسداد الرئوي المزمن (COPD)", "نقص الأكسجين", "اختلال كهارل"],
    treatment: ["عالج المرض الرئوي الكامن ونقص الأكسجين أولًا", "حاصرات قنوات الكالسيوم قد تُستخدم", "تجنب الديجوكسين عادة"],
    memoryTrick: "3 أشكال مختلفة لموجة P على الأقل" },
  { id: "pericarditis", nameAr: "نمط ECG في التهاب التامور", nameEn: "Pericarditis ECG Pattern", category: "urgent", desc: "ارتفاع ST منتشر بشكل سرج (Saddle-shaped) مع انخفاض PR — يختلف عن احتشاء واحد بمنطقة محددة.", needsCPR: false, shockable: false, rate: "متغير", wave: "pericarditis",
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
      // Very fast narrow-QRS tachycardia. Previously each beat was just baseline→peak→
      // dip→baseline with zero gap before the next beat started, so the whole thing
      // rendered as a continuous sawtooth/triangle-wave with no distinguishable
      // between-beat feature — not what real SVT looks like. Added a small rounded
      // T-hump between beats (matching the reference figure), and tightened the point
      // spacing on both sides of the peak so it stays sharp despite the wider beat.
      const width = 46;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.18, base);
        push(x + width * 0.24, base - 34);
        push(x + width * 0.3, base + 10);
        push(x + width * 0.5, base - 6);
        push(x + width * 0.75, base);
        push(x + width, base);
      }
      break;
    }
    case "narrow-irregular": {
      // irregularly-irregular narrow QRS complexes with no P wave (AFib / MAT-shared shape).
      // Widths measured directly from the user's reference figure (relative gaps between
      // its QRS peaks). The QRS reuses the same tightly-clustered point pattern as the
      // sinus-beat QRS below (fractions 0.19-0.27) — close point spacing is what forces
      // a sharp spike. Between beats, several small closely-spaced points (not one lone
      // wide-spaced bump like an earlier attempt, which overshot into a false 2nd peak)
      // trace fine fibrillatory "teeth" in the baseline — small amplitude, tight spacing,
      // so the curve stays jagged/textured instead of ballooning into another spike.
      const widths = [79, 62, 53, 85, 69, 68, 58, 51, 60, 64];
      let x = 0;
      let i = 0;
      while (x < W) {
        const width = widths[i % widths.length];
        push(x, base + (pr(i + 50) - 0.5) * 3);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base);
        push(x + width * 0.4, base + (pr(i + 70) - 0.5) * 6);
        push(x + width * 0.5, base + (pr(i + 80) - 0.5) * 6);
        push(x + width * 0.62, base + (pr(i + 90) - 0.5) * 6);
        push(x + width * 0.75, base + (pr(i + 95) - 0.5) * 6);
        push(x + width * 0.88, base + (pr(i + 99) - 0.5) * 6);
        x += width;
        i++;
      }
      push(x, base);
      break;
    }
    case "sawtooth": {
      // Small, smooth, single-rounded-hump F waves (not sharp triangular teeth —
      // the reference figure's F waves are gentle undulations, not spikes) at a fast
      // atrial rate, with a 4:1 conduction ratio: 3 unconducted F waves, then 1 that
      // breaks through into a sharp, tightly-clustered QRS spike, repeating.
      const toothWidth = 45;
      let i = 0;
      for (let x = 0; x < W; x += toothWidth) {
        if (i % 4 === 3) {
          push(x, base);
          push(x + toothWidth * 0.35, base + 3);
          push(x + toothWidth * 0.45, base);
          push(x + toothWidth * 0.55, base - 36);
          push(x + toothWidth * 0.65, base + 14);
          push(x + toothWidth * 0.75, base);
          push(x + toothWidth, base);
        } else {
          push(x, base);
          push(x + toothWidth * 0.5, base - 8);
          push(x + toothWidth, base);
        }
        i++;
      }
      break;
    }
    case "sinus-normal": {
      const width = 130;
      for (let x = 0; x < W; x += width) sinusBeat(x, width);
      break;
    }
    case "block1": {
      // Same P wave as a normal sinus beat, but the flat segment between the P wave
      // and the QRS is stretched out much longer — a prolonged PR interval (>0.20s),
      // which is the one thing that actually defines this rhythm and was previously
      // missing entirely (this pattern used to just reuse the plain sinus-normal wave).
      const width = 130;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base - 9);
        push(x + width * 0.15, base);
        push(x + width * 0.34, base);
        push(x + width * 0.36, base + 3);
        push(x + width * 0.38, base - 32);
        push(x + width * 0.4, base + 14);
        push(x + width * 0.42, base);
        push(x + width * 0.6, base - 9);
        push(x + width * 0.7, base);
        push(x + width, base);
      }
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
      // Early, wide PVC with a true compensatory pause: the beat right before the PVC
      // fires early (shortened gap) and the PVC's own beat is widened (delayed next
      // beat), so the interval from the normal beat before the PVC to the normal beat
      // after it equals exactly 2x the regular RR — matching the reference figure's
      // "2 x RR" brace, not just a vaguely-larger gap after a compressed shape.
      const RR = 130;
      const early = 40;
      let x = 0;
      let i = 0;
      while (x < W) {
        const isPVC = i % 3 === 2;
        const isBeforePVC = i % 3 === 1;
        const width = isPVC ? RR + early : isBeforePVC ? RR - early : RR;
        if (isPVC) wideBeat(x, width, 1);
        else sinusBeat(x, width);
        x += width;
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
      // PR (P-to-QRS gap) progressively lengthens over 3 beats, then a P wave with no
      // QRS (dropped beat), then repeat. Cycle widened and the PR step exaggerated
      // versus a first pass at this shape so each PR segment is wide enough on screen
      // to carry a readable bracket annotation (see PATTERN_ANNOTATIONS.wenckebach).
      const cycle = 600;
      for (let c = 0; c < W; c += cycle) {
        for (let n = 0; n < 4; n++) {
          const start = c + n * (cycle / 4);
          const prGap = 40 + n * 35;
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
      // RBBB: wide QRS with an rsR' notch (small r, deep S, taller second R') — the
      // "rabbit ears" / M shape in V1, matching the reference figure's RBBB column.
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
    case "lbbb-wide": {
      // LBBB: minimal/absent initial r, then a deep S with a small double-dip notch
      // (the "W" at the bottom), followed by one broad discordant hump — matching the
      // reference figure's LBBB column (deep S, r wave <30ms or absent) instead of
      // sharing RBBB's rabbit-ears shape.
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.05, base + 2);
        push(x + width * 0.1, base + 32);
        push(x + width * 0.14, base + 22);
        push(x + width * 0.18, base + 34);
        push(x + width * 0.26, base + 8);
        push(x + width * 0.34, base - 8);
        push(x + width * 0.48, base - 20);
        push(x + width * 0.62, base - 8);
        push(x + width * 0.78, base);
        push(x + width, base);
      }
      break;
    }
    case "junctional": {
      // narrow regular QRS at a slow rate; T wave after it, then a clear inverted
      // (downward V) P wave right before the next QRS — not a single subtle point
      // right after the QRS, which got smoothed away to almost nothing before.
      const width = 170;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.05, base + 3);
        push(x + width * 0.08, base - 34);
        push(x + width * 0.11, base + 12);
        push(x + width * 0.14, base);
        push(x + width * 0.3, base - 8);
        push(x + width * 0.4, base);
        push(x + width * 0.85, base);
        push(x + width * 0.9, base + 16);
        push(x + width * 0.94, base);
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
    case "pericarditis": {
      // Diffuse, saddle-shaped ST elevation plus PR-segment depression — the two
      // features that actually distinguish this from a focal STEMI, which this
      // pattern used to silently reuse (plain "stemi" wave, no PR depression, no
      // saddle shape at all).
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.15, base + 4);
        push(x + width * 0.19, base + 4);
        push(x + width * 0.21, base + 6);
        push(x + width * 0.23, base - 34);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base - 14);
        push(x + width * 0.34, base - 18);
        push(x + width * 0.4, base - 12);
        push(x + width * 0.48, base - 18);
        push(x + width * 0.6, base - 10);
        push(x + width * 0.72, base);
        push(x + width, base);
      }
      break;
    }
    case "mat": {
      // Narrow-QRS tachycardia where the P wave's shape changes beat to beat — at
      // least 3 different morphologies from different atrial pacemaker sites, this
      // pattern's one defining feature. There was previously no case for "mat" at
      // all in this switch, so it silently fell back to a flat line (see the
      // pts.length === 0 fallback below).
      const width = 95;
      let i = 0;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        if (i % 3 === 0) {
          // small rounded P
          push(x + width * 0.06, base - 7);
          push(x + width * 0.11, base);
        } else if (i % 3 === 1) {
          // taller, peaked P
          push(x + width * 0.05, base - 3);
          push(x + width * 0.08, base - 13);
          push(x + width * 0.11, base);
        } else {
          // small notched/bifid P
          push(x + width * 0.05, base - 2);
          push(x + width * 0.075, base - 6);
          push(x + width * 0.1, base - 2);
          push(x + width * 0.12, base);
        }
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.27, base);
        push(x + width * 0.45, base - 8);
        push(x + width * 0.55, base);
        push(x + width, base);
        i++;
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
      // short PR interval and a slurred upstroke (delta wave) into a wide QRS. The
      // slur is spread across several gradually-rising points (a visible ramp) before
      // a sharp, tightly-clustered peak — a short, closely-spaced slur reads as just
      // a slightly rounded onset once curve-smoothed, not a distinct gradual ramp.
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.13, base);
        push(x + width * 0.16, base - 3);
        push(x + width * 0.2, base - 8);
        push(x + width * 0.24, base - 14);
        push(x + width * 0.27, base - 36);
        push(x + width * 0.29, base + 14);
        push(x + width * 0.31, base);
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
      // normal sinus beats with one early beat every cycle group. The early beat fires
      // from a different (ectopic) atrial focus, so its P wave has a different — here
      // notched/bifid — shape rather than the smooth single hump of a sinus P wave,
      // on top of the short, irregular R-R interval.
      const width = 130;
      const pacBeat = (start: number, w: number) => {
        push(start, base);
        push(start + w * 0.04, base - 2);
        push(start + w * 0.07, base - 11);
        push(start + w * 0.095, base - 4);
        push(start + w * 0.12, base - 7);
        push(start + w * 0.16, base);
        push(start + w * 0.19, base);
        push(start + w * 0.21, base + 3);
        push(start + w * 0.23, base - 32);
        push(start + w * 0.25, base + 14);
        push(start + w * 0.27, base);
        push(start + w * 0.45, base - 9);
        push(start + w * 0.55, base);
        push(start + w, base);
      };
      let i = 0;
      for (let x = 0; x < W; ) {
        if (i % 3 === 2) {
          const early = width * 0.7;
          pacBeat(x, early);
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
      // ST depression, then a broad flattened T wave, then a distinct separate U
      // wave bump after it — previously there was no ST depression at all and the
      // T/U bumps were both tiny and similar, not reading as two distinct features
      // like the reference figure (ST depression → flat T → U wave).
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base);
        push(x + width * 0.19, base);
        push(x + width * 0.21, base + 3);
        push(x + width * 0.23, base - 32);
        push(x + width * 0.25, base + 14);
        push(x + width * 0.28, base + 7);
        push(x + width * 0.38, base + 7);
        push(x + width * 0.55, base - 8);
        push(x + width * 0.7, base);
        push(x + width * 0.8, base - 5);
        push(x + width * 0.9, base);
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
  // Sort strictly by x (guards against any out-of-order pushes, e.g. interleaved P/QRS
  // sequences) and rescale so the pattern spans exactly 0..W. This guarantees the
  // looped duplicate copy (drawn at translateX(800)) lines up perfectly with no seam,
  // which was the cause of the overlapping/glitchy look.
  pts.sort((a, b) => a[0] - b[0]);
  const lastX = pts[pts.length - 1][0];
  const scale = lastX > 0 ? W / lastX : 1;
  const scaled = pts.map(([x, y]) => [x * scale, y] as [number, number]);

  // Sawtooth (atrial flutter) must keep its sharp angular "teeth" — that jagged
  // shape is the whole diagnostic point — so it stays as straight segments.
  if (kind === "sawtooth") {
    return "M" + scaled.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  }
  return catmullRomPath(scaled);
}

// Draws a smooth curve that passes exactly through every point (Catmull-Rom → cubic
// Bezier). This rounds P/T-wave humps into proper curves instead of angular zigzags,
// while still hitting the exact QRS peak coordinates so spikes stay sharp and accurate.
function catmullRomPath(pts: [number, number][]): string {
  if (pts.length < 3) {
    return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// A landmark/annotation drawn over (row: "top") or under (row: "bottom") the wave,
// positioned as a percentage of the pattern's width (0-100). Three kinds:
// "bracket" spans a range (x1-x2) with a label, e.g. explaining a stretch of beats.
// "arrow" points at a single spot (x) with a short label, e.g. flagging one abnormal
// beat feature against its normal neighbors — the way printed ECG figures do.
// "tag" is a plain small label with no arrow/bracket glyph — for basic beat-anatomy
// teaching (naming the P wave, QRS, T wave) rather than flagging a clinical finding.
type WaveAnnotation =
  | { kind: "bracket"; label: string; x1: number; x2: number; row: "top" | "bottom" }
  | { kind: "arrow"; label?: string; x: number; row: "top" | "bottom" }
  | { kind: "tag"; label: string; x: number; row: "top" | "bottom" };

// Shared by both AFib patterns (afib-rvr / afib-controlled). Top: a few simple
// arrows pointing at the flat/jagged baseline between beats — where a P wave would
// normally sit but doesn't. Bottom: two adjacent brackets contrasting one narrow and
// one wide R-R interval back to back (beats 2→3 vs 3→4 in the width sequence — 53 vs
// 85 — read directly off the wave's own widths array), to make the irregular spacing
// concrete rather than just saying "irregular" in words.
const AFIB_ANNOTATIONS: WaveAnnotation[] = [
  { kind: "arrow", label: "بدون موجة P", x: 20, row: "top" },
  { kind: "arrow", x: 50, row: "top" },
  { kind: "arrow", x: 80, row: "top" },
  { kind: "bracket", label: "ضيقة", x1: 18.17, x2: 25.33, row: "bottom" },
  { kind: "bracket", label: "واسعة", x1: 25.33, x2: 34.98, row: "bottom" },
];

// Keyed by pattern id (not wave shape) since the explanation is specific to that
// clinical pattern. Add more entries here to enable the pause+label behavior for
// other patterns — patterns with no entry keep scrolling continuously as before.
const PATTERN_ANNOTATIONS: Partial<Record<string, WaveAnnotation[]>> = {
  "sinus-arrhythmia": [
    { kind: "bracket", label: "الفترة بين النبضات مش ثابتة", x1: 14, x2: 83, row: "top" },
    { kind: "bracket", label: "زفير — المعدل بيقل", x1: 0, x2: 47, row: "bottom" },
    { kind: "bracket", label: "شهيق — المعدل بيزيد", x1: 53, x2: 100, row: "bottom" },
  ],
  "pac": [
    { kind: "arrow", label: "موجة P مختلفة الشكل", x: 33, row: "top" },
    { kind: "arrow", label: "موجة P مختلفة الشكل", x: 77, row: "top" },
    { kind: "tag", label: "P", x: 1.57, row: "bottom" },
    { kind: "tag", label: "QRS", x: 3.29, row: "bottom" },
    { kind: "tag", label: "T", x: 6.43, row: "bottom" },
  ],
  "afib-rvr": AFIB_ANNOTATIONS,
  "afib-controlled": AFIB_ANNOTATIONS,
  "block1": [
    { kind: "arrow", label: "فترة PR مطوّلة", x: 17.79, row: "top" },
    { kind: "arrow", x: 46.36, row: "top" },
    { kind: "arrow", x: 74.93, row: "top" },
    { kind: "tag", label: "QRS", x: 5.43, row: "bottom" },
    { kind: "tag", label: "T", x: 8.57, row: "bottom" },
  ],
  "wenckebach": [
    { kind: "bracket", label: "PR", x1: 0.83, x2: 4.15, row: "bottom" },
    { kind: "bracket", label: "PR", x1: 13.28, x2: 19.5, row: "bottom" },
    { kind: "bracket", label: "PR", x1: 25.73, x2: 34.85, row: "bottom" },
  ],
  "junctional": [
    { kind: "arrow", label: "P مقلوبة", x: 18, row: "bottom" },
    { kind: "arrow", x: 38, row: "bottom" },
    { kind: "arrow", x: 58, row: "bottom" },
    { kind: "tag", label: "QRS", x: 1.6, row: "top" },
    { kind: "tag", label: "T", x: 6, row: "top" },
  ],
  "pvcs": [
    { kind: "arrow", label: "PVC مبكرة", x: 26.98, row: "top" },
    { kind: "arrow", x: 69.84, row: "top" },
    { kind: "bracket", label: "2×RR", x1: 16.56, x2: 46.14, row: "bottom" },
  ],
  "wpw": [
    { kind: "arrow", label: "موجة دلتا", x: 20, row: "top" },
    { kind: "arrow", x: 53.33, row: "top" },
    { kind: "arrow", x: 86.67, row: "top" },
    { kind: "tag", label: "P", x: 1, row: "bottom" },
    { kind: "tag", label: "QRS", x: 4.5, row: "bottom" },
    { kind: "tag", label: "T", x: 7.5, row: "bottom" },
  ],
  "svt": [{ kind: "bracket", label: "معدل > 150 — بدون موجة P واضحة", x1: 3, x2: 97, row: "bottom" }],
  "block2-2": [
    { kind: "arrow", label: "PR ثابت", x: 1.89, row: "top" },
    { kind: "arrow", x: 13.0, row: "top" },
    { kind: "arrow", x: 35.22, row: "top" },
    { kind: "arrow", label: "QRS ساقطة", x: 24.44, row: "bottom" },
    { kind: "arrow", x: 57.78, row: "bottom" },
  ],
  "aflutter": [
    { kind: "arrow", label: "موجة رفرفة (F wave)", x: 2.78, row: "bottom" },
    { kind: "arrow", x: 8.33, row: "bottom" },
    { kind: "arrow", x: 13.89, row: "bottom" },
    { kind: "arrow", label: "QRS موصّل", x: 19.72, row: "top" },
  ],
  "ischemia": [
    { kind: "arrow", label: "انخفاض ST", x: 5.67, row: "bottom" },
    { kind: "arrow", x: 22.33, row: "bottom" },
    { kind: "arrow", x: 39, row: "bottom" },
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
  ],
  "nstemi": [
    { kind: "arrow", label: "انخفاض ST", x: 5.67, row: "bottom" },
    { kind: "arrow", x: 22.33, row: "bottom" },
    { kind: "arrow", x: 39, row: "bottom" },
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
  ],
  "mat": [
    { kind: "arrow", label: "أشكال P مختلفة", x: 0.67, row: "top" },
    { kind: "arrow", x: 12, row: "top" },
    { kind: "arrow", x: 23.06, row: "top" },
  ],
  "pericarditis": [
    { kind: "arrow", label: "PR منخفض", x: 2.8, row: "bottom" },
    { kind: "arrow", label: "ST مرتفع (سرجي)", x: 4.5, row: "top" },
  ],
  "hypokalemia-ecg": [
    { kind: "arrow", label: "انخفاض ST", x: 5.5, row: "top" },
    { kind: "arrow", label: "تسطح T", x: 9.17, row: "top" },
    { kind: "arrow", label: "موجة U", x: 13.33, row: "top" },
    { kind: "bracket", label: "QT مطوّلة", x1: 4.67, x2: 15, row: "bottom" },
  ],
  "longqt": [
    { kind: "arrow", label: "T متأخرة وعريضة", x: 13.6, row: "top" },
    { kind: "bracket", label: "QT مطوّلة", x1: 4.4, x2: 16, row: "bottom" },
  ],
  "hypocalcemia-ecg": [{ kind: "bracket", label: "ST مطوّلة — QT مطوّلة", x1: 4.4, x2: 16, row: "bottom" }],
  // First batch of plain beat-anatomy labels (P wave / QRS / T wave), for readers who
  // don't yet know what each part of a beat is called — separate from the clinical
  // arrows/brackets elsewhere, which flag what's *different* about a given rhythm.
  // Starting with the plain sinus-rhythm patterns since they're the reference point
  // every other pattern gets compared against; more patterns to follow the same way.
  "nsr": [
    { kind: "tag", label: "P", x: 1.57, row: "top" },
    { kind: "tag", label: "QRS", x: 3.29, row: "top" },
    { kind: "tag", label: "T", x: 6.43, row: "top" },
  ],
  "sinus-tach": [
    { kind: "tag", label: "P", x: 1.1, row: "top" },
    { kind: "tag", label: "QRS", x: 2.3, row: "top" },
    { kind: "tag", label: "T", x: 4.5, row: "top" },
  ],
  "sinus-brady": [
    { kind: "tag", label: "P", x: 2.75, row: "top" },
    { kind: "tag", label: "QRS", x: 5.75, row: "top" },
    { kind: "tag", label: "T", x: 11.25, row: "top" },
  ],
  "rbbb": [
    { kind: "tag", label: "P", x: 0.86, row: "bottom" },
    { kind: "tag", label: "QRS", x: 3.14, row: "bottom" },
    { kind: "tag", label: "T", x: 7.86, row: "bottom" },
  ],
  "lbbb": [
    { kind: "tag", label: "QRS", x: 1.67, row: "bottom" },
    { kind: "tag", label: "T", x: 8, row: "bottom" },
  ],
  "shortqt": [
    { kind: "tag", label: "P", x: 0.86, row: "top" },
    { kind: "tag", label: "QRS", x: 3.29, row: "top" },
    { kind: "tag", label: "T", x: 4.57, row: "top" },
  ],
  "hyperkalemia-ecg": [
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 6, row: "top" },
  ],
  "pe-ecg": [
    { kind: "tag", label: "P", x: 0.86, row: "top" },
    { kind: "tag", label: "QRS", x: 3.14, row: "top" },
    { kind: "tag", label: "T", x: 6.43, row: "top" },
  ],
  "stemi": [
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "ST", x: 4.5, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
  ],
  // The 3 MI-location patterns intentionally share the exact same waveform shape —
  // a single generic lead strip can't actually show WHICH leads have ST elevation,
  // and that's the real thing that tells them apart clinically, not the QRS/ST/T
  // shape itself. So instead of faking a shape difference, each gets a bracket over
  // its ST elevation naming the specific leads involved (matching each pattern's own
  // desc text) — that becomes the visible differentiator.
  "mi-lateral": [
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
    { kind: "bracket", label: "ST مرتفع في I, aVL, V5-V6", x1: 4.5, x2: 7, row: "bottom" },
  ],
  "mi-anterior": [
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
    { kind: "bracket", label: "ST مرتفع في V1-V4", x1: 4.5, x2: 7, row: "bottom" },
  ],
  "mi-inferior": [
    { kind: "tag", label: "P", x: 1, row: "top" },
    { kind: "tag", label: "QRS", x: 3.83, row: "top" },
    { kind: "tag", label: "T", x: 9.17, row: "top" },
    { kind: "bracket", label: "ST مرتفع في II, III, aVF", x1: 4.5, x2: 7, row: "bottom" },
  ],
  "paced": [
    { kind: "tag", label: "Pacer Spike", x: 0.24, row: "top" },
    { kind: "tag", label: "QRS", x: 2.33, row: "top" },
    { kind: "tag", label: "T", x: 8.33, row: "top" },
  ],
  // Critical/malignant rhythms: no normal P-QRS-T to label, so instead of generic
  // anatomy tags these get a single explanatory bracket/arrow naming the one thing
  // that actually defines the rhythm on the strip.
  "asystole": [{ kind: "bracket", label: "خط مستقيم — لا يوجد نشاط كهربائي للقلب", x1: 3, x2: 97, row: "top" }],
  "vf-coarse": [{ kind: "bracket", label: "نشاط كهربائي فوضوي — لا QRS منظم خالص", x1: 3, x2: 97, row: "top" }],
  "vf-fine": [{ kind: "bracket", label: "رجفان بسعة منخفضة — سهل يتلخبط بخط مسطح", x1: 3, x2: 97, row: "top" }],
  "vt-mono": [{ kind: "arrow", label: "QRS عريض ومنتظم — بدون موجة P", x: 8, row: "top" }],
  "torsades": [{ kind: "bracket", label: "محور QRS بيدور حول خط الأساس", x1: 0, x2: 45, row: "top" }],
  "pea": [{ kind: "bracket", label: "نظم منظم على الشاشة — لكن من غير نبض فعلي", x1: 3, x2: 97, row: "top" }],
};

function AnnotationMark({ a }: { a: WaveAnnotation }) {
  if (a.kind === "arrow") {
    return (
      <div className="absolute top-0 flex flex-col items-center" style={{ left: `${a.x}%`, transform: "translateX(-50%)" }}>
        {a.row === "top" ? (
          <>
            {a.label && <span className="whitespace-nowrap text-[9px] font-bold leading-tight text-red-500">{a.label}</span>}
            <span className="text-sm leading-none text-red-500">↓</span>
          </>
        ) : (
          <>
            <span className="text-sm leading-none text-red-500">↑</span>
            {a.label && <span className="whitespace-nowrap text-[9px] font-bold leading-tight text-red-500">{a.label}</span>}
          </>
        )}
      </div>
    );
  }
  if (a.kind === "tag") {
    return (
      <div className="absolute top-0 flex flex-col items-center" style={{ left: `${a.x}%`, transform: "translateX(-50%)" }}>
        <span className="whitespace-nowrap rounded bg-slate-700/70 px-1 text-[9px] font-semibold leading-tight text-slate-200">{a.label}</span>
      </div>
    );
  }
  const width = a.x2 - a.x1;
  return (
    <div className="absolute top-0 flex flex-col items-center" style={{ left: `${a.x1}%`, width: `${width}%` }}>
      {a.row === "top" ? (
        <>
          <span className="whitespace-nowrap text-[9px] font-bold leading-tight text-slate-500 dark:text-slate-300">{a.label}</span>
          <span className="mt-0.5 h-1.5 w-full rounded-t border-l-2 border-r-2 border-t-2 border-slate-400 dark:border-slate-500" />
        </>
      ) : (
        <>
          <span className="h-1.5 w-full rounded-b border-b-2 border-l-2 border-r-2 border-slate-400 dark:border-slate-500" />
          <span className="mt-0.5 whitespace-nowrap text-[9px] font-bold leading-tight text-slate-500 dark:text-slate-300">{a.label}</span>
        </>
      )}
    </div>
  );
}

function ECGWave({ kind, colorClass, annotations }: { kind: WaveKind; colorClass: string; annotations?: WaveAnnotation[] }) {
  const d = useMemo(() => buildWavePath(kind), [kind]);
  const groupRef = useRef<SVGGElement | null>(null);
  const iterationRef = useRef(0);
  const pauseTimeoutRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const hasAnnotations = !!annotations && annotations.length > 0;

  // Every 2nd full loop of the scrolling animation, pause it and reveal the
  // landmark labels for a few seconds so a reader can actually read them, then
  // resume scrolling. Patterns with no annotations are left running as before.
  useEffect(() => {
    if (!hasAnnotations) return;
    const el = groupRef.current;
    if (!el) return;
    const onIteration = () => {
      iterationRef.current += 1;
      if (iterationRef.current % 2 === 0) {
        setPaused(true);
        pauseTimeoutRef.current = window.setTimeout(() => setPaused(false), 3200);
      }
    };
    el.addEventListener("animationiteration", onIteration);
    return () => {
      el.removeEventListener("animationiteration", onIteration);
      if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current);
    };
  }, [hasAnnotations]);

  return (
    <div className="relative">
      {hasAnnotations && (
        <div className="relative h-5 transition-opacity duration-300" style={{ opacity: paused ? 1 : 0 }}>
          {annotations!.filter((a) => a.row === "top").map((a, idx) => <AnnotationMark key={idx} a={a} />)}
        </div>
      )}
      <svg viewBox="0 0 800 100" preserveAspectRatio="none" className={`h-20 w-full ${colorClass}`}>
        <g ref={groupRef} className="ecg-trace-group" style={{ animationDuration: "3.5s", opacity: paused ? 0 : 1 }}>
          <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="ecg-glow-line" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="ecg-glow-line" transform="translate(800,0)" />
        </g>
        {/* Static, exactly-aligned single frame shown only while paused — the live
            animation above is hidden (not stopped) here rather than having its CSS
            animation paused mid-scroll, which used to freeze on a drifted offset and
            throw off every annotation position relative to the actual peaks. */}
        {paused && (
          <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className="ecg-glow-line" />
        )}
        {!paused && <circle cx="792" cy="50" r="4" fill="currentColor" className="ecg-cursor-dot" />}
      </svg>
      {hasAnnotations && (
        <div className="relative h-5 transition-opacity duration-300" style={{ opacity: paused ? 1 : 0 }}>
          {annotations!.filter((a) => a.row === "bottom").map((a, idx) => <AnnotationMark key={idx} a={a} />)}
        </div>
      )}
    </div>
  );
}

const waveColor: Record<Category, string> = {
  lethal: "text-slate-300",
  critical: "text-rose-400",
  urgent: "text-amber-400",
  watch: "text-sky-400",
  normal: "text-emerald-400",
};

// ---- Synthesized heart-sound audio (no external audio files needed) ----
const NO_PULSE_IDS = new Set(["pea", "vf-coarse", "vf-fine", "asystole"]);

function parseApproxBpm(rate: string): number {
  const nums = rate.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return 80;
  const values = nums.map(Number);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.min(220, Math.max(30, avg));
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
  return sharedAudioCtx;
}

function beep(ctx: AudioContext, time: number, freq: number, duration: number, gainPeak: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(gainPeak, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration + 0.03);
}

// S1 ("lub", lower + longer) then S2 ("dub", higher + shorter) within one cardiac cycle
function scheduleLubDub(ctx: AudioContext, startTime: number, bpm: number) {
  const cycle = 60 / bpm;
  beep(ctx, startTime, 90, 0.11, 0.35);
  beep(ctx, startTime + cycle * 0.32, 130, 0.08, 0.25);
}

function scheduleAlarmBeep(ctx: AudioContext, time: number) {
  beep(ctx, time, 880, 0.12, 0.3);
}

function ECGCard({ p }: { p: ECGPattern }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const schedulerRef = useRef<number | null>(null);
  const noPulse = NO_PULSE_IDS.has(p.id);
  const hasDetails = (p.causes && p.causes.length > 0) || (p.treatment && p.treatment.length > 0);
  const { isFav, toggleFav } = useFavorites();
  const saved = isFav(p.id);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) window.clearInterval(schedulerRef.current);
    };
  }, []);

  function stopSound() {
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setPlaying(false);
  }

  function toggleSound() {
    if (playing) {
      stopSound();
      return;
    }
    const ctx = getAudioCtx();
    if (noPulse) {
      // brief monitor alarm burst — illustrates that this rhythm has NO real perfusing pulse
      const now = ctx.currentTime + 0.05;
      for (let i = 0; i < 4; i++) scheduleAlarmBeep(ctx, now + i * 0.3);
      setPlaying(true);
      window.setTimeout(() => setPlaying(false), 1400);
      return;
    }
    const bpm = parseApproxBpm(p.rate);
    const cycleMs = (60 / bpm) * 1000;
    scheduleLubDub(ctx, ctx.currentTime + 0.05, bpm);
    schedulerRef.current = window.setInterval(() => {
      scheduleLubDub(ctx, ctx.currentTime + 0.02, bpm);
    }, cycleMs);
    setPlaying(true);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_META[p.category].badge}`}>{CATEGORY_META[p.category].label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400" dir="ltr">{p.rate} bpm</span>
          <button
            type="button"
            onClick={() => toggleFav(p.id)}
            aria-label={saved ? "إلغاء الحفظ" : "حفظ النمط"}
            className={`text-base leading-none ${saved ? "text-amber-500" : "text-slate-300 hover:text-slate-400 dark:text-slate-600"}`}
          >
            {saved ? "🔖" : "📑"}
          </button>
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">{p.nameEn}</h3>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{p.nameAr}</p>

      <div className="my-3 rounded-lg ecg-monitor-bg p-2">
        <ECGWave kind={p.wave} colorClass={waveColor[p.category]} annotations={PATTERN_ANNOTATIONS[p.id]} />
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
        <button
          type="button"
          onClick={toggleSound}
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${playing ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          {noPulse ? (playing ? "🔔 صوت المونيتور..." : "🔔 صوت المونيتور") : playing ? "⏸ إيقاف الصوت" : "🔈 سماع النبض"}
        </button>
        {hasDetails && (
          <button type="button" onClick={() => setOpen((s) => !s)} className="mr-auto text-xs font-bold text-sky-600 dark:text-sky-400">
            {open ? "− إخفاء الأسباب والعلاج" : "+ الأسباب والعلاج"}
          </button>
        )}
      </div>

      {noPulse && playing && (
        <div className="mt-2 text-xs font-semibold text-rose-500">🔇 ده صوت إنذار المونيتور بس — الإيقاع ده معندوش نبض حقيقي يتسمع بالسماعة.</div>
      )}

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

// Pairs of patterns students commonly mix up, shown side by side with the one-line
// distinction that actually separates them — the same idea as fixing the 3 MI
// patterns (which were told apart by a label, not a shape difference), applied
// proactively to the classic confusable pairs.
const COMPARISON_PAIRS: { aId: string; bId: string; note: string }[] = [
  { aId: "wenckebach", bId: "block2-2", note: "فينكباخ: PR بيطول تدريجيًا قبل السقوط. موبيتز 2: PR ثابت طول الوقت والسقوط يجي فجأة." },
  { aId: "svt", bId: "sinus-tach", note: "تسرع الجيوب بيبان تدريجيًا وموجة P موجودة. SVT بييجي/بيروح فجأة (on/off) وموجة P غالبًا مختفية." },
  { aId: "vt-mono", bId: "torsades", note: "VT أحادي الشكل: كل الضربات شكلها واحد. Torsades: محور QRS بيدور ويتغير حواليه — ومرتبط بإطالة QT." },
  { aId: "afib-rvr", bId: "aflutter", note: "AFib: بدون أي نمط منتظم للموجات الأذينية أو مسافات QRS. Flutter: موجات F منتظمة بشكل سن منشار بنسبة توصيل ثابتة غالبًا." },
  { aId: "rbbb", bId: "lbbb", note: "RBBB: شكل rsR' (أذنين أرنب/M) في V1. LBBB: S عميقة وموجة r ضعيفة أو غائبة، مع قبة واسعة واحدة — وممكن تخفي علامات احتشاء." },
];

function ComparisonPairCard({ aId, bId, note }: { aId: string; bId: string; note: string }) {
  const a = PATTERNS.find((p) => p.id === aId);
  const b = PATTERNS.find((p) => p.id === bId);
  if (!a || !b) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-2">
        {[a, b].map((p) => (
          <div key={p.id}>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${CATEGORY_META[p.category].badge}`}>{CATEGORY_META[p.category].label}</span>
            <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white" dir="ltr">{p.nameEn}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.nameAr}</p>
            <div className="my-2 rounded-lg ecg-monitor-bg p-1.5">
              <ECGWave kind={p.wave} colorClass={waveColor[p.category]} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">🔑 {note}</div>
    </div>
  );
}

function ComparisonSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <button type="button" onClick={() => setOpen((s) => !s)} className="flex w-full items-center justify-between px-4 py-3 text-right">
        <span className="font-bold text-slate-800 dark:text-slate-100">⚖️ أنماط بتتلخبط في بعض — قارنها جنب بعض</span>
        <span className="text-slate-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
          {COMPARISON_PAIRS.map((pair) => (
            <ComparisonPairCard key={pair.aId + pair.bId} {...pair} />
          ))}
        </div>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestion(): { correct: ECGPattern; options: ECGPattern[] } {
  const correct = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  const others = shuffle(PATTERNS.filter((p) => p.id !== correct.id)).slice(0, 3);
  return { correct, options: shuffle([correct, ...others]) };
}

function QuizMode() {
  const [question, setQuestion] = useState(() => pickQuestion());
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function pick(id: string) {
    if (picked) return;
    setPicked(id);
    setScore((s) => ({ correct: s.correct + (id === question.correct.id ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setQuestion(pickQuestion());
    setPicked(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">النتيجة: {score.correct} من {score.total}</span>
        <button type="button" onClick={() => setScore({ correct: 0, total: 0 })} className="text-xs font-bold text-sky-600 dark:text-sky-400">↺ إعادة البدء</button>
      </div>

      <p className="mb-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">إيه اسم النمط ده؟</p>
      <div className="rounded-lg ecg-monitor-bg p-2">
        <ECGWave kind={question.correct.wave} colorClass={waveColor[question.correct.category]} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((opt) => {
          const isCorrect = opt.id === question.correct.id;
          const isPicked = opt.id === picked;
          let style = "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
          if (picked) {
            if (isCorrect) style = "bg-emerald-500 text-white";
            else if (isPicked) style = "bg-rose-500 text-white";
            else style = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
          }
          return (
            <button key={opt.id} type="button" disabled={!!picked} onClick={() => pick(opt.id)} className={`rounded-xl px-3 py-2.5 text-right text-sm font-bold ${style}`}>
              <div dir="ltr">{opt.nameEn}</div>
              <div className="text-xs font-semibold opacity-80">{opt.nameAr}</div>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className={`text-sm font-bold ${picked === question.correct.id ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {picked === question.correct.id ? "✅ إجابة صح!" : "❌ إجابة غلط"}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{question.correct.desc}</p>
          {question.correct.memoryTrick && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">💡 {question.correct.memoryTrick}</div>
          )}
          <button type="button" onClick={next} className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
            التالي →
          </button>
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
  const [mode, setMode] = useState<"library" | "quiz">("library");
  const [savedOnly, setSavedOnly] = useState(false);
  const { favorites } = useFavorites();

  useSEO({
    title: `مكتبة ECG | ${settings.siteName}`,
    description: "مكتبة أنماط تخطيط القلب (ECG) مصنفة حسب الخطورة، مع الأسباب والتوجيهات التمريضية — أداة تعليمية للممرضين.",
    keywords: "ECG, تخطيط القلب, رسم القلب, رجفان بطيني, تسرع بطيني, تمريض",
  });

  const list = useMemo(() => {
    return PATTERNS.filter((p) => {
      const m = (p.nameAr + p.nameEn + p.desc).toLowerCase().includes(q.toLowerCase());
      const c = !cat || p.category === cat;
      const s = !savedOnly || favorites.includes(p.id);
      return m && c && s;
    });
  }, [q, cat, savedOnly, favorites]);

  const counts = useMemo(() => {
    const cprCount = PATTERNS.filter((p) => p.needsCPR).length;
    const shockCount = PATTERNS.filter((p) => p.shockable).length;
    return { cprCount, shockCount, total: PATTERNS.length };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "مكتبة ECG" }]} />
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-rose-600 to-slate-800 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-4xl sm:text-5xl">🫀</div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">مكتبة ECG</h1>
            <p className="mt-1 text-rose-50">{counts.total} نمط مصنّف حسب الخطورة — للمساعدة التعليمية فقط</p>
          </div>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "quiz" ? "library" : "quiz"))}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${mode === "quiz" ? "bg-white text-rose-700" : "bg-white/15 text-white hover:bg-white/25"}`}
          >
            {mode === "quiz" ? "📚 رجوع للمكتبة" : "🎯 اختبر نفسك"}
          </button>
        </div>
      </div>

      {mode === "quiz" ? (
        <QuizMode />
      ) : (
        <>
      <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        هذه المكتبة تعليمية ومرجعية فقط، والأشكال تخطيطية مبسّطة وليست تسجيلات حقيقية. لا تُستخدم بديلاً عن تفسير ECG الفعلي للمريض أو تقييم الطبيب.
      </div>

      <ComparisonSection />

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
        <button
          onClick={() => setSavedOnly((s) => !s)}
          className={`mr-auto rounded-full px-3 py-1.5 text-sm font-bold ${savedOnly ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          🔖 المحفوظة {favorites.length > 0 ? `(${favorites.length})` : ""}
        </button>
      </div>

      <div className="mb-6"><AdSlot label="إعلان مكتبة ECG" /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => <ECGCard key={p.id} p={p} />)}
        {list.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {savedOnly ? "لسه معملتش حفظ لأي نمط." : "لا توجد نتائج مطابقة."}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
