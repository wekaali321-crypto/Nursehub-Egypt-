import { useState } from "react";
import DropZone from "./DropZone";
import { parseDocx, parsePdf, parseMarkdown, parsePlainText, readImageAsDataUrl } from "../../lib/fileParsers";
import { detectLanguage, type WizardImage, type MatchedImage } from "../../lib/importWizard";
import { useToast } from "../../components/Toast";

type Method = "paste" | "docx" | "pdf" | "md";

const METHODS: { id: Method; label: string; icon: string; accept: string; hint: string }[] = [
  { id: "paste", label: "لصق نص", icon: "📋", accept: "", hint: "الصق نص المقال مباشرة (عربي أو إنجليزي)" },
  { id: "docx", label: "ملف Word", icon: "📄", accept: ".docx", hint: "يدعم .docx فقط — يحافظ على العناوين والتنسيق والصور" },
  { id: "pdf", label: "ملف PDF", icon: "📕", accept: ".pdf", hint: "استخراج النص تلقائياً — قد لا يعمل مع PDF ممسوح ضوئياً" },
  { id: "md", label: "Markdown", icon: "📝", accept: ".md,.markdown", hint: "عناوين #، قوائم -، **عريض**، روابط []()" },
];

export default function Step1Input({
  onProcessed,
}: {
  onProcessed: (html: string, sourceType: Method, warnings: string[], images: MatchedImage[]) => void;
}) {
  const { notify } = useToast();
  const [method, setMethod] = useState<Method>("paste");
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingImages, setPendingImages] = useState<WizardImage[]>([]);
  const [contentReady, setContentReady] = useState<{ html: string; warnings: string[] } | null>(null);

  const detected = pasteText.trim() ? detectLanguage(pasteText) : null;

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      let result: { html: string; warnings: string[] };
      if (method === "docx") result = await parseDocx(file);
      else if (method === "pdf") result = await parsePdf(file);
      else result = parseMarkdown(await file.text());
      setContentReady(result);
      notify(`تم استخراج المحتوى من "${file.name}"`, "success");
    } catch (err) {
      notify("فشل استخراج المحتوى من الملف — تحقق من صيغة الملف.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleImages = async (files: FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return notify("الرجاء اختيار ملفات صور فقط", "error");
    const newImages: WizardImage[] = [];
    for (const file of arr) {
      const dataUrl = await readImageAsDataUrl(file);
      newImages.push({ id: "img" + Date.now() + Math.random().toString(36).slice(2, 7), name: file.name, dataUrl, sizeBytes: file.size, file });
    }
    setPendingImages((prev) => [...prev, ...newImages]);
    notify(`تمت إضافة ${newImages.length} صورة`, "success");
  };

  const removeImage = (id: string) => setPendingImages((prev) => prev.filter((i) => i.id !== id));

  const canContinue = method === "paste" ? pasteText.trim().length > 20 : !!contentReady;

  const proceed = () => {
    if (method === "paste") {
      const result = parsePlainText(pasteText);
      onProcessed(result.html, "paste", [], pendingImages.map((i) => ({ ...i, sectionIndex: -1, sectionHeading: "" } as MatchedImage)));
    } else if (contentReady) {
      onProcessed(contentReady.html, method, contentReady.warnings, pendingImages.map((i) => ({ ...i, sectionIndex: -1, sectionHeading: "" } as MatchedImage)));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black dark:text-white">📥 اختر طريقة إدخال المحتوى</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">يمكنك لصق نص أو رفع ملف Word / PDF / Markdown — ثم إضافة الصور.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setContentReady(null); }}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition ${method === m.id ? "border-sky-400 bg-sky-50 dark:bg-sky-500/10" : "border-slate-200 hover:border-sky-300 dark:border-slate-700"}`}
          >
            <span className="text-2xl">{m.icon}</span>
            <span className="text-sm font-bold dark:text-white">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">{METHODS.find((m) => m.id === method)?.hint}</p>

      {method === "paste" && (
        <div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={12}
            placeholder="الصق نص المقال هنا... (يدعم العربية والإنجليزية، والأسطر الفارغة تفصل الفقرات)"
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {detected && (
            <div className="mt-2 text-xs text-slate-400">
              اللغة المكتشفة:{" "}
              <span className="font-bold text-sky-500">
                {detected === "ar" ? "عربي 🇪🇬" : detected === "en" ? "إنجليزي 🇬🇧" : detected === "bilingual" ? "ثنائي اللغة (عربي + إنجليزي)" : "غير محدد"}
              </span>
            </div>
          )}
        </div>
      )}

      {method !== "paste" && (
        <DropZone accept={METHODS.find((m) => m.id === method)?.accept} onFiles={(files) => files[0] && handleFile(files[0])}>
          {busy ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              <span className="text-sm font-bold text-slate-500">جارٍ المعالجة...</span>
            </div>
          ) : contentReady ? (
            <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="text-3xl">✅</span>
              <span className="font-bold">تم استخراج المحتوى بنجاح — اضغط للاستبدال بملف آخر</span>
              {contentReady.warnings.length > 0 && (
                <ul className="mt-2 space-y-1 text-right text-xs text-amber-600 dark:text-amber-400">
                  {contentReady.warnings.slice(0, 4).map((w, i) => <li key={i}>⚠️ {w}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <span className="text-4xl">☁️</span>
              <span className="font-bold">اسحب الملف هنا أو اضغط للاختيار</span>
            </div>
          )}
        </DropZone>
      )}

      <div>
        <h3 className="mb-2 flex items-center gap-2 font-bold dark:text-white">🖼️ الصور (اختياري)</h3>
        <DropZone accept="image/*" multiple onFiles={handleImages} className="p-5">
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <span className="text-2xl">📸</span>
            <span className="text-sm font-bold">اسحب الصور هنا أو اضغط للاختيار (يمكن اختيار أكثر من صورة)</span>
          </div>
        </DropZone>
        {pendingImages.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {pendingImages.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <img src={img.dataUrl} alt={img.name} className="h-20 w-full object-cover" />
                <button onClick={() => removeImage(img.id)} className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white group-hover:flex">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={proceed}
          disabled={!canContinue}
          className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          متابعة إلى البنية والتفاصيل ←
        </button>
      </div>
    </div>
  );
}
