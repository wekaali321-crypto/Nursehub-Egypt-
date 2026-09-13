import { supabase } from "./supabase";

export interface ObgynTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface ObgynTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: ObgynTopicSection[];
  sources: string[] | null;
}

export async function fetchObgynTopics(): Promise<ObgynTopic[]> {
  const { data, error } = await supabase.from("obgyn_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as ObgynTopic[];
}

export async function upsertObgynTopic(item: ObgynTopic) {
  const { error } = await supabase.from("obgyn_topics").upsert(item);
  if (error) throw error;
}

export async function deleteObgynTopic(id: string) {
  const { error } = await supabase.from("obgyn_topics").delete().eq("id", id);
  if (error) throw error;
}
