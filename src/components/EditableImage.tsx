import { useRef, useState, type ReactNode } from "react";
import { Camera, Eye, EyeOff, ImagePlus, Pencil, RotateCcw, X } from "lucide-react";
import { useAuth } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { uploadFile } from "../lib/storage";
import { resolveSlot, saveSlot, useImageSlots } from "../lib/imageSlots";

/**
 * Any picture on the site that the admin can replace, hide, show again or reset — from the page itself.
 * - Visitors: the admin's picture, else the built-in `src`; nothing when hidden or empty.
 * - Admin (signed in): a small pencil on the picture opens the editor; an EMPTY slot shows a slim
 *   "add picture" bar (only to the admin) so a picture can be added where none exists yet.
 * Stored in `disease_images` (see lib/imageSlots), uploads go to the site's storage as WebP.
 *
 * `render(url)` draws the picture (so each place keeps its own size / frame); default is a plain <img>.
 */
export default function EditableImage({
  slot, src, label, className = "", render, emptyHint = true, block = false, fallback,
}: {
  slot: string;
  src?: string | null;
  label: string;
  className?: string;
  render?: (url: string) => ReactNode;
  /** show the admin-only "add picture" bar when the slot is empty */
  emptyHint?: boolean;
  /** full-width picture (wrapper is a block) instead of an inline thumbnail */
  block?: boolean;
  /** shown instead when there is no picture (e.g. the topic icon); the admin gets a pencil on it */
  fallback?: ReactNode;
}) {
  const { loggedIn } = useAuth();
  const slots = useImageSlots();
  const st = resolveSlot(slots[slot], src);
  const [open, setOpen] = useState(false);

  if (!st.url && !loggedIn) return <>{fallback ?? null}</>;
  if (!st.url && fallback) {
    return (
      <span className="relative inline-block">
        {fallback}
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} aria-label={`تعديل الصورة: ${label}`}
          className="absolute -end-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#153448]/85 text-white shadow ring-1 ring-white/40 hover:bg-[#168C91]">
          {st.hidden ? <EyeOff size={12} aria-hidden="true" /> : <Pencil size={12} aria-hidden="true" />}
        </button>
        {open && <Editor slot={slot} label={label} st={st} def={src} onClose={() => setOpen(false)} />}
      </span>
    );
  }
  if (!st.url) {
    // a picture the admin hid always keeps its bar, so it can be shown again
    if (!emptyHint && !st.hidden) return null;
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="my-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-start text-xs font-bold text-slate-600 hover:border-[#168C91] hover:text-[#127378] dark:border-slate-600 dark:text-slate-300">
          {st.hidden ? <EyeOff size={14} aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}
          <span className="truncate">{st.hidden ? "صورة مخفية: " : "إضافة صورة: "}{label}</span>
        </button>
        {open && <Editor slot={slot} label={label} st={st} def={src} onClose={() => setOpen(false)} />}
      </>
    );
  }
  const Wrap = block ? "div" : "span";
  return (
    <Wrap className={block ? "relative" : "relative inline-block max-w-full align-top"}>
      {render ? render(st.url) : <img src={st.url} alt={label} loading="lazy" decoding="async" className={className} />}
      {loggedIn && (
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} aria-label={`تعديل الصورة: ${label}`}
          className="absolute end-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#153448]/85 text-white shadow ring-1 ring-white/40 hover:bg-[#168C91]">
          <Pencil size={14} aria-hidden="true" />
        </button>
      )}
      {open && <Editor slot={slot} label={label} st={st} def={src} onClose={() => setOpen(false)} />}
    </Wrap>
  );
}

function Editor({ slot, label, st, def, onClose }: { slot: string; label: string; st: ReturnType<typeof resolveSlot>; def?: string | null; onClose: () => void }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); onClose(); }
    catch { setErr(ar ? "تعذّر الحفظ — تأكد إنك مسجّل دخول كأدمن." : "Save failed — sign in as admin."); }
    finally { setBusy(false); }
  };
  const upload = (f: File) => act(async () => saveSlot(slot, (await uploadFile(f, "images")).item.url));
  const btn = "flex min-h-11 w-full items-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={label}
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-start shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-black text-[#153448] dark:text-white">{ar ? "تعديل الصورة" : "Edit picture"}</div>
            <div className="truncate text-xs text-slate-500">{label}</div>
          </div>
          <button onClick={onClose} aria-label={ar ? "إغلاق" : "Close"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} aria-hidden="true" /></button>
        </div>
        {(st.url || def) && <img src={st.url || def || ""} alt="" className={`mb-3 max-h-40 w-full rounded-xl bg-slate-50 object-contain p-2 ${st.hidden ? "opacity-40 grayscale" : ""}`} />}
        <div className="space-y-2">
          <button disabled={busy} onClick={() => file.current?.click()} className={`${btn} bg-[#168C91] text-white hover:bg-[#127378]`}>
            <Camera size={18} aria-hidden="true" />{busy ? "…" : st.url ? (ar ? "رفع صورة بدلها (جودة أعلى)" : "Upload a replacement") : (ar ? "رفع صورة" : "Upload a picture")}
          </button>
          {st.url && (
            <button disabled={busy} onClick={() => act(() => saveSlot(slot, `hidden:${st.overridden ? st.url : ""}`))} className={`${btn} bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100`}>
              <EyeOff size={18} aria-hidden="true" />{ar ? "إخفاء الصورة" : "Hide"}
            </button>
          )}
          {st.hidden && (st.kept || def) && (
            <button disabled={busy} onClick={() => act(() => saveSlot(slot, st.kept || null))} className={`${btn} bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100`}>
              <Eye size={18} aria-hidden="true" />{ar ? "إظهار الصورة" : "Show"}
            </button>
          )}
          {st.overridden && def && (
            <button disabled={busy} onClick={() => act(() => saveSlot(slot, null))} className={`${btn} bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100`}>
              <RotateCcw size={18} aria-hidden="true" />{ar ? "رجوع للرسمة الأصلية" : "Back to the original drawing"}
            </button>
          )}
        </div>
        {err && <p className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300">{err}</p>}
        <p className="mt-3 text-[11px] text-slate-500">{ar ? "التعديل بيظهر للزوار خلال دقايق. الصور بتتضغط تلقائي (WebP)." : "Visitors see the change within minutes. Pictures are compressed automatically (WebP)."}</p>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}
