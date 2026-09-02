import { supabase } from "./supabase";

export type OrganAdjustmentType = "renal" | "hepatic";

export interface OrganDoseAdjustment {
  id: string;
  order_num: number;
  adjustment_type: OrganAdjustmentType;
  drug_name: string;
  drug_class: string | null;
  normal_dose_note: string | null;
  mild_adjustment: string | null;
  moderate_adjustment: string | null;
  severe_adjustment: string | null;
  contraindicated: string | null;
  monitoring_note: string | null;
  key_point: string | null;
  drug_name_en?: string | null;
  drug_class_en?: string | null;
  normal_dose_note_en?: string | null;
  mild_adjustment_en?: string | null;
  moderate_adjustment_en?: string | null;
  severe_adjustment_en?: string | null;
  contraindicated_en?: string | null;
  monitoring_note_en?: string | null;
  key_point_en?: string | null;
}

export async function fetchOrganDoseAdjustments(): Promise<OrganDoseAdjustment[]> {
  const { data, error } = await supabase
    .from("organ_dose_adjustments")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as OrganDoseAdjustment[];
}

export async function upsertOrganDoseAdjustment(item: OrganDoseAdjustment) {
  const { error } = await supabase.from("organ_dose_adjustments").upsert(item);
  if (error) throw error;
}

export async function deleteOrganDoseAdjustment(id: string) {
  const { error } = await supabase.from("organ_dose_adjustments").delete().eq("id", id);
  if (error) throw error;
}
