import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS, type Category } from "../../lib/types";
import {
  optimizeHeadings, injectHeadingIds, buildToc, extractSections,
  matchImagesToSections, estimateReadingTime, countStats, type MatchedImage,
} from "../../lib/importWizard";

const cats = Object.keys(CATEGORY_LABELS) as Category[];

export default function Step2Structure({
  rawHtml, images, initial, onBack, onNext,
}: {
  rawHtml: string;
  images: MatchedImage[];
  initial: { title: string; titleEn: string; category: Category; tags: string; author: string; coverImageId: string };
  onBack: () => void;
  onNext: (payload: { processedHtml: string; title: string; titleEn: string; category: Category; tags: string; author: string; coverImageId: string; images: MatchedImage[] }) => void;
}) {
  const processedHtml = useMemo(() => injectHeadingIds(optimizeHeadings(rawHtml)), [rawHtml]);
  const sections = useMemo(() => extractSections(processedHtml), [processedHtml]);
  const toc = useMemo(() => buildToc(processedHtml), [processedHtml]);
  const stats = useMemo(() => countStats(processedHtml), [processedHtml]);
  const mins = useMemo(() => estimateReadingTime(processedHtml), [processedHtml]);

  const [title, setTitle] = useState(initial.title);
  const [titleEn, setTitleEn] = useState(initial.titleEn);
  const [category, setCategory] = useState<Category>(initial.category);
  const [tags, setTags] = useState(initial.tags);
  const [author, setAuthor] = useState(initial.author);
  const [coverImageId, setCoverImageId] = useState(initial.coverImageId);
  const [matched, setMatched] = useState<MatchedImage[]>(() => (images.length ? matchImagesToSections(images, sections) : []));

  useEffect(() => {
    if (images.length) setMatched(matchImagesToSections(images, sections));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, processedHtml]);

  const reassign = (id: string, sectionIndex: number) => {
    setMatched((prev) => prev.map((img) => (img.id === id ? { ...img, sectionIndex, sectionHeading: sections[sectionIndex]?.heading ?? "(بداية المقال)" } : img)));
  };

  const canContinue = title.trim().length > 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black dark:text-white">🧱 البنية والتفاصيل</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">راجع العنوان والتصنيف، وحدد مكان كل صورة، وتحقق من جدول المحتويات.</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">عنوان المقال *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-lg font-bold outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="مثال: الرعاية التمريضية لمرضى السكري" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500" dir="ltr">English Title (optional)</label>
          <input dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Nursing Care for Diabetic Patients" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">القسم</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">الكاتب</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">الوسوم (مفصولة بفاصلة)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="تمريض، سكري، رعاية مزمنة" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-black text-sky-500">{stats.words}</div>
          <div className="text-xs text-slate-400">كلمة</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-black text-emerald-500">{mins}</div>
          <div className="text-xs text-slate-400">دقيقة قراءة تقديرية</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-black text-violet-500">{toc.length}</div>
          <div className="text-xs text-slate-400">عنوان فرعي مكتشف</div>
        </div>
      </div>

      {toc.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-bold dark:text-white">📑 جدول المحتويات (تلقائي)</h3>
          <ul className="space-y-1 text-sm">
            {toc.map((t) => <li key={t.id} style={{ marginInlineStart: `${(t.level - 2) * 14}px` }} className="text-slate-600 dark:text-slate-300">• {t.text}</li>)}
          </ul>
        </div>
      )}

      {matched.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-bold dark:text-white">🖼️ مطابقة الصور بالأقسام</h3>
          <div className="space-y-3">
            {matched.map((img) => (
              <div key={img.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <img src={img.dataUrl} alt={img.name} className="h-14 w-20 rounded-lg object-cover" />
                <div className="flex-1 text-sm font-semibold dark:text-white">{img.name}</div>
                <select
                  value={img.sectionIndex}
                  onChange={(e) => reassign(img.id, Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value={-1}>(بداية المقال)</option>
                  {sections.map((s, i) => <option key={i} value={i}>{s.heading}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs font-bold text-sky-500">
                  <input type="radio" name="cover" checked={coverImageId === img.id} onChange={() => setCoverImageId(img.id)} /> صورة الغلاف
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="rounded-full border border-slate-200 px-6 py-3 font-bold dark:border-slate-700 dark:text-white">→ رجوع</button>
        <button
          disabled={!canContinue}
          onClick={() => onNext({ processedHtml, title, titleEn, category, tags, author, coverImageId, images: matched })}
          className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          متابعة إلى تحسينات AI ←
        </button>
      </div>
    </div>
  );
}
