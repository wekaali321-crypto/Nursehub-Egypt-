import { useState } from "react";

/* =========================================================
   بيانات أسئلة الاختيار من متعدد — العلامات الحيوية
   correct = index الإجابة الصحيحة (يبدأ من 0)
   ========================================================= */
const MCQ_DATA = [
  {
    q: "أي مما يلي يُعدّ من العلامات الحيوية الأساسية؟",
    options: ["Blood Glucose", "Heart Sounds", "Pulse", "ECG"],
    correct: 2,
    explain:
      "النبض (Pulse) من العلامات الحيوية الخمسة الأساسية (الحرارة، النبض، التنفس، الضغط، SpO₂). أما سكر الدم وأصوات القلب ورسم القلب فهي فحوصات مكمّلة وليست علامات حيوية.",
  },
  {
    q: "المعدل الطبيعي للنبض في البالغين هو:",
    options: ["40–60 bpm", "60–100 bpm", "100–140 bpm", "120–160 bpm"],
    correct: 1,
    explain:
      "المعدل الطبيعي لنبض البالغ وقت الراحة 60–100 نبضة/دقيقة. أقل من 60 = Bradycardia، وأكثر من 100 = Tachycardia (مع مراعاة السياق السريري والأدوية).",
  },
  {
    q: "لماذا لا يُستخدم الإبهام عند قياس النبض؟",
    options: [
      "لأنه ضعيف",
      "لأنه يحتوي على نبض خاص بالفاحص",
      "لأنه مؤلم للمريض",
      "لأنه لا يصل للشريان",
    ],
    correct: 1,
    explain:
      "للإبهام نبضٌ خاص بالفاحص قد يختلط بنبض المريض ويُعطي قراءة خاطئة، لذلك نستخدم السبابة والوسطى فقط.",
  },
  {
    q: "أي موضع لا يُنصح بقياس ضغط الدم فيه؟",
    options: [
      "الذراع السليمة",
      "الذراع في نفس جهة استئصال الثدي",
      "الذراع اليسرى",
      "الذراع اليمنى",
    ],
    correct: 1,
    explain:
      "يُمنع قياس الضغط في ذراع بها AV Fistula أو في نفس جهة استئصال الثدي (Mastectomy) أو بها وذمة/قسطرة نشطة، تجنباً للمضاعفات (مثل Lymphedema).",
  },
  {
    q: "المعدل الطبيعي لمعدل التنفس في البالغين هو:",
    options: ["8–10/min", "12–20/min", "24–30/min", "30–40/min"],
    correct: 1,
    explain:
      "معدل التنفس الطبيعي للبالغ 12–20 نفس/دقيقة. أقل من 12 = Bradypnea، وأكثر من 20 = Tachypnea.",
  },
  {
    q: "SpO₂ = 88% في مريض بالغ — ما التصنيف الصحيح؟",
    options: [
      "طبيعي",
      "يحتاج متابعة فقط",
      "يحتاج تقييمًا سريعًا",
      "Red Flag — تدخل عاجل مطلوب",
    ],
    correct: 3,
    explain:
      "أي قيمة أقل من 90% تُعدّ Red Flag تدل على نقص أكسجة شديد وتستلزم تدخلاً عاجلاً (O₂ + إبلاغ فوري). التقييم السريع يكون عند <92%.",
  },
  {
    q: "NEWS2 Score = 8 — ما الإجراء المناسب؟",
    options: [
      "قياس روتيني",
      "زيادة تكرار المراقبة",
      "إبلاغ الطبيب خلال ساعة",
      "طوارئ — إبلاغ فوري — تقييم ICU",
    ],
    correct: 3,
    explain:
      "NEWS2 ≥ 7 يعني خطراً عالياً جداً ويستدعي تدخلاً طارئاً فورياً وتقييماً لنقل المريض إلى ICU/HDU.",
  },
  {
    q: "مريض يأخذ Metoprolol — HR = 55 bpm — ما أول خطوة؟",
    options: [
      "إعطاء Atropine فورًا",
      "إبلاغ الطبيب فورًا",
      "مراجعة Baseline المريض وأوامر الطبيب",
      "تجاهل القراءة",
    ],
    correct: 2,
    explain:
      "Beta Blockers تُبطئ القلب بشكل متوقع، لذا HR=55 قد يكون طبيعياً لهذا المريض. القاعدة: راجع الأدوية + الـ Baseline + الحالة السريرية قبل أي تصنيف.",
  },
  {
    q: "ما معادلة حساب MAP؟",
    options: [
      "SBP + DBP ÷ 2",
      "SBP – DBP",
      "(SBP + 2×DBP) ÷ 3",
      "SBP × DBP ÷ 2",
    ],
    correct: 2,
    explain:
      "MAP = (SBP + 2×DBP) ÷ 3، والهدف في Septic Shock هو MAP ≥ 65 mmHg لضمان ضخٍ كافٍ للأعضاء.",
  },
  {
    q: "qSOFA Score = 2 — ماذا يعني؟",
    options: [
      "طبيعي لا يحتاج تدخلًا",
      "يحتاج مراقبة فقط",
      "احتمالية Sepsis عالية — أبلغ فورًا",
      "يحتاج ترطيبًا فقط",
    ],
    correct: 2,
    explain:
      "qSOFA ≥ 2 يدل على احتمالية عالية للإنتان (Sepsis) خارج ICU، ويستوجب إبلاغ الطبيب فوراً ومراجعة معايير Sepsis الكاملة.",
  },
];

const LETTERS = ["A", "B", "C", "D", "E"];

function MCQItem({ item, index }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === item.correct;

  const optionClass = (i) => {
    const base =
      "w-full text-right px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 font-medium";
    if (!revealed) {
      return selected === i
        ? `${base} border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200`
        : `${base} border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800`;
    }
    // بعد الكشف
    if (i === item.correct)
      return `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200`;
    if (i === selected)
      return `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-60`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-5">
      <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-700 text-white text-sm ml-2">
          {index + 1}
        </span>
        {item.q}
      </h4>

      <div className="space-y-2.5">
        {item.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !revealed && setSelected(i)}
            disabled={revealed}
            className={optionClass(i)}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                revealed && i === item.correct
                  ? "bg-green-500 text-white"
                  : revealed && i === selected
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {LETTERS[i]}
            </span>
            <span className="flex-1">{opt}</span>
            {revealed && i === item.correct && <span>✅</span>}
            {revealed && i === selected && i !== item.correct && <span>❌</span>}
          </button>
        ))}
      </div>

      {!revealed && (
        <button
          onClick={() => selected !== null && setRevealed(true)}
          disabled={selected === null}
          className={`mt-4 w-full md:w-auto px-6 py-2.5 rounded-xl font-bold transition-all ${
            selected === null
              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-blue-700 hover:bg-blue-800 text-white shadow-md hover:shadow-lg"
          }`}
        >
          تأكيد الإجابة
        </button>
      )}

      {revealed && (
        <div
          className={`mt-4 p-4 rounded-xl border-r-4 ${
            isCorrect
              ? "bg-green-50 dark:bg-green-900/20 border-green-500"
              : "bg-red-50 dark:bg-red-900/20 border-red-500"
          }`}
        >
          <p className="font-bold mb-1 text-slate-800 dark:text-slate-100">
            {isCorrect ? "🎉 إجابة صحيحة — أحسنت!" : "⚠️ إجابة خاطئة"}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold">الإجابة الصحيحة: </span>
            {LETTERS[item.correct]}) {item.options[item.correct]}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
            <span className="font-bold">💡 التفسير: </span>
            {item.explain}
          </p>
          <button
            onClick={() => {
              setRevealed(false);
              setSelected(null);
            }}
            className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline font-semibold"
          >
            ↻ إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}

export default function MCQQuiz() {
  return (
    <div>
      <p className="mb-5 text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
        📝 اختر إجابة لكل سؤال ثم اضغط <b>«تأكيد الإجابة»</b> — لن يظهر الحل إلا بعد اختيارك، لتختبر فهمك الحقيقي للمقال.
      </p>
      {MCQ_DATA.map((item, i) => (
        <MCQItem key={i} item={item} index={i} />
      ))}
    </div>
  );
}
