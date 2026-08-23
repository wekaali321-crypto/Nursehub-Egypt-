import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { useFavorites } from "../lib/favorites";
import { useCart } from "../lib/cart";

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
  // Richer detail-view fields (Smart Nurse–style tabs: خوارزمية/أسباب/أدوية/ميزات/إجراءات)
  algorithm?: string[];
  medications?: string[];
  features?: string[];
  ecgCriteria?: { p: string; pr: string; qrs: string; rhythm: string };
  symptoms?: string[];
  immediateActions?: string[];
  hAndT?: { h: string[]; t: string[] };
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
  { id: "pea", nameAr: "النشاط الكهربائي بلا نبض (PEA)", nameEn: "Pulseless Electrical Activity", category: "lethal", desc: "إيقاع منظم على الشاشة لكن بدون نبض فعلي — عالج السبب فورًا. (Organized rhythm on the monitor but no real pulse — treat the cause immediately.)", needsCPR: true, shockable: false, rate: "متغير", wave: "sinus-slow",
    causes: ["نقص حجم الدم الشديد (Severe hypovolemia)", "نقص الأكسجين (Hypoxia)", "استرواح الصدر الضاغط (Tension pneumothorax)", "الانصمام الرئوي (Pulmonary embolism)", "اضطراب شديد في الكهارل (Severe electrolyte disturbance)"],
    treatment: ["CPR فوري (Immediate CPR)", "علاج السبب الكامن (H's & T's) (Treat the underlying cause (H's & T's))", "أدرينالين حسب البروتوكول (Epinephrine per protocol)"],
    memoryTrick: "شاشة منظمة... لكن لا نبض حقيقي (Organized screen... but no real pulse)",
    algorithm: ["تأكد من غياب النبض رغم وجود نظم على الشاشة", "ابدأ CPR فورًا", "دوّر خلال H's & T's بحثًا عن سبب قابل للعلاج", "أدرينالين كل 3-5 دقائق", "لا صدمة كهربائية — الإيقاع غير قابل للصدمة"],
    medications: ["أدرينالين 1mg IV/IO كل 3-5 دقائق"],
    features: ["نظم منظم على الشاشة", "غياب تام للنبض الفعلي", "قد يشبه أي إيقاع منظم آخر"],
    ecgCriteria: { p: "متغيرة حسب الإيقاع الأساسي", pr: "متغير", qrs: "متغير (ضيق أو عريض)", rhythm: "منظم غالبًا لكن بدون نبض" },
    symptoms: ["فقدان الوعي", "غياب النبض عند الجس", "توقف تنفسي"],
    immediateActions: ["ابدأ CPR فورًا", "ابحث عن H's & T's وعالج السبب", "أدرينالين حسب البروتوكول", "لا تصدم كهربائيًا"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
  },
  { id: "vf-coarse", nameAr: "الرجفان البطيني (خشن)", nameEn: "Coarse Ventricular Fibrillation", category: "lethal", desc: "نشاط كهربائي فوضوي بلا نتاج قلبي — صدمة كهربائية فورية. (Chaotic electrical activity with no cardiac output — immediate defibrillation.)", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-coarse",
    causes: ["تسرع بطيني غير معالَج (Untreated ventricular tachycardia)", "احتشاء عضلة القلب (Myocardial infarction)", "اختلال شديد في الكهارل (Severe electrolyte imbalance)", "أدوية مسببة لاضطراب النظم (Pro-arrhythmic drugs)"],
    treatment: ["صدفة كهربائية فورية (لا تزامن) (Immediate unsynchronized shock)", "أوقف CPR فقط لحظة الصدمة (Pause CPR only for the shock itself)", "أدوية: ليدوكايين، أميودارون، بروكاييناميد (LAP) (Drugs: lidocaine, amiodarone, procainamide (LAP))"],
    memoryTrick: "Fib is flopping - خط متعرج فوضوي",
    algorithm: ["تحقق من غياب النبض", "CPR فوري", "صدمة كهربائية غير متزامنة فورًا", "أدرينالين بعد الصدمة الثانية", "أميودارون أو ليدوكايين لو استمر"],
    medications: ["أدرينالين 1mg IV/IO", "أميودارون 300mg IV (جرعة أولى)", "ليدوكايين كبديل"],
    features: ["خط متعرج فوضوي عالي السعة", "لا QRS منظم", "لا نبض إطلاقًا"],
    ecgCriteria: { p: "غير موجودة", pr: "غير قابل للقياس", qrs: "غير موجود / فوضوي", rhythm: "فوضوي تمامًا" },
    symptoms: ["فقدان وعي فوري", "غياب النبض", "توقف تنفسي"],
    immediateActions: ["CPR + صدمة كهربائية فورية", "أدرينالين بعد الصدمة الثانية", "أميودارون أو ليدوكايين لو استمر بعد 3 صدمات"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
  },
  { id: "asystole", nameAr: "الإيقاع المسطح (توقف القلب)", nameEn: "Asystole", category: "lethal", desc: "خط مستوٍ — توقف قلبي كامل غير قابل للصدمة. (Flatline — complete cardiac arrest, not a shockable rhythm.)", needsCPR: true, shockable: false, rate: "0", wave: "flat",
    causes: ["توقف قلبي تام (Complete cardiac arrest)", "نقص أكسجين شديد (Severe hypoxia)", "اختلال كهارل شديد (Severe electrolyte imbalance)", "توقف تنفسي طويل بدون تدخل (Prolonged untreated respiratory arrest)"],
    treatment: ["CPR مستمر (Continuous CPR)", "أدرينالين + أتروبين حسب البروتوكول (Epinephrine + atropine per protocol)", "لا صدمة كهربائية إطلاقًا (No defibrillation whatsoever)"],
    memoryTrick: "Assist Fully! المريض على خط مسطح",
    algorithm: ["تأكد بخط مسطح في أكتر من اتجاه (Protocol of Confirm)", "CPR مستمر", "أدرينالين كل 3-5 دقائق", "دوّر H's & T's", "لا صدمة كهربائية"],
    medications: ["أدرينالين 1mg IV/IO كل 3-5 دقائق"],
    features: ["خط مستقيم تمامًا", "لا نشاط كهربائي للقلب", "غير قابل للصدمة"],
    ecgCriteria: { p: "غير موجودة", pr: "غير موجود", qrs: "غير موجود", rhythm: "لا يوجد" },
    symptoms: ["فقدان وعي كامل", "غياب النبض والتنفس"],
    immediateActions: ["تأكد من التوصيلات أولًا (Protocol of Confirm)", "CPR مستمر بدون توقف", "أدرينالين حسب البروتوكول", "لا تصدم كهربائيًا إطلاقًا"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
  },

  // حرج
  { id: "torsades", nameAr: "تواء الأطراف (Torsades de Pointes)", nameEn: "Torsades de Pointes", category: "critical", desc: "شكل خاص من VT متعدد الأشكال مرتبط بإطالة QT — يُعالج بشكل مختلف عن VT العادي. (A special polymorphic VT linked to QT prolongation — treated differently from regular VT.)", needsCPR: true, shockable: true, rate: "200-250", wave: "wide-twisting",
    causes: ["احتشاء عضلة القلب (Myocardial infarction)", "نقص الأكسجين (Hypoxia)", "نقص المغنيسيوم الشديد (Severe hypomagnesemia)", "إطالة QT (خلقية أو دوائية) (QT prolongation (congenital or drug-induced))"],
    treatment: ["كبريتات المغنيسيوم وريديًا (العلاج الأساسي) (IV magnesium sulfate (mainstay treatment))", "صدمة كهربائية لو غير مستقر (Defibrillation if unstable)", "أوقف أي دواء يطيل QT (Stop any QT-prolonging drug)"],
    memoryTrick: "Tornado Pointes — دوامة ملتفة حول الخط",
    algorithm: ["قيّم الاستقرار الدموي", "لو غير مستقر: صدمة كهربائية", "كبريتات المغنيسيوم وريديًا فورًا", "أوقف أي دواء يطيل QT", "صحح البوتاسيوم والمغنيسيوم"],
    medications: ["كبريتات المغنيسيوم 1-2g IV (العلاج الأساسي)", "تصحيح بوتاسيوم/مغنيسيوم"],
    features: ["QRS متعدد الأشكال يدور حول خط الأساس", "مرتبط بإطالة QT سابقة", "قد يتحول لرجفان بطيني"],
    ecgCriteria: { p: "غير مرئية غالبًا", pr: "غير قابل للقياس", qrs: "عريض جدًا ومتغير الشكل والاتجاه", rhythm: "سريع وغير منتظم الشكل" },
    symptoms: ["دوخة أو إغماء", "خفقان شديد", "قد يتطور لتوقف قلبي"],
    immediateActions: ["كبريتات المغنيسيوم وريديًا فورًا", "صدمة كهربائية لو غير مستقر", "أوقف أي دواء يطيل QT"],
  },
  { id: "vt-mono", nameAr: "تسرع القلب البطيني (أحادي الشكل)", nameEn: "Monomorphic Ventricular Tachycardia", category: "critical", desc: "تسرع واسع القالب ومنتظم — قد يكون مميتًا إن لم يُعالج. (Wide-QRS, regular tachycardia — can be lethal if untreated.)", needsCPR: true, shockable: true, rate: "100-250", wave: "wide-regular",
    causes: ["احتشاء عضلة القلب (Myocardial infarction)", "نقص الأكسجين (Hypoxia)", "نقص البوتاسيوم أو المغنيسيوم (Hypokalemia or hypomagnesemia)"],
    treatment: ["بدون نبض: صدمة كهربائية فورية + CPR (Pulseless: immediate shock + CPR)", "بنبض غير مستقر: تقويم نظم متزامن (Cardioversion) (Unstable with pulse: synchronized cardioversion)", "بنبض مستقر: أدوية مضادة لاضطراب النظم (Stable with pulse: anti-arrhythmic drugs)"],
    memoryTrick: "V Tach Tombstone pattern — شكل شاهد القبر",
    algorithm: ["قيّم النبض", "بدون نبض: عامله زي VF (صدمة + CPR)", "بنبض وغير مستقر: تقويم نظم متزامن", "بنبض ومستقر: أدوية مضادة لاضطراب النظم"],
    medications: ["أميودارون 150mg IV (حالة مستقرة)", "أدرينالين لو بدون نبض"],
    features: ["QRS عريض ومنتظم", "كل الضربات نفس الشكل (أحادي الشكل)", "معدل سريع 100-250"],
    ecgCriteria: { p: "غالبًا غير مرئية (مدفونة في QRS)", pr: "غير قابل للقياس", qrs: "> 0.12 ثانية بشكل ثابت", rhythm: "منتظم" },
    symptoms: ["خفقان", "دوخة", "قد يفقد الوعي أو ينخفض الضغط"],
    immediateActions: ["قيّم النبض فورًا", "بدون نبض = صدمة + CPR", "بنبض غير مستقر = تقويم نظم متزامن", "بنبض مستقر = أميودارون"],
  },
  { id: "vf-fine", nameAr: "الرجفان البطيني (ناعم)", nameEn: "Fine Ventricular Fibrillation", category: "critical", desc: "رجفان بطيني بسعة منخفضة — قد يُشتبه بخطأ بالإيقاع المسطح. (Low-amplitude ventricular fibrillation — can be mistaken for a flat line.)", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-fine",
    causes: ["رجفان بطيني خشن لم يُعالج وتراجعت طاقته (Untreated coarse VF that has lost energy over time)", "نقص أكسجين مطوّل (Prolonged hypoxia)", "احتشاء واسع (Extensive infarction)"],
    treatment: ["تأكد أنه ليس إيقاعًا مسطحًا (تحقق من التوصيلات أولاً) (Confirm it isn't a flat line (check leads first))", "صدمة كهربائية فورية إذا تأكد التشخيص (Immediate shock once confirmed)", "CPR مستمر (Continuous CPR)"],
    memoryTrick: "شبيه بالمسطح لكنه ليس كذلك — تحقق دائمًا من التوصيلات (Looks flat but isn't — always check the leads)",
    algorithm: ["تحقق من التوصيلات (استبعد الخط المسطح)", "CPR فوري", "صدمة كهربائية إذا تأكد التشخيص", "أدرينالين وأميودارون حسب البروتوكول"],
    medications: ["أدرينالين 1mg IV/IO", "أميودارون 300mg IV"],
    features: ["سعة منخفضة جدًا", "قد يُشتبه به كخط مسطح", "لا نبض حقيقي"],
    ecgCriteria: { p: "غير موجودة", pr: "غير قابل للقياس", qrs: "غير موجود / فوضوي منخفض السعة", rhythm: "فوضوي" },
    symptoms: ["فقدان وعي فوري", "غياب النبض"],
    immediateActions: ["تأكد من التوصيلات أولًا", "CPR فوري", "صدمة كهربائية بعد التأكيد"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
  },
  { id: "block3", nameAr: "الإحصار الأذيني البطيني الكامل (الدرجة الثالثة)", nameEn: "Complete (3rd-Degree) Heart Block", category: "critical", desc: "انفصال تام بين نشاط الأذين والبطين — كل منهما بمعدله الخاص. (Complete dissociation between atrial and ventricular activity — each beats at its own rate.)", needsCPR: false, shockable: false, rate: "متغير (تفكك أذيني بطيني)", wave: "block3",
    causes: ["احتشاء عضلة القلب (خصوصًا السفلي) (Myocardial infarction (especially inferior))", "تليّف نظام التوصيل مع التقدم بالعمر (Age-related conduction system fibrosis)", "تسمم دوائي (ديجوكسين، حاصرات بيتا) (Drug toxicity (digoxin, beta-blockers))"],
    treatment: ["استعد لناظمة قلب مؤقتة/دائمة (Prepare for temporary/permanent pacing)", "أتروبين قد لا يكون فعالًا في هذا المستوى (Atropine may not be effective at this level)", "راقب علامات نقص التروية (Monitor for signs of hypoperfusion)"],
    memoryTrick: "P وQRS كل واحد ماشي لوحده — لا علاقة بينهما",
    algorithm: ["راقب علامات عدم الاستقرار (هبوط ضغط، ألم صدر، تغير وعي)", "أتروبين كخطوة أولى (قد لا يفلح في هذا المستوى)", "استعد لناظمة قلب مؤقتة عبر الجلد أو الوريد", "عالج السبب الكامن"],
    medications: ["أتروبين 0.5mg IV (غالبًا غير فعال في هذا المستوى)", "دوبامين أو أدرينالين كبديل لدعم المعدل"],
    features: ["انفصال تام بين موجات P وQRS", "معدل الأذين أسرع من معدل البطين", "لا علاقة زمنية ثابتة بينهما"],
    ecgCriteria: { p: "منتظمة لكن مستقلة عن QRS", pr: "متغير تمامًا بلا نمط", qrs: "ضيق أو عريض حسب مصدر الإيقاع الهارب", rhythm: "P منتظم وQRS منتظم، لكن كل منهما لوحده" },
    symptoms: ["دوخة شديدة", "إغماء", "ضيق تنفس", "ألم صدر"],
    immediateActions: ["استعد لناظمة قلب فورًا", "أتروبين كمحاولة أولى", "راقب علامات نقص التروية والاستقرار الدموي"],
  },

  // عاجل
  { id: "svt", nameAr: "تسرع فوق البطيني (SVT)", nameEn: "Supraventricular Tachycardia", category: "urgent", desc: "تسرع ضيق القالب ومنتظم بمعدل مرتفع جدًا، غالبًا بدون موجة P واضحة. (Narrow-QRS, regular tachycardia at a very high rate, often with no clear P wave.)", needsCPR: false, shockable: false, rate: "150-250", wave: "narrow-fast",
    causes: ["المنبهات (كافيين، مخدرات) (Stimulants (caffeine, drugs))", "المجهود الشديد (Intense exertion)", "نقص الأكسجين (Hypoxia)", "أمراض قلبية كامنة (Underlying heart disease)"],
    treatment: ["مناورة مبهمية (حبس نفس، ماء بارد على الوجه) (Vagal maneuvers (breath-holding, cold water on the face))", "أدينوزين دفعة سريعة ثم محلول ملحي فورًا (Rapid IV adenosine push followed by saline flush)", "تقويم نظم متزامن إذا فشل ما سبق (Synchronized cardioversion if the above fails)"],
    memoryTrick: "Super fast = Supraventricular",
    algorithm: ["قيّم الاستقرار الدموي (Assess stability)", "مستقر: مناورات مبهمية ثم أدينوزين (Vagal maneuvers then adenosine)", "غير مستقر: تقويم نظم متزامن (Synchronized cardioversion)"],
    medications: ["أدينوزين 6mg IV دفعة سريعة، ثم 12mg لو لزم (Adenosine rapid push)", "مانع قنوات كالسيوم كبديل (Calcium channel blocker as alternative)"],
    features: ["بداية ونهاية مفاجئة (Sudden onset/offset)", "موجة P غالبًا مختفية (P wave often absent)", "معدل ثابت جدًا 150-250 (Very fixed rate)"],
    ecgCriteria: { p: "غالبًا غير مرئية (Often not visible)", pr: "غير قابل للقياس (Not measurable)", qrs: "ضيق < 0.12 ثانية (Narrow)", rhythm: "منتظم جدًا (Very regular)" },
    symptoms: ["خفقان مفاجئ (Sudden palpitations)", "دوخة (Dizziness)", "ضيق تنفس (Shortness of breath)"],
    immediateActions: ["مناورات مبهمية أولًا (Vagal maneuvers first)", "أدينوزين لو استمر (Adenosine if persists)", "تقويم نظم لو غير مستقر (Cardioversion if unstable)"],
  },
  { id: "afib-rvr", nameAr: "رجفان أذيني بمعدل بطيني سريع (AFib RVR)", nameEn: "Atrial Fibrillation with RVR", category: "urgent", desc: "إيقاع ضيق القالب وغير منتظم تمامًا (irregularly irregular) بمعدل سريع. (Narrow-QRS, irregularly irregular rhythm at a fast rate.)", needsCPR: false, shockable: false, rate: "100-175", wave: "narrow-irregular",
    causes: ["مرض صمامي (Valvular disease)", "قصور القلب (Heart failure)", "ارتفاع ضغط الدم الرئوي (Pulmonary hypertension)", "COPD (COPD)", "بعد جراحة قلب (Post cardiac surgery)"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات بالإيكو عبر المريء (Cardioversion after ruling out clots via TEE)", "ديجوكسين (تحقق من ATP: النبض، السمية، البوتاسيوم قبل الإعطاء) (Digoxin (check ATP: pulse, toxicity, potassium before giving))", "مضادات تخثر (وارفارين) مع متابعة INR (Anticoagulation (warfarin) with INR follow-up)"],
    memoryTrick: "No P wave = Fibrillation Flopping",
    algorithm: ["قيّم الاستقرار (Assess stability)", "تحكم في المعدل أولًا (Rate control first)", "مضادات تخثر حسب خطر الجلطة (Anticoagulation per stroke risk)"],
    medications: ["ديلتيازم أو بيتا بلوكر للتحكم بالمعدل (Diltiazem or beta-blocker)", "مضاد تخثر (Anticoagulant, e.g. apixaban)"],
    features: ["إيقاع غير منتظم تمامًا (Irregularly irregular)", "بدون موجة P واضحة (No clear P wave)", "معدل بطيني سريع (Fast ventricular rate)"],
    ecgCriteria: { p: "غائبة، أمواج رجفان (Absent, fibrillatory waves)", pr: "غير قابل للقياس (Not measurable)", qrs: "ضيق غالبًا (Usually narrow)", rhythm: "غير منتظم تمامًا (Irregularly irregular)" },
    symptoms: ["خفقان (Palpitations)", "تعب (Fatigue)", "خطر تكوّن جلطات (Clot/stroke risk)"],
    immediateActions: ["تحكم في المعدل (Rate control)", "قيّم الحاجة لمضاد تخثر (Assess anticoagulation need)", "تقويم نظم لو غير مستقر (Cardioversion if unstable)"],
  },
  { id: "block2-2", nameAr: "الإحصار من الدرجة الثانية (النوع الثاني — موبيتز 2)", nameEn: "2nd-Degree AV Block, Type II (Mobitz II)", category: "urgent", desc: "قد يتطور فجأة لإحصار كامل — يحتاج مراقبة عاجلة واستعداد للناظمة. (May suddenly progress to complete block — needs urgent monitoring and pacing readiness.)", needsCPR: false, shockable: false, rate: "متغير", wave: "block2",
    causes: ["مرض في نظام التوصيل (كلا الحزمتين) (Disease in the conduction system (both bundles))", "احتشاء عضلة القلب (Myocardial infarction)", "تليّف نظام التوصيل (Conduction system fibrosis)"],
    treatment: ["استعد لناظمة قلب — قد يتطور فجأة لإحصار كامل (Prepare for pacing — may suddenly progress to complete block)", "راقب باستمرار ولا تعتمد على أتروبين وحده (Continuous monitoring; don't rely on atropine alone)"],
    memoryTrick: "إسقاط منتظم للـQRS — النمط ثابت ومتوقع",
    algorithm: ["راقب لتطور مفاجئ لإحصار كامل (Watch for sudden complete block)", "استعد لناظمة قلب (Prepare for pacing)", "تجنب أتروبين وحده (قد لا يكفي) (Atropine alone may be insufficient)"],
    medications: ["أتروبين كمحاولة مؤقتة (Atropine as temporary measure)", "استعداد لناظمة عبر الجلد (Transcutaneous pacing standby)"],
    features: ["فترة PR ثابتة قبل السقوط (Constant PR before drop)", "سقوط QRS فجأة بدون إنذار (Sudden unwarned dropped QRS)"],
    ecgCriteria: { p: "منتظمة (Regular)", pr: "ثابت (Constant)", qrs: "يسقط فجأة أحيانًا (Occasionally dropped)", rhythm: "غير منتظم بسبب السقوط (Irregular due to drops)" },
    symptoms: ["دوخة (Dizziness)", "إغماء محتمل (Possible syncope)"],
    immediateActions: ["راقب عن قرب لتطور إحصار كامل (Monitor closely for complete block)", "استعد لناظمة قلب (Prepare for pacing)"],
  },
  { id: "aflutter", nameAr: "رفرفة أذينية (Atrial Flutter)", nameEn: "Atrial Flutter", category: "urgent", desc: "موجات أذينية منتظمة بشكل سن المنشار، غالبًا بنسبة توصيل 2:1. (Regular sawtooth-shaped atrial waves, often with 2:1 conduction.)", needsCPR: false, shockable: false, rate: "غالبًا حوالي 150", wave: "sawtooth",
    causes: ["مرض صمامي (Valvular disease)", "قصور القلب (Heart failure)", "ارتفاع ضغط الدم الرئوي (Pulmonary hypertension)", "COPD (COPD)", "بعد جراحة قلب (Post cardiac surgery)"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات (Cardioversion after ruling out clots)", "ديجوكسين (تحقق من ATP قبل الإعطاء) (Digoxin (check ATP before giving))", "مضادات تخثر مع متابعة INR (Anticoagulation with INR follow-up)"],
    memoryTrick: "A Flutter = Sawtooth (شكل سن المنشار)",
    algorithm: ["قيّم الاستقرار والمعدل (Assess stability and rate)", "تحكم في المعدل أو تقويم نظم (Rate control or cardioversion)", "مضادات تخثر حسب الخطر (Anticoagulation per risk)"],
    medications: ["بيتا بلوكر أو ديلتيازم (Beta-blocker or diltiazem)", "مضاد تخثر (Anticoagulant)"],
    features: ["موجات F منتظمة بشكل سن المنشار (Regular sawtooth F waves)", "نسبة توصيل ثابتة غالبًا (Often fixed conduction ratio)"],
    ecgCriteria: { p: "غائبة، أمواج F (Absent, F waves)", pr: "غير قابل للقياس (Not measurable)", qrs: "ضيق غالبًا (Usually narrow)", rhythm: "منتظم غالبًا (Usually regular)" },
    symptoms: ["خفقان (Palpitations)", "تعب (Fatigue)"],
    immediateActions: ["تحكم في المعدل (Rate control)", "قيّم مضاد التخثر (Assess anticoagulation)"],
  },

  // مراقبة
  { id: "afib-controlled", nameAr: "رجفان أذيني بمعدل متحكم", nameEn: "Atrial Fibrillation, Rate-Controlled", category: "watch", desc: "نفس عدم الانتظام لكن بمعدل ضمن الطبيعي — راقب فقط. (Same irregularity as AFib but with a rate within normal range — monitor only.)", needsCPR: false, shockable: false, rate: "60-100", wave: "narrow-irregular",
    causes: ["نفس أسباب AFib RVR لكن معدل مضبوط بالعلاج (Same causes as AFib RVR, but rate controlled with treatment)"], treatment: ["استمرار متابعة معدل النظم والأدوية الحالية (Continue monitoring rate control and current medications)"], memoryTrick: "No P wave لكن المعدل طبيعي",
    algorithm: ["راقب المعدل والأعراض (Monitor rate and symptoms)", "استمر في مضاد التخثر المقرر (Continue prescribed anticoagulation)"],
    medications: ["استمرار على بيتا بلوكر/ديلتيازم حسب الوصفة (Continue beta-blocker/diltiazem as prescribed)"],
    features: ["نفس عدم انتظام AFib لكن بمعدل طبيعي (Same AFib irregularity, normal rate)", "بدون موجة P (No P wave)"],
    ecgCriteria: { p: "غائبة (Absent)", pr: "غير قابل للقياس (Not measurable)", qrs: "ضيق (Narrow)", rhythm: "غير منتظم لكن بمعدل طبيعي (Irregular, normal rate)" },
    symptoms: ["غالبًا بدون أعراض (Often asymptomatic)"],
    immediateActions: ["راقب فقط (Monitor only)", "استمر في العلاج المقرر (Continue prescribed treatment)"],
  },
  { id: "block1", nameAr: "الإحصار من الدرجة الأولى", nameEn: "1st-Degree AV Block", category: "watch", desc: "فترة PR مطوّلة فقط (>0.20 ثانية)، كل موجة P متبوعة بـQRS. (Only a prolonged PR interval (>0.20s); every P wave is followed by a QRS.)", needsCPR: false, shockable: false, rate: "60-100", wave: "block1",
    causes: ["زيادة توتر العصب المبهم (Increased vagal tone)", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم) (Medications (beta-blockers, calcium channel blockers))", "تليّف بسيط في العقدة الأذينية البطينية (Mild AV node fibrosis)"],
    treatment: ["غالبًا لا يحتاج علاج — راقب فقط (Usually needs no treatment — monitor only)", "راجع الأدوية المسببة إذا كانت هي السبب (Review causative medications if applicable)"],
    memoryTrick: "PR interval طويل وثابت فقط — لا إسقاط للـQRS",
    algorithm: ["لا يحتاج تدخل عادةً (Usually no intervention needed)", "راجع الأدوية المسببة (مثل بيتا بلوكر) (Review causative meds)"],
    medications: ["لا يوجد علاج نوعي عادة (No specific treatment usually needed)"],
    features: ["فترة PR مطوّلة فقط > 0.20 ثانية (Only prolonged PR > 0.20s)", "كل موجة P متبوعة بـQRS (Every P followed by QRS)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "> 0.20 ثانية (Prolonged)", qrs: "طبيعي (Normal)", rhythm: "منتظم (Regular)" },
    symptoms: ["غالبًا بدون أعراض (Usually asymptomatic)"],
    immediateActions: ["راقب فقط (Monitor only)", "لا تدخل مطلوب عادة (No intervention usually required)"],
  },
  { id: "wenckebach", nameAr: "الإحصار من الدرجة الثانية (النوع الأول — فينكباخ)", nameEn: "2nd-Degree AV Block, Type I (Wenckebach)", category: "watch", desc: "إطالة تدريجية في PR interval حتى يسقط QRS، ثم تتكرر الدورة. (Progressive PR-interval lengthening until a QRS is dropped, then the cycle repeats.)", needsCPR: false, shockable: false, rate: "متغير", wave: "wenckebach",
    causes: ["زيادة توتر العصب المبهم (Increased vagal tone)", "احتشاء عضلة القلب السفلي (Inferior myocardial infarction)", "أدوية تبطئ التوصيل (Drugs that slow conduction)"],
    treatment: ["غالبًا حميد — راقب فقط ما لم يظهر أعراض (Usually benign — monitor only unless symptomatic)", "أتروبين إذا كان المريض عرضيًا (شحوب، برودة، هبوط ضغط) (Atropine if the patient is symptomatic (pallor, cold skin, hypotension))"],
    memoryTrick: "PR بيطول... بيطول... لحد ما يسقط ضربة",
    algorithm: ["راقب الأعراض (Monitor symptoms)", "أتروبين لو الأعراض واضحة (Atropine if symptomatic)", "نادرًا يحتاج ناظمة (Rarely needs pacing)"],
    medications: ["أتروبين لو بطء أعراضي (Atropine if symptomatic bradycardia)"],
    features: ["إطالة تدريجية لـPR حتى تسقط ضربة (Progressive PR lengthening until drop)", "النمط يتكرر (Pattern repeats)"],
    ecgCriteria: { p: "منتظمة (Regular)", pr: "يطول تدريجيًا (Progressively lengthens)", qrs: "يسقط دوريًا (Periodically dropped)", rhythm: "غير منتظم بنمط متكرر (Irregular, repeating pattern)" },
    symptoms: ["غالبًا بدون أعراض (Often asymptomatic)", "دوخة خفيفة أحيانًا (Occasional mild dizziness)"],
    immediateActions: ["راقب فقط غالبًا (Usually monitor only)", "أتروبين لو أعراضي (Atropine if symptomatic)"],
  },
  { id: "rbbb", nameAr: "إحصار الحزمة اليمنى (RBBB)", nameEn: "Right Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليمنى — QRS عريض مع شكل RSR' (أذنين أرنب) في V1. (Delayed right bundle conduction — wide QRS with an rsR' (rabbit-ears) shape in V1.)", needsCPR: false, shockable: false, rate: "60-100", wave: "bbb-notch",
    causes: ["الانصمام الرئوي (Pulmonary embolism)", "أمراض الرئة المزمنة (Chronic lung disease)", "أمراض القلب الخلقية (Congenital heart disease)", "قد يكون موجودًا طبيعيًا عند بعض الأشخاص (Can be a normal variant in some people)"],
    treatment: ["غالبًا لا يحتاج علاج طارئ بمفرده (Usually needs no emergency treatment on its own)", "قيّم السبب الكامن (خصوصًا لو ظهر حديثًا) (Evaluate the underlying cause (especially if new))"],
    memoryTrick: "شكل M أو أذنين أرنب في V1",
    algorithm: ["ابحث عن السبب الكامن (Investigate underlying cause)", "لا يحتاج علاج مباشر عادة (No direct treatment usually)"],
    medications: ["لا يوجد علاج نوعي (No specific treatment)"],
    features: ["شكل rsR' (أذنين أرنب/M) في V1 (rsR' rabbit-ears/M shape in V1)", "QRS > 120ms (Wide QRS > 120ms)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "> 0.12 ثانية (Wide)", rhythm: "منتظم (Regular)" },
    symptoms: ["غالبًا بدون أعراض (Often asymptomatic)"],
    immediateActions: ["راقب وابحث عن السبب (Monitor and investigate cause)"],
  },
  { id: "lbbb", nameAr: "إحصار الحزمة اليسرى (LBBB)", nameEn: "Left Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليسرى — QRS عريض، قد يخفي علامات احتشاء أخرى على ECG. (Delayed left bundle conduction — wide QRS, can mask other infarction signs on ECG.)", needsCPR: false, shockable: false, rate: "60-100", wave: "lbbb-wide",
    causes: ["أمراض القلب الإقفارية (Ischemic heart disease)", "ارتفاع ضغط الدم المزمن (Chronic hypertension)", "اعتلال عضلة القلب (Cardiomyopathy)"],
    treatment: ["إذا ظهر حديثًا مع أعراض صدرية عامله كاحتشاء حتى يثبت العكس (If new with chest pain, treat as MI until proven otherwise)", "قيّم وظيفة القلب (إيكو) (Evaluate cardiac function (echo))"],
    memoryTrick: "LBBB جديد + ألم صدر = عامله زي الاحتشاء",
    algorithm: ["ابحث عن السبب (غالبًا مرض قلبي كامن) (Investigate cause — often underlying heart disease)", "LBBB جديد + ألم صدر = عامله كاحتشاء (New LBBB + chest pain = treat as MI)"],
    medications: ["حسب السبب الكامن (Per underlying cause)"],
    features: ["S عميقة وr ضعيفة أو غائبة (Deep S, weak/absent r)", "قد يخفي علامات احتشاء (Can mask MI changes)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "> 0.12 ثانية (Wide)", rhythm: "منتظم (Regular)" },
    symptoms: ["حسب السبب الكامن، قد يكون بدون أعراض (Depends on cause, may be asymptomatic)"],
    immediateActions: ["لو جديد + ألم صدر: عامله كاحتشاء (If new + chest pain: treat as MI)", "ابحث عن السبب الكامن (Investigate underlying cause)"],
  },
  { id: "junctional", nameAr: "الإيقاع العقدي (Junctional Rhythm)", nameEn: "Junctional Rhythm", category: "watch", desc: "العقدة الأذينية البطينية تتولى تنظيم القلب بدل SA node — موجة P غائبة أو مقلوبة. (The AV node takes over pacing instead of the SA node — P wave absent or inverted.)", needsCPR: false, shockable: false, rate: "40-60", wave: "junctional",
    causes: ["ضعف أو توقف العقدة الجيبية (SA node weakness or failure)", "زيادة توتر العصب المبهم (Increased vagal tone)", "تسمم بالديجوكسين (Digoxin toxicity)"],
    treatment: ["راقب الأعراض وعلامات ضعف التروية (Monitor symptoms and signs of hypoperfusion)", "أتروبين إذا كان عرضيًا (Atropine if symptomatic)", "راجع أدوية الديجوكسين (Review digoxin medications)"],
    memoryTrick: "P wave غائبة أو مقلوبة — القلب اتحكم فيه العقدة مش SA node",
    algorithm: ["قيّم السبب (أدوية، نقص أكسجين) (Assess cause — meds, hypoxia)", "أتروبين لو بطيء وأعراضي (Atropine if slow and symptomatic)"],
    medications: ["أتروبين لو أعراضي (Atropine if symptomatic)"],
    features: ["موجة P غائبة أو مقلوبة (Absent or inverted P wave)", "القلب تتحكم فيه العقدة الأذينية البطينية بدل SA node (AV node takes over pacing)"],
    ecgCriteria: { p: "غائبة أو مقلوبة (Absent or inverted)", pr: "قصير أو غير موجود (Short or absent)", qrs: "ضيق غالبًا (Usually narrow)", rhythm: "منتظم (Regular)" },
    symptoms: ["دوخة لو المعدل بطيء جدًا (Dizziness if very slow)"],
    immediateActions: ["راقب المعدل والأعراض (Monitor rate and symptoms)", "عالج السبب الكامن (Treat underlying cause)"],
  },
  { id: "pvcs", nameAr: "انقباضات بطينية مبكرة متكررة (PVCs)", nameEn: "Frequent Premature Ventricular Contractions", category: "watch", desc: "نبضات مبكرة واسعة القالب وسط إيقاع منتظم — راقب النمط والتكرار. (Early, wide-QRS beats within an otherwise regular rhythm — monitor the pattern and frequency.)", needsCPR: false, shockable: false, rate: "متغير", wave: "pvc",
    causes: ["نقص الأكسجين (Hypoxia)", "اختلال كهارل (بوتاسيوم، مغنيسيوم) (Electrolyte imbalance (potassium, magnesium))", "كافيين أو منبهات (Caffeine or stimulants)", "إجهاد أو قلق (Stress or anxiety)", "أمراض قلبية كامنة (Underlying heart disease)"],
    treatment: ["راقب التكرار (متكررة/زوجية/ثلاثية) (Monitor frequency (frequent/paired/tripled))", "صحح اختلال الكهارل (Correct electrolyte imbalance)", "أبلغ الطبيب لو تحولت لأنماط خطيرة (Runs of VT) (Notify the physician if it evolves into dangerous patterns (runs of VT))"],
    memoryTrick: "نبضة مبكرة واسعة وسط إيقاع منتظم (An early wide beat amid a regular rhythm)",
    algorithm: ["قيّم التكرار والنمط (Assess frequency and pattern)", "صحح الكهارل (بوتاسيوم/مغنيسيوم) (Correct electrolytes)", "بيتا بلوكر لو أعراضي ومتكرر (Beta-blocker if symptomatic/frequent)"],
    medications: ["بيتا بلوكر لو أعراضي (Beta-blocker if symptomatic)", "تصحيح بوتاسيوم/مغنيسيوم (Correct K+/Mg2+)"],
    features: ["نبضة مبكرة واسعة القالب (Early wide-QRS beat)", "غالبًا متبوعة بوقفة تعويضية (Often followed by compensatory pause)"],
    ecgCriteria: { p: "غائبة قبل الـPVC (Absent before the PVC)", pr: "غير قابل للقياس للـPVC (Not measurable for the PVC)", qrs: "عريض للضربة المبكرة (Wide for the early beat)", rhythm: "غير منتظم بسبب الضربات المبكرة (Irregular due to early beats)" },
    symptoms: ["إحساس بخفقة/رفة في الصدر (Fluttering/skipped-beat sensation)", "غالبًا حميدة (Often benign)"],
    immediateActions: ["راقب التكرار والنمط (Monitor frequency/pattern)", "صحح الكهارل (Correct electrolytes)"],
  },
  { id: "sinus-tach", nameAr: "تسرع الجيوب الأنفية", nameEn: "Sinus Tachycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل مرتفع — ابحث عن السبب (ألم، حمى، جفاف). (Normal-shaped sinus rhythm but at an elevated rate — look for the cause (pain, fever, dehydration).)", needsCPR: false, shockable: false, rate: "100-150", wave: "sinus-fast",
    causes: ["الألم (Pain)", "الحمى (Fever)", "الجفاف أو نقص حجم الدم (Dehydration or hypovolemia)", "القلق (Anxiety)", "فرط نشاط الغدة الدرقية (Hyperthyroidism)"],
    treatment: ["لا علاج مباشر — عالج السبب الكامن (No direct treatment — treat the underlying cause)", "راقب العلامات الحيوية (Monitor vital signs)"],
    memoryTrick: "شكل جيبي طبيعي لكن أسرع (Normal sinus shape, just faster)",
    algorithm: ["ابحث عن السبب الكامن (ألم، حمى، جفاف) (Find underlying cause — pain, fever, dehydration)", "عالج السبب لا المعدل نفسه (Treat cause, not the rate itself)"],
    medications: ["لا يوجد علاج مباشر — عالج السبب (No direct treatment — treat the cause)"],
    features: ["إيقاع جيبي طبيعي لكن أسرع (Normal sinus rhythm, just faster)", "موجة P طبيعية قبل كل QRS (Normal P before every QRS)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "ضيق (Narrow)", rhythm: "منتظم (Regular)" },
    symptoms: ["خفقان خفيف (Mild palpitations)", "أعراض السبب الكامن (Symptoms of underlying cause)"],
    immediateActions: ["ابحث عن وعالج السبب الكامن (Find and treat underlying cause)"],
  },
  { id: "sinus-brady", nameAr: "بطء الجيوب الأنفية", nameEn: "Sinus Bradycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل منخفض — قد يكون طبيعيًا في الرياضيين. (Normal-shaped sinus rhythm but at a low rate — can be normal in athletes.)", needsCPR: false, shockable: false, rate: "أقل من 60", wave: "sinus-slow",
    causes: ["مناورة مبهمية (الشد أثناء التبرز) (Vagal maneuver (straining during defecation))", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم) (Medications (beta-blockers, calcium channel blockers))", "طبيعي عند الرياضيين (Normal in athletes)"],
    treatment: ["أتروبين فقط إذا كان عرضيًا (شحوب، برودة، انخفاض تروية) (Atropine only if symptomatic (pallor, cold skin, poor perfusion))", "لا علاج إذا كان بدون أعراض (No treatment if asymptomatic)"],
    memoryTrick: "BRADYcardia = أقل من 60",
    algorithm: ["قيّم الاستقرار (Assess stability)", "أتروبين لو أعراضي (Atropine if symptomatic)", "ناظمة لو لم يستجب (Pacing if unresponsive)"],
    medications: ["أتروبين 0.5mg IV لو أعراضي (Atropine 0.5mg IV if symptomatic)"],
    features: ["إيقاع جيبي طبيعي لكن أبطأ من 60 (Normal sinus rhythm, rate < 60)", "شائع عند الرياضيين (Common in athletes)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "ضيق (Narrow)", rhythm: "منتظم (Regular)" },
    symptoms: ["غالبًا بدون أعراض (Often asymptomatic)", "دوخة لو أعراضي (Dizziness if symptomatic)"],
    immediateActions: ["راقب لو بدون أعراض (Monitor if asymptomatic)", "أتروبين لو أعراضي (Atropine if symptomatic)"],
  },

  // طبيعي
  { id: "nsr", nameAr: "الإيقاع الجيبي الطبيعي", nameEn: "Normal Sinus Rhythm", category: "normal", desc: "موجة P منتظمة تسبق كل QRS، معدل ومسافات طبيعية. (A regular P wave precedes every QRS, with normal rate and intervals.)", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-normal",
    causes: ["قلب سليم يعمل بشكل طبيعي (A healthy heart functioning normally)"], treatment: ["لا علاج — استمر بالمراقبة الروتينية (No treatment — continue routine monitoring)"], memoryTrick: "نبضة منتظمة ومتباعدة بالتساوي (Regular beats, evenly spaced)",
    algorithm: ["لا تدخل مطلوب (No intervention required)", "استمر في المراقبة الروتينية (Continue routine monitoring)"],
    medications: [],
    features: ["المعدل 60-100 نبضة/دقيقة (Rate 60-100 bpm)", "إيقاع منتظم (Regular rhythm)", "موجة P قبل كل QRS (P wave before every QRS)", "فترة PR 0.12-0.20 ثانية (PR 0.12-0.20s)", "QRS < 0.12 ثانية (QRS < 0.12s)", "شكل موجة P متماثل (Symmetric P wave shape)"],
    ecgCriteria: { p: "موجبة في II,I؛ سلبية في aVR (Positive in I,II; negative in aVR)", pr: "0.12-0.20 ثانية (0.12-0.20s)", qrs: "> 0.12 ثانية (ضيق) (< 0.12s, narrow)", rhythm: "منتظم (Regular)" },
    symptoms: ["بدون أعراض (No symptoms)", "ديناميكا دموية طبيعية (Normal hemodynamics)"],
    immediateActions: ["لا تدخل مطلوب (No intervention required)", "استمر في المراقبة الروتينية (Continue routine monitoring)"],
  },
  { id: "wpw", nameAr: "متلازمة وولف-باركنسون-وايت (WPW)", nameEn: "Wolff-Parkinson-White Syndrome", category: "watch", desc: "مسار توصيل إضافي بين الأذين والبطين — PR قصير وQRS عريض مع موجة دلتا مميزة. (An accessory conduction pathway between atrium and ventricle — short PR and wide QRS with a distinctive delta wave.)", needsCPR: false, shockable: false, rate: "60-100 (أو تسرع نوبي)", wave: "wpw",
    causes: ["مسار توصيل شاذ خلقي (Accessory pathway) يتخطى العقدة الأذينية البطينية (Congenital abnormal conduction pathway (accessory pathway) bypassing the AV node)"],
    treatment: ["خطر الإصابة بتسرعات نوبية سريعة (Risk of rapid paroxysmal tachycardias)", "قد يحتاج استئصال بالقسطرة (Ablation) لاحقًا (May need catheter ablation later)"],
    memoryTrick: "Short PR + Wide QRS + Delta wave",
    algorithm: ["تجنب أدوية حاصرات العقدة الأذينية البطينية وقت تسرع نوبي (Avoid AV-nodal blockers during tachycardia)", "استشارة قسطرة كهربية لاستئصال المسار الإضافي (Refer for EP study/ablation)"],
    medications: ["تجنب ديجوكسين وأدينوزين وحاصرات كالسيوم لو AFib مصاحب (Avoid digoxin/adenosine/CCBs if AFib present)"],
    features: ["PR قصير (Short PR)", "QRS عريض مع موجة دلتا (Wide QRS with delta wave)", "خطر تسرع نوبي (Risk of paroxysmal tachycardia)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "قصير < 0.12 ثانية (Short < 0.12s)", qrs: "عريض > 0.12 ثانية (Wide > 0.12s)", rhythm: "منتظم غالبًا (Usually regular)" },
    symptoms: ["خفقان نوبي (Paroxysmal palpitations)", "دوخة (Dizziness)"],
    immediateActions: ["راقب وتجنب حاصرات العقدة الأذينية البطينية (Monitor, avoid AV-nodal blockers)", "استشر لاستئصال المسار (Refer for ablation)"],
  },
  { id: "stemi", nameAr: "احتشاء بارتفاع ST (STEMI)", nameEn: "ST-Elevation Myocardial Infarction", category: "critical", desc: "ارتفاع في قطعة ST فوق الخط الأساسي — انسداد كامل في شريان تاجي، حالة طارئة قصوى. (ST-segment elevation above baseline — complete coronary artery occlusion, a maximal emergency.)", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد كامل مفاجئ لشريان تاجي (Sudden complete occlusion of a coronary artery)"],
    treatment: ["تفعيل بروتوكول المختبر القسطري فورًا (Door-to-balloon) (Activate the cath lab protocol immediately (door-to-balloon))", "أكسجين، أسبرين، نيتروجليسرين، مسكن حسب البروتوكول (Oxygen, aspirin, nitroglycerin, analgesia per protocol)", "ECG متكرر ومراقبة قريبة (Serial ECGs and close monitoring)"],
    memoryTrick: "ST مرتفع = عضلة قلب بتموت الآن",
    algorithm: ["ECG خلال 10 دقائق من الوصول", "فعّل بروتوكول المختبر القسطري (Door-to-Balloon أقل من 90 دقيقة)", "أكسجين لو التشبع أقل من 90%", "أسبرين + نيتروجليسرين + مسكن حسب البروتوكول (MONA)"],
    medications: ["أسبرين 325mg مضغ", "نيتروجليسرين تحت اللسان", "مورفين للألم", "أكسجين حسب الحاجة"],
    features: ["ارتفاع ST أكثر من 1mm في اتجاهين متجاورين على الأقل", "قد يصاحبه تغير متبادل (Reciprocal changes)", "تطور موجة Q لاحقًا"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي (قد يتسع لاحقًا)", rhythm: "منتظم غالبًا" },
    symptoms: ["ألم صدر ضاغط مستمر", "تعرق وغثيان", "ضيق تنفس", "ألم منتشر للذراع أو الفك"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا (Door-to-Balloon)", "MONA حسب البروتوكول", "ECG ومراقبة متكررة"],
  },
  { id: "ischemia", nameAr: "نقص تروية عضلة القلب (انخفاض ST)", nameEn: "Myocardial Ischemia (ST Depression)", category: "urgent", desc: "انخفاض في قطعة ST — نقص تروية دون انسداد كامل بعد؛ فرّق بينه وبين الذبحة الصدرية بالإنزيمات والتوقيت. (ST-segment depression — reduced perfusion without full occlusion yet; differentiate from angina using enzymes and timing.)", needsCPR: false, shockable: false, rate: "متغير", wave: "ischemia",
    causes: ["ذبحة صدرية غير مستقرة (Unstable angina)", "نقص تروية تحت الشغاف (Subendocardial ischemia)", "زيادة الحمل على القلب مع مرض تاجي كامن (Increased cardiac workload with underlying coronary disease)"],
    treatment: ["أكسجين، نيترات، مراقبة إنزيمات القلب (Oxygen, nitrates, monitor cardiac enzymes)", "ECG متسلسل لمتابعة التطور نحو احتشاء (Serial ECGs to track progression toward infarction)"],
    memoryTrick: "ST منخفض = القلب تعبان لكن لسه مايتش",
    algorithm: ["قارن بتخطيط سابق وأنزيمات القلب (Compare with prior ECG and cardiac enzymes)", "فرّق بينه وبين انسداد كامل (Differentiate from full occlusion)"],
    medications: ["أسبرين (Aspirin)", "نيتروجليسرين للألم (Nitroglycerin for pain)"],
    features: ["انخفاض قطعة ST (ST segment depression)", "بدون انسداد كامل (No complete occlusion)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "طبيعي (Normal)", rhythm: "منتظم غالبًا (Usually regular)" },
    symptoms: ["ألم صدر (Chest pain)", "قد يكون خفيف أو متقطع (May be mild or intermittent)"],
    immediateActions: ["أسبرين ونيتروجليسرين (Aspirin and nitroglycerin)", "ECG وإنزيمات متكررة (Serial ECG and enzymes)"],
  },

  // إضافات — أنماط أخرى (طبيعي / مراقبة / عاجل / حرج)
  { id: "sinus-arrhythmia", nameAr: "عدم انتظام الإيقاع الجيبي", nameEn: "Sinus Arrhythmia", category: "normal", desc: "المعدل يتغير بشكل طبيعي مع التنفس (يزيد بالشهيق ويقل بالزفير) — شائع عند الشباب والرياضيين. (Rate normally varies with respiration (increases on inspiration, decreases on expiration) — common in young people and athletes.)", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-arrhythmia",
    causes: ["تغير طبيعي مرتبط بالتنفس عبر العصب المبهم (Normal respiration-linked variation via the vagus nerve)"], treatment: ["لا علاج — نتيجة طبيعية (No treatment — a normal finding)"], memoryTrick: "المعدل يتغير مع التنفس — طبيعي تمامًا (Rate changes with breathing — completely normal)",
    algorithm: ["لا تدخل مطلوب عادة (No intervention usually needed)"],
    medications: [],
    features: ["المعدل يتغير مع التنفس (Rate varies with respiration)", "شائع عند الشباب والرياضيين (Common in young/athletic people)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "ضيق (Narrow)", rhythm: "غير منتظم بشكل دوري مع التنفس (Cyclically irregular with breathing)" },
    symptoms: ["بدون أعراض عادة (Usually asymptomatic)"],
    immediateActions: ["لا تدخل مطلوب (No intervention required)", "راقب فقط (Monitor only)"],
  },
  { id: "pac", nameAr: "الانقباض الأذيني المبكر (PAC)", nameEn: "Premature Atrial Contraction", category: "normal", desc: "ضربة مبكرة ضيقة القالب بموجة P مختلفة الشكل عن باقي الموجات. (An early, narrow-QRS beat with a P wave shaped differently from the others.)", needsCPR: false, shockable: false, rate: "طبيعي", wave: "pac",
    causes: ["كافيين أو منبهات (Caffeine or stimulants)", "إجهاد (Stress)", "قلة نوم (Sleep deprivation)", "طبيعي أحيانًا بدون سبب واضح (Sometimes normal with no clear cause)"],
    treatment: ["غالبًا لا يحتاج علاج (Usually needs no treatment)", "قلل المنبهات لو متكررة ومزعجة (Reduce stimulants if frequent and bothersome)"], memoryTrick: "ضربة مبكرة ضيقة بموجة P مختلفة الشكل",
    algorithm: ["قلل المنبهات (كافيين، توتر) لو متكرر (Reduce stimulants if frequent)"],
    medications: ["غالبًا لا يوجد علاج مطلوب (Usually no treatment needed)"],
    features: ["ضربة مبكرة بموجة P مختلفة الشكل (Early beat with differently-shaped P)", "QRS ضيق القالب (Narrow QRS)"],
    ecgCriteria: { p: "شكل مختلف عن باقي موجات P (Different shape from other P waves)", pr: "قد يختلف قليلًا (May vary slightly)", qrs: "ضيق (Narrow)", rhythm: "غير منتظم بسبب الضربة المبكرة (Irregular due to early beat)" },
    symptoms: ["إحساس برفة خفيفة أحيانًا (Occasional mild flutter sensation)", "غالبًا بدون أعراض (Often asymptomatic)"],
    immediateActions: ["راقب فقط عادة (Usually just monitor)", "قلل المنبهات لو متكرر (Reduce stimulants if frequent)"],
  },
  { id: "paced", nameAr: "إيقاع المنظّم الكهربائي (Paced Rhythm)", nameEn: "Paced Rhythm", category: "watch", desc: "إشارات المنظم تسبق كل QRS عريض — تحقق من الالتقاط (Capture) والاستشعار (Sensing). (Pacer spikes precede every wide QRS — check for capture and sensing.)", needsCPR: false, shockable: false, rate: "حسب إعداد الجهاز", wave: "paced",
    causes: ["مريض لديه منظم قلب كهربائي دائم أو مؤقت (Patient has a permanent or temporary electronic pacemaker)"],
    treatment: ["تحقق من نجاح الالتقاط (كل Spike يتبعه QRS) (Confirm successful capture (every spike followed by a QRS))", "تحقق من الاستشعار الصحيح (Confirm correct sensing)", "أبلغ الطبيب لو فشل الالتقاط أو الاستشعار (Notify the physician if capture or sensing fails)"],
    memoryTrick: "خط رأسي حاد (Spike) قبل كل QRS عريض",
    algorithm: ["تأكد من التقاط الناظمة فعليًا للقلب (Confirm pacer capture)", "افحص عتبة الناظمة والبطارية لو فشل الالتقاط (Check pacer threshold/battery if capture fails)"],
    medications: [],
    features: ["شوكة ناظمة (Spike) قبل كل QRS عريض (Pacer spike before each wide QRS)", "معدل حسب إعداد الجهاز (Rate per device setting)"],
    ecgCriteria: { p: "قد تكون غائبة أو منفصلة عن الشوكة (May be absent or dissociated from spike)", pr: "غير قابل للتطبيق عادة (Usually not applicable)", qrs: "عريض بعد كل شوكة (Wide after each spike)", rhythm: "منتظم حسب إعداد الجهاز (Regular per device setting)" },
    symptoms: ["حسب سبب تركيب الناظمة (Depends on reason for pacer)"],
    immediateActions: ["تأكد من الالتقاط الفعّال (Confirm effective capture)", "أبلغ لو فشل الالتقاط أو التوصيل (Report failure to capture/sense)"],
  },
  { id: "shortqt", nameAr: "متلازمة QT القصير", nameEn: "Short QT Syndrome", category: "urgent", desc: "فترة QT قصيرة بشكل غير طبيعي — نادرة لكنها ترفع خطر الرجفان البطيني والموت المفاجئ. (Abnormally short QT interval — rare, but raises the risk of ventricular fibrillation and sudden death.)", needsCPR: false, shockable: false, rate: "طبيعي", wave: "shortqt",
    causes: ["خلل خلقي في قنوات البوتاسيوم (وراثي غالبًا) (Congenital potassium channel abnormality (usually inherited))", "فرط كالسيوم الدم أحيانًا (Sometimes hypercalcemia)"],
    treatment: ["إحالة لطبيب قلب متخصص بالنظم (Refer to an electrophysiology specialist)", "قد يحتاج مزيل رجفان مزروع (ICD) في الحالات عالية الخطورة (May need an implantable defibrillator (ICD) in high-risk cases)"],
    memoryTrick: "QT قصير جدًا = خطر VF نادر لكن خطير",
    algorithm: ["قيّم خطر تسرع بطيني/رجفان (Assess VT/VF risk)", "استشارة قلب لتقييم مزيل رجفان مزروع (Cardiology referral for possible ICD)"],
    medications: ["حسب توصية أخصائي القلب (Per cardiology guidance)"],
    features: ["QRS طبيعي، T تصل مبكرًا جدًا (Normal QRS, T arrives very early)", "نادر لكن خطر لعدم انتظام مميت (Rare but risk of lethal arrhythmia)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "طبيعي (Normal)", rhythm: "منتظم (Regular)" },
    symptoms: ["قد يكون بدون أعراض حتى حدوث عدم انتظام خطير (May be asymptomatic until a dangerous arrhythmia occurs)"],
    immediateActions: ["استشارة قلب عاجلة (Urgent cardiology referral)", "راقب لعدم انتظام خطير (Monitor for dangerous arrhythmia)"],
  },
  { id: "mat", nameAr: "تسرع الأذيني متعدد البؤر (MAT)", nameEn: "Multifocal Atrial Tachycardia", category: "urgent", desc: "3 أشكال مختلفة على الأقل لموجة P في نفس الشريط — غالبًا مرتبط بأمراض الرئة المزمنة (COPD). (At least 3 different P-wave shapes on the same strip — often linked to chronic lung disease (COPD).)", needsCPR: false, shockable: false, rate: "100-180", wave: "mat",
    causes: ["تفاقم مرض الانسداد الرئوي المزمن (COPD) (COPD exacerbation)", "نقص الأكسجين (Hypoxia)", "اختلال كهارل (Electrolyte imbalance)"],
    treatment: ["عالج المرض الرئوي الكامن ونقص الأكسجين أولًا (Treat the underlying lung disease and hypoxia first)", "حاصرات قنوات الكالسيوم قد تُستخدم (Calcium channel blockers may be used)", "تجنب الديجوكسين عادة (Digoxin is usually avoided)"],
    memoryTrick: "3 أشكال مختلفة لموجة P على الأقل",
    algorithm: ["عالج مرض الرئة الكامن (غالبًا COPD) (Treat underlying lung disease, often COPD)", "صحح الأكسجين والكهارل (Correct oxygenation/electrolytes)"],
    medications: ["مانع قنوات كالسيوم كخيار للتحكم بالمعدل (Calcium channel blocker as rate-control option)", "تجنب بيتا بلوكر لو COPD شديد (Avoid beta-blockers if severe COPD)"],
    features: ["3 أشكال مختلفة على الأقل لموجة P (At least 3 different P wave shapes)", "غالبًا مرتبط بأمراض الرئة المزمنة (Often linked to chronic lung disease)"],
    ecgCriteria: { p: "3 أشكال مختلفة على الأقل (At least 3 different shapes)", pr: "متغير (Variable)", qrs: "ضيق غالبًا (Usually narrow)", rhythm: "غير منتظم (Irregular)" },
    symptoms: ["خفقان (Palpitations)", "أعراض مرض الرئة الكامن (Symptoms of underlying lung disease)"],
    immediateActions: ["عالج السبب الرئوي الكامن (Treat underlying lung cause)", "صحح الأكسجين والكهارل (Correct oxygenation/electrolytes)"],
  },
  { id: "pericarditis", nameAr: "نمط ECG في التهاب التامور", nameEn: "Pericarditis ECG Pattern", category: "urgent", desc: "ارتفاع ST منتشر بشكل سرج (Saddle-shaped) مع انخفاض PR — يختلف عن احتشاء واحد بمنطقة محددة. (Diffuse, saddle-shaped ST elevation with PR depression — unlike an infarction confined to one territory.)", needsCPR: false, shockable: false, rate: "متغير", wave: "pericarditis",
    causes: ["عدوى فيروسية (Viral infection)", "ما بعد احتشاء عضلة القلب (متلازمة درسلر) (Post-myocardial infarction (Dressler syndrome))", "أمراض المناعة الذاتية (Autoimmune disease)", "الفشل الكلوي (Renal failure)"],
    treatment: ["مضادات الالتهاب اللاستيرويدية (NSAIDs) (NSAIDs)", "كولشيسين (Colchicine)", "راقب علامات الاندحاس القلبي (Tamponade) (Monitor for signs of cardiac tamponade)"],
    memoryTrick: "ارتفاع ST منتشر في كل الـLeads تقريبًا، مش منطقة واحدة بس",
    algorithm: ["فرّق عن الاحتشاء بالتوزيع الواسع والزمن (Differentiate from MI by widespread pattern and timing)", "مضادات التهاب لاستيرويدية كعلاج أساسي (NSAIDs as mainstay treatment)"],
    medications: ["إيبوبروفين أو أسبرين جرعة عالية (Ibuprofen or high-dose aspirin)", "كولشيسين لتقليل الانتكاس (Colchicine to reduce recurrence)"],
    features: ["ارتفاع ST منتشر بشكل سرجي (Diffuse saddle-shaped ST elevation)", "انخفاض PR (PR depression)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "منخفض (Depressed)", qrs: "طبيعي (Normal)", rhythm: "منتظم غالبًا (Usually regular)" },
    symptoms: ["ألم صدر يزيد بالاستلقاء ويقل بالجلوس للأمام (Chest pain worse lying down, better sitting forward)", "قد يصاحبه حمى خفيفة (May have mild fever)"],
    immediateActions: ["مضادات التهاب لاستيرويدية (NSAIDs)", "فرّق عن الاحتشاء أولًا (Rule out MI first)"],
  },
  { id: "hypokalemia-ecg", nameAr: "تغيرات ECG في نقص بوتاسيوم الدم", nameEn: "Hypokalemia ECG Changes", category: "urgent", desc: "تسطح موجة T وظهور موجة U واضحة، مع إطالة QT. (Flattened T wave with a prominent U wave, plus QT prolongation.)", needsCPR: false, shockable: false, rate: "متغير", wave: "hypokalemia",
    causes: ["فقدان بوتاسيوم عبر القيء أو الإسهال (Potassium loss through vomiting or diarrhea)", "مدرات البول (Diuretics)", "الأنسولين الزائد (Excess insulin)"],
    treatment: ["تعويض بوتاسيوم وريدي/فموي حسب الشدة (Replace potassium IV/orally per severity)", "مراقبة القلب المستمرة أثناء التعويض (Continuous cardiac monitoring during replacement)", "راقب خطر اضطراب النظم (خصوصًا Torsades) (Watch for arrhythmia risk (especially Torsades))"],
    memoryTrick: "T مسطحة + U واضحة = بوتاسيوم واطي",
    algorithm: ["قيّم شدة الانخفاض والأعراض (Assess severity and symptoms)", "تعويض بوتاسيوم وريدي/فموي حسب الشدة (Replace K+ IV/oral per severity)"],
    medications: ["تعويض بوتاسيوم كلوريد (Potassium chloride replacement)"],
    features: ["تسطح موجة T (Flattened T wave)", "ظهور موجة U واضحة (Prominent U wave)", "إطالة QT (QT prolongation)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "طبيعي (Normal)", rhythm: "منتظم غالبًا، خطر عدم انتظام لو شديد (Regular; arrhythmia risk if severe)" },
    symptoms: ["ضعف عضلي (Muscle weakness)", "تشنجات (Cramps)", "خفقان (Palpitations)"],
    immediateActions: ["عوّض البوتاسيوم حسب الشدة (Replace potassium per severity)", "راقب النظم أثناء التعويض (Monitor rhythm during replacement)"],
  },
  { id: "longqt", nameAr: "متلازمة QT الطويل", nameEn: "Long QT Syndrome", category: "urgent", desc: "إطالة فترة QT — خطر التطور لتواء الأطراف (Torsades) والموت المفاجئ. (Prolonged QT interval — risk of progressing to Torsades de Pointes and sudden death.)", needsCPR: false, shockable: false, rate: "متغير", wave: "longqt",
    causes: ["خلقي (وراثي) (Congenital (inherited))", "أدوية تطيل QT (بعض المضادات الحيوية والنفسية) (QT-prolonging drugs (certain antibiotics and psychiatric medications))", "نقص المغنيسيوم أو البوتاسيوم أو الكالسيوم (Low magnesium, potassium, or calcium)"],
    treatment: ["أوقف أي دواء يطيل QT (Stop any QT-prolonging drug)", "صحح اختلال الكهارل (Correct electrolyte imbalance)", "راقب تطور تواء الأطراف (Monitor for progression to Torsades)"],
    memoryTrick: "QT طويل = القلب مستني وقت أطول قبل الاستعداد للضربة الجاية",
    algorithm: ["أوقف أي دواء يطيل QT (Stop any QT-prolonging drug)", "صحح البوتاسيوم والمغنيسيوم (Correct K+/Mg2+)", "استشارة قلب لو خلقي (Cardiology referral if congenital)"],
    medications: ["كبريتات المغنيسيوم لو حدث Torsades (Magnesium sulfate if Torsades occurs)", "بيتا بلوكر للحالات الخلقية (Beta-blocker for congenital cases)"],
    features: ["إطالة فترة QT (Prolonged QT interval)", "خطر التطور لتواء الأطراف (Torsades) (Risk of progression to Torsades)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "طبيعي (Normal)", rhythm: "منتظم، خطر عدم انتظام مفاجئ (Regular; risk of sudden arrhythmia)" },
    symptoms: ["إغماء مفاجئ (Sudden syncope)", "خطر الموت المفاجئ (Risk of sudden death)"],
    immediateActions: ["أوقف الأدوية المطيلة لـQT (Stop QT-prolonging drugs)", "صحح الكهارل (Correct electrolytes)", "راقب لخطر Torsades (Monitor for Torsades risk)"],
  },
  { id: "hypocalcemia-ecg", nameAr: "تغيرات ECG في نقص كالسيوم الدم", nameEn: "Hypocalcemia ECG Changes", category: "urgent", desc: "إطالة قطعة ST بشكل رئيسي (يمدد QT بدون تغيير كبير في شكل T). (Mainly ST-segment prolongation (extends the QT without much change in T-wave shape).)", needsCPR: false, shockable: false, rate: "متغير", wave: "longqt",
    causes: ["قصور الغدة جار الدرقية (Hypoparathyroidism)", "الفشل الكلوي (Renal failure)", "نقص فيتامين د الشديد (Severe vitamin D deficiency)"],
    treatment: ["تعويض كالسيوم وريدي في الحالات العرضية (IV calcium replacement in symptomatic cases)", "راقب تشنجات العضلات وعلامات تيتاني (Monitor for muscle cramps and tetany)"],
    memoryTrick: "ST طويل = السبب غالبًا كالسيوم واطي",
    algorithm: ["قيّم شدة نقص الكالسيوم (Assess severity of hypocalcemia)", "كالسيوم وريدي للحالات الأعراضية (IV calcium for symptomatic cases)"],
    medications: ["كالسيوم جلوكونات وريدي (IV calcium gluconate)"],
    features: ["إطالة قطعة ST بشكل رئيسي (Mainly ST segment prolongation)", "بدون تغيير كبير في شكل T (Little change in T wave shape)", "إطالة QT (QT prolongation)"],
    ecgCriteria: { p: "طبيعية (Normal)", pr: "طبيعي (Normal)", qrs: "طبيعي (Normal)", rhythm: "منتظم غالبًا (Usually regular)" },
    symptoms: ["تنميل حول الفم والأطراف (Perioral/extremity tingling)", "تشنجات عضلية (Muscle cramps/tetany)"],
    immediateActions: ["كالسيوم وريدي للأعراض الشديدة (IV calcium for severe symptoms)", "راقب QT أثناء العلاج (Monitor QT during treatment)"],
  },
  { id: "hyperkalemia-ecg", nameAr: "تغيرات ECG في فرط بوتاسيوم الدم", nameEn: "Hyperkalemia ECG Changes", category: "critical", desc: "موجات T مدببة وضيقة (Peaked/Tented) — إذا لم تُعالَج تتطور لتوقف قلبي. (Peaked, narrow (tented) T waves — can progress to cardiac arrest if untreated.)", needsCPR: false, shockable: false, rate: "متغير", wave: "hyperkalemia",
    causes: ["الفشل الكلوي (Renal failure)", "تحلل عضلي أو خلوي شديد (Severe tissue or cell breakdown)", "بعض الأدوية (مثبطات ACE، مدرات موفرة للبوتاسيوم) (Certain medications (ACE inhibitors, potassium-sparing diuretics))"],
    treatment: ["كالسيوم جلوكونات وريدي لحماية القلب فورًا (IV calcium gluconate immediately to protect the heart)", "إنسولين + جلوكوز، وسالبوتامول لخفض البوتاسيوم داخل الخلايا (Insulin + glucose, and albuterol to shift potassium into cells)", "قد يحتاج غسيل كلوي عاجل (May need urgent dialysis)"],
    memoryTrick: "T مدببة وضيقة = بوتاسيوم عالي حتى يثبت العكس",
    algorithm: ["قيّم شدة الأعراض ودرجة الارتفاع", "كالسيوم جلوكونات فورًا لحماية عضلة القلب", "إنسولين + جلوكوز وسالبوتامول لنقل البوتاسيوم داخل الخلايا", "علاج نهائي بغسيل كلوي أو مدرات لو لزم"],
    medications: ["كالسيوم جلوكونات 10% IV (حماية القلب فورًا)", "إنسولين سريع + جلوكوز 50%", "سالبوتامول استنشاق", "كايكسالات أو غسيل كلوي (إزالة نهائية)"],
    features: ["موجات T مدببة وضيقة (Tented)", "تسطح موجة P مع الارتفاع الشديد", "اتساع QRS تدريجيًا مع الارتفاع الشديد"],
    ecgCriteria: { p: "تتسطح أو تختفي مع الارتفاع الشديد", pr: "يطول تدريجيًا", qrs: "يتسع تدريجيًا مع الارتفاع الشديد", rhythm: "قد يتحول لموجة جيبية ثم توقف قلبي" },
    symptoms: ["ضعف عضلي أو خدر", "خفقان", "قد يصل لتوقف قلبي مفاجئ"],
    immediateActions: ["كالسيوم جلوكونات فورًا لحماية القلب", "إنسولين+جلوكوز وسالبوتامول لخفض البوتاسيوم", "استعد لغسيل كلوي عاجل"],
  },
  { id: "nstemi", nameAr: "احتشاء بدون ارتفاع ST / ذبحة غير مستقرة", nameEn: "NSTEMI / Unstable Angina", category: "critical", desc: "انخفاض ST أو انقلاب موجة T بدون ارتفاع ST — فرّق بينهما بإنزيمات القلب والتوقيت. (ST depression or T-wave inversion without ST elevation — differentiate using cardiac enzymes and timing.)", needsCPR: false, shockable: false, rate: "متغير", wave: "ischemia",
    causes: ["انسداد جزئي أو مؤقت لشريان تاجي (Partial or temporary coronary artery occlusion)"],
    treatment: ["أسبرين، مضادات تخثر حسب البروتوكول (Aspirin, anticoagulants per protocol)", "إنزيمات قلب متسلسلة لتفريق NSTEMI عن الذبحة (Serial cardiac enzymes to distinguish NSTEMI from angina)", "تنظير قسطري حسب تصنيف الخطورة (Cath referral per risk stratification)"],
    memoryTrick: "بدون ارتفاع ST — لازم إنزيمات القلب تفرّق الحالة",
    algorithm: ["ECG متسلسل + إنزيمات قلب متسلسلة", "أسبرين ومضادات تخثر حسب البروتوكول", "صنّف الخطورة (TIMI/GRACE) لتحديد توقيت القسطرة"],
    medications: ["أسبرين 325mg", "مضادات تخثر (هيبارين)", "نيتروجليسرين للألم"],
    features: ["انخفاض ST أو انقلاب T بدون ارتفاع ST", "إنزيمات القلب مرتفعة (يفرّقه عن الذبحة غير المستقرة)"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    symptoms: ["ألم صدر", "ضيق تنفس", "تعرق"],
    immediateActions: ["أسبرين ومضادات تخثر فورًا", "إنزيمات قلب متسلسلة", "تنظير قسطري حسب تصنيف الخطورة"],
  },
  { id: "mi-lateral", nameAr: "احتشاء عضلة القلب الحاد الجانبي", nameEn: "Acute Lateral Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في I، aVL، V5، V6 — منطقة الشريان الظرفي (LCx) أو القطري. (ST elevation in I, aVL, V5, V6 — territory of the left circumflex (LCx) or a diagonal branch.)", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان الظرفي الأيسر (LCx) أو فرع قطري (Occlusion of the left circumflex artery (LCx) or a diagonal branch)"],
    treatment: ["تفعيل بروتوكول القسطرة القلبية فورًا (Activate the cath lab protocol immediately)", "أكسجين، أسبرين، نيتروجليسرين حسب البروتوكول (Oxygen, aspirin, nitroglycerin per protocol)"],
    memoryTrick: "ارتفاع ST في I وaVL وV5-V6 = جانبي",
    algorithm: ["ECG بـ12 اتجاه لتأكيد التوزيع", "فعّل بروتوكول القسطرة فورًا", "MONA حسب البروتوكول"],
    medications: ["أسبرين", "نيتروجليسرين", "مسكن", "أكسجين حسب الحاجة"],
    features: ["ارتفاع ST في I وaVL وV5-V6", "قد يصاحبه تغير متبادل سفلي"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي غالبًا", rhythm: "منتظم" },
    symptoms: ["ألم صدر", "تعرق", "ضيق تنفس"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا", "MONA حسب البروتوكول"],
  },
  { id: "mi-anterior", nameAr: "احتشاء عضلة القلب الحاد الأمامي", nameEn: "Acute Anterior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في V1-V4 — منطقة الشريان الأمامي النازل (LAD)، الأكثر خطورة لأنه يغذي جزءًا كبيرًا من البطين الأيسر. (ST elevation in V1-V4 — territory of the left anterior descending artery (LAD), the highest-risk location since it supplies a large part of the left ventricle.)", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان الأمامي النازل الأيسر (LAD) (Occlusion of the left anterior descending artery (LAD))"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا (الأولوية القصوى) (Activate the cath lab protocol immediately (top priority))", "راقب علامات قصور القلب الحاد وصدمة قلبية (Monitor for acute heart failure and cardiogenic shock)"],
    memoryTrick: "V1-V4 = أمامي = LAD = الأخطر",
    algorithm: ["ECG فوري بـ12 اتجاه", "فعّل بروتوكول القسطرة كأولوية قصوى", "راقب علامات قصور القلب الحاد والصدمة القلبية"],
    medications: ["أسبرين", "نيتروجليسرين بحذر (راقب الضغط)", "مسكن", "أكسجين"],
    features: ["ارتفاع ST في V1-V4", "أخطر أنواع الاحتشاء لاتساع منطقة العضلة المتأثرة"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي (قد يتسع لاحقًا)", rhythm: "منتظم" },
    symptoms: ["ألم صدر شديد", "ضيق تنفس", "علامات صدمة قلبية محتملة"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا (أولوية قصوى)", "راقب قصور القلب والصدمة القلبية"],
  },
  { id: "mi-inferior", nameAr: "احتشاء عضلة القلب الحاد السفلي", nameEn: "Acute Inferior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في II، III، aVF — منطقة الشريان التاجي الأيمن غالبًا؛ راقب بطء القلب والإحصار. (ST elevation in II, III, aVF — usually right coronary artery territory; watch for bradycardia and AV block.)", needsCPR: false, shockable: false, rate: "متغير", wave: "stemi",
    causes: ["انسداد الشريان التاجي الأيمن (RCA) غالبًا (Occlusion of the right coronary artery (RCA), usually)"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا (Activate the cath lab protocol immediately)", "تجنب النيترات لو فيه احتشاء بالبطين الأيمن (قد يهبط الضغط بشدة) (Avoid nitrates if right ventricular infarction is suspected (can cause severe hypotension))", "راقب بطء القلب أو إحصار AV (Monitor for bradycardia or AV block)"],
    memoryTrick: "II وIII وaVF = سفلي = راقب بطء القلب",
    algorithm: ["ECG فوري", "تجنب النيترات لو فيه اشتباه احتشاء بطين أيمن", "راقب بطء القلب والإحصار AV", "فعّل بروتوكول القسطرة"],
    medications: ["أسبرين", "تجنب النيترات إذا هبط الضغط أو اشتبه احتشاء بطين أيمن", "أتروبين لو بطء قلب مصاحب"],
    features: ["ارتفاع ST في II وIII وaVF", "قد يصاحبه بطء قلب أو إحصار AV"],
    ecgCriteria: { p: "طبيعية", pr: "قد يطول لو فيه إحصار مصاحب", qrs: "طبيعي غالبًا", rhythm: "قد يكون بطيء لو فيه إحصار" },
    symptoms: ["ألم صدر", "غثيان وقيء أكثر من الاحتشاءات الأخرى", "دوخة لو فيه بطء قلب"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا", "تجنب النيترات لو احتشاء بطين أيمن محتمل", "راقب بطء القلب والإحصار"],
  },
  { id: "pe-ecg", nameAr: "نمط ECG في الانسداد الرئوي", nameEn: "Pulmonary Embolism ECG Pattern (S1Q3T3)", category: "critical", desc: "نمط S1Q3T3 (موجة S في I، موجة Q في III، T مقلوبة في III) + تسرع جيبي — غير نوعي لكن مشير. (S1Q3T3 pattern (S wave in I, Q wave in III, inverted T in III) plus sinus tachycardia — non-specific but suggestive.)", needsCPR: false, shockable: false, rate: "متغير (غالبًا تسرع جيبي)", wave: "pe-pattern",
    causes: ["انصمام رئوي حاد يسبب إجهادًا مفاجئًا على البطين الأيمن (Acute pulmonary embolism causing sudden right ventricular strain)"],
    treatment: ["أكسجين ودعم تنفسي (Oxygen and respiratory support)", "مضادات تخثر عاجلة أو حل الجلطة حسب الشدة (Urgent anticoagulation or thrombolysis per severity)", "تصوير مقطعي للشريان الرئوي للتأكيد (CT pulmonary angiography to confirm)"],
    memoryTrick: "S1Q3T3 — غير نوعي لكنه مشير للانصمام الرئوي",
    algorithm: ["قيّم الاستقرار التنفسي والدموي", "أكسجين ودعم تنفسي", "تصوير مقطعي للشريان الرئوي للتأكيد", "مضادات تخثر أو حل الجلطة حسب الشدة"],
    medications: ["مضادات تخثر (هيبارين)", "حالّ للجلطة في الحالات الشديدة (عدم استقرار دموي)"],
    features: ["نمط S1Q3T3 (غير نوعي لكن مشير)", "تسرع جيبي هو الأكثر شيوعًا فعليًا", "قد يظهر إحصار حزمة يمنى جديد"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي أو إحصار حزمة يمنى جديد", rhythm: "غالبًا تسرع جيبي" },
    symptoms: ["ضيق تنفس مفاجئ", "ألم صدر جنبي", "تسرع قلب", "قد يصاحبه هبوط ضغط مفاجئ"],
    immediateActions: ["أكسجين ودعم تنفسي فورًا", "تصوير مقطعي للتأكيد", "مضادات تخثر أو حل الجلطة حسب الشدة"],
  },
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

type DetailTab = "algo" | "causes" | "meds" | "features" | "actions";
const DETAIL_TABS: { id: DetailTab; label: string; icon: string }[] = [
  { id: "algo", label: "خوارزمية", icon: "🧭" },
  { id: "causes", label: "أسباب", icon: "📋" },
  { id: "meds", label: "أدوية", icon: "💊" },
  { id: "features", label: "ميزات", icon: "🔬" },
  { id: "actions", label: "إجراءات", icon: "⚡" },
];

function EmptyTab({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="py-8 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
    </div>
  );
}

function ECGDetailTabs({ p }: { p: ECGPattern }) {
  const [tab, setTab] = useState<DetailTab>(p.algorithm?.length ? "algo" : "causes");
  const actions = p.immediateActions?.length ? p.immediateActions : p.treatment?.length ? p.treatment : null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {p.ecgCriteria && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">QRS</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.ecgCriteria.qrs}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">PR</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.ecgCriteria.pr}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">الانتظام</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.ecgCriteria.rhythm}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">المعدل</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200" dir="ltr">{p.rate} bpm</div>
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 dark:border-slate-800">
        {DETAIL_TABS.map((dt) => (
          <button
            key={dt.id}
            type="button"
            onClick={() => setTab(dt.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${tab === dt.id ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
          >
            {dt.icon} {dt.label}
          </button>
        ))}
      </div>

      {tab === "algo" &&
        (p.algorithm?.length ? (
          <ol className="list-inside list-decimal space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {p.algorithm.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        ) : (
          <EmptyTab icon="🧭" title="لا تتوفر خوارزمية لهذا الإيقاع" subtitle="الخوارزميات متاحة للإيقاعات التي تتطلب تدخلًا فوريًا" />
        ))}

      {tab === "causes" &&
        (p.causes?.length ? (
          <div className="space-y-3">
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {p.causes.map((c) => <li key={c}>{c}</li>)}
            </ul>
            {p.hAndT && (
              <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-500/10">
                <div className="mb-2 text-xs font-bold text-sky-700 dark:text-sky-300">5Hs & 5Ts</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {p.hAndT.h.map((h, i) => (
                    <div key={"h" + i} className="flex items-center gap-1.5">
                      <span className="rounded-full bg-sky-600 px-1.5 text-[10px] font-bold text-white">H{i + 1}</span>
                      {h}
                    </div>
                  ))}
                  {p.hAndT.t.map((t, i) => (
                    <div key={"t" + i} className="flex items-center gap-1.5">
                      <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">T{i + 1}</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyTab icon="📋" title="لا توجد أسباب محددة" />
        ))}

      {tab === "meds" &&
        (p.medications?.length ? (
          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {p.medications.map((m) => <li key={m}>{m}</li>)}
          </ul>
        ) : (
          <EmptyTab icon="💊" title="لا توجد أدوية محددة" />
        ))}

      {tab === "features" &&
        (p.features?.length || p.ecgCriteria || p.symptoms?.length ? (
          <div className="space-y-3">
            {!!p.features?.length && (
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            {p.ecgCriteria && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                <div className="mb-2 font-bold text-slate-500 dark:text-slate-400">معايير ECG</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">موجة P</span><span className="font-semibold text-slate-700 dark:text-slate-200">{p.ecgCriteria.p}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">PR</span><span className="font-semibold text-slate-700 dark:text-slate-200">{p.ecgCriteria.pr}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">QRS</span><span className="font-semibold text-slate-700 dark:text-slate-200">{p.ecgCriteria.qrs}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">الانتظام</span><span className="font-semibold text-slate-700 dark:text-slate-200">{p.ecgCriteria.rhythm}</span></div>
                </div>
              </div>
            )}
            {!!p.symptoms?.length && (
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                <div className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-300">⚠️ الأعراض</div>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-800 dark:text-amber-200">
                  {p.symptoms.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <EmptyTab icon="🔬" title="لا توجد ميزات إضافية مسجّلة" />
        ))}

      {tab === "actions" &&
        (actions ? (
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{i + 1}</span>
                {a}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>لا تدخل مطلوب</div>
            <div className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>استمر في المراقبة الروتينية</div>
          </div>
        ))}
    </div>
  );
}

function ECGCard({ p }: { p: ECGPattern }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const schedulerRef = useRef<number | null>(null);
  const noPulse = NO_PULSE_IDS.has(p.id);
  const hasDetails = !!(
    (p.causes && p.causes.length) || (p.treatment && p.treatment.length) ||
    (p.algorithm && p.algorithm.length) || (p.medications && p.medications.length) ||
    (p.features && p.features.length) || p.ecgCriteria ||
    (p.symptoms && p.symptoms.length) || (p.immediateActions && p.immediateActions.length)
  );
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
            {open ? "− إخفاء التفاصيل" : "+ تفاصيل أكتر"}
          </button>
        )}
      </div>

      {noPulse && playing && (
        <div className="mt-2 text-xs font-semibold text-rose-500">🔇 ده صوت إنذار المونيتور بس — الإيقاع ده معندوش نبض حقيقي يتسمع بالسماعة.</div>
      )}

      {open && <ECGDetailTabs p={p} />}
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

const MISTAKES_KEY = "nursehub_ecg_mistakes_v1";
function loadMistakes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MISTAKES_KEY) || "[]");
  } catch {
    return [];
  }
}

const SPEED_SECONDS = 8;
type QuizType = "normal" | "speed" | "mistakes";

function pickQuestion(pool: ECGPattern[]): { correct: ECGPattern; options: ECGPattern[] } {
  const source = pool.length > 0 ? pool : PATTERNS;
  const correct = source[Math.floor(Math.random() * source.length)];
  const others = shuffle(PATTERNS.filter((p) => p.id !== correct.id)).slice(0, 3);
  return { correct, options: shuffle([correct, ...others]) };
}

function QuizMode() {
  const [quizType, setQuizType] = useState<QuizType>("normal");
  const [mistakes, setMistakes] = useState<string[]>(() => loadMistakes());
  useEffect(() => {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
  }, [mistakes]);

  const poolFor = (t: QuizType) => (t === "mistakes" ? PATTERNS.filter((p) => mistakes.includes(p.id)) : PATTERNS);

  const [question, setQuestion] = useState(() => pickQuestion(poolFor("normal")));
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(SPEED_SECONDS);

  function pick(id: string) {
    if (picked) return;
    const correctId = question.correct.id;
    const wasCorrect = id === correctId;
    setPicked(id || "__timeout__");
    setScore((s) => ({ correct: s.correct + (wasCorrect ? 1 : 0), total: s.total + 1 }));
    setMistakes((prev) => (wasCorrect ? prev.filter((x) => x !== correctId) : prev.includes(correctId) ? prev : [...prev, correctId]));
  }

  function next() {
    setQuestion(pickQuestion(poolFor(quizType)));
    setPicked(null);
  }

  function switchType(t: QuizType) {
    setQuizType(t);
    setQuestion(pickQuestion(poolFor(t)));
    setPicked(null);
    setScore({ correct: 0, total: 0 });
  }

  // Speed-drill countdown: resets on each new question, ticks down every second,
  // and auto-submits a (wrong) answer if time runs out before the user picks.
  useEffect(() => {
    setTimeLeft(SPEED_SECONDS);
  }, [question]);
  useEffect(() => {
    if (quizType !== "speed" || picked) return;
    if (timeLeft <= 0) {
      pick("");
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizType, picked]);

  const mistakesEmpty = quizType === "mistakes" && mistakes.length === 0;
  const typePill = (t: QuizType, label: string) => (
    <button
      type="button"
      onClick={() => switchType(t)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${quizType === t ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {typePill("normal", "عادي")}
          {typePill("speed", "⏱️ سريع")}
          {typePill("mistakes", `🔁 أخطائي${mistakes.length > 0 ? ` (${mistakes.length})` : ""}`)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">النتيجة: {score.correct} من {score.total}</span>
          <button type="button" onClick={() => setScore({ correct: 0, total: 0 })} className="text-xs font-bold text-sky-600 dark:text-sky-400">↺</button>
        </div>
      </div>

      {mistakesEmpty ? (
        <div className="py-10 text-center text-sm text-slate-400">مفيش أخطاء متسجلة لسه 🎉 جاوب على شوية أسئلة في الوضع العادي الأول.</div>
      ) : (
        <>
          {quizType === "speed" && !picked && (
            <div className={`mb-2 text-center text-sm font-black ${timeLeft <= 3 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>⏱️ {timeLeft}</div>
          )}
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
                {picked === "__timeout__" ? "⏱️ خلص الوقت!" : picked === question.correct.id ? "✅ إجابة صح!" : "❌ إجابة غلط"}
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
        </>
      )}
    </div>
  );
}

export default function ECGPage() {
  const { settings, products } = useStore();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [mode, setMode] = useState<"library" | "quiz">("library");
  const [savedOnly, setSavedOnly] = useState(false);
  const { favorites } = useFavorites();
  const { add: addToCart } = useCart();
  const nav = useNavigate();

  // The post-payment download button (OrderStatusPage) looks up
  // products.find(p => p.id === item.productId) and only shows "تحميل" if that
  // product has a fileUrl — a cart line with a made-up productId that isn't a
  // real product in the catalog will always show "الملف غير متاح بعد" instead.
  // So this looks up the REAL admin-managed product (create it once in the admin
  // panel with id "ecg-summary-pdf", the summary PDF uploaded as its file, and a
  // price) and uses its real id/title/price/cover for the cart line — falls back
  // to matching by title if the id ever differs.
  const summaryProduct = products.find(
    (p) => p.id === "ecg-summary-pdf" || (p.title.includes("مراجعة") && p.title.includes("ECG")) || p.fileUrl?.includes("ECG")
  );

  function buySummary() {
    if (!summaryProduct) return;
    addToCart({ productId: summaryProduct.id, title: summaryProduct.title, price: summaryProduct.price, qty: 1, cover: summaryProduct.cover });
    nav("/checkout");
  }

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
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "quiz" ? "library" : "quiz"))}
              className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "quiz" ? "bg-white text-rose-700" : "bg-white/15 text-white hover:bg-white/25"}`}
            >
              {mode === "quiz" ? "📚 رجوع للمكتبة" : "🎯 اختبر نفسك"}
            </button>
            {summaryProduct ? (
              <button type="button" onClick={buySummary} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300">
                📄 حمّل ورقة المراجعة — {summaryProduct.price} ج.م
              </button>
            ) : (
              <span className="rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold text-white/70" title='أضف منتج بـ id="ecg-summary-pdf" من لوحة التحكم مع رفع ملف PDF وتحديد السعر'>
                📄 ورقة المراجعة — لسه محتاجة تتضاف من لوحة التحكم
              </span>
            )}
          </div>
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
