import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import ECGLearn from "./ECGLearn";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";
import { useFavorites } from "../lib/favorites";
import { useCart } from "../lib/cart";
import { useEcgPatternImages } from "../lib/ecgPatternImageStore";

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
  | "pe-pattern"
  | "p-mitral"
  | "p-pulmonale"
  | "lvh"
  | "rvh"
  | "digitalis";

type ECGPattern = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: Category;
  desc: string;
  descEn?: string;
  needsCPR: boolean;
  shockable: boolean;
  rate: string;
  rateEn?: string;
  wave: WaveKind;
  causes?: string[];
  causesEn?: string[];
  treatment?: string[];
  treatmentEn?: string[];
  memoryTrick?: string;
  memoryTrickEn?: string;
  // Richer detail-view fields (Smart Nurse–style tabs: خوارزمية/أسباب/أدوية/ميزات/إجراءات)
  algorithm?: string[];
  algorithmEn?: string[];
  medications?: string[];
  medicationsEn?: string[];
  features?: string[];
  featuresEn?: string[];
  ecgCriteria?: { p: string; pr: string; qrs: string; rhythm: string };
  ecgCriteriaEn?: { p: string; pr: string; qrs: string; rhythm: string };
  symptoms?: string[];
  symptomsEn?: string[];
  immediateActions?: string[];
  immediateActionsEn?: string[];
  hAndT?: { h: string[]; t: string[] };
  hAndTEn?: { h: string[]; t: string[] };
};

const CATEGORY_META: Record<Category, { label: string; labelEn: string; color: string; badge: string }> = {
  lethal: { label: "مميت", labelEn: "Lethal", color: "slate", badge: "bg-slate-700 text-white" },
  critical: { label: "حرج", labelEn: "Critical", color: "rose", badge: "bg-rose-600 text-white" },
  urgent: { label: "عاجل", labelEn: "Urgent", color: "amber", badge: "bg-amber-500 text-white" },
  watch: { label: "مراقبة", labelEn: "Watch", color: "sky", badge: "bg-sky-500 text-white" },
  normal: { label: "طبيعي", labelEn: "Normal", color: "emerald", badge: "bg-emerald-500 text-white" },
};

const PATTERNS: ECGPattern[] = [
  { id: "pea", nameAr: "النشاط الكهربائي بلا نبض (PEA)", nameEn: "Pulseless Electrical Activity", category: "lethal", desc: "إيقاع منظم على الشاشة لكن بدون نبض فعلي — عالج السبب فورًا.", descEn: "Organized rhythm on the monitor but no real pulse — treat the cause immediately.", needsCPR: true, shockable: false, rate: "متغير", rateEn: "Variable", wave: "sinus-slow",
    causes: ["نقص حجم الدم الشديد", "نقص الأكسجين", "استرواح الصدر الضاغط", "الانصمام الرئوي", "اضطراب شديد في الكهارل"],
    causesEn: ["Severe hypovolemia", "Hypoxia", "Tension pneumothorax", "Pulmonary embolism", "Severe electrolyte disturbance"],
    treatment: ["CPR فوري", "علاج السبب الكامن (H's & T's)", "أدرينالين حسب البروتوكول"],
    treatmentEn: ["Immediate CPR", "Treat the underlying cause (H's & T's)", "Epinephrine per protocol"],
    memoryTrick: "شاشة منظمة... لكن لا نبض حقيقي",
    memoryTrickEn: "Organized screen... but no real pulse",
    algorithm: ["تأكد من غياب النبض رغم وجود نظم على الشاشة", "ابدأ CPR فورًا", "دوّر خلال H's & T's بحثًا عن سبب قابل للعلاج", "أدرينالين كل 3-5 دقائق", "لا صدمة كهربائية — الإيقاع غير قابل للصدمة"],
    algorithmEn: ["Confirm the absence of a pulse despite an organized rhythm on the monitor", "Start CPR immediately", "Cycle through the H's & T's looking for a treatable cause", "Epinephrine every 3-5 minutes", "No defibrillation — the rhythm is not shockable"],
    medications: ["أدرينالين 1mg IV/IO كل 3-5 دقائق"],
    medicationsEn: ["Epinephrine 1mg IV/IO every 3-5 minutes"],
    features: ["نظم منظم على الشاشة", "غياب تام للنبض الفعلي", "قد يشبه أي إيقاع منظم آخر"],
    featuresEn: ["Organized rhythm on the monitor", "Complete absence of an actual pulse", "May resemble any other organized rhythm"],
    ecgCriteria: { p: "متغيرة حسب الإيقاع الأساسي", pr: "متغير", qrs: "متغير (ضيق أو عريض)", rhythm: "منظم غالبًا لكن بدون نبض" },
    ecgCriteriaEn: { p: "Variable, depending on the underlying rhythm", pr: "Variable", qrs: "Variable (narrow or wide)", rhythm: "Usually organized but without a pulse" },
    symptoms: ["فقدان الوعي", "غياب النبض عند الجس", "توقف تنفسي"],
    symptomsEn: ["Loss of consciousness", "Absent pulse on palpation", "Respiratory arrest"],
    immediateActions: ["ابدأ CPR فورًا", "ابحث عن H's & T's وعالج السبب", "أدرينالين حسب البروتوكول", "لا تصدم كهربائيًا"],
    immediateActionsEn: ["Start CPR immediately", "Look for H's & T's and treat the cause", "Epinephrine per protocol", "Do not defibrillate"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
    hAndTEn: { h: ["Hypoxia", "Hypovolemia", "Acidosis (H+)", "Potassium imbalance", "Hypothermia"], t: ["Tension pneumothorax", "Cardiac tamponade", "Toxins", "Pulmonary thrombosis", "Coronary thrombosis"] },
  },
  { id: "vf-coarse", nameAr: "الرجفان البطيني (خشن)", nameEn: "Coarse Ventricular Fibrillation", category: "lethal", desc: "نشاط كهربائي فوضوي بلا نتاج قلبي — صدمة كهربائية فورية.", descEn: "Chaotic electrical activity with no cardiac output — immediate defibrillation.", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-coarse",
    causes: ["تسرع بطيني غير معالَج", "احتشاء عضلة القلب", "اختلال شديد في الكهارل", "أدوية مسببة لاضطراب النظم"],
    causesEn: ["Untreated ventricular tachycardia", "Myocardial infarction", "Severe electrolyte imbalance", "Pro-arrhythmic drugs"],
    treatment: ["صدفة كهربائية فورية (لا تزامن)", "أوقف CPR فقط لحظة الصدمة", "أدوية: ليدوكايين، أميودارون، بروكاييناميد (LAP)"],
    treatmentEn: ["Immediate unsynchronized shock", "Pause CPR only for the shock itself", "Drugs: lidocaine, amiodarone, procainamide (LAP)"],
    memoryTrick: "Fib is flopping - خط متعرج فوضوي",
    memoryTrickEn: "Fib is flopping - a chaotic, wavy line",
    algorithm: ["تحقق من غياب النبض", "CPR فوري", "صدمة كهربائية غير متزامنة فورًا", "أدرينالين بعد الصدمة الثانية", "أميودارون أو ليدوكايين لو استمر"],
    algorithmEn: ["Confirm absence of pulse", "Immediate CPR", "Immediate unsynchronized defibrillation", "Epinephrine after the second shock", "Amiodarone or lidocaine if it persists"],
    medications: ["أدرينالين 1mg IV/IO", "أميودارون 300mg IV (جرعة أولى)", "ليدوكايين كبديل"],
    medicationsEn: ["Epinephrine 1mg IV/IO", "Amiodarone 300mg IV (first dose)", "Lidocaine as an alternative"],
    features: ["خط متعرج فوضوي عالي السعة", "لا QRS منظم", "لا نبض إطلاقًا"],
    featuresEn: ["Chaotic, high-amplitude wavy line", "No organized QRS", "No pulse whatsoever"],
    ecgCriteria: { p: "غير موجودة", pr: "غير قابل للقياس", qrs: "غير موجود / فوضوي", rhythm: "فوضوي تمامًا" },
    ecgCriteriaEn: { p: "Absent", pr: "Not measurable", qrs: "Absent / chaotic", rhythm: "Completely chaotic" },
    symptoms: ["فقدان وعي فوري", "غياب النبض", "توقف تنفسي"],
    symptomsEn: ["Immediate loss of consciousness", "Absent pulse", "Respiratory arrest"],
    immediateActions: ["CPR + صدمة كهربائية فورية", "أدرينالين بعد الصدمة الثانية", "أميودارون أو ليدوكايين لو استمر بعد 3 صدمات"],
    immediateActionsEn: ["CPR + immediate defibrillation", "Epinephrine after the second shock", "Amiodarone or lidocaine if it persists after 3 shocks"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
    hAndTEn: { h: ["Hypoxia", "Hypovolemia", "Acidosis (H+)", "Potassium imbalance", "Hypothermia"], t: ["Tension pneumothorax", "Cardiac tamponade", "Toxins", "Pulmonary thrombosis", "Coronary thrombosis"] },
  },
  { id: "asystole", nameAr: "الإيقاع المسطح (توقف القلب)", nameEn: "Asystole", category: "lethal", desc: "خط مستوٍ — توقف قلبي كامل غير قابل للصدمة.", descEn: "Flatline — complete cardiac arrest, not a shockable rhythm.", needsCPR: true, shockable: false, rate: "0", wave: "flat",
    causes: ["توقف قلبي تام", "نقص أكسجين شديد", "اختلال كهارل شديد", "توقف تنفسي طويل بدون تدخل"],
    causesEn: ["Complete cardiac arrest", "Severe hypoxia", "Severe electrolyte imbalance", "Prolonged untreated respiratory arrest"],
    treatment: ["CPR مستمر", "أدرينالين + أتروبين حسب البروتوكول", "لا صدمة كهربائية إطلاقًا"],
    treatmentEn: ["Continuous CPR", "Epinephrine + atropine per protocol", "No defibrillation whatsoever"],
    memoryTrick: "Assist Fully! المريض على خط مسطح",
    memoryTrickEn: "Assist Fully! The patient is on a flat line",
    algorithm: ["تأكد بخط مسطح في أكتر من اتجاه", "CPR مستمر", "أدرينالين كل 3-5 دقائق", "دوّر H's & T's", "لا صدمة كهربائية"],
    algorithmEn: ["Protocol of Confirm", "Continuous CPR", "Epinephrine every 3-5 minutes", "Cycle through the H's & T's", "No defibrillation"],
    medications: ["أدرينالين 1mg IV/IO كل 3-5 دقائق"],
    medicationsEn: ["Epinephrine 1mg IV/IO every 3-5 minutes"],
    features: ["خط مستقيم تمامًا", "لا نشاط كهربائي للقلب", "غير قابل للصدمة"],
    featuresEn: ["Completely straight line", "No cardiac electrical activity", "Not shockable"],
    ecgCriteria: { p: "غير موجودة", pr: "غير موجود", qrs: "غير موجود", rhythm: "لا يوجد" },
    ecgCriteriaEn: { p: "Absent", pr: "Absent", qrs: "Absent", rhythm: "None" },
    symptoms: ["فقدان وعي كامل", "غياب النبض والتنفس"],
    symptomsEn: ["Complete loss of consciousness", "Absent pulse and breathing"],
    immediateActions: ["تأكد من التوصيلات أولًا", "CPR مستمر بدون توقف", "أدرينالين حسب البروتوكول", "لا تصدم كهربائيًا إطلاقًا"],
    immediateActionsEn: ["Protocol of Confirm", "Continuous CPR without interruption", "Epinephrine per protocol", "Never defibrillate"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
    hAndTEn: { h: ["Hypoxia", "Hypovolemia", "Acidosis (H+)", "Potassium imbalance", "Hypothermia"], t: ["Tension pneumothorax", "Cardiac tamponade", "Toxins", "Pulmonary thrombosis", "Coronary thrombosis"] },
  },
  { id: "torsades", nameAr: "تواء الأطراف (Torsades de Pointes)", nameEn: "Torsades de Pointes", category: "critical", desc: "شكل خاص من VT متعدد الأشكال مرتبط بإطالة QT — يُعالج بشكل مختلف عن VT العادي.", descEn: "A special polymorphic VT linked to QT prolongation — treated differently from regular VT.", needsCPR: true, shockable: true, rate: "200-250", wave: "wide-twisting",
    causes: ["احتشاء عضلة القلب", "نقص الأكسجين", "نقص المغنيسيوم الشديد", "إطالة QT (خلقية أو دوائية)"],
    causesEn: ["Myocardial infarction", "Hypoxia", "Severe hypomagnesemia", "QT prolongation (congenital or drug-induced)"],
    treatment: ["كبريتات المغنيسيوم وريديًا (العلاج الأساسي)", "صدمة كهربائية لو غير مستقر", "أوقف أي دواء يطيل QT"],
    treatmentEn: ["IV magnesium sulfate (mainstay treatment)", "Defibrillation if unstable", "Stop any QT-prolonging drug"],
    memoryTrick: "Tornado Pointes — دوامة ملتفة حول الخط",
    memoryTrickEn: "Tornado Pointes — a swirl twisting around the baseline",
    algorithm: ["قيّم الاستقرار الدموي", "لو غير مستقر: صدمة كهربائية", "كبريتات المغنيسيوم وريديًا فورًا", "أوقف أي دواء يطيل QT", "صحح البوتاسيوم والمغنيسيوم"],
    algorithmEn: ["Assess hemodynamic stability", "If unstable: defibrillation", "IV magnesium sulfate immediately", "Stop any QT-prolonging drug", "Correct potassium and magnesium"],
    medications: ["كبريتات المغنيسيوم 1-2g IV (العلاج الأساسي)", "تصحيح بوتاسيوم/مغنيسيوم"],
    medicationsEn: ["Magnesium sulfate 1-2g IV (mainstay treatment)", "Potassium/magnesium correction"],
    features: ["QRS متعدد الأشكال يدور حول خط الأساس", "مرتبط بإطالة QT سابقة", "قد يتحول لرجفان بطيني"],
    featuresEn: ["Polymorphic QRS twisting around the baseline", "Associated with prior QT prolongation", "May progress to ventricular fibrillation"],
    ecgCriteria: { p: "غير مرئية غالبًا", pr: "غير قابل للقياس", qrs: "عريض جدًا ومتغير الشكل والاتجاه", rhythm: "سريع وغير منتظم الشكل" },
    ecgCriteriaEn: { p: "Usually not visible", pr: "Not measurable", qrs: "Very wide and varying in shape and direction", rhythm: "Fast and irregular in shape" },
    symptoms: ["دوخة أو إغماء", "خفقان شديد", "قد يتطور لتوقف قلبي"],
    symptomsEn: ["Dizziness or syncope", "Severe palpitations", "May progress to cardiac arrest"],
    immediateActions: ["كبريتات المغنيسيوم وريديًا فورًا", "صدمة كهربائية لو غير مستقر", "أوقف أي دواء يطيل QT"],
    immediateActionsEn: ["IV magnesium sulfate immediately", "Defibrillation if unstable", "Stop any QT-prolonging drug"],
  },
  { id: "vt-mono", nameAr: "تسرع القلب البطيني (أحادي الشكل)", nameEn: "Monomorphic Ventricular Tachycardia", category: "critical", desc: "تسرع واسع القالب ومنتظم — قد يكون مميتًا إن لم يُعالج.", descEn: "Wide-QRS, regular tachycardia — can be lethal if untreated.", needsCPR: true, shockable: true, rate: "100-250", wave: "wide-regular",
    causes: ["احتشاء عضلة القلب", "نقص الأكسجين", "نقص البوتاسيوم أو المغنيسيوم"],
    causesEn: ["Myocardial infarction", "Hypoxia", "Hypokalemia or hypomagnesemia"],
    treatment: ["بدون نبض: صدمة كهربائية فورية + CPR", "بنبض غير مستقر: تقويم نظم متزامن (Cardioversion)", "بنبض مستقر: أدوية مضادة لاضطراب النظم"],
    treatmentEn: ["Pulseless: immediate shock + CPR", "Unstable with pulse: synchronized cardioversion", "Stable with pulse: anti-arrhythmic drugs"],
    memoryTrick: "V Tach Tombstone pattern — شكل شاهد القبر",
    memoryTrickEn: "V Tach Tombstone pattern — a tombstone shape",
    algorithm: ["قيّم النبض", "بدون نبض: عامله زي VF (صدمة + CPR)", "بنبض وغير مستقر: تقويم نظم متزامن", "بنبض ومستقر: أدوية مضادة لاضطراب النظم"],
    algorithmEn: ["Assess the pulse", "Pulseless: treat like VF (shock + CPR)", "With a pulse and unstable: synchronized cardioversion", "With a pulse and stable: antiarrhythmic drugs"],
    medications: ["أميودارون 150mg IV (حالة مستقرة)", "أدرينالين لو بدون نبض"],
    medicationsEn: ["Amiodarone 150mg IV (stable case)", "Epinephrine if pulseless"],
    features: ["QRS عريض ومنتظم", "كل الضربات نفس الشكل (أحادي الشكل)", "معدل سريع 100-250"],
    featuresEn: ["Wide and regular QRS", "All beats have the same shape (monomorphic)", "Fast rate 100-250"],
    ecgCriteria: { p: "غالبًا غير مرئية (مدفونة في QRS)", pr: "غير قابل للقياس", qrs: "> 0.12 ثانية بشكل ثابت", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Usually not visible (buried in the QRS)", pr: "Not measurable", qrs: "Consistently > 0.12 seconds", rhythm: "Regular" },
    symptoms: ["خفقان", "دوخة", "قد يفقد الوعي أو ينخفض الضغط"],
    symptomsEn: ["Palpitations", "Dizziness", "May lose consciousness or have low blood pressure"],
    immediateActions: ["قيّم النبض فورًا", "بدون نبض = صدمة + CPR", "بنبض غير مستقر = تقويم نظم متزامن", "بنبض مستقر = أميودارون"],
    immediateActionsEn: ["Assess the pulse immediately", "Pulseless = shock + CPR", "Pulse present, unstable = synchronized cardioversion", "Pulse present, stable = amiodarone"],
  },
  { id: "vf-fine", nameAr: "الرجفان البطيني (ناعم)", nameEn: "Fine Ventricular Fibrillation", category: "critical", desc: "رجفان بطيني بسعة منخفضة — قد يُشتبه بخطأ بالإيقاع المسطح.", descEn: "Low-amplitude ventricular fibrillation — can be mistaken for a flat line.", needsCPR: true, shockable: true, rate: "—", wave: "chaotic-fine",
    causes: ["رجفان بطيني خشن لم يُعالج وتراجعت طاقته", "نقص أكسجين مطوّل", "احتشاء واسع"],
    causesEn: ["Untreated coarse VF that has lost energy over time", "Prolonged hypoxia", "Extensive infarction"],
    treatment: ["تأكد أنه ليس إيقاعًا مسطحًا (تحقق من التوصيلات أولاً)", "صدمة كهربائية فورية إذا تأكد التشخيص", "CPR مستمر"],
    treatmentEn: ["Confirm it isn't a flat line (check leads first)", "Immediate shock once confirmed", "Continuous CPR"],
    memoryTrick: "شبيه بالمسطح لكنه ليس كذلك — تحقق دائمًا من التوصيلات",
    memoryTrickEn: "Looks flat but isn't — always check the leads",
    algorithm: ["تحقق من التوصيلات (استبعد الخط المسطح)", "CPR فوري", "صدمة كهربائية إذا تأكد التشخيص", "أدرينالين وأميودارون حسب البروتوكول"],
    algorithmEn: ["Check the leads (rule out a flat line)", "Immediate CPR", "Defibrillation once the diagnosis is confirmed", "Epinephrine and amiodarone per protocol"],
    medications: ["أدرينالين 1mg IV/IO", "أميودارون 300mg IV"],
    medicationsEn: ["Epinephrine 1mg IV/IO", "Amiodarone 300mg IV"],
    features: ["سعة منخفضة جدًا", "قد يُشتبه به كخط مسطح", "لا نبض حقيقي"],
    featuresEn: ["Very low amplitude", "May be mistaken for a flat line", "No real pulse"],
    ecgCriteria: { p: "غير موجودة", pr: "غير قابل للقياس", qrs: "غير موجود / فوضوي منخفض السعة", rhythm: "فوضوي" },
    ecgCriteriaEn: { p: "Absent", pr: "Not measurable", qrs: "Absent / low-amplitude chaotic", rhythm: "Chaotic" },
    symptoms: ["فقدان وعي فوري", "غياب النبض"],
    symptomsEn: ["Immediate loss of consciousness", "Absent pulse"],
    immediateActions: ["تأكد من التوصيلات أولًا", "CPR فوري", "صدمة كهربائية بعد التأكيد"],
    immediateActionsEn: ["Check the leads first", "Immediate CPR", "Defibrillation after confirmation"],
    hAndT: { h: ["نقص الأكسجين", "نقص الحجم", "حماضة H+", "اختلال بوتاسيوم", "انخفاض الحرارة"], t: ["استرواح توتري", "دكاك القلب", "سموم", "خثرة رئوية", "خثرة إكليلية"] },
    hAndTEn: { h: ["Hypoxia", "Hypovolemia", "Acidosis (H+)", "Potassium imbalance", "Hypothermia"], t: ["Tension pneumothorax", "Cardiac tamponade", "Toxins", "Pulmonary thrombosis", "Coronary thrombosis"] },
  },
  { id: "block3", nameAr: "الإحصار الأذيني البطيني الكامل (الدرجة الثالثة)", nameEn: "Complete (3rd-Degree) Heart Block", category: "critical", desc: "انفصال تام بين نشاط الأذين والبطين — كل منهما بمعدله الخاص.", descEn: "Complete dissociation between atrial and ventricular activity — each beats at its own rate.", needsCPR: false, shockable: false, rate: "متغير (تفكك أذيني بطيني)", rateEn: "Variable (AV dissociation)", wave: "block3",
    causes: ["احتشاء عضلة القلب (خصوصًا السفلي)", "تليّف نظام التوصيل مع التقدم بالعمر", "تسمم دوائي (ديجوكسين، حاصرات بيتا)"],
    causesEn: ["Myocardial infarction (especially inferior)", "Age-related conduction system fibrosis", "Drug toxicity (digoxin, beta-blockers)"],
    treatment: ["استعد لناظمة قلب مؤقتة/دائمة", "أتروبين قد لا يكون فعالًا في هذا المستوى", "راقب علامات نقص التروية"],
    treatmentEn: ["Prepare for temporary/permanent pacing", "Atropine may not be effective at this level", "Monitor for signs of hypoperfusion"],
    memoryTrick: "P وQRS كل واحد ماشي لوحده — لا علاقة بينهما",
    memoryTrickEn: "P and QRS are each marching independently — no relationship between them",
    algorithm: ["راقب علامات عدم الاستقرار (هبوط ضغط، ألم صدر، تغير وعي)", "أتروبين كخطوة أولى (قد لا يفلح في هذا المستوى)", "استعد لناظمة قلب مؤقتة عبر الجلد أو الوريد", "عالج السبب الكامن"],
    algorithmEn: ["Monitor for signs of instability (hypotension, chest pain, altered consciousness)", "Atropine as a first step (may not work at this level of block)", "Prepare for a temporary transcutaneous or transvenous pacemaker", "Treat the underlying cause"],
    medications: ["أتروبين 0.5mg IV (غالبًا غير فعال في هذا المستوى)", "دوبامين أو أدرينالين كبديل لدعم المعدل"],
    medicationsEn: ["Atropine 0.5mg IV (usually ineffective at this level)", "Dopamine or epinephrine as an alternative to support the rate"],
    features: ["انفصال تام بين موجات P وQRS", "معدل الأذين أسرع من معدل البطين", "لا علاقة زمنية ثابتة بينهما"],
    featuresEn: ["Complete dissociation between P waves and QRS", "Atrial rate faster than ventricular rate", "No fixed temporal relationship between them"],
    ecgCriteria: { p: "منتظمة لكن مستقلة عن QRS", pr: "متغير تمامًا بلا نمط", qrs: "ضيق أو عريض حسب مصدر الإيقاع الهارب", rhythm: "P منتظم وQRS منتظم، لكن كل منهما لوحده" },
    ecgCriteriaEn: { p: "Regular but independent of the QRS", pr: "Completely variable with no pattern", qrs: "Narrow or wide depending on the source of the escape rhythm", rhythm: "P is regular and QRS is regular, but each is independent" },
    symptoms: ["دوخة شديدة", "إغماء", "ضيق تنفس", "ألم صدر"],
    symptomsEn: ["Severe dizziness", "Syncope", "Shortness of breath", "Chest pain"],
    immediateActions: ["استعد لناظمة قلب فورًا", "أتروبين كمحاولة أولى", "راقب علامات نقص التروية والاستقرار الدموي"],
    immediateActionsEn: ["Prepare for immediate pacing", "Atropine as a first attempt", "Monitor for signs of hypoperfusion and hemodynamic instability"],
  },
  { id: "svt", nameAr: "تسرع فوق البطيني (SVT)", nameEn: "Supraventricular Tachycardia", category: "urgent", desc: "تسرع ضيق القالب ومنتظم بمعدل مرتفع جدًا، غالبًا بدون موجة P واضحة.", descEn: "Narrow-QRS, regular tachycardia at a very high rate, often with no clear P wave.", needsCPR: false, shockable: false, rate: "150-250", wave: "narrow-fast",
    causes: ["المنبهات (كافيين، مخدرات)", "المجهود الشديد", "نقص الأكسجين", "أمراض قلبية كامنة"],
    causesEn: ["Stimulants (caffeine, drugs)", "Intense exertion", "Hypoxia", "Underlying heart disease"],
    treatment: ["مناورة مبهمية (حبس نفس، ماء بارد على الوجه)", "أدينوزين دفعة سريعة ثم محلول ملحي فورًا", "تقويم نظم متزامن إذا فشل ما سبق"],
    treatmentEn: ["Vagal maneuvers (breath-holding, cold water on the face)", "Rapid IV adenosine push followed by saline flush", "Synchronized cardioversion if the above fails"],
    memoryTrick: "Super fast = Supraventricular",
    memoryTrickEn: "Super fast = Supraventricular",
    algorithm: ["قيّم الاستقرار الدموي", "مستقر: مناورات مبهمية ثم أدينوزين", "غير مستقر: تقويم نظم متزامن"],
    algorithmEn: ["Assess stability", "Vagal maneuvers then adenosine", "Synchronized cardioversion"],
    medications: ["أدينوزين 6mg IV دفعة سريعة، ثم 12mg لو لزم", "مانع قنوات كالسيوم كبديل"],
    medicationsEn: ["Adenosine rapid push", "Calcium channel blocker as alternative"],
    features: ["بداية ونهاية مفاجئة", "موجة P غالبًا مختفية", "معدل ثابت جدًا 150-250"],
    featuresEn: ["Sudden onset/offset", "P wave often absent", "Very fixed rate"],
    ecgCriteria: { p: "غالبًا غير مرئية", pr: "غير قابل للقياس", qrs: "ضيق < 0.12 ثانية", rhythm: "منتظم جدًا" },
    ecgCriteriaEn: { p: "Often not visible", pr: "Not measurable", qrs: "Narrow", rhythm: "Very regular" },
    symptoms: ["خفقان مفاجئ", "دوخة", "ضيق تنفس"],
    symptomsEn: ["Sudden palpitations", "Dizziness", "Shortness of breath"],
    immediateActions: ["مناورات مبهمية أولًا", "أدينوزين لو استمر", "تقويم نظم لو غير مستقر"],
    immediateActionsEn: ["Vagal maneuvers first", "Adenosine if persists", "Cardioversion if unstable"],
  },
  { id: "afib-rvr", nameAr: "رجفان أذيني بمعدل بطيني سريع (AFib RVR)", nameEn: "Atrial Fibrillation with RVR", category: "urgent", desc: "إيقاع ضيق القالب وغير منتظم تمامًا (irregularly irregular) بمعدل سريع.", descEn: "Narrow-QRS, irregularly irregular rhythm at a fast rate.", needsCPR: false, shockable: false, rate: "100-175", wave: "narrow-irregular",
    causes: ["مرض صمامي", "قصور القلب", "ارتفاع ضغط الدم الرئوي", "COPD", "بعد جراحة قلب"],
    causesEn: ["Valvular disease", "Heart failure", "Pulmonary hypertension", "COPD", "Post cardiac surgery"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات بالإيكو عبر المريء", "ديجوكسين (تحقق من ATP: النبض، السمية، البوتاسيوم قبل الإعطاء)", "مضادات تخثر (وارفارين) مع متابعة INR"],
    treatmentEn: ["Cardioversion after ruling out clots via TEE", "Digoxin (check ATP: pulse, toxicity, potassium before giving)", "Anticoagulation (warfarin) with INR follow-up"],
    memoryTrick: "No P wave = Fibrillation Flopping",
    memoryTrickEn: "No P wave = Fibrillation Flopping",
    algorithm: ["قيّم الاستقرار", "تحكم في المعدل أولًا", "مضادات تخثر حسب خطر الجلطة"],
    algorithmEn: ["Assess stability", "Rate control first", "Anticoagulation per stroke risk"],
    medications: ["ديلتيازم أو بيتا بلوكر للتحكم بالمعدل", "مضاد تخثر"],
    medicationsEn: ["Diltiazem or beta-blocker", "Anticoagulant, e.g. apixaban"],
    features: ["إيقاع غير منتظم تمامًا", "بدون موجة P واضحة", "معدل بطيني سريع"],
    featuresEn: ["Irregularly irregular", "No clear P wave", "Fast ventricular rate"],
    ecgCriteria: { p: "غائبة، أمواج رجفان", pr: "غير قابل للقياس", qrs: "ضيق غالبًا", rhythm: "غير منتظم تمامًا" },
    ecgCriteriaEn: { p: "Absent, fibrillatory waves", pr: "Not measurable", qrs: "Usually narrow", rhythm: "Irregularly irregular" },
    symptoms: ["خفقان", "تعب", "خطر تكوّن جلطات"],
    symptomsEn: ["Palpitations", "Fatigue", "Clot/stroke risk"],
    immediateActions: ["تحكم في المعدل", "قيّم الحاجة لمضاد تخثر", "تقويم نظم لو غير مستقر"],
    immediateActionsEn: ["Rate control", "Assess anticoagulation need", "Cardioversion if unstable"],
  },
  { id: "block2-2", nameAr: "الإحصار من الدرجة الثانية (النوع الثاني — موبيتز 2)", nameEn: "2nd-Degree AV Block, Type II (Mobitz II)", category: "urgent", desc: "قد يتطور فجأة لإحصار كامل — يحتاج مراقبة عاجلة واستعداد للناظمة.", descEn: "May suddenly progress to complete block — needs urgent monitoring and pacing readiness.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "block2",
    causes: ["مرض في نظام التوصيل (كلا الحزمتين)", "احتشاء عضلة القلب", "تليّف نظام التوصيل"],
    causesEn: ["Disease in the conduction system (both bundles)", "Myocardial infarction", "Conduction system fibrosis"],
    treatment: ["استعد لناظمة قلب — قد يتطور فجأة لإحصار كامل", "راقب باستمرار ولا تعتمد على أتروبين وحده"],
    treatmentEn: ["Prepare for pacing — may suddenly progress to complete block", "Continuous monitoring; don't rely on atropine alone"],
    memoryTrick: "إسقاط منتظم للـQRS — النمط ثابت ومتوقع",
    memoryTrickEn: "Regular dropping of the QRS — the pattern is fixed and predictable",
    algorithm: ["راقب لتطور مفاجئ لإحصار كامل", "استعد لناظمة قلب", "تجنب أتروبين وحده (قد لا يكفي)"],
    algorithmEn: ["Watch for sudden complete block", "Prepare for pacing", "Atropine alone may be insufficient"],
    medications: ["أتروبين كمحاولة مؤقتة", "استعداد لناظمة عبر الجلد"],
    medicationsEn: ["Atropine as temporary measure", "Transcutaneous pacing standby"],
    features: ["فترة PR ثابتة قبل السقوط", "سقوط QRS فجأة بدون إنذار"],
    featuresEn: ["Constant PR before drop", "Sudden unwarned dropped QRS"],
    ecgCriteria: { p: "منتظمة", pr: "ثابت", qrs: "يسقط فجأة أحيانًا", rhythm: "غير منتظم بسبب السقوط" },
    ecgCriteriaEn: { p: "Regular", pr: "Constant", qrs: "Occasionally dropped", rhythm: "Irregular due to drops" },
    symptoms: ["دوخة", "إغماء محتمل"],
    symptomsEn: ["Dizziness", "Possible syncope"],
    immediateActions: ["راقب عن قرب لتطور إحصار كامل", "استعد لناظمة قلب"],
    immediateActionsEn: ["Monitor closely for complete block", "Prepare for pacing"],
  },
  { id: "aflutter", nameAr: "رفرفة أذينية (Atrial Flutter)", nameEn: "Atrial Flutter", category: "urgent", desc: "موجات أذينية منتظمة بشكل سن المنشار، غالبًا بنسبة توصيل 2:1.", descEn: "Regular sawtooth-shaped atrial waves, often with 2:1 conduction.", needsCPR: false, shockable: false, rate: "غالبًا حوالي 150", rateEn: "Usually around 150", wave: "sawtooth",
    causes: ["مرض صمامي", "قصور القلب", "ارتفاع ضغط الدم الرئوي", "COPD", "بعد جراحة قلب"],
    causesEn: ["Valvular disease", "Heart failure", "Pulmonary hypertension", "COPD", "Post cardiac surgery"],
    treatment: ["تقويم نظم بعد استبعاد الجلطات", "ديجوكسين (تحقق من ATP قبل الإعطاء)", "مضادات تخثر مع متابعة INR"],
    treatmentEn: ["Cardioversion after ruling out clots", "Digoxin (check ATP before giving)", "Anticoagulation with INR follow-up"],
    memoryTrick: "A Flutter = Sawtooth (شكل سن المنشار)",
    memoryTrickEn: "A Flutter = Sawtooth (saw-tooth shape)",
    algorithm: ["قيّم الاستقرار والمعدل", "تحكم في المعدل أو تقويم نظم", "مضادات تخثر حسب الخطر"],
    algorithmEn: ["Assess stability and rate", "Rate control or cardioversion", "Anticoagulation per risk"],
    medications: ["بيتا بلوكر أو ديلتيازم", "مضاد تخثر"],
    medicationsEn: ["Beta-blocker or diltiazem", "Anticoagulant"],
    features: ["موجات F منتظمة بشكل سن المنشار", "نسبة توصيل ثابتة غالبًا"],
    featuresEn: ["Regular sawtooth F waves", "Often fixed conduction ratio"],
    ecgCriteria: { p: "غائبة، أمواج F", pr: "غير قابل للقياس", qrs: "ضيق غالبًا", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Absent, F waves", pr: "Not measurable", qrs: "Usually narrow", rhythm: "Usually regular" },
    symptoms: ["خفقان", "تعب"],
    symptomsEn: ["Palpitations", "Fatigue"],
    immediateActions: ["تحكم في المعدل", "قيّم مضاد التخثر"],
    immediateActionsEn: ["Rate control", "Assess anticoagulation"],
  },
  { id: "afib-controlled", nameAr: "رجفان أذيني بمعدل متحكم", nameEn: "Atrial Fibrillation, Rate-Controlled", category: "watch", desc: "نفس عدم الانتظام لكن بمعدل ضمن الطبيعي — راقب فقط.", descEn: "Same irregularity as AFib but with a rate within normal range — monitor only.", needsCPR: false, shockable: false, rate: "60-100", wave: "narrow-irregular",
    causes: ["نفس أسباب AFib RVR لكن معدل مضبوط بالعلاج"],
    causesEn: ["Same causes as AFib RVR, but rate controlled with treatment"],
    treatment: ["استمرار متابعة معدل النظم والأدوية الحالية"],
    treatmentEn: ["Continue monitoring rate control and current medications"],
    memoryTrick: "No P wave لكن المعدل طبيعي",
    memoryTrickEn: "No P wave but the rate is normal",
    algorithm: ["راقب المعدل والأعراض", "استمر في مضاد التخثر المقرر"],
    algorithmEn: ["Monitor rate and symptoms", "Continue prescribed anticoagulation"],
    medications: ["استمرار على بيتا بلوكر/ديلتيازم حسب الوصفة"],
    medicationsEn: ["Continue beta-blocker/diltiazem as prescribed"],
    features: ["نفس عدم انتظام AFib لكن بمعدل طبيعي", "بدون موجة P"],
    featuresEn: ["Same AFib irregularity, normal rate", "No P wave"],
    ecgCriteria: { p: "غائبة", pr: "غير قابل للقياس", qrs: "ضيق", rhythm: "غير منتظم لكن بمعدل طبيعي" },
    ecgCriteriaEn: { p: "Absent", pr: "Not measurable", qrs: "Narrow", rhythm: "Irregular, normal rate" },
    symptoms: ["غالبًا بدون أعراض"],
    symptomsEn: ["Often asymptomatic"],
    immediateActions: ["راقب فقط", "استمر في العلاج المقرر"],
    immediateActionsEn: ["Monitor only", "Continue prescribed treatment"],
  },
  { id: "block1", nameAr: "الإحصار من الدرجة الأولى", nameEn: "1st-Degree AV Block", category: "watch", desc: "فترة PR مطوّلة فقط (>0.20 ثانية)، كل موجة P متبوعة بـQRS.", descEn: "Only a prolonged PR interval (>0.20s); every P wave is followed by a QRS.", needsCPR: false, shockable: false, rate: "60-100", wave: "block1",
    causes: ["زيادة توتر العصب المبهم", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم)", "تليّف بسيط في العقدة الأذينية البطينية"],
    causesEn: ["Increased vagal tone", "Medications (beta-blockers, calcium channel blockers)", "Mild AV node fibrosis"],
    treatment: ["غالبًا لا يحتاج علاج — راقب فقط", "راجع الأدوية المسببة إذا كانت هي السبب"],
    treatmentEn: ["Usually needs no treatment — monitor only", "Review causative medications if applicable"],
    memoryTrick: "PR interval طويل وثابت فقط — لا إسقاط للـQRS",
    memoryTrickEn: "Only a long, fixed PR interval — no dropped QRS",
    algorithm: ["لا يحتاج تدخل عادةً", "راجع الأدوية المسببة (مثل بيتا بلوكر)"],
    algorithmEn: ["Usually no intervention needed", "Review causative meds"],
    medications: ["لا يوجد علاج نوعي عادة"],
    medicationsEn: ["No specific treatment usually needed"],
    features: ["فترة PR مطوّلة فقط > 0.20 ثانية", "كل موجة P متبوعة بـQRS"],
    featuresEn: ["Only prolonged PR > 0.20s", "Every P followed by QRS"],
    ecgCriteria: { p: "طبيعية", pr: "> 0.20 ثانية", qrs: "طبيعي", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Prolonged", qrs: "Normal", rhythm: "Regular" },
    symptoms: ["غالبًا بدون أعراض"],
    symptomsEn: ["Usually asymptomatic"],
    immediateActions: ["راقب فقط", "لا تدخل مطلوب عادة"],
    immediateActionsEn: ["Monitor only", "No intervention usually required"],
  },
  { id: "wenckebach", nameAr: "الإحصار من الدرجة الثانية (النوع الأول — فينكباخ)", nameEn: "2nd-Degree AV Block, Type I (Wenckebach)", category: "watch", desc: "إطالة تدريجية في PR interval حتى يسقط QRS، ثم تتكرر الدورة.", descEn: "Progressive PR-interval lengthening until a QRS is dropped, then the cycle repeats.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "wenckebach",
    causes: ["زيادة توتر العصب المبهم", "احتشاء عضلة القلب السفلي", "أدوية تبطئ التوصيل"],
    causesEn: ["Increased vagal tone", "Inferior myocardial infarction", "Drugs that slow conduction"],
    treatment: ["غالبًا حميد — راقب فقط ما لم يظهر أعراض", "أتروبين إذا كان المريض عرضيًا (شحوب، برودة، هبوط ضغط)"],
    treatmentEn: ["Usually benign — monitor only unless symptomatic", "Atropine if the patient is symptomatic (pallor, cold skin, hypotension)"],
    memoryTrick: "PR بيطول... بيطول... لحد ما يسقط ضربة",
    memoryTrickEn: "The PR keeps lengthening... lengthening... until a beat is dropped",
    algorithm: ["راقب الأعراض", "أتروبين لو الأعراض واضحة", "نادرًا يحتاج ناظمة"],
    algorithmEn: ["Monitor symptoms", "Atropine if symptomatic", "Rarely needs pacing"],
    medications: ["أتروبين لو بطء أعراضي"],
    medicationsEn: ["Atropine if symptomatic bradycardia"],
    features: ["إطالة تدريجية لـPR حتى تسقط ضربة", "النمط يتكرر"],
    featuresEn: ["Progressive PR lengthening until drop", "Pattern repeats"],
    ecgCriteria: { p: "منتظمة", pr: "يطول تدريجيًا", qrs: "يسقط دوريًا", rhythm: "غير منتظم بنمط متكرر" },
    ecgCriteriaEn: { p: "Regular", pr: "Progressively lengthens", qrs: "Periodically dropped", rhythm: "Irregular, repeating pattern" },
    symptoms: ["غالبًا بدون أعراض", "دوخة خفيفة أحيانًا"],
    symptomsEn: ["Often asymptomatic", "Occasional mild dizziness"],
    immediateActions: ["راقب فقط غالبًا", "أتروبين لو أعراضي"],
    immediateActionsEn: ["Usually monitor only", "Atropine if symptomatic"],
  },
  { id: "rbbb", nameAr: "إحصار الحزمة اليمنى (RBBB)", nameEn: "Right Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليمنى — QRS عريض مع شكل RSR' (أذنين أرنب) في V1.", descEn: "Delayed right bundle conduction — wide QRS with an rsR' (rabbit-ears) shape in V1.", needsCPR: false, shockable: false, rate: "60-100", wave: "bbb-notch",
    causes: ["الانصمام الرئوي", "أمراض الرئة المزمنة", "أمراض القلب الخلقية", "قد يكون موجودًا طبيعيًا عند بعض الأشخاص"],
    causesEn: ["Pulmonary embolism", "Chronic lung disease", "Congenital heart disease", "Can be a normal variant in some people"],
    treatment: ["غالبًا لا يحتاج علاج طارئ بمفرده", "قيّم السبب الكامن (خصوصًا لو ظهر حديثًا)"],
    treatmentEn: ["Usually needs no emergency treatment on its own", "Evaluate the underlying cause (especially if new)"],
    memoryTrick: "شكل M أو أذنين أرنب في V1",
    memoryTrickEn: "M shape or rabbit-ears in V1",
    algorithm: ["ابحث عن السبب الكامن", "لا يحتاج علاج مباشر عادة"],
    algorithmEn: ["Investigate underlying cause", "No direct treatment usually"],
    medications: ["لا يوجد علاج نوعي"],
    medicationsEn: ["No specific treatment"],
    features: ["شكل rsR' (أذنين أرنب/M) في V1", "QRS > 120ms"],
    featuresEn: ["rsR' rabbit-ears/M shape in V1", "Wide QRS > 120ms"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "> 0.12 ثانية", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Wide", rhythm: "Regular" },
    symptoms: ["غالبًا بدون أعراض"],
    symptomsEn: ["Often asymptomatic"],
    immediateActions: ["راقب وابحث عن السبب"],
    immediateActionsEn: ["Monitor and investigate cause"],
  },
  { id: "lbbb", nameAr: "إحصار الحزمة اليسرى (LBBB)", nameEn: "Left Bundle Branch Block", category: "watch", desc: "تأخر توصيل الحزمة اليسرى — QRS عريض، قد يخفي علامات احتشاء أخرى على ECG.", descEn: "Delayed left bundle conduction — wide QRS, can mask other infarction signs on ECG.", needsCPR: false, shockable: false, rate: "60-100", wave: "lbbb-wide",
    causes: ["أمراض القلب الإقفارية", "ارتفاع ضغط الدم المزمن", "اعتلال عضلة القلب"],
    causesEn: ["Ischemic heart disease", "Chronic hypertension", "Cardiomyopathy"],
    treatment: ["إذا ظهر حديثًا مع أعراض صدرية عامله كاحتشاء حتى يثبت العكس", "قيّم وظيفة القلب (إيكو)"],
    treatmentEn: ["If new with chest pain, treat as MI until proven otherwise", "Evaluate cardiac function (echo)"],
    memoryTrick: "LBBB جديد + ألم صدر = عامله زي الاحتشاء",
    memoryTrickEn: "New LBBB + chest pain = treat as an infarction",
    algorithm: ["ابحث عن السبب (غالبًا مرض قلبي كامن)", "LBBB جديد + ألم صدر = عامله كاحتشاء"],
    algorithmEn: ["Investigate cause — often underlying heart disease", "New LBBB + chest pain = treat as MI"],
    medications: ["حسب السبب الكامن"],
    medicationsEn: ["Per underlying cause"],
    features: ["S عميقة وr ضعيفة أو غائبة", "قد يخفي علامات احتشاء"],
    featuresEn: ["Deep S, weak/absent r", "Can mask MI changes"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "> 0.12 ثانية", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Wide", rhythm: "Regular" },
    symptoms: ["حسب السبب الكامن، قد يكون بدون أعراض"],
    symptomsEn: ["Depends on cause, may be asymptomatic"],
    immediateActions: ["لو جديد + ألم صدر: عامله كاحتشاء", "ابحث عن السبب الكامن"],
    immediateActionsEn: ["If new + chest pain: treat as MI", "Investigate underlying cause"],
  },
  { id: "junctional", nameAr: "الإيقاع العقدي (Junctional Rhythm)", nameEn: "Junctional Rhythm", category: "watch", desc: "العقدة الأذينية البطينية تتولى تنظيم القلب بدل SA node — موجة P غائبة أو مقلوبة.", descEn: "The AV node takes over pacing instead of the SA node — P wave absent or inverted.", needsCPR: false, shockable: false, rate: "40-60", wave: "junctional",
    causes: ["ضعف أو توقف العقدة الجيبية", "زيادة توتر العصب المبهم", "تسمم بالديجوكسين"],
    causesEn: ["SA node weakness or failure", "Increased vagal tone", "Digoxin toxicity"],
    treatment: ["راقب الأعراض وعلامات ضعف التروية", "أتروبين إذا كان عرضيًا", "راجع أدوية الديجوكسين"],
    treatmentEn: ["Monitor symptoms and signs of hypoperfusion", "Atropine if symptomatic", "Review digoxin medications"],
    memoryTrick: "P wave غائبة أو مقلوبة — القلب اتحكم فيه العقدة مش SA node",
    memoryTrickEn: "P wave absent or inverted — the heart is being driven by the AV node, not the SA node",
    algorithm: ["قيّم السبب (أدوية، نقص أكسجين)", "أتروبين لو بطيء وأعراضي"],
    algorithmEn: ["Assess cause — meds, hypoxia", "Atropine if slow and symptomatic"],
    medications: ["أتروبين لو أعراضي"],
    medicationsEn: ["Atropine if symptomatic"],
    features: ["موجة P غائبة أو مقلوبة", "القلب تتحكم فيه العقدة الأذينية البطينية بدل SA node"],
    featuresEn: ["Absent or inverted P wave", "AV node takes over pacing"],
    ecgCriteria: { p: "غائبة أو مقلوبة", pr: "قصير أو غير موجود", qrs: "ضيق غالبًا", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Absent or inverted", pr: "Short or absent", qrs: "Usually narrow", rhythm: "Regular" },
    symptoms: ["دوخة لو المعدل بطيء جدًا"],
    symptomsEn: ["Dizziness if very slow"],
    immediateActions: ["راقب المعدل والأعراض", "عالج السبب الكامن"],
    immediateActionsEn: ["Monitor rate and symptoms", "Treat underlying cause"],
  },
  { id: "pvcs", nameAr: "انقباضات بطينية مبكرة متكررة (PVCs)", nameEn: "Frequent Premature Ventricular Contractions", category: "watch", desc: "نبضات مبكرة واسعة القالب وسط إيقاع منتظم — راقب النمط والتكرار.", descEn: "Early, wide-QRS beats within an otherwise regular rhythm — monitor the pattern and frequency.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "pvc",
    causes: ["نقص الأكسجين", "اختلال كهارل (بوتاسيوم، مغنيسيوم)", "كافيين أو منبهات", "إجهاد أو قلق", "أمراض قلبية كامنة"],
    causesEn: ["Hypoxia", "Electrolyte imbalance (potassium, magnesium)", "Caffeine or stimulants", "Stress or anxiety", "Underlying heart disease"],
    treatment: ["راقب التكرار (متكررة/زوجية/ثلاثية)", "صحح اختلال الكهارل", "أبلغ الطبيب لو تحولت لأنماط خطيرة (Runs of VT)"],
    treatmentEn: ["Monitor frequency (frequent/paired/tripled)", "Correct electrolyte imbalance", "Notify the physician if it evolves into dangerous patterns (runs of VT)"],
    memoryTrick: "نبضة مبكرة واسعة وسط إيقاع منتظم",
    memoryTrickEn: "An early wide beat amid a regular rhythm",
    algorithm: ["قيّم التكرار والنمط", "صحح الكهارل (بوتاسيوم/مغنيسيوم)", "بيتا بلوكر لو أعراضي ومتكرر"],
    algorithmEn: ["Assess frequency and pattern", "Correct electrolytes", "Beta-blocker if symptomatic/frequent"],
    medications: ["بيتا بلوكر لو أعراضي", "تصحيح بوتاسيوم/مغنيسيوم"],
    medicationsEn: ["Beta-blocker if symptomatic", "Correct K+/Mg2+"],
    features: ["نبضة مبكرة واسعة القالب", "غالبًا متبوعة بوقفة تعويضية"],
    featuresEn: ["Early wide-QRS beat", "Often followed by compensatory pause"],
    ecgCriteria: { p: "غائبة قبل الـPVC", pr: "غير قابل للقياس للـPVC", qrs: "عريض للضربة المبكرة", rhythm: "غير منتظم بسبب الضربات المبكرة" },
    ecgCriteriaEn: { p: "Absent before the PVC", pr: "Not measurable for the PVC", qrs: "Wide for the early beat", rhythm: "Irregular due to early beats" },
    symptoms: ["إحساس بخفقة/رفة في الصدر", "غالبًا حميدة"],
    symptomsEn: ["Fluttering/skipped-beat sensation", "Often benign"],
    immediateActions: ["راقب التكرار والنمط", "صحح الكهارل"],
    immediateActionsEn: ["Monitor frequency/pattern", "Correct electrolytes"],
  },
  { id: "sinus-tach", nameAr: "تسرع الجيوب الأنفية", nameEn: "Sinus Tachycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل مرتفع — ابحث عن السبب (ألم، حمى، جفاف).", descEn: "Normal-shaped sinus rhythm but at an elevated rate — look for the cause (pain, fever, dehydration).", needsCPR: false, shockable: false, rate: "100-150", wave: "sinus-fast",
    causes: ["الألم", "الحمى", "الجفاف أو نقص حجم الدم", "القلق", "فرط نشاط الغدة الدرقية"],
    causesEn: ["Pain", "Fever", "Dehydration or hypovolemia", "Anxiety", "Hyperthyroidism"],
    treatment: ["لا علاج مباشر — عالج السبب الكامن", "راقب العلامات الحيوية"],
    treatmentEn: ["No direct treatment — treat the underlying cause", "Monitor vital signs"],
    memoryTrick: "شكل جيبي طبيعي لكن أسرع",
    memoryTrickEn: "Normal sinus shape, just faster",
    algorithm: ["ابحث عن السبب الكامن (ألم، حمى، جفاف)", "عالج السبب لا المعدل نفسه"],
    algorithmEn: ["Find underlying cause — pain, fever, dehydration", "Treat cause, not the rate itself"],
    medications: ["لا يوجد علاج مباشر — عالج السبب"],
    medicationsEn: ["No direct treatment — treat the cause"],
    features: ["إيقاع جيبي طبيعي لكن أسرع", "موجة P طبيعية قبل كل QRS"],
    featuresEn: ["Normal sinus rhythm, just faster", "Normal P before every QRS"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "ضيق", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Narrow", rhythm: "Regular" },
    symptoms: ["خفقان خفيف", "أعراض السبب الكامن"],
    symptomsEn: ["Mild palpitations", "Symptoms of underlying cause"],
    immediateActions: ["ابحث عن وعالج السبب الكامن"],
    immediateActionsEn: ["Find and treat underlying cause"],
  },
  { id: "sinus-brady", nameAr: "بطء الجيوب الأنفية", nameEn: "Sinus Bradycardia", category: "watch", desc: "إيقاع جيبي طبيعي الشكل لكن بمعدل منخفض — قد يكون طبيعيًا في الرياضيين.", descEn: "Normal-shaped sinus rhythm but at a low rate — can be normal in athletes.", needsCPR: false, shockable: false, rate: "أقل من 60", rateEn: "Less than 60", wave: "sinus-slow",
    causes: ["مناورة مبهمية (الشد أثناء التبرز)", "أدوية (حاصرات بيتا، حاصرات قنوات الكالسيوم)", "طبيعي عند الرياضيين"],
    causesEn: ["Vagal maneuver (straining during defecation)", "Medications (beta-blockers, calcium channel blockers)", "Normal in athletes"],
    treatment: ["أتروبين فقط إذا كان عرضيًا (شحوب، برودة، انخفاض تروية)", "لا علاج إذا كان بدون أعراض"],
    treatmentEn: ["Atropine only if symptomatic (pallor, cold skin, poor perfusion)", "No treatment if asymptomatic"],
    memoryTrick: "BRADYcardia = أقل من 60",
    memoryTrickEn: "BRADYcardia = less than 60",
    algorithm: ["قيّم الاستقرار", "أتروبين لو أعراضي", "ناظمة لو لم يستجب"],
    algorithmEn: ["Assess stability", "Atropine if symptomatic", "Pacing if unresponsive"],
    medications: ["أتروبين 0.5mg IV لو أعراضي"],
    medicationsEn: ["Atropine 0.5mg IV if symptomatic"],
    features: ["إيقاع جيبي طبيعي لكن أبطأ من 60", "شائع عند الرياضيين"],
    featuresEn: ["Normal sinus rhythm, rate < 60", "Common in athletes"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "ضيق", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Narrow", rhythm: "Regular" },
    symptoms: ["غالبًا بدون أعراض", "دوخة لو أعراضي"],
    symptomsEn: ["Often asymptomatic", "Dizziness if symptomatic"],
    immediateActions: ["راقب لو بدون أعراض", "أتروبين لو أعراضي"],
    immediateActionsEn: ["Monitor if asymptomatic", "Atropine if symptomatic"],
  },
  { id: "nsr", nameAr: "الإيقاع الجيبي الطبيعي", nameEn: "Normal Sinus Rhythm", category: "normal", desc: "موجة P منتظمة تسبق كل QRS، معدل ومسافات طبيعية.", descEn: "A regular P wave precedes every QRS, with normal rate and intervals.", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-normal",
    causes: ["قلب سليم يعمل بشكل طبيعي"],
    causesEn: ["A healthy heart functioning normally"],
    treatment: ["لا علاج — استمر بالمراقبة الروتينية"],
    treatmentEn: ["No treatment — continue routine monitoring"],
    memoryTrick: "نبضة منتظمة ومتباعدة بالتساوي",
    memoryTrickEn: "Regular beats, evenly spaced",
    algorithm: ["لا تدخل مطلوب", "استمر في المراقبة الروتينية"],
    algorithmEn: ["No intervention required", "Continue routine monitoring"],
    medications: [],
    medicationsEn: [],
    features: ["المعدل 60-100 نبضة/دقيقة", "إيقاع منتظم", "موجة P قبل كل QRS", "فترة PR 0.12-0.20 ثانية", "QRS < 0.12 ثانية", "شكل موجة P متماثل"],
    featuresEn: ["Rate 60-100 bpm", "Regular rhythm", "P wave before every QRS", "PR 0.12-0.20s", "QRS < 0.12s", "Symmetric P wave shape"],
    ecgCriteria: { p: "موجبة في II,I؛ سلبية في aVR", pr: "0.12-0.20 ثانية", qrs: "> 0.12 ثانية (ضيق)", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Positive in I,II; negative in aVR", pr: "0.12-0.20s", qrs: "< 0.12s, narrow", rhythm: "Regular" },
    symptoms: ["بدون أعراض", "ديناميكا دموية طبيعية"],
    symptomsEn: ["No symptoms", "Normal hemodynamics"],
    immediateActions: ["لا تدخل مطلوب", "استمر في المراقبة الروتينية"],
    immediateActionsEn: ["No intervention required", "Continue routine monitoring"],
  },
  { id: "wpw", nameAr: "متلازمة وولف-باركنسون-وايت (WPW)", nameEn: "Wolff-Parkinson-White Syndrome", category: "watch", desc: "مسار توصيل إضافي بين الأذين والبطين — PR قصير وQRS عريض مع موجة دلتا مميزة.", descEn: "An accessory conduction pathway between atrium and ventricle — short PR and wide QRS with a distinctive delta wave.", needsCPR: false, shockable: false, rate: "60-100 (أو تسرع نوبي)", rateEn: "60-100 (or paroxysmal tachycardia)", wave: "wpw",
    causes: ["مسار توصيل شاذ خلقي (Accessory pathway) يتخطى العقدة الأذينية البطينية"],
    causesEn: ["Congenital abnormal conduction pathway (accessory pathway) bypassing the AV node"],
    treatment: ["خطر الإصابة بتسرعات نوبية سريعة", "قد يحتاج استئصال بالقسطرة (Ablation) لاحقًا"],
    treatmentEn: ["Risk of rapid paroxysmal tachycardias", "May need catheter ablation later"],
    memoryTrick: "Short PR + Wide QRS + Delta wave",
    memoryTrickEn: "Short PR + Wide QRS + Delta wave",
    algorithm: ["تجنب أدوية حاصرات العقدة الأذينية البطينية وقت تسرع نوبي", "استشارة قسطرة كهربية لاستئصال المسار الإضافي"],
    algorithmEn: ["Avoid AV-nodal blockers during tachycardia", "Refer for EP study/ablation"],
    medications: ["تجنب ديجوكسين وأدينوزين وحاصرات كالسيوم لو AFib مصاحب"],
    medicationsEn: ["Avoid digoxin/adenosine/CCBs if AFib present"],
    features: ["PR قصير", "QRS عريض مع موجة دلتا", "خطر تسرع نوبي"],
    featuresEn: ["Short PR", "Wide QRS with delta wave", "Risk of paroxysmal tachycardia"],
    ecgCriteria: { p: "طبيعية", pr: "قصير < 0.12 ثانية", qrs: "عريض > 0.12 ثانية", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal", pr: "Short < 0.12s", qrs: "Wide > 0.12s", rhythm: "Usually regular" },
    symptoms: ["خفقان نوبي", "دوخة"],
    symptomsEn: ["Paroxysmal palpitations", "Dizziness"],
    immediateActions: ["راقب وتجنب حاصرات العقدة الأذينية البطينية", "استشر لاستئصال المسار"],
    immediateActionsEn: ["Monitor, avoid AV-nodal blockers", "Refer for ablation"],
  },
  { id: "stemi", nameAr: "احتشاء بارتفاع ST (STEMI)", nameEn: "ST-Elevation Myocardial Infarction", category: "critical", desc: "ارتفاع في قطعة ST فوق الخط الأساسي — انسداد كامل في شريان تاجي، حالة طارئة قصوى.", descEn: "ST-segment elevation above baseline — complete coronary artery occlusion, a maximal emergency.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "stemi",
    causes: ["انسداد كامل مفاجئ لشريان تاجي"],
    causesEn: ["Sudden complete occlusion of a coronary artery"],
    treatment: ["تفعيل بروتوكول المختبر القسطري فورًا (Door-to-balloon)", "أكسجين، أسبرين، نيتروجليسرين، مسكن حسب البروتوكول", "ECG متكرر ومراقبة قريبة"],
    treatmentEn: ["Activate the cath lab protocol immediately (door-to-balloon)", "Oxygen, aspirin, nitroglycerin, analgesia per protocol", "Serial ECGs and close monitoring"],
    memoryTrick: "ST مرتفع = عضلة قلب بتموت الآن",
    memoryTrickEn: "ST elevation = heart muscle is dying right now",
    algorithm: ["ECG خلال 10 دقائق من الوصول", "فعّل بروتوكول المختبر القسطري (Door-to-Balloon أقل من 90 دقيقة)", "أكسجين لو التشبع أقل من 90%", "أسبرين + نيتروجليسرين + مسكن حسب البروتوكول"],
    algorithmEn: ["ECG within 10 minutes of arrival", "Activate the cath lab protocol (door-to-balloon under 90 minutes)", "Oxygen if saturation is below 90%", "MONA"],
    medications: ["أسبرين 325mg مضغ", "نيتروجليسرين تحت اللسان", "مورفين للألم", "أكسجين حسب الحاجة"],
    medicationsEn: ["Aspirin 325mg, chewed", "Sublingual nitroglycerin", "Morphine for pain", "Oxygen as needed"],
    features: ["ارتفاع ST أكثر من 1mm في اتجاهين متجاورين على الأقل", "قد يصاحبه تغير متبادل", "تطور موجة Q لاحقًا"],
    featuresEn: ["ST elevation greater than 1mm in at least two contiguous leads", "Reciprocal changes", "Q wave development later"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي (قد يتسع لاحقًا)", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Usually normal", pr: "Normal", qrs: "Normal (may widen later)", rhythm: "Usually regular" },
    symptoms: ["ألم صدر ضاغط مستمر", "تعرق وغثيان", "ضيق تنفس", "ألم منتشر للذراع أو الفك"],
    symptomsEn: ["Persistent crushing chest pain", "Sweating and nausea", "Shortness of breath", "Pain radiating to the arm or jaw"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا", "MONA حسب البروتوكول", "ECG ومراقبة متكررة"],
    immediateActionsEn: ["Door-to-Balloon", "MONA per protocol", "Repeated ECG and monitoring"],
  },
  { id: "ischemia", nameAr: "نقص تروية عضلة القلب (انخفاض ST)", nameEn: "Myocardial Ischemia (ST Depression)", category: "urgent", desc: "انخفاض في قطعة ST — نقص تروية دون انسداد كامل بعد؛ فرّق بينه وبين الذبحة الصدرية بالإنزيمات والتوقيت.", descEn: "ST-segment depression — reduced perfusion without full occlusion yet; differentiate from angina using enzymes and timing.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "ischemia",
    causes: ["ذبحة صدرية غير مستقرة", "نقص تروية تحت الشغاف", "زيادة الحمل على القلب مع مرض تاجي كامن"],
    causesEn: ["Unstable angina", "Subendocardial ischemia", "Increased cardiac workload with underlying coronary disease"],
    treatment: ["أكسجين، نيترات، مراقبة إنزيمات القلب", "ECG متسلسل لمتابعة التطور نحو احتشاء"],
    treatmentEn: ["Oxygen, nitrates, monitor cardiac enzymes", "Serial ECGs to track progression toward infarction"],
    memoryTrick: "ST منخفض = القلب تعبان لكن لسه مايتش",
    memoryTrickEn: "ST depression = the heart is stressed but hasn't died yet",
    algorithm: ["قارن بتخطيط سابق وأنزيمات القلب", "فرّق بينه وبين انسداد كامل"],
    algorithmEn: ["Compare with prior ECG and cardiac enzymes", "Differentiate from full occlusion"],
    medications: ["أسبرين", "نيتروجليسرين للألم"],
    medicationsEn: ["Aspirin", "Nitroglycerin for pain"],
    features: ["انخفاض قطعة ST", "بدون انسداد كامل"],
    featuresEn: ["ST segment depression", "No complete occlusion"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["ألم صدر", "قد يكون خفيف أو متقطع"],
    symptomsEn: ["Chest pain", "May be mild or intermittent"],
    immediateActions: ["أسبرين ونيتروجليسرين", "ECG وإنزيمات متكررة"],
    immediateActionsEn: ["Aspirin and nitroglycerin", "Serial ECG and enzymes"],
  },
  { id: "sinus-arrhythmia", nameAr: "عدم انتظام الإيقاع الجيبي", nameEn: "Sinus Arrhythmia", category: "normal", desc: "المعدل يتغير بشكل طبيعي مع التنفس (يزيد بالشهيق ويقل بالزفير) — شائع عند الشباب والرياضيين.", descEn: "Rate normally varies with respiration (increases on inspiration, decreases on expiration) — common in young people and athletes.", needsCPR: false, shockable: false, rate: "60-100", wave: "sinus-arrhythmia",
    causes: ["تغير طبيعي مرتبط بالتنفس عبر العصب المبهم"],
    causesEn: ["Normal respiration-linked variation via the vagus nerve"],
    treatment: ["لا علاج — نتيجة طبيعية"],
    treatmentEn: ["No treatment — a normal finding"],
    memoryTrick: "المعدل يتغير مع التنفس — طبيعي تمامًا",
    memoryTrickEn: "Rate changes with breathing — completely normal",
    algorithm: ["لا تدخل مطلوب عادة"],
    algorithmEn: ["No intervention usually needed"],
    medications: [],
    medicationsEn: [],
    features: ["المعدل يتغير مع التنفس", "شائع عند الشباب والرياضيين"],
    featuresEn: ["Rate varies with respiration", "Common in young/athletic people"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "ضيق", rhythm: "غير منتظم بشكل دوري مع التنفس" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Narrow", rhythm: "Cyclically irregular with breathing" },
    symptoms: ["بدون أعراض عادة"],
    symptomsEn: ["Usually asymptomatic"],
    immediateActions: ["لا تدخل مطلوب", "راقب فقط"],
    immediateActionsEn: ["No intervention required", "Monitor only"],
  },
  { id: "pac", nameAr: "الانقباض الأذيني المبكر (PAC)", nameEn: "Premature Atrial Contraction", category: "normal", desc: "ضربة مبكرة ضيقة القالب بموجة P مختلفة الشكل عن باقي الموجات.", descEn: "An early, narrow-QRS beat with a P wave shaped differently from the others.", needsCPR: false, shockable: false, rate: "طبيعي", rateEn: "Normal", wave: "pac",
    causes: ["كافيين أو منبهات", "إجهاد", "قلة نوم", "طبيعي أحيانًا بدون سبب واضح"],
    causesEn: ["Caffeine or stimulants", "Stress", "Sleep deprivation", "Sometimes normal with no clear cause"],
    treatment: ["غالبًا لا يحتاج علاج", "قلل المنبهات لو متكررة ومزعجة"],
    treatmentEn: ["Usually needs no treatment", "Reduce stimulants if frequent and bothersome"],
    memoryTrick: "ضربة مبكرة ضيقة بموجة P مختلفة الشكل",
    memoryTrickEn: "An early narrow beat with a differently shaped P wave",
    algorithm: ["قلل المنبهات (كافيين، توتر) لو متكرر"],
    algorithmEn: ["Reduce stimulants if frequent"],
    medications: ["غالبًا لا يوجد علاج مطلوب"],
    medicationsEn: ["Usually no treatment needed"],
    features: ["ضربة مبكرة بموجة P مختلفة الشكل", "QRS ضيق القالب"],
    featuresEn: ["Early beat with differently-shaped P", "Narrow QRS"],
    ecgCriteria: { p: "شكل مختلف عن باقي موجات P", pr: "قد يختلف قليلًا", qrs: "ضيق", rhythm: "غير منتظم بسبب الضربة المبكرة" },
    ecgCriteriaEn: { p: "Different shape from other P waves", pr: "May vary slightly", qrs: "Narrow", rhythm: "Irregular due to early beat" },
    symptoms: ["إحساس برفة خفيفة أحيانًا", "غالبًا بدون أعراض"],
    symptomsEn: ["Occasional mild flutter sensation", "Often asymptomatic"],
    immediateActions: ["راقب فقط عادة", "قلل المنبهات لو متكرر"],
    immediateActionsEn: ["Usually just monitor", "Reduce stimulants if frequent"],
  },
  { id: "paced", nameAr: "إيقاع المنظّم الكهربائي (Paced Rhythm)", nameEn: "Paced Rhythm", category: "watch", desc: "إشارات المنظم تسبق كل QRS عريض — تحقق من الالتقاط (Capture) والاستشعار (Sensing).", descEn: "Pacer spikes precede every wide QRS — check for capture and sensing.", needsCPR: false, shockable: false, rate: "حسب إعداد الجهاز", rateEn: "Depends on device setting", wave: "paced",
    causes: ["مريض لديه منظم قلب كهربائي دائم أو مؤقت"],
    causesEn: ["Patient has a permanent or temporary electronic pacemaker"],
    treatment: ["تحقق من نجاح الالتقاط (كل Spike يتبعه QRS)", "تحقق من الاستشعار الصحيح", "أبلغ الطبيب لو فشل الالتقاط أو الاستشعار"],
    treatmentEn: ["Confirm successful capture (every spike followed by a QRS)", "Confirm correct sensing", "Notify the physician if capture or sensing fails"],
    memoryTrick: "خط رأسي حاد (Spike) قبل كل QRS عريض",
    memoryTrickEn: "A sharp vertical spike before every wide QRS",
    algorithm: ["تأكد من التقاط الناظمة فعليًا للقلب", "افحص عتبة الناظمة والبطارية لو فشل الالتقاط"],
    algorithmEn: ["Confirm pacer capture", "Check pacer threshold/battery if capture fails"],
    medications: [],
    medicationsEn: [],
    features: ["شوكة ناظمة (Spike) قبل كل QRS عريض", "معدل حسب إعداد الجهاز"],
    featuresEn: ["Pacer spike before each wide QRS", "Rate per device setting"],
    ecgCriteria: { p: "قد تكون غائبة أو منفصلة عن الشوكة", pr: "غير قابل للتطبيق عادة", qrs: "عريض بعد كل شوكة", rhythm: "منتظم حسب إعداد الجهاز" },
    ecgCriteriaEn: { p: "May be absent or dissociated from spike", pr: "Usually not applicable", qrs: "Wide after each spike", rhythm: "Regular per device setting" },
    symptoms: ["حسب سبب تركيب الناظمة"],
    symptomsEn: ["Depends on reason for pacer"],
    immediateActions: ["تأكد من الالتقاط الفعّال", "أبلغ لو فشل الالتقاط أو التوصيل"],
    immediateActionsEn: ["Confirm effective capture", "Report failure to capture/sense"],
  },
  { id: "shortqt", nameAr: "متلازمة QT القصير", nameEn: "Short QT Syndrome", category: "urgent", desc: "فترة QT قصيرة بشكل غير طبيعي — نادرة لكنها ترفع خطر الرجفان البطيني والموت المفاجئ.", descEn: "Abnormally short QT interval — rare, but raises the risk of ventricular fibrillation and sudden death.", needsCPR: false, shockable: false, rate: "طبيعي", rateEn: "Normal", wave: "shortqt",
    causes: ["خلل خلقي في قنوات البوتاسيوم (وراثي غالبًا)", "فرط كالسيوم الدم أحيانًا"],
    causesEn: ["Congenital potassium channel abnormality (usually inherited)", "Sometimes hypercalcemia"],
    treatment: ["إحالة لطبيب قلب متخصص بالنظم", "قد يحتاج مزيل رجفان مزروع (ICD) في الحالات عالية الخطورة"],
    treatmentEn: ["Refer to an electrophysiology specialist", "May need an implantable defibrillator (ICD) in high-risk cases"],
    memoryTrick: "QT قصير جدًا = خطر VF نادر لكن خطير",
    memoryTrickEn: "Very short QT = rare but dangerous risk of VF",
    algorithm: ["قيّم خطر تسرع بطيني/رجفان", "استشارة قلب لتقييم مزيل رجفان مزروع"],
    algorithmEn: ["Assess VT/VF risk", "Cardiology referral for possible ICD"],
    medications: ["حسب توصية أخصائي القلب"],
    medicationsEn: ["Per cardiology guidance"],
    features: ["QRS طبيعي، T تصل مبكرًا جدًا", "نادر لكن خطر لعدم انتظام مميت"],
    featuresEn: ["Normal QRS, T arrives very early", "Rare but risk of lethal arrhythmia"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Regular" },
    symptoms: ["قد يكون بدون أعراض حتى حدوث عدم انتظام خطير"],
    symptomsEn: ["May be asymptomatic until a dangerous arrhythmia occurs"],
    immediateActions: ["استشارة قلب عاجلة", "راقب لعدم انتظام خطير"],
    immediateActionsEn: ["Urgent cardiology referral", "Monitor for dangerous arrhythmia"],
  },
  { id: "mat", nameAr: "تسرع الأذيني متعدد البؤر (MAT)", nameEn: "Multifocal Atrial Tachycardia", category: "urgent", desc: "3 أشكال مختلفة على الأقل لموجة P في نفس الشريط — غالبًا مرتبط بأمراض الرئة المزمنة (COPD).", descEn: "At least 3 different P-wave shapes on the same strip — often linked to chronic lung disease (COPD).", needsCPR: false, shockable: false, rate: "100-180", wave: "mat",
    causes: ["تفاقم مرض الانسداد الرئوي المزمن (COPD)", "نقص الأكسجين", "اختلال كهارل"],
    causesEn: ["COPD exacerbation", "Hypoxia", "Electrolyte imbalance"],
    treatment: ["عالج المرض الرئوي الكامن ونقص الأكسجين أولًا", "حاصرات قنوات الكالسيوم قد تُستخدم", "تجنب الديجوكسين عادة"],
    treatmentEn: ["Treat the underlying lung disease and hypoxia first", "Calcium channel blockers may be used", "Digoxin is usually avoided"],
    memoryTrick: "3 أشكال مختلفة لموجة P على الأقل",
    memoryTrickEn: "At least 3 different P-wave shapes",
    algorithm: ["عالج مرض الرئة الكامن (غالبًا COPD)", "صحح الأكسجين والكهارل"],
    algorithmEn: ["Treat underlying lung disease, often COPD", "Correct oxygenation/electrolytes"],
    medications: ["مانع قنوات كالسيوم كخيار للتحكم بالمعدل", "تجنب بيتا بلوكر لو COPD شديد"],
    medicationsEn: ["Calcium channel blocker as rate-control option", "Avoid beta-blockers if severe COPD"],
    features: ["3 أشكال مختلفة على الأقل لموجة P", "غالبًا مرتبط بأمراض الرئة المزمنة"],
    featuresEn: ["At least 3 different P wave shapes", "Often linked to chronic lung disease"],
    ecgCriteria: { p: "3 أشكال مختلفة على الأقل", pr: "متغير", qrs: "ضيق غالبًا", rhythm: "غير منتظم" },
    ecgCriteriaEn: { p: "At least 3 different shapes", pr: "Variable", qrs: "Usually narrow", rhythm: "Irregular" },
    symptoms: ["خفقان", "أعراض مرض الرئة الكامن"],
    symptomsEn: ["Palpitations", "Symptoms of underlying lung disease"],
    immediateActions: ["عالج السبب الرئوي الكامن", "صحح الأكسجين والكهارل"],
    immediateActionsEn: ["Treat underlying lung cause", "Correct oxygenation/electrolytes"],
  },
  { id: "pericarditis", nameAr: "نمط ECG في التهاب التامور", nameEn: "Pericarditis ECG Pattern", category: "urgent", desc: "ارتفاع ST منتشر بشكل سرج (Saddle-shaped) مع انخفاض PR — يختلف عن احتشاء واحد بمنطقة محددة.", descEn: "Diffuse, saddle-shaped ST elevation with PR depression — unlike an infarction confined to one territory.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "pericarditis",
    causes: ["عدوى فيروسية", "ما بعد احتشاء عضلة القلب (متلازمة درسلر)", "أمراض المناعة الذاتية", "الفشل الكلوي"],
    causesEn: ["Viral infection", "Post-myocardial infarction (Dressler syndrome)", "Autoimmune disease", "Renal failure"],
    treatment: ["مضادات الالتهاب اللاستيرويدية (NSAIDs)", "كولشيسين", "راقب علامات الاندحاس القلبي (Tamponade)"],
    treatmentEn: ["NSAIDs", "Colchicine", "Monitor for signs of cardiac tamponade"],
    memoryTrick: "ارتفاع ST منتشر في كل الـLeads تقريبًا، مش منطقة واحدة بس",
    memoryTrickEn: "Diffuse ST elevation across almost all leads, not just one territory",
    algorithm: ["فرّق عن الاحتشاء بالتوزيع الواسع والزمن", "مضادات التهاب لاستيرويدية كعلاج أساسي"],
    algorithmEn: ["Differentiate from MI by widespread pattern and timing", "NSAIDs as mainstay treatment"],
    medications: ["إيبوبروفين أو أسبرين جرعة عالية", "كولشيسين لتقليل الانتكاس"],
    medicationsEn: ["Ibuprofen or high-dose aspirin", "Colchicine to reduce recurrence"],
    features: ["ارتفاع ST منتشر بشكل سرجي", "انخفاض PR"],
    featuresEn: ["Diffuse saddle-shaped ST elevation", "PR depression"],
    ecgCriteria: { p: "طبيعية", pr: "منخفض", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal", pr: "Depressed", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["ألم صدر يزيد بالاستلقاء ويقل بالجلوس للأمام", "قد يصاحبه حمى خفيفة"],
    symptomsEn: ["Chest pain worse lying down, better sitting forward", "May have mild fever"],
    immediateActions: ["مضادات التهاب لاستيرويدية", "فرّق عن الاحتشاء أولًا"],
    immediateActionsEn: ["NSAIDs", "Rule out MI first"],
  },
  { id: "hypokalemia-ecg", nameAr: "تغيرات ECG في نقص بوتاسيوم الدم", nameEn: "Hypokalemia ECG Changes", category: "urgent", desc: "تسطح موجة T وظهور موجة U واضحة، مع إطالة QT.", descEn: "Flattened T wave with a prominent U wave, plus QT prolongation.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "hypokalemia",
    causes: ["فقدان بوتاسيوم عبر القيء أو الإسهال", "مدرات البول", "الأنسولين الزائد"],
    causesEn: ["Potassium loss through vomiting or diarrhea", "Diuretics", "Excess insulin"],
    treatment: ["تعويض بوتاسيوم وريدي/فموي حسب الشدة", "مراقبة القلب المستمرة أثناء التعويض", "راقب خطر اضطراب النظم (خصوصًا Torsades)"],
    treatmentEn: ["Replace potassium IV/orally per severity", "Continuous cardiac monitoring during replacement", "Watch for arrhythmia risk (especially Torsades)"],
    memoryTrick: "T مسطحة + U واضحة = بوتاسيوم واطي",
    memoryTrickEn: "Flat T + prominent U = low potassium",
    algorithm: ["قيّم شدة الانخفاض والأعراض", "تعويض بوتاسيوم وريدي/فموي حسب الشدة"],
    algorithmEn: ["Assess severity and symptoms", "Replace K+ IV/oral per severity"],
    medications: ["تعويض بوتاسيوم كلوريد"],
    medicationsEn: ["Potassium chloride replacement"],
    features: ["تسطح موجة T", "ظهور موجة U واضحة", "إطالة QT"],
    featuresEn: ["Flattened T wave", "Prominent U wave", "QT prolongation"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا، خطر عدم انتظام لو شديد" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Regular; arrhythmia risk if severe" },
    symptoms: ["ضعف عضلي", "تشنجات", "خفقان"],
    symptomsEn: ["Muscle weakness", "Cramps", "Palpitations"],
    immediateActions: ["عوّض البوتاسيوم حسب الشدة", "راقب النظم أثناء التعويض"],
    immediateActionsEn: ["Replace potassium per severity", "Monitor rhythm during replacement"],
  },
  { id: "longqt", nameAr: "متلازمة QT الطويل", nameEn: "Long QT Syndrome", category: "urgent", desc: "إطالة فترة QT — خطر التطور لتواء الأطراف (Torsades) والموت المفاجئ.", descEn: "Prolonged QT interval — risk of progressing to Torsades de Pointes and sudden death.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "longqt",
    causes: ["خلقي (وراثي)", "أدوية تطيل QT (بعض المضادات الحيوية والنفسية)", "نقص المغنيسيوم أو البوتاسيوم أو الكالسيوم"],
    causesEn: ["Congenital (inherited)", "QT-prolonging drugs (certain antibiotics and psychiatric medications)", "Low magnesium, potassium, or calcium"],
    treatment: ["أوقف أي دواء يطيل QT", "صحح اختلال الكهارل", "راقب تطور تواء الأطراف"],
    treatmentEn: ["Stop any QT-prolonging drug", "Correct electrolyte imbalance", "Monitor for progression to Torsades"],
    memoryTrick: "QT طويل = القلب مستني وقت أطول قبل الاستعداد للضربة الجاية",
    memoryTrickEn: "Long QT = the heart waits longer before it's ready for the next beat",
    algorithm: ["أوقف أي دواء يطيل QT", "صحح البوتاسيوم والمغنيسيوم", "استشارة قلب لو خلقي"],
    algorithmEn: ["Stop any QT-prolonging drug", "Correct K+/Mg2+", "Cardiology referral if congenital"],
    medications: ["كبريتات المغنيسيوم لو حدث Torsades", "بيتا بلوكر للحالات الخلقية"],
    medicationsEn: ["Magnesium sulfate if Torsades occurs", "Beta-blocker for congenital cases"],
    features: ["إطالة فترة QT", "خطر التطور لتواء الأطراف (Torsades)"],
    featuresEn: ["Prolonged QT interval", "Risk of progression to Torsades"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم، خطر عدم انتظام مفاجئ" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Regular; risk of sudden arrhythmia" },
    symptoms: ["إغماء مفاجئ", "خطر الموت المفاجئ"],
    symptomsEn: ["Sudden syncope", "Risk of sudden death"],
    immediateActions: ["أوقف الأدوية المطيلة لـQT", "صحح الكهارل", "راقب لخطر Torsades"],
    immediateActionsEn: ["Stop QT-prolonging drugs", "Correct electrolytes", "Monitor for Torsades risk"],
  },
  { id: "hypocalcemia-ecg", nameAr: "تغيرات ECG في نقص كالسيوم الدم", nameEn: "Hypocalcemia ECG Changes", category: "urgent", desc: "إطالة قطعة ST بشكل رئيسي (يمدد QT بدون تغيير كبير في شكل T).", descEn: "Mainly ST-segment prolongation (extends the QT without much change in T-wave shape).", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "longqt",
    causes: ["قصور الغدة جار الدرقية", "الفشل الكلوي", "نقص فيتامين د الشديد"],
    causesEn: ["Hypoparathyroidism", "Renal failure", "Severe vitamin D deficiency"],
    treatment: ["تعويض كالسيوم وريدي في الحالات العرضية", "راقب تشنجات العضلات وعلامات تيتاني"],
    treatmentEn: ["IV calcium replacement in symptomatic cases", "Monitor for muscle cramps and tetany"],
    memoryTrick: "ST طويل = السبب غالبًا كالسيوم واطي",
    memoryTrickEn: "Prolonged ST = usually caused by low calcium",
    algorithm: ["قيّم شدة نقص الكالسيوم", "كالسيوم وريدي للحالات الأعراضية"],
    algorithmEn: ["Assess severity of hypocalcemia", "IV calcium for symptomatic cases"],
    medications: ["كالسيوم جلوكونات وريدي"],
    medicationsEn: ["IV calcium gluconate"],
    features: ["إطالة قطعة ST بشكل رئيسي", "بدون تغيير كبير في شكل T", "إطالة QT"],
    featuresEn: ["Mainly ST segment prolongation", "Little change in T wave shape", "QT prolongation"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["تنميل حول الفم والأطراف", "تشنجات عضلية"],
    symptomsEn: ["Perioral/extremity tingling", "Muscle cramps/tetany"],
    immediateActions: ["كالسيوم وريدي للأعراض الشديدة", "راقب QT أثناء العلاج"],
    immediateActionsEn: ["IV calcium for severe symptoms", "Monitor QT during treatment"],
  },
  { id: "hypercalcemia-ecg", nameAr: "تغيرات ECG في فرط كالسيوم الدم", nameEn: "Hypercalcemia ECG Changes", category: "urgent", desc: "اختصار فترة QT بشكل رئيسي (اختصار قطعة ST خصوصًا) — عكس تأثير نقص الكالسيوم تمامًا.", descEn: "Mainly QT shortening — the ST segment shortens especially — the exact opposite of hypocalcemia's effect.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "shortqt",
    causes: ["فرط نشاط الغدة جار الدرقية", "الأورام الخبيثة مع نقائل عظمية", "فرط فيتامين د"],
    causesEn: ["Hyperparathyroidism", "Malignancy with bone metastases", "Vitamin D excess"],
    treatment: ["ترطيب وريدي (سوائل) كخط أول", "بيسفوسفونات أو كالسيتونين في الحالات الشديدة"],
    treatmentEn: ["IV fluids as first-line", "Bisphosphonates or calcitonin in severe cases"],
    memoryTrick: "QT قصير = كالسيوم عالي (عكس الطويل اللي بيبقى كالسيوم واطي)",
    memoryTrickEn: "Short QT = high calcium (the opposite of prolonged QT, which is low calcium)",
    algorithm: ["قيّمي شدة فرط الكالسيوم وأعراضه", "ابدئي ترطيب وريدي وعالجي السبب الأساسي"],
    algorithmEn: ["Assess severity and symptoms", "Start IV hydration and treat the underlying cause"],
    medications: ["محلول ملحي وريدي", "بيسفوسفونات"],
    medicationsEn: ["IV normal saline", "Bisphosphonates"],
    features: ["اختصار فترة QT", "اختصار قطعة ST خصوصًا", "قد تظهر اضطرابات نظم في الحالات الشديدة"],
    featuresEn: ["QT shortening", "Especially ST segment shortening", "Arrhythmias may appear in severe cases"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["إمساك وغثيان وتعب عام", "تشوش ذهني في الحالات الشديدة", "زيادة العطش والتبول"],
    symptomsEn: ["Constipation, nausea, and general fatigue", "Mental confusion in severe cases", "Increased thirst and urination"],
    immediateActions: ["ترطيب وريدي فوري", "راقبي القلب لاضطرابات النظم"],
    immediateActionsEn: ["Immediate IV hydration", "Monitor the heart for arrhythmias"],
  },
  { id: "hyperkalemia-ecg", nameAr: "تغيرات ECG في فرط بوتاسيوم الدم", nameEn: "Hyperkalemia ECG Changes", category: "critical", desc: "موجات T مدببة وضيقة (Peaked/Tented) — إذا لم تُعالَج تتطور لتوقف قلبي.", descEn: "Peaked, narrow (tented) T waves — can progress to cardiac arrest if untreated.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "hyperkalemia",
    causes: ["الفشل الكلوي", "تحلل عضلي أو خلوي شديد", "بعض الأدوية (مثبطات ACE، مدرات موفرة للبوتاسيوم)"],
    causesEn: ["Renal failure", "Severe tissue or cell breakdown", "Certain medications (ACE inhibitors, potassium-sparing diuretics)"],
    treatment: ["كالسيوم جلوكونات وريدي لحماية القلب فورًا", "إنسولين + جلوكوز، وسالبوتامول لخفض البوتاسيوم داخل الخلايا", "قد يحتاج غسيل كلوي عاجل"],
    treatmentEn: ["IV calcium gluconate immediately to protect the heart", "Insulin + glucose, and albuterol to shift potassium into cells", "May need urgent dialysis"],
    memoryTrick: "T مدببة وضيقة = بوتاسيوم عالي حتى يثبت العكس",
    memoryTrickEn: "Peaked, narrow T = high potassium until proven otherwise",
    algorithm: ["قيّم شدة الأعراض ودرجة الارتفاع", "كالسيوم جلوكونات فورًا لحماية عضلة القلب", "إنسولين + جلوكوز وسالبوتامول لنقل البوتاسيوم داخل الخلايا", "علاج نهائي بغسيل كلوي أو مدرات لو لزم"],
    algorithmEn: ["Assess symptom severity and the degree of elevation", "Calcium gluconate immediately to protect the heart muscle", "Insulin + glucose and salbutamol to shift potassium into the cells", "Definitive treatment with dialysis or diuretics if needed"],
    medications: ["كالسيوم جلوكونات 10% IV (حماية القلب فورًا)", "إنسولين سريع + جلوكوز 50%", "سالبوتامول استنشاق", "كايكسالات أو غسيل كلوي (إزالة نهائية)"],
    medicationsEn: ["Calcium gluconate 10% IV (immediate cardiac protection)", "Rapid-acting insulin + 50% glucose", "Inhaled salbutamol", "Kayexalate or dialysis (definitive removal)"],
    features: ["موجات T مدببة وضيقة", "تسطح موجة P مع الارتفاع الشديد", "اتساع QRS تدريجيًا مع الارتفاع الشديد"],
    featuresEn: ["Tented", "P-wave flattening with severe elevation", "Gradual QRS widening with severe elevation"],
    ecgCriteria: { p: "تتسطح أو تختفي مع الارتفاع الشديد", pr: "يطول تدريجيًا", qrs: "يتسع تدريجيًا مع الارتفاع الشديد", rhythm: "قد يتحول لموجة جيبية ثم توقف قلبي" },
    ecgCriteriaEn: { p: "Flattens or disappears with severe elevation", pr: "Gradually lengthens", qrs: "Gradually widens with severe elevation", rhythm: "May progress to a sine-wave pattern then cardiac arrest" },
    symptoms: ["ضعف عضلي أو خدر", "خفقان", "قد يصل لتوقف قلبي مفاجئ"],
    symptomsEn: ["Muscle weakness or numbness", "Palpitations", "May progress to sudden cardiac arrest"],
    immediateActions: ["كالسيوم جلوكونات فورًا لحماية القلب", "إنسولين+جلوكوز وسالبوتامول لخفض البوتاسيوم", "استعد لغسيل كلوي عاجل"],
    immediateActionsEn: ["Calcium gluconate immediately to protect the heart", "Insulin+glucose and salbutamol to lower potassium", "Prepare for urgent dialysis"],
  },
  { id: "nstemi", nameAr: "احتشاء بدون ارتفاع ST / ذبحة غير مستقرة", nameEn: "NSTEMI / Unstable Angina", category: "critical", desc: "انخفاض ST أو انقلاب موجة T بدون ارتفاع ST — فرّق بينهما بإنزيمات القلب والتوقيت.", descEn: "ST depression or T-wave inversion without ST elevation — differentiate using cardiac enzymes and timing.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "ischemia",
    causes: ["انسداد جزئي أو مؤقت لشريان تاجي"],
    causesEn: ["Partial or temporary coronary artery occlusion"],
    treatment: ["أسبرين، مضادات تخثر حسب البروتوكول", "إنزيمات قلب متسلسلة لتفريق NSTEMI عن الذبحة", "تنظير قسطري حسب تصنيف الخطورة"],
    treatmentEn: ["Aspirin, anticoagulants per protocol", "Serial cardiac enzymes to distinguish NSTEMI from angina", "Cath referral per risk stratification"],
    memoryTrick: "بدون ارتفاع ST — لازم إنزيمات القلب تفرّق الحالة",
    memoryTrickEn: "Without ST elevation — cardiac enzymes are needed to differentiate the condition",
    algorithm: ["ECG متسلسل + إنزيمات قلب متسلسلة", "أسبرين ومضادات تخثر حسب البروتوكول", "صنّف الخطورة (TIMI/GRACE) لتحديد توقيت القسطرة"],
    algorithmEn: ["Serial ECGs + serial cardiac enzymes", "Aspirin and anticoagulants per protocol", "Risk-stratify (TIMI/GRACE) to determine catheterization timing"],
    medications: ["أسبرين 325mg", "مضادات تخثر (هيبارين)", "نيتروجليسرين للألم"],
    medicationsEn: ["Aspirin 325mg", "Anticoagulants (heparin)", "Nitroglycerin for pain"],
    features: ["انخفاض ST أو انقلاب T بدون ارتفاع ST", "إنزيمات القلب مرتفعة (يفرّقه عن الذبحة غير المستقرة)"],
    featuresEn: ["ST depression or T-wave inversion without ST elevation", "Elevated cardiac enzymes (distinguishes it from unstable angina)"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Usually normal", pr: "Normal", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["ألم صدر", "ضيق تنفس", "تعرق"],
    symptomsEn: ["Chest pain", "Shortness of breath", "Sweating"],
    immediateActions: ["أسبرين ومضادات تخثر فورًا", "إنزيمات قلب متسلسلة", "تنظير قسطري حسب تصنيف الخطورة"],
    immediateActionsEn: ["Aspirin and anticoagulants immediately", "Serial cardiac enzymes", "Catheterization based on risk classification"],
  },
  { id: "mi-lateral", nameAr: "احتشاء عضلة القلب الحاد الجانبي", nameEn: "Acute Lateral Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في I، aVL، V5، V6 — منطقة الشريان الظرفي (LCx) أو القطري.", descEn: "ST elevation in I, aVL, V5, V6 — territory of the left circumflex (LCx) or a diagonal branch.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "stemi",
    causes: ["انسداد الشريان الظرفي الأيسر (LCx) أو فرع قطري"],
    causesEn: ["Occlusion of the left circumflex artery (LCx) or a diagonal branch"],
    treatment: ["تفعيل بروتوكول القسطرة القلبية فورًا", "أكسجين، أسبرين، نيتروجليسرين حسب البروتوكول"],
    treatmentEn: ["Activate the cath lab protocol immediately", "Oxygen, aspirin, nitroglycerin per protocol"],
    memoryTrick: "ارتفاع ST في I وaVL وV5-V6 = جانبي",
    memoryTrickEn: "ST elevation in I, aVL, and V5-V6 = lateral",
    algorithm: ["ECG بـ12 اتجاه لتأكيد التوزيع", "فعّل بروتوكول القسطرة فورًا", "MONA حسب البروتوكول"],
    algorithmEn: ["12-lead ECG to confirm the distribution", "Activate the catheterization protocol immediately", "MONA per protocol"],
    medications: ["أسبرين", "نيتروجليسرين", "مسكن", "أكسجين حسب الحاجة"],
    medicationsEn: ["Aspirin", "Nitroglycerin", "Analgesic", "Oxygen as needed"],
    features: ["ارتفاع ST في I وaVL وV5-V6", "قد يصاحبه تغير متبادل سفلي"],
    featuresEn: ["ST elevation in I, aVL, and V5-V6", "May be accompanied by inferior reciprocal changes"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي غالبًا", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Usually normal", rhythm: "Regular" },
    symptoms: ["ألم صدر", "تعرق", "ضيق تنفس"],
    symptomsEn: ["Chest pain", "Sweating", "Shortness of breath"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا", "MONA حسب البروتوكول"],
    immediateActionsEn: ["Activate the catheterization protocol immediately", "MONA per protocol"],
  },
  { id: "mi-anterior", nameAr: "احتشاء عضلة القلب الحاد الأمامي", nameEn: "Acute Anterior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في V1-V4 — منطقة الشريان الأمامي النازل (LAD)، الأكثر خطورة لأنه يغذي جزءًا كبيرًا من البطين الأيسر.", descEn: "ST elevation in V1-V4 — territory of the left anterior descending artery (LAD), the highest-risk location since it supplies a large part of the left ventricle.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "stemi",
    causes: ["انسداد الشريان الأمامي النازل الأيسر (LAD)"],
    causesEn: ["Occlusion of the left anterior descending artery (LAD)"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا (الأولوية القصوى)", "راقب علامات قصور القلب الحاد وصدمة قلبية"],
    treatmentEn: ["Activate the cath lab protocol immediately (top priority)", "Monitor for acute heart failure and cardiogenic shock"],
    memoryTrick: "V1-V4 = أمامي = LAD = الأخطر",
    memoryTrickEn: "V1-V4 = anterior = LAD = the most dangerous",
    algorithm: ["ECG فوري بـ12 اتجاه", "فعّل بروتوكول القسطرة كأولوية قصوى", "راقب علامات قصور القلب الحاد والصدمة القلبية"],
    algorithmEn: ["Immediate 12-lead ECG", "Activate the catheterization protocol as top priority", "Monitor for signs of acute heart failure and cardiogenic shock"],
    medications: ["أسبرين", "نيتروجليسرين بحذر (راقب الضغط)", "مسكن", "أكسجين"],
    medicationsEn: ["Aspirin", "Nitroglycerin with caution (monitor blood pressure)", "Analgesic", "Oxygen"],
    features: ["ارتفاع ST في V1-V4", "أخطر أنواع الاحتشاء لاتساع منطقة العضلة المتأثرة"],
    featuresEn: ["ST elevation in V1-V4", "The most dangerous type of infarction due to the extensive area of affected muscle"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي", qrs: "طبيعي (قد يتسع لاحقًا)", rhythm: "منتظم" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal", qrs: "Normal (may widen later)", rhythm: "Regular" },
    symptoms: ["ألم صدر شديد", "ضيق تنفس", "علامات صدمة قلبية محتملة"],
    symptomsEn: ["Severe chest pain", "Shortness of breath", "Possible signs of cardiogenic shock"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا (أولوية قصوى)", "راقب قصور القلب والصدمة القلبية"],
    immediateActionsEn: ["Activate the catheterization protocol immediately (top priority)", "Monitor for heart failure and cardiogenic shock"],
  },
  { id: "mi-inferior", nameAr: "احتشاء عضلة القلب الحاد السفلي", nameEn: "Acute Inferior Wall MI (STEMI)", category: "critical", desc: "ارتفاع ST في II، III، aVF — منطقة الشريان التاجي الأيمن غالبًا؛ راقب بطء القلب والإحصار.", descEn: "ST elevation in II, III, aVF — usually right coronary artery territory; watch for bradycardia and AV block.", needsCPR: false, shockable: false, rate: "متغير", rateEn: "Variable", wave: "stemi",
    causes: ["انسداد الشريان التاجي الأيمن (RCA) غالبًا"],
    causesEn: ["Occlusion of the right coronary artery (RCA), usually"],
    treatment: ["تفعيل بروتوكول القسطرة فورًا", "تجنب النيترات لو فيه احتشاء بالبطين الأيمن (قد يهبط الضغط بشدة)", "راقب بطء القلب أو إحصار AV"],
    treatmentEn: ["Activate the cath lab protocol immediately", "Avoid nitrates if right ventricular infarction is suspected (can cause severe hypotension)", "Monitor for bradycardia or AV block"],
    memoryTrick: "II وIII وaVF = سفلي = راقب بطء القلب",
    memoryTrickEn: "II, III, and aVF = inferior = watch for bradycardia",
    algorithm: ["ECG فوري", "تجنب النيترات لو فيه اشتباه احتشاء بطين أيمن", "راقب بطء القلب والإحصار AV", "فعّل بروتوكول القسطرة"],
    algorithmEn: ["Immediate ECG", "Avoid nitrates if right ventricular infarction is suspected", "Monitor for bradycardia and AV block", "Activate the catheterization protocol"],
    medications: ["أسبرين", "تجنب النيترات إذا هبط الضغط أو اشتبه احتشاء بطين أيمن", "أتروبين لو بطء قلب مصاحب"],
    medicationsEn: ["Aspirin", "Avoid nitrates if blood pressure drops or right ventricular infarction is suspected", "Atropine if accompanied by bradycardia"],
    features: ["ارتفاع ST في II وIII وaVF", "قد يصاحبه بطء قلب أو إحصار AV"],
    featuresEn: ["ST elevation in II, III, and aVF", "May be accompanied by bradycardia or AV block"],
    ecgCriteria: { p: "طبيعية", pr: "قد يطول لو فيه إحصار مصاحب", qrs: "طبيعي غالبًا", rhythm: "قد يكون بطيء لو فيه إحصار" },
    ecgCriteriaEn: { p: "Normal", pr: "May lengthen if an accompanying block is present", qrs: "Usually normal", rhythm: "May be slow if a block is present" },
    symptoms: ["ألم صدر", "غثيان وقيء أكثر من الاحتشاءات الأخرى", "دوخة لو فيه بطء قلب"],
    symptomsEn: ["Chest pain", "More nausea and vomiting than other infarctions", "Dizziness if bradycardia is present"],
    immediateActions: ["فعّل بروتوكول القسطرة فورًا", "تجنب النيترات لو احتشاء بطين أيمن محتمل", "راقب بطء القلب والإحصار"],
    immediateActionsEn: ["Activate the catheterization protocol immediately", "Avoid nitrates if right ventricular infarction is possible", "Monitor for bradycardia and block"],
  },
  { id: "pe-ecg", nameAr: "نمط ECG في الانسداد الرئوي", nameEn: "Pulmonary Embolism ECG Pattern (S1Q3T3)", category: "critical", desc: "نمط S1Q3T3 (موجة S في I، موجة Q في III، T مقلوبة في III) + تسرع جيبي — غير نوعي لكن مشير.", descEn: "S1Q3T3 pattern (S wave in I, Q wave in III, inverted T in III) plus sinus tachycardia — non-specific but suggestive.", needsCPR: false, shockable: false, rate: "متغير (غالبًا تسرع جيبي)", rateEn: "Variable (usually sinus tachycardia)", wave: "pe-pattern",
    causes: ["انصمام رئوي حاد يسبب إجهادًا مفاجئًا على البطين الأيمن"],
    causesEn: ["Acute pulmonary embolism causing sudden right ventricular strain"],
    treatment: ["أكسجين ودعم تنفسي", "مضادات تخثر عاجلة أو حل الجلطة حسب الشدة", "تصوير مقطعي للشريان الرئوي للتأكيد"],
    treatmentEn: ["Oxygen and respiratory support", "Urgent anticoagulation or thrombolysis per severity", "CT pulmonary angiography to confirm"],
    memoryTrick: "S1Q3T3 — غير نوعي لكنه مشير للانصمام الرئوي",
    memoryTrickEn: "S1Q3T3 — non-specific but suggestive of pulmonary embolism",
    algorithm: ["قيّم الاستقرار التنفسي والدموي", "أكسجين ودعم تنفسي", "تصوير مقطعي للشريان الرئوي للتأكيد", "مضادات تخثر أو حل الجلطة حسب الشدة"],
    algorithmEn: ["Assess respiratory and hemodynamic stability", "Oxygen and respiratory support", "CT pulmonary angiography for confirmation", "Anticoagulation or thrombolysis depending on severity"],
    medications: ["مضادات تخثر (هيبارين)", "حالّ للجلطة في الحالات الشديدة (عدم استقرار دموي)"],
    medicationsEn: ["Anticoagulants (heparin)", "Thrombolytic in severe cases (hemodynamic instability)"],
    features: ["نمط S1Q3T3 (غير نوعي لكن مشير)", "تسرع جيبي هو الأكثر شيوعًا فعليًا", "قد يظهر إحصار حزمة يمنى جديد"],
    featuresEn: ["S1Q3T3 pattern (non-specific but suggestive)", "Sinus tachycardia is actually the most common finding", "A new right bundle branch block may appear"],
    ecgCriteria: { p: "طبيعية غالبًا", pr: "طبيعي", qrs: "طبيعي أو إحصار حزمة يمنى جديد", rhythm: "غالبًا تسرع جيبي" },
    ecgCriteriaEn: { p: "Usually normal", pr: "Normal", qrs: "Normal or a new right bundle branch block", rhythm: "Usually sinus tachycardia" },
    symptoms: ["ضيق تنفس مفاجئ", "ألم صدر جنبي", "تسرع قلب", "قد يصاحبه هبوط ضغط مفاجئ"],
    symptomsEn: ["Sudden shortness of breath", "Pleuritic chest pain", "Tachycardia", "May be accompanied by a sudden drop in blood pressure"],
    immediateActions: ["أكسجين ودعم تنفسي فورًا", "تصوير مقطعي للتأكيد", "مضادات تخثر أو حل الجلطة حسب الشدة"],
    immediateActionsEn: ["Immediate oxygen and respiratory support", "CT imaging for confirmation", "Anticoagulation or thrombolysis depending on severity"],
  },
  { id: "p-mitral-ecg", nameAr: "تضخم الأذين الأيسر (P Mitral)", nameEn: "Left Atrial Enlargement (P Mitral)", category: "watch", desc: "موجة P عريضة ومشقوقة (M shaped) أكثر من 2.5 مربع صغير عرضًا في Lead II — باقي الرسمة طبيعية.", descEn: "Broad, notched/M-shaped P wave wider than 2.5 small squares in Lead II — rest of the tracing is normal.", needsCPR: false, shockable: false, rate: "طبيعي غالبًا", rateEn: "Usually normal", wave: "p-mitral",
    causes: ["ضيق الصمام المترالي", "أي سبب لتضخم الأذين الأيسر (زيادة الحمل أو الضغط)"],
    causesEn: ["Mitral stenosis", "Any cause of left atrial pressure/volume overload"],
    treatment: ["علاج السبب الأساسي (مثل تدخل على الصمام المترالي)", "متابعة دورية بالإيكو"],
    treatmentEn: ["Treat the underlying cause, e.g. mitral valve intervention", "Regular echocardiographic follow-up"],
    memoryTrick: "P عريضة ومشقوقة = Mitral = أذين شمال كبير",
    memoryTrickEn: "Wide, notched P = Mitral = enlarged left atrium",
    algorithm: ["أكدي القياس في Lead II أو V1 (العرض > 2.5 مربع صغير)", "ابحثي عن السبب بالإيكو القلبي"],
    algorithmEn: ["Confirm the measurement in lead II or V1 (width > 2.5 small squares)", "Look for the cause with echocardiography"],
    features: ["موجة P عريضة > 2.5 مربع صغير (0.12 ثانية)", "شكل مشقوق (M shaped) واضح في Lead II", "باقي المجمعات (QRS/T) طبيعية"],
    featuresEn: ["P wave wider than 2.5 small squares (0.12 seconds)", "A clear notched (M-shaped) form in lead II", "The rest of the complexes (QRS/T) are normal"],
    ecgCriteria: { p: "عريضة ومشقوقة", pr: "طبيعي", qrs: "طبيعي", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "P Mitral", pr: "Normal", qrs: "Normal", rhythm: "Usually regular" },
    symptoms: ["قد تكون بلا أعراض ويُكتشف بالمصادفة", "أعراض السبب الأساسي (مثل ضيق تنفس مع ضيق الميترالي)"],
    symptomsEn: ["May be asymptomatic and found incidentally", "Symptoms of the underlying cause (such as shortness of breath with mitral stenosis)"],
    immediateActions: ["ليست حالة طارئة بذاتها — قيّمي السبب الأساسي"],
    immediateActionsEn: ["Not an emergency in itself — assess the underlying cause"],
  },
  { id: "p-pulmonale-ecg", nameAr: "تضخم الأذين الأيمن (P Pulmonale)", nameEn: "Right Atrial Enlargement (P Pulmonale)", category: "watch", desc: "موجة P مدببة وعالية (Peaked) أكثر من 2.5 مم ارتفاعًا في Lead II — بدون شق.", descEn: "Tall, peaked P wave taller than 2.5mm in Lead II — no notch.", needsCPR: false, shockable: false, rate: "طبيعي غالبًا", rateEn: "Usually normal", wave: "p-pulmonale",
    causes: ["فرط ضغط الدم الرئوي", "أمراض الرئة المزمنة (COPD وغيرها)"],
    causesEn: ["Pulmonary hypertension", "Chronic lung disease"],
    treatment: ["علاج سبب فرط ضغط الرئة الأساسي", "متابعة وظائف الرئة والقلب الأيمن"],
    treatmentEn: ["Treat the underlying cause of pulmonary hypertension", "Monitor pulmonary and right-heart function"],
    memoryTrick: "P مدببة وعالية = Pulmonale = أذين يمين كبير بسبب الرئة",
    memoryTrickEn: "Peaked, tall P = Pulmonale = enlarged right atrium due to lung disease",
    algorithm: ["أكدي القياس في Lead II (الارتفاع > 2.5 مم)", "ابحثي عن سبب رئوي أو فرط ضغط رئوي"],
    algorithmEn: ["Confirm the measurement in lead II (height > 2.5 mm)", "Look for a pulmonary cause or pulmonary hypertension"],
    features: ["موجة P مدببة وعالية > 2.5 مم", "بدون شق (يفرّقها عن P Mitral)", "قد يصاحبها انحراف محور لليمين"],
    featuresEn: ["Peaked, tall P wave > 2.5 mm", "Without notching (distinguishes it from P Mitrale)", "May be accompanied by right axis deviation"],
    ecgCriteria: { p: "مدببة وعالية", pr: "طبيعي", qrs: "طبيعي أو انحراف يمين", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "P Pulmonale", pr: "Normal", qrs: "Normal or right deviation", rhythm: "Usually regular" },
    symptoms: ["أعراض السبب الرئوي الأساسي (ضيق تنفس مزمن مثلًا)"],
    symptomsEn: ["Symptoms of the underlying pulmonary cause (e.g., chronic shortness of breath)"],
    immediateActions: ["ليست حالة طارئة بذاتها — قيّمي السبب الرئوي الأساسي"],
    immediateActionsEn: ["Not an emergency in itself — assess the underlying pulmonary cause"],
  },
  { id: "lvh-ecg", nameAr: "تضخم البطين الأيسر مع نمط إجهاد", nameEn: "Left Ventricular Hypertrophy (LVH) with Strain", category: "watch", desc: "فولت مرتفع جدًا في QRS (S في V1/V2 أو R في V5/V6 أكبر من 5 مربعات كبيرة)، مع انخفاض ST وانقلاب T غير متماثل في V5-V6.", descEn: "Very high QRS voltage plus ST depression and asymmetric T inversion in V5-V6 — the 'strain pattern'.", needsCPR: false, shockable: false, rate: "طبيعي غالبًا", rateEn: "Usually normal", wave: "lvh",
    causes: ["ارتفاع ضغط الدم المزمن غير المنضبط", "ضيق الصمام الأورطي"],
    causesEn: ["Chronic uncontrolled hypertension", "Aortic stenosis"],
    treatment: ["ضبط ضغط الدم بدقة", "إيكو قلب لتقييم درجة التضخم ووظيفة البطين"],
    treatmentEn: ["Tight blood pressure control", "Echocardiogram to assess hypertrophy degree and function"],
    memoryTrick: "فولت عالي + ST نازلة وT مقلوبة في V5-V6 = LVH بنمط إجهاد",
    memoryTrickEn: "High voltage + downsloping ST and inverted T in V5-V6 = LVH with a strain pattern",
    algorithm: ["طبّقي معايير الفولت (S في V1/V2 أو R في V5/V6 > 5 مربعات كبيرة، أو المجموع ≥ 7)", "ابحثي عن نمط الإجهاد في V5-V6", "إيكو لتأكيد وتقييم الشدة"],
    algorithmEn: ["Apply the voltage criteria (S in V1/V2 or R in V5/V6 > 5 large squares, or the sum ≥ 7)", "Look for a strain pattern in V5-V6", "Echocardiography to confirm and assess severity"],
    features: ["فولت QRS مرتفع جدًا", "انخفاض ST في V5-V6", "انقلاب T غير متماثل في V5-V6"],
    featuresEn: ["Very high QRS voltage", "Strain pattern", "Asymmetric T-wave inversion in V5-V6"],
    ecgCriteria: { p: "طبيعية أو P Mitral مصاحبة", pr: "طبيعي", qrs: "فولت مرتفع جدًا", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "Normal or accompanying P Mitrale", pr: "Normal", qrs: "Very high voltage", rhythm: "Usually regular" },
    symptoms: ["قد تكون بلا أعراض", "أعراض قصور القلب في الحالات المتقدمة"],
    symptomsEn: ["May be asymptomatic", "Heart failure symptoms in advanced cases"],
    immediateActions: ["ليست حالة طارئة بذاتها — ضبط ضغط الدم ومتابعة قلبية"],
    immediateActionsEn: ["Not an emergency in itself — control blood pressure and follow up with cardiology"],
  },
  { id: "rvh-ecg", nameAr: "تضخم البطين الأيمن (نمط معكوس)", nameEn: "Right Ventricular Hypertrophy (RVH) — Reversal of Normal", category: "watch", desc: "في V1/V2 تصبح R أكبر من S (عكس الطبيعي)، وفي V5/V6 تصبح S أكبر من R — مع نمط إجهاد خفيف محتمل.", descEn: "In V1/V2, R becomes larger than S (reversal of normal); in V5/V6, S becomes larger than R — with a possible mild strain pattern.", needsCPR: false, shockable: false, rate: "طبيعي غالبًا", rateEn: "Usually normal", wave: "rvh",
    causes: ["فرط ضغط الدم الرئوي المزمن", "ضيق الصمام الرئوي", "أمراض القلب الخلقية"],
    causesEn: ["Chronic pulmonary hypertension", "Pulmonary stenosis", "Congenital heart disease"],
    treatment: ["علاج سبب فرط الضغط الرئوي", "إيكو قلب لتقييم البطين الأيمن"],
    treatmentEn: ["Treat the underlying cause of pulmonary hypertension", "Echocardiogram to assess the right ventricle"],
    memoryTrick: "R أكبر من S في V1 (عكس الطبيعي) = RVH",
    memoryTrickEn: "R greater than S in V1 (reversal of normal) = RVH",
    algorithm: ["قارني R وS في V1/V2 وفي V5/V6 (نمط معكوس = reversal of normal)", "ابحثي عن P Pulmonale مصاحبة أو انحراف محور لليمين"],
    algorithmEn: ["Compare R and S in V1/V2 and in V5/V6 (a reversed pattern = reversal of normal)", "Look for accompanying P Pulmonale or right axis deviation"],
    features: ["R أكبر من S في V1/V2 (معكوس)", "S أكبر من R في V5/V6", "غالبًا مصحوب بانحراف محور لليمين وP Pulmonale"],
    featuresEn: ["R greater than S in V1/V2 (reversed)", "S greater than R in V5/V6", "Often accompanied by right axis deviation and P Pulmonale"],
    ecgCriteria: { p: "قد تكون P Pulmonale مصاحبة", pr: "طبيعي", qrs: "نمط معكوس", rhythm: "منتظم غالبًا" },
    ecgCriteriaEn: { p: "May have accompanying P Pulmonale", pr: "Normal", qrs: "Reversal of normal", rhythm: "Usually regular" },
    symptoms: ["أعراض السبب الرئوي الأساسي"],
    symptomsEn: ["Symptoms of the underlying pulmonary cause"],
    immediateActions: ["ليست حالة طارئة بذاتها — قيّمي السبب الرئوي/القلبي الأساسي"],
    immediateActionsEn: ["Not an emergency in itself — assess the underlying pulmonary/cardiac cause"],
  },
  { id: "digitalis-ecg", nameAr: "تأثير الديجيتاليس على الرسم", nameEn: "Digitalis Effect", category: "watch", desc: "انخفاض ST متهدل ومقعّر (Sagging/scooped — يُشبه شكل الملعقة)، مع اختصار فترة QT — يختلف عن انخفاض ST الإقفاري (المستقيم أو المنحدر).", descEn: "Sagging/scooped ST depression with a shortened QT — different from the flat/downsloping depression of ischemia.", needsCPR: false, shockable: false, rate: "طبيعي غالبًا", rateEn: "Usually normal", wave: "digitalis",
    causes: ["تناول الديجوكسين (حتى بجرعة علاجية عادية)"],
    causesEn: ["Taking digoxin, even at a normal therapeutic dose"],
    treatment: ["هذا التأثير وحده لا يستدعي إيقاف الدواء إذا كان المستوى علاجيًا", "افحصي مستوى الديجوكسين والبوتاسيوم لاستبعاد السمية"],
    treatmentEn: ["This effect alone doesn't require stopping the drug if the level is therapeutic", "Check digoxin level and potassium to rule out toxicity"],
    memoryTrick: "ST متهدلة كملعقة + QT قصيرة = تأثير ديجيتاليس (مش بالضرورة سمية)",
    memoryTrickEn: "Scooped (spoon-shaped) ST depression + short QT = digitalis effect (not necessarily toxicity)",
    algorithm: ["فرّقي بين 'تأثير الديجيتاليس' الطبيعي على الرسم و'سمية الديجيتاليس' الفعلية (أعراض + مستوى الدواء + بوتاسيوم)", "افحصي مستوى الدواء والكهارل عند الشك"],
    algorithmEn: ["Distinguish between the normal 'digitalis effect' on the ECG and actual 'digitalis toxicity' (symptoms + drug level + potassium)", "Check the drug level and electrolytes if in doubt"],
    features: ["انخفاض ST متهدل/مقعّر", "اختصار فترة QT", "قد تظهر موجة T مسطحة أو ثنائية الطور"],
    featuresEn: ["Sagging/scooped", "QT interval shortening", "A flat or biphasic T wave may appear"],
    ecgCriteria: { p: "طبيعية", pr: "طبيعي أو مطوّل قليلًا", qrs: "طبيعي", rhythm: "منتظم غالبًا (راقبي اضطرابات النظم في حالة السمية)" },
    ecgCriteriaEn: { p: "Normal", pr: "Normal or slightly prolonged", qrs: "Normal", rhythm: "Usually regular (watch for arrhythmias in cases of toxicity)" },
    symptoms: ["بلا أعراض عادة (مجرد تأثير على الرسم)", "أعراض السمية إن وُجدت: غثيان، اضطراب رؤية، اضطراب نظم"],
    symptomsEn: ["Usually asymptomatic (just an ECG effect)", "Symptoms of toxicity if present: nausea, visual disturbance, arrhythmia"],
    immediateActions: ["لا حاجة لإجراء فوري لمجرد وجود هذا النمط", "استبعدي السمية بفحص المستوى الدوائي والكهارل عند الشك"],
    immediateActionsEn: ["No immediate action is needed just because this pattern is present", "Rule out toxicity by checking the drug level and electrolytes if in doubt"],
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
    // شكل QRS عريض وغريب (Bizarre/wide) حقيقي: مفيش خط أساس مسطح تقريبًا
    // بين الضربات (السرعة عالية والقالب واسع)، والانحناءة نفسها واسعة
    // وغير متماثلة بدل ما تبقى قمة رفيعة حادة — ده اللي بيميز VT عن أي
    // تسرع بقالب ضيق (narrow-QRS).
    push(start, base);
    push(start + width * 0.12, base - 18 * amp);
    push(start + width * 0.26, base - 44 * amp); // القمة العريضة
    push(start + width * 0.40, base + 10 * amp);
    push(start + width * 0.54, base + 34 * amp); // انحناءة سفلية واسعة
    push(start + width * 0.70, base - 10 * amp); // ترجع لفوق (T مندمجة مع QRS)
    push(start + width * 0.86, base);
    push(start + width, base);
  };

  switch (kind) {
    case "flat": {
      for (let x = 0; x <= W; x += 20) push(x, base + (pr(x) - 0.5) * 2);
      break;
    }
    case "chaotic-coarse": {
      // رجفان بطيني خشن حقيقي: بلا أي شكل منتظم — تغيّر عشوائي في التردد
      // والسعة معًا (مش بس السعة زي الكود القديم)، عشان ميبانش موجة جيبية
      // متكررة. النقط قريبة من بعض كفاية إن منحنى Catmull-Rom يفضل زاويّ.
      let x = 0;
      let i = 0;
      while (x <= W) {
        const amp = 26 + pr(i * 3.7) * 34; // سعة متغيرة 26-60 (خشنة)
        const dir = pr(i * 5.1) > 0.5 ? 1 : -1;
        push(x, base + dir * amp * (0.4 + pr(i * 7.3) * 0.6));
        x += 5 + pr(i * 2.3) * 9; // تردد متغير 5-14px
        i++;
      }
      break;
    }
    case "chaotic-fine": {
      // رجفان بطيني ناعم: نفس الفوضوية بس بسعة أصغر بكتير (قريبة من الخط
      // المسطح) — ده اللي بيخلّي ممكن يتلخبط بالـAsystole غلط لو ما اتنظرش
      // كويس، وده بالظبط الفرق السريري المهم.
      let x = 0;
      let i = 0;
      while (x <= W) {
        const amp = 4 + pr(i * 4.1) * 10; // سعة صغيرة 4-14
        const dir = pr(i * 6.7) > 0.5 ? 1 : -1;
        push(x, base + dir * amp * (0.5 + pr(i * 8.9) * 0.5));
        x += 4 + pr(i * 3.1) * 7;
        i++;
      }
      break;
    }
    case "wide-regular": {
      // Monomorphic VT: صورة مرجعية طلبها المستخدم — أقواس متصلة ومتطابقة
      // تمامًا بدون أي خط أساس مسطح بينها: قمة مقوّسة ناعمة (نقط متباعدة)
      // وقاع حاد على شكل V (نقط متلاصقة قريبة من بعض)، بنفس الارتفاع
      // والعرض في كل دورة — ده الشكل الكلاسيكي لـMonomorphic VT
      // (uniform QRS complexes) بخلاف الشكل العريض غير المنتظم القديم.
      const width = 62;
      const peakAmp = 46; // ارتفاع القمة لفوق
      const troughAmp = 40; // عمق القاع تحت
      let x = 0;
      while (x < W) {
        // قاع حاد (V) — نقط متلاصقة عشان تفضل زاويّة حادة بعد التنعيم
        push(x, base + troughAmp);
        push(x + width * 0.05, base + troughAmp * 0.45);
        // صعود وقمة مقوّسة ناعمة — نقط متباعدة عشان تدي انحناءة واسعة
        push(x + width * 0.18, base - peakAmp * 0.55);
        push(x + width * 0.32, base - peakAmp);
        push(x + width * 0.50, base - peakAmp * 0.98);
        push(x + width * 0.68, base - peakAmp * 0.5);
        // نزول لقاع حاد تاني
        push(x + width * 0.90, base + troughAmp * 0.45);
        push(x + width * 0.97, base + troughAmp);
        x += width;
      }
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
    case "p-mitral": {
      // تضخم الأذين الأيسر: موجة P عريضة ومشقوقة (M shaped) — القمة التانية
      // بعد غمازة صغيرة في النص، والـQRS/T طبيعيين تمامًا (Simple ECG: P Mitral).
      const width = 140;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.05, base - 5);
        push(x + width * 0.09, base - 7);
        push(x + width * 0.115, base - 4);
        push(x + width * 0.14, base - 7);
        push(x + width * 0.18, base);
        push(x + width * 0.22, base);
        push(x + width * 0.24, base + 3);
        push(x + width * 0.26, base - 32);
        push(x + width * 0.28, base + 14);
        push(x + width * 0.30, base);
        push(x + width * 0.48, base - 9);
        push(x + width * 0.58, base);
        push(x + width, base);
      }
      break;
    }
    case "p-pulmonale": {
      // تضخم الأذين الأيمن: موجة P طويلة ومدببة (Peaked) — أعلى بكتير من
      // الطبيعي، بدون شق، والـQRS/T طبيعيين (Simple ECG: P Pulmonale).
      const width = 140;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 15);
        push(x + width * 0.12, base);
        push(x + width * 0.22, base);
        push(x + width * 0.24, base + 3);
        push(x + width * 0.26, base - 32);
        push(x + width * 0.28, base + 14);
        push(x + width * 0.30, base);
        push(x + width * 0.48, base - 9);
        push(x + width * 0.58, base);
        push(x + width, base);
      }
      break;
    }
    case "lvh": {
      // تضخم البطين الأيسر مع نمط إجهاد (Strain pattern): مجموعة QRS طويلة
      // جدًا (فولت عالي)، متبوعة بانخفاض ST وانقلاب موجة T غير متماثل
      // (منحدر بطيء ثم رجوع سريع) — من Simple ECG (LVH strain).
      const width = 150;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base - 9);
        push(x + width * 0.15, base);
        push(x + width * 0.22, base);
        push(x + width * 0.24, base + 4);
        push(x + width * 0.27, base - 55); // R شاهقة (high voltage)
        push(x + width * 0.30, base + 10);
        push(x + width * 0.34, base + 6); // انخفاض ST مباشرة بعد QRS
        push(x + width * 0.44, base + 16); // موجة T مقلوبة غير متماثلة
        push(x + width * 0.56, base + 4);
        push(x + width * 0.65, base);
        push(x + width, base);
      }
      break;
    }
    case "rvh": {
      // تضخم البطين الأيمن: نمط معكوس (Reversal of normal) — R تبقى أطول
      // من الطبيعي مع S صغيرة، ونفس منطق نمط الإجهاد لكن بدرجة أخف من LVH.
      const width = 130;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base - 9);
        push(x + width * 0.15, base);
        push(x + width * 0.22, base);
        push(x + width * 0.24, base + 2);
        push(x + width * 0.27, base - 40);
        push(x + width * 0.30, base + 5);
        push(x + width * 0.34, base + 4);
        push(x + width * 0.44, base + 11);
        push(x + width * 0.56, base + 2);
        push(x + width * 0.65, base);
        push(x + width, base);
      }
      break;
    }
    case "digitalis": {
      // تأثير الديجيتاليس: انخفاض ST متهدل (Sagging/scooped — شكل ملعقة أو
      // "شارب سلفادور دالي")، مع اختصار QT الكلية — الفرق الرئيسي عن نقص
      // التروية (اللي بيديها انخفاض أفقي/منحدر لأسفل مش متهدل).
      const width = 120;
      for (let x = 0; x < W; x += width) {
        push(x, base);
        push(x + width * 0.06, base - 6);
        push(x + width * 0.11, base - 9);
        push(x + width * 0.15, base);
        push(x + width * 0.22, base);
        push(x + width * 0.24, base + 3);
        push(x + width * 0.26, base - 30);
        push(x + width * 0.28, base + 12);
        push(x + width * 0.32, base + 10); // بداية الانخفاض المتهدل
        push(x + width * 0.40, base + 16); // أعمق نقطة في التهدل (sagging)
        push(x + width * 0.48, base + 8); // رجوع سريع
        push(x + width * 0.52, base - 4); // T مسطحة/ثنائية الطور قصيرة
        push(x + width * 0.60, base);
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

function ECGWaveOrImage({ patternId, kind, colorClass, annotations }: { patternId: string; kind: WaveKind; colorClass: string; annotations?: WaveAnnotation[] }) {
  const { images } = useEcgPatternImages();
  const override = images[patternId];
  if (override === "") {
    // الأدمن مسح الرسم ولسه ما رفعش صورة بدالها
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600">
        لا توجد صورة لهذا النمط حاليًا
      </div>
    );
  }
  if (override) {
    return <img src={override} alt={patternId} className="mx-auto max-h-64 w-full rounded-xl object-contain" />;
  }
  return <ECGWave kind={kind} colorClass={colorClass} annotations={annotations} />;
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
const DETAIL_TABS: { id: DetailTab; label: string; labelEn: string; icon: string }[] = [
  { id: "algo", label: "خوارزمية", labelEn: "Algorithm", icon: "🧭" },
  { id: "causes", label: "أسباب", labelEn: "Causes", icon: "📋" },
  { id: "meds", label: "أدوية", labelEn: "Medications", icon: "💊" },
  { id: "features", label: "ميزات", labelEn: "Features", icon: "🔬" },
  { id: "actions", label: "إجراءات", labelEn: "Actions", icon: "⚡" },
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

/** Pick the English list if present and same length as the Arabic one, else fall back to Arabic. */
function pickList(ar: string[] | undefined, en: string[] | undefined, isEn: boolean): string[] | undefined {
  if (!ar) return ar;
  if (isEn && en && en.length === ar.length) return en;
  return ar;
}
function pickCriteria(
  ar: { p: string; pr: string; qrs: string; rhythm: string } | undefined,
  en: { p: string; pr: string; qrs: string; rhythm: string } | undefined,
  isEn: boolean
) {
  if (!ar) return ar;
  return isEn && en ? en : ar;
}

function ECGDetailTabs({ p }: { p: ECGPattern }) {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [tab, setTab] = useState<DetailTab>(p.algorithm?.length ? "algo" : "causes");
  const rate = isEn && p.rateEn ? p.rateEn : p.rate;
  const algorithm = pickList(p.algorithm, p.algorithmEn, isEn);
  const causes = pickList(p.causes, p.causesEn, isEn);
  const medications = pickList(p.medications, p.medicationsEn, isEn);
  const features = pickList(p.features, p.featuresEn, isEn);
  const symptoms = pickList(p.symptoms, p.symptomsEn, isEn);
  const hAndT = isEn && p.hAndTEn ? p.hAndTEn : p.hAndT;
  const criteria = pickCriteria(p.ecgCriteria, p.ecgCriteriaEn, isEn);
  const actionsAr = p.immediateActions?.length ? p.immediateActions : p.treatment?.length ? p.treatment : null;
  const actionsEn = p.immediateActionsEn?.length ? p.immediateActionsEn : p.treatmentEn?.length ? p.treatmentEn : null;
  const actions = isEn && actionsEn && actionsAr && actionsEn.length === actionsAr.length ? actionsEn : actionsAr;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {criteria && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">QRS</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{criteria.qrs}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">PR</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{criteria.pr}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">{isEn ? "Regularity" : "الانتظام"}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{criteria.rhythm}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
            <div className="text-[10px] font-bold text-slate-400">{isEn ? "Rate" : "المعدل"}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200" dir="ltr">{rate} bpm</div>
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
            {dt.icon} {isEn ? dt.labelEn : dt.label}
          </button>
        ))}
      </div>

      {tab === "algo" &&
        (algorithm?.length ? (
          <ol className="list-inside list-decimal space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {algorithm.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        ) : (
          <EmptyTab icon="🧭" title={isEn ? "No algorithm available for this rhythm" : "لا تتوفر خوارزمية لهذا الإيقاع"} subtitle={isEn ? "Algorithms are available for rhythms requiring immediate intervention" : "الخوارزميات متاحة للإيقاعات التي تتطلب تدخلًا فوريًا"} />
        ))}

      {tab === "causes" &&
        (causes?.length ? (
          <div className="space-y-3">
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {causes.map((c) => <li key={c}>{c}</li>)}
            </ul>
            {hAndT && (
              <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-500/10">
                <div className="mb-2 text-xs font-bold text-sky-700 dark:text-sky-300">5Hs & 5Ts</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {hAndT.h.map((h, i) => (
                    <div key={"h" + i} className="flex items-center gap-1.5">
                      <span className="rounded-full bg-sky-600 px-1.5 text-[10px] font-bold text-white">H{i + 1}</span>
                      {h}
                    </div>
                  ))}
                  {hAndT.t.map((t, i) => (
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
          <EmptyTab icon="📋" title={isEn ? "No specific causes listed" : "لا توجد أسباب محددة"} />
        ))}

      {tab === "meds" &&
        (medications?.length ? (
          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {medications.map((m) => <li key={m}>{m}</li>)}
          </ul>
        ) : (
          <EmptyTab icon="💊" title={isEn ? "No specific medications listed" : "لا توجد أدوية محددة"} />
        ))}

      {tab === "features" &&
        (features?.length || criteria || symptoms?.length ? (
          <div className="space-y-3">
            {!!features?.length && (
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            {criteria && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                <div className="mb-2 font-bold text-slate-500 dark:text-slate-400">{isEn ? "ECG Criteria" : "معايير ECG"}</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-400">{isEn ? "P wave" : "موجة P"}</span><span className="font-semibold text-slate-700 dark:text-slate-200">{criteria.p}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">PR</span><span className="font-semibold text-slate-700 dark:text-slate-200">{criteria.pr}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">QRS</span><span className="font-semibold text-slate-700 dark:text-slate-200">{criteria.qrs}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">{isEn ? "Regularity" : "الانتظام"}</span><span className="font-semibold text-slate-700 dark:text-slate-200">{criteria.rhythm}</span></div>
                </div>
              </div>
            )}
            {!!symptoms?.length && (
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                <div className="mb-1 text-xs font-bold text-amber-700 dark:text-amber-300">⚠️ {isEn ? "Symptoms" : "الأعراض"}</div>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-800 dark:text-amber-200">
                  {symptoms.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <EmptyTab icon="🔬" title={isEn ? "No additional features recorded" : "لا توجد ميزات إضافية مسجّلة"} />
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
            <div className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>{isEn ? "No intervention required" : "لا تدخل مطلوب"}</div>
            <div className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>{isEn ? "Continue routine monitoring" : "استمر في المراقبة الروتينية"}</div>
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
  const { lang, t } = useI18n();
  const isEn = lang === "en";
  const desc = bilingual(p.desc, p.descEn, lang).text;
  const rate = isEn && p.rateEn ? p.rateEn : p.rate;
  const memoryTrick = p.memoryTrick ? bilingual(p.memoryTrick, p.memoryTrickEn, lang).text : undefined;

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
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_META[p.category].badge}`}>{isEn ? CATEGORY_META[p.category].labelEn : CATEGORY_META[p.category].label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400" dir="ltr">{rate} bpm</span>
          <button
            type="button"
            onClick={() => toggleFav(p.id)}
            aria-label={saved ? (isEn ? "Remove from saved" : "إلغاء الحفظ") : (isEn ? "Save pattern" : "حفظ النمط")}
            className={`text-base leading-none ${saved ? "text-amber-500" : "text-slate-300 hover:text-slate-400 dark:text-slate-600"}`}
          >
            {saved ? "🔖" : "📑"}
          </button>
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">{p.nameEn}</h3>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{p.nameAr}</p>

      <div className="my-3 rounded-lg ecg-monitor-bg p-2">
        <ECGWaveOrImage patternId={p.id} kind={p.wave} colorClass={waveColor[p.category]} annotations={PATTERN_ANNOTATIONS[p.id]} />
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{desc}</p>

      {memoryTrick && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          💡 {memoryTrick}
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
          {noPulse ? (playing ? t("ecg.monitorSoundPlaying") : t("ecg.monitorSound")) : playing ? t("ecg.stopSound") : t("ecg.listenPulse")}
        </button>
        {hasDetails && (
          <button type="button" onClick={() => setOpen((s) => !s)} className="mr-auto text-xs font-bold text-sky-600 dark:text-sky-400">
            {open ? t("ecg.hideDetails") : t("ecg.moreDetails")}
          </button>
        )}
      </div>

      {noPulse && playing && (
        <div className="mt-2 text-xs font-semibold text-rose-500">{t("ecg.alarmOnlyNote")}</div>
      )}

      {open && <ECGDetailTabs p={p} />}
    </div>
  );
}

// Pairs of patterns students commonly mix up, shown side by side with the one-line
// distinction that actually separates them — the same idea as fixing the 3 MI
// patterns (which were told apart by a label, not a shape difference), applied
// proactively to the classic confusable pairs.
const COMPARISON_PAIRS: { aId: string; bId: string; note: string; noteEn: string }[] = [
  { aId: "wenckebach", bId: "block2-2", note: "فينكباخ: PR بيطول تدريجيًا قبل السقوط. موبيتز 2: PR ثابت طول الوقت والسقوط يجي فجأة.", noteEn: "Wenckebach: the PR gradually lengthens before a dropped beat. Mobitz II: the PR stays fixed the whole time and the drop happens suddenly." },
  { aId: "svt", bId: "sinus-tach", note: "تسرع الجيوب بيبان تدريجيًا وموجة P موجودة. SVT بييجي/بيروح فجأة (on/off) وموجة P غالبًا مختفية.", noteEn: "Sinus tachycardia appears gradually and a P wave is present. SVT comes on/off suddenly and the P wave is usually absent." },
  { aId: "vt-mono", bId: "torsades", note: "VT أحادي الشكل: كل الضربات شكلها واحد. Torsades: محور QRS بيدور ويتغير حواليه — ومرتبط بإطالة QT.", noteEn: "Monomorphic VT: every beat has the same shape. Torsades: the QRS axis twists and changes around the baseline — and it's linked to QT prolongation." },
  { aId: "afib-rvr", bId: "aflutter", note: "AFib: بدون أي نمط منتظم للموجات الأذينية أو مسافات QRS. Flutter: موجات F منتظمة بشكل سن منشار بنسبة توصيل ثابتة غالبًا.", noteEn: "AFib: no regular pattern to the atrial waves or QRS spacing. Flutter: regular sawtooth F waves, usually with a fixed conduction ratio." },
  { aId: "rbbb", bId: "lbbb", note: "RBBB: شكل rsR' (أذنين أرنب/M) في V1. LBBB: S عميقة وموجة r ضعيفة أو غائبة، مع قبة واسعة واحدة — وممكن تخفي علامات احتشاء.", noteEn: "RBBB: an rsR' (rabbit-ears/M) shape in V1. LBBB: a deep S and a weak or absent r wave, with a single wide dome — and it can mask signs of infarction." },
];

function ComparisonPairCard({ aId, bId, note, noteEn }: { aId: string; bId: string; note: string; noteEn: string }) {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const a = PATTERNS.find((p) => p.id === aId);
  const b = PATTERNS.find((p) => p.id === bId);
  if (!a || !b) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 sm:grid-cols-2">
        {[a, b].map((p) => (
          <div key={p.id}>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${CATEGORY_META[p.category].badge}`}>{isEn ? CATEGORY_META[p.category].labelEn : CATEGORY_META[p.category].label}</span>
            <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white" dir="ltr">{p.nameEn}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.nameAr}</p>
            <div className="my-2 rounded-lg ecg-monitor-bg p-1.5">
              <ECGWaveOrImage patternId={p.id} kind={p.wave} colorClass={waveColor[p.category]} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">🔑 {isEn ? noteEn : note}</div>
    </div>
  );
}

function ComparisonSection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <button type="button" onClick={() => setOpen((s) => !s)} className="flex w-full items-center justify-between px-4 py-3 text-right">
        <span className="font-bold text-slate-800 dark:text-slate-100">{t("ecg.confusedPatterns")}</span>
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
  const { lang, t } = useI18n();
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

  function switchType(qt: QuizType) {
    setQuizType(qt);
    setQuestion(pickQuestion(poolFor(qt)));
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
  const typePill = (qt: QuizType, label: string) => (
    <button
      type="button"
      onClick={() => switchType(qt)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${quizType === qt ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {label}
    </button>
  );
  const correctDesc = bilingual(question.correct.desc, question.correct.descEn, lang).text;
  const correctMemoryTrick = question.correct.memoryTrick ? bilingual(question.correct.memoryTrick, question.correct.memoryTrickEn, lang).text : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {typePill("normal", t("ecg.quizNormal"))}
          {typePill("speed", t("ecg.quizSpeed"))}
          {typePill("mistakes", `${t("ecg.quizMistakes")}${mistakes.length > 0 ? ` (${mistakes.length})` : ""}`)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t("ecg.score")} {score.correct} {t("ecg.of")} {score.total}</span>
          <button type="button" onClick={() => setScore({ correct: 0, total: 0 })} className="text-xs font-bold text-sky-600 dark:text-sky-400">↺</button>
        </div>
      </div>

      {mistakesEmpty ? (
        <div className="py-10 text-center text-sm text-slate-400">{t("ecg.noMistakesYet")}</div>
      ) : (
        <>
          {quizType === "speed" && !picked && (
            <div className={`mb-2 text-center text-sm font-black ${timeLeft <= 3 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>⏱️ {timeLeft}</div>
          )}
          <p className="mb-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{t("ecg.whatIsThisPattern")}</p>
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
                {picked === "__timeout__" ? t("ecg.timeUp") : picked === question.correct.id ? t("ecg.correctAnswer") : t("ecg.wrongAnswer")}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{correctDesc}</p>
              {correctMemoryTrick && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">💡 {correctMemoryTrick}</div>
              )}
              <button type="button" onClick={next} className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                {t("ecg.next")}
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
  const { lang, t } = useI18n();
  const isEn = lang === "en";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [mode, setMode] = useState<"library" | "quiz" | "learn">("library");
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
      const m = (p.nameAr + p.nameEn + p.desc + (p.descEn ?? "")).toLowerCase().includes(q.toLowerCase());
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
      <Breadcrumbs items={[{ label: t("nav.ecg") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle light /></div>
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-rose-600 to-slate-800 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-4xl sm:text-5xl">🫀</div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("nav.ecg")}</h1>
            <p className="mt-1 text-rose-50">{counts.total} {t("ecg.patternsClassified")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={() => setMode((m) => (m === "learn" ? "library" : "learn"))}
              className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "learn" ? "bg-white text-rose-700" : "bg-white/15 text-white hover:bg-white/25"}`}
            >
              {mode === "learn" ? t("ecg.backToLibrary") : t("ecg.learnToRead")}
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "quiz" ? "library" : "quiz"))}
              className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "quiz" ? "bg-white text-rose-700" : "bg-white/15 text-white hover:bg-white/25"}`}
            >
              {mode === "quiz" ? t("ecg.backToLibrary") : t("ecg.testYourself")}
            </button>
            {summaryProduct ? (
              <button type="button" onClick={buySummary} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300">
                {t("ecg.downloadSummary")} {summaryProduct.price} {isEn ? "EGP" : "ج.م"}
              </button>
            ) : (
              <span className="rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold text-white/70" title={t("ecg.summaryTitleHint")}>
                {t("ecg.summaryNotAdded")}
              </span>
            )}
          </div>
        </div>
      </div>

      {mode === "quiz" ? (
        <QuizMode />
      ) : mode === "learn" ? (
        <ECGLearn />
      ) : (
        <>
      <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {t("ecg.disclaimer")}
      </div>

      <ComparisonSection />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search") + "..."} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800" />
          <span className="absolute right-3 top-3 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">CPR {counts.cprCount}</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{t("ecg.shockable")} {counts.shockCount}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCat("")} className={`rounded-full px-3 py-1.5 text-sm font-bold ${!cat ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{t("cat.all")}</button>
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${cat === c ? CATEGORY_META[c].badge : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
            {isEn ? CATEGORY_META[c].labelEn : CATEGORY_META[c].label}
          </button>
        ))}
        <button
          onClick={() => setSavedOnly((s) => !s)}
          className={`mr-auto rounded-full px-3 py-1.5 text-sm font-bold ${savedOnly ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          {t("ecg.saved")} {favorites.length > 0 ? `(${favorites.length})` : ""}
        </button>
      </div>

      <div className="mb-6"><AdSlot label="إعلان مكتبة ECG" /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => <ECGCard key={p.id} p={p} />)}
        {list.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {savedOnly ? t("ecg.noneSavedYet") : t("common.noResults")}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
