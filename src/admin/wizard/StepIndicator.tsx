import type { WizardStep } from "./types";

const STEPS: { n: WizardStep; label: string; icon: string }[] = [
  { n: 1, label: "الإدخال", icon: "📥" },
  { n: 2, label: "البنية والتفاصيل", icon: "🧱" },
  { n: 3, label: "تحسينات الذكاء الاصطناعي", icon: "✨" },
  { n: 4, label: "SEO والبيانات الوصفية", icon: "🔎" },
  { n: 5, label: "التحقق والنشر", icon: "🚀" },
];

export default function StepIndicator({ step, onJump }: { step: WizardStep; onJump: (s: WizardStep) => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <button
            onClick={() => s.n < step && onJump(s.n)}
            disabled={s.n > step}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
              s.n === step
                ? "bg-gradient-to-l from-sky-500 to-emerald-500 text-white shadow-md"
                : s.n < step
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800"
            }`}
          >
            <span>{s.n < step ? "✅" : s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <span className="text-slate-300 dark:text-slate-700">→</span>}
        </div>
      ))}
    </div>
  );
}
