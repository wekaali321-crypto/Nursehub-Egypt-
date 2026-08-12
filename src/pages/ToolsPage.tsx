import { useState } from "react";
import { Breadcrumbs } from "../components/common";
import { useI18n } from "../lib/i18n";

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold dark:text-white"><span className="text-2xl">{icon}</span>{title}</h3>
      {children}
    </div>
  );
}
const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";
const lbl = "mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-300";
const res = "mt-4 rounded-xl bg-sky-50 p-4 text-center font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300";

function BMI() {
  const [w, setW] = useState(""); const [h, setH] = useState("");
  const bmi = w && h ? Number(w) / ((Number(h) / 100) ** 2) : 0;
  const cat = bmi < 18.5 ? "نقص في الوزن" : bmi < 25 ? "وزن طبيعي" : bmi < 30 ? "زيادة في الوزن" : "سمنة";
  return (
    <Card title="حاسبة مؤشر كتلة الجسم (BMI)" icon="⚖️">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>الوزن (كجم)</label><input className={inp} value={w} onChange={(e) => setW(e.target.value)} type="number" /></div>
        <div><label className={lbl}>الطول (سم)</label><input className={inp} value={h} onChange={(e) => setH(e.target.value)} type="number" /></div>
      </div>
      {bmi > 0 && <div className={res}>BMI = {bmi.toFixed(1)} — {cat}</div>}
    </Card>
  );
}

function IVDrip() {
  const [vol, setVol] = useState(""); const [time, setTime] = useState(""); const [factor, setFactor] = useState("20");
  const rate = vol && time ? (Number(vol) * Number(factor)) / (Number(time) * 60) : 0;
  return (
    <Card title="حاسبة معدل التنقيط الوريدي (IV Drip Rate)" icon="💧">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>الحجم (مل)</label><input className={inp} value={vol} onChange={(e) => setVol(e.target.value)} type="number" /></div>
        <div><label className={lbl}>الوقت (ساعة)</label><input className={inp} value={time} onChange={(e) => setTime(e.target.value)} type="number" /></div>
        <div><label className={lbl}>عامل التنقيط</label><input className={inp} value={factor} onChange={(e) => setFactor(e.target.value)} type="number" /></div>
      </div>
      {rate > 0 && <div className={res}>المعدل = {rate.toFixed(0)} نقطة/دقيقة</div>}
    </Card>
  );
}

function Dosage() {
  const [dose, setDose] = useState(""); const [weight, setWeight] = useState(""); const [conc, setConc] = useState("");
  const total = dose && weight ? Number(dose) * Number(weight) : 0;
  const vol = total && conc ? total / Number(conc) : 0;
  return (
    <Card title="حاسبة جرعات الأدوية" icon="💊">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>الجرعة (مجم/كجم)</label><input className={inp} value={dose} onChange={(e) => setDose(e.target.value)} type="number" /></div>
        <div><label className={lbl}>وزن المريض (كجم)</label><input className={inp} value={weight} onChange={(e) => setWeight(e.target.value)} type="number" /></div>
        <div><label className={lbl}>التركيز (مجم/مل)</label><input className={inp} value={conc} onChange={(e) => setConc(e.target.value)} type="number" /></div>
      </div>
      {total > 0 && <div className={res}>الجرعة الكلية = {total.toFixed(1)} مجم {vol > 0 && `(${vol.toFixed(1)} مل)`}</div>}
    </Card>
  );
}

function FluidBalance() {
  const [intake, setIntake] = useState(""); const [output, setOutput] = useState("");
  const bal = intake && output ? Number(intake) - Number(output) : null;
  return (
    <Card title="حاسبة اتزان السوائل (Fluid Balance)" icon="🧪">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>المدخلات (مل)</label><input className={inp} value={intake} onChange={(e) => setIntake(e.target.value)} type="number" /></div>
        <div><label className={lbl}>المخرجات (مل)</label><input className={inp} value={output} onChange={(e) => setOutput(e.target.value)} type="number" /></div>
      </div>
      {bal !== null && <div className={res}>الاتزان = {bal} مل ({bal >= 0 ? "موجب ➕" : "سالب ➖"})</div>}
    </Card>
  );
}

function Pregnancy() {
  const [lmp, setLmp] = useState("");
  let edd = ""; let weeks = "";
  if (lmp) {
    const d = new Date(lmp);
    const due = new Date(d.getTime() + 280 * 86400000);
    edd = due.toISOString().slice(0, 10);
    weeks = Math.max(0, Math.floor((Date.now() - d.getTime()) / (7 * 86400000))).toString();
  }
  return (
    <Card title="حاسبة الحمل (Pregnancy Calculator)" icon="🤰">
      <label className={lbl}>أول يوم لآخر دورة شهرية (LMP)</label>
      <input className={inp} type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
      {edd && <div className={res}>موعد الولادة المتوقع: {edd}<br />عمر الحمل الحالي: {weeks} أسبوع</div>}
    </Card>
  );
}

function GCS() {
  const [eye, setEye] = useState(4); const [verbal, setVerbal] = useState(5); const [motor, setMotor] = useState(6);
  const total = eye + verbal + motor;
  const level = total >= 13 ? "إصابة خفيفة" : total >= 9 ? "إصابة متوسطة" : "إصابة شديدة";
  const sel = "w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
  return (
    <Card title="مقياس غلاسكو للوعي (GCS)" icon="🧠">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>فتح العين (E)</label><select className={sel} value={eye} onChange={(e) => setEye(+e.target.value)}>{[4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className={lbl}>الاستجابة اللفظية (V)</label><select className={sel} value={verbal} onChange={(e) => setVerbal(+e.target.value)}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className={lbl}>الاستجابة الحركية (M)</label><select className={sel} value={motor} onChange={(e) => setMotor(+e.target.value)}>{[6,5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div className={res}>المجموع = {total}/15 — {level}</div>
    </Card>
  );
}

function PediatricDose() {
  const [adult, setAdult] = useState(""); const [weight, setWeight] = useState("");
  // Clark's rule: child dose = adult dose × (weight in kg / 70)
  const dose = adult && weight ? (Number(adult) * Number(weight)) / 70 : 0;
  return (
    <Card title="حاسبة جرعة الأطفال (Pediatric Dose)" icon="👶">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>جرعة البالغ (مجم)</label><input className={inp} type="number" value={adult} onChange={(e) => setAdult(e.target.value)} /></div>
        <div><label className={lbl}>وزن الطفل (كجم)</label><input className={inp} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
      </div>
      {dose > 0 && <div className={res}>جرعة الطفل ≈ {dose.toFixed(1)} مجم<br /><span className="text-xs font-normal">(قاعدة كلارك التقريبية)</span></div>}
    </Card>
  );
}

type ABGCaseKey =
  | "normal"
  | "resp_acidosis_uncomp"
  | "resp_acidosis_partial"
  | "metabolic_acidosis_uncomp"
  | "metabolic_acidosis_partial"
  | "mixed_acidosis"
  | "unclear_acidosis"
  | "resp_alkalosis_uncomp"
  | "resp_alkalosis_partial"
  | "metabolic_alkalosis_uncomp"
  | "metabolic_alkalosis_partial"
  | "mixed_alkalosis"
  | "unclear_alkalosis"
  | "fully_comp_resp_acidosis"
  | "fully_comp_resp_alkalosis"
  | "ph_normal_mild";

type ABGCategory =
  | "normal"
  | "respiratory_acidosis"
  | "metabolic_acidosis"
  | "mixed_acidosis"
  | "respiratory_alkalosis"
  | "metabolic_alkalosis"
  | "mixed_alkalosis"
  | "unclear";

type Direction = "up" | "down" | "normal";

type ABGResult =
  | {
      key: ABGCaseKey;
      color: string;
      category: ABGCategory;
      severity: "طبيعي" | "خفيفة" | "متوسطة" | "شديدة";
      directions: { ph: Direction; paco2: Direction; hco3: Direction };
    }
  | null;

const ABG_LIBRARY: Record<ABGCaseKey, { primaryEn: string; compEn: string; ar: string }> = {
  normal: {
    primaryEn: "Normal acid-base balance",
    compEn: "No disturbance",
    ar: "كل القيم ضمن المعدل الطبيعي. لا يوجد اضطراب في التوازن الحمضي القاعدي.",
  },
  resp_acidosis_uncomp: {
    primaryEn: "Respiratory Acidosis",
    compEn: "Uncompensated",
    ar: "PaCO2 مرتفع وHCO3 لسه طبيعي، يعني الرئة مش بتتخلص من ثاني أكسيد الكربون بكفاءة (زي في حالات كبت التنفس أو انسداد مجرى الهواء)، والكلى لسه محتاجة وقت (أيام) عشان تعوّض عن طريق رفع HCO3.",
  },
  resp_acidosis_partial: {
    primaryEn: "Respiratory Acidosis",
    compEn: "Partially compensated (kidneys retaining HCO3)",
    ar: "PaCO2 مرتفع وHCO3 بدأ يرتفع هو كمان، ده معناه إن الكلى بدأت تعوّض عن طريق الاحتفاظ بالبيكربونات، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
  },
  metabolic_acidosis_uncomp: {
    primaryEn: "Metabolic Acidosis",
    compEn: "Uncompensated",
    ar: "HCO3 منخفض وPaCO2 لسه طبيعي، يعني في زيادة أحماض أو فقدان بيكربونات (زي DKA أو الفشل الكلوي أو الإسهال)، والرئة لسه محتاجة تبدأ تعوّض عن طريق زيادة معدل التنفس.",
  },
  metabolic_acidosis_partial: {
    primaryEn: "Metabolic Acidosis",
    compEn: "Partially compensated (respiratory drive lowering PaCO2)",
    ar: "HCO3 منخفض وPaCO2 بدأ ينخفض هو كمان، ده معناه إن المريض بدأ يتنفس بسرعة (hyperventilation) عشان يقلل ثاني أكسيد الكربون ويعوّض عن الحماض الاستقلابي، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
  },
  mixed_acidosis: {
    primaryEn: "Mixed Respiratory + Metabolic Acidosis",
    compEn: "Two primary disorders — not simple compensation",
    ar: "PaCO2 مرتفع وHCO3 منخفض في نفس الوقت. ده مش تعويض — ده اضطرابين أساسيين مع بعض (مثلاً توقف قلب أو فشل تنفسي شديد مصحوب بحماض استقلابي). محتاج تقييم سريري شامل فورًا.",
  },
  unclear_acidosis: {
    primaryEn: "Acidosis — cause unclear from core values alone",
    compEn: "Needs further data (anion gap, lactate, clinical context)",
    ar: "الـpH منخفض لكن PaCO2 وHCO3 مش واضح إنهم السبب المباشر من القيم المدخلة. محتاج قيم إضافية زي فجوة الأنيونات (anion gap) أو اللاكتات لتحديد السبب بدقة.",
  },
  resp_alkalosis_uncomp: {
    primaryEn: "Respiratory Alkalosis",
    compEn: "Uncompensated",
    ar: "PaCO2 منخفض وHCO3 لسه طبيعي، يعني المريض بيتنفس بسرعة زيادة عن اللازم (زي القلق أو الألم أو نقص الأكسجين)، والكلى لسه محتاجة وقت عشان تعوّض عن طريق طرح البيكربونات.",
  },
  resp_alkalosis_partial: {
    primaryEn: "Respiratory Alkalosis",
    compEn: "Partially compensated (kidneys excreting HCO3)",
    ar: "PaCO2 منخفض وHCO3 بدأ ينخفض هو كمان، ده معناه إن الكلى بدأت تعوّض عن طريق طرح البيكربونات، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
  },
  metabolic_alkalosis_uncomp: {
    primaryEn: "Metabolic Alkalosis",
    compEn: "Uncompensated",
    ar: "HCO3 مرتفع وPaCO2 لسه طبيعي، يعني في فقدان أحماض أو زيادة قواعد (زي القيء الشديد أو مدرات البول أو نقص البوتاسيوم)، والرئة لسه محتاجة تبدأ تعوّض عن طريق إبطاء التنفس.",
  },
  metabolic_alkalosis_partial: {
    primaryEn: "Metabolic Alkalosis",
    compEn: "Partially compensated (respiratory drive raising PaCO2)",
    ar: "HCO3 مرتفع وPaCO2 بدأ يرتفع هو كمان، ده معناه إن الجسم بدأ يبطّئ التنفس عشان يحتفظ بثاني أكسيد الكربون ويعوّض عن القلاء الاستقلابي، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
  },
  mixed_alkalosis: {
    primaryEn: "Mixed Respiratory + Metabolic Alkalosis",
    compEn: "Two primary disorders — not simple compensation",
    ar: "PaCO2 منخفض وHCO3 مرتفع في نفس الوقت. ده مش تعويض — ده اضطرابين أساسيين مع بعض (مثلاً فرط تنفس مصحوب بقيء شديد). محتاج تقييم سريري شامل فورًا.",
  },
  unclear_alkalosis: {
    primaryEn: "Alkalosis — cause unclear from core values alone",
    compEn: "Needs further data (clinical context)",
    ar: "الـpH مرتفع لكن PaCO2 وHCO3 مش واضح إنهم السبب المباشر من القيم المدخلة. راجع السياق السريري الكامل للمريض.",
  },
  fully_comp_resp_acidosis: {
    primaryEn: "Fully Compensated Respiratory Acidosis (or compensated Metabolic Alkalosis)",
    compEn: "pH normal, PaCO2 high, HCO3 high",
    ar: "الـpH رجع طبيعي، لكن PaCO2 وHCO3 لسه مرتفعين مع بعض. ده معناه إن الجسم عوّض بالكامل — الأرجح إنه حماض تنفسي مزمن (زي مريض COPD مستقر) والكلى عوّضت بالكامل برفع البيكربونات على مدار أيام.",
  },
  fully_comp_resp_alkalosis: {
    primaryEn: "Fully Compensated Respiratory Alkalosis (or compensated Metabolic Acidosis)",
    compEn: "pH normal, PaCO2 low, HCO3 low",
    ar: "الـpH رجع طبيعي، لكن PaCO2 وHCO3 لسه منخفضين مع بعض. ده معناه إن الجسم عوّض بالكامل — يحتاج مراجعة الاتجاه العام والتاريخ المرضي لتحديد هل الأصل تنفسي أو استقلابي.",
  },
  ph_normal_mild: {
    primaryEn: "pH normal with a mild isolated abnormality",
    compEn: "Monitor trend",
    ar: "الـpH طبيعي لكن في قيمة واحدة بس (إما PaCO2 أو HCO3) طالعة خارج المعدل الطبيعي. راقب الاتجاه العام للقيم بمرور الوقت وربطها بحالة المريض السريرية.",
  },
};

const CATEGORY_MAP: Record<ABGCaseKey, ABGCategory> = {
  normal: "normal",
  resp_acidosis_uncomp: "respiratory_acidosis",
  resp_acidosis_partial: "respiratory_acidosis",
  fully_comp_resp_acidosis: "respiratory_acidosis",
  metabolic_acidosis_uncomp: "metabolic_acidosis",
  metabolic_acidosis_partial: "metabolic_acidosis",
  mixed_acidosis: "mixed_acidosis",
  unclear_acidosis: "unclear",
  resp_alkalosis_uncomp: "respiratory_alkalosis",
  resp_alkalosis_partial: "respiratory_alkalosis",
  fully_comp_resp_alkalosis: "respiratory_alkalosis",
  metabolic_alkalosis_uncomp: "metabolic_alkalosis",
  metabolic_alkalosis_partial: "metabolic_alkalosis",
  mixed_alkalosis: "mixed_alkalosis",
  unclear_alkalosis: "unclear",
  ph_normal_mild: "normal",
};

const CAUSES: Partial<Record<ABGCategory, string[]>> = {
  respiratory_acidosis: [
    "تفاقم الانسداد الرئوي المزمن (COPD)",
    "نقص التهوية (Hypoventilation)",
    "انسداد المجرى الهوائي",
    "جرعة زائدة من المهدئات أو الأفيونات",
    "أمراض عصبية عضلية (Guillain-Barré، الوهن العضلي)",
    "إصابة الصدر (Flail chest)",
    "عطل في إعدادات جهاز التنفس الصناعي",
  ],
  metabolic_acidosis: [
    "الحماض الكيتوني السكري (DKA)",
    "الفشل الكلوي",
    "الحماض اللبني (تسمم الدم / نقص التروية)",
    "إسهال شديد",
    "تسمم بالميثانول أو إيثيلين جلايكول",
    "حماض الجوع (Starvation ketoacidosis)",
  ],
  respiratory_alkalosis: [
    "القلق أو نوبات الهلع",
    "الألم الحاد",
    "نقص الأكسجين (Hypoxemia)",
    "الحمل",
    "الإنتان (المرحلة المبكرة)",
    "فرط تهوية عبر جهاز التنفس الصناعي",
    "الحمى",
  ],
  metabolic_alkalosis: [
    "قيء شديد أو مستمر / شفط أنفي معدي",
    "استخدام مدرات البول",
    "نقص البوتاسيوم",
    "تناول زائد لمضادات الحموضة أو البيكربونات",
    "فرط الألدوستيرون",
  ],
};

const NURSING: Partial<Record<ABGCategory, string[]>> = {
  respiratory_acidosis: [
    "قيّم جهد التنفس",
    "راقب تشبّع الأكسجين",
    "راقب مستوى الوعي",
    "تأكد من سلامة المجرى الهوائي",
    "استعد لاحتمال دعم التهوية",
    "أبلغ الطبيب عند التدهور",
  ],
  metabolic_acidosis: [
    "راقب سكر الدم والكيتونات إذا كان DKA محتمل",
    "راقب اتزان السوائل وكمية البول",
    "راقب مستوى البوتاسيوم عن قرب (خصوصاً مع الإنسولين)",
    "راقب مستوى الوعي",
    "استعد لسوائل وريدية / إنسولين حسب الأوامر الطبية",
    "راقب العلامات الحيوية عن قرب",
  ],
  respiratory_alkalosis: [
    "قيّم القلق أو الألم وتعامل معه",
    "راقب تشبّع الأكسجين",
    "ساعد المريض على تهدئة التنفس إذا كان فرط تهوية",
    "راقب علامات نقص الكالسيوم (تنميل، تشنج)",
    "راجع إعدادات جهاز التنفس الصناعي إن وجد",
  ],
  metabolic_alkalosis: [
    "راقب مستوى البوتاسيوم وعوّضه حسب الأوامر",
    "راقب اتزان السوائل والكهارل",
    "راقب علامات ضعف العضلات أو اضطراب النظم",
    "راجع الأدوية (مدرات البول، مضادات الحموضة)",
    "راقب المدخول والمخرج بدقة",
  ],
};

const MEDICAL: Partial<Record<ABGCategory, string[]>> = {
  respiratory_acidosis: [
    "قيّم سبب نقص التهوية",
    "فكّر في إعادة تحليل الغازات",
    "راجع صورة الصدر إن لزم",
    "قيّم الحاجة للتهوية غير الباضعة",
  ],
  metabolic_acidosis: [
    "احسب فجوة الأنيونات (Anion Gap)",
    "حدد السبب الكامن وعالجه",
    "فكّر في فحص السموم إذا اقتضى الأمر",
    "راقب اتجاه اللاكتات",
  ],
  respiratory_alkalosis: [
    "حدد سبب فرط التهوية وعالجه",
    "قيّم وجود نقص أكسجين كامن",
    "فكّر في تقييم الألم أو القلق",
    "راجع إعدادات جهاز التنفس الصناعي",
  ],
  metabolic_alkalosis: [
    "حدد السبب الكامن وصححه",
    "راجع استخدام مدرات البول أو مضادات الحموضة",
    "راقب الكهارل (بوتاسيوم، كلوريد)",
    "فكّر في تعويض الكلوريد إذا لزم",
  ],
};

function mergedList(table: Partial<Record<ABGCategory, string[]>>, category: ABGCategory): string[] {
  if (category === "mixed_acidosis") return [...(table.respiratory_acidosis ?? []), ...(table.metabolic_acidosis ?? [])];
  if (category === "mixed_alkalosis") return [...(table.respiratory_alkalosis ?? []), ...(table.metabolic_alkalosis ?? [])];
  return table[category] ?? [];
}

function severityOf(pH: number): "طبيعي" | "خفيفة" | "متوسطة" | "شديدة" {
  if (pH >= 7.35 && pH <= 7.45) return "طبيعي";
  const dev = pH < 7.35 ? 7.35 - pH : pH - 7.45;
  if (dev < 0.05) return "خفيفة";
  if (dev < 0.15) return "متوسطة";
  return "شديدة";
}

function interpretABG(pH: number, paco2: number, hco3: number): ABGResult {
  if (!pH || !paco2 || !hco3) return null;

  const phLow = pH < 7.35;
  const phHigh = pH > 7.45;
  const phNormal = !phLow && !phHigh;

  const co2High = paco2 > 45;
  const co2Low = paco2 < 35;

  const hco3High = hco3 > 26;
  const hco3Low = hco3 < 22;

  const directions: { ph: Direction; paco2: Direction; hco3: Direction } = {
    ph: phLow ? "down" : phHigh ? "up" : "normal",
    paco2: co2High ? "up" : co2Low ? "down" : "normal",
    hco3: hco3High ? "up" : hco3Low ? "down" : "normal",
  };
  const severity = severityOf(pH);

  const finish = (key: ABGCaseKey, color: string): ABGResult => ({
    key,
    color,
    category: CATEGORY_MAP[key],
    severity,
    directions,
  });

  if (phNormal && !co2High && !co2Low && !hco3High && !hco3Low) return finish("normal", "emerald");

  if (phLow) {
    if (co2High && hco3Low) return finish("mixed_acidosis", "rose");
    if (co2High) return finish(hco3High ? "resp_acidosis_partial" : "resp_acidosis_uncomp", "rose");
    if (hco3Low) return finish(co2Low ? "metabolic_acidosis_partial" : "metabolic_acidosis_uncomp", "rose");
    return finish("unclear_acidosis", "rose");
  }

  if (phHigh) {
    if (co2Low && hco3High) return finish("mixed_alkalosis", "amber");
    if (co2Low) return finish(hco3Low ? "resp_alkalosis_partial" : "resp_alkalosis_uncomp", "amber");
    if (hco3High) return finish(co2High ? "metabolic_alkalosis_partial" : "metabolic_alkalosis_uncomp", "amber");
    return finish("unclear_alkalosis", "amber");
  }

  // pH normal but CO2/HCO3 abnormal
  if (co2High && hco3High) return finish("fully_comp_resp_acidosis", "violet");
  if (co2Low && hco3Low) return finish("fully_comp_resp_alkalosis", "violet");
  return finish("ph_normal_mild", "violet");
}

function ABGInterpreter() {
  const [pH, setPH] = useState("");
  const [paco2, setPaco2] = useState("");
  const [hco3, setHco3] = useState("");
  const [sao2, setSao2] = useState("");
  const [pao2, setPao2] = useState("");
  const [lactate, setLactate] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [result, setResult] = useState<ABGResult>(null);

  const run = () => {
    setResult(interpretABG(Number(pH), Number(paco2), Number(hco3)));
  };

  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  };

  return (
    <Card title="مفسّر غازات الدم (ABG)" icon="🫁">
      <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        أداة تعليمية للمساعدة فقط وليست تشخيصاً طبياً. يجب تفسير النتيجة ضمن السياق السريري للمريض ولا تغني عن تقييم الطبيب.
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>PaCO2</label>
          <input className={inp} type="number" step="0.1" value={paco2} onChange={(e) => setPaco2(e.target.value)} placeholder="40" />
        </div>
        <div>
          <label className={lbl}>pH</label>
          <input className={inp} type="number" step="0.01" value={pH} onChange={(e) => setPH(e.target.value)} placeholder="7.40" />
        </div>
      </div>
      <div className="mb-3">
        <label className={lbl}>HCO3</label>
        <input className={inp} type="number" step="0.1" value={hco3} onChange={(e) => setHco3(e.target.value)} placeholder="24" />
      </div>

      <button type="button" onClick={() => setShowOptional((s) => !s)} className="mb-3 text-sm font-bold text-sky-600 dark:text-sky-400">
        {showOptional ? "− إخفاء القيم الاختيارية" : "+ قيم اختيارية"}
      </button>

      {showOptional && (
        <div className="mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>% SaO2</label>
              <input className={inp} type="number" value={sao2} onChange={(e) => setSao2(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={lbl}>PaO2</label>
              <input className={inp} type="number" value={pao2} onChange={(e) => setPao2(e.target.value)} placeholder="—" />
            </div>
          </div>
          <div>
            <label className={lbl}>Lactate</label>
            <input className={inp} type="number" value={lactate} onChange={(e) => setLactate(e.target.value)} placeholder="—" />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={run}
        disabled={!pH || !paco2 || !hco3}
        className="w-full rounded-xl bg-sky-600 py-3 font-bold text-white disabled:opacity-40"
      >
        🔬 تفسير غازات الدم
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-xl p-4 ${colorClasses[result.color]}`}>
            <div className="text-lg font-black" dir="ltr">{ABG_LIBRARY[result.key].primaryEn}</div>
            <div className="mt-1 text-sm font-semibold" dir="ltr">{ABG_LIBRARY[result.key].compEn}</div>
            <div className="mt-3 border-t border-current/20 pt-3 text-sm leading-relaxed">{ABG_LIBRARY[result.key].ar}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-current/20 pt-3 text-center">
              {(["hco3", "paco2", "ph"] as const).map((k) => (
                <div key={k}>
                  <div className="text-xs font-bold uppercase opacity-70">{k === "ph" ? "pH" : k === "paco2" ? "PaCO2" : "HCO3"}</div>
                  <div className="text-xl">{result.directions[k] === "up" ? "↑" : result.directions[k] === "down" ? "↓" : "→"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
              <div className={lbl}>الشدة</div>
              <div className="font-bold dark:text-white">{result.severity}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
              <div className={lbl}>التعويض</div>
              <div className="font-bold dark:text-white" dir="ltr">{ABG_LIBRARY[result.key].compEn}</div>
            </div>
          </div>

          {mergedList(CAUSES, result.category).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-2 font-bold dark:text-white">🔍 الأسباب المحتملة</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {mergedList(CAUSES, result.category).map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}

          {mergedList(NURSING, result.category).length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-500/5">
              <div className="mb-2 font-bold text-emerald-700 dark:text-emerald-300">💚 توجيهات تمريضية</div>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {mergedList(NURSING, result.category).map((c) => <li key={c}>✔ {c}</li>)}
              </ul>
            </div>
          )}

          {mergedList(MEDICAL, result.category).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-2 font-bold dark:text-white">🩺 توجيهات طبية عامة</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {mergedList(MEDICAL, result.category).map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="text-xs opacity-70">
            للغرض التعليمي فقط، بناءً على القيم الأساسية — يعتمد على السياق السريري الكامل للمريض ولا يغني عن تقييم الطبيب.
          </div>
          {(sao2 || pao2 || lactate) && (
            <div className="text-xs opacity-80" dir="ltr">
              {sao2 && <>SaO2: {sao2}% </>}
              {pao2 && <>· PaO2: {pao2} </>}
              {lactate && <>· Lactate: {lactate}</>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

const doseUnits = [
  { key: "mcg/kg/min", label: "mcg/kg/min" },
  { key: "mcg/kg/hr", label: "mcg/kg/hr" },
  { key: "mcg/min", label: "mcg/min" },
  { key: "mg/hr", label: "mg/hr" },
];
const commonDrugs = ["نورأدرينالين", "أدرينالين", "دوبامين", "دوبوتامين", "بريسيدكس", "نيتروجليسرين"];

function DoseRateCalculator() {
  const [mode, setMode] = useState<"doseToRate" | "rateToDose">("doseToRate");
  const [drug, setDrug] = useState("");
  const [doseUnit, setDoseUnit] = useState("mcg/kg/min");
  const [weight, setWeight] = useState("");
  const [bagAmount, setBagAmount] = useState("");
  const [bagUnit, setBagUnit] = useState<"mg" | "mcg">("mg");
  const [volume, setVolume] = useState("");
  const [doseInput, setDoseInput] = useState("");
  const [rateInput, setRateInput] = useState("");

  const concMcgPerMl =
    bagAmount && volume
      ? (bagUnit === "mg" ? Number(bagAmount) * 1000 : Number(bagAmount)) / Number(volume)
      : 0;

  let result: number | null = null;
  if (concMcgPerMl > 0) {
    if (mode === "doseToRate" && doseInput) {
      const d = Number(doseInput);
      if (doseUnit === "mcg/kg/min") result = weight ? (d * Number(weight) * 60) / concMcgPerMl : null;
      else if (doseUnit === "mcg/kg/hr") result = weight ? (d * Number(weight)) / concMcgPerMl : null;
      else if (doseUnit === "mcg/min") result = (d * 60) / concMcgPerMl;
      else if (doseUnit === "mg/hr") result = (d * 1000) / concMcgPerMl;
    } else if (mode === "rateToDose" && rateInput) {
      const r = Number(rateInput);
      if (doseUnit === "mcg/kg/min") result = weight ? (r * concMcgPerMl) / (Number(weight) * 60) : null;
      else if (doseUnit === "mcg/kg/hr") result = weight ? (r * concMcgPerMl) / Number(weight) : null;
      else if (doseUnit === "mcg/min") result = (r * concMcgPerMl) / 60;
      else if (doseUnit === "mg/hr") result = (r * concMcgPerMl) / 1000;
    }
  }

  const needsWeight = doseUnit === "mcg/kg/min" || doseUnit === "mcg/kg/hr";

  return (
    <Card title="مفسّر الجرعات (Dose ↔ Rate)" icon="🧮">
      <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        للغرض التعليمي والمرجعي فقط، وليس بديلاً عن اتخاذ قرار علاجي أو تحديد جرعة أو إعداد للمضخة. اتبع أوامر الطبيب وبروتوكول المنشأة دائمًا.
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {commonDrugs.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDrug(d)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              drug === d
                ? "border-sky-400 bg-sky-500 text-white"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("doseToRate")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "doseToRate" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          جرعة → معدل
        </button>
        <button
          type="button"
          onClick={() => setMode("rateToDose")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "rateToDose" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          معدل → جرعة
        </button>
      </div>

      <div className="mb-3">
        <label className={lbl}>وحدة الجرعة</label>
        <select className={inp} value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)}>
          {doseUnits.map((u) => (
            <option key={u.key} value={u.key}>{u.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {needsWeight && (
          <div>
            <label className={lbl}>وزن المريض (كجم)</label>
            <input className={inp} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        )}
        <div>
          <label className={lbl}>حجم المحلول الكلي (مل)</label>
          <input className={inp} type="number" value={volume} onChange={(e) => setVolume(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={lbl}>كمية الدواء في الكيس</label>
          <input className={inp} type="number" value={bagAmount} onChange={(e) => setBagAmount(e.target.value)} placeholder="مثال: 8" />
        </div>
        <div>
          <label className={lbl}>الوحدة</label>
          <select className={inp} value={bagUnit} onChange={(e) => setBagUnit(e.target.value as "mg" | "mcg")}>
            <option value="mg">mg</option>
            <option value="mcg">mcg</option>
          </select>
        </div>
      </div>

      {mode === "doseToRate" ? (
        <div className="mt-3">
          <label className={lbl}>الجرعة المطلوبة ({doseUnit})</label>
          <input className={inp} type="number" value={doseInput} onChange={(e) => setDoseInput(e.target.value)} />
        </div>
      ) : (
        <div className="mt-3">
          <label className={lbl}>معدل التسريب (مل/ساعة)</label>
          <input className={inp} type="number" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
        </div>
      )}

      {concMcgPerMl > 0 && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">تركيز المحلول: {concMcgPerMl.toFixed(2)} mcg/mL</div>
      )}

      {result !== null && !Number.isNaN(result) && (
        <div className={res}>
          {mode === "doseToRate"
            ? `معدل التسريب = ${result.toFixed(2)} مل/ساعة`
            : `الجرعة = ${result.toFixed(3)} ${doseUnit}`}
        </div>
      )}
      {needsWeight && !weight && (doseInput || rateInput) && (
        <div className="mt-2 text-xs text-rose-500">أدخل وزن المريض لإتمام الحساب مع هذه الوحدة.</div>
      )}
    </Card>
  );
}

const aiKB: { keys: string[]; answer: string }[] = [
  { keys: ["bmi", "كتلة", "وزن"], answer: "مؤشر كتلة الجسم يحسب بقسمة الوزن (كجم) على مربع الطول (متر). القيمة الطبيعية بين 18.5 و 24.9." },
  { keys: ["جرعة", "دواء", "dose"], answer: "تُحسب جرعة الدواء عادةً بضرب الجرعة الموصوفة (مجم/كجم) في وزن المريض. تأكد دائماً من مراجعة الطبيب." },
  { keys: ["جرح", "wound", "ضماد"], answer: "للعناية بالجرح: اغسل يديك، ارتدِ قفازات معقمة، نظّف الجرح بمحلول ملحي، ثم ضع الضمادة المناسبة." },
  { keys: ["ضغط", "blood pressure", "bp"], answer: "ضغط الدم الطبيعي حوالي 120/80 ملم زئبق. ارتفاعه فوق 140/90 يعد ارتفاعاً في ضغط الدم." },
  { keys: ["سكر", "diabetes", "glucose"], answer: "مستوى السكر الطبيعي صائم بين 70-100 مجم/ديسيلتر. راقب علامات نقص أو ارتفاع السكر لدى المريض." },
];

function AIAssistant() {
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "مرحباً! أنا مساعدك الذكي للتمريض. اسألني عن BMI، الجرعات، العناية بالجروح، ضغط الدم، السكري وغيرها." },
  ]);
  const [input, setInput] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.toLowerCase();
    const found = aiKB.find((k) => k.keys.some((key) => q.includes(key)));
    const answer = found ? found.answer : "هذا سؤال جيد! للحصول على إجابة دقيقة، راجع المقالات في قسم المهارات والأدوية أو استشر مختصاً.";
    setMsgs((m) => [...m, { role: "user", text: input }, { role: "bot", text: answer }]);
    setInput("");
  };
  return (
    <Card title="المساعد الذكي للتمريض 🤖" icon="✨">
      <div className="mb-3 h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "mr-auto bg-sky-500 text-white" : "ml-auto bg-white dark:bg-slate-700 dark:text-white"}`}>{m.text}</div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب سؤالك..." className={inp} />
        <button className="rounded-lg bg-emerald-500 px-5 font-bold text-white">إرسال</button>
      </form>
    </Card>
  );
}

export default function ToolsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.tools") }]} />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black dark:text-white">{t("tools.title")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("tools.sub")}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BMI /><IVDrip /><Dosage /><FluidBalance /><Pregnancy /><GCS /><PediatricDose /><DoseRateCalculator /><ABGInterpreter />
        <div className="lg:col-span-2"><AIAssistant /></div>
      </div>
    </div>
  );
}
