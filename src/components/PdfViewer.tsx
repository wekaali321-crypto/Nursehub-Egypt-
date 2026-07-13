/** In-site PDF preview modal. Falls back gracefully when no real URL exists. */
export default function PdfViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const valid = url && url !== "#" && (url.startsWith("http") || url.startsWith("blob:") || url.endsWith(".pdf"));
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <h3 className="truncate font-bold dark:text-white">📄 {title}</h3>
          <div className="flex gap-2">
            {valid && <a href={url} target="_blank" rel="noreferrer" className="rounded-lg bg-sky-500 px-3 py-1 text-sm font-bold text-white">فتح</a>}
            <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-white">✕</button>
          </div>
        </div>
        {valid ? (
          <iframe src={url} title={title} className="h-[75vh] w-full" />
        ) : (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-6xl">📄</div>
            <p className="font-bold dark:text-white">معاينة الملف غير متاحة</p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              سيتم عرض معاينة الـ PDF داخل الموقع بعد رفع الملف إلى Supabase Storage وربط الرابط بالمنتج.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
