// رابط صورة الغلاف (ارفع الصورة في مجلد public/images/)
const COVER_IMAGE = "/images/vital-signs-cover.png";

export default function PdfViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <h3 className="truncate font-bold dark:text-white">📄 {title}</h3>
          <div className="flex gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="rounded-lg bg-sky-500 px-3 py-1 text-sm font-bold text-white hover:bg-sky-600 transition"
            >
              📥 تحميل
            </a>
            <button 
              onClick={onClose} 
              className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800 dark:text-white hover:bg-slate-200 transition"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* عرض صورة الغلاف بدل الـ PDF الكامل */}
        <div className="relative flex h-[75vh] w-full items-center justify-center bg-slate-100 dark:bg-slate-800 p-4">
          <img 
            src={COVER_IMAGE} 
            alt={`غلاف ${title}`} 
            className="max-h-full max-w-full rounded-lg shadow-lg object-contain"
          />
          {/* علامة مائية لمنع السرقة */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
            ⚠️ معاينة الغلاف فقط — حمّل الملف لقراءة المحتوى كاملاً
          </div>
        </div>
      </div>
    </div>
  );
}
