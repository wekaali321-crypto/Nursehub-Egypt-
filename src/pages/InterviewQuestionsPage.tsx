// src/pages/InterviewQuestionsPage.tsx
// "أسئلة المقابلات الشخصية" (Interview Questions) — bilingual Q&A hub for nurses preparing
// for hospital job interviews. Standalone-table feature (see src/lib/interviewQuestionsApi.ts).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchInterviewCategories,
  fetchInterviewQuestions,
  type InterviewCategory,
  type InterviewQuestion,
} from '../lib/interviewQuestionsApi';
import { Breadcrumbs } from '../components/common';
import { useSEO } from '../lib/seo';
import { useI18n, bilingual } from '../lib/i18n';
import InlineLangToggle from '../components/InlineLangToggle';

export default function InterviewQuestionsPage() {
  const { lang, t } = useI18n();
  const [categories, setCategories] = useState<InterviewCategory[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  useSEO({
    title: 'أسئلة مقابلات التمريض الشخصية | NurseHub Egypt',
    description: 'أكتر من مية سؤال وجواب لمقابلات شخصية للتمريض في المستشفيات — تنفسي، قلب، إنعاش، محاليل، مختبرات، وأكتر، مع روابط لمعرفة المزيد من محتوى الموقع.',
  });

  useEffect(() => {
    Promise.all([fetchInterviewCategories(), fetchInterviewQuestions()])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400">
        <span className="animate-pulse">جاري التحميل... (Loading...)</span>
      </div>
    );
  }
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={[{ label: 'أسئلة المقابلات الشخصية' }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">🎙️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">أسئلة المقابلات الشخصية للتمريض</h1>
        <p className="mt-1 text-indigo-50">Nursing Job Interview Questions — {questions.length} سؤال وجواب حقيقي من مقابلات المستشفيات، مُجمّعة ومترجمة لمساعدتك تتقبل في شغلك القادم.</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 ابحث في الأسئلة والإجابات..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            activeCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          الكل ({questions.length})
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
                  ? 'bg-indigo-600 text-white'
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
        {filtered.map((q) => {
          const cat = categoryById.get(q.category_id);
          const question = bilingual(q.question_ar, q.question_en ?? undefined, lang).text;
          const answer = bilingual(q.answer_ar, q.answer_en ?? undefined, lang).text;
          const relatedLabel = q.related_path
            ? bilingual(q.related_label_ar ?? '', q.related_label_en ?? undefined, lang).text
            : null;
          return (
            <details
              key={q.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition open:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:content-none">
                {cat && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {cat.icon}
                  </span>
                )}
                <span className="flex-1 font-semibold text-slate-800 dark:text-white">{question}</span>
                <span className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200">{answer}</div>
                {relatedLabel && q.related_path && (
                  <Link
                    to={q.related_path}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    لمعرفة المزيد عن {relatedLabel} اضغط هنا ←
                  </Link>
                )}
                {q.source_credit && (
                  <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">{q.source_credit}</div>
                )}
              </div>
            </details>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {t('quiz.noQuizzesInCategory') ?? 'لا توجد نتائج'}
          </div>
        )}
      </div>
    </div>
  );
}
