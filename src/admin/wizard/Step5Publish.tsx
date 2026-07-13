import { useMemo, useState } from "react";
import { validateArticle, estimateReadingTime } from "../../lib/importWizard";
import ValidationList from "./ValidationList";
import PreviewModal from "./PreviewModal";
import type { Category } from "../../lib/types";

type Status = "draft" | "published" | "scheduled" | "private";

export default function Step5Publish({
  title, html, cover, category, author, references, busy, onBack, onPublish,
}: {
  title: string;
  html: string;
  cover: string;
  category: Category;
  author: string;
  references: string;
  busy: boolean;
  onBack: () => void;
  onPublish: (status: Status, publishDate: string) => void;
}) {
  const issues = useMemo(() => validateArticle({ title, html, references }), [title, html, references]);
  const hasErrors = issues.some((i) => i.level === "error");
  const mins = useMemo(() => estimateReadingTime(html), [html]);
  const [status, setStatus] = useState<Status>("draft");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPreview, setShowPreview] = useState(false);

  const statusOptions: { id: Status; label: string; icon: string; color: string }[] = [
    { id: "draft", label: "مسودة", icon: "📄", color: "slate" },
    { id: "published", label: "نشر فوري", icon: "🚀", color: "emerald" },
    { id: "scheduled", label: "جدولة", icon: "🕒", color: "amber" },
    { id: "private", label: "خاص", icon: "🔒", color: "violet" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black dark:text-white">🚀 التحقق والنشر</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">راجع نتائج الفحص الآلي قبل النشر النهائي.</p>
      </div>

      <ValidationList issues={issues} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 font-bold dark:text-white">حالة النشر</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statusOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${status === s.id ? "border-sky-400 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-700"}`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs font-bold dark:text-white">{s.label}</span>
            </button>
          ))}
        </div>
        {status === "scheduled" && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-slate-500">تاريخ النشر المجدول</label>
            <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button onClick={onBack} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">→ رجوع</button>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowPreview(true)} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">👁️ معاينة</button>
          <button
            disabled={hasErrors || busy}
            onClick={() => onPublish(status, status === "scheduled" ? publishDate : new Date().toISOString().slice(0, 10))}
            className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "⏳ جارٍ الحفظ..." : status === "published" ? "🚀 نشر الآن" : status === "scheduled" ? "🕒 جدولة النشر" : "💾 حفظ"}
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewModal title={title} cover={cover} category={category} author={author} mins={mins} html={html} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
