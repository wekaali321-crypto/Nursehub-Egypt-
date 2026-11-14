import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface FundamentalsTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface FundamentalsTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: FundamentalsTopicSection[];
  sources: string[] | null;
}

export async function fetchFundamentalsTopics(opts?: { withRouted?: boolean }): Promise<FundamentalsTopic[]> {
  const { data, error } = await supabase.from("fundamentals_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as FundamentalsTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<FundamentalsTopic>("fundamentals"))] : rows;
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchFundamentalsTopic(id: string): Promise<FundamentalsTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("fundamentals_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as FundamentalsTopic | null) ?? null;
}

export async function upsertFundamentalsTopic(item: FundamentalsTopic) {
  const { error } = await supabase.from("fundamentals_topics").upsert(item);
  if (error) throw error;
}

export async function deleteFundamentalsTopic(id: string) {
  const { error } = await supabase.from("fundamentals_topics").delete().eq("id", id);
  if (error) throw error;
}
