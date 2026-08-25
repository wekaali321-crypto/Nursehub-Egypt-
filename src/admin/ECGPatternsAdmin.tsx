import { useRef, useState } from "react";
import { useEcgPatternImages } from "../lib/ecgPatternImageStore";
import { uploadFile } from "../lib/storage";
import { useToast } from "../components/Toast";

/**
 * لازم تفضل متطابقة مع PATTERNS في src/pages/ECGPage.tsx (id + الاسم بالعربي
 * والإنجليزي + الفئة) — نسخة خفيفة هنا فقط عشان لوحة التحكم متحتاجش تستورد
 * كل صفحة الـECG الضخمة (الرسوم المتحركة والكويز إلخ) لمجرد إدارة الصور.
 */
const PATTERN_LIST: { id: string; nameAr: string; nameEn: string }[] = [
  { id: "pea", nameAr: "النشاط الكهربائي بدون نبض", nameEn: "PEA" },
  { id: "vf-coarse", nameAr: "رجفان بطيني خشن", nameEn: "Coarse VF" },
  { id: "asystole", nameAr: "توقف القلب التام", nameEn: "Asystole" },
  { id: "torsades", nameAr: "تواء الأطراف", nameEn: "Torsades de Pointes" },
  { id: "vt-mono", nameAr: "تسرع بطيني أحادي الشكل", nameEn: "Monomorphic VT" },
  { id: "vf-fine", nameAr: "رجفان بطيني ناعم", nameEn: "Fine VF" },
  { id: "block3", nameAr: "حصار قلب تام (درجة ثالثة)", nameEn: "3rd-Degree Heart Block" },
  { id: "svt", nameAr: "تسرع فوق بطيني", nameEn: "SVT" },
  { id: "afib-rvr", nameAr: "رجفان أذيني بمعدل بطيني سريع", nameEn: "AFib with RVR" },
  { id: "block2-2", nameAr: "حصار قلب درجة ثانية (موبيتز 2)", nameEn: "2nd-Degree Block (Mobitz II)" },
  { id: "aflutter", nameAr: "رفرفة أذينية", nameEn: "Atrial Flutter" },
  { id: "afib-controlled", nameAr: "رجفان أذيني بمعدل منضبط", nameEn: "AFib, Controlled Rate" },
  { id: "block1", nameAr: "حصار قلب درجة أولى", nameEn: "1st-Degree Heart Block" },
  { id: "wenckebach", nameAr: "حصار قلب درجة ثانية (فينكباخ)", nameEn: "2nd-Degree Block (Wenckebach)" },
  { id: "rbbb", nameAr: "حصار حزمة يمنى", nameEn: "RBBB" },
  { id: "lbbb", nameAr: "حصار حزمة يسرى", nameEn: "LBBB" },
  { id: "junctional", nameAr: "الإيقاع العقدي", nameEn: "Junctional Rhythm" },
  { id: "pvcs", nameAr: "انقباضات بطينية مبكرة", nameEn: "PVCs" },
  { id: "sinus-tach", nameAr: "تسرع جيبي", nameEn: "Sinus Tachycardia" },
  { id: "sinus-brady", nameAr: "بطء جيبي", nameEn: "Sinus Bradycardia" },
  { id: "nsr", nameAr: "إيقاع جيبي طبيعي", nameEn: "Normal Sinus Rhythm" },
  { id: "wpw", nameAr: "متلازمة وولف-باركنسون-وايت", nameEn: "WPW Syndrome" },
  { id: "stemi", nameAr: "احتشاء عضلة القلب مع ارتفاع ST", nameEn: "STEMI" },
  { id: "ischemia", nameAr: "نقص التروية القلبية", nameEn: "Cardiac Ischemia" },
  { id: "sinus-arrhythmia", nameAr: "اللانظمية الجيبية", nameEn: "Sinus Arrhythmia" },
  { id: "pac", nameAr: "انقباضات أذينية مبكرة", nameEn: "PACs" },
  { id: "paced", nameAr: "إيقاع منظّم قلب صناعي", nameEn: "Paced Rhythm" },
  { id: "shortqt", nameAr: "متلازمة QT القصير", nameEn: "Short QT Syndrome" },
  { id: "mat", nameAr: "تسرع أذيني متعدد البؤر", nameEn: "MAT" },
  { id: "pericarditis", nameAr: "التهاب التامور", nameEn: "Pericarditis" },
  { id: "hypokalemia-ecg", nameAr: "تغيرات ECG في نقص بوتاسيوم الدم", nameEn: "Hypokalemia ECG Changes" },
  { id: "longqt", nameAr: "متلازمة QT الطويل", nameEn: "Long QT Syndrome" },
  { id: "hypocalcemia-ecg", nameAr: "تغيرات ECG في نقص كالسيوم الدم", nameEn: "Hypocalcemia ECG Changes" },
  { id: "hypercalcemia-ecg", nameAr: "تغيرات ECG في فرط كالسيوم الدم", nameEn: "Hypercalcemia ECG Changes" },
  { id: "hyperkalemia-ecg", nameAr: "تغيرات ECG في فرط بوتاسيوم الدم", nameEn: "Hyperkalemia ECG Changes" },
  { id: "nstemi", nameAr: "احتشاء بدون ارتفاع ST / ذبحة غير مستقرة", nameEn: "NSTEMI / Unstable Angina" },
  { id: "mi-lateral", nameAr: "احتشاء عضلة القلب الحاد الجانبي", nameEn: "Acute Lateral Wall MI" },
  { id: "mi-anterior", nameAr: "احتشاء عضلة القلب الحاد الأمامي", nameEn: "Acute Anterior Wall MI" },
  { id: "mi-inferior", nameAr: "احتشاء عضلة القلب الحاد السفلي", nameEn: "Acute Inferior Wall MI" },
  { id: "pe-ecg", nameAr: "نمط ECG في الانسداد الرئوي", nameEn: "Pulmonary Embolism ECG Pattern" },
  { id: "p-mitral-ecg", nameAr: "تضخم الأذين الأيسر (P Mitral)", nameEn: "Left Atrial Enlargement (P Mitral)" },
  { id: "p-pulmonale-ecg", nameAr: "تضخم الأذين الأيمن (P Pulmonale)", nameEn: "Right Atrial Enlargement (P Pulmonale)" },
  { id: "lvh-ecg", nameAr: "تضخم البطين الأيسر مع نمط إجهاد", nameEn: "LVH with Strain" },
  { id: "rvh-ecg", nameAr: "تضخم البطين الأيمن (نمط معكوس)", nameEn: "RVH — Reversal of Normal" },
  { id: "digitalis-ecg", nameAr: "تأثير الديجيتاليس على الرسم", nameEn: "Digitalis Effect" },
];

function PatternImageRow({
  id,
  nameAr,
  nameEn,
  currentUrl,
  onChange,
}: {
  id: string;
  nameAr: string;
  nameEn: string;
  currentUrl: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isRemoved = currentUrl === "";
  const isCustom = !!currentUrl;

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const { item } = await uploadFile(file, "ecg-patterns");
      onChange(item.url);
      notify("تم رفع الصورة");
    } catch {
      notify("فشل رفع الصورة", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-slate-800 dark:text-white">{nameAr}</div>
        <div className="truncate text-xs text-slate-400" dir="ltr">{nameEn}</div>
        <div className="mt-1 text-[11px] font-bold text-slate-400">
          {isCustom ? "🖼️ صورة مرفوعة" : isRemoved ? "🚫 الرسم محذوف (فاضي للزوار)" : "🌀 الرسم المتحرك الافتراضي"}
        </div>
      </div>

      {isCustom && <img src={currentUrl} alt={nameAr} className="h-16 w-24 shrink-0 rounded-lg object-cover" />}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {busy ? "جاري الرفع…" : "📷 رفع صورة"}
        </button>
        {!isRemoved && (
          <button type="button" onClick={() => onChange("")} className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            ✕ حذف الرسم
          </button>
        )}
        {(isCustom || isRemoved) && (
          <button type="button" onClick={() => onChange(undefined)} className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            ↩️ الرسم الافتراضي
          </button>
        )}
      </div>
    </div>
  );
}

export default function ECGPatternsAdmin() {
  const { images, setImage, resetAll } = useEcgPatternImages();
  const [q, setQ] = useState("");
  const filtered = PATTERN_LIST.filter(
    (p) => !q.trim() || p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q)
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-black dark:text-white">🫀 مكتبة ECG — صور الأنماط (39+ نمط)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          لكل نمط رسمة متحركة افتراضية. تقدري تحذفيها (تفضل فاضية) أو ترفعي صورة من جهازك تحل محلها — بيظهر التغيير فورًا في بطاقة النمط بصفحة /ecg.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم…"
          className="w-full max-w-xs rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="button"
          onClick={() => {
            if (confirm("استرجاع كل صور الأنماط للرسم المتحرك الافتراضي؟ هيتشال كل الصور المرفوعة والمحذوفة.")) resetAll();
          }}
          className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        >
          ↩️ استرجاع كل الصور للافتراضي
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <PatternImageRow key={p.id} id={p.id} nameAr={p.nameAr} nameEn={p.nameEn} currentUrl={images[p.id]} onChange={(url) => setImage(p.id, url)} />
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-slate-400">مفيش أنماط مطابقة للبحث</p>}
      </div>
    </div>
  );
}
