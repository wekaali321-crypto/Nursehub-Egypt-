// src/lib/examLicensureApi.ts
// API layer for the "مزاولة المهنة" (Professional Licensure Exams) section.
// Standalone table pattern (same as OTC / applied-pharm / icu_medications) — NOT wired into the global store.
import { supabase } from './supabase';

export interface ExamCategory {
  id: string;
  order_num: number;
  name_ar: string;
  name_en: string;
  icon: string;
  description_ar: string | null;
  description_en: string | null;
}

export interface Exam {
  id: string;
  category_id: string;
  order_num: number;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  question_count: number;
}

export interface ExamChoice {
  letter: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  order_num: number;
  question_en: string;
  choices: ExamChoice[];
  correct_letter: string;
  rationale_ar: string;
  rationale_en: string;
  created_at?: string;
}

// ---------- Categories ----------

export async function fetchExamCategories(): Promise<ExamCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exam_categories')
    .select('*')
    .order('order_num', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertExamCategory(cat: ExamCategory): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exam_categories').upsert(cat);
  if (error) throw error;
}

export async function deleteExamCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exam_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Exams ----------

export async function fetchExams(categoryId?: string): Promise<Exam[]> {
  if (!supabase) return [];
  let query = supabase.from('exams').select('*').order('order_num', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchExamById(id: string): Promise<Exam | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertExam(exam: Exam): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exams').upsert(exam);
  if (error) throw error;
}

export async function deleteExam(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Questions ----------

export async function fetchExamQuestions(examId: string): Promise<ExamQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_num', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ExamQuestion[];
}

export async function upsertExamQuestion(q: ExamQuestion): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exam_questions').upsert(q);
  if (error) throw error;
}

export async function deleteExamQuestion(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('exam_questions').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Per-exam progress (localStorage, same pattern as clinical_protocols) ----------

interface ExamProgress {
  currentIndex: number;
  answeredCorrectly: string[]; // question ids
  answeredWrong: string[]; // question ids
}

function progressKey(examId: string) {
  return `exam_progress_${examId}`;
}

export function loadExamProgress(examId: string): ExamProgress {
  try {
    const raw = localStorage.getItem(progressKey(examId));
    if (raw) return JSON.parse(raw) as ExamProgress;
  } catch {
    /* ignore corrupt storage */
  }
  return { currentIndex: 0, answeredCorrectly: [], answeredWrong: [] };
}

export function saveExamProgress(examId: string, progress: ExamProgress): void {
  try {
    localStorage.setItem(progressKey(examId), JSON.stringify(progress));
  } catch {
    /* storage may be unavailable, fail silently */
  }
}

export function resetExamProgress(examId: string): void {
  try {
    localStorage.removeItem(progressKey(examId));
  } catch {
    /* ignore */
  }
}
