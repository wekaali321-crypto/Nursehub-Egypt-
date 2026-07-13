import { useState } from "react";
import { generateAllEnhancements, DEFAULT_ENHANCEMENTS, type EnhancementFlags } from "../../lib/aiContentGen";
import type { GeneratedBlock } from "./types";

const LABELS: { key: keyof EnhancementFlags; label: string; icon: string; desc: string }[] = [
  { key: "clinicalPearls", label: "لآلئ سريرية (Clinical Pearls)", icon: "🦪", desc: "معلومات قيّمة مستخرجة من كل قسم" },
  { key: "nursingTips", label: "نصائح تمريضية", icon: "💡", desc: "نصائح عملية للممرض/ة" },
  { key: "clinicalAlerts", label: "تنبيهات سريرية", icon: "🏥", desc: "جمل تحتوي كلمات خطر/تحذير/مضاعفات" },
  { key: "summaryCheatSheet", label: "ملخص سريع (Cheat Sheet)", icon: "⚡", desc: "نقاط مختصرة من كل الأقسام" },
  { key: "faq", label: "أسئلة شائعة (FAQ)", icon: "❔", desc: "أسئلة مبنية على العناوين" },
  { key: "mcqs", label: "أسئلة اختيارات (MCQ)", icon: "🔘", desc: "أسئلة تدريبية من محتوى المقال" },
  { key: "trueFalse", label: "أسئلة صح/خطأ", icon: "✔️", desc: "عبارات للتحقق من الفهم" },
  { key: "fillBlanks", label: "أكمل الفراغ", icon: "✏️", desc: "حذف مصطلح رئيسي من الجملة" },
  { key: "flashcards", label: "بطاقات تعليمية", icon: "🎴", desc: "سؤال/جواب قابلة للطي" },
  { key: "mindMap", label: "خريطة ذهنية", icon: "🧠", desc: "مخطط هرمي لعناوين المقال" },
  { key: "studyNotes", label: "ملاحظات دراسية", icon: "📝", desc: "نقاط تلخيصية لكل قسم" },
];

export default function Step3Enhancements({
  html, title, onBack, onNext,
}: {
  html: string;
  title: string;
  onBack: () => void;
  onNext: (blocks: GeneratedBlock[]) => void;
}) {
  const [flags, setFlags] = useState<EnhancementFlags>(DEFAULT_ENHANCEMENTS);
  const [blocks, setBlocks] = useState<GeneratedBlock[] | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (key: keyof EnhancementFlags) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  const generate = () => {
    setBusy(true);
    setTimeout(() => {
      const results = generateAllEnhancements(html, title, flags);
      setBlocks(results.map((r) => ({ ...r, selected: true })));
      setBusy(false);
    }, 350);
  };

  const toggleBlock = (key: keyof EnhancementFlags) => setBlocks((prev) => prev?.map((b) => (b.key === key ? { ...b, selected: !b.selected } : b)) ?? null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black dark:text-white">✨ تحسينات الذكاء الاصطناعي</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">اختر العناصر التي تريد توليدها تلقائياً من محتوى المقال — كل المحتوى مستخرج من نصك الأصلي، لا يتم اختلاق معلومات.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LABELS.map((l) => (
          <label key={l.key} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${flags[l.key] ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-700"}`}>
            <input type="checkbox" checked={flags[l.key]} onChange={() => toggle(l.key)} className="mt-1 h-4 w-4 accent-sky-500" />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold dark:text-white"><span>{l.icon}</span>{l.label}</div>
              <div className="text-xs text-slate-400">{l.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <button onClick={generate} disabled={busy} className="w-full rounded-2xl bg-gradient-to-l from-violet-500 to-sky-500 py-3 font-bold text-white shadow-lg disabled:opacity-60">
        {busy ? "🤖 جارٍ التوليد..." : "✨ توليد المحتوى المختار"}
      </button>

      {blocks && (
        <div className="space-y-3">
          <h3 className="font-bold dark:text-white">معاينة العناصر المولّدة ({blocks.filter((b) => b.selected).length} مُختار)</h3>
          {blocks.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-500/10">تعذّر توليد محتوى — المقال قصير جداً أو لا يحتوي عناوين فرعية كافية.</p>}
          {blocks.map((b) => (
            <div key={b.key} className={`rounded-2xl border p-4 ${b.selected ? "border-slate-200 dark:border-slate-800" : "border-slate-100 opacity-50 dark:border-slate-900"}`}>
              <label className="mb-2 flex cursor-pointer items-center gap-2 font-bold dark:text-white">
                <input type="checkbox" checked={b.selected} onChange={() => toggleBlock(b.key)} className="h-4 w-4 accent-emerald-500" />
                <span>{b.icon} {b.label}</span>
              </label>
              <div className="prose-content max-h-56 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50" dangerouslySetInnerHTML={{ __html: b.html }} />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">→ رجوع</button>
        <button onClick={() => onNext(blocks ?? [])} className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg">
          متابعة إلى SEO ←
        </button>
      </div>
    </div>
  );
}
