import { supabase } from "./supabase";

export interface TerminologyQuizQuestion {
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

export async function fetchTerminologyQuizQuestions(): Promise<TerminologyQuizQuestion[]> {
  const { data, error } = await supabase.from("terminology_quiz_questions").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as TerminologyQuizQuestion[];
}

export async function upsertTerminologyQuizQuestion(item: TerminologyQuizQuestion) {
  const { error } = await supabase.from("terminology_quiz_questions").upsert(item);
  if (error) throw error;
}

export async function deleteTerminologyQuizQuestion(id: string) {
  const { error } = await supabase.from("terminology_quiz_questions").delete().eq("id", id);
  if (error) throw error;
}
