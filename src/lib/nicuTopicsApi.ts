import { supabase } from "./supabase";

export interface NicuTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface NicuTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: NicuTopicSection[];
  sources: string[] | null;
}

export async function fetchNicuTopics(): Promise<NicuTopic[]> {
  const { data, error } = await supabase.from("nicu_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as NicuTopic[];
}

export async function upsertNicuTopic(item: NicuTopic) {
  const { error } = await supabase.from("nicu_topics").upsert(item);
  if (error) throw error;
}

export async function deleteNicuTopic(id: string) {
  const { error } = await supabase.from("nicu_topics").delete().eq("id", id);
  if (error) throw error;
}
