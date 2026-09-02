import { supabase } from './supabase';

export interface TreatmentLine {
  line_no: string;
  title: string;
  content: string;
}

export interface AppliedPharmItem {
  id: string;
  part: 1 | 2;
  order_num: number;
  topic: string;
  topic_icon: string;
  item_type: 'fact' | 'qa' | 'alert' | 'trivia' | 'note' | 'treatment_plan';
  title: string | null;
  content: string | null;
  question: string | null;
  answer: string | null;
  disease_name: string | null;
  treatment_lines: TreatmentLine[] | null;
  topic_en?: string | null;
  title_en?: string | null;
  content_en?: string | null;
  question_en?: string | null;
  answer_en?: string | null;
  disease_name_en?: string | null;
  treatment_lines_en?: TreatmentLine[] | null;
}

export async function fetchAppliedPharmItems(part?: 1 | 2): Promise<AppliedPharmItem[]> {
  let q = supabase.from('applied_pharm_items').select('*').order('order_num', { ascending: true });
  if (part) q = q.eq('part', part);
  const { data, error } = await q;
  if (error) throw error;
  return (data as AppliedPharmItem[]) || [];
}

export async function upsertAppliedPharmItem(row: AppliedPharmItem): Promise<void> {
  const { error } = await supabase.from('applied_pharm_items').upsert(row);
  if (error) throw error;
}

export async function deleteAppliedPharmItem(id: string): Promise<void> {
  const { error } = await supabase.from('applied_pharm_items').delete().eq('id', id);
  if (error) throw error;
}
