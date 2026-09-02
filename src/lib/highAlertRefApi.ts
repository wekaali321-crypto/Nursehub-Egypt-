import { supabase } from "./supabase";

export interface HighAlertRefCategory {
  id: string;
  order_num: number;
  icon: string | null;
  category_ar: string;
  category_en: string | null;
  drugs: string[];
  safety_strategy: string | null;
  source: string | null;
  drugs_en?: string[] | null;
  safety_strategy_en?: string | null;
}

export async function fetchHighAlertRef(): Promise<HighAlertRefCategory[]> {
  const { data, error } = await supabase
    .from("high_alert_ref")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as HighAlertRefCategory[];
}

export async function upsertHighAlertRef(item: HighAlertRefCategory) {
  const { error } = await supabase.from("high_alert_ref").upsert(item);
  if (error) throw error;
}

export async function deleteHighAlertRef(id: string) {
  const { error } = await supabase.from("high_alert_ref").delete().eq("id", id);
  if (error) throw error;
}
