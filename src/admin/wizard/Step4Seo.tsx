import { useEffect, useState } from "react";
import { generateSeoBundle, generateUniqueSlug } from "../../lib/importWizard";

export default function Step4Seo({
  title, html, existingSlugs, onBack, onNext,
}: {
  title: string;
  html: string;
  existingSlugs: string[];
  onBack: () => void;
  onNext: (payload: { excerpt: string; metaTitle: string; metaDescription: string; keywords: string; slug: string; references: string }) => void;
}) {
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [references, setReferences] = useState("");

  useEffect(() => {
    const bundle = generateSeoBundle(title, html, existingSlugs);
    setMetaTitle(bundle.metaTitle);
    setMetaDescription(bundle.metaDescription);
    setKeywords(bundle.keywords.join("، "));
    setExcerpt(bundle.metaDescription);
    if (!slugTouched) setSlug(bundle.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, html]);

  const finalSlug = () => (slugTouched ? generateUniqueSlug(slug, existingSlugs.filter((s) => s !== slug)) : slug);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black dark:text-white">🔎 SEO والبيانات الوصفية</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">تم توليد هذه الحقول تلقائياً من محتوى المقال — يمكنك تعديلها بحرية.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">المقتطف (Excerpt)</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>Meta Title</span><span className={metaTitle.length > 65 ? "text-rose-500" : "text-slate-400"}>{metaTitle.length}/65</span></label>
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>Meta Description</span><span className={metaDescription.length > 160 ? "text-rose-500" : "text-slate-400"}>{metaDescription.length}/160</span></label>
          <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">الكلمات المفتاحية</label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="مفصولة بفاصلة" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywords.split(/[،,]/).map((k) => k.trim()).filter(Boolean).map((k, i) => (
              <span key={i} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">{k}</span>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">الرابط (Slug)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400" dir="ltr">/article/</span>
            <input dir="ltr" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          {existingSlugs.includes(slug) && <p className="mt-1 text-xs text-amber-500">⚠️ هذا الرابط مستخدم بالفعل — سيتم إضافة لاحقة تلقائياً عند الحفظ.</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">المراجع العلمية</label>
          <textarea value={references} onChange={(e) => setReferences(e.target.value)} rows={3} placeholder="مثال: Potter & Perry, Fundamentals of Nursing, 10th Ed." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
      </div>

      {/* Google search preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-2 text-xs font-bold text-slate-400">معاينة نتيجة البحث في Google</h3>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <div className="text-xs text-emerald-700 dark:text-emerald-400" dir="ltr">nursehub.eg › article › {slug}</div>
          <div className="mt-0.5 truncate text-lg text-sky-700 dark:text-sky-400">{metaTitle || title}</div>
          <div className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{metaDescription}</div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">→ رجوع</button>
        <button
          onClick={() => onNext({ excerpt, metaTitle, metaDescription, keywords, slug: finalSlug(), references })}
          className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg"
        >
          متابعة إلى التحقق والنشر ←
        </button>
      </div>
    </div>
  );
}
