// src/lib/travelQuestionsApi.ts
// API layer for the "أسئلة السفر للخارج" (Questions for Traveling Abroad) section.
// Standalone table pattern (same as interview_categories/interview_questions) — NOT wired into the global store.
import { supabase } from './supabase';

export interface TravelCategory {
  id: string;
  order_num: number;
  name_ar: string;
  name_en: string | null;
  icon: string;
}

export interface TravelQuestion {
  id: string;
  category_id: string;
  order_num: number;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
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
  return data ?? [];
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
