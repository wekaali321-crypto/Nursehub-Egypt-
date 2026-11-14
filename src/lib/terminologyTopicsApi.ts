import { supabase } from "./supabase";

export interface TerminologyTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface TerminologyTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: TerminologyTopicSection[];
  sources: string[] | null;
}

export async function fetchTerminologyTopics(): Promise<TerminologyTopic[]> {
  const { data, error } = await supabase.from("terminology_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as TerminologyTopic[];
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchTerminologyTopic(id: string): Promise<TerminologyTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("terminology_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as TerminologyTopic | null) ?? null;
}

export async function upsertTerminologyTopic(item: TerminologyTopic) {
  const { error } = await supabase.from("terminology_topics").upsert(item);
  if (error) throw error;
}

export async function deleteTerminologyTopic(id: string) {
  const { error } = await supabase.from("terminology_topics").delete().eq("id", id);
  if (error) throw error;
}
