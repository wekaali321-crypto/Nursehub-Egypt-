import { supabase } from "./supabase";

export interface ICUMedication {
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
  nursing_considerations: string | null;
}

export async function fetchICUMedications(): Promise<ICUMedication[]> {
  const { data, error } = await supabase
    .from("icu_medications")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as ICUMedication[];
}

export async function fetchICUMedicationById(id: string): Promise<ICUMedication | null> {
  const { data, error } = await supabase
    .from("icu_medications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ICUMedication;
}

export async function upsertICUMedication(item: ICUMedication) {
  const { error } = await supabase.from("icu_medications").upsert(item);
  if (error) throw error;
}

export async function deleteICUMedication(id: string) {
  const { error } = await supabase.from("icu_medications").delete().eq("id", id);
  if (error) throw error;
}

export const ICU_CATEGORY_ORDER = [
  "أدوية الثلاجة",
  "الأدوية المخدرة",
  "مقويات التقلص العضلي (Inotropes)",
  "الكهارل المركزة (Concentrated Electrolytes)",
  "أدوية أخرى في العناية المركزة",
];
