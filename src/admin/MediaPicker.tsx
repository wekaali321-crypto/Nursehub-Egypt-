import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { uploadFile, MAX_FILE_SIZE } from "../lib/storage";
import type { MediaItem } from "../lib/types";

const icons: Record<string, string> = { image: "🖼️", video: "🎬", pdf: "📄", doc: "📝", ppt: "📊", excel: "📈" };

/**
 * WordPress-style media picker modal: browse the library OR upload new files,
 * then pick one to insert into the editor. No manual URLs required.
 */
export default function MediaPicker({ onPick, onClose, accept }: { onPick: (item: MediaItem) => void; onClose: () => void; accept?: MediaItem["type"][] }) {
  const { media, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    let last: MediaItem | null = null;
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_SIZE) { notify(`${f.name} يتجاوز 200MB`, "error"); continue; }
      try { const { item } = await uploadFile(f); setData((d) => ({ ...d, media: [item, ...d.media] })); last = item; } catch { notify(`فشل رفع ${f.name}`, "error"); }
    }
    setUploading(false);
    if (last) { logActivity("رفع وسائط", last.name); notify("تم الرفع"); onPick(last); }
  };

  let list = media;
  if (accept) list = list.filter((m) => accept.includes(m.type));
  if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-bold dark:text-white">📚 مكتبة الوسائط</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">✕</button>
        </div>
        <div className="flex gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <button onClick={() => setTab("library")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "library" ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>المكتبة</button>
          <button onClick={() => setTab("upload")} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "upload" ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>رفع جديد</button>
          {tab === "library" && <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث..." className="mr-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "upload" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 p-10 text-center dark:border-sky-700 dark:bg-sky-500/5">
              <span className="text-4xl">{uploading ? "⏳" : "📤"}</span>
              <span className="mt-2 font-bold text-sky-600">{uploading ? "جارٍ الرفع..." : "اضغط للرفع أو التقاط من الكاميرا"}</span>
              <span className="text-sm text-slate-400">صور، فيديو، PDF، Word، Excel، PowerPoint</span>
              <input type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" />
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {list.map((m) => (
                <button key={m.id} onClick={() => onPick(m)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-right transition hover:border-sky-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-24 items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {m.type === "image" && m.url !== "#" ? <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-3xl">{icons[m.type]}</span>}
                  </div>
                  <div className="truncate p-1.5 text-[11px] font-semibold dark:text-white">{m.name}</div>
                </button>
              ))}
              {list.length === 0 && <div className="col-span-full py-10 text-center text-slate-400">المكتبة فارغة — ارفع ملفات أولاً</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
