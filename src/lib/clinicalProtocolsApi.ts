import { supabase } from "./supabase";

export interface ProtocolItem {
  id: string;
  text: string;
  detail?: string;
  critical?: boolean;
}

export interface ProtocolPhase {
  id: string;
  title: string;
  icon?: string;
  items: ProtocolItem[];
}

export interface ClinicalProtocol {
  id: string;
  order_num: number;
  name_ar: string;
  name_en: string | null;
  category: string | null;
  icon: string | null;
  summary: string | null;
  guideline_source: string | null;
  red_flags: string[] | null;
  key_values: Record<string, string> | null;
  phases: ProtocolPhase[];
  summary_en?: string | null;
  guideline_source_en?: string | null;
  red_flags_en?: string[] | null;
  key_values_en?: Record<string, string> | null;
  phases_en?: ProtocolPhase[] | null;
}

export async function fetchClinicalProtocols(): Promise<ClinicalProtocol[]> {
  const { data, error } = await supabase
    .from("clinical_protocols")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data as ClinicalProtocol[];
}

export async function upsertClinicalProtocol(item: ClinicalProtocol) {
  const { error } = await supabase.from("clinical_protocols").upsert(item);
  if (error) throw error;
}

export async function deleteClinicalProtocol(id: string) {
  const { error } = await supabase.from("clinical_protocols").delete().eq("id", id);
  if (error) throw error;
}

// ===== تقدّم المستخدم في كل بروتوكول — محفوظ محليًا في المتصفح =====

function progressKey(protocolId: string) {
  return `protocol_progress_${protocolId}`;
}

export function loadProtocolProgress(protocolId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(progressKey(protocolId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProtocolProgress(protocolId: string, progress: Record<string, boolean>) {
  try {
    localStorage.setItem(progressKey(protocolId), JSON.stringify(progress));
  } catch {
    // localStorage غير متاح — نتجاهل بصمت
  }
}

export function resetProtocolProgress(protocolId: string) {
  try {
    localStorage.removeItem(progressKey(protocolId));
  } catch {
    // ignore
  }
}
