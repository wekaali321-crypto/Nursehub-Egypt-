import { useState } from "react";
import { BookMarked, Pencil, UserCheck } from "lucide-react";
import { useAuth } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { saveSlot, useImageSlots } from "../lib/imageSlots";
import { Button } from "./ui";

/**
 * Article references and medical reviewer, edited by the admin on the article page.
 * Stored as JSON in the image-slot table (slot `artmeta:<slug>`): no schema change, no extra request (visitors already load
 * that small table). Nothing is shown unless the admin entered it — no invented reviewer, no placeholder references.
 */
type Ref = { title: string; url?: string };
type Meta = { reviewer?: string; reviewerTitle?: string; refs?: Ref[] };
const parse = (v?: string): Meta => { try { return v ? (JSON.parse(v) as Meta) : {}; } catch { return {}; } };
const safeUrl = (u?: string) => (u && /^https:\/\//i.test(u) ? u : undefined);

export default function ArticleReferences({ slug }: { slug: string }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { loggedIn: admin } = useAuth();
  const slots = useImageSlots();
  const key = `artmeta:${slug}`;
  const meta = parse(slots[key]);
  const [edit, setEdit] = useState(false);
  const refs = (meta.refs ?? []).filter((r) => r.title?.trim());
  if (!admin && !meta.reviewer && refs.length === 0) return null;

  return (
    <section aria-labelledby="art-refs" className="mt-6 rounded-2xl border border-nh-line bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <h2 id="art-refs" className="flex items-center gap-2 text-lg font-black text-nh-navy dark:text-white"><BookMarked size={20} className="text-nh-teal" aria-hidden="true" />{ar ? "المراجع والمراجعة العلمية" : "References & scientific review"}</h2>
        {admin && <button type="button" onClick={() => setEdit(true)} className="inline-flex items-center gap-1 text-xs font-bold text-nh-teal-dark hover:underline dark:text-teal-300"><Pencil size={12} aria-hidden="true" />{ar ? "تعديل" : "Edit"}</button>}
      </div>
      {meta.reviewer && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><UserCheck size={16} className="text-nh-success" aria-hidden="true" />{ar ? "راجعه علميًا: " : "Scientifically reviewed by: "}{meta.reviewer}{meta.reviewerTitle ? ` — ${meta.reviewerTitle}` : ""}</p>
      )}
      {refs.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-1 ps-5 text-sm text-slate-700 dark:text-slate-300" dir="ltr">
          {refs.map((r, i) => <li key={i}>{safeUrl(r.url) ? <a href={safeUrl(r.url)} target="_blank" rel="noopener noreferrer nofollow" className="text-nh-teal-dark underline dark:text-teal-300">{r.title}</a> : r.title}</li>)}
        </ol>
      ) : admin ? <p className="mt-2 text-sm text-slate-500">{ar ? "لسه مفيش مراجع — اضغط تعديل وأضف مصادر حقيقية (WHO، CDC، AHA، NICE، ISMP…)." : "No references yet."}</p> : null}
      {edit && <Editor initial={meta} onClose={() => setEdit(false)} slot={key} ar={ar} />}
    </section>
  );
}

function Editor({ initial, onClose, slot, ar }: { initial: Meta; onClose: () => void; slot: string; ar: boolean }) {
  const [reviewer, setReviewer] = useState(initial.reviewer ?? "");
  const [title, setTitle] = useState(initial.reviewerTitle ?? "");
  const [text, setText] = useState((initial.refs ?? []).map((r) => (r.url ? `${r.title} | ${r.url}` : r.title)).join("\n"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full rounded-lg border border-nh-line px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const save = async () => {
    setBusy(true); setErr("");
    const refs: Ref[] = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30).map((l) => {
      const [t, u] = l.split("|").map((x) => x.trim());
      return { title: t.slice(0, 300), url: safeUrl(u) };
    });
    const m: Meta = { reviewer: reviewer.trim() || undefined, reviewerTitle: title.trim() || undefined, refs: refs.length ? refs : undefined };
    try { await saveSlot(slot, m.reviewer || m.refs ? JSON.stringify(m) : null); onClose(); } catch { setErr(ar ? "تعذّر الحفظ." : "Could not save."); } finally { setBusy(false); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={ar ? "المراجع والمراجعة العلمية" : "References & review"} className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-nh-navy dark:text-white">{ar ? "المراجع والمراجعة العلمية" : "References & review"}</h3>
        <p className="text-xs text-slate-500">{ar ? "اكتب اسم المراجِع فقط لو راجع المقال فعلًا." : "Only name a reviewer who actually reviewed the article."}</p>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "اسم المراجِع العلمي" : "Reviewer name"}<input className={inp} value={reviewer} onChange={(e) => setReviewer(e.target.value)} /></label>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "صفته (مثال: أخصائي تمريض حالات حرجة)" : "Credentials"}<input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "المراجع — مرجع في كل سطر: العنوان | الرابط (https)" : "References — one per line: Title | https link"}
          <textarea dir="ltr" rows={6} className={inp} value={text} onChange={(e) => setText(e.target.value)} placeholder="WHO Guidelines on Hand Hygiene in Health Care (2009) | https://www.who.int/..." />
        </label>
        {err && <p className="text-sm font-bold text-nh-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</Button><Button loading={busy} onClick={save}>{ar ? "حفظ" : "Save"}</Button></div>
      </div>
    </div>
  );
}
