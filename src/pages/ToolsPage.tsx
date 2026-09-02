import { useState } from "react";
import { Breadcrumbs } from "../components/common";
import { useI18n } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

/**
 * Accordion-style card: only the tool's title/icon show by default; tapping
 * the header expands the tool's inputs/results and collapses again on a
 * second tap. Each card manages its own open state independently, so the
 * user can have as many or as few tools expanded at once as they like —
 * this keeps the page short and scannable instead of showing all 9 tools
 * fully expanded at once.
 */
function Card({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-5 text-right"
      >
        <span className="flex items-center gap-2 text-lg font-bold dark:text-white">
          <span className="text-2xl" aria-hidden="true">{icon}</span>{title}
        </span>
        <span className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true">▼</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";
const lbl = "mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-300";
const res = "mt-4 rounded-xl bg-sky-50 p-4 text-center font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300";

function BMI() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [w, setW] = useState(""); const [h, setH] = useState("");
  const bmi = w && h ? Number(w) / ((Number(h) / 100) ** 2) : 0;
  const cat = isEn
    ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obese")
    : (bmi < 18.5 ? "نقص في الوزن" : bmi < 25 ? "وزن طبيعي" : bmi < 30 ? "زيادة في الوزن" : "سمنة");
  return (
    <Card title={isEn ? "BMI Calculator" : "حاسبة مؤشر كتلة الجسم (BMI)"} icon="⚖️">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>{isEn ? "Weight (kg)" : "الوزن (كجم)"}</label><input className={inp} value={w} onChange={(e) => setW(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Height (cm)" : "الطول (سم)"}</label><input className={inp} value={h} onChange={(e) => setH(e.target.value)} type="number" /></div>
      </div>
      {bmi > 0 && <div className={res}>BMI = {bmi.toFixed(1)} — {cat}</div>}
    </Card>
  );
}

function IVDrip() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [vol, setVol] = useState(""); const [time, setTime] = useState(""); const [factor, setFactor] = useState("20");
  const rate = vol && time ? (Number(vol) * Number(factor)) / (Number(time) * 60) : 0;
  return (
    <Card title={isEn ? "IV Drip Rate Calculator" : "حاسبة معدل التنقيط الوريدي (IV Drip Rate)"} icon="💧">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>{isEn ? "Volume (mL)" : "الحجم (مل)"}</label><input className={inp} value={vol} onChange={(e) => setVol(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Time (hours)" : "الوقت (ساعة)"}</label><input className={inp} value={time} onChange={(e) => setTime(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Drop factor" : "عامل التنقيط"}</label><input className={inp} value={factor} onChange={(e) => setFactor(e.target.value)} type="number" /></div>
      </div>
      {rate > 0 && <div className={res}>{isEn ? `Rate = ${rate.toFixed(0)} drops/min` : `المعدل = ${rate.toFixed(0)} نقطة/دقيقة`}</div>}
    </Card>
  );
}

function Dosage() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [dose, setDose] = useState(""); const [weight, setWeight] = useState(""); const [conc, setConc] = useState("");
  const total = dose && weight ? Number(dose) * Number(weight) : 0;
  const vol = total && conc ? total / Number(conc) : 0;
  return (
    <Card title={isEn ? "Medication Dosage Calculator" : "حاسبة جرعات الأدوية"} icon="💊">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>{isEn ? "Dose (mg/kg)" : "الجرعة (مجم/كجم)"}</label><input className={inp} value={dose} onChange={(e) => setDose(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Patient weight (kg)" : "وزن المريض (كجم)"}</label><input className={inp} value={weight} onChange={(e) => setWeight(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Concentration (mg/mL)" : "التركيز (مجم/مل)"}</label><input className={inp} value={conc} onChange={(e) => setConc(e.target.value)} type="number" /></div>
      </div>
      {total > 0 && <div className={res}>{isEn ? `Total dose = ${total.toFixed(1)} mg ${vol > 0 ? `(${vol.toFixed(1)} mL)` : ""}` : `الجرعة الكلية = ${total.toFixed(1)} مجم ${vol > 0 ? `(${vol.toFixed(1)} مل)` : ""}`}</div>}
    </Card>
  );
}

function FluidBalance() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [intake, setIntake] = useState(""); const [output, setOutput] = useState("");
  const bal = intake && output ? Number(intake) - Number(output) : null;
  return (
    <Card title={isEn ? "Fluid Balance Calculator" : "حاسبة اتزان السوائل (Fluid Balance)"} icon="🧪">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>{isEn ? "Intake (mL)" : "المدخلات (مل)"}</label><input className={inp} value={intake} onChange={(e) => setIntake(e.target.value)} type="number" /></div>
        <div><label className={lbl}>{isEn ? "Output (mL)" : "المخرجات (مل)"}</label><input className={inp} value={output} onChange={(e) => setOutput(e.target.value)} type="number" /></div>
      </div>
      {bal !== null && <div className={res}>{isEn ? `Balance = ${bal} mL (${bal >= 0 ? "Positive ➕" : "Negative ➖"})` : `الاتزان = ${bal} مل (${bal >= 0 ? "موجب ➕" : "سالب ➖"})`}</div>}
    </Card>
  );
}

function Pregnancy() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [lmp, setLmp] = useState("");
  let edd = ""; let weeks = "";
  if (lmp) {
    const d = new Date(lmp);
    const due = new Date(d.getTime() + 280 * 86400000);
    edd = due.toISOString().slice(0, 10);
    weeks = Math.max(0, Math.floor((Date.now() - d.getTime()) / (7 * 86400000))).toString();
  }
  return (
    <Card title={isEn ? "Pregnancy Calculator" : "حاسبة الحمل (Pregnancy Calculator)"} icon="🤰">
      <label className={lbl}>{isEn ? "First day of last menstrual period (LMP)" : "أول يوم لآخر دورة شهرية (LMP)"}</label>
      <input className={inp} type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
      {edd && <div className={res}>{isEn ? <>Estimated due date: {edd}<br />Current gestational age: {weeks} weeks</> : <>موعد الولادة المتوقع: {edd}<br />عمر الحمل الحالي: {weeks} أسبوع</>}</div>}
    </Card>
  );
}

function GCS() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [eye, setEye] = useState(4); const [verbal, setVerbal] = useState(5); const [motor, setMotor] = useState(6);
  const total = eye + verbal + motor;
  const level = isEn
    ? (total >= 13 ? "Mild injury" : total >= 9 ? "Moderate injury" : "Severe injury")
    : (total >= 13 ? "إصابة خفيفة" : total >= 9 ? "إصابة متوسطة" : "إصابة شديدة");
  const sel = "w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
  return (
    <Card title={isEn ? "Glasgow Coma Scale (GCS)" : "مقياس غلاسكو للوعي (GCS)"} icon="🧠">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>{isEn ? "Eye Opening (E)" : "فتح العين (E)"}</label><select className={sel} value={eye} onChange={(e) => setEye(+e.target.value)}>{[4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className={lbl}>{isEn ? "Verbal Response (V)" : "الاستجابة اللفظية (V)"}</label><select className={sel} value={verbal} onChange={(e) => setVerbal(+e.target.value)}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className={lbl}>{isEn ? "Motor Response (M)" : "الاستجابة الحركية (M)"}</label><select className={sel} value={motor} onChange={(e) => setMotor(+e.target.value)}>{[6,5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div className={res}>{isEn ? `Total = ${total}/15 — ${level}` : `المجموع = ${total}/15 — ${level}`}</div>
    </Card>
  );
}

function PediatricDose() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [adult, setAdult] = useState(""); const [weight, setWeight] = useState("");
  // Clark's rule: child dose = adult dose × (weight in kg / 70)
  const dose = adult && weight ? (Number(adult) * Number(weight)) / 70 : 0;
  return (
    <Card title={isEn ? "Pediatric Dose Calculator" : "حاسبة جرعة الأطفال (Pediatric Dose)"} icon="👶">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>{isEn ? "Adult dose (mg)" : "جرعة البالغ (مجم)"}</label><input className={inp} type="number" value={adult} onChange={(e) => setAdult(e.target.value)} /></div>
        <div><label className={lbl}>{isEn ? "Child weight (kg)" : "وزن الطفل (كجم)"}</label><input className={inp} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
      </div>
      {dose > 0 && <div className={res}>{isEn ? <>Child dose ≈ {dose.toFixed(1)} mg<br /><span className="text-xs font-normal">(Clark's rule approximation)</span></> : <>جرعة الطفل ≈ {dose.toFixed(1)} مجم<br /><span className="text-xs font-normal">(قاعدة كلارك التقريبية)</span></>}</div>}
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
type Severity = "normal" | "mild" | "moderate" | "severe";

type ABGResult =
  | {
      key: ABGCaseKey;
      color: string;
      category: ABGCategory;
      severity: Severity;
      directions: { ph: Direction; paco2: Direction; hco3: Direction };
    }
  | null;

const SEVERITY_LABEL: Record<Severity, { ar: string; en: string }> = {
  normal: { ar: "طبيعي", en: "Normal" },
  mild: { ar: "خفيفة", en: "Mild" },
  moderate: { ar: "متوسطة", en: "Moderate" },
  severe: { ar: "شديدة", en: "Severe" },
};

const ABG_LIBRARY: Record<ABGCaseKey, { primaryEn: string; compEn: string; ar: string; en: string }> = {
  normal: {
    primaryEn: "Normal acid-base balance",
    compEn: "No disturbance",
    ar: "كل القيم ضمن المعدل الطبيعي. لا يوجد اضطراب في التوازن الحمضي القاعدي.",
    en: "All values are within the normal range. There is no acid-base balance disturbance.",
  },
  resp_acidosis_uncomp: {
    primaryEn: "Respiratory Acidosis",
    compEn: "Uncompensated",
    ar: "PaCO2 مرتفع وHCO3 لسه طبيعي، يعني الرئة مش بتتخلص من ثاني أكسيد الكربون بكفاءة (زي في حالات كبت التنفس أو انسداد مجرى الهواء)، والكلى لسه محتاجة وقت (أيام) عشان تعوّض عن طريق رفع HCO3.",
    en: "PaCO2 is high and HCO3 is still normal, meaning the lungs are not clearing carbon dioxide efficiently (as in respiratory depression or airway obstruction), and the kidneys still need time (days) to compensate by raising HCO3.",
  },
  resp_acidosis_partial: {
    primaryEn: "Respiratory Acidosis",
    compEn: "Partially compensated (kidneys retaining HCO3)",
    ar: "PaCO2 مرتفع وHCO3 بدأ يرتفع هو كمان، ده معناه إن الكلى بدأت تعوّض عن طريق الاحتفاظ بالبيكربونات، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
    en: "PaCO2 is high and HCO3 has also started to rise, meaning the kidneys have started compensating by retaining bicarbonate, but the pH has not yet returned fully to normal.",
  },
  metabolic_acidosis_uncomp: {
    primaryEn: "Metabolic Acidosis",
    compEn: "Uncompensated",
    ar: "HCO3 منخفض وPaCO2 لسه طبيعي، يعني في زيادة أحماض أو فقدان بيكربونات (زي DKA أو الفشل الكلوي أو الإسهال)، والرئة لسه محتاجة تبدأ تعوّض عن طريق زيادة معدل التنفس.",
    en: "HCO3 is low and PaCO2 is still normal, meaning there is an excess of acids or a loss of bicarbonate (as in DKA, renal failure, or diarrhea), and the lungs still need to start compensating by increasing the respiratory rate.",
  },
  metabolic_acidosis_partial: {
    primaryEn: "Metabolic Acidosis",
    compEn: "Partially compensated (respiratory drive lowering PaCO2)",
    ar: "HCO3 منخفض وPaCO2 بدأ ينخفض هو كمان، ده معناه إن المريض بدأ يتنفس بسرعة (hyperventilation) عشان يقلل ثاني أكسيد الكربون ويعوّض عن الحماض الاستقلابي، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
    en: "HCO3 is low and PaCO2 has also started to drop, meaning the patient has started breathing rapidly (hyperventilation) to reduce carbon dioxide and compensate for the metabolic acidosis, but the pH has not yet returned fully to normal.",
  },
  mixed_acidosis: {
    primaryEn: "Mixed Respiratory + Metabolic Acidosis",
    compEn: "Two primary disorders — not simple compensation",
    ar: "PaCO2 مرتفع وHCO3 منخفض في نفس الوقت. ده مش تعويض — ده اضطرابين أساسيين مع بعض (مثلاً توقف قلب أو فشل تنفسي شديد مصحوب بحماض استقلابي). محتاج تقييم سريري شامل فورًا.",
    en: "PaCO2 is high and HCO3 is low at the same time. This is not compensation — these are two primary disorders occurring together (for example, cardiac arrest or severe respiratory failure accompanied by metabolic acidosis). Requires an immediate comprehensive clinical assessment.",
  },
  unclear_acidosis: {
    primaryEn: "Acidosis — cause unclear from core values alone",
    compEn: "Needs further data (anion gap, lactate, clinical context)",
    ar: "الـpH منخفض لكن PaCO2 وHCO3 مش واضح إنهم السبب المباشر من القيم المدخلة. محتاج قيم إضافية زي فجوة الأنيونات (anion gap) أو اللاكتات لتحديد السبب بدقة.",
    en: "The pH is low, but it is not clear from the entered values that PaCO2 and HCO3 are the direct cause. Additional values such as the anion gap or lactate are needed to determine the cause precisely.",
  },
  resp_alkalosis_uncomp: {
    primaryEn: "Respiratory Alkalosis",
    compEn: "Uncompensated",
    ar: "PaCO2 منخفض وHCO3 لسه طبيعي، يعني المريض بيتنفس بسرعة زيادة عن اللازم (زي القلق أو الألم أو نقص الأكسجين)، والكلى لسه محتاجة وقت عشان تعوّض عن طريق طرح البيكربونات.",
    en: "PaCO2 is low and HCO3 is still normal, meaning the patient is breathing faster than necessary (as in anxiety, pain, or hypoxemia), and the kidneys still need time to compensate by excreting bicarbonate.",
  },
  resp_alkalosis_partial: {
    primaryEn: "Respiratory Alkalosis",
    compEn: "Partially compensated (kidneys excreting HCO3)",
    ar: "PaCO2 منخفض وHCO3 بدأ ينخفض هو كمان، ده معناه إن الكلى بدأت تعوّض عن طريق طرح البيكربونات، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
    en: "PaCO2 is low and HCO3 has also started to drop, meaning the kidneys have started compensating by excreting bicarbonate, but the pH has not yet returned fully to normal.",
  },
  metabolic_alkalosis_uncomp: {
    primaryEn: "Metabolic Alkalosis",
    compEn: "Uncompensated",
    ar: "HCO3 مرتفع وPaCO2 لسه طبيعي، يعني في فقدان أحماض أو زيادة قواعد (زي القيء الشديد أو مدرات البول أو نقص البوتاسيوم)، والرئة لسه محتاجة تبدأ تعوّض عن طريق إبطاء التنفس.",
    en: "HCO3 is high and PaCO2 is still normal, meaning there is a loss of acids or an excess of base (as in severe vomiting, diuretics, or hypokalemia), and the lungs still need to start compensating by slowing breathing.",
  },
  metabolic_alkalosis_partial: {
    primaryEn: "Metabolic Alkalosis",
    compEn: "Partially compensated (respiratory drive raising PaCO2)",
    ar: "HCO3 مرتفع وPaCO2 بدأ يرتفع هو كمان، ده معناه إن الجسم بدأ يبطّئ التنفس عشان يحتفظ بثاني أكسيد الكربون ويعوّض عن القلاء الاستقلابي، لكن الـpH لسه مش رجع للطبيعي بالكامل.",
    en: "HCO3 is high and PaCO2 has also started to rise, meaning the body has started slowing breathing to retain carbon dioxide and compensate for the metabolic alkalosis, but the pH has not yet returned fully to normal.",
  },
  mixed_alkalosis: {
    primaryEn: "Mixed Respiratory + Metabolic Alkalosis",
    compEn: "Two primary disorders — not simple compensation",
    ar: "PaCO2 منخفض وHCO3 مرتفع في نفس الوقت. ده مش تعويض — ده اضطرابين أساسيين مع بعض (مثلاً فرط تنفس مصحوب بقيء شديد). محتاج تقييم سريري شامل فورًا.",
    en: "PaCO2 is low and HCO3 is high at the same time. This is not compensation — these are two primary disorders occurring together (for example, hyperventilation accompanied by severe vomiting). Requires an immediate comprehensive clinical assessment.",
  },
  unclear_alkalosis: {
    primaryEn: "Alkalosis — cause unclear from core values alone",
    compEn: "Needs further data (clinical context)",
    ar: "الـpH مرتفع لكن PaCO2 وHCO3 مش واضح إنهم السبب المباشر من القيم المدخلة. راجع السياق السريري الكامل للمريض.",
    en: "The pH is high, but it is not clear from the entered values that PaCO2 and HCO3 are the direct cause. Review the patient's full clinical context.",
  },
  fully_comp_resp_acidosis: {
    primaryEn: "Fully Compensated Respiratory Acidosis (or compensated Metabolic Alkalosis)",
    compEn: "pH normal, PaCO2 high, HCO3 high",
    ar: "الـpH رجع طبيعي، لكن PaCO2 وHCO3 لسه مرتفعين مع بعض. ده معناه إن الجسم عوّض بالكامل — الأرجح إنه حماض تنفسي مزمن (زي مريض COPD مستقر) والكلى عوّضت بالكامل برفع البيكربونات على مدار أيام.",
    en: "The pH has returned to normal, but PaCO2 and HCO3 are both still high. This means the body has fully compensated — most likely chronic respiratory acidosis (as in a stable COPD patient) with the kidneys having fully compensated by raising bicarbonate over days.",
  },
  fully_comp_resp_alkalosis: {
    primaryEn: "Fully Compensated Respiratory Alkalosis (or compensated Metabolic Acidosis)",
    compEn: "pH normal, PaCO2 low, HCO3 low",
    ar: "الـpH رجع طبيعي، لكن PaCO2 وHCO3 لسه منخفضين مع بعض. ده معناه إن الجسم عوّض بالكامل — يحتاج مراجعة الاتجاه العام والتاريخ المرضي لتحديد هل الأصل تنفسي أو استقلابي.",
    en: "The pH has returned to normal, but PaCO2 and HCO3 are both still low. This means the body has fully compensated — the overall trend and medical history need to be reviewed to determine whether the primary disorder is respiratory or metabolic.",
  },
  ph_normal_mild: {
    primaryEn: "pH normal with a mild isolated abnormality",
    compEn: "Monitor trend",
    ar: "الـpH طبيعي لكن في قيمة واحدة بس (إما PaCO2 أو HCO3) طالعة خارج المعدل الطبيعي. راقب الاتجاه العام للقيم بمرور الوقت وربطها بحالة المريض السريرية.",
    en: "The pH is normal, but only one value (either PaCO2 or HCO3) is outside the normal range. Monitor the overall trend of the values over time and correlate them with the patient's clinical status.",
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

const CAUSES: Partial<Record<ABGCategory, { ar: string; en: string }[]>> = {
  respiratory_acidosis: [
    { ar: "تفاقم الانسداد الرئوي المزمن (COPD)", en: "COPD exacerbation" },
    { ar: "نقص التهوية (Hypoventilation)", en: "Hypoventilation" },
    { ar: "انسداد المجرى الهوائي", en: "Airway obstruction" },
    { ar: "جرعة زائدة من المهدئات أو الأفيونات", en: "Sedative or opioid overdose" },
    { ar: "أمراض عصبية عضلية (Guillain-Barré، الوهن العضلي)", en: "Neuromuscular disease (Guillain-Barré, myasthenia gravis)" },
    { ar: "إصابة الصدر (Flail chest)", en: "Chest trauma (flail chest)" },
    { ar: "عطل في إعدادات جهاز التنفس الصناعي", en: "Ventilator setting malfunction" },
  ],
  metabolic_acidosis: [
    { ar: "الحماض الكيتوني السكري (DKA)", en: "Diabetic ketoacidosis (DKA)" },
    { ar: "الفشل الكلوي", en: "Renal failure" },
    { ar: "الحماض اللبني (تسمم الدم / نقص التروية)", en: "Lactic acidosis (sepsis / hypoperfusion)" },
    { ar: "إسهال شديد", en: "Severe diarrhea" },
    { ar: "تسمم بالميثانول أو إيثيلين جلايكول", en: "Methanol or ethylene glycol poisoning" },
    { ar: "حماض الجوع (Starvation ketoacidosis)", en: "Starvation ketoacidosis" },
  ],
  respiratory_alkalosis: [
    { ar: "القلق أو نوبات الهلع", en: "Anxiety or panic attacks" },
    { ar: "الألم الحاد", en: "Acute pain" },
    { ar: "نقص الأكسجين (Hypoxemia)", en: "Hypoxemia" },
    { ar: "الحمل", en: "Pregnancy" },
    { ar: "الإنتان (المرحلة المبكرة)", en: "Sepsis (early stage)" },
    { ar: "فرط تهوية عبر جهاز التنفس الصناعي", en: "Ventilator-induced hyperventilation" },
    { ar: "الحمى", en: "Fever" },
  ],
  metabolic_alkalosis: [
    { ar: "قيء شديد أو مستمر / شفط أنفي معدي", en: "Severe or persistent vomiting / nasogastric suction" },
    { ar: "استخدام مدرات البول", en: "Diuretic use" },
    { ar: "نقص البوتاسيوم", en: "Hypokalemia" },
    { ar: "تناول زائد لمضادات الحموضة أو البيكربونات", en: "Excessive antacid or bicarbonate intake" },
    { ar: "فرط الألدوستيرون", en: "Hyperaldosteronism" },
  ],
};

const NURSING: Partial<Record<ABGCategory, { ar: string; en: string }[]>> = {
  respiratory_acidosis: [
    { ar: "قيّم جهد التنفس", en: "Assess work of breathing" },
    { ar: "راقب تشبّع الأكسجين", en: "Monitor oxygen saturation" },
    { ar: "راقب مستوى الوعي", en: "Monitor level of consciousness" },
    { ar: "تأكد من سلامة المجرى الهوائي", en: "Ensure airway patency" },
    { ar: "استعد لاحتمال دعم التهوية", en: "Prepare for possible ventilatory support" },
    { ar: "أبلغ الطبيب عند التدهور", en: "Notify the physician of any deterioration" },
  ],
  metabolic_acidosis: [
    { ar: "راقب سكر الدم والكيتونات إذا كان DKA محتمل", en: "Monitor blood glucose and ketones if DKA is suspected" },
    { ar: "راقب اتزان السوائل وكمية البول", en: "Monitor fluid balance and urine output" },
    { ar: "راقب مستوى البوتاسيوم عن قرب (خصوصاً مع الإنسولين)", en: "Monitor potassium level closely (especially with insulin)" },
    { ar: "راقب مستوى الوعي", en: "Monitor level of consciousness" },
    { ar: "استعد لسوائل وريدية / إنسولين حسب الأوامر الطبية", en: "Prepare for IV fluids / insulin per medical orders" },
    { ar: "راقب العلامات الحيوية عن قرب", en: "Monitor vital signs closely" },
  ],
  respiratory_alkalosis: [
    { ar: "قيّم القلق أو الألم وتعامل معه", en: "Assess and address anxiety or pain" },
    { ar: "راقب تشبّع الأكسجين", en: "Monitor oxygen saturation" },
    { ar: "ساعد المريض على تهدئة التنفس إذا كان فرط تهوية", en: "Help the patient slow their breathing if hyperventilating" },
    { ar: "راقب علامات نقص الكالسيوم (تنميل، تشنج)", en: "Monitor for signs of hypocalcemia (tingling, tetany)" },
    { ar: "راجع إعدادات جهاز التنفس الصناعي إن وجد", en: "Review ventilator settings if applicable" },
  ],
  metabolic_alkalosis: [
    { ar: "راقب مستوى البوتاسيوم وعوّضه حسب الأوامر", en: "Monitor potassium level and replace per orders" },
    { ar: "راقب اتزان السوائل والكهارل", en: "Monitor fluid and electrolyte balance" },
    { ar: "راقب علامات ضعف العضلات أو اضطراب النظم", en: "Monitor for signs of muscle weakness or arrhythmia" },
    { ar: "راجع الأدوية (مدرات البول، مضادات الحموضة)", en: "Review medications (diuretics, antacids)" },
    { ar: "راقب المدخول والمخرج بدقة", en: "Monitor intake and output accurately" },
  ],
};

const MEDICAL: Partial<Record<ABGCategory, { ar: string; en: string }[]>> = {
  respiratory_acidosis: [
    { ar: "قيّم سبب نقص التهوية", en: "Evaluate the cause of hypoventilation" },
    { ar: "فكّر في إعادة تحليل الغازات", en: "Consider repeating blood gas analysis" },
    { ar: "راجع صورة الصدر إن لزم", en: "Review chest X-ray if needed" },
    { ar: "قيّم الحاجة للتهوية غير الباضعة", en: "Evaluate the need for non-invasive ventilation" },
  ],
  metabolic_acidosis: [
    { ar: "احسب فجوة الأنيونات (Anion Gap)", en: "Calculate the anion gap" },
    { ar: "حدد السبب الكامن وعالجه", en: "Identify and treat the underlying cause" },
    { ar: "فكّر في فحص السموم إذا اقتضى الأمر", en: "Consider a toxicology screen if indicated" },
    { ar: "راقب اتجاه اللاكتات", en: "Monitor the lactate trend" },
  ],
  respiratory_alkalosis: [
    { ar: "حدد سبب فرط التهوية وعالجه", en: "Identify and treat the cause of hyperventilation" },
    { ar: "قيّم وجود نقص أكسجين كامن", en: "Evaluate for underlying hypoxemia" },
    { ar: "فكّر في تقييم الألم أو القلق", en: "Consider assessing pain or anxiety" },
    { ar: "راجع إعدادات جهاز التنفس الصناعي", en: "Review ventilator settings" },
  ],
  metabolic_alkalosis: [
    { ar: "حدد السبب الكامن وصححه", en: "Identify and correct the underlying cause" },
    { ar: "راجع استخدام مدرات البول أو مضادات الحموضة", en: "Review diuretic or antacid use" },
    { ar: "راقب الكهارل (بوتاسيوم، كلوريد)", en: "Monitor electrolytes (potassium, chloride)" },
    { ar: "فكّر في تعويض الكلوريد إذا لزم", en: "Consider chloride replacement if needed" },
  ],
};

function mergedList<T>(table: Partial<Record<ABGCategory, T[]>>, category: ABGCategory): T[] {
  if (category === "mixed_acidosis") return [...(table.respiratory_acidosis ?? []), ...(table.metabolic_acidosis ?? [])];
  if (category === "mixed_alkalosis") return [...(table.respiratory_alkalosis ?? []), ...(table.metabolic_alkalosis ?? [])];
  return table[category] ?? [];
}

function severityOf(pH: number): Severity {
  if (pH >= 7.35 && pH <= 7.45) return "normal";
  const dev = pH < 7.35 ? 7.35 - pH : pH - 7.45;
  if (dev < 0.05) return "mild";
  if (dev < 0.15) return "moderate";
  return "severe";
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
  const { lang } = useI18n();
  const isEn = lang === "en";
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
    <Card title={isEn ? "ABG Interpreter" : "مفسّر غازات الدم (ABG)"} icon="🫁">
      <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {isEn
          ? "An educational aid only, not a medical diagnosis. The result must be interpreted within the patient's clinical context and does not replace a physician's assessment."
          : "أداة تعليمية للمساعدة فقط وليست تشخيصاً طبياً. يجب تفسير النتيجة ضمن السياق السريري للمريض ولا تغني عن تقييم الطبيب."}
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
        {isEn ? (showOptional ? "− Hide optional values" : "+ Optional values") : (showOptional ? "− إخفاء القيم الاختيارية" : "+ قيم اختيارية")}
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
        {isEn ? "🔬 Interpret ABG" : "🔬 تفسير غازات الدم"}
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-xl p-4 ${colorClasses[result.color]}`}>
            <div className="text-lg font-black" dir="ltr">{ABG_LIBRARY[result.key].primaryEn}</div>
            <div className="mt-1 text-sm font-semibold" dir="ltr">{ABG_LIBRARY[result.key].compEn}</div>
            <div className="mt-3 border-t border-current/20 pt-3 text-sm leading-relaxed">{isEn ? ABG_LIBRARY[result.key].en : ABG_LIBRARY[result.key].ar}</div>
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
              <div className={lbl}>{isEn ? "Severity" : "الشدة"}</div>
              <div className="font-bold dark:text-white">{SEVERITY_LABEL[result.severity][lang]}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700">
              <div className={lbl}>{isEn ? "Compensation" : "التعويض"}</div>
              <div className="font-bold dark:text-white" dir="ltr">{ABG_LIBRARY[result.key].compEn}</div>
            </div>
          </div>

          {mergedList(CAUSES, result.category).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-2 font-bold dark:text-white">{isEn ? "🔍 Possible Causes" : "🔍 الأسباب المحتملة"}</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {mergedList(CAUSES, result.category).map((c) => <li key={c.ar}>{isEn ? c.en : c.ar}</li>)}
              </ul>
            </div>
          )}

          {mergedList(NURSING, result.category).length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-500/5">
              <div className="mb-2 font-bold text-emerald-700 dark:text-emerald-300">{isEn ? "💚 Nursing Guidance" : "💚 توجيهات تمريضية"}</div>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {mergedList(NURSING, result.category).map((c) => <li key={c.ar}>✔ {isEn ? c.en : c.ar}</li>)}
              </ul>
            </div>
          )}

          {mergedList(MEDICAL, result.category).length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-2 font-bold dark:text-white">{isEn ? "🩺 General Medical Guidance" : "🩺 توجيهات طبية عامة"}</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {mergedList(MEDICAL, result.category).map((c) => <li key={c.ar}>{isEn ? c.en : c.ar}</li>)}
              </ul>
            </div>
          )}

          <div className="text-xs opacity-70">
            {isEn
              ? "For educational purposes only, based on the core values — depends on the patient's full clinical context and does not replace a physician's assessment."
              : "للغرض التعليمي فقط، بناءً على القيم الأساسية — يعتمد على السياق السريري الكامل للمريض ولا يغني عن تقييم الطبيب."}
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
const commonDrugs: { ar: string; en: string }[] = [
  { ar: "نورأدرينالين", en: "Norepinephrine" },
  { ar: "أدرينالين", en: "Epinephrine" },
  { ar: "دوبامين", en: "Dopamine" },
  { ar: "دوبوتامين", en: "Dobutamine" },
  { ar: "بريسيدكس", en: "Precedex" },
  { ar: "نيتروجليسرين", en: "Nitroglycerin" },
];

function DoseRateCalculator() {
  const { lang } = useI18n();
  const isEn = lang === "en";
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
    <Card title={isEn ? "Dose ↔ Rate Calculator" : "مفسّر الجرعات (Dose ↔ Rate)"} icon="🧮">
      <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {isEn
          ? "For educational and reference purposes only, and not a substitute for a treatment decision, dose determination, or pump setup. Always follow physician orders and facility protocol."
          : "للغرض التعليمي والمرجعي فقط، وليس بديلاً عن اتخاذ قرار علاجي أو تحديد جرعة أو إعداد للمضخة. اتبع أوامر الطبيب وبروتوكول المنشأة دائمًا."}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {commonDrugs.map((d) => (
          <button
            key={d.ar}
            type="button"
            onClick={() => setDrug(d.ar)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              drug === d.ar
                ? "border-sky-400 bg-sky-500 text-white"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {isEn ? d.en : d.ar}
          </button>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("doseToRate")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "doseToRate" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          {isEn ? "Dose → Rate" : "جرعة → معدل"}
        </button>
        <button
          type="button"
          onClick={() => setMode("rateToDose")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "rateToDose" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          {isEn ? "Rate → Dose" : "معدل → جرعة"}
        </button>
      </div>

      <div className="mb-3">
        <label className={lbl}>{isEn ? "Dose unit" : "وحدة الجرعة"}</label>
        <select className={inp} value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)}>
          {doseUnits.map((u) => (
            <option key={u.key} value={u.key}>{u.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {needsWeight && (
          <div>
            <label className={lbl}>{isEn ? "Patient weight (kg)" : "وزن المريض (كجم)"}</label>
            <input className={inp} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        )}
        <div>
          <label className={lbl}>{isEn ? "Total solution volume (mL)" : "حجم المحلول الكلي (مل)"}</label>
          <input className={inp} type="number" value={volume} onChange={(e) => setVolume(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={lbl}>{isEn ? "Amount of drug in bag" : "كمية الدواء في الكيس"}</label>
          <input className={inp} type="number" value={bagAmount} onChange={(e) => setBagAmount(e.target.value)} placeholder={isEn ? "e.g. 8" : "مثال: 8"} />
        </div>
        <div>
          <label className={lbl}>{isEn ? "Unit" : "الوحدة"}</label>
          <select className={inp} value={bagUnit} onChange={(e) => setBagUnit(e.target.value as "mg" | "mcg")}>
            <option value="mg">mg</option>
            <option value="mcg">mcg</option>
          </select>
        </div>
      </div>

      {mode === "doseToRate" ? (
        <div className="mt-3">
          <label className={lbl}>{isEn ? `Required dose (${doseUnit})` : `الجرعة المطلوبة (${doseUnit})`}</label>
          <input className={inp} type="number" value={doseInput} onChange={(e) => setDoseInput(e.target.value)} />
        </div>
      ) : (
        <div className="mt-3">
          <label className={lbl}>{isEn ? "Infusion rate (mL/hour)" : "معدل التسريب (مل/ساعة)"}</label>
          <input className={inp} type="number" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
        </div>
      )}

      {concMcgPerMl > 0 && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{isEn ? `Solution concentration: ${concMcgPerMl.toFixed(2)} mcg/mL` : `تركيز المحلول: ${concMcgPerMl.toFixed(2)} mcg/mL`}</div>
      )}

      {result !== null && !Number.isNaN(result) && (
        <div className={res}>
          {mode === "doseToRate"
            ? (isEn ? `Infusion rate = ${result.toFixed(2)} mL/hour` : `معدل التسريب = ${result.toFixed(2)} مل/ساعة`)
            : (isEn ? `Dose = ${result.toFixed(3)} ${doseUnit}` : `الجرعة = ${result.toFixed(3)} ${doseUnit}`)}
        </div>
      )}
      {needsWeight && !weight && (doseInput || rateInput) && (
        <div className="mt-2 text-xs text-rose-500">{isEn ? "Enter the patient's weight to complete the calculation with this unit." : "أدخل وزن المريض لإتمام الحساب مع هذه الوحدة."}</div>
      )}
    </Card>
  );
}

const aiKB: { keys: string[]; answerAr: string; answerEn: string }[] = [
  {
    keys: ["bmi", "كتلة", "وزن", "weight"],
    answerAr: "مؤشر كتلة الجسم يحسب بقسمة الوزن (كجم) على مربع الطول (متر). القيمة الطبيعية بين 18.5 و 24.9.",
    answerEn: "Body mass index is calculated by dividing weight (kg) by height squared (meters). The normal range is between 18.5 and 24.9.",
  },
  {
    keys: ["جرعة", "دواء", "dose", "medication"],
    answerAr: "تُحسب جرعة الدواء عادةً بضرب الجرعة الموصوفة (مجم/كجم) في وزن المريض. تأكد دائماً من مراجعة الطبيب.",
    answerEn: "Medication dose is usually calculated by multiplying the prescribed dose (mg/kg) by the patient's weight. Always confirm with a physician.",
  },
  {
    keys: ["جرح", "wound", "ضماد", "dressing"],
    answerAr: "للعناية بالجرح: اغسل يديك، ارتدِ قفازات معقمة، نظّف الجرح بمحلول ملحي، ثم ضع الضمادة المناسبة.",
    answerEn: "For wound care: wash your hands, wear sterile gloves, clean the wound with saline, then apply the appropriate dressing.",
  },
  {
    keys: ["ضغط", "blood pressure", "bp"],
    answerAr: "ضغط الدم الطبيعي حوالي 120/80 ملم زئبق. ارتفاعه فوق 140/90 يعد ارتفاعاً في ضغط الدم.",
    answerEn: "Normal blood pressure is around 120/80 mmHg. Above 140/90 is considered high blood pressure.",
  },
  {
    keys: ["سكر", "diabetes", "glucose"],
    answerAr: "مستوى السكر الطبيعي صائم بين 70-100 مجم/ديسيلتر. راقب علامات نقص أو ارتفاع السكر لدى المريض.",
    answerEn: "Normal fasting blood glucose is between 70-100 mg/dL. Monitor the patient for signs of hypo- or hyperglycemia.",
  },
];

function AIAssistant() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const greeting = isEn ? "Hello! I'm your nursing AI assistant. Ask me about BMI, dosing, wound care, blood pressure, diabetes, and more." : "مرحباً! أنا مساعدك الذكي للتمريض. اسألني عن BMI، الجرعات، العناية بالجروح، ضغط الدم، السكري وغيرها.";
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.toLowerCase();
    const found = aiKB.find((k) => k.keys.some((key) => q.includes(key)));
    const fallback = isEn ? "That's a good question! For an accurate answer, check the articles in the Skills and Drugs sections, or consult a specialist." : "هذا سؤال جيد! للحصول على إجابة دقيقة، راجع المقالات في قسم المهارات والأدوية أو استشر مختصاً.";
    const answer = found ? (isEn ? found.answerEn : found.answerAr) : fallback;
    setMsgs((m) => [...m, { role: "user", text: input }, { role: "bot", text: answer }]);
    setInput("");
  };
  return (
    <Card title={isEn ? "Nursing AI Assistant 🤖" : "المساعد الذكي للتمريض 🤖"} icon="✨">
      <div className="mb-3 h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
        <div className="ml-auto max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm dark:bg-slate-700 dark:text-white">{greeting}</div>
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "mr-auto bg-sky-500 text-white" : "ml-auto bg-white dark:bg-slate-700 dark:text-white"}`}>{m.text}</div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isEn ? "Type your question..." : "اكتب سؤالك..."} className={inp} />
        <button className="rounded-lg bg-emerald-500 px-5 font-bold text-white">{isEn ? "Send" : "إرسال"}</button>
      </form>
    </Card>
  );
}

export default function ToolsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.tools") }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black dark:text-white">{t("tools.title")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("tools.sub")}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BMI /><IVDrip /><Dosage /><FluidBalance /><Pregnancy /><GCS /><PediatricDose /><DoseRateCalculator /><ABGInterpreter />
        <div className="lg:col-span-2"><AIAssistant /></div>
      </div>
    </div>
  );
}
