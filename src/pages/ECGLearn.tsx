import { useState, Fragment } from "react";
import { useEcgLearnContent } from "../lib/ecgLearnStore";
import { ECG_LEARN_SVG_REGISTRY } from "../components/EcgLearnSVGs";
import type { EcgLearnSource } from "../lib/ecgLearnData";

/* ============================================================================
   مكتبة ECG: تعلّم قراءة رسم القلب بكل احترافية من الصفر حتى الاحتراف
   ----------------------------------------------------------------------------
   هذا المكوّن أصبح الآن "قارئ محتوى" فقط: كل النصوص والصور بتتقرأ من
   src/lib/ecgLearnStore.ts (اللي بيتخزن في localStorage) بدل ما تكون
   مكتوبة هنا مباشرة. التعديل الكامل (نصوص + صور) بيتم من لوحة التحكم:
   /admin/ecg-learn (شوف src/admin/ECGLearnAdmin.tsx).
   ============================================================================ */

function SourceTag({ s }: { s: EcgLearnSource }) {
  const map = {
    thesis: { label: "من بحث ECG (جامعة السودان)", cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
    "simple-ecg": { label: "من Simple ECG (طب الأزهر)", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    both: { label: "مدمج من المصدرين", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  }[s];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${map.cls}`}>{map.label}</span>;
}

const BOX_COLORS = ["sky", "emerald", "amber", "rose"] as const;
const BOX_COLOR_CLASSES: Record<string, string> = {
  sky: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-500/10",
  emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10",
  amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/10",
  rose: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-500/10",
};

/**
 * محلّل نصي بسيط لمحتوى القسم (body):
 * - سطر يبدأ بـ "### " = عنوان صندوق جديد، يفضل مفتوح لحد سطر فاضي.
 * - أسطر تبدأ برقم ونقطة "1. " داخل نفس الفقرة = تُعرض كقائمة مرقّمة.
 * - باقي الأسطر = فقرات عادية.
 */
function renderBody(body: string) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const nodes: React.ReactNode[] = [];
  let boxColorIdx = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines[0]?.startsWith("### ")) {
      const boxTitle = lines[0].replace(/^###\s+/, "");
      const color = BOX_COLORS[boxColorIdx % BOX_COLORS.length];
      boxColorIdx++;
      nodes.push(
        <div key={i} className={`rounded-xl border p-4 ${BOX_COLOR_CLASSES[color]}`}>
          <div className="mb-2 font-bold text-slate-800 dark:text-white">{boxTitle}</div>
          <div className="space-y-1.5 text-sm">
            {lines.slice(1).map((l, j) => (
              <p key={j} className="leading-7 text-slate-700 dark:text-slate-200">{l}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }
    const isNumberedList = lines.length > 1 && lines.every((l) => /^\d+\.\s/.test(l));
    if (isNumberedList) {
      nodes.push(
        <ol key={i} className="list-decimal space-y-2 pr-5 text-sm text-slate-700 dark:text-slate-200">
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^\d+\.\s/, "")}</li>
          ))}
        </ol>
      );
      continue;
    }
    nodes.push(
      <Fragment key={i}>
        {lines.map((l, j) => (
          <p key={j} className="leading-8 text-slate-700 dark:text-slate-200">{l}</p>
        ))}
      </Fragment>
    );
  }
  return nodes;
}

export default function ECGLearn() {
  const { state } = useEcgLearnContent();
  const [openSection, setOpenSection] = useState<number>(1);
  const toggle = (n: number) => setOpenSection((cur) => (cur === n ? 0 : n));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-l from-sky-700 to-slate-800 p-5 text-white">
        <h2 className="text-xl font-black sm:text-2xl">{state.intro.title}</h2>
        <p className="mt-1 text-sm text-sky-100">{state.intro.titleEn}</p>
      </div>

      {state.sections.map((section) => {
        const open = openSection === section.id;
        const sectionImages = state.images[section.id] ?? {};
        return (
          <div key={section.id} className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-right"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-black text-white">{section.id}</span>
                <div>
                  <div className="font-black text-slate-800 dark:text-white">{section.title}</div>
                  <div className="text-xs text-slate-400">{section.titleEn}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline"><SourceTag s={section.source} /></span>
                <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
              </div>
            </button>
            {open && (
              <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
                {section.images.map((slot) => {
                  const override = sectionImages[slot.key];
                  if (override === "") return null; // الأدمن مسحها نهائيًا
                  if (override) {
                    return <img key={slot.key} src={override} alt={slot.label} className="mx-auto max-h-80 w-full max-w-md rounded-xl object-contain" />;
                  }
                  const Builtin = ECG_LEARN_SVG_REGISTRY[slot.builtin];
                  return Builtin ? <Builtin key={slot.key} /> : null;
                })}
                {renderBody(section.body)}
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
        ✅ المرجع اكتمل بالكامل من المصدرين، من الصفر حتى الاحتراف.
      </div>
    </div>
  );
}
