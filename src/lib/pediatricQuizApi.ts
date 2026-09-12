import { supabase } from "./supabase";

export interface PediatricQuizQuestion {
  id: string;
  order_num: number;
  category: string | null;
  text_ar: string;
  text_en: string | null;
  options_ar: string[];
  options_en: string[] | null;
  correct: number;
  explanation_ar: string | null;
  explanation_en: string | null;
}

export async function fetchPediatricQuizQuestions(): Promise<PediatricQuizQuestion[]> {
  const { data, error } = await supabase.from("pediatric_quiz_questions").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as PediatricQuizQuestion[];
}

export async function upsertPediatricQuizQuestion(item: PediatricQuizQuestion) {
  const { error } = await supabase.from("pediatric_quiz_questions").upsert(item);
  if (error) throw error;
}

export async function deletePediatricQuizQuestion(id: string) {
  const { error } = await supabase.from("pediatric_quiz_questions").delete().eq("id", id);
  if (error) throw error;
}
