import { useState } from "react";

/* ============================================================================
   مكتبة ECG: تعلّم قراءة رسم القلب بكل احترافية من الصفر حتى الاحتراف
   ----------------------------------------------------------------------------
   المصادر:
   1) "جهاز رسم القلب الـ ECG" — بحث تكميلي، جامعة السودان للعلوم والتكنولوجيا،
      كلية العلوم، قسم الفيزياء (تاريخ الجهاز، فسيولوجيا القلب، مكونات الجهاز،
      كيفية عمل الرسم، الليدز، حساب المعدل، التداخلات وأسبابها).
   2) "Simple ECG" — تفريغ المواد الطبية، طب الأزهر (مبادئ الـECG، نظام الـ12
      Lead، ورقة الرسم، الطريقة المنهجية العشرية لقراءة أي ECG، الحالات غير
      الطبيعية، وخوارزمية التشخيص).
   الدفعة الثانية أضافت: تضخم الحجرات ومحور القلب، حصار الحزم، نقص التروية
   والاحتشاء، حصار القلب، اضطرابات النظم، الطريقة المنهجية العشرية لقراءة أي
   ECG، خوارزمية التشخيص العملية، وأسباب أخرى تظهر في الـECG + التداخلات
   وأسبابها (من الأطروحة).
   ============================================================================ */

/* ---------------------------------- SVG أساسية ---------------------------------- */

function HeartConductionSVG() {
  return (
    <svg viewBox="0 0 420 320" className="mx-auto w-full max-w-md">
      <path
        d="M 210 40 C 120 -20 20 40 20 130 C 20 210 100 260 210 300 C 320 260 400 210 400 130 C 400 40 300 -20 210 40 Z"
        fill="#fecaca"
        stroke="#b91c1c"
        strokeWidth="3"
      />
      {/* septum */}
      <line x1="210" y1="60" x2="210" y2="280" stroke="#b91c1c" strokeWidth="2" strokeDasharray="4 4" />
      {/* SA node */}
      <circle cx="150" cy="85" r="10" fill="#f59e0b" />
      <text x="150" y="70" textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">SA</text>
      {/* AV node */}
      <circle cx="210" cy="150" r="9" fill="#0ea5e9" />
      <text x="210" y="140" textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">AV</text>
      {/* His bundle + branches */}
      <line x1="210" y1="150" x2="210" y2="200" stroke="#0ea5e9" strokeWidth="4" />
      <path d="M210 200 C 190 220 150 240 120 255" stroke="#0ea5e9" strokeWidth="3" fill="none" />
      <path d="M210 200 C 230 220 270 240 300 255" stroke="#0ea5e9" strokeWidth="3" fill="none" />
      {/* purkinje fibers */}
      <path d="M120 255 L100 270 M120 255 L130 275 M120 255 L150 270" stroke="#0ea5e9" strokeWidth="2" fill="none" />
      <path d="M300 255 L320 270 M300 255 L290 275 M300 255 L270 270" stroke="#0ea5e9" strokeWidth="2" fill="none" />
      <text x="90" y="105" className="fill-slate-600 text-[10px] font-bold">RA</text>
      <text x="330" y="105" className="fill-slate-600 text-[10px] font-bold">LA</text>
      <text x="90" y="230" className="fill-slate-600 text-[10px] font-bold">RV</text>
      <text x="330" y="230" className="fill-slate-600 text-[10px] font-bold">LV</text>
    </svg>
  );
}

function PQRSTWaveSVG({ highlight }: { highlight?: "p" | "qrs" | "st" | "t" | "pr" | "qt" }) {
  const hl = (part: string) => (highlight === part ? "#dc2626" : "#0f172a");
  return (
    <svg viewBox="0 0 420 160" className="mx-auto w-full max-w-lg">
      <rect x="0" y="0" width="420" height="160" fill="#fff1f2" opacity="0.4" />
      {Array.from({ length: 21 }).map((_, i) => (
        <line key={"v" + i} x1={i * 20} y1={0} x2={i * 20} y2={160} stroke="#fecdd3" strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={i * 20} x2={420} y2={i * 20} stroke="#fecdd3" strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
      ))}
      <path
        d="M20,100 L60,100 Q70,85 80,100 L95,100 L100,140 L112,40 L124,110 L140,100 L160,100 Q185,75 210,100 L260,100"
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text x="70" y="80" textAnchor="middle" fontWeight="bold" fill={hl("p")}>P</text>
      <text x="112" y="35" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>R</text>
      <text x="100" y="150" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>Q</text>
      <text x="124" y="128" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>S</text>
      <text x="195" y="80" textAnchor="middle" fontWeight="bold" fill={hl("t")}>T</text>
      {/* brackets */}
      <line x1="60" y1="112" x2="100" y2="112" stroke={hl("pr")} strokeWidth="2" />
      <text x="80" y="127" textAnchor="middle" fontSize="10" fill={hl("pr")}>PR interval</text>
      <line x1="112" y1="150" x2="160" y2="150" stroke={hl("st")} strokeWidth="2" />
      <text x="136" y="163" textAnchor="middle" fontSize="10" fill={hl("st")}>ST segment</text>
      <line x1="100" y1="20" x2="210" y2="20" stroke={hl("qt")} strokeWidth="2" />
      <text x="155" y="14" textAnchor="middle" fontSize="10" fill={hl("qt")}>QT interval</text>
    </svg>
  );
}

function LeadDirectionSVG() {
  return (
    <svg viewBox="0 0 380 200" className="mx-auto w-full max-w-md">
      <circle cx="130" cy="100" r="14" fill="#0ea5e9" />
      <text x="130" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">+</text>
      <line x1="150" y1="100" x2="260" y2="100" stroke="#0ea5e9" strokeWidth="3" markerEnd="url(#arrow)" />
      <path d="M170,60 L150,80 L170,80 L180,50 L190,90 L200,60 L215,80 L260,80" fill="none" stroke="#16a34a" strokeWidth="3" />
      <text x="215" y="45" textAnchor="middle" fill="#16a34a" fontWeight="bold" fontSize="12">positive wave</text>
      <text x="130" y="130" textAnchor="middle" fontSize="11" fill="#334155">اتجاه التيار = اتجاه القطب</text>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
        </marker>
      </defs>
    </svg>
  );
}

function GraphPaperSVG() {
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-56">
      {Array.from({ length: 23 }).map((_, i) => (
        <line key={"v" + i} x1={i * 10} y1={0} x2={i * 10} y2={220} stroke="#fda4af" strokeWidth={i % 5 === 0 ? 1.4 : 0.4} />
      ))}
      {Array.from({ length: 23 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={i * 10} x2={220} y2={i * 10} stroke="#fda4af" strokeWidth={i % 5 === 0 ? 1.4 : 0.4} />
      ))}
      <rect x="0" y="0" width="10" height="10" fill="#fb7185" opacity="0.5" />
      <rect x="0" y="0" width="50" height="50" fill="none" stroke="#be123c" strokeWidth="2" />
    </svg>
  );
}

function ChestLeadsSVG() {
  return (
    <svg viewBox="0 0 260 220" className="mx-auto w-full max-w-sm">
      <path d="M130 10 C 60 10 40 60 45 110 C 50 170 90 205 130 215 C 170 205 210 170 215 110 C 220 60 200 10 130 10 Z" fill="#fde8e8" stroke="#94a3b8" strokeWidth="2" />
      {[
        { x: 105, y: 70, l: "V1" },
        { x: 155, y: 70, l: "V2" },
        { x: 130, y: 90, l: "V3" },
        { x: 130, y: 115, l: "V4" },
        { x: 165, y: 120, l: "V5" },
        { x: 195, y: 125, l: "V6" },
      ].map((p) => (
        <g key={p.l}>
          <circle cx={p.x} cy={p.y} r="6" fill="#dc2626" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">{p.l}</text>
        </g>
      ))}
      <circle cx="20" cy="20" r="7" fill="#f59e0b" />
      <text x="20" y="8" textAnchor="middle" fontSize="10" fontWeight="bold">RA</text>
      <circle cx="240" cy="20" r="7" fill="#f59e0b" />
      <text x="240" y="8" textAnchor="middle" fontSize="10" fontWeight="bold">LA</text>
      <circle cx="80" cy="210" r="7" fill="#16a34a" />
      <text x="80" y="222" textAnchor="middle" fontSize="10" fontWeight="bold">RL</text>
      <circle cx="180" cy="210" r="7" fill="#16a34a" />
      <text x="180" y="222" textAnchor="middle" fontSize="10" fontWeight="bold">LL</text>
    </svg>
  );
}

function AxisWheelSVG() {
  const spokes = [
    { deg: -150, label: "aVR" },
    { deg: -30, label: "aVL" },
    { deg: 0, label: "I" },
    { deg: 60, label: "II" },
    { deg: 90, label: "aVF" },
    { deg: 120, label: "III" },
  ];
  const cx = 120, cy = 120, r = 95;
  return (
    <svg viewBox="0 0 240 240" className="mx-auto w-full max-w-xs">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      {spokes.map((s) => {
        const rad = (s.deg * Math.PI) / 180;
        const x2 = cx + r * Math.cos(rad);
        const y2 = cy + r * Math.sin(rad);
        const lx = cx + (r + 16) * Math.cos(rad);
        const ly = cy + (r + 16) * Math.sin(rad);
        return (
          <g key={s.label}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.2" />
            <text x={lx} y={ly} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">{s.label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="4" fill="#dc2626" />
      <path d={`M ${cx} ${cy} L ${cx + 80 * Math.cos((-15 * Math.PI) / 180)} ${cy + 80 * Math.sin((-15 * Math.PI) / 180)}`} stroke="#dc2626" strokeWidth="3" markerEnd="url(#axisArrow)" />
      <defs>
        <marker id="axisArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#dc2626" />
        </marker>
      </defs>
    </svg>
  );
}

function BundleBranchCompareSVG() {
  const beat = (kind: "normal" | "rbbb" | "lbbb") => {
    if (kind === "rbbb") return "M0,30 L6,30 L10,6 L14,40 L18,18 L22,30 L34,30";
    if (kind === "lbbb") return "M0,30 L4,45 L8,35 L12,50 L18,20 L26,30 L34,30";
    return "M0,30 L6,30 L10,6 L14,40 L18,30 L34,30";
  };
  return (
    <svg viewBox="0 0 380 120" className="mx-auto w-full max-w-md">
      {["V1", "V6"].map((lead, li) =>
        (["normal", "rbbb", "lbbb"] as const).map((kind, ki) => (
          <g key={lead + kind} transform={`translate(${ki * 120 + 20},${li * 55 + 20})`}>
            <path d={beat(lead === "V1" ? kind : kind === "rbbb" ? "lbbb" : kind === "lbbb" ? "rbbb" : "normal")} fill="none" stroke="#0f172a" strokeWidth="2.5" />
            {li === 0 && (
              <text x="17" y="-8" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                {kind === "normal" ? "Normal" : kind === "rbbb" ? "RBBB" : "LBBB"}
              </text>
            )}
            {ki === 0 && (
              <text x="-12" y="30" fontSize="10" fontWeight="bold" fill="#64748b">{lead}</text>
            )}
          </g>
        ))
      )}
    </svg>
  );
}

function STCompareSVG() {
  const shape = (kind: "normal" | "elevated" | "depressed") => {
    const stY = kind === "elevated" ? 22 : kind === "depressed" ? 38 : 30;
    return `M0,30 L6,30 L10,10 L14,45 L18,${stY} L26,${stY} L34,18 L44,30`;
  };
  return (
    <svg viewBox="0 0 380 70" className="mx-auto w-full max-w-md">
      {(["normal", "elevated", "depressed"] as const).map((k, i) => (
        <g key={k} transform={`translate(${i * 120 + 20},18)`}>
          <line x1="-6" y1="30" x2="120" y2="30" stroke="#fecdd3" strokeWidth="1" />
          <path d={shape(k)} fill="none" stroke={k === "elevated" ? "#dc2626" : k === "depressed" ? "#0ea5e9" : "#0f172a"} strokeWidth="2.5" />
          <text x="20" y="-4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
            {k === "normal" ? "Iso-electric" : k === "elevated" ? "Elevated ST" : "Depressed ST"}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PWaveShapesSVG() {
  const shape = (kind: "normal" | "mitral" | "pulmonale") => {
    if (kind === "mitral") return "M0,20 Q4,4 9,14 Q13,4 18,20";
    if (kind === "pulmonale") return "M0,20 Q9,-4 18,20";
    return "M0,20 Q9,8 18,20";
  };
  return (
    <svg viewBox="0 0 320 50" className="mx-auto w-full max-w-sm">
      {(["normal", "mitral", "pulmonale"] as const).map((k, i) => (
        <g key={k} transform={`translate(${i * 100 + 20},20)`}>
          <line x1="-8" y1="20" x2="90" y2="20" stroke="#fecdd3" strokeWidth="1" />
          <path d={shape(k)} fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <text x="9" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
            {k === "normal" ? "Normal" : k === "mitral" ? "P Mitral" : "P Pulmonale"}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------------------------- عناصر واجهة عامة ---------------------------------- */

function BiLine({ ar, en }: { ar: string; en?: string }) {
  return (
    <p className="leading-8 text-slate-700 dark:text-slate-200">
      {ar} {en && <span className="text-slate-400 dark:text-slate-500">({en})</span>}
    </p>
  );
}

function SourceTag({ s }: { s: "thesis" | "simple-ecg" | "both" }) {
  const map = {
    thesis: { label: "من بحث ECG (جامعة السودان)", cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
    "simple-ecg": { label: "من Simple ECG (طب الأزهر)", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    both: { label: "مدمج من المصدرين", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  }[s];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${map.cls}`}>{map.label}</span>;
}

function Section({
  n,
  title,
  titleEn,
  source,
  children,
  open,
  onToggle,
}: {
  n: number;
  title: string;
  titleEn: string;
  source: "thesis" | "simple-ecg" | "both";
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-right"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-black text-white">{n}</span>
          <div>
            <div className="font-black text-slate-800 dark:text-white">{title}</div>
            <div className="text-xs text-slate-400">{titleEn}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline"><SourceTag s={source} /></span>
          <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>
      {open && <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">{children}</div>}
    </div>
  );
}

function Box({ title, color = "sky", children }: { title: string; color?: "sky" | "amber" | "rose" | "emerald"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    sky: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-500/10",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/10",
    rose: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-500/10",
    emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="mb-2 font-bold text-slate-800 dark:text-white">{title}</div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

/* ============================================================================
   المكوّن الرئيسي
   ============================================================================ */

export default function ECGLearn() {
  const [openSection, setOpenSection] = useState<number>(1);
  const toggle = (n: number) => setOpenSection((cur) => (cur === n ? 0 : n));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-l from-sky-700 to-slate-800 p-5 text-white">
        <h2 className="text-xl font-black sm:text-2xl">مكتبة ECG: تعلّم قراءة رسم القلب بكل احترافية من الصفر حتى الاحتراف</h2>
        <p className="mt-1 text-sm text-sky-100">Learn to read the ECG — from zero to professional</p>
        <p className="mt-2 text-xs text-sky-200">
          مرجع منظم يعتمد بالكامل على مصدرين: بحث "جهاز رسم القلب" (جامعة السودان) وكتاب "Simple ECG" (طب الأزهر) — بدون أي مصدر خارجي.
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        📌 المرجع كامل الآن: الأساسيات والقلب الطبيعي (١-٧)، ثم الحالات غير الطبيعية والطريقة المنهجية لقراءة أي ECG (٨-١٥).
      </div>

      {/* الجزء 1 */}
      <Section n={1} title="تاريخ الجهاز ولماذا نحتاج تخطيط القلب" titleEn="History & why we need an ECG" source="thesis" open={openSection === 1} onToggle={() => toggle(1)}>
        <BiLine ar="أول محاولات تسجيل النشاط الكهربائي للعضلة بدأت من عام 1666 على يد عدد من العلماء، وفي 1773 اكتشف (والش) توليد بعض عضلات السمك للكهرباء." en="First attempts to record muscle electrical activity date back to 1666; in 1773 Walsh discovered that some fish muscles generate electricity." />
        <BiLine ar="عام 1792 نشر العالم الإيطالي لويجي جولفاني أول تسجيل لعضلة منقبضة، ثم في 1849 أظهر دوبيوز ورايموند تسجيل انقباض العضلة الإرادي." en="In 1792 Luigi Galvani published the first recording of a contracting muscle; in 1849 Dubois-Reymond and Raymond demonstrated recording of voluntary muscle contraction." />
        <BiLine ar="عام 1922 استخدم العالمان جاسر وأيرلانك شاشة لعرض الإشارات الكهربائية الناتجة عن الانقباض العضلي، وتطورت طرق التسجيل بسرعة بين 1930 و1950." en="In 1922 Gasser and Erlanger used a screen to display electrical signals from muscle contraction; recording methods developed rapidly between 1930 and 1950." />
        <BiLine ar="الاستخدام الطبي الفعلي للتخطيط الكهربائي لتشخيص أمراض عصبية عضلية بدأ عام 1960، واستخدم هارديك وفريقه الجهاز بشكله الحالي عام 1966." en="Actual clinical use of electrical charting for diagnosing neuromuscular diseases began in 1960; Hardyck and his team used the device in its current form in 1966." />
        <BiLine ar="القلب عضو مجوّف يدفع الدم ضمن جهاز الدوران بما يشبه عمل المضخة، ويتعرض لأمراض عديدة مثل قصور القلب والقناة الشريانية المفتوحة والذبحة الصدرية واضطراب النظم." en="The heart is a hollow organ that pumps blood through the circulatory system like a pump; it's subject to diseases such as heart failure, patent ductus arteriosus, angina, and arrhythmia." />
        <Box title="أهداف تخطيط القلب" color="sky">
          <BiLine ar="توضيح اللانظمية القلبية وعيوب التوصيل." en="Clarifying cardiac arrhythmia and conduction defects." />
          <BiLine ar="تحديد ضخامة العضلة القلبية والافقار أو الاحتشاء." en="Identifying cardiac muscle enlargement, ischemia, or infarction." />
          <BiLine ar="إعطاء معلومات عن عدم توازن الكهارل وسمية بعض الأدوية." en="Providing information on electrolyte imbalance and drug toxicity." />
        </Box>
      </Section>

      {/* الجزء 2 */}
      <Section n={2} title="تشريح القلب والجهاز الكهربي الموصل" titleEn="Cardiac anatomy & the conduction system" source="both" open={openSection === 2} onToggle={() => toggle(2)}>
        <HeartConductionSVG />
        <BiLine ar="القلب مضخة عضلية مجوّفة تقع بالجانب الأيسر من التجويف الصدري خلف عظمة القص جزئيًا، وتتكون من 4 حجرات: أذينان وبطينان." en="The heart is a hollow muscular pump situated in the left side of the thoracic cavity, partly behind the sternum, consisting of 4 chambers: 2 atria and 2 ventricles." />
        <BiLine ar="يُغطّى القلب من الخارج بطبقة النخاب (Epicardium)، ويبطّن تجويفه من الداخل طبقة الشغاف (Endocardium)، وبينهما طبقة عضلية وسطى هي عضلة القلب (Myocardium)." en="The heart is covered externally by the epicardium; its inside cavity is lined by the endocardium; an intermediate muscular layer between them is the myocardium." />
        <Box title="الخصائص الخاصة لعضلة القلب" color="emerald">
          <BiLine ar="الإيقاعية (Rhythmicity): قدرة القلب على النبض بانتظام بمعدل ثابت." en="Rhythmicity: the heart's ability to beat regularly at a constant rate." />
          <BiLine ar="الانقباضية (Contractility): قدرة القلب على الانقباض ودفع الدم في الدورة الدموية." en="Contractility: the heart's ability to contract and push blood into circulation." />
          <BiLine ar="الاستثارية (Excitability): قدرة عضلة القلب على الاستجابة لمنبه كافٍ بالانقباض." en="Excitability: the cardiac muscle's ability to respond to an adequate stimulus with contraction." />
          <BiLine ar="التوصيلية (Conductivity): قدرة عضلة القلب على توصيل موجة الاستثارة من جزء لآخر." en="Conductivity: the cardiac muscle's ability to conduct the excitation wave from one part to another." />
          <p className="mt-1 text-xs italic text-slate-400">في دراسة الـECG نهتم بخاصيتي الإيقاعية والتوصيلية تحديدًا. (In ECG study we are concerned with rhythmicity and conductivity.)</p>
        </Box>
        <BiLine ar="النبضة الطبيعية تبدأ بإشارة كهربائية من العقدة الجيبية الأذينية (SA node) الواقعة في الأذين الأيمن قرب فتحة الوريد الأجوف العلوي، بمعدل 60-100 نبضة/دقيقة." en="The normal impulse starts as an electrical signal from the sinoatrial (SA) node in the right atrium near the opening of the superior vena cava, at 60-100 beats/min." />
        <BiLine ar="تنتشر الإشارة أولًا في الأذين الأيمن ثم الأيسر فينقبض الأذينان معًا لدفع الدم عبر الصمامين ثلاثي الشرفات والميترالي إلى البطينين." en="The stimulus spreads first through the right atrium then the left; both atria contract together, pumping blood through the tricuspid and mitral valves into the ventricles." />
        <BiLine ar="تصل الإشارة بعدها للعقدة الأذينية البطينية (AV node) وهي مولد احتياطي صغير يقع بين الأذينين والبطينين، وتُسمى مع حزمة هيس والفرعين اليمين والأيسر بنظام هيس-بركنجي." en="The signal then reaches the AV node — a small backup pacemaker between the atria and ventricles — which together with the bundle of His and its two branches is called the His-Purkinje system." />
        <BiLine ar="تتفرع حزمة هيس لفرعين: الحزمة اليمنى (تغذي البطين الأيمن) والحزمة اليسرى (تغذي البطين الأيسر)، وينتهي التوصيل بألياف بركنجي التي تنشر الإشارة داخل عضلة البطينين." en="The bundle of His divides into the right bundle branch (supplying the right ventricle) and the left bundle branch (supplying the left ventricle); Purkinje fibers finally spread the signal through the ventricular muscle." />
        <BiLine ar="النظام الطبيعي حين تنشأ الإشارات من العقدة الجيبية الأذينية يُسمى (Sinus rhythm)؛ ولو نشأت من العقدة الأذينية البطينية بدلًا منها يُسمى (Nodal rhythm)، أو من عضلة البطين نفسها في حالات الفشل أو وجود مصدر خارجي أسرع من العقدة الأساسية." en="When impulses arise normally from the SA node it's called sinus rhythm; if they arise from the AV node instead it's nodal rhythm, or from the ventricular muscle itself if the SA node fails or a faster ectopic focus takes over." />
        <BiLine ar="القلب له نوعان من الفعل: ميكانيكي (انقباض وانبساط) وكهربائي (إزالة استقطاب وإعادة استقطاب)." en="The heart has two types of action: mechanical (contraction & relaxation) and electrical (depolarization & repolarization)." />
      </Section>

      {/* الجزء 3 */}
      <Section n={3} title="الشرايين التاجية وتوزيع تغذية القلب" titleEn="Coronary arteries & supply pattern" source="simple-ecg" open={openSection === 3} onToggle={() => toggle(3)}>
        <BiLine ar="الشريان التاجي الأيسر ينشأ من جيب فالسالفا الأيسر ويمر للأمام واليسار في الأخدود الأذيني البطيني مسافة قصيرة، ثم ينقسم لفرعين." en="The left coronary artery arises from the left sinus of Valsalva and passes forward and to the left in the atrioventricular groove before dividing into two branches." />
        <Box title="فروع الشريان الأيسر" color="rose">
          <BiLine ar="الشريان الأمامي النازل الأيسر (LAD): يمر لأسفل في الأخدود بين البطينين الأمامي حتى قمة القلب ثم يلتف للخلف ليتواصل مع الشريان الخلفي النازل." en="Left anterior descending artery (LAD): runs down the anterior interventricular groove to the apex, then turns back to anastomose with the posterior descending artery." />
          <BiLine ar="الشريان الظرفي (Circumflex): يكمل مساره في الأخدود الأذيني البطيني الأيسر ليتواصل مع الشريان التاجي الأيمن." en="Circumflex artery: continues in the left atrioventricular groove to anastomose with the right coronary artery." />
        </Box>
        <BiLine ar="الشريان التاجي الأيمن ينشأ من الجيب الأيمن لفالسالفا ويمر في الأخدود الأذيني البطيني الأيمن حتى السطح الخلفي للقلب ليتواصل مع الشريان الظرفي." en="The right coronary artery arises from the right sinus of Valsalva and runs in the right atrioventricular groove to the posterior heart surface, anastomosing with the circumflex." />
        <BiLine ar="في الدورة الدموية المتوازنة: الشريان الأيسر يغذي الأذين الأيسر والبطين الأيسر والجزء الأمامي من الحاجز البطيني، بينما الأيمن يغذي الأذين الأيمن والبطين الأيمن والجزء الخلفي من الحاجز." en="In balanced circulation: the left coronary supplies the left atrium, left ventricle, and anterior interventricular septum, while the right supplies the right atrium, right ventricle, and posterior septum." />
      </Section>

      {/* الجزء 4 */}
      <Section n={4} title="مبادئ الـECG: كيف تتحول الكهرباء إلى موجة على الورق" titleEn="Principles of ECG" source="simple-ecg" open={openSection === 4} onToggle={() => toggle(4)}>
        <BiLine ar="كلمة Electrocardiogram مكوّنة من ثلاثة مقاطع: Electro = كهرباء، Cardio = القلب، Gram = تصوير/رسم — أي تصوير كهربة القلب." en="'Electrocardiogram' has 3 parts: Electro = electricity, Cardio = heart, Gram = drawing — i.e. a picture of the heart's electricity." />
        <BiLine ar="الكهرباء في جسم الإنسان لها صفتان أساسيتان: القوة (Strength) والاتجاه (Direction)، وجهاز الـECG يقيس كلتيهما." en="Electricity in the human body has two properties: strength and direction, and the ECG machine measures both." />
        <LeadDirectionSVG />
        <Box title="القاعدة الذهبية لاتجاه الموجة" color="amber">
          <BiLine ar="لو الكهرباء اتجاهها نحو الـLead الذي يسجّل الإشارة ← يرسم الجهاز موجة موجبة (Positive wave)." en="If electricity direction is toward the Lead recording the signal → the machine draws a positive wave." />
          <BiLine ar="لو الكهرباء اتجاهها عكس الـLead ← يرسم موجة سالبة (Negative wave)." en="If electricity direction is opposite the Lead → it draws a negative wave." />
          <BiLine ar="لو الكهرباء اتجاهها عمودي على الـLead ← يرسم موجة ثنائية الطور (Biphasic) فيها جزء موجب وجزء سالب." en="If electricity direction is perpendicular to the Lead → it draws a biphasic wave with a positive and a negative part." />
        </Box>
        <BiLine ar="ارتفاع الموجة على الـECG يتناسب طرديًا مع سُمك العضلة (thickness of the muscle)، فموجة البطين الأيسر (الأسمك) أكبر من موجة البطين الأيمن." en="Wave height on the ECG is directly proportional to muscle thickness — the left ventricle wave (thicker muscle) is bigger than the right ventricle wave." />
        <BiLine ar="نتعامل مع عضلة القلب في الـECG كجزأين: الأذينان (Atria) والبطينان (Ventricles). وعند تسجيل كهربة البطينين تنشأ الكهرباء أولًا في الحاجز (Septum)، ثم البطين الأيمن، ثم الأيسر — الحاجز والحزمة اليسرى يوصّلان الكهرباء من اليسار لليمين." en="We treat the cardiac muscle as two parts: atria and ventricles. When recording ventricular electricity, it starts in the septum, then the right ventricle, then the left — the septum and left bundle branch conduct electricity from left to right." />
        <Box title="لماذا V1 يعطي شكلًا مختلفًا عن V6؟" color="sky">
          <BiLine ar="في V1 (أقرب شيء للبطين الأيمن): كهرباء الحاجز تتجه ناحيته فترسم موجة r صغيرة موجبة (لأن سُمك الحاجز غير كبير)، ثم كهرباء البطين الأيمن (الأقرب) تتجه ناحيته فتزيد الموجة الموجبة قليلًا، ثم كهرباء البطين الأيسر (الأكبر سُمكًا) تبتعد عنه فترسم موجة S عميقة." en="In V1 (closest to the right ventricle): septal electricity heads toward it → small positive r wave; right ventricle electricity (closer) adds to it; then the thicker left ventricle's electricity moves away from it → a deep S wave." />
          <BiLine ar="في V6 (أقرب شيء للبطين الأيسر): العكس تمامًا — كهرباء الحاجز تبتعد فترسم q صغيرة، وكهرباء البطين الأيسر (الأكبر) تتجه ناحيته فترسم R كبيرة، بينما موجة S تكون صغيرة أو شبه غائبة." en="In V6 (closest to the left ventricle): the opposite — septal electricity moves away → small q; the larger left ventricle's electricity heads toward it → a tall R; the S wave is small or nearly absent." />
          <p className="mt-1 text-xs font-bold text-slate-500">V1 = right ventricular pattern | V6 = left ventricular pattern</p>
        </Box>
      </Section>

      {/* الجزء 5 */}
      <Section n={5} title="الجهاز والأقطاب: من مكونات الجهاز إلى نظام الـ12 Lead" titleEn="The machine, electrodes & the 12-lead system" source="both" open={openSection === 5} onToggle={() => toggle(5)}>
        <Box title="مكوّنات جهاز تخطيط القلب (من بحث ECG)" color="sky">
          <BiLine ar="المعايرة (Calibration): تضبط الجهاز قبل البدء وتصنع موجة مربعة 1mV لتأكيد سلامة الجهاز." en="Calibration: sets up the device before starting, producing a 1mV square wave to confirm it's working correctly." />
          <BiLine ar="نقطة الحساسية: تُكبّر أو تُصغّر الموجة حسب حالة المريض." en="Sensitivity point: enlarges or reduces the wave depending on the patient's condition." />
          <BiLine ar="المؤشر الحراري: يرسم الموجة على الورق بمقاومة حرارية يرفع تيار محدود درجة حرارتها." en="Heat stylus: draws the wave on paper via a heating resistor whose temperature a limited current raises." />
          <BiLine ar="تحديد السرعة: عادة سرعتان 25 أو 50 مم/ث، تُختار حسب حالة نبض المريض." en="Speed selector: usually two speeds, 25 or 50 mm/s, chosen per the patient's pulse." />
          <BiLine ar="المرشح (Filter): يصفّي الموجة من التأثيرات الخارجية مثل النيونات والأجهزة المجاورة." en="Filter: cleans the wave from external interference such as neon lights and nearby devices." />
          <BiLine ar="الأرضي: يسرّب الشحنات الزائدة ويحمي من الصعقات الكهربائية." en="Ground: drains excess charge and protects against electric shocks." />
        </Box>
        <BiLine ar="يتألف الجهاز من خمسة أقطاب (Electrodes) توضع في أماكن محددة من الجسم — على كل ذراع وساق وعند ست نقاط فوق منطقة القلب على الصدر." en="The machine has five electrodes placed at specific body locations — on each arm and leg, and at six points over the heart area on the chest." />
        <ChestLeadsSVG />
        <BiLine ar="تقوم الأقطاب بالتقاط التيارات الناتجة عن كل خفقة، وتنقلها لمكبر داخل الجهاز، ثم تتحرك رافعة حساسة (سلك داخل مجال مغناطيسي) تسجل الحركة على ورقة الرسم البياني، فينتج شكل التخطيط المعروف باسم Leads." en="Electrodes capture the currents produced with each heartbeat and pass them to an internal amplifier; a sensitive stylus (a wire inside a magnetic field) then moves and records the tracing on graph paper, producing the tracings known as Leads." />
        <Box title="أنواع الـLimb Leads" color="emerald">
          <BiLine ar="Bipolar (ثنائي القطب): يقيس فرق الجهد بين طرفين — I (بين الذراعين)، II (بين الذراع الأيمن والساق اليسرى)، III (بين الذراع الأيسر والساق اليسرى)." en="Bipolar: measures voltage difference between two points — I (both arms), II (right arm & left leg), III (left arm & left leg)." />
          <BiLine ar="Unipolar (أحادي القطب): يقيس الكهرباء عند نقطة واحدة مكبَّرة (augmented) — aVR (الذراع الأيمن)، aVL (الذراع الأيسر)، aVF (الساق اليسرى)." en="Unipolar: measures electricity at one augmented point — aVR (right arm), aVL (left arm), aVF (left foot)." />
        </Box>
        <BiLine ar="الـChest Leads (Precordial leads) ستة: V1 إلى V6، وتقع على جدار الصدر مباشرة أمام القلب." en="The Chest (precordial) leads are six: V1 to V6, placed directly on the chest wall in front of the heart." />
        <Box title="أماكن أقطاب الصدر بدقة" color="amber">
          <BiLine ar="V1: المسافة الرابعة بين الضلوع على يمين القص." en="V1: 4th intercostal space, right of the sternum." />
          <BiLine ar="V2: المسافة الرابعة بين الضلوع على يسار القص." en="V2: 4th intercostal space, left of the sternum." />
          <BiLine ar="V3: في منتصف المسافة بين V2 وV4." en="V3: midway between V2 and V4." />
          <BiLine ar="V4: عند قمة القلب (خط منتصف الترقوة)." en="V4: at the apex of the heart (mid-clavicular line)." />
          <BiLine ar="V5: بنفس مستوى V4 عند خط الإبط الأمامي." en="V5: same level as V4, anterior axillary line." />
          <BiLine ar="V6: بنفس مستوى V4 عند خط منتصف الإبط." en="V6: same level as V4, mid-axillary line." />
        </Box>
        <BiLine ar="التوزيع بحسب منطقة القلب: V1-V2 يمثلان البطين الأيمن، V3-V4 يمثلان الحاجز، V5-V6 يمثلان البطين الأيسر." en="By heart region: V1-V2 represent the right ventricle, V3-V4 the septum, V5-V6 the left ventricle." />
        <Box title="جدول توپوجرافيا القلب (Topographism) — أي Leads تمثل أي جدار" color="rose">
          <BiLine ar="II، III، aVF ← الجدار السفلي (Inferior)." />
          <BiLine ar="I، aVL ← الجدار الجانبي العلوي (High lateral)." />
          <BiLine ar="V1، V2 ← الحاجز (Septal)." />
          <BiLine ar="V3، V4 ← الأمامي الصريح (Strict anterior)." />
          <BiLine ar="V5، V6 ← الجانبي السفلي (Low lateral)." />
          <p className="mt-1 text-xs italic text-slate-400">هذا الجدول هو أساس تحديد مكان الاحتشاء لاحقًا في جزء نقص التروية.</p>
        </Box>
        <BiLine ar="جهاز الـECG القياسي ينتج 12 صورة (Leads): 6 من الأطراف + 6 من الصدر، مرتبة دائمًا: I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6." en="A standard ECG produces 12 leads: 6 limb + 6 chest, always ordered: I, II, III, aVR, aVL, aVF, V1-V6." />
      </Section>

      {/* الجزء 6 */}
      <Section n={6} title="ورقة رسم القلب: المربعات، الفولت، وحساب المعدل" titleEn="ECG graph paper: squares, voltage & rate" source="simple-ecg" open={openSection === 6} onToggle={() => toggle(6)}>
        <GraphPaperSVG />
        <BiLine ar="الورقة عبارة عن مربعات كبيرة تحتوي كل واحدة منها على 5×5 مربعات صغيرة (5 بالطول و5 بالعرض)." en="The paper consists of big squares, each containing 5×5 small squares (5 in length, 5 in width)." />
        <Box title="المحور الأفقي = الزمن (Duration)" color="sky">
          <BiLine ar="الورقة تتحرك بسرعة 25 مم/ثانية، فالمربع الصغير الواحد = 0.04 ثانية." en="The paper moves at 25 mm/sec, so one small square = 0.04 sec." />
          <BiLine ar="المربع الكبير (5 مربعات صغيرة) = 0.04 × 5 = 0.20 ثانية (خُمس ثانية)." en="One big square (5 small squares) = 0.04 × 5 = 0.20 sec (one-fifth of a second)." />
          <BiLine ar="الدقيقة الواحدة = 300 مربع كبير، أو 1500 مربع صغير." en="One minute = 300 big squares, or 1500 small squares." />
        </Box>
        <Box title="المحور الرأسي = الفولت (Voltage)" color="emerald">
          <BiLine ar="جهاز الـECG مُهيّأ ليقيس إشارة 1mV، وتترجم على الورقة كارتفاع قدره 10mm (أي عشر مربعات كبيرة بالطول) — تُسمى Standard Calibration." en="The ECG machine is calibrated to a 1mV signal, translated on paper as 10mm height (10 big squares) — called Standard Calibration." />
          <BiLine ar="لو رسمنا 1mV على مربع كبير واحد فقط (Half calibration) تكون الموجات كبيرة جدًا داخل وخارج الورقة." en="If 1mV is drawn as just one big square (half calibration), the waves become too large, spilling off the paper." />
          <BiLine ar="لو رسمنا 1mV على 4 مربعات كبيرة (Double calibration) يقل حجم الموجات." en="If 1mV is drawn as 4 big squares (double calibration), wave sizes shrink." />
        </Box>
        <Box title="حساب معدل ضربات القلب (Heart Rate)" color="amber">
          <BiLine ar="الطريقة الأولى — للإيقاع المنتظم: معدل الضربات = 300 ÷ عدد المربعات الكبيرة بين موجتي R متتاليتين." en="Method 1 — regular rhythm: Heart rate = 300 ÷ number of big squares between two consecutive R waves." />
          <BiLine ar="أو بدقة أكبر: 1500 ÷ عدد المربعات الصغيرة بين R وR." en="Or more precisely: 1500 ÷ number of small squares between R and R." />
          <BiLine ar="الطريقة الثانية — للإيقاع غير المنتظم: عدّ عدد موجات R خلال 6 ثوانٍ (30 مربع كبير) ثم اضربه في 10." en="Method 2 — irregular rhythm: count R waves during 6 seconds (30 big squares), then multiply by 10." />
          <p className="mt-1 text-xs italic text-slate-400">مثال: لو في 30 مربع كبير (6 ثوانٍ) لقينا 5 ضربات → المعدل = 5 × 10 = 50 ضربة/دقيقة.</p>
        </Box>
      </Section>

      {/* الجزء 7 */}
      <Section n={7} title="الموجات الخمس بالتفصيل: P, QRS, T + PR, ST, QT" titleEn="The five waves in detail" source="both" open={openSection === 7} onToggle={() => toggle(7)}>
        <PQRSTWaveSVG />
        <BiLine ar="ترتيب الأحداث في الدورة القلبية الواحدة: انقباض الأذينين (P) ← انبساطهما (لا يُسجَّل لأنه يتزامن مع انقباض البطينين) ← انقباض البطينين (QRS) ← انبساطهما (T)." en="Order of events in one cardiac cycle: atrial contraction (P) → their relaxation (not recorded — coincides with ventricular contraction) → ventricular contraction (QRS) → their relaxation (T)." />

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">1) موجة P — Atrial depolarization</div>
          <BiLine ar="تمثل انقباض الأذينين، وهي أول موجة موجبة قبل الـcomplex." en="Represents atrial depolarization; it's the first positive wave before the complex." />
          <BiLine ar="أفضل مكان لقراءتها: Lead II وV1." en="Best place to read it: Lead II and V1." />
          <BiLine ar="مقاساتها الطبيعية: أقل من 2.5×2.5 مربع صغير (العرض أقل من 0.12 ثانية، والارتفاع أقل من 2.5 مم)." en="Normal measurements: less than 2.5×2.5 small squares (width < 0.12s, height < 2.5mm)." />
          <Box title="احتمالات موجة P غير الطبيعية" color="rose">
            <BiLine ar="P Mitral (M shaped): موجة عريضة أكثر من 2.5 مربع — تدل على تضخم الأذين الأيسر (Left atrial strain)." en="P Mitral (M-shaped): wider than 2.5 squares — indicates left atrial strain/enlargement." />
            <BiLine ar="P Pulmonale (Peaked): موجة عالية أكثر من 2.5 مربع — تدل على تضخم الأذين الأيمن (Right atrial strain)." en="P Pulmonale (peaked): taller than 2.5 squares — indicates right atrial strain." />
            <BiLine ar="Biphasic: جزء موجب وجزء سالب — في V1 الجزء الأول (موجب) يمثل الأذين الأيمن والجزء الثاني (سالب) يمثل الأذين الأيسر لأن العقدة الجيبية تنشّط الأيمن أولًا." en="Biphasic: positive then negative part — in V1 the first (positive) part represents the right atrium, the second (negative) the left, since the SA node activates the right atrium first." />
            <BiLine ar="Absent (غائبة): مع إيقاع غير منتظم تدل على رجفان أذيني (AF)." en="Absent: with an irregular rhythm, indicates atrial fibrillation (AF)." />
          </Box>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">2) فترة PR — AV conduction</div>
          <BiLine ar="تمثل التأخير الفسيولوجي في العقدة الأذينية البطينية، وتمتد من بداية موجة P لبداية QRS." en="Represents the physiological delay at the AV node, from the start of P to the start of QRS." />
          <BiLine ar="أفضل مكان لقراءتها: Lead II. مقاساتها الطبيعية: 3-5 مربعات صغيرة (0.12-0.20 ثانية)." en="Best lead: II. Normal: 3-5 small squares (0.12-0.20s)." />
          <Box title="احتمالاتها غير الطبيعية" color="rose">
            <BiLine ar="Prolonged وثابتة = First-degree heart block." en="Prolonged and constant = First-degree heart block." />
            <BiLine ar="Prolonged ومتغيرة تدريجيًا حتى تسقط ضربة = Wenckebach (Mobitz I)." en="Prolonged and progressively lengthening until a dropped beat = Wenckebach (Mobitz I)." />
            <BiLine ar="غير ثابتة إطلاقًا (Variable P-R) = انفصال أذيني بطيني كامل (Third-degree/complete heart block)." en="Not fixed at all (variable P-R) = complete AV dissociation (third-degree heart block)." />
            <BiLine ar="Shortened (أقل من 3 مربعات) مع QRS عريض وموجة دلتا = متلازمة Wolff-Parkinson-White." en="Shortened (< 3 squares) with wide QRS and a delta wave = Wolff-Parkinson-White syndrome." />
          </Box>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">3) المجموعة QRS — Ventricular depolarization</div>
          <BiLine ar="تمثل انقباض البطينين، وتقع بين موجتي P وT. أفضل مكان: V1-V2 للبطين الأيمن، وV5-V6 للبطين الأيسر." en="Represents ventricular depolarization, between P and T. Best leads: V1-V2 for right ventricle, V5-V6 for left ventricle." />
          <BiLine ar="Q wave: أول موجة سالبة في المجموعة. R wave: أول موجة موجبة. S wave: الموجة السالبة التالية لـR." en="Q wave: first negative wave in the complex. R wave: first positive wave. S wave: the negative wave following R." />
          <BiLine ar="المدة الطبيعية = 0.12 ثانية (3 مربعات صغيرة) أو أقل." en="Normal duration = 0.12 sec (3 small squares) or less." />
          <BiLine ar="ليس شرطًا أن يحتوي كل QRS على الحروف الثلاثة؛ فقد يكون أحادي الطور (R أو QS فقط)، ثنائي الطور (RS أو QR)، أو ثلاثي الطور (QRS أو RSR')." en="Not every QRS contains all three letters — it may be monophasic (R or QS only), biphasic (RS or QR), or triphasic (QRS or RSR')." />
          <Box title="موجة Q الباثولوجية (Pathological Q)" color="rose">
            <BiLine ar="عميقة وعريضة (Deep and wide) — عرضها أكثر من مربع صغير واحد، وعمقها أكثر من ربع ارتفاع موجة R التالية لها." en="Deep and wide — wider than one small square, and deeper than a quarter of the following R wave's height." />
            <BiLine ar="لا تُرى في الـECG الطبيعي إلا في Lead aVR (طبيعيًا)، وتدل في باقي الـLeads على احتشاء عضلة القلب (myocardial infarction)." en="Not seen in a normal ECG except normally in aVR; elsewhere it indicates myocardial infarction." />
            <BiLine ar="مكان ظهورها يحدد مكان الاحتشاء: V1-V2 أمامي، V3-V4 حاجزي، V5-V6 جانبي، وV1-V5 احتشاء أمامي واسع." en="Its location pinpoints the infarction site: V1-2 anterior, V3-4 septal, V5-6 lateral, V1-5 extensive anterior." />
          </Box>
          <Box title="ارتفاع موجة R (Voltage criteria)" color="amber">
            <BiLine ar="أقل من مربع كبير واحد (Low voltage) قد يدل على قصور قلب نهائي، اعتلال عضلة القلب، مرض إقفاري، سمنة، انتفاخ رئوي، أو انصباب تاموري." en="Less than 1 big square (low voltage) may indicate terminal heart failure, cardiomyopathy, IHD, obesity, emphysema, or pericardial effusion." />
            <BiLine ar="أكثر من 5 مربعات كبيرة (High voltage) يدل غالبًا على تضخم البطين." en="More than 5 big squares (high voltage) usually indicates ventricular hypertrophy." />
          </Box>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">4) قطعة ST — Ventricular repolarization (البداية)</div>
          <BiLine ar="تمتد من نهاية S إلى بداية T، وتظهر في كل الـLeads. أهم نقطة مرجعية فيها هي J point (النقطة التي يعود عندها QRS للخط الأساسي)." en="Extends from the end of S to the start of T, appears in all leads. Its key reference point is the J point (where QRS returns to the isoelectric line)." />
          <Box title="احتمالاتها الثلاثة" color="rose">
            <BiLine ar="Iso-electric line (على نفس خط P-R أو T-P): طبيعي." en="Iso-electric line (level with the P-R or T-P line): normal." />
            <BiLine ar="Elevated (مرتفعة فوق الخط): التهاب التامور (منتشرة بشكل سرجي في كل الـLeads)، احتشاء عضلة القلب، أو ذبحة برنزميتال." en="Elevated: pericarditis (diffuse, saddle-shaped, in all leads), myocardial infarction, or Prinzmetal's angina." />
            <BiLine ar="Depressed (منخفضة تحت الخط): تسمم بالديجيتالس (شكل sagging مميز)، نقص بوتاسيوم، الذبحة الصدرية (ischemia)، احتشاء، التهاب تامور، تضخم القلب، أو حصار حزمة." en="Depressed: digitalis toxicity (characteristic 'sagging' shape), hypokalemia, angina (ischemia), infarction, pericarditis, cardiac hypertrophy, or bundle branch block." />
          </Box>
          <BiLine ar="الفرق بين الذبحة الصدرية واحتشاء عضلة القلب في التوقيت والإنزيمات: إنزيمات القلب ترتفع وتبقى مرتفعة في الاحتشاء، بينما في الذبحة يزول انخفاض ST خلال حوالي 20 دقيقة." en="Angina vs MI is distinguished by timing and enzymes: cardiac enzymes rise and stay elevated in MI, while in angina the ST depression resolves within about 20 minutes." />
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">5) موجة T (لا تغيب أبدًا) — Ventricular repolarization</div>
          <BiLine ar="عرضها أقل من 6 مربعات صغيرة، وارتفاعها أقل من ثلث ارتفاع موجة R التي تسبقها." en="Width less than 6 small squares; height less than one-third of the preceding R wave." />
          <BiLine ar="احتمالاتها: Upright (موجبة) وهي الطبيعية، أو Inverted (مقلوبة)." en="Possibilities: Upright (positive) — normal — or Inverted." />
          <Box title="احتمالات غير طبيعية" color="rose">
            <BiLine ar="Hyperacute T (عالية وتُسمى T همالايا): تظهر في فرط بوتاسيوم الدم (hyperkalemia)." en="Hyperacute T (tall, Himalaya-shaped): seen in hyperkalemia." />
            <BiLine ar="Inverted قد تكون طبيعية عند بعض الأشخاص، ولها قيمة فقط إذا كانت (Dynamic T) أي تغيرت من حالة سابقة (Upright ثم اعتدلت لاحقًا أو العكس)." en="Inversion can be normal in some people; it only has diagnostic value if it's dynamic — changed from a previous state (upright → not, or vice versa)." />
          </Box>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">6) فترة QT (الكاملة)</div>
          <BiLine ar="من بداية QRS إلى نهاية موجة T. طبيعيًا = 0.44 ثانية أو أقل (11 مربع صغير)." en="From the start of QRS to the end of T. Normal = 0.44s or less (11 small squares)." />
          <Box title="أسباب إطالة QT (Long Q-T interval)" color="rose">
            <BiLine ar="أدوية (كثير من مضادات اضطراب النظم، مضادات الاكتئاب ثلاثية الحلقات، الفينوثيازين)." en="Drugs (many antiarrhythmics, tricyclics & phenothiazines)." />
            <BiLine ar="اختلال كهارل (بوتاسيوم، كالسيوم، مغنيسيوم)." en="Electrolyte abnormalities (K+, Ca++, Mg++)." />
            <BiLine ar="أمراض الجهاز العصبي المركزي (خصوصًا النزيف تحت العنكبوتية، الجلطة، الرضوض)." en="CNS disease (especially subarachnoid hemorrhage, stroke, trauma)." />
            <BiLine ar="إطالة QT الوراثية (Hereditary LQT)." en="Hereditary LQT." />
          </Box>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 font-black text-slate-800 dark:text-white">7) موجة U</div>
          <BiLine ar="أوضح ما تكون في Leads V2-V4، وقد تدل على نقص بوتاسيوم الدم أو تأثير/سمية أدوية معينة (أميودارون، دوفيتيلايد، كينيدين، سوتالول)." en="Usually most apparent in chest leads V2-V4; may be a sign of hypokalemia or drug effect/toxicity (e.g. amiodarone, dofetilide, quinidine, or sotalol)." />
        </div>
      </Section>

      {/* الجزء 8 */}
      <Section n={8} title="تضخم الحجرات ومحور القلب" titleEn="Chamber enlargement & cardiac axis" source="simple-ecg" open={openSection === 8} onToggle={() => toggle(8)}>
        <PWaveShapesSVG />
        <Box title="تضخم الأذينين (من موجة P)" color="sky">
          <BiLine ar="تضخم الأذين الأيمن: موجة P مدببة (Peaked) أطول من 2.5 مم — تُسمى P Pulmonale." en="Right atrial enlargement: peaked P wave taller than 2.5mm — called P Pulmonale." />
          <BiLine ar="تضخم الأذين الأيسر: موجة P عريضة (Broad) أكثر من 2.5 مربع صغير، شكلها M — تُسمى P Mitral." en="Left atrial enlargement: broad P wave wider than 2.5 small squares, M-shaped — called P Mitral." />
        </Box>
        <Box title="تضخم البطينين (من مجموعة QRS)" color="emerald">
          <BiLine ar="تضخم البطين الأيسر (Exaggeration of normal): موجة S في V1/V2 أكبر من 5 مربعات كبيرة، أو موجة R في V5/V6 أكبر من 5 مربعات كبيرة، أو مجموع S+R أكبر من أو يساوي 7 مربعات كبيرة." en="Left ventricular hypertrophy (exaggeration of normal): S in V1/V2 > 5 big squares, or R in V5/V6 > 5 big squares, or S+R ≥ 7 big squares." />
          <BiLine ar="مع تضخم البطين الأيسر غالبًا يظهر نمط إجهاد (Strain pattern): انخفاض ST وانقلاب T في V5-V6." en="Left ventricular hypertrophy is often accompanied by a strain pattern: ST depression and T inversion in V5-V6." />
          <BiLine ar="تضخم البطين الأيمن (Reversal of normal): في V1/V2 تصبح R أكبر من S (عكس الطبيعي)، أو في V5/V6 تصبح S أكبر من R." en="Right ventricular hypertrophy (reversal of normal): in V1/V2, R becomes larger than S (opposite of normal), or in V5/V6, S becomes larger than R." />
          <BiLine ar="لو ظهر نمط الإجهاد في V1-V2 وأيضًا في V5-V6 معًا، فهذا يدل على تضخم في البطينين معًا (Bi-ventricular hypertrophy)." en="If the strain pattern appears in both V1-V2 and V5-V6 together, this indicates bi-ventricular hypertrophy." />
        </Box>
        <BiLine ar="محور القلب (Cardiac Axis) خط وهمي يمثل محصلة اتجاه التيار الكهربائي في القلب، ويكون طبيعيًا متجهًا من أعلى لأسفل ومن اليمين لليسار قليلًا (لأن البطين الأيسر أكبر)." en="The cardiac axis is an imaginary line representing the net direction of the heart's electrical current; normally it points down and slightly to the left (since the left ventricle is bigger)." />
        <AxisWheelSVG />
        <Box title="طريقة تحديد المحور بسرعة" color="amber">
          <BiLine ar="انظر لمجموعة QRS في Lead واحد و aVF: لو موجبة (Positive) في الاثنين ← Normal axis." en="Look at QRS in Lead I and aVF: positive in both → Normal axis." />
          <BiLine ar="لو Lead I موجبة و aVF سالبة ← Left axis deviation." en="If Lead I positive and aVF negative → Left axis deviation." />
          <BiLine ar="لو Lead I سالبة و aVF موجبة ← Right axis deviation." en="If Lead I negative and aVF positive → Right axis deviation." />
        </Box>
        <Box title="أسباب انحراف المحور" color="rose">
          <BiLine ar="لليمين: الأطفال، البالغون النحيفون طوال القامة، تضخم البطين الأيمن، أمراض الرئة المزمنة، احتشاء أمامي وحشي، الانصمام الرئوي، عيب الحاجز الأذيني أو البطيني." en="Right: children, tall thin adults, right ventricular hypertrophy, chronic lung disease, anterolateral MI, pulmonary embolus, atrial/ventricular septal defect." />
          <BiLine ar="لليسار: موجة Q من احتشاء سفلي، ناظمة قلب صناعية، تضخم البطين الأيسر، فرط بوتاسيوم الدم، عيب الحاجز الأذيني من النوع الأولي." en="Left: Q waves of inferior MI, artificial cardiac pacing, left ventricular hypertrophy, hyperkalemia, ostium primum ASD." />
        </Box>
      </Section>

      {/* الجزء 9 */}
      <Section n={9} title="حصار الحزم (Bundle Branch Block)" titleEn="Right & left bundle branch block" source="simple-ecg" open={openSection === 9} onToggle={() => toggle(9)}>
        <BundleBranchCompareSVG />
        <BiLine ar="حصار الحزمة يُعرف من شكل مجموعة QRS: هتبص لثلاثة أشياء بالترتيب — الشكل (Shape)، الاتجاه (Direction)، ثم الفولت (Voltage)." en="A bundle branch block is recognized from the QRS shape: check three things in order — shape, direction, then voltage." />
        <Box title="الخطوة 1: الشكل — علامة حصار الحزمة" color="sky">
          <BiLine ar="لو شكل QRS اتخذ شكل حرف M أو ظهرت فيه نتوءة واضحة (Notch) — دي علامة وجود حصار حزمة (Bundle branch block)، بغض النظر عن الاتجاه." en="If the QRS shape takes an M shape or shows a clear notch, this indicates a bundle branch block, regardless of direction." />
          <BiLine ar="حصار الحزمة اليمنى (RBBB): يظهر النمط في V1 أو V2 على شكل RSR' (أذنين أرنب)." en="RBBB: the pattern appears in V1 or V2 as RSR' (rabbit ears)." />
          <BiLine ar="حصار الحزمة اليسرى (LBBB): يظهر النمط في V5 أو V6." en="LBBB: the pattern appears in V5 or V6." />
        </Box>
        <Box title="الخطوة 2 (لو الشكل طبيعي): الاتجاه" color="emerald">
          <BiLine ar="في V1/V2: لو R أكبر من S = طبيعي؛ لو معكوسة (Reversal of normal) = تضخم البطين الأيمن." en="In V1/V2: if R > S = normal; if reversed (reversal of normal) = right ventricular hypertrophy." />
          <BiLine ar="في V5/V6: لو R أكبر من S = طبيعي؛ لو معكوسة = مؤشر آخر لتضخم البطين الأيمن." en="In V5/V6: if R > S = normal; if reversed = another indicator of right ventricular hypertrophy." />
        </Box>
        <Box title="الخطوة 3 (لو الشكل والاتجاه طبيعيين): الفولت" color="amber">
          <BiLine ar="فولت مبالغ فيه (Exaggeration of normal) = تضخم البطين الأيسر (حسب معايير الفولت الموضحة في الجزء السابق)." en="Exaggerated voltage (exaggeration of normal) = left ventricular hypertrophy (per the voltage criteria in the previous part)." />
        </Box>
        <BiLine ar="ملحوظة مهمة: الكهرباء أساسًا موصلة للبطين (ventricle) — فمنطق الشكل يتعلق أساسًا بوجود حصار في الحزمة نفسها، بينما الاتجاه والفولت يخصان تضخم العضلة." en="Important note: electricity is essentially conducted to the ventricle — shape logic relates primarily to a block in the bundle itself, while direction and voltage relate to muscle hypertrophy." />
      </Section>

      {/* الجزء 10 */}
      <Section n={10} title="نقص التروية والاحتشاء (MI & Ischemia)" titleEn="Coronary ischemia & myocardial infarction" source="simple-ecg" open={openSection === 10} onToggle={() => toggle(10)}>
        <STCompareSVG />
        <BiLine ar="احتشاء عضلة القلب (Myocardial infarction) عبارة عن منطقة مركزية من النخر (Necrosis) محاطة بمنطقة تلف نسيجي محاطة بمنطقة نقص تروية (Ischemic pattern)." en="Myocardial infarction consists of a central area of necrosis surrounded by an area of tissue damage surrounded by an ischemic pattern." />
        <Box title="العلامات الثلاث على الـECG" color="rose">
          <BiLine ar="منطقة النخر (Area of necrosis) ← تظهر كموجة Q باثولوجية (pathological Q)." en="Area of necrosis → appears as a pathological Q wave." />
          <BiLine ar="منطقة التلف النسيجي (Tissue damage) ← تظهر كارتفاع في قطعة ST (elevated ST segment)." en="Tissue damage → appears as ST segment elevation." />
          <BiLine ar="منطقة نقص التروية (Ischemia) ← تظهر كموجة T مقلوبة (inverted T wave) أو مدببة." en="Ischemia → appears as an inverted or peaked T wave." />
        </Box>
        <BiLine ar="موجة Q الباثولوجية تظهر أولًا خلال 6-10 ساعات من الاحتشاء ولا تختفي أبدًا بعد ظهورها — هي البصمة الدائمة للاحتشاء القديم (finger print of MI is the pathological Q)." en="The pathological Q wave first appears within 6-10 hours of the infarction and never disappears once it appears — it's the permanent fingerprint of an old MI." />
        <Box title="كيف نفرّق بين احتشاء حديث (Recent) وقديم (Old)؟" color="amber">
          <BiLine ar="موجة Q باثولوجية + ارتفاع ST قائم = احتشاء حديث (Recent MI) — الارتفاع دليل على أن العملية ما زالت نشطة." en="Pathological Q + still-elevated ST = recent MI — the elevation shows the process is still active." />
          <BiLine ar="موجة Q باثولوجية فقط بدون ارتفاع ST (Once elevated ST segment ثم زال) = احتشاء قديم (Old MI)." en="Pathological Q alone, without ST elevation (once elevated, now resolved) = old MI." />
          <BiLine ar="ممكن شخص يكون عنده Old MI في منطقة (مثلًا سفلي) وRecent MI في منطقة تانية (مثلًا أمامي) في نفس الوقت — كل Lead بتترجم بمفرده." en="A person can have an old MI in one territory (e.g. inferior) and a recent MI in another (e.g. anterior) at the same time — each lead is interpreted on its own." />
        </Box>
        <Box title="تحديد مكان الاحتشاء (Topographism)" color="sky">
          <BiLine ar="V1-V2 (احتشاء أمامي/حاجزي) — Anterior/Septal، يغذيه غالبًا الشريان الأمامي النازل (LAD)." en="V1-V2 (anterior/septal) — usually supplied by the LAD." />
          <BiLine ar="II, III, aVF (احتشاء سفلي) — Inferior، يغذيه غالبًا الشريان التاجي الأيمن (RCA)." en="II, III, aVF (inferior) — usually supplied by the RCA." />
          <BiLine ar="I, aVL, V5, V6 (احتشاء جانبي) — Lateral، يغذيه غالبًا الشريان الظرفي (LCx)." en="I, aVL, V5, V6 (lateral) — usually supplied by the LCx." />
        </Box>
        <BiLine ar="نقص التروية (Ischemia) بدون احتشاء كامل يظهر كانخفاض في قطعة ST (Depressed ST segment) فقط، ونحدد مكانه بنفس جدول التوپوجرافيا." en="Ischemia without full infarction appears only as ST segment depression, and its location is determined using the same topography table." />
      </Section>

      {/* الجزء 11 */}
      <Section n={11} title="حصار القلب (Heart Block)" titleEn="AV heart block — three degrees" source="simple-ecg" open={openSection === 11} onToggle={() => toggle(11)}>
        <BiLine ar="المقصود أساسًا بمصطلح Heart block هنا هو حصار العقدة الأذينية البطينية (A.V. nodal block) — أي مشكلة في توصيل الكهرباء عبر العقدة الأذينية البطينية." en="'Heart block' here mainly refers to A.V. nodal block — a problem in conducting electricity through the AV node." />
        <Box title="الدرجة الأولى (First-degree)" color="sky">
          <BiLine ar="العقدة الأذينية البطينية متكسلة شوية بس بتوصل كل حاجة — يعني كل موجة P متبوعة بـQRS، لكن فترة PR مطوّلة وثابتة (Just prolonged PR interval)." en="The AV node is a bit sluggish but still conducts everything — every P is followed by a QRS, but the PR interval is prolonged and constant." />
          <BiLine ar="الفرق عن بطء الجيوب الأنفية (Sinus bradycardia): في بطء الجيوب المعدل نفسه بطيء، أما هنا فقط PR طويلة والمعدل قد يكون طبيعيًا." en="Difference from sinus bradycardia: in sinus bradycardia the rate itself is slow, while here only the PR is prolonged and the rate may be normal." />
        </Box>
        <Box title="الدرجة الثانية (Second-degree) — نوعان" color="amber">
          <BiLine ar="Mobitz One (Wenckebach): العقدة تتعبت أكتر — فترة PR تطول تدريجيًا (progressive prolongation) حتى تسقط ضربة QRS كاملة، ثم تعيد الدورة من جديد. الإيقاع هنا Irregular." en="Mobitz One (Wenckebach): the node gets progressively more tired — PR lengthens progressively until a whole QRS is dropped, then the cycle repeats. The rhythm is irregular." />
          <BiLine ar="Mobitz Two: العقدة مصابة لكن منظمة بتوزيع مجهودها — إسقاط منتظم لـQRS (regular drop of QRS) بنسبة ثابتة مثل 2:1 أو 3:1، دون إطالة تدريجية في PR. الإيقاع هنا Regular." en="Mobitz Two: the node is affected but conducts in an organized way — a regular drop of QRS at a fixed ratio like 2:1 or 3:1, without progressive PR lengthening. The rhythm is regular." />
          <p className="text-xs font-bold text-slate-500">قاعدة سريعة: كل أنواع حصار القلب منتظمة إلا Mobitz One. (Rule: all types of heart block are regular except Mobitz One.)</p>
        </Box>
        <Box title="الدرجة الثالثة (Third-degree / Complete heart block)" color="rose">
          <BiLine ar="العقدة الأذينية البطينية عاجزة تمامًا عن التوصيل — الأذين يعمل بمعدله الخاص (بقيادة SA node) والبطين يعمل بمعدله الخاص تمامًا (Idioventricular rhythm) من مصدر بديل (Ectopic focus)، بدون أي علاقة بينهما." en="The AV node is completely unable to conduct — the atrium beats at its own rate (led by the SA node) and the ventricle beats entirely at its own rate (idioventricular rhythm) from an alternate ectopic focus, with no relationship between them." />
          <BiLine ar="هذا يُسمى A.V. dissociation (انفصال أذيني بطيني كامل)، وموجة P بتمشي لوحدها زي الفل بدون علاقة بمكان ظهور QRS (قد تظهر قبله أو بعده أو داخله)، وشكل QRS يكون Deformed/Bizarre shaped لأن مصدره من البطين نفسه." en="This is called complete AV dissociation; the P wave marches through independently with no relation to where QRS falls (before, after, or within it), and the QRS is deformed/bizarre-shaped since it originates in the ventricle itself." />
          <p className="text-xs font-bold text-slate-500">قاعدة سريعة: كل أنواع حصار القلب QRS طبيعي فيها إلا الدرجة الثالثة (Complete heart block). (All types of heart block have a normal QRS complex except third-degree.)</p>
        </Box>
      </Section>

      {/* الجزء 12 */}
      <Section n={12} title="اضطرابات النظم: منتظم أم غير منتظم؟" titleEn="Arrhythmias — a systematic approach" source="simple-ecg" open={openSection === 12} onToggle={() => toggle(12)}>
        <BiLine ar="أول حاجة تعملها وأنت بتقرأ أي شريط طويل (Long strip): تحدد الإيقاع منتظم (Regular) ولا لأ (Irregular)." en="The first thing to do when reading any long strip: determine whether the rhythm is regular or irregular." />
        <Box title="لو الإيقاع غير منتظم (Irregular) — 3 احتمالات" color="rose">
          <BiLine ar="رجفان أذيني (Atrial fibrillation): موجة P غائبة تمامًا (Absent P)، والمعدل غالبًا سريع (تسرّع) لكن ممكن يكون بطيء في حالات نادرة (تأثير ديجوكسين، حاصرات بيتا، حصار قلب مصاحب، أو AF منفرد Lone AF)." en="Atrial fibrillation: P wave completely absent, rate usually fast but can rarely be slow (digitalis, beta-blockers, associated heart block, or lone AF)." />
          <BiLine ar="الانقباض المبكر الإضافي (Extra systole/PVC): ضربة مبكرة فجأة وسط إيقاع منتظم، بعدها وقفة تعويضية طويلة (Compensatory pause) لأن القلب دخل فترة Refractory period ولا يستجيب لأي منبه لحظيًا." en="Extra systole/PVC: a sudden early beat amid a regular rhythm, followed by a long compensatory pause because the heart enters a refractory period and won't respond to any stimulus momentarily." />
          <BiLine ar="Mobitz One (Wenckebach): موجة P موجودة بس مهملة (متلاقيها وسط الهبلة)، والإيقاع Irregular بسبب الضربة الساقطة الدورية." en="Mobitz One: P wave present but easy to overlook, rhythm irregular due to the periodic dropped beat." />
        </Box>
        <Box title="لو الإيقاع منتظم (Regular) — ابصي على الـRate الأول" color="sky">
          <BiLine ar="لو Rate سريع (Tachycardia) — أربع احتمالات: تسرع جيبي (Sinus tachycardia)، تسرع بطيني (Ventricular tachycardia)، تسرع فوق بطيني (Supra ventricular tachycardia)، أو رفرفة أذينية (Atrial flutter)." en="If rate is fast (tachycardia) — four possibilities: sinus tachycardia, ventricular tachycardia, supraventricular tachycardia, or atrial flutter." />
          <BiLine ar="تسرّع الجيوب الأنفية: كل حاجة طبيعية ماشية بس بسرعة — موجة P طبيعية متبوعة دائمًا بـQRS وT (P followed by QRS T)، فقط أسرع من الطبيعي." en="Sinus tachycardia: everything normal, just faster — a normal P wave always followed by QRS and T, just at a higher rate." />
          <BiLine ar="تسرع بطيني (VT): مجموعة QRS عريضة ومشوّهة (deformed) وسريعة جدًا، لدرجة أن الحدود بين QRS وT بتضيع وتندمج مع بعضها." en="Ventricular tachycardia: wide, deformed QRS complexes at a very fast rate, to the point that the boundary between QRS and T is lost and they merge." />
          <BiLine ar="تسرع فوق بطيني (SVT): يأتي إما من الأذين مباشرة أو من العقدة الأذينية البطينية. لو من الأذين، موجة P قد تكون Deformed. لو من العقدة، موجة P تكون Inverted (بالعكس) لأن التيار يجيء من أسفل لأعلى، أو تكون Absent تمامًا لأنها اندمجت داخل QRS (Masked by QRS)." en="SVT: comes either directly from the atrium or from the AV node. If from the atrium, P may be deformed. If from the node, P is inverted (current runs bottom-up) or completely absent, masked within the QRS." />
          <BiLine ar="الرفرفة الأذينية (Atrial flutter): الأذين بيضرب بسرعة جدًا بعلاقة رياضية منتظمة (Reduction) مع البطين، فتظهر موجات على شكل أسنان المنشار (Sawtooth appearance) — والفرق الجوهري بينها وبين الرجفان الأذيني أن الرفرفة أساسًا منتظمة (Regular) بينما الرجفان غير منتظم (Irregular)." en="Atrial flutter: the atrium beats very fast with a regular mathematical conduction ratio to the ventricle, producing sawtooth-shaped waves — the key difference from AFib is that flutter is regular while fibrillation is irregular." />
          <BiLine ar="لو Rate بطيء (Bradycardia) — خمس احتمالات: بطء الجيوب الأنفية (Sinus bradycardia)، حصار الدرجة الأولى، Mobitz Two، حصار الدرجة الثالثة، أو الإيقاع العقدي (Nodal rhythm)." en="If rate is slow (bradycardia) — five possibilities: sinus bradycardia, first-degree block, Mobitz Two, third-degree block, or nodal rhythm." />
          <BiLine ar="طريقة التفريق: ابصي على مجموعة QRS أولًا — Deformed تدل غالبًا على حصار الدرجة الثالثة (مفيش غيره)، أما Narrow/normal فابصي بعدها على موجة P: لو single = بطء جيوب أو حصار درجة أولى (فرّق بينهم بفحص PR interval)، لو multiple = Mobitz Two." en="Method: check QRS first — deformed usually means third-degree block (nothing else fits), while narrow/normal means checking the P wave next: single = sinus bradycardia or first-degree (differentiate by checking the PR interval), multiple = Mobitz Two." />
          <BiLine ar="الإيقاع العقدي (Nodal rhythm): العقدة الأذينية البطينية بقت هي منظم ضربات القلب (Peace maker) بدل العقدة الجيبية، فتظهر موجة P مقلوبة (Inverted) لأن الإشارة جاية من تحت لفوق." en="Nodal rhythm: the AV node becomes the pacemaker instead of the SA node, so the P wave appears inverted since the signal comes from below upward." />
        </Box>
      </Section>

      {/* الجزء 13 */}
      <Section n={13} title="الطريقة المنهجية: كيف تقرأ أي ECG (10 نقاط)" titleEn="How to interpret an ECG — the 10-point method" source="simple-ecg" open={openSection === 13} onToggle={() => toggle(13)}>
        <BiLine ar="لما تشوف أي ECG: ارتاحي وخدي نفس عميق، وابدأي تعلّقي على النقاط العشرة دي بالترتيب." en="When you see any ECG: relax and take a deep breath, then comment on these ten points in order." />
        <ol className="list-decimal space-y-2 pr-5 text-sm text-slate-700 dark:text-slate-200">
          <li><b>الإيقاع (Rhythm):</b> جيبي ولا لأ؟ منتظم ولا لأ؟ <span className="text-slate-400">(Sinus or not; Regular or not)</span></li>
          <li><b>المعدل (Rate):</b> منتظم = 300 ÷ عدد المربعات الكبيرة بين R-R. غير منتظم = عدّ موجات R في 30 مربع كبير (6 ثوانٍ) واضربها في 10.</li>
          <li><b>المحور (Axis):</b> Lead واحد و aVF موجبين = Normal؛ واحد سالب = انحراف حسب أيهما.</li>
          <li><b>موجة P:</b> مسافتها أقل من 2.5×2.5 مربع صغير؛ أطول من 2.5 عرضًا = Left atrial strain (M shaped)؛ أطول من 2.5 ارتفاعًا = Right atrial strain (Peaked).</li>
          <li><b>فترة PR:</b> مقاساتها من 3 إلى 5 مربعات صغيرة، وهي المسافة من بداية P إلى بداية QRS complex.</li>
          <li><b>مجموعة QRS:</b> Q = أول موجة سالبة، R = أول موجة موجبة، S = الموجة السالبة التالية لـR (لازم تكون بعد R).</li>
          <li><b>قطعة ST:</b> من نهاية S إلى بداية موجة T — مهمة جدًا في حالات الاحتشاء (MI).</li>
          <li><b>موجة T:</b> لا تغيب أبدًا (absent مستحيلة)، مقاساتها أقل من 6 مربعات صغيرة عرضًا وأقل من ثلث ارتفاع R التي قبلها.</li>
          <li><b>فترة QT:</b> من بداية QRS لنهاية T، طبيعيًا 0.44 ثانية أو أقل.</li>
          <li><b>موجة U:</b> اختيارية، أوضح في V2-V4.</li>
        </ol>
        <BiLine ar="بعد النقاط العشرة دي، بإذن الله توصلي للتشخيص (Diagnosis) — لو ما وصلتيش، هنجأ للإسكيمات (خوارزمية التشخيص) في الجزء الجاي." en="After these ten points, you should reach a diagnosis — if not, we resort to the diagnostic algorithm in the next part." />
      </Section>

      {/* الجزء 14 */}
      <Section n={14} title="خوارزمية التشخيص العملية خطوة بخطوة" titleEn="Practical diagnostic algorithm" source="simple-ecg" open={openSection === 14} onToggle={() => toggle(14)}>
        <Box title="الخطوة 1 — الإيقاع (Rhythm)" color="sky">
          <BiLine ar="نظّمي: Regular ولا Irregular؟" en="Organize: regular or irregular?" />
          <BiLine ar="لو Irregular: راجعي الجزء 12 (رجفان أذيني، Extra systole، أو Mobitz One)." en="If irregular: revisit part 12 (AFib, extra systole, or Mobitz One)." />
        </Box>
        <Box title="الخطوة 2 — المعدل (Rate) لو منتظم" color="emerald">
          <BiLine ar="Tachycardia منتظم: راجعي الجزء 12 (Sinus/VT/SVT/Atrial flutter)." en="Regular tachycardia: revisit part 12 (Sinus/VT/SVT/Atrial flutter)." />
          <BiLine ar="Bradycardia منتظم: راجعي الجزء 12 (Sinus bradycardia/1st degree/Mobitz Two/3rd degree/Nodal)." en="Regular bradycardia: revisit part 12 (Sinus bradycardia/1st degree/Mobitz Two/3rd degree/Nodal)." />
        </Box>
        <Box title="الخطوة 3 — التفريق النهائي بفحص QRS ثم P" color="amber">
          <BiLine ar="QRS مشوّهة (Deformed/Bizarre) = عادة حصار الدرجة الثالثة أو منشأ بطيني — لا يوجد بديل آخر عادة." en="Deformed/bizarre QRS = usually third-degree block or ventricular origin — usually no other alternative." />
          <BiLine ar="QRS ضيقة وطبيعية (Narrow/normal) = ابصي على عدد موجات P: واحدة (Single) لكل QRS، أو أكتر (Multiple) بدون QRS مقابل لكل واحدة." en="Narrow/normal QRS = check the number of P waves: single per QRS, or multiple without a QRS for each." />
        </Box>
        <Box title="الخطوة 4 — قطعة ST وموجة T (لو الشك في MI/Ischemia)" color="rose">
          <BiLine ar="ابحثي عن موجة Q باثولوجية (النخر) + ارتفاع/انخفاض ST (التلف/نقص التروية) + انقلاب T، وحددي مكانها بجدول التوپوجرافيا لمعرفة الشريان المسؤول." en="Look for a pathological Q (necrosis) + ST elevation/depression (damage/ischemia) + T inversion, and locate them using the topography table to identify the responsible artery." />
        </Box>
        <BiLine ar="خلاصة عملية: بعد Long strip، هتشوفي rhythm الأول (Regular/Irregular)، ولو Regular هتشوفي Rate (Tachy/Brady)، وبعدين تلاقيي فيها حاجة أخيرة بتفرّق بينهم زي QRS شكله إيه وP وحدة ولا أكتر." en="Practical summary: after a long strip, check rhythm first, then rate if regular, then a final distinguishing feature like QRS shape and whether P is single or multiple." />
      </Section>

      {/* الجزء 15 */}
      <Section n={15} title="أسباب أخرى تظهر في الـECG + التداخلات وأسبابها" titleEn="Other causes on the ECG & technical interference" source="both" open={openSection === 15} onToggle={() => toggle(15)}>
        <Box title="حالات مهددة للحياة تظهر أولًا على الـECG (بدون مرض قلب أو رئة أساسي)" color="rose">
          <BiLine ar="الحوادث الدماغية الوعائية (خصوصًا النزيف داخل الجمجمة)." en="Cerebrovascular accidents (especially intracranial bleed)." />
          <BiLine ar="سمية الأدوية: جرعة زائدة من مضادات الاكتئاب ثلاثية الحلقات، فرط الديجيتالس، وغيرها." en="Drug toxicity: tricyclic antidepressant overdose, digitalis excess, etc." />
          <BiLine ar="اختلالات الكهارل: نقص أو فرط بوتاسيوم الدم، نقص أو فرط كالسيوم الدم." en="Electrolyte disorders: hypo/hyperkalemia, hypo/hypercalcemia." />
          <BiLine ar="اضطرابات الغدد الصماء: قصور أو فرط نشاط الغدة الدرقية." en="Endocrine disorders: hypothyroidism, hyperthyroidism." />
          <BiLine ar="انخفاض حرارة الجسم (Hypothermia)." en="Hypothermia." />
        </Box>
        <BiLine ar="من الأطروحة: نقص بوتاسيوم الدم — نتيجة إنزيم ATPase الذي يحافظ على فرق تركيز البوتاسيوم داخل وخارج الخلية (150 مليمول/لتر داخل الخلية) — يسبب خللًا وظيفيًا واضطرابًا في دقات القلب، وفرطه يؤدي لاضطراب النظم حتى رجفان البطين وتوقف القلب." en="From the thesis: potassium — maintained inside/outside the cell by the ATPase enzyme (150 mmol/L intracellularly) — a deficit causes functional dysfunction and heart-rate disturbance, while an excess can lead to arrhythmia up to ventricular fibrillation and cardiac arrest." />
        <Box title="التداخلات التقنية أثناء التسجيل وأسبابها وحلولها (من الأطروحة)" color="sky">
          <BiLine ar="التداخلات التنفسية: ناتجة عن حركة صدر المريض أثناء التنفس — الحل: اطلبي من المريض حبس النفس لعدة ثوانٍ أثناء التسجيل." en="Respiratory interference: caused by chest movement during breathing — solution: ask the patient to hold their breath for a few seconds during recording." />
          <BiLine ar="التداخلات الجسمية: ناتجة عن تأثير حركة عضلات الجسم — الحل: يجب أن يكون المريض في وضع استرخاء تام." en="Somatic interference: caused by body muscle movement — solution: the patient must be in a fully relaxed position." />
          <BiLine ar="التداخلات الكهربائية: تأكدي من تثبيت الأسلاك بشكل صحيح، ووجود سلك أرضي متصل، ووجود مادة الجلاتين (الجل) تحت الأقطاب، وخلع المريض ملابسه الصوفية والقطع المعدنية، وعدم وجود أجهزة كهربائية أخرى قريبة، وتجنّب الأسرّة المعدنية غير المؤرضة." en="Electrical interference: check that leads are correctly attached, a ground wire is connected, gel is present under the electrodes, the patient has removed woolen clothing/metal items, no other electrical devices are nearby, and metal beds are avoided unless grounded." />
        </Box>
        <BiLine ar="مصادر التشويش الخارجية على الجهاز نفسه: الموجات الكهرومغناطيسية ومحطات الإرسال، المحركات الكهربائية، الأجهزة الإلكترونية عالية التردد، أبراج الضغط العالي، ومصادر طبيعية مثل البرق والرعد." en="External sources of interference on the device itself: electromagnetic waves and transmission stations, electric motors, high-frequency electronic devices, high-voltage towers, and natural sources like lightning and thunder." />
      </Section>

      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
        ✅ المرجع اكتمل بالكامل الآن (١٥ جزء) من المصدرين، من الصفر حتى الاحتراف.
      </div>
    </div>
  );
}
