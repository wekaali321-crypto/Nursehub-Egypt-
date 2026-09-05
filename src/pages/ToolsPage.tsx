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

const cardBg = {
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600",
  rose: "bg-gradient-to-br from-rose-500 to-rose-600",
} as const;

/** The big colored result card shown at the bottom of a scored calculator:
 * a large "score/max" figure over a risk-tier gradient, with the risk label
 * as a pill underneath (and an optional breakdown line, e.g. GCS's E/V/M). */
function ScoreResult({ color, title, score, max, label, extra }: { color: keyof typeof cardBg; title: string; score: number; max: number; label: string; extra?: string }) {
  return (
    <div className={`mt-4 rounded-2xl p-6 text-center text-white shadow-lg ${cardBg[color]}`}>
      <div className="text-xs font-bold uppercase tracking-wide opacity-90">{title}</div>
      <div className="mt-1 text-4xl font-black">{score}<span className="text-lg font-bold opacity-80">/{max}</span></div>
      {extra && <div className="mt-1 text-xs opacity-80">{extra}</div>}
      <div className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">{label}</div>
    </div>
  );
}

/** A group of tappable option "pills" scored by option INDEX (not point
 * value), since several clinical scales (e.g. NEWS2) legitimately assign the
 * same point value to more than one option. Selecting a pill highlights it
 * and shows its point value in a small badge, matching a typical native
 * clinical-scale app's look. */
function ScoreField({ label, options, index, onChange }: { label: string; options: { pts: number; text: string }[]; index: number; onChange: (i: number) => void }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="space-y-1.5">
        {options.map((o, i) => {
          const sel = i === index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 text-start text-sm transition ${
                sel
                  ? "border-sky-500 bg-sky-50 font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  : "border-slate-200 text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${sel ? "border-sky-500" : "border-slate-300 dark:border-slate-600"}`}>
                  {sel && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                </span>
                {o.text}
              </span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${sel ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>{o.pts}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const fields = {
    eye: isEn
      ? [{ pts: 4, text: "Spontaneous" }, { pts: 3, text: "To verbal stimulus" }, { pts: 2, text: "To pain" }, { pts: 1, text: "No response" }]
      : [{ pts: 4, text: "عفوي" }, { pts: 3, text: "استجابة للصوت" }, { pts: 2, text: "استجابة للألم" }, { pts: 1, text: "لا استجابة" }],
    verbal: isEn
      ? [{ pts: 5, text: "Oriented" }, { pts: 4, text: "Confused" }, { pts: 3, text: "Inappropriate words" }, { pts: 2, text: "Incomprehensible sounds" }, { pts: 1, text: "No response" }]
      : [{ pts: 5, text: "موجه" }, { pts: 4, text: "مرتبك" }, { pts: 3, text: "كلمات غير مناسبة" }, { pts: 2, text: "أصوات غير مفهومة" }, { pts: 1, text: "لا استجابة" }],
    motor: isEn
      ? [{ pts: 6, text: "Obeys commands" }, { pts: 5, text: "Localizes pain" }, { pts: 4, text: "Withdraws from pain" }, { pts: 3, text: "Abnormal flexion (decorticate)" }, { pts: 2, text: "Abnormal extension (decerebrate)" }, { pts: 1, text: "No response" }]
      : [{ pts: 6, text: "يستجيب للأوامر" }, { pts: 5, text: "يحدد مكان الألم" }, { pts: 4, text: "ينسحب من الألم" }, { pts: 3, text: "انثناء غير طبيعي (decorticate)" }, { pts: 2, text: "بسط غير طبيعي (decerebrate)" }, { pts: 1, text: "لا استجابة" }],
  };
  const [idx, setIdx] = useState({ eye: 0, verbal: 0, motor: 0 });
  const eyePts = fields.eye[idx.eye].pts, verbalPts = fields.verbal[idx.verbal].pts, motorPts = fields.motor[idx.motor].pts;
  const total = eyePts + verbalPts + motorPts;
  const color = total >= 13 ? "emerald" : total >= 9 ? "amber" : "rose";
  const level = isEn
    ? (total >= 13 ? "Mild traumatic brain injury" : total >= 9 ? "Moderate traumatic brain injury" : "Severe traumatic brain injury")
    : (total >= 13 ? "إصابة دماغية خفيفة" : total >= 9 ? "إصابة دماغية متوسطة" : "إصابة دماغية شديدة");
  return (
    <Card title={isEn ? "Glasgow Coma Scale (GCS)" : "مقياس غلاسكو للوعي (GCS)"} icon="🧠">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Evaluates the level of consciousness in patients with brain injury. Assesses three parameters: eye opening, verbal response, and motor response." : "يقيّم مستوى الوعي لدى مرضى إصابات الدماغ، من خلال 3 معايير: فتح العين، الاستجابة اللفظية، والاستجابة الحركية."}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreField label={isEn ? "Eye Opening" : "فتح العين"} options={fields.eye} index={idx.eye} onChange={(i) => setIdx((s) => ({ ...s, eye: i }))} />
        <ScoreField label={isEn ? "Verbal Response" : "الاستجابة اللفظية"} options={fields.verbal} index={idx.verbal} onChange={(i) => setIdx((s) => ({ ...s, verbal: i }))} />
        <ScoreField label={isEn ? "Motor Response" : "الاستجابة الحركية"} options={fields.motor} index={idx.motor} onChange={(i) => setIdx((s) => ({ ...s, motor: i }))} />
      </div>
      <ScoreResult
        color={color}
        title={isEn ? "Total Score" : "المجموع الكلي"}
        score={total}
        max={15}
        label={level}
        extra={`E: ${eyePts} | V: ${verbalPts} | M: ${motorPts}`}
      />
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

function Norton() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const fields = {
    physical: isEn ? [{ pts: 4, text: "Good" }, { pts: 3, text: "Fair" }, { pts: 2, text: "Poor" }, { pts: 1, text: "Very poor" }] : [{ pts: 4, text: "جيدة" }, { pts: 3, text: "متوسطة" }, { pts: 2, text: "ضعيفة" }, { pts: 1, text: "سيئة جدًا" }],
    mental: isEn ? [{ pts: 4, text: "Alert" }, { pts: 3, text: "Apathetic" }, { pts: 2, text: "Confused" }, { pts: 1, text: "Stuporous/Comatose" }] : [{ pts: 4, text: "واعٍ" }, { pts: 3, text: "لا مبالٍ" }, { pts: 2, text: "مشوش" }, { pts: 1, text: "غائب عن الوعي" }],
    activity: isEn ? [{ pts: 4, text: "Ambulatory" }, { pts: 3, text: "Walks with help" }, { pts: 2, text: "Chairbound" }, { pts: 1, text: "Bedridden" }] : [{ pts: 4, text: "يمشي بحرية" }, { pts: 3, text: "يمشي بمساعدة" }, { pts: 2, text: "ملازم للكرسي" }, { pts: 1, text: "ملازم للسرير" }],
    mobility: isEn ? [{ pts: 4, text: "Full" }, { pts: 3, text: "Slightly limited" }, { pts: 2, text: "Very limited" }, { pts: 1, text: "Immobile" }] : [{ pts: 4, text: "كاملة" }, { pts: 3, text: "محدودة قليلاً" }, { pts: 2, text: "محدودة جدًا" }, { pts: 1, text: "عديمة الحركة" }],
    incontinence: isEn ? [{ pts: 4, text: "None" }, { pts: 3, text: "Occasional" }, { pts: 2, text: "Urinary or fecal" }, { pts: 1, text: "Urinary and fecal" }] : [{ pts: 4, text: "لا يوجد" }, { pts: 3, text: "عرضي" }, { pts: 2, text: "بولي أو برازي" }, { pts: 1, text: "بولي وبرازي" }],
  };
  const [idx, setIdx] = useState({ physical: 0, mental: 0, activity: 0, mobility: 0, incontinence: 0 });
  const total = (Object.keys(fields) as (keyof typeof fields)[]).reduce((sum, k) => sum + fields[k][idx[k]].pts, 0);
  const color = total >= 18 ? "emerald" : total >= 15 ? "amber" : total >= 10 ? "orange" : "rose";
  const label = isEn
    ? (total >= 18 ? "Minimal or no risk of PU" : total >= 15 ? "Low risk of PU" : total >= 10 ? "Medium risk of PU" : "High risk of PU")
    : (total >= 18 ? "خطر ضئيل أو منعدم للإصابة بتقرحات الفراش" : total >= 15 ? "خطر منخفض للإصابة بتقرحات الفراش" : total >= 10 ? "خطر متوسط للإصابة بتقرحات الفراش" : "خطر مرتفع للإصابة بتقرحات الفراش");
  return (
    <Card title={isEn ? "Norton Scale" : "مقياس نورتون (Norton Scale)"} icon="🛏️">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Evaluates the risk of developing pressure ulcers (PU) using 5 parameters." : "يقيّم خطر الإصابة بتقرحات الفراش باستخدام 5 معايير."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreField label={isEn ? "General Physical Condition" : "الحالة الجسدية العامة"} options={fields.physical} index={idx.physical} onChange={(i) => setIdx((s) => ({ ...s, physical: i }))} />
        <ScoreField label={isEn ? "Mental State" : "الحالة الذهنية"} options={fields.mental} index={idx.mental} onChange={(i) => setIdx((s) => ({ ...s, mental: i }))} />
        <ScoreField label={isEn ? "Activity" : "النشاط"} options={fields.activity} index={idx.activity} onChange={(i) => setIdx((s) => ({ ...s, activity: i }))} />
        <ScoreField label={isEn ? "Mobility" : "الحركة"} options={fields.mobility} index={idx.mobility} onChange={(i) => setIdx((s) => ({ ...s, mobility: i }))} />
        <ScoreField label={isEn ? "Incontinence" : "سلس البول/البراز"} options={fields.incontinence} index={idx.incontinence} onChange={(i) => setIdx((s) => ({ ...s, incontinence: i }))} />
      </div>
      <ScoreResult color={color} title={isEn ? "Total Score" : "المجموع الكلي"} score={total} max={20} label={label} />
    </Card>
  );
}

function Braden() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const fields4 = {
    sensory: isEn ? [{ pts: 4, text: "No impairment" }, { pts: 3, text: "Slightly limited" }, { pts: 2, text: "Very limited" }, { pts: 1, text: "Completely limited" }] : [{ pts: 4, text: "لا يوجد ضعف" }, { pts: 3, text: "محدود قليلاً" }, { pts: 2, text: "محدود جدًا" }, { pts: 1, text: "محدود تمامًا" }],
    moisture: isEn ? [{ pts: 4, text: "Rarely moist" }, { pts: 3, text: "Occasionally moist" }, { pts: 2, text: "Often moist" }, { pts: 1, text: "Constantly moist" }] : [{ pts: 4, text: "رطوبة نادرة" }, { pts: 3, text: "رطوبة أحيانًا" }, { pts: 2, text: "رطوبة غالبًا" }, { pts: 1, text: "رطوبة دائمة" }],
    activity: isEn ? [{ pts: 4, text: "Walks frequently" }, { pts: 3, text: "Walks occasionally" }, { pts: 2, text: "Chairfast" }, { pts: 1, text: "Bedfast" }] : [{ pts: 4, text: "يمشي كثيرًا" }, { pts: 3, text: "يمشي أحيانًا" }, { pts: 2, text: "ملازم للكرسي" }, { pts: 1, text: "ملازم للسرير" }],
    mobility: isEn ? [{ pts: 4, text: "No limitation" }, { pts: 3, text: "Slightly limited" }, { pts: 2, text: "Very limited" }, { pts: 1, text: "Completely immobile" }] : [{ pts: 4, text: "بلا قيود" }, { pts: 3, text: "محدودة قليلاً" }, { pts: 2, text: "محدودة جدًا" }, { pts: 1, text: "عديمة الحركة تمامًا" }],
    nutrition: isEn ? [{ pts: 4, text: "Excellent" }, { pts: 3, text: "Adequate" }, { pts: 2, text: "Probably inadequate" }, { pts: 1, text: "Very poor" }] : [{ pts: 4, text: "ممتازة" }, { pts: 3, text: "كافية" }, { pts: 2, text: "غير كافية على الأرجح" }, { pts: 1, text: "سيئة جدًا" }],
  };
  const friction = isEn ? [{ pts: 3, text: "No apparent problem" }, { pts: 2, text: "Potential problem" }, { pts: 1, text: "Problem" }] : [{ pts: 3, text: "لا توجد مشكلة ظاهرة" }, { pts: 2, text: "مشكلة محتملة" }, { pts: 1, text: "مشكلة" }];
  const [idx, setIdx] = useState({ sensory: 0, moisture: 0, activity: 0, mobility: 0, nutrition: 0, friction: 0 });
  const total = (Object.keys(fields4) as (keyof typeof fields4)[]).reduce((sum, k) => sum + fields4[k][idx[k]].pts, 0) + friction[idx.friction].pts;
  const color = total >= 19 ? "emerald" : total >= 15 ? "amber" : total >= 13 ? "orange" : "rose";
  const label = isEn
    ? (total >= 19 ? "No risk of PU" : total >= 15 ? "Mild risk of PU" : total >= 13 ? "Moderate risk of PU" : total >= 10 ? "High risk of PU" : "Very high risk of PU")
    : (total >= 19 ? "لا يوجد خطر للإصابة بتقرحات الفراش" : total >= 15 ? "خطر خفيف للإصابة بتقرحات الفراش" : total >= 13 ? "خطر متوسط للإصابة بتقرحات الفراش" : total >= 10 ? "خطر مرتفع للإصابة بتقرحات الفراش" : "خطر مرتفع جدًا للإصابة بتقرحات الفراش");
  return (
    <Card title={isEn ? "Braden Scale" : "مقياس برادن (Braden Scale)"} icon="🩹">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Evaluates pressure ulcer risk considering 6 subscales. More specific than Norton and widely used in hospitals." : "يقيّم خطر تقرحات الفراش بناءً على 6 معايير فرعية. أكثر دقة من مقياس نورتون وشائع الاستخدام في المستشفيات."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreField label={isEn ? "Sensory Perception" : "الإدراك الحسي"} options={fields4.sensory} index={idx.sensory} onChange={(i) => setIdx((s) => ({ ...s, sensory: i }))} />
        <ScoreField label={isEn ? "Moisture Exposure" : "التعرض للرطوبة"} options={fields4.moisture} index={idx.moisture} onChange={(i) => setIdx((s) => ({ ...s, moisture: i }))} />
        <ScoreField label={isEn ? "Activity" : "النشاط"} options={fields4.activity} index={idx.activity} onChange={(i) => setIdx((s) => ({ ...s, activity: i }))} />
        <ScoreField label={isEn ? "Mobility" : "الحركة"} options={fields4.mobility} index={idx.mobility} onChange={(i) => setIdx((s) => ({ ...s, mobility: i }))} />
        <ScoreField label={isEn ? "Nutrition" : "التغذية"} options={fields4.nutrition} index={idx.nutrition} onChange={(i) => setIdx((s) => ({ ...s, nutrition: i }))} />
        <ScoreField label={isEn ? "Friction and Shear" : "الاحتكاك والانزلاق"} options={friction} index={idx.friction} onChange={(i) => setIdx((s) => ({ ...s, friction: i }))} />
      </div>
      <ScoreResult color={color} title={isEn ? "Total Score" : "المجموع الكلي"} score={total} max={23} label={label} />
    </Card>
  );
}

function Barthel() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const fields = {
    feeding: isEn ? [{ pts: 10, text: "Independent" }, { pts: 5, text: "Needs help" }, { pts: 0, text: "Unable" }] : [{ pts: 10, text: "مستقل" }, { pts: 5, text: "يحتاج مساعدة" }, { pts: 0, text: "غير قادر" }],
    bathing: isEn ? [{ pts: 5, text: "Independent" }, { pts: 0, text: "Dependent" }] : [{ pts: 5, text: "مستقل" }, { pts: 0, text: "معتمد على الغير" }],
    grooming: isEn ? [{ pts: 5, text: "Independent" }, { pts: 0, text: "Needs help" }] : [{ pts: 5, text: "مستقل" }, { pts: 0, text: "يحتاج مساعدة" }],
    dressing: isEn ? [{ pts: 10, text: "Independent" }, { pts: 5, text: "Needs help" }, { pts: 0, text: "Dependent" }] : [{ pts: 10, text: "مستقل" }, { pts: 5, text: "يحتاج مساعدة" }, { pts: 0, text: "معتمد على الغير" }],
    bowels: isEn ? [{ pts: 10, text: "Continent" }, { pts: 5, text: "Occasional accident" }, { pts: 0, text: "Incontinent" }] : [{ pts: 10, text: "متحكم" }, { pts: 5, text: "حادث عرضي" }, { pts: 0, text: "سلس" }],
    bladder: isEn ? [{ pts: 10, text: "Continent" }, { pts: 5, text: "Occasional accident" }, { pts: 0, text: "Incontinent" }] : [{ pts: 10, text: "متحكم" }, { pts: 5, text: "حادث عرضي" }, { pts: 0, text: "سلس" }],
    toilet: isEn ? [{ pts: 10, text: "Independent" }, { pts: 5, text: "Needs some help" }, { pts: 0, text: "Dependent" }] : [{ pts: 10, text: "مستقل" }, { pts: 5, text: "يحتاج بعض المساعدة" }, { pts: 0, text: "معتمد على الغير" }],
    transfers: isEn ? [{ pts: 15, text: "Independent" }, { pts: 10, text: "Minor help" }, { pts: 5, text: "Major help" }, { pts: 0, text: "Unable" }] : [{ pts: 15, text: "مستقل" }, { pts: 10, text: "مساعدة بسيطة" }, { pts: 5, text: "مساعدة كبيرة" }, { pts: 0, text: "غير قادر" }],
    mobility: isEn ? [{ pts: 15, text: "Independent" }, { pts: 10, text: "Walks with help" }, { pts: 5, text: "Independent in wheelchair" }, { pts: 0, text: "Immobile" }] : [{ pts: 15, text: "مستقل" }, { pts: 10, text: "يمشي بمساعدة" }, { pts: 5, text: "مستقل على كرسي متحرك" }, { pts: 0, text: "عديم الحركة" }],
    stairs: isEn ? [{ pts: 10, text: "Independent" }, { pts: 5, text: "Needs help" }, { pts: 0, text: "Unable" }] : [{ pts: 10, text: "مستقل" }, { pts: 5, text: "يحتاج مساعدة" }, { pts: 0, text: "غير قادر" }],
  };
  const [idx, setIdx] = useState({ feeding: 0, bathing: 0, grooming: 0, dressing: 0, bowels: 0, bladder: 0, toilet: 0, transfers: 0, mobility: 0, stairs: 0 });
  const total = (Object.keys(fields) as (keyof typeof fields)[]).reduce((sum, k) => sum + fields[k][idx[k]].pts, 0);
  const color = total === 100 ? "emerald" : total >= 91 ? "emerald" : total >= 61 ? "amber" : total >= 21 ? "orange" : "rose";
  const label = isEn
    ? (total === 100 ? "Total independence" : total >= 91 ? "Slight dependency" : total >= 61 ? "Moderate dependency" : total >= 21 ? "Severe dependency" : "Total dependency")
    : (total === 100 ? "استقلالية كاملة" : total >= 91 ? "اعتماد بسيط" : total >= 61 ? "اعتماد متوسط" : total >= 21 ? "اعتماد شديد" : "اعتماد كامل");
  const labels: Record<keyof typeof fields, string> = {
    feeding: isEn ? "Feeding" : "الإطعام",
    bathing: isEn ? "Bathing" : "الاستحمام",
    grooming: isEn ? "Grooming" : "العناية الشخصية",
    dressing: isEn ? "Dressing" : "ارتداء الملابس",
    bowels: isEn ? "Bowel control" : "التحكم في الإخراج",
    bladder: isEn ? "Bladder control" : "التحكم في التبول",
    toilet: isEn ? "Toilet use" : "استخدام الحمام",
    transfers: isEn ? "Transfers (bed ↔ chair)" : "الانتقال (سرير ↔ كرسي)",
    mobility: isEn ? "Mobility" : "التنقل",
    stairs: isEn ? "Stairs" : "صعود السلالم",
  };
  return (
    <Card title={isEn ? "Barthel Index" : "مؤشر بارثيل (Barthel Index)"} icon="🚶">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Measures functional independence in 10 activities of daily living (0-100)." : "يقيس مدى استقلالية المريض في 10 أنشطة يومية أساسية (0-100)."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(fields) as (keyof typeof fields)[]).map((k) => (
          <ScoreField key={k} label={labels[k]} options={fields[k]} index={idx[k]} onChange={(i) => setIdx((s) => ({ ...s, [k]: i }))} />
        ))}
      </div>
      <ScoreResult color={color} title={isEn ? "Total Score" : "المجموع الكلي"} score={total} max={100} label={label} />
    </Card>
  );
}

function VAS() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const [pain, setPain] = useState(0);
  const color = pain === 0 ? "emerald" : pain <= 3 ? "amber" : pain <= 6 ? "orange" : "rose";
  const label = isEn
    ? (pain === 0 ? "No pain" : pain <= 3 ? "Mild pain" : pain <= 6 ? "Moderate pain" : "Severe pain")
    : (pain === 0 ? "لا يوجد ألم" : pain <= 3 ? "ألم خفيف" : pain <= 6 ? "ألم متوسط" : "ألم شديد");
  return (
    <Card title={isEn ? "Visual Analog Scale (VAS)" : "المقياس البصري التناظري للألم (VAS)"} icon="😣">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Rate the patient's pain from 0 (no pain) to 10 (worst possible pain)." : "قيّم شدة ألم المريض من 0 (لا يوجد ألم) إلى 10 (أسوأ ألم ممكن)."}</p>
      <input type="range" min={0} max={10} step={1} value={pain} onChange={(e) => setPain(+e.target.value)} className="w-full accent-sky-500" />
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">{Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}</div>
      <ScoreResult color={color} title={isEn ? "Pain Level" : "مستوى الألم"} score={pain} max={10} label={label} />
    </Card>
  );
}

function News2() {
  const { lang } = useI18n();
  const isEn = lang === "en";
  const fields = {
    rr: isEn
      ? [{ pts: 3, text: "≤8" }, { pts: 1, text: "9-11" }, { pts: 0, text: "12-20" }, { pts: 2, text: "21-24" }, { pts: 3, text: "≥25" }]
      : [{ pts: 3, text: "≤8" }, { pts: 1, text: "9-11" }, { pts: 0, text: "12-20" }, { pts: 2, text: "21-24" }, { pts: 3, text: "≥25" }],
    spo2: [{ pts: 3, text: "≤91" }, { pts: 2, text: "92-93" }, { pts: 1, text: "94-95" }, { pts: 0, text: "≥96" }],
    o2: isEn ? [{ pts: 0, text: "Room air" }, { pts: 2, text: "With supplemental O₂" }] : [{ pts: 0, text: "هواء الغرفة" }, { pts: 2, text: "بأكسجين إضافي" }],
    temp: [{ pts: 3, text: "≤35.0" }, { pts: 1, text: "35.1-36.0" }, { pts: 0, text: "36.1-38.0" }, { pts: 1, text: "38.1-39.0" }, { pts: 2, text: "≥39.1" }],
    sbp: [{ pts: 3, text: "≤90" }, { pts: 2, text: "91-100" }, { pts: 1, text: "101-110" }, { pts: 0, text: "111-219" }, { pts: 3, text: "≥220" }],
    hr: [{ pts: 3, text: "≤40" }, { pts: 1, text: "41-50" }, { pts: 0, text: "51-90" }, { pts: 1, text: "91-110" }, { pts: 2, text: "111-130" }, { pts: 3, text: "≥131" }],
    avpu: isEn
      ? [{ pts: 0, text: "Alert" }, { pts: 3, text: "New confusion" }, { pts: 3, text: "Responds to voice" }, { pts: 3, text: "Responds to pain" }, { pts: 3, text: "Unresponsive" }]
      : [{ pts: 0, text: "واعٍ" }, { pts: 3, text: "تشوش جديد" }, { pts: 3, text: "يستجيب للصوت" }, { pts: 3, text: "يستجيب للألم" }, { pts: 3, text: "لا يستجيب" }],
  };
  const [idx, setIdx] = useState({ rr: 2, spo2: 3, o2: 0, temp: 2, sbp: 3, hr: 2, avpu: 0 });
  const total = (Object.keys(fields) as (keyof typeof fields)[]).reduce((sum, k) => sum + fields[k][idx[k]].pts, 0);
  const color = total === 0 ? "emerald" : total <= 4 ? "amber" : total <= 6 ? "orange" : "rose";
  const label = isEn
    ? (total === 0 ? "LOW risk - Routine monitoring" : total <= 4 ? "LOW risk - Nursing assessment" : total <= 6 ? "MEDIUM risk - Urgent response" : "HIGH risk - EMERGENCY response")
    : (total === 0 ? "خطر منخفض - مراقبة روتينية" : total <= 4 ? "خطر منخفض - تقييم تمريضي" : total <= 6 ? "خطر متوسط - استجابة عاجلة" : "خطر مرتفع - استجابة طوارئ");
  return (
    <Card title={isEn ? "NEWS2 (National Early Warning Score)" : "نيوز 2 (نظام الإنذار المبكر الوطني)"} icon="🚨">
      <p className="mb-3 text-xs text-slate-400">{isEn ? "Early warning system that evaluates the risk of clinical deterioration. Considers vital signs and level of consciousness to activate medical response." : "نظام إنذار مبكر يقيّم خطر تدهور حالة المريض إكلينيكيًا، بناءً على العلامات الحيوية ومستوى الوعي، لتفعيل الاستجابة الطبية المناسبة."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreField label={isEn ? "Respiratory Rate (breaths/min)" : "معدل التنفس (نفس/دقيقة)"} options={fields.rr} index={idx.rr} onChange={(i) => setIdx((s) => ({ ...s, rr: i }))} />
        <ScoreField label={isEn ? "O₂ Saturation (%)" : "تشبع الأكسجين (%)"} options={fields.spo2} index={idx.spo2} onChange={(i) => setIdx((s) => ({ ...s, spo2: i }))} />
        <ScoreField label={isEn ? "Supplemental Oxygen" : "الأكسجين الإضافي"} options={fields.o2} index={idx.o2} onChange={(i) => setIdx((s) => ({ ...s, o2: i }))} />
        <ScoreField label={isEn ? "Temperature (°C)" : "درجة الحرارة (°م)"} options={fields.temp} index={idx.temp} onChange={(i) => setIdx((s) => ({ ...s, temp: i }))} />
        <ScoreField label={isEn ? "Systolic Blood Pressure (mmHg)" : "ضغط الدم الانقباضي (مم زئبق)"} options={fields.sbp} index={idx.sbp} onChange={(i) => setIdx((s) => ({ ...s, sbp: i }))} />
        <ScoreField label={isEn ? "Heart Rate (bpm)" : "معدل النبض (نبضة/دقيقة)"} options={fields.hr} index={idx.hr} onChange={(i) => setIdx((s) => ({ ...s, hr: i }))} />
        <ScoreField label={isEn ? "Level of Consciousness (ACVPU)" : "مستوى الوعي (ACVPU)"} options={fields.avpu} index={idx.avpu} onChange={(i) => setIdx((s) => ({ ...s, avpu: i }))} />
      </div>
      <ScoreResult color={color} title="NEWS2 Score" score={total} max={20} label={label} />
      <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
        <div className="font-bold text-slate-500 dark:text-slate-400">{isEn ? "Suggested Clinical Response" : "الاستجابة السريرية المقترحة"}</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{isEn ? "0: Routine monitoring" : "0: مراقبة روتينية"}</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{isEn ? "1-4: Nursing assessment" : "1-4: تقييم تمريضي"}</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />{isEn ? "5-6: Urgent response" : "5-6: استجابة عاجلة"}</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{isEn ? "≥7: EMERGENCY response" : "≥7: استجابة طوارئ"}</div>
      </div>
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
        <Norton /><Braden /><Barthel /><VAS /><News2 />
        <div className="lg:col-span-2"><AIAssistant /></div>
      </div>
    </div>
  );
}
