import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface PharmacologyTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface PharmacologyTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: PharmacologyTopicSection[];
  sources: string[] | null;
}

export async function fetchPharmacologyTopics(opts?: { withRouted?: boolean }): Promise<PharmacologyTopic[]> {
  const { data, error } = await supabase.from("pharmacology_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as PharmacologyTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<PharmacologyTopic>("pharmacology"))] : rows;
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchPharmacologyTopic(id: string): Promise<PharmacologyTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("pharmacology_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as PharmacologyTopic | null) ?? null;
}

export async function upsertPharmacologyTopic(item: PharmacologyTopic) {
  const { error } = await supabase.from("pharmacology_topics").upsert(item);
  if (error) throw error;
}

export async function deletePharmacologyTopic(id: string) {
  const { error } = await supabase.from("pharmacology_topics").delete().eq("id", id);
  if (error) throw error;
}
