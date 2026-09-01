import { supabase } from "./supabase";

export interface RxItem {
  drug_name: string;
  dose?: string;
  note?: string;
}

export interface RxPrescription {
  id: string;
  order_num: number;
  category: string;
  condition_ar: string;
  condition_en: string | null;
  doctor_name: string | null;
  items: RxItem[];
  clinical_note: string | null;
}

export async function fetchRxPrescriptions(): Promise<RxPrescription[]> {
  const { data, error } = await supabase
    .from("rx_prescriptions")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as RxPrescription[];
}

export async function upsertRxPrescription(item: RxPrescription) {
  const { error } = await supabase.from("rx_prescriptions").upsert(item);
  if (error) throw error;
}

export async function deleteRxPrescription(id: string) {
  const { error } = await supabase.from("rx_prescriptions").delete().eq("id", id);
  if (error) throw error;
}

// ترتيب الأقسام في الصفحة الرئيسية
export const RX_CATEGORY_ORDER = [
  "الجهاز الهضمي",
  "الكلى والمسالك البولية",
  "الجهاز التنفسي والحساسية",
  "القلب والأوعية الدموية",
  "الأعصاب والنفسية",
  "العظام",
  "العضلات",
  "الجلدية",
  "الفطريات",
  "النساء والتناسلية",
  "الفم والأسنان",
  "الأنف والأذن والحنجرة",
  "العين",
  "الأذن",
  "استقلابي",
  "الدم",
  "المسكنات",
  "المضادات الحيوية",
  "عام ومكمّلات",
  "الشعر",
  "الطوارئ",
];
