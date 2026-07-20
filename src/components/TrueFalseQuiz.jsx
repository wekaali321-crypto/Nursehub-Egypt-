import { useState } from "react";

/* =========================================================
   بيانات أسئلة صح أم خطأ — العلامات الحيوية
   correct = true / false
   ========================================================= */
const TF_DATA = [
  {
    s: "درجة الحرارة المقاسة من الإبط أعلى من الفم.",
    correct: false,
    explain: "خطأ — الحرارة الإبطية أقل بـ ~0.5°C من الفموية، وليست أعلى.",
  },
  {
    s: "يجب إراحة المريض قبل قياس الضغط.",
    correct: true,
    explain: "صح — إراحة المريض 5 دقائق تمنع القراءة المرتفعة الكاذبة الناتجة عن النشاط أو القلق.",
  },
  {
    s: "يمكن استخدام الإبهام لقياس النبض.",
    correct: false,
    explain: "خطأ — للإبهام نبضٌ خاص بالفاحص قد يختلط بنبض المريض.",
  },
  {
    s: "يجب توثيق موضع قياس الحرارة.",
    correct: true,
    explain: "صح — القيم الطبيعية تختلف حسب الموضع (فم/إبط/مستقيم)، والتوثيق يمنع التفسير الخاطئ.",
  },
  {
    s: "SpO₂ < 90% يُعدّ Red Flag.",
    correct: true,
    explain: "صح — أقل من 90% يدل على نقص أكسجة شديد ويستلزم تدخلاً عاجلاً.",
  },
  {
    s: "BP > 140/90 عند الحامل يُشخَّص فورًا بـ Pre-eclampsia.",
    correct: false,
    explain: "خطأ — يستدعي تقييماً طبياً كاملاً فوراً، لكن لا يُشخَّص بتسمم الحمل من قراءة واحدة.",
  },
  {
    s: "MAP ≥ 65 mmHg هو الهدف في Septic Shock.",
    correct: true,
    explain: "صح — حسب إرشادات AACN/Surviving Sepsis لضمان ضخٍ كافٍ للأعضاء.",
  },
  {
    s: "Beta Blockers قد تجعل HR = 55 طبيعيًا للمريض.",
    correct: true,
    explain: "صح — تأثير دوائي متوقع؛ راجع الأدوية والـ Baseline قبل تصنيف القراءة.",
  },
  {
    s: "NEWS2 ≥ 7 يستدعي إبلاغًا فوريًا.",
    correct: true,
    explain: "صح — درجة 7 فأكثر تعني خطراً عالياً جداً وتدخلاً طارئاً فورياً.",
  },
];

function TFItem({ item, index }) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null); // true / false

  const choose = (val) => {
    if (revealed) return;
    setPicked(val);
    setRevealed(true);
  };

  const isCorrect = picked === item.correct;

  const btnClass = (val) => {
    const base =
      "flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2";
    if (!revealed)
      return `${base} border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`;
    // بعد الكشف
    if (val === item.correct)
      return `${base} border-green-500 bg-green-500 text-white`;
    if (val === picked)
      return `${base} border-red-500 bg-red-500 text-white`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-50 text-slate-500`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <p className="font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500 text-white text-sm ml-2">
          {index + 1}
        </span>
        {item.s}
      </p>

      <div className="flex gap-3">
        <button onClick={() => choose(true)} disabled={revealed} className={btnClass(true)}>
          ✅ صح
        </button>
        <button onClick={() => choose(false)} disabled={revealed} className={btnClass(false)}>
          ❌ غلط
        </button>
      </div>

      {revealed && (
        <div
          className={`mt-4 p-4 rounded-xl border-r-4 ${
            isCorrect
              ? "bg-green-50 dark:bg-green-900/20 border-green-500"
              : "bg-red-50 dark:bg-red-900/20 border-red-500"
          }`}
        >
          <p className="font-bold mb-1 text-slate-800 dark:text-slate-100">
            {isCorrect ? "🎉 إجابة صحيحة!" : "⚠️ إجابة خاطئة"}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold">الإجابة الصحيحة: </span>
            {item.correct ? "صح ✅" : "غلط ❌"}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
            <span className="font-bold">💡 التفسير: </span>
            {item.explain}
          </p>
          <button
            onClick={() => {
              setRevealed(false);
              setPicked(null);
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

export default function TrueFalseQuiz() {
  return (
    <div>
      <p className="mb-5 text-slate-600 dark:text-slate-400 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-200 dark:border-teal-800">
        ✅ اضغط <b>«صح»</b> أو <b>«غلط»</b> — سيظهر لك التفسير فور اختيارك.
      </p>
      {TF_DATA.map((item, i) => (
        <TFItem key={i} item={item} index={i} />
      ))}
    </div>
  );
}
