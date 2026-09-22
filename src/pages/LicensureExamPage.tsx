// src/pages/LicensureExamPage.tsx
// Public-facing UI for "قسم الاختبارات > مزاولة المهنة" (Tests > Professional Licensure Exams).
// Standalone-table feature (see src/lib/examLicensureApi.ts) — NOT part of the global store/DataShape.
//
// Exports:
//   - LicensureExamsHome   : hub screen listing exam_categories as folder tiles
//   - LicensureExamCategory: lists exams within one category
//   - default (LicensureExamStudy): question-by-question study/exam screen for one exam
//
// Color palette: sky/blue/teal/cyan/indigo only, per project convention.
// Red is used ONLY as a genuine "wrong answer" feedback color (a real safety/correctness alert use case).

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchExamCategories,
  fetchExams,
  fetchExamById,
  fetchExamQuestions,
  loadExamProgress,
  saveExamProgress,
  resetExamProgress,
  type ExamCategory,
  type Exam,
  type ExamQuestion,
} from '../lib/examLicensureApi';

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
      <span className="animate-pulse">جاري التحميل... (Loading...)</span>
    </div>
  );
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 mb-4"
    >
      ← {label}
    </Link>
  );
}

// Categories reached via their own direct link card elsewhere in the app (e.g. the
// "اختبارات تدريبية - أساسيات التمريض" card on the main Tests page, /quizzes) are hidden
// from this hub's tile grid so they aren't listed twice.
const HIDDEN_FROM_HUB = new Set(["nursing-practice-exams"]);

// ---------------------------------------------------------------------------
// 1) Hub — لائحة أقسام الاختبارات (exam_categories)
// ---------------------------------------------------------------------------

export function LicensureExamsHome() {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamCategories()
      .then(setCategories)
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  const topLevelCategories = categories.filter((cat) => !HIDDEN_FROM_HUB.has(cat.id));

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">قسم الاختبارات</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Tests Section</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topLevelCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/tests/licensure/${cat.id}`}
            className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-teal-50 hover:from-sky-100 hover:to-teal-100 dark:from-slate-800 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-colors p-5 shadow-sm flex items-center gap-4"
          >
            <div className="text-4xl">{cat.icon}</div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-white">{cat.name_ar}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{cat.name_en}</div>
              {cat.description_ar && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{cat.description_ar}</div>
              )}
            </div>
          </Link>
        ))}
        {topLevelCategories.length === 0 && (
          <div className="text-slate-400 dark:text-slate-500 col-span-2 text-center py-10">
            لا توجد اختبارات بعد (No exams yet)
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Category detail — لائحة الامتحانات داخل القسم (exams)
// ---------------------------------------------------------------------------

export function LicensureExamCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<ExamCategory | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    Promise.all([fetchExamCategories(), fetchExams(categoryId)])
      .then(([cats, exs]) => {
        setCategory(cats.find((c) => c.id === categoryId) ?? null);
        setExams(exs);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6" dir="rtl">
      <BackLink to="/tests/licensure" label="الاختبارات" />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
        {category?.name_ar ?? 'الامتحانات'}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">{category?.name_en}</p>

      <div className="grid grid-cols-1 gap-4">
        {exams.map((exam) => {
          const progress = loadExamProgress(exam.id);
          const answered = progress.answeredCorrectly.length + progress.answeredWrong.length;
          const pct = exam.question_count
            ? Math.round((answered / exam.question_count) * 100)
            : 0;
          return (
            <Link
              key={exam.id}
              to={`/tests/licensure/${categoryId}/${exam.id}`}
              className="rounded-2xl border border-cyan-100 dark:border-slate-800 bg-white hover:bg-cyan-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors p-5 shadow-sm"
            >
              <div className="font-semibold text-slate-800 dark:text-white">{exam.title_ar}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">{exam.title_en}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                {exam.question_count} سؤال (questions){answered > 0 && ` — تم حل ${answered}`}
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-teal-400 to-sky-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
        {exams.length === 0 && (
          <div className="text-slate-400 dark:text-slate-500 text-center py-10">لا توجد امتحانات بعد</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Study screen — سؤال بسؤال مع الشرح (default export)
// ---------------------------------------------------------------------------

export default function LicensureExamStudy() {
  const { categoryId, examId } = useParams<{ categoryId: string; examId: string }>();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<string[]>([]);
  const [answeredWrong, setAnsweredWrong] = useState<string[]>([]);
  const [showArabic, setShowArabic] = useState(false);

  useEffect(() => {
    if (!examId) return;
    Promise.all([fetchExamById(examId), fetchExamQuestions(examId)])
      .then(([ex, qs]) => {
        setExam(ex);
        setQuestions(qs);
        const progress = loadExamProgress(examId);
        setIndex(Math.min(progress.currentIndex, Math.max(qs.length - 1, 0)));
        setAnsweredCorrectly(progress.answeredCorrectly);
        setAnsweredWrong(progress.answeredWrong);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;
  if (!exam || questions.length === 0) {
    return <div className="p-6 text-slate-500 dark:text-slate-400">لا توجد أسئلة في هذا الامتحان بعد</div>;
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
    if (!examId) return;
    saveExamProgress(examId, {
      currentIndex: nextIndex,
      answeredCorrectly: correct,
      answeredWrong: wrong,
    });
  }

  function handleSelect(letter: string) {
    if (isAnswered) return; // lock after first answer, like the clinical-protocols pattern
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
    setShowArabic(false);
    persist(clamped, answeredCorrectly, answeredWrong);
  }

  function handleReset() {
    if (!examId) return;
    resetExamProgress(examId);
    setIndex(0);
    setSelected(null);
    setAnsweredCorrectly([]);
    setAnsweredWrong([]);
  }

  const answeredCount = answeredCorrectly.length + answeredWrong.length;
  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6" dir="rtl">
      <BackLink to={`/tests/licensure/${categoryId ?? ''}`} label={exam.title_ar} />

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{exam.title_ar}</h1>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 underline"
        >
          إعادة تعيين التقدم (Reset progress)
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-1 flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-2">
          سؤال {index + 1} من {questions.length}
          {hasArabicTranslation && (
            <button
              onClick={() => setShowArabic((v) => !v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                showArabic
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700'
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
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-l from-sky-400 to-indigo-400"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 mb-4" dir={showArabic ? 'rtl' : 'ltr'}>
        <div className="text-slate-800 dark:text-white font-medium mb-4 leading-relaxed">{displayedQuestion}</div>

        <div className="space-y-2">
          {displayedChoices.map((choice) => {
            const isThisSelected = selected === choice.letter;
            const isThisCorrect = choice.letter === q.correct_letter;

            let stateClasses = 'border-slate-200 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:hover:border-sky-700 dark:hover:bg-slate-800';
            if (isAnswered && isThisCorrect) {
              stateClasses = 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40';
            } else if (isAnswered && isThisSelected && !isThisCorrect) {
              stateClasses = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
            } else if (isAnswered) {
              stateClasses = 'border-slate-100 dark:border-slate-800 opacity-60';
            }

            return (
              <button
                key={choice.letter}
                onClick={() => handleSelect(choice.letter)}
                disabled={isAnswered}
                className={`w-full text-right rtl:text-right rounded-xl border p-3 transition-colors flex gap-3 items-start ${stateClasses}`}
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
                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800'
            }`}
          >
            <div className={`font-semibold mb-2 ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {isCorrect ? '✅ إجابة صحيحة (Correct)' : `❌ إجابة خاطئة — الصحيح هو (${q.correct_letter})`}
            </div>
            <div className="text-slate-700 dark:text-slate-200 mb-2">{q.rationale_ar}</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-700 pt-2">
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
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          → السابق (Previous)
        </button>
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === questions.length - 1}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-30 hover:bg-sky-700"
        >
          التالي (Next) ←
        </button>
      </div>
    </div>
  );
}
