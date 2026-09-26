// src/lib/interviewQuestionsApi.ts
// API layer for the "أسئلة المقابلات الشخصية" (Interview Questions) section.
// Standalone table pattern (same as exam_categories/exams/exam_questions) — NOT wired into the global store.
import { supabase } from './supabase';

export interface InterviewCategory {
  id: string;
  order_num: number;
  name_ar: string;
  name_en: string;
  icon: string;
}

export interface InterviewQuestion {
  id: string;
  category_id: string;
  order_num: number;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
  related_path: string | null;
  related_label_ar: string | null;
  related_label_en: string | null;
  source_credit: string | null;
}

// ---------- Categories ----------

export async function fetchInterviewCategories(): Promise<InterviewCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('interview_categories')
    .select('*')
    .order('order_num', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertInterviewCategory(cat: InterviewCategory): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('interview_categories').upsert(cat);
  if (error) throw error;
}

export async function deleteInterviewCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('interview_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Questions ----------

export async function fetchInterviewQuestions(categoryId?: string): Promise<InterviewQuestion[]> {
  if (!supabase) return [];
  let query = supabase.from('interview_questions').select('*').order('order_num', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertInterviewQuestion(q: InterviewQuestion): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('interview_questions').upsert(q);
  if (error) throw error;
}

export async function deleteInterviewQuestion(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('interview_questions').delete().eq('id', id);
  if (error) throw error;
}
