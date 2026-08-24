import { useRef, useState } from "react";
import { useEcgLearnContent } from "../lib/ecgLearnStore";
import { ECG_LEARN_SVG_REGISTRY } from "../components/EcgLearnSVGs";
import { uploadFile } from "../lib/storage";
import { useToast } from "../components/Toast";
import type { EcgLearnSection, EcgLearnSource } from "../lib/ecgLearnData";

const SOURCE_OPTIONS: { value: EcgLearnSource; label: string }[] = [
  { value: "thesis", label: "من بحث ECG (جامعة السودان)" },
  { value: "simple-ecg", label: "من Simple ECG (طب الأزهر)" },
  { value: "both", label: "مدمج من المصدرين" },
];

function ImageSlotEditor({
  sectionId,
  slotKey,
  label,
  builtin,
  currentUrl,
  onChange,
}: {
  sectionId: number;
  slotKey: string;
  label: string;
  builtin: string;
  currentUrl: string | undefined; // undefined = افتراضي، "" = محذوفة، غير كده = رابط مرفوع
  onChange: (url: string | undefined) => void;
}) {
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const Builtin = ECG_LEARN_SVG_REGISTRY[builtin];

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const { item } = await uploadFile(file, "ecg-learn");
      onChange(item.url);
      notify("تم رفع الصورة");
    } catch {
      notify("فشل رفع الصورة", "error");
    } finally {
      setBusy(false);
    }
  };

  const isRemoved = currentUrl === "";
  const isCustom = !!currentUrl;

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-600">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">🖼️ {label}</span>
        <span className="text-[10px] text-slate-400">
          {isCustom ? "صورة مرفوعة" : isRemoved ? "محذوفة" : "الرسم الافتراضي"}
        </span>
      </div>

      <div className="relative flex min-h-[120px] items-center justify-center rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        {isCustom && (
          <>
            <img src={currentUrl} alt={label} className="max-h-56 w-full object-contain" />
            <button
              type="button"
              title="حذف الصورة المرفوعة والرجوع للرسم الافتراضي"
              onClick={() => onChange(undefined)}
              className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-sm font-black text-white shadow"
            >
              ✕
            </button>
          </>
        )}

        {!isCustom && !isRemoved && Builtin && (
          <div className="relative w-full">
            <Builtin />
            <button
              type="button"
              title="حذف هذا الرسم نهائيًا (يظهر فاضي للزوار لحد ما ترفع صورة بدالها)"
              onClick={() => onChange("")}
              className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-sm font-black text-white shadow"
            >
              ✕
            </button>
          </div>
        )}

        {isRemoved && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-sky-600"
          >
            <span className="text-3xl">➕</span>
            <span className="text-xs font-bold">إضافة صورة من الجهاز</span>
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {!isRemoved && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "جاري الرفع…" : isCustom ? "📷 استبدال الصورة" : "📷 رفع صورة بدل الرسم"}
          </button>
        )}
        {isCustom && (
          <button type="button" onClick={() => onChange(undefined)} className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            رجوع للرسم الافتراضي
          </button>
        )}
        {isRemoved && (
          <button type="button" onClick={() => onChange(undefined)} className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            استرجاع الرسم الافتراضي
          </button>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  images,
  onSave,
  onReset,
  onSetImage,
}: {
  section: EcgLearnSection;
  images: Record<string, string | undefined>;
  onSave: (patch: Partial<EcgLearnSection>) => void;
  onReset: () => void;
  onSetImage: (slotKey: string, url: string | undefined) => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [titleEn, setTitleEn] = useState(section.titleEn);
  const [source, setSource] = useState<EcgLearnSource>(section.source);
  const [body, setBody] = useState(section.body);
  const [open, setOpen] = useState(false);
  const dirty = title !== section.title || titleEn !== section.titleEn || source !== section.source || body !== section.body;

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-right">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-black text-white">{section.id}</span>
          <div className="font-bold text-slate-800 dark:text-white">{title}</div>
        </div>
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">العنوان (عربي)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">العنوان (إنجليزي)</span>
              <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">المصدر</span>
            <select value={source} onChange={(e) => setSource(e.target.value as EcgLearnSource)} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {section.images.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-bold text-slate-500">صور/رسومات هذا القسم</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.images.map((slot) => (
                  <ImageSlotEditor
                    key={slot.key}
                    sectionId={section.id}
                    slotKey={slot.key}
                    label={slot.label}
                    builtin={slot.builtin}
                    currentUrl={images[slot.key]}
                    onChange={(url) => onSetImage(slot.key, url)}
                  />
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">
              النص الكامل — سطر يبدأ بـ "### " يعمل عنوان صندوق ملوّن، وسطر فاضي يفصل بين الفقرات
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs leading-6 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              dir="rtl"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => onSave({ title, titleEn, source, body })}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              💾 حفظ هذا القسم
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("استرجاع هذا القسم للنص والصور الافتراضية؟ هيتشال أي تعديل عملته عليه.")) {
                  onReset();
                  setTitle(section.title);
                }
              }}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            >
              ↩️ استرجاع الافتراضي
            </button>
            {dirty && <span className="text-xs font-bold text-amber-600">في تعديلات لسه ما اتحفظتش</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ECGLearnAdmin() {
  const { state, updateSection, updateIntro, setImage, resetSection, resetAll } = useEcgLearnContent();
  const [introTitle, setIntroTitle] = useState(state.intro.title);
  const [introTitleEn, setIntroTitleEn] = useState(state.intro.titleEn);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-black dark:text-white">🎓 مكتبة ECG: تعلّم قراءة الرسم</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          تحكم كامل في نصوص كل قسم وصوره — أي تعديل بيظهر فورًا في صفحة /ecg (تبويب "تعلّم قراءة الرسم") من غير الحاجة لأي كود.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-2 font-bold dark:text-white">عنوان المرجع الرئيسي</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={introTitle}
            onChange={(e) => setIntroTitle(e.target.value)}
            onBlur={() => updateIntro({ title: introTitle })}
            className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            value={introTitleEn}
            dir="ltr"
            onChange={(e) => setIntroTitleEn(e.target.value)}
            onBlur={() => updateIntro({ titleEn: introTitleEn })}
            className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (confirm("استرجاع كل المرجع (كل الأقسام والصور) للنسخة الافتراضية؟ هيتشال كل تعديلاتك.")) resetAll();
          }}
          className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        >
          ↩️ استرجاع كل المرجع للافتراضي
        </button>
      </div>

      {state.sections.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          images={state.images[section.id] ?? {}}
          onSave={(patch) => updateSection(section.id, patch)}
          onReset={() => resetSection(section.id)}
          onSetImage={(slotKey, url) => setImage(section.id, slotKey, url)}
        />
      ))}
    </div>
  );
}
