import { supabase } from "./supabase";

export type IVCompatibilityStatus = "compatible" | "incompatible" | "consult";

export interface IVCompatibilityPair {
  id: string;
  order_num: number;
  drug_a: string;
  drug_b: string;
  status: IVCompatibilityStatus;
  reason: string | null;
  nursing_action: string | null;
  source: string | null;
  drug_a_en?: string | null;
  drug_b_en?: string | null;
  reason_en?: string | null;
  nursing_action_en?: string | null;
}

export async function fetchIVCompatibility(): Promise<IVCompatibilityPair[]> {
  const { data, error } = await supabase
    .from("iv_compatibility")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as IVCompatibilityPair[];
}

export async function upsertIVCompatibility(item: IVCompatibilityPair) {
  const { error } = await supabase.from("iv_compatibility").upsert(item);
  if (error) throw error;
}

export async function deleteIVCompatibility(id: string) {
  const { error } = await supabase.from("iv_compatibility").delete().eq("id", id);
  if (error) throw error;
}
