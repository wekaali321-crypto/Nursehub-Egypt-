// src/pages/TravelQuestionsPage.tsx
// "أسئلة السفر للخارج" (Questions for Traveling Abroad) — large bilingual Q&A bank for nurses
// preparing for overseas licensing exams (Prometric/HAAD/DHA/MOH/QCHP-style) and jobs abroad.
// Standalone-table feature (see src/lib/travelQuestionsApi.ts).
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchTravelCategories,
  fetchTravelQuestions,
  type TravelCategory,
  type TravelQuestion,
} from '../lib/travelQuestionsApi';
import { Breadcrumbs } from '../components/common';
import { useSEO } from '../lib/seo';
import { useI18n, bilingual } from '../lib/i18n';
import InlineLangToggle from '../components/InlineLangToggle';

const LABELS = {
  breadcrumb: { ar: 'أسئلة السفر للخارج', en: 'Questions for Traveling Abroad' },
  heroTitle: { ar: 'أسئلة السفر للخارج للتمريض', en: 'Nursing Exam Questions for Working Abroad' },
  searchPlaceholder: { ar: '🔍 ابحث في الأسئلة والإجابات...', en: '🔍 Search questions and answers...' },
  all: { ar: 'الكل', en: 'All' },
  noResults: { ar: 'لا توجد نتائج', en: 'No results found' },
  loadMore: { ar: 'عرض المزيد', en: 'Show more' },
  shown: { ar: 'يعرض', en: 'Showing' },
  of: { ar: 'من', en: 'of' },
};

const PAGE_SIZE = 40;

export default function TravelQuestionsPage() {
  const { lang } = useI18n();
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [questions, setQuestions] = useState<TravelQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useSEO({
    title: 'أسئلة السفر للخارج للتمريض | NurseHub Egypt',
    description: 'بنك ضخم من أسئلة اختبارات مزاولة المهنة والتوظيف بالخارج للتمريض (برومتريك، هيئات الترخيص الخليجية وغيرها)، مُراجعة ومترجمة بالعربي والإنجليزي.',
  });

  useEffect(() => {
    Promise.all([fetchTravelCategories(), fetchTravelQuestions()])
      .then(([cats, qs]) => {
        setCategories(cats);
        setQuestions(qs);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (activeCategory !== 'all' && q.category_id !== activeCategory) return false;
      if (!term) return true;
      const qText = bilingual(q.question_ar, q.question_en ?? undefined, lang).text.toLowerCase();
      const aText = bilingual(q.answer_ar, q.answer_en ?? undefined, lang).text.toLowerCase();
      return qText.includes(term) || aText.includes(term);
    });
  }, [questions, activeCategory, search, lang]);

  useEffect(() => setVisible(PAGE_SIZE), [activeCategory, search]);

  const visibleItems = filtered.slice(0, visible);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400">
        <span className="animate-pulse">جاري التحميل... (Loading...)</span>
      </div>
    );
  }
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: LABELS.breadcrumb[lang] }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">✈️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{LABELS.heroTitle[lang]}</h1>
        <p className="mt-1 text-blue-50">
          {lang === 'ar'
            ? `${questions.length} سؤال وجواب لمساعدتك تستعد لاختبارات الترخيص والتوظيف كممرض/ة بالخارج، مُراجعة إكلينيكيًا ومترجمة بالكامل.`
            : `${questions.length} Q&A to help you prepare for nursing licensing and job exams abroad, clinically reviewed and fully bilingual.`}
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={LABELS.searchPlaceholder[lang]}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          {LABELS.all[lang]} ({questions.length})
        </button>
        {categories.map((c) => {
          const count = questions.filter((q) => q.category_id === c.id).length;
          if (count === 0) return null;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeCategory === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {c.icon} {bilingual(c.name_ar, c.name_en, lang).text} ({count})
            </button>
          );
        })}
      </div>

      {/* Q&A list */}
      <div className="space-y-3">
        {visibleItems.map((q) => {
          const cat = categoryById.get(q.category_id);
          const question = bilingual(q.question_ar, q.question_en ?? undefined, lang).text;
          const answer = bilingual(q.answer_ar, q.answer_en ?? undefined, lang).text;
          return (
            <details
              key={q.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition open:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:content-none">
                {cat && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                    {cat.icon}
                  </span>
                )}
                <span className="flex-1 font-semibold text-slate-800 dark:text-white">{question}</span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200">{answer}</div>
              </div>
            </details>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {LABELS.noResults[lang]}
          </div>
        )}
      </div>

      {visible < filtered.length && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="text-xs text-slate-400">
            {LABELS.shown[lang]} {visibleItems.length} {LABELS.of[lang]} {filtered.length}
          </div>
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full bg-gradient-to-l from-cyan-600 to-indigo-700 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {LABELS.loadMore[lang]} ↓
          </button>
        </div>
      )}
    </div>
  );
}
