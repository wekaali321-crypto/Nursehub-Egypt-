import { supabase } from "./supabase";

export interface DialysisTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface DialysisTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: DialysisTopicSection[];
  sources: string[] | null;
}

export async function fetchDialysisTopics(): Promise<DialysisTopic[]> {
  const { data, error } = await supabase.from("dialysis_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as DialysisTopic[];
}

export async function upsertDialysisTopic(item: DialysisTopic) {
  const { error } = await supabase.from("dialysis_topics").upsert(item);
  if (error) throw error;
}

export async function deleteDialysisTopic(id: string) {
  const { error } = await supabase.from("dialysis_topics").delete().eq("id", id);
  if (error) throw error;
}
