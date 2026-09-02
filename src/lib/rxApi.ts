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
  items_en?: RxItem[] | null;
  clinical_note_en?: string | null;
}

export const RX_CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  "الجهاز الهضمي": { ar: "الجهاز الهضمي", en: "Digestive System" },
  "الكلى والمسالك البولية": { ar: "الكلى والمسالك البولية", en: "Kidney & Urinary Tract" },
  "الجهاز التنفسي والحساسية": { ar: "الجهاز التنفسي والحساسية", en: "Respiratory & Allergy" },
  "القلب والأوعية الدموية": { ar: "القلب والأوعية الدموية", en: "Cardiovascular" },
  "الأعصاب والنفسية": { ar: "الأعصاب والنفسية", en: "Neurology & Psychiatry" },
  "العظام": { ar: "العظام", en: "Bones" },
  "العضلات": { ar: "العضلات", en: "Muscles" },
  "الجلدية": { ar: "الجلدية", en: "Dermatology" },
  "الفطريات": { ar: "الفطريات", en: "Fungal Infections" },
  "النساء والتناسلية": { ar: "النساء والتناسلية", en: "Gynecology & Reproductive" },
  "الفم والأسنان": { ar: "الفم والأسنان", en: "Oral & Dental" },
  "الأنف والأذن والحنجرة": { ar: "الأنف والأذن والحنجرة", en: "ENT" },
  "العين": { ar: "العين", en: "Eye" },
  "الأذن": { ar: "الأذن", en: "Ear" },
  "استقلابي": { ar: "استقلابي", en: "Metabolic" },
  "الدم": { ar: "الدم", en: "Blood" },
  "المسكنات": { ar: "المسكنات", en: "Analgesics" },
  "المضادات الحيوية": { ar: "المضادات الحيوية", en: "Antibiotics" },
  "عام ومكمّلات": { ar: "عام ومكمّلات", en: "General & Supplements" },
  "الشعر": { ar: "الشعر", en: "Hair" },
  "الطوارئ": { ar: "الطوارئ", en: "Emergency" },
};

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
