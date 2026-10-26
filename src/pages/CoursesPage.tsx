// src/pages/CoursesPage.tsx
// "الكورسات" (Courses) section: course grid, course page (chapter list), chapter reader and quiz.
//
// Exports:
//   - CoursesHome   : /courses                              grid of courses
//   - CoursePage    : /courses/:courseId                    chapters list + quiz button
//   - ChapterPage   : /courses/:courseId/chapter/:chapterId chapter reader
//   - CourseQuiz    : /courses/:courseId/quiz[?chapter=ID]  QuizRunner over the course questions

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  fetchCourses,
  fetchCourseChaptersLite,
  fetchCourseChapter,
  fetchCourseQuestions,
  fetchCourseQuestionCounts,
  countChaptersByCourse,
  loadCompletedChapters,
  saveCompletedChapters,
  type Course,
  type CourseChapter,
  type CourseChapterLite,
  type CourseQuestion,
} from '../lib/coursesApi';
import { Breadcrumbs } from '../components/common';
import ArticleContent from '../components/ArticleContent';
import QuizRunner from '../components/QuizRunner';
import { ImageLightbox } from '../components/Lightbox';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { useSEO } from '../lib/seo';
import { useI18n } from '../lib/i18n';

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
      <span className="animate-pulse">جاري التحميل... (Loading...)</span>
    </div>
  );
}

function NotFoundBlock({ text, to, label }: { text: string; to: string; label: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="text-6xl">❓</div>
      <p className="mt-3 text-slate-500 dark:text-slate-400">{text}</p>
      <Link to={to} className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 font-bold text-white">
        {label}
      </Link>
    </div>
  );
}

const titleOf = (c: { title_ar: string; title_en: string }, ar: boolean) => (ar ? c.title_ar : c.title_en || c.title_ar);

// ---------------------------------------------------------------------------
// 1) Hub — /courses
// ---------------------------------------------------------------------------

export function CoursesHome() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: 'الكورسات | NurseHub Egypt',
    description: 'كورسات تمريض تفاعلية: ACLS وPALS ودليل الجيب للطوارئ والعناية الحرجة، بفصول مفصلة وأسئلة تدريبية ثنائية اللغة.',
  });

  useEffect(() => {
    Promise.all([fetchCourses(), fetchCourseChaptersLite(), fetchCourseQuestionCounts()])
      .then(([cs, chapters, q]) => {
        setCourses(cs);
        setChapterCounts(countChaptersByCourse(chapters));
        setQuestionCounts(q.byCourse);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الكورسات' : 'Courses' }]} />

      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-rose-600 via-red-600 to-orange-600 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">🎓</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{ar ? 'الكورسات' : 'Courses'}</h1>
        <p className="mt-1 text-rose-50">
          {ar
            ? 'كورسات الإنعاش والطوارئ والعناية الحرجة بفصول مفصلة وأسئلة تدريبية بالعربي والإنجليزي.'
            : 'Resuscitation, emergency and critical care courses with detailed chapters and bilingual practice questions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <Link
            key={c.id}
            to={`/courses/${c.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="h-36 w-full object-cover" />}
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{c.icon || '🎓'}</div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 dark:text-white">{titleOf(c, ar)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{ar ? c.title_en : c.title_ar}</div>
                </div>
              </div>
              {(ar ? c.description_ar : c.description_en || c.description_ar) && (
                <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{ar ? c.description_ar : c.description_en || c.description_ar}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  📖 {chapterCounts[c.id] ?? 0} {ar ? 'فصل' : 'chapters'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  🧩 {questionCounts[c.id] ?? 0} {ar ? 'سؤال' : 'questions'}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {ar ? 'المحتوى قيد الإضافة قريبًا' : 'Content coming soon'}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Course page — /courses/:courseId
// ---------------------------------------------------------------------------

export function CoursePage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<CourseChapterLite[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({ title: course ? `${course.title_ar} | الكورسات | NurseHub Egypt` : 'الكورسات | NurseHub Egypt', description: course?.description_ar ?? undefined });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchCourseChaptersLite(courseId), fetchCourseQuestionCounts()])
      .then(([cs, chs, q]) => {
        setCourse(cs.find((c) => c.id === courseId) ?? null);
        setChapters(chs);
        setQuestionCount(q.byCourse[courseId] ?? 0);
        setDone(loadCompletedChapters(courseId));
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [courseId]);

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () => chapters.map((c, i) => ({ c, n: i + 1 })).filter(({ c }) => !term || `${c.title_ar} ${c.title_en}`.toLowerCase().includes(term)),
    [chapters, term]
  );

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;
  if (!course) return <NotFoundBlock text={ar ? 'الكورس غير موجود' : 'Course not found'} to="/courses" label={ar ? 'الكورسات' : 'Courses'} />;

  const doneCount = chapters.filter((c) => done.includes(c.id)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الكورسات' : 'Courses', path: '/courses' }, { label: titleOf(course, ar) }]} />

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-rose-600 via-red-600 to-orange-600 p-6 text-white shadow-lg sm:p-8">
        <div className="text-4xl sm:text-5xl">{course.icon || '🎓'}</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{titleOf(course, ar)}</h1>
        <p className="mt-1 text-rose-50">{ar ? course.title_en : course.title_ar}</p>
        {(ar ? course.description_ar : course.description_en || course.description_ar) && (
          <p className="mt-2 text-sm text-rose-50/90">{ar ? course.description_ar : course.description_en || course.description_ar}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            📖 {chapters.length} {ar ? 'فصل' : 'chapters'} · ✅ {doneCount}
          </span>
          {questionCount > 0 && (
            <Link to={`/courses/${course.id}/quiz`} className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-rose-700 hover:bg-rose-50">
              🧩 {ar ? `ابدأ الاختبار (${questionCount} سؤال)` : `Start quiz (${questionCount} questions)`}
            </Link>
          )}
        </div>
      </div>

      {chapters.length > 6 && (
        <input
          className="mb-4 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          placeholder={ar ? 'ابحث في الفصول...' : 'Search chapters...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="space-y-2">
        {visible.map(({ c, n }) => (
          <Link
            key={c.id}
            to={`/courses/${course.id}/chapter/${c.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{n}</span>
            <span className="text-xl">{c.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-800 dark:text-white">{titleOf(c, ar)}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{ar ? c.title_en : c.title_ar}</span>
            </span>
            {done.includes(c.id) && <span className="text-emerald-500" title={ar ? 'تم' : 'Completed'}>✅</span>}
          </Link>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
            {chapters.length === 0 ? (ar ? 'المحتوى قيد الإضافة قريبًا' : 'Content coming soon') : ar ? 'لا توجد نتائج' : 'No results'}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3) Chapter reader — /courses/:courseId/chapter/:chapterId
// ---------------------------------------------------------------------------

export function ChapterPage() {
  const { courseId = '', chapterId = '' } = useParams<{ courseId: string; chapterId: string }>();
  const { lang } = useI18n();
  const siteAr = lang === 'ar';
  const [course, setCourse] = useState<Course | null>(null);
  const [list, setList] = useState<CourseChapterLite[]>([]);
  const [chapter, setChapter] = useState<CourseChapter | null>(null);
  const [chapterQuestions, setChapterQuestions] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [showArabic, setShowArabic] = useState(siteAr);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({ title: chapter ? `${chapter.title_ar} | ${course?.title_ar ?? 'الكورسات'} | NurseHub Egypt` : 'الكورسات | NurseHub Egypt' });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchCourseChaptersLite(courseId), fetchCourseChapter(chapterId), fetchCourseQuestionCounts()])
      .then(([cs, chs, ch, q]) => {
        setCourse(cs.find((c) => c.id === courseId) ?? null);
        setList(chs);
        setChapter(ch && ch.course_id === courseId ? ch : null);
        setChapterQuestions(q.byChapter[chapterId] ?? 0);
        setDone(loadCompletedChapters(courseId));
        window.scrollTo(0, 0);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [courseId, chapterId]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;
  if (!course || !chapter) {
    return <NotFoundBlock text={siteAr ? 'الفصل غير موجود' : 'Chapter not found'} to={`/courses/${courseId}`} label={siteAr ? 'الكورس' : 'Course'} />;
  }

  const idx = list.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const isDone = done.includes(chapter.id);
  const hasEn = Boolean(chapter.content_en);
  const html = sanitizeHtml((showArabic ? chapter.content_ar : chapter.content_en) || chapter.content_ar || chapter.content_en);

  function toggleDone() {
    const nextDone = isDone ? done.filter((x) => x !== chapter!.id) : [...done, chapter!.id];
    setDone(nextDone);
    saveCompletedChapters(courseId, nextDone);
  }

  // Click on any image inside the chapter HTML opens the full-resolution lightbox
  function handleContentClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.tagName === 'IMG') setZoom({ src: (t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src, alt: (t as HTMLImageElement).alt });
  }

  const navBtn = 'flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" dir={siteAr ? 'rtl' : 'ltr'}>
      <Breadcrumbs
        items={[
          { label: siteAr ? 'الكورسات' : 'Courses', path: '/courses' },
          { label: titleOf(course, siteAr), path: `/courses/${course.id}` },
          { label: titleOf(chapter, siteAr) },
        ]}
      />

      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {siteAr ? 'الفصل' : 'Chapter'} {idx + 1} / {list.length}
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-black text-slate-800 dark:text-white sm:text-2xl">
              <span className="text-2xl">{chapter.icon}</span> {showArabic ? chapter.title_ar : chapter.title_en || chapter.title_ar}
            </h1>
          </div>
          {hasEn && (
            <button
              onClick={() => setShowArabic((v) => !v)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                showArabic
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-slate-800 dark:text-rose-300'
              }`}
            >
              🌐 {showArabic ? 'English' : 'ترجمة'}
            </button>
          )}
        </div>

        {html.trim() ? (
          <div onClick={handleContentClick}>
            <ArticleContent
              html={html}
              slug={chapter.id}
              lang={showArabic ? 'ar' : 'en'}
              className="prose-content course-content max-w-none text-slate-700 dark:text-slate-300"
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">{siteAr ? 'المحتوى قيد الإضافة قريبًا' : 'Content coming soon'}</div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={toggleDone}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              isDone ? 'bg-emerald-600 text-white' : 'border border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
            }`}
          >
            {isDone ? (siteAr ? '✅ تم إكمال الفصل' : '✅ Completed') : siteAr ? 'تحديد كمكتمل' : 'Mark as completed'}
          </button>
          {chapterQuestions > 0 && (
            <Link to={`/courses/${course.id}/quiz?chapter=${chapter.id}`} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              🧩 {siteAr ? `أسئلة هذا الفصل (${chapterQuestions})` : `Chapter questions (${chapterQuestions})`}
            </Link>
          )}
        </div>
      </article>

      <div className="mt-4 flex gap-3">
        {prev ? (
          <Link to={`/courses/${course.id}/chapter/${prev.id}`} className={navBtn}>
            <span>{siteAr ? '→' : '←'}</span>
            <span className="truncate">{titleOf(prev, siteAr)}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link to={`/courses/${course.id}/chapter/${next.id}`} className={`${navBtn} justify-end text-end`}>
            <span className="truncate">{titleOf(next, siteAr)}</span>
            <span>{siteAr ? '←' : '→'}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </div>

      {zoom && <ImageLightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4) Quiz — /courses/:courseId/quiz[?chapter=ID]
// ---------------------------------------------------------------------------

export function CourseQuiz() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const [params] = useSearchParams();
  const chapterId = params.get('chapter');
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({ title: `${course?.title_ar ?? 'الكورسات'} | أسئلة | NurseHub Egypt` });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchCourseQuestions(courseId)])
      .then(([cs, qs]) => {
        setCourse(cs.find((c) => c.id === courseId) ?? null);
        setQuestions(chapterId ? qs.filter((q) => q.chapter_id === chapterId) : qs);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [courseId, chapterId]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6 text-red-600">خطأ: {error}</div>;
  if (!course) return <NotFoundBlock text="الكورس غير موجود" to="/courses" label="الكورسات" />;

  return (
    <QuizRunner
      key={`${courseId}:${chapterId ?? ''}`}
      questions={questions}
      storageKey={chapterId ? `course_progress_${courseId}_${chapterId}` : `course_progress_${courseId}`}
      breadcrumbs={[{ label: 'الكورسات', path: '/courses' }, { label: course.title_ar, path: `/courses/${course.id}` }, { label: 'الأسئلة' }]}
      title={`${course.icon ?? '🎓'} ${course.title_ar}`}
      backTo={{ path: `/courses/${course.id}`, label: course.title_ar }}
    />
  );
}
