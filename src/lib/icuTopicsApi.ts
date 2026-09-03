import { supabase } from "./supabase";

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

export async function fetchIcuTopics(): Promise<IcuTopic[]> {
  const { data, error } = await supabase.from("icu_topics").select("*").order("order_num", { ascending: true });
  if (error) throw error;
  return data as IcuTopic[];
}

export async function upsertIcuTopic(item: IcuTopic) {
  const { error } = await supabase.from("icu_topics").upsert(item);
  if (error) throw error;
}

export async function deleteIcuTopic(id: string) {
  const { error } = await supabase.from("icu_topics").delete().eq("id", id);
  if (error) throw error;
}
