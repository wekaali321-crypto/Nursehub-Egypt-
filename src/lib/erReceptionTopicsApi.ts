import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface ERReceptionTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface ERReceptionTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: ERReceptionTopicSection[];
  sources: string[] | null;
}

export async function fetchERReceptionTopics(opts?: { withRouted?: boolean }): Promise<ERReceptionTopic[]> {
  const { data, error } = await supabase.from("er_reception_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as ERReceptionTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<ERReceptionTopic>("er-reception"))] : rows;
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchERReceptionTopic(id: string): Promise<ERReceptionTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("er_reception_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ERReceptionTopic | null) ?? null;
}

export async function upsertERReceptionTopic(item: ERReceptionTopic) {
  const { error } = await supabase.from("er_reception_topics").upsert(item);
  if (error) throw error;
}

export async function deleteERReceptionTopic(id: string) {
  const { error } = await supabase.from("er_reception_topics").delete().eq("id", id);
  if (error) throw error;
}
