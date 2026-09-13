import { supabase } from "./supabase";

export interface AnatomyTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface AnatomyTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: AnatomyTopicSection[];
  sources: string[] | null;
}

export async function fetchAnatomyTopics(): Promise<AnatomyTopic[]> {
  const { data, error } = await supabase.from("anatomy_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as AnatomyTopic[];
}

export async function upsertAnatomyTopic(item: AnatomyTopic) {
  const { error } = await supabase.from("anatomy_topics").upsert(item);
  if (error) throw error;
}

export async function deleteAnatomyTopic(id: string) {
  const { error } = await supabase.from("anatomy_topics").delete().eq("id", id);
  if (error) throw error;
}
