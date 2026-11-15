import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { resolveSlot, saveSlot, useImageSlots } from "../lib/imageSlots";

/**
 * Drug pictures to-do list: every drug with its picture status, high-alert drugs first, then A→Z.
 * "Open" goes to the drug page where the picture is uploaded / captioned (DrugGallery). Uses the admin's loaded data and
 * the image-slot table already in memory — no extra query.
 * The switch "verified pictures only" hides, for visitors, every picture whose "identity checked" box is not ticked.
 */
export const VERIFIED_ONLY_SLOT = "setting:drug-images-verified-only";
type Status = "none" | "unchecked" | "checked" | "hidden";
const LABEL: Record<Status, [string, string]> = {
  none: ["مفيش صورة", "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"],
  unchecked: ["صورة غير مراجَعة", "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"],
  checked: ["صورة مراجَعة", "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"],
  hidden: ["مخفية", "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"],
};

export function DrugImagesAdmin() {
  const { drugs } = useStore();
  const slots = useImageSlots();
  const [filter, setFilter] = useState<"todo" | "all">("todo");
  const [busy, setBusy] = useState(false);
  const verifiedOnly = slots[VERIFIED_ONLY_SLOT] === "1";

  const rows = useMemo(() => {
    const statusOf = (slug: string, def: string | null): Status => {
      const keys = [`drug:${slug}`, `drug:${slug}:2`, `drug:${slug}:3`];
      const states = keys.map((k, i) => resolveSlot(slots[k], i === 0 ? def : null));
      const visible = keys.filter((_, i) => states[i].url);
      if (visible.length === 0) return states.some((s) => s.hidden) ? "hidden" : "none";
      const checked = visible.some((k) => { try { return JSON.parse(slots[`meta:${k}`] || "{}").verified === true; } catch { return false; } });
      return checked ? "checked" : "unchecked";
    };
    return [...drugs]
      .map((d) => ({ d, st: statusOf(d.slug, d.showImage ? d.imageUrl || null : null) }))
      .sort((a, b) => Number(!!b.d.isHighAlert) - Number(!!a.d.isHighAlert) || a.d.name.localeCompare(b.d.name));
  }, [drugs, slots]);
  const shown = filter === "all" ? rows : rows.filter((r) => r.st === "none" || r.st === "unchecked");
  const count = (s: Status) => rows.filter((r) => r.st === s).length;

  const toggle = async () => {
    setBusy(true);
    try { await saveSlot(VERIFIED_ONLY_SLOT, verifiedOnly ? null : "1"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-black text-[#153448] dark:text-white">صور الأدوية</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">ارفع صورة العبوة/الأمبول من مصدر مسموح (موقع الشركة المصنعة مثلًا)، واكتب المصدر، وعلّم "راجعت" بعد ما تتأكد إن الصورة لنفس المادة الفعالة والتركيز والشكل الدوائي.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          {(["none", "unchecked", "checked", "hidden"] as Status[]).map((s) => <span key={s} className={`rounded-full px-2.5 py-1 ${LABEL[s][1]}`}>{LABEL[s][0]}: {count(s)}</span>)}
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm font-semibold dark:text-slate-200">
          <input type="checkbox" className="mt-1" checked={verifiedOnly} disabled={busy} onChange={toggle} />
          <span>إظهار الصور المراجَعة بس للزوار (الصورة اللي مش متعلّم عليها "راجعت" ما تظهرش لحد ما تتراجع)</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setFilter("todo")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${filter === "todo" ? "bg-[#127378] text-white" : "border border-slate-200 dark:border-slate-700 dark:text-white"}`}>محتاجة شغل ({count("none") + count("unchecked")})</button>
        <button onClick={() => setFilter("all")} className={`rounded-full px-4 py-1.5 text-sm font-bold ${filter === "all" ? "bg-[#127378] text-white" : "border border-slate-200 dark:border-slate-700 dark:text-white"}`}>الكل ({rows.length})</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><th className="p-3">الدواء</th><th className="p-3">المادة الفعالة</th><th className="p-3">الحالة</th><th className="p-3"></th></tr></thead>
          <tbody>
            {shown.map(({ d, st }) => (
              <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-white">{d.name}{d.isHighAlert && <span className="ms-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-800">عالي الخطورة</span>}</td>
                <td className="p-3 text-slate-500" dir="ltr">{d.genericNameEn || d.genericName}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${LABEL[st][1]}`}>{LABEL[st][0]}</span></td>
                <td className="p-3"><Link to={`/drug/${d.slug}`} target="_blank" className="rounded-lg bg-[#127378] px-3 py-1 text-xs font-bold text-white">فتح</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
