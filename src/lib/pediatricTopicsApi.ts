import { supabase } from "./supabase";

export interface PediatricTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface PediatricTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: PediatricTopicSection[];
  sources: string[] | null;
}

export async function fetchPediatricTopics(): Promise<PediatricTopic[]> {
  const { data, error } = await supabase.from("pediatric_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as PediatricTopic[];
}

export async function upsertPediatricTopic(item: PediatricTopic) {
  const { error } = await supabase.from("pediatric_topics").upsert(item);
  if (error) throw error;
}

export async function deletePediatricTopic(id: string) {
  const { error } = await supabase.from("pediatric_topics").delete().eq("id", id);
  if (error) throw error;
}
