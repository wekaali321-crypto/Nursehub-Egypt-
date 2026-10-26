// src/lib/coursesApi.ts
// API layer for the "الكورسات" (Courses) section: courses -> chapters (HTML content) + quiz questions.
// Same style as src/lib/travelQuestionsApi.ts.
import { supabase } from './supabase';

export interface Course {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  image_url: string | null;
  /** 'courses' = the Courses section; 'drugs' = guides shown inside the Drugs hub. */
  section?: string;
}

export interface CourseChapter {
  id: string;
  course_id: string;
  order_num: number;
  title_ar: string;
  title_en: string;
  icon: string | null;
  /** HTML (tables, lists, <img>, <figure class="nh-fig">, <div class="nh-box nh-info|nh-warning|nh-success|nh-error">) */
  content_ar: string;
  content_en: string;
}

export interface CourseChoice {
  letter: string;
  text: string;
}

export interface CourseQuestion {
  id: string;
  course_id: string;
  chapter_id: string | null;
  order_num: number;
  question_en: string;
  question_ar: string;
  choices: CourseChoice[];
  choices_ar: CourseChoice[];
  /** Single letter, or comma-separated sorted letters for "select all that apply". */
  correct_letter: string;
  rationale_ar: string;
  rationale_en: string;
  image_url?: string | null;
}

// ---------- Courses ----------

export async function fetchCourses(): Promise<Course[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('courses').select('*').order('order_num', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function upsertCourse(c: Course): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('courses').upsert(c);
  if (error) throw error;
}

export async function deleteCourse(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Chapters ----------

const CHAPTER_LIST_COLUMNS = 'id,course_id,order_num,title_ar,title_en,icon';

/** Chapters of one course (all columns incl. content), or all chapters when no course is given. */
export async function fetchCourseChapters(courseId?: string): Promise<CourseChapter[]> {
  if (!supabase) return [];
  let query = supabase.from('course_chapters').select('*').order('order_num', { ascending: true }).order('id', { ascending: true });
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CourseChapter[];
}

export type CourseChapterLite = Pick<CourseChapter, 'id' | 'course_id' | 'order_num' | 'title_ar' | 'title_en' | 'icon'>;

/** Light version (no HTML content) for chapter lists, counts and global search. */
export async function fetchCourseChaptersLite(courseId?: string): Promise<CourseChapterLite[]> {
  if (!supabase) return [];
  let query = supabase
    .from('course_chapters')
    .select(CHAPTER_LIST_COLUMNS)
    .order('order_num', { ascending: true })
    .order('id', { ascending: true });
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CourseChapterLite[];
}

export async function fetchCourseChapter(id: string): Promise<CourseChapter | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('course_chapters').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as CourseChapter | null) ?? null;
}

export async function upsertCourseChapter(c: CourseChapter): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('course_chapters').upsert(c);
  if (error) throw error;
}

export async function deleteCourseChapter(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('course_chapters').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Questions ----------

// PostgREST caps a single response (1000 rows by default), so large tables must be read in pages.
const PAGE_SIZE = 1000;

async function fetchAllPages<T>(columns: string, courseId?: string): Promise<T[]> {
  if (!supabase) return [];
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from('course_questions')
      .select(columns)
      .order('order_num', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function fetchCourseQuestions(courseId?: string): Promise<CourseQuestion[]> {
  return fetchAllPages<CourseQuestion>('*', courseId);
}

/** Per-course question counts without downloading the questions. */
export async function fetchCourseQuestionCounts(): Promise<{ byCourse: Record<string, number>; byChapter: Record<string, number> }> {
  const rows = await fetchAllPages<{ course_id: string; chapter_id: string | null }>('course_id,chapter_id');
  const byCourse: Record<string, number> = {};
  const byChapter: Record<string, number> = {};
  for (const r of rows) {
    byCourse[r.course_id] = (byCourse[r.course_id] ?? 0) + 1;
    if (r.chapter_id) byChapter[r.chapter_id] = (byChapter[r.chapter_id] ?? 0) + 1;
  }
  return { byCourse, byChapter };
}

export async function upsertCourseQuestion(q: CourseQuestion): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('course_questions').upsert(q);
  if (error) throw error;
}

export async function deleteCourseQuestion(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('course_questions').delete().eq('id', id);
  if (error) throw error;
}

/** Per-course chapter counts. */
export function countChaptersByCourse(chapters: { course_id: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of chapters) counts[c.course_id] = (counts[c.course_id] ?? 0) + 1;
  return counts;
}

// ---------- "Completed" marks for chapters (localStorage, per course) ----------

function completedKey(courseId: string) {
  return `course_completed_${courseId}`;
}

export function loadCompletedChapters(courseId: string): string[] {
  try {
    const raw = localStorage.getItem(completedKey(courseId));
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function saveCompletedChapters(courseId: string, ids: string[]): void {
  try {
    localStorage.setItem(completedKey(courseId), JSON.stringify(ids));
  } catch {
    /* storage may be unavailable, fail silently */
  }
}
