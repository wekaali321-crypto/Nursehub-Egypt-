import { supabase } from "./supabase";

export interface ERMedication {
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
}

export async function fetchERMedications(): Promise<ERMedication[]> {
  const { data, error } = await supabase
    .from("er_medications")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as ERMedication[];
}

export async function fetchERMedicationById(id: string): Promise<ERMedication | null> {
  const { data, error } = await supabase
    .from("er_medications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ERMedication;
}

export async function upsertERMedication(item: ERMedication) {
  const { error } = await supabase.from("er_medications").upsert(item);
  if (error) throw error;
}

export async function deleteERMedication(id: string) {
  const { error } = await supabase.from("er_medications").delete().eq("id", id);
  if (error) throw error;
}

export const ER_CATEGORY_ORDER = [
  "المسكنات ومضادات الالتهاب والتشنج (Analgesics & Antispasmodics)",
  "الأدوية المخدرة (Narcotics)",
  "مضادات القيء والحموضة (Antiemetics & GI)",
  "الحساسية والكورتيزون ومضادات الهيستامين (Allergy & Corticosteroids)",
  "موسعات الشعب الهوائية (Bronchodilators)",
  "أدوية القلب والأوعية الدموية (Cardiac & Vasoactive Drugs)",
  "الطوارئ السكرية (Diabetic Emergencies)",
  "المهدئات ومضادات الاختلاج (Sedatives & Anticonvulsants)",
  "فيتامينات ووقاية (Vitamins & Prophylaxis)",
];
