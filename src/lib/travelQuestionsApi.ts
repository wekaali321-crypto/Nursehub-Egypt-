// src/lib/travelQuestionsApi.ts
// API layer for the "أسئلة السفر للخارج" (Questions for Traveling Abroad) section.
// MCQ quiz format — mirrors src/lib/examLicensureApi.ts, but scoped directly to a
// category (no separate "exams" grouping level; each category IS the quiz).
import { supabase } from './supabase';

export interface TravelCategory {
  id: string;
  order_num: number;
  name_ar: string;
  name_en: string | null;
  icon: string;
}

export interface TravelChoice {
  letter: string;
  text: string;
}

export interface TravelQuestion {
  id: string;
  category_id: string;
  order_num: number;
  question_en: string;
  question_ar: string | null;
  choices: TravelChoice[];
  choices_ar: TravelChoice[] | null;
  correct_letter: string;
  rationale_ar: string;
  rationale_en: string;
}

// ---------- Categories ----------

export async function fetchTravelCategories(): Promise<TravelCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('travel_categories')
    .select('*')
    .order('order_num', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertTravelCategory(cat: TravelCategory): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('travel_categories').upsert(cat);
  if (error) throw error;
}

export async function deleteTravelCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('travel_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Questions ----------

export async function fetchTravelQuestions(categoryId?: string): Promise<TravelQuestion[]> {
  if (!supabase) return [];
  let query = supabase.from('travel_questions').select('*').order('order_num', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TravelQuestion[];
}

export async function upsertTravelQuestion(q: TravelQuestion): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('travel_questions').upsert(q);
  if (error) throw error;
}

export async function deleteTravelQuestion(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('travel_questions').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Per-category progress (localStorage, same pattern as exam_progress) ----------

interface TravelProgress {
  currentIndex: number;
  answeredCorrectly: string[]; // question ids
  answeredWrong: string[]; // question ids
}

function progressKey(categoryId: string) {
  return `travel_progress_${categoryId}`;
}

export function loadTravelProgress(categoryId: string): TravelProgress {
  try {
    const raw = localStorage.getItem(progressKey(categoryId));
    if (raw) return JSON.parse(raw) as TravelProgress;
  } catch {
    /* ignore corrupt storage */
  }
  return { currentIndex: 0, answeredCorrectly: [], answeredWrong: [] };
}

export function saveTravelProgress(categoryId: string, progress: TravelProgress): void {
  try {
    localStorage.setItem(progressKey(categoryId), JSON.stringify(progress));
  } catch {
    /* storage may be unavailable, fail silently */
  }
}

export function resetTravelProgress(categoryId: string): void {
  try {
    localStorage.removeItem(progressKey(categoryId));
  } catch {
    /* ignore */
  }
}
