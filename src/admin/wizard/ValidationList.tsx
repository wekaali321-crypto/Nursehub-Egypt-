import type { ValidationIssue } from "../../lib/importWizard";

export default function ValidationList({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-500/10">
        <span className="text-2xl">✅</span>
        <div>
          <div className="font-bold text-emerald-700 dark:text-emerald-400">لا توجد مشكلات — المقال جاهز للنشر!</div>
          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/70">تم فحص العناوين، الصور، التكرار، والمراجع.</div>
        </div>
      </div>
    );
  }
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  return (
    <div className="space-y-2">
      {errors.map((i, idx) => (
        <div key={`e${idx}`} className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900 dark:bg-rose-500/10">
          <span>🚫</span><span className="text-rose-700 dark:text-rose-400">{i.message}</span>
        </div>
      ))}
      {warnings.map((i, idx) => (
        <div key={`w${idx}`} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-500/10">
          <span>⚠️</span><span className="text-amber-700 dark:text-amber-400">{i.message}</span>
        </div>
      ))}
    </div>
  );
}
