import { supabase } from "./supabase";

export interface PedsMedication {
  id: string;
  order_num: number;
  category: string;
  subcategory: string | null;
  drug_name: string;
  concentration: string | null;
  drug_class: string | null;
  uses: string | null;
  contraindications: string | null;
  side_effects: string | null;
  warnings: string | null;
  preparation: { steps?: string[] } | null;
  dose_calculation: Record<string, string> | null;
  storage_notes: string | null;
  is_high_alert: boolean;
  high_alert_type: string[] | null;
  nursing_considerations: string | null;
  show_image: boolean;
  image_url: string | null;
  category_en?: string | null;
  subcategory_en?: string | null;
  drug_name_en?: string | null;
  drug_class_en?: string | null;
  uses_en?: string | null;
  contraindications_en?: string | null;
  side_effects_en?: string | null;
  warnings_en?: string | null;
  storage_notes_en?: string | null;
  nursing_considerations_en?: string | null;
  preparation_en?: { steps?: string[] } | null;
  dose_calculation_en?: Record<string, string> | null;
}

export async function fetchPedsMedications(): Promise<PedsMedication[]> {
  const { data, error } = await supabase
    .from("peds_medications")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as PedsMedication[];
}

export async function fetchPedsMedicationById(id: string): Promise<PedsMedication | null> {
  const { data, error } = await supabase
    .from("peds_medications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as PedsMedication;
}

export async function upsertPedsMedication(item: PedsMedication) {
  const { error } = await supabase.from("peds_medications").upsert(item);
  if (error) throw error;
}

export async function deletePedsMedication(id: string) {
  const { error } = await supabase.from("peds_medications").delete().eq("id", id);
  if (error) throw error;
}

export const PEDS_CATEGORY_ORDER = [
  "الجهاز التنفسي (Respiratory)",
  "أمراض القلب (Cardiology)",
  "أمراض الكبد (Hepatology)",
  "الكلى والمسالك البولية (Nephrology)",
  "الأعصاب (Neurology)",
  "اضطرابات التغذية (Nutritional Disorders)",
  "الالتهابات والطفح الجلدي (Infections)",
  "الجهاز الهضمي (GIT)",
  "أمراض الدم (Hematology)",
];
