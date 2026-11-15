import { useState } from "react";
import { Pill, Pencil, ShieldCheck } from "lucide-react";
import EditableImage from "./EditableImage";
import { useAuth } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { resolveSlot, saveSlot, useImageSlots } from "../lib/imageSlots";
import { Button } from "./ui";

/**
 * Medication photos (packaging / vial / ampoule / tablet) on the drug page, built on the site's image slots
 * (lib/imageSlots → table disease_images; no new table, no extra request: visitors already read that small table, cached).
 *  - up to 3 pictures: slot `drug:<slug>` (the drug row's own image is its default) and `drug:<slug>:2`, `:3`
 *  - per picture a caption + source/attribution + "identity checked" flag, kept as JSON in slot `meta:drug:<slug>[:n]`
 *  - the admin uploads / replaces / hides / shows / resets each picture from the page (EditableImage) and edits its details here
 *  - visitors see only visible pictures; with none, a neutral placeholder (never a picture of another drug).
 */
type Meta = { caption?: string; source?: string; sourceUrl?: string; verified?: boolean };
const parseMeta = (v?: string): Meta => { try { return v ? (JSON.parse(v) as Meta) : {}; } catch { return {}; } };

export default function DrugGallery({ slug, name, defaultUrl }: { slug: string; name: string; defaultUrl: string | null }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { loggedIn: admin } = useAuth();
  const slots = useImageSlots();
  const keys = [`drug:${slug}`, `drug:${slug}:2`, `drug:${slug}:3`];
  const defs = [defaultUrl, null, null];
  const shown = keys.filter((k, i) => resolveSlot(slots[k], defs[i]).url);
  const [edit, setEdit] = useState<string | null>(null);

  if (!admin && shown.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-nh-line bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nh-surface text-nh-teal dark:bg-slate-800"><Pill size={24} aria-hidden="true" /></span>
        {ar ? "لا توجد صورة معتمدة لهذا الدواء بعد." : "No approved picture of this drug yet."}
      </div>
    );
  }

  return (
    <section aria-label={ar ? `صور الدواء: ${name}` : `Pictures of ${name}`} className="space-y-3">
      <div className={`grid gap-3 ${shown.length > 1 || admin ? "sm:grid-cols-2" : ""}`}>
        {keys.map((k, i) => {
          const meta = parseMeta(slots[`meta:${k}`]);
          const has = !!resolveSlot(slots[k], defs[i]).url;
          if (!has && !admin) return null;
          return (
            <figure key={k} className="overflow-hidden rounded-2xl border border-nh-line bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <EditableImage block slot={k} src={defs[i]} label={`${ar ? "صورة الدواء" : "Drug picture"} ${i + 1}: ${name}`}
                render={(u) => <img src={u} alt={meta.caption || name} loading="lazy" decoding="async" className="mx-auto max-h-72 w-auto rounded-xl object-contain" />} />
              {has && (meta.caption || meta.source || meta.verified) && (
                <figcaption className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {meta.caption && <div className="font-semibold text-slate-800 dark:text-slate-200">{meta.caption}</div>}
                  {meta.verified && <div className="inline-flex items-center gap-1 font-bold text-nh-success"><ShieldCheck size={14} aria-hidden="true" />{ar ? "تمت مراجعة الاسم والتركيز والشكل الدوائي" : "Name, strength and dosage form checked"}</div>}
                  {meta.source && (
                    <div>{ar ? "المصدر: " : "Source: "}{meta.sourceUrl ? <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">{meta.source}</a> : meta.source}</div>
                  )}
                </figcaption>
              )}
              {admin && has && (
                <button type="button" onClick={() => setEdit(k)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-nh-teal-dark hover:underline dark:text-teal-300">
                  <Pencil size={12} aria-hidden="true" />{ar ? "الوصف والمصدر" : "Caption & source"}
                </button>
              )}
            </figure>
          );
        })}
      </div>
      {shown.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ar ? "الصورة للتوضيح فقط: تأكد دائمًا من اسم الدواء وتركيزه وتاريخ صلاحيته على العبوة نفسها قبل الإعطاء." : "For illustration only: always check the name, strength and expiry on the actual package before giving a drug."}
        </p>
      )}
      {edit && <MetaEditor slot={`meta:${edit}`} initial={parseMeta(slots[`meta:${edit}`])} onClose={() => setEdit(null)} ar={ar} />}
    </section>
  );
}

function MetaEditor({ slot, initial, onClose, ar }: { slot: string; initial: Meta; onClose: () => void; ar: boolean }) {
  const [m, setM] = useState<Meta>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full rounded-lg border border-nh-line px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const save = async () => {
    setBusy(true); setErr("");
    try {
      const clean: Meta = { caption: m.caption?.trim() || undefined, source: m.source?.trim() || undefined, sourceUrl: /^https:\/\//.test(m.sourceUrl || "") ? m.sourceUrl!.trim() : undefined, verified: !!m.verified };
      await saveSlot(slot, clean.caption || clean.source || clean.verified ? JSON.stringify(clean) : null);
      onClose();
    } catch { setErr(ar ? "تعذّر الحفظ، حاول مرة أخرى." : "Could not save, try again."); } finally { setBusy(false); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={ar ? "وصف الصورة ومصدرها" : "Picture caption and source"} className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-nh-navy dark:text-white">{ar ? "وصف الصورة ومصدرها" : "Caption & source"}</h3>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "الوصف (مثال: أمبول 5000 وحدة/مل)" : "Caption (e.g. 5000 units/mL ampoule)"}<input className={inp} value={m.caption ?? ""} onChange={(e) => setM({ ...m, caption: e.target.value })} /></label>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "المصدر / حقوق الصورة" : "Source / credit"}<input className={inp} value={m.source ?? ""} onChange={(e) => setM({ ...m, source: e.target.value })} placeholder={ar ? "اسم الشركة المصنعة أو الموقع" : "Manufacturer or site"} /></label>
        <label className="block text-sm font-bold dark:text-slate-200">{ar ? "رابط المصدر (https)" : "Source link (https)"}<input dir="ltr" className={inp} value={m.sourceUrl ?? ""} onChange={(e) => setM({ ...m, sourceUrl: e.target.value })} /></label>
        <label className="flex items-start gap-2 text-sm dark:text-slate-200">
          <input type="checkbox" className="mt-1" checked={!!m.verified} onChange={(e) => setM({ ...m, verified: e.target.checked })} />
          <span>{ar ? "راجعت أن الصورة لنفس المادة الفعالة والتركيز والشكل الدوائي (مش دواء اسمه شبهه)." : "I checked the picture shows the same active ingredient, strength and dosage form (not a similarly named drug)."}</span>
        </label>
        {err && <p className="text-sm font-bold text-nh-danger">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button loading={busy} onClick={save}>{ar ? "حفظ" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}
