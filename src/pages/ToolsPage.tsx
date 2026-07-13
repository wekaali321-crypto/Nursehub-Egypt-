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
        <BMI /><IVDrip /><Dosage /><FluidBalance /><Pregnancy /><GCS /><PediatricDose />
        <div className="lg:col-span-2"><AIAssistant /></div>
      </div>
    </div>
  );
}
