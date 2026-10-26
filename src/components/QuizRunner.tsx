// src/components/QuizRunner.tsx
// Shared question-by-question MCQ runner (single + "select all that apply" answers, bilingual toggle,
// rationale after completion, progress persisted in localStorage). Used by the travel questions
// and by the courses section.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from './common';
import { ImageLightbox } from './Lightbox';

export interface RunnerChoice {
  letter: string;
  text: string;
}

export interface RunnerQuestion {
  id: string;
  question_en: string;
  question_ar: string | null;
  choices: RunnerChoice[];
  choices_ar: RunnerChoice[] | null;
  correct_letter: string;
  rationale_ar: string;
  rationale_en: string;
  image_url?: string | null;
}

interface RunnerProgress {
  currentIndex: number;
  answeredCorrectly: string[]; // question ids
  answeredWrong: string[]; // question ids
}

export function loadRunnerProgress(storageKey: string): RunnerProgress {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as RunnerProgress;
  } catch {
    /* ignore corrupt storage */
  }
  return { currentIndex: 0, answeredCorrectly: [], answeredWrong: [] };
}

function saveRunnerProgress(storageKey: string, progress: RunnerProgress): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    /* storage may be unavailable, fail silently */
  }
}

function resetRunnerProgress(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

interface QuizRunnerProps {
  questions: RunnerQuestion[];
  /** Full localStorage key the progress is saved under. */
  storageKey: string;
  breadcrumbs: { label: string; path?: string }[];
  /** Heading shown above the progress bar (icon + name). */
  title: string;
  /** Where the "no questions" screen links back to. */
  backTo: { path: string; label: string };
  emptyText?: string;
}

export default function QuizRunner({ questions, storageKey, breadcrumbs, title, backTo, emptyText }: QuizRunnerProps) {
  const [index, setIndex] = useState(() =>
    Math.min(loadRunnerProgress(storageKey).currentIndex, Math.max(questions.length - 1, 0))
  );
  const [selected, setSelected] = useState<string | null>(null);
  // Multi-answer ("select all that apply") questions: letters picked so far
  const [picked, setPicked] = useState<string[]>([]);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<string[]>(() => loadRunnerProgress(storageKey).answeredCorrectly);
  const [answeredWrong, setAnsweredWrong] = useState<string[]>(() => loadRunnerProgress(storageKey).answeredWrong);
  const [showArabic, setShowArabic] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <p className="mt-3 text-slate-500 dark:text-slate-400">{emptyText ?? 'لا توجد أسئلة في هذا القسم بعد'}</p>
        <Link to={backTo.path} className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 font-bold text-white">
          {backTo.label}
        </Link>
      </div>
    );
  }

  const q = questions[index];
  const correctSet = q.correct_letter.split(',').map((x) => x.trim()).filter(Boolean);
  const isMulti = correctSet.length > 1;
  const multiDone = isMulti && correctSet.every((l) => picked.includes(l));
  const multiHadWrong = isMulti && picked.some((l) => !correctSet.includes(l));
  const isAnswered = isMulti ? multiDone : selected !== null;
  const isCorrect = isMulti ? multiDone && !multiHadWrong : selected === q.correct_letter;

  const arabicChoiceByLetter = new Map((q.choices_ar ?? []).map((c) => [c.letter, c.text]));
  const displayedQuestion = showArabic && q.question_ar ? q.question_ar : q.question_en;
  const displayedChoices = q.choices.map((c) => ({
    letter: c.letter,
    text: showArabic ? arabicChoiceByLetter.get(c.letter) || c.text : c.text,
  }));
  const hasArabicTranslation = Boolean(q.question_ar);

  function persist(nextIndex: number, correct: string[], wrong: string[]) {
    if (!storageKey) return;
    saveRunnerProgress(storageKey, { currentIndex: nextIndex, answeredCorrectly: correct, answeredWrong: wrong });
  }

  function record(isRight: boolean) {
    let correct = answeredCorrectly;
    let wrong = answeredWrong;
    if (isRight) {
      if (!correct.includes(q.id)) correct = [...correct, q.id];
      setAnsweredCorrectly(correct);
    } else {
      if (!wrong.includes(q.id)) wrong = [...wrong, q.id];
      setAnsweredWrong(wrong);
    }
    persist(index, correct, wrong);
  }

  function handleSelect(letter: string) {
    if (isAnswered) return;
    if (isMulti) {
      if (picked.includes(letter)) return;
      const next = [...picked, letter];
      setPicked(next);
      if (correctSet.every((l) => next.includes(l))) {
        record(!next.some((l) => !correctSet.includes(l)));
      }
      return;
    }
    setSelected(letter);
    record(letter === q.correct_letter);
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(next, questions.length - 1));
    setIndex(clamped);
    setSelected(null);
    setPicked([]);
    persist(clamped, answeredCorrectly, answeredWrong);
  }

  function handleReset() {
    if (!storageKey) return;
    resetRunnerProgress(storageKey);
    setIndex(0);
    setSelected(null);
    setPicked([]);
    setAnsweredCorrectly([]);
    setAnsweredWrong([]);
  }

  const answeredCount = answeredCorrectly.length + answeredWrong.length;
  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-2 mt-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
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
        {isMulti && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {showArabic
              ? '⚠️ تنبيه: هذا السؤال متعدد الاختيارات — اختر كل الإجابات الصحيحة. ستظهر باقي النتائج بعد اختيار كل الإجابات الصحيحة.'
              : '⚠️ Note: this is a multiple-response question — select ALL correct answers. The remaining results appear once you have found all the correct ones.'}
          </div>
        )}
        {q.image_url && (
          <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700">
            <img
              src={q.image_url}
              alt={q.question_en.slice(0, 80)}
              loading="lazy"
              onClick={() => setZoomed(true)}
              className="mx-auto max-h-[420px] w-full cursor-zoom-in object-contain"
              dir="ltr"
            />
          </div>
        )}
        {zoomed && q.image_url && <ImageLightbox src={q.image_url} alt={q.question_en.slice(0, 80)} onClose={() => setZoomed(false)} />}

        <div className="space-y-2">
          {displayedChoices.map((choice) => {
            const isThisSelected = isMulti ? picked.includes(choice.letter) : selected === choice.letter;
            const isThisCorrect = correctSet.includes(choice.letter);

            let stateClasses =
              'border-slate-200 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-slate-800';
            if (isMulti) {
              if (isThisSelected && isThisCorrect) {
                stateClasses = 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40';
              } else if (isThisSelected && !isThisCorrect) {
                stateClasses = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
              } else if (multiDone && !isThisCorrect) {
                // once every correct answer is found, the wrong options are revealed in red
                stateClasses = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
              }
            } else if (isAnswered && isThisCorrect) {
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
                disabled={isAnswered || (isMulti && isThisSelected)}
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
              {isCorrect
                ? '✅ إجابة صحيحة (Correct)'
                : isMulti
                  ? `❌ أخطأت في بعض الاختيارات — الإجابات الصحيحة هي (${correctSet.join(' ، ')})`
                  : `❌ إجابة خاطئة — الصحيح هو (${q.correct_letter})`}
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
