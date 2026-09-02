import { supabase } from "./supabase";

export interface LasaPair {
  id: string;
  drug_a: string;
  drug_b: string;
  similarity_type: "look_alike" | "sound_alike" | "both";
  tall_man_a: string | null;
  tall_man_b: string | null;
  notes: string | null;
  order_num: number;
  notes_en?: string | null;
}

export async function fetchLasaPairs(): Promise<LasaPair[]> {
  const { data, error } = await supabase.from("lasa_pairs").select("*").order("order_num");
  if (error) throw error;
  return data as LasaPair[];
}

export async function upsertLasaPair(item: LasaPair) {
  const { error } = await supabase.from("lasa_pairs").upsert(item);
  if (error) throw error;
}

export async function deleteLasaPair(id: string) {
  const { error } = await supabase.from("lasa_pairs").delete().eq("id", id);
  if (error) throw error;
}
