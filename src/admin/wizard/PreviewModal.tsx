import { CATEGORY_LABELS, type Category } from "../../lib/types";

export default function PreviewModal({
  title, cover, category, author, mins, html, onClose,
}: {
  title: string; cover: string; category: Category; author: string; mins: number; html: string; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <h3 className="font-bold dark:text-white">👁️ معاينة المقال</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-white">✕</button>
        </div>
        <div className="overflow-y-auto p-6">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">{CATEGORY_LABELS[category]}</span>
          <h1 className="mt-3 text-2xl font-black dark:text-white">{title}</h1>
          <div className="mt-2 text-sm text-slate-400">✍️ {author} · ⏱ {mins} دقيقة قراءة</div>
          {cover && <img src={cover} alt={title} className="mt-4 w-full rounded-2xl object-cover" style={{ maxHeight: 320 }} />}
          <div className="prose-content mt-6 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
