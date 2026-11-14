import { supabase } from "./supabase";
import { routedAsTopics } from "./diseasesApi";

export interface OperatingRoomTopicSection {
  id: string;
  heading_ar: string;
  heading_en?: string;
  body_ar: string;
  body_en?: string;
  image_url?: string;
}

export interface OperatingRoomTopic {
  id: string;
  order_num: number;
  title_ar: string;
  title_en: string | null;
  icon: string | null;
  category: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  sections: OperatingRoomTopicSection[];
  sources: string[] | null;
}

export async function fetchOperatingRoomTopics(opts?: { withRouted?: boolean }): Promise<OperatingRoomTopic[]> {
  const { data, error } = await supabase.from("operating_room_topics").select("*").order("order_num", { ascending: true });
  if (error && !opts?.withRouted) throw error;
  const rows = (data ?? []) as OperatingRoomTopic[];
  return opts?.withRouted ? [...rows, ...(await routedAsTopics<OperatingRoomTopic>("operating-room"))] : rows;
}

/** One topic by primary key (1 row read) — topic pages must not download the whole section table to show one topic. */
export async function fetchOperatingRoomTopic(id: string): Promise<OperatingRoomTopic | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from("operating_room_topics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as OperatingRoomTopic | null) ?? null;
}

export async function upsertOperatingRoomTopic(item: OperatingRoomTopic) {
  const { error } = await supabase.from("operating_room_topics").upsert(item);
  if (error) throw error;
}

export async function deleteOperatingRoomTopic(id: string) {
  const { error } = await supabase.from("operating_room_topics").delete().eq("id", id);
  if (error) throw error;
}
