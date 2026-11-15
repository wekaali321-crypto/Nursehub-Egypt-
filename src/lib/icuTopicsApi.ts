import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface IcuTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface IcuTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: IcuTopicSection[];
  sources: string[] | null;
}

export async function fetchIcuTopics(opts?: { withRouted?: boolean }): Promise<IcuTopic[]> {
  const { data, error } = await supabase.from("icu_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as IcuTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<IcuTopic>("icu-nursing"))] : rows;
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchIcuTopic(id: string): Promise<IcuTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("icu_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as IcuTopic | null) ?? null;
}

export async function upsertIcuTopic(item: IcuTopic) {
  const { error } = await supabase.from("icu_topics").upsert(item);
  if (error) throw error;
}

export async function deleteIcuTopic(id: string) {
  const { error } = await supabase.from("icu_topics").delete().eq("id", id);
  if (error) throw error;
}
