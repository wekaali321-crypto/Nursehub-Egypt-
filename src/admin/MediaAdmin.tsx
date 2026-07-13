import { useRef, useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { uploadFile, MAX_FILE_SIZE } from "../lib/storage";
import type { MediaItem } from "../lib/types";

const icons: Record<string, string> = { image: "🖼️", video: "🎬", pdf: "📄", doc: "📝", ppt: "📊", excel: "📈" };

function PreviewModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-4 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="truncate font-bold dark:text-white">{item.name}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">✕</button>
        </div>
        {item.type === "image" && <img src={item.url} alt={item.name} className="mx-auto max-h-[70vh] rounded-lg" />}
        {item.type === "video" && <video src={item.url} controls className="mx-auto max-h-[70vh] w-full rounded-lg" />}
        {item.type === "pdf" && (item.url !== "#"
          ? <iframe src={item.url} title={item.name} className="h-[70vh] w-full rounded-lg" />
          : <div className="py-12 text-center text-slate-400">معاينة PDF تتطلب رفع الملف إلى Supabase Storage.</div>)}
        {["doc", "ppt", "excel"].includes(item.type) && (
          <div className="py-12 text-center">
            <div className="text-6xl">{icons[item.type]}</div>
            <p className="mt-3 text-slate-500 dark:text-slate-400">{item.name}</p>
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">فتح / تحميل</a>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <input readOnly value={item.url} className="flex-1 bg-transparent text-xs outline-none dark:text-slate-300" />
          <button onClick={() => { navigator.clipboard?.writeText(item.url); }} className="rounded bg-sky-500 px-3 py-1 text-xs font-bold text-white">نسخ الرابط</button>
        </div>
      </div>
    </div>
  );
}

export default function MediaAdmin() {
  const { media, folders, setData, logActivity, backend, moveToTrash } = useStore();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [folder, setFolder] = useState("f-root");
  const [newFolder, setNewFolder] = useState("");
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_SIZE) { notify(`${f.name} يتجاوز 200MB`, "error"); continue; }
      try {
        const { item } = await uploadFile(f, folder);
        setData((d) => ({ ...d, media: [item, ...d.media] }));
        ok++;
      } catch (err) {
        notify(`فشل رفع ${f.name}`, "error");
      }
    }
    setUploading(false);
    if (ok) { logActivity("رفع وسائط", `${ok} ملف`); notify(`تم رفع ${ok} ملف بنجاح${backend === "supabase" ? " إلى Supabase Storage" : ""}`); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const del = async (item: MediaItem) => {
    if (!confirm("نقل هذا الملف إلى سلة المحذوفات؟")) return;
    moveToTrash("media", item, item.name);
    notify("نُقل إلى سلة المحذوفات");
  };

  const rename = (item: MediaItem) => {
    const name = prompt("الاسم الجديد:", item.name);
    if (name && name.trim()) {
      setData((d) => ({ ...d, media: d.media.map((m) => (m.id === item.id ? { ...m, name } : m)) }));
      notify("تم تغيير الاسم");
    }
  };

  const copyUrl = (url: string) => { navigator.clipboard?.writeText(url); notify("تم نسخ الرابط", "success"); };
  const moveTo = (id: string, target: string) => setData((d) => ({ ...d, media: d.media.map((m) => (m.id === id ? { ...m, folder: target } : m)) }));

  const addFolder = () => {
    if (!newFolder.trim()) return;
    setData((d) => ({ ...d, folders: [...d.folders, { id: "f" + Date.now(), name: newFolder }] }));
    setNewFolder(""); notify("تم إنشاء المجلد");
  };
  const delFolder = (id: string) => {
    if (id === "f-root") return;
    setData((d) => ({ ...d, folders: d.folders.filter((f) => f.id !== id), media: d.media.map((m) => (m.folder === id ? { ...m, folder: "f-root" } : m)) }));
    if (folder === id) setFolder("f-root");
  };

  let list = media.filter((m) => (m.folder ?? "f-root") === folder);
  if (filter !== "all") list = list.filter((m) => m.type === filter);
  if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}

      {/* Folders sidebar */}
      <aside className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 text-sm font-bold dark:text-white">📁 المجلدات</h3>
          <div className="space-y-1">
            {folders.map((f) => (
              <div key={f.id} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${folder === f.id ? "bg-sky-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <button onClick={() => setFolder(f.id)} className="flex-1 text-right font-semibold">{f.name} ({media.filter((m) => (m.folder ?? "f-root") === f.id).length})</button>
                {f.id !== "f-root" && <button onClick={() => delFolder(f.id)} className="text-xs opacity-70 hover:opacity-100">✕</button>}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="مجلد جديد" className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <button onClick={addFolder} className="rounded-lg bg-emerald-500 px-2 text-sm font-bold text-white">+</button>
          </div>
        </div>
        <div className={`rounded-2xl border p-3 text-center text-xs ${backend === "supabase" ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-500/10" : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-500/10"}`}>
          {backend === "supabase" ? "✅ متصل بـ Supabase Storage" : "⚙️ وضع محلي — أضف مفاتيح Supabase للرفع السحابي"}
        </div>
      </aside>

      <div className="space-y-4">
        {/* Drag & drop zone */}
        <label
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-sky-500 bg-sky-100 dark:bg-sky-500/10" : "border-sky-300 bg-sky-50 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-500/5"}`}
        >
          <span className="text-4xl">{uploading ? "⏳" : "📤"}</span>
          <span className="mt-2 font-bold text-sky-600">{uploading ? "جارٍ الرفع..." : "اسحب وأفلت الملفات هنا أو اضغط للرفع"}</span>
          <span className="text-sm text-slate-400">صور (WebP تلقائي)، فيديو، PDF، Word، Excel، PowerPoint — رفع متعدد حتى 200MB/ملف</span>
          <input type="file" multiple className="hidden" onChange={handleInput} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" />
        </label>

        {/* Mobile capture */}
        <div className="grid grid-cols-3 gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            📷 صورة<input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInput} />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            🎥 فيديو<input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleInput} />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            🖼️ المعرض<input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleInput} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["all", "image", "video", "pdf", "doc", "excel", "ppt"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{f === "all" ? "الكل" : icons[f]}</button>
            ))}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث في الملفات..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((m) => (
            <div key={m.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <button onClick={() => setPreview(m)} className="flex h-28 w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                {m.type === "image" && m.url !== "#" ? <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-4xl">{icons[m.type]}</span>}
              </button>
              <div className="p-2">
                <div className="truncate text-xs font-semibold dark:text-white" title={m.name}>{m.name}</div>
                <div className="text-[10px] text-slate-400">{m.size}</div>
                <select value={m.folder ?? "f-root"} onChange={(e) => moveTo(m.id, e.target.value)} className="mt-1 w-full rounded border border-slate-200 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">
                  {folders.map((f) => <option key={f.id} value={f.id}>نقل إلى: {f.name}</option>)}
                </select>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <button onClick={() => copyUrl(m.url)} title="نسخ الرابط" className="rounded bg-sky-100 py-1 text-[10px] font-bold text-sky-600 dark:bg-sky-500/10">🔗</button>
                  <button onClick={() => rename(m)} title="إعادة تسمية" className="rounded bg-amber-100 py-1 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">✏️</button>
                  <button onClick={() => del(m)} title="حذف" className="rounded bg-red-100 py-1 text-[10px] font-bold text-red-600 dark:bg-red-500/10">🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="col-span-full py-8 text-center text-slate-400">لا توجد ملفات في هذا المجلد</div>}
        </div>
      </div>
    </div>
  );
}
