import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface FirstAidTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface FirstAidTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: FirstAidTopicSection[];
  sources: string[] | null;
}

export async function fetchFirstAidTopics(opts?: { withRouted?: boolean }): Promise<FirstAidTopic[]> {
  const { data, error } = await supabase.from("first_aid_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as FirstAidTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<FirstAidTopic>("first-aid"))] : rows;
}

export async function upsertFirstAidTopic(item: FirstAidTopic) {
  const { error } = await supabase.from("first_aid_topics").upsert(item);
  if (error) throw error;
}

export async function deleteFirstAidTopic(id: string) {
  const { error } = await supabase.from("first_aid_topics").delete().eq("id", id);
  if (error) throw error;
}
