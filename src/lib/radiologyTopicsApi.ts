import { supabase } from "./supabase";

export interface RadiologyTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface RadiologyTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: RadiologyTopicSection[];
  sources: string[] | null;
}

export async function fetchRadiologyTopics(): Promise<RadiologyTopic[]> {
  const { data, error } = await supabase.from("radiology_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as RadiologyTopic[];
}

export async function upsertRadiologyTopic(item: RadiologyTopic) {
  const { error } = await supabase.from("radiology_topics").upsert(item);
  if (error) throw error;
}

export async function deleteRadiologyTopic(id: string) {
  const { error } = await supabase.from("radiology_topics").delete().eq("id", id);
  if (error) throw error;
}
