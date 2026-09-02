import { supabase } from "./supabase";

export interface PregnancyLactationSafety {
  id: string;
  order_num: number;
  drug_name: string;
  drug_class: string | null;
  category: string;
  pregnancy_category: string | null;
  pregnancy_notes: string | null;
  lactation_safety: string | null;
  lactation_notes: string | null;
  key_point: string | null;
  drug_name_en?: string | null;
  drug_class_en?: string | null;
  category_en?: string | null;
  pregnancy_notes_en?: string | null;
  lactation_safety_en?: string | null;
  lactation_notes_en?: string | null;
  key_point_en?: string | null;
}

export async function fetchPregnancyLactationSafety(): Promise<PregnancyLactationSafety[]> {
  const { data, error } = await supabase
    .from("pregnancy_lactation_safety")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as PregnancyLactationSafety[];
}

export async function upsertPregnancyLactationSafety(item: PregnancyLactationSafety) {
  const { error } = await supabase.from("pregnancy_lactation_safety").upsert(item);
  if (error) throw error;
}

export async function deletePregnancyLactationSafety(id: string) {
  const { error } = await supabase.from("pregnancy_lactation_safety").delete().eq("id", id);
  if (error) throw error;
}
