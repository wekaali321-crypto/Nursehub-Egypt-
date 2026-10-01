// src/pages/TravelQuestionsPage.tsx
// "أسئلة السفر للخارج" (Questions for Traveling Abroad) — interactive MCQ quiz bank for nurses
// preparing for overseas licensing exams (Prometric/HAAD/DHA/MOH/QCHP-style) and jobs abroad.
// Mirrors src/pages/LicensureExamPage.tsx exactly, but scoped directly to a category
// (no separate "exams" grouping level — each category IS the quiz you take question-by-question).
//
// Exports:
//   - TravelQuestionsHome  : hub screen listing travel_categories as tiles
//   - default (TravelQuestionsStudy): question-by-question quiz screen for one category

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchTravelCategories,
  fetchTravelQuestions,
  fetchTravelReviewSections,
  loadTravelProgress,
  saveTravelProgress,
  resetTravelProgress,
  type TravelCategory,
  type TravelQuestion,
  type TravelReviewSection,
} from '../lib/travelQuestionsApi';
import { Breadcrumbs } from '../components/common';
import ArticleContent from '../components/ArticleContent';
import { useSEO } from '../lib/seo';

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
      <span className="animate-pulse">جاري التحميل... (Loading...)</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) Hub — لائحة أقسام أسئلة السفر للخارج (travel_categories)
// ---------------------------------------------------------------------------

export function TravelQuestionsHome() {
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: 'أسئلة السفر للخارج للتمريض | NurseHub Egypt',
    description: 'بنك ضخم من أسئلة اختبارات مزاولة المهنة والتوظيف بالخارج للتمريض (برومتريك، هيئات الترخيص الخليجية وغيرها) بنظام اختيار من متعدد تفاعلي، مُراجعة ومترجمة بالعربي والإنجليزي.',
  });

  useEffect(() => {
    Promise.all([fetchTravelCategories(), fetchTravelQuestions()])
      .then(([cats, qs]) => {
        setCategories(cats);
        const c: Record<string, number> = {};
        for (const q of qs) c[q.category_id] = (c[q.category_id] ?? 0) + 1;
        setCounts(c);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const reviewCats = categories.filter((c) => c.type === 'review');
  const quizCats = categories.filter((c) => c.type !== 'review');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={[{ label: 'أسئلة السفر للخارج' }]} />

      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">✈️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">أسئلة السفر للخارج للتمريض</h1>
        <p className="mt-1 text-blue-50">
          {total} سؤال اختيار من متعدد لمساعدتك تستعد لاختبارات الترخيص والتوظيف كممرض/ة بالخارج، مُراجعة إكلينيكيًا ومترجمة بالكامل.
        </p>
      </div>

      {/* Highlighted review folders (e.g. "مراجعة سريعة NCLEX/بروميتريك") — distinct from quiz tiles */}
      {reviewCats.map((cat) => (
        <Link
          key={cat.id}
          to={`/travel-questions/${cat.id}`}
          className="mb-8 flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-orange-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-500/40 dark:from-amber-500/10 dark:to-orange-500/10"
        >
          <div className="text-4xl">{cat.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-900 dark:text-amber-300">{cat.name_ar}</span>
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">جديد ⭐</span>
            </div>
            {cat.name_en && <div className="text-sm text-amber-700/80 dark:text-amber-400/70">{cat.name_en}</div>}
          </div>
          <div className="text-amber-600 dark:text-amber-400">←</div>
        </Link>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizCats.map((cat) => {
          const progress = loadTravelProgress(cat.id);
          const answered = progress.answeredCorrectly.length + progress.answeredWrong.length;
          const total_q = counts[cat.id] ?? 0;
          const pct = total_q ? Math.round((answered / total_q) * 100) : 0;
          return (
            <Link
              key={cat.id}
              to={`/travel-questions/${cat.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{cat.icon}</div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{cat.name_ar}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{cat.name_en}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {total_q} سؤال{answered > 0 && ` — تم حل ${answered}`}
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-gradient-to-l from-cyan-400 to-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            المحتوى قيد الإضافة قريبًا
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2b) Review folder view — صفحة مرجعية (مقالات) بدل الاختبار التفاعلي
//     Used when category.type === 'review' (e.g. "مراجعة سريعة NCLEX/بروميتريك")
// ---------------------------------------------------------------------------

function TravelReviewView({ category }: { category: TravelCategory }) {
  const [sections, setSections] = useState<TravelReviewSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showArabic, setShowArabic] = useState(true);

  useSEO({ title: `${category.name_ar} | أسئلة السفر للخارج | NurseHub Egypt` });

  useEffect(() => {
    fetchTravelReviewSections(category.id)
      .then((s) => {
        setSections(s);
        setActiveId(s[0]?.id ?? null);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [category.id]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={[{ label: 'أسئلة السفر للخارج', path: '/travel-questions' }, { label: category.name_ar }]} />

      <div className="mb-6 mt-4 overflow-hidden rounded-3xl bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">{category.icon}</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{category.name_ar}</h1>
        {category.name_en && <p className="mt-1 text-amber-50">{category.name_en}</p>}
        <p className="mt-2 text-sm text-amber-50/90">{sections.length} قسم مراجعة سريعة — جداول وملخصات جاهزة للحفظ قبل الامتحان</p>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          المحتوى قيد الإضافة قريبًا
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar: section list (sticky on desktop, horizontal scroll on mobile) */}
          <nav className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm font-semibold transition lg:shrink lg:w-full ${
                    active?.id === s.id
                      ? 'border-orange-400 bg-orange-50 text-orange-800 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{s.title_ar}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          {active && (
            <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-white">
                  <span className="text-2xl">{active.icon}</span> {active.title_ar}
                </h2>
                {active.content_en && (
                  <button
                    onClick={() => setShowArabic((v) => !v)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      showArabic
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-slate-800 dark:text-orange-300'
                    }`}
                  >
                    🌐 {showArabic ? 'English' : 'ترجمة'}
                  </button>
                )}
              </div>
              <ArticleContent
                html={(showArabic ? active.content_ar : active.content_en) || active.content_ar}
                slug={active.id}
                lang={showArabic ? 'ar' : 'en'}
                className="prose-content reading-measure max-w-none text-slate-700 dark:text-slate-300"
              />
            </article>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Route wrapper — يقرر يعرض شاشة الاختبار ولا شاشة المراجعة حسب category.type
// ---------------------------------------------------------------------------

export default function TravelQuestionsStudy() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<TravelCategory | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    fetchTravelCategories()
      .then((cats) => setCategory(cats.find((c) => c.id === categoryId) ?? null))
      .catch((e) => setCatError(String(e?.message ?? e)))
      .finally(() => setCatLoading(false));
  }, [categoryId]);

  if (catLoading) return <LoadingBlock />;
  if (catError) return <div className="p-6 text-red-600">خطأ: {catError}</div>;
  if (!category) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <p className="mt-3 text-slate-500 dark:text-slate-400">القسم غير موجود</p>
        <Link to="/travel-questions" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 font-bold text-white">
          أسئلة السفر للخارج
        </Link>
      </div>
    );
  }

  if (category.type === 'review') {
    return <TravelReviewView category={category} />;
  }

  return <TravelQuestionsQuiz category={category} />;
}

// ---------------------------------------------------------------------------
// 4) Quiz screen — سؤال بسؤال مع الشرح (category.type !== 'review')
// ---------------------------------------------------------------------------

function TravelQuestionsQuiz({ category }: { category: TravelCategory }) {
  const categoryId = category.id;
  const [questions, setQuestions] = useState<TravelQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<string[]>([]);
  const [answeredWrong, setAnsweredWrong] = useState<string[]>([]);
  const [showArabic, setShowArabic] = useState(true);

  useSEO({ title: `${category.name_ar} | أسئلة السفر للخارج | NurseHub Egypt` });

  useEffect(() => {
    fetchTravelQuestions(categoryId)
      .then((qs) => {
        setQuestions(qs);
        const progress = loadTravelProgress(categoryId);
        setIndex(Math.min(progress.currentIndex, Math.max(qs.length - 1, 0)));
        setAnsweredCorrectly(progress.answeredCorrectly);
        setAnsweredWrong(progress.answeredWrong);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <p className="mt-3 text-slate-500 dark:text-slate-400">لا توجد أسئلة في هذا القسم بعد</p>
        <Link to="/travel-questions" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 font-bold text-white">
          أسئلة السفر للخارج
        </Link>
      </div>
    );
  }

  const q = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.correct_letter;

  const arabicChoiceByLetter = new Map((q.choices_ar ?? []).map((c) => [c.letter, c.text]));
  const displayedQuestion = showArabic && q.question_ar ? q.question_ar : q.question_en;
  const displayedChoices = q.choices.map((c) => ({
    letter: c.letter,
    text: showArabic ? arabicChoiceByLetter.get(c.letter) || c.text : c.text,
  }));
  const hasArabicTranslation = Boolean(q.question_ar);

  function persist(nextIndex: number, correct: string[], wrong: string[]) {
    if (!categoryId) return;
    saveTravelProgress(categoryId, { currentIndex: nextIndex, answeredCorrectly: correct, answeredWrong: wrong });
  }

  function handleSelect(letter: string) {
    if (isAnswered) return;
    setSelected(letter);
    let correct = answeredCorrectly;
    let wrong = answeredWrong;
    if (letter === q.correct_letter) {
      if (!correct.includes(q.id)) correct = [...correct, q.id];
      setAnsweredCorrectly(correct);
    } else {
      if (!wrong.includes(q.id)) wrong = [...wrong, q.id];
      setAnsweredWrong(wrong);
    }
    persist(index, correct, wrong);
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(next, questions.length - 1));
    setIndex(clamped);
    setSelected(null);
    persist(clamped, answeredCorrectly, answeredWrong);
  }

  function handleReset() {
    if (!categoryId) return;
    resetTravelProgress(categoryId);
    setIndex(0);
    setSelected(null);
    setAnsweredCorrectly([]);
    setAnsweredWrong([]);
  }

  const answeredCount = answeredCorrectly.length + answeredWrong.length;
  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={[{ label: 'أسئلة السفر للخارج', path: '/travel-questions' }, { label: category.name_ar }]} />

      <div className="mb-2 mt-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">
          {category.icon} {category.name_ar}
        </h1>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 underline hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          إعادة تعيين التقدم (Reset progress)
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-2">
          سؤال {index + 1} من {questions.length}
          {hasArabicTranslation && (
            <button
              onClick={() => setShowArabic((v) => !v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                showArabic
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700'
              }`}
            >
              🌐 {showArabic ? 'English' : 'ترجمة'}
            </button>
          )}
        </span>
        <span>
          صحيح: {answeredCorrectly.length} · خطأ: {answeredWrong.length} · تم حل {answeredCount}
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-gradient-to-l from-cyan-400 to-indigo-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Question card */}
      <div
        className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        dir={showArabic ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 font-medium leading-relaxed text-slate-800 dark:text-white">{displayedQuestion}</div>

        <div className="space-y-2">
          {displayedChoices.map((choice) => {
            const isThisSelected = selected === choice.letter;
            const isThisCorrect = choice.letter === q.correct_letter;

            let stateClasses =
              'border-slate-200 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-slate-800';
            if (isAnswered && isThisCorrect) {
              stateClasses = 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40';
            } else if (isAnswered && isThisSelected && !isThisCorrect) {
              stateClasses = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
            } else if (isAnswered) {
              stateClasses = 'border-slate-100 opacity-60 dark:border-slate-800';
            }

            return (
              <button
                key={choice.letter}
                onClick={() => handleSelect(choice.letter)}
                disabled={isAnswered}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-right transition-colors rtl:text-right ${stateClasses}`}
              >
                <span className="font-semibold text-slate-500 dark:text-slate-400">{choice.letter}.</span>
                <span className="text-slate-700 dark:text-slate-200">{choice.text}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className={`mt-4 rounded-xl p-4 text-sm leading-relaxed ${
              isCorrect
                ? 'border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                : 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
            }`}
          >
            <div className={`mb-2 font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {isCorrect ? '✅ إجابة صحيحة (Correct)' : `❌ إجابة خاطئة — الصحيح هو (${q.correct_letter})`}
            </div>
            <div className="mb-2 text-slate-700 dark:text-slate-200">{q.rationale_ar}</div>
            <div className="border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {q.rationale_en}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          → السابق (Previous)
        </button>
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === questions.length - 1}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-30"
        >
          التالي (Next) ←
        </button>
      </div>
    </div>
  );
}
