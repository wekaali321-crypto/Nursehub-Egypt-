import { supabase } from "./supabase";
import { exportCards, importCards, type PackedCards } from "./srs";
import { loadHistory, replaceHistory, type ExamAttempt } from "./examHistory";

/**
 * Local-first study progress, synced to the signed-in account ONLY when the user presses "sync":
 * one read (the account) + at most one write (the merged progress, in the account's own metadata — no new table).
 * Merge rules: per flashcard the most recently reviewed state wins; exam attempts are united (bank + date), newest first.
 */
export type Progress = { v: 1; at: number; cards: PackedCards; exams: ExamAttempt[] };
const LAST = "nh_sync_last_v1";

export function mergeProgress(a: Progress | null | undefined, b: Progress | null | undefined): Progress {
  const cards: PackedCards = { ...(a?.cards ?? {}) };
  for (const [id, c] of Object.entries(b?.cards ?? {})) {
    const cur = cards[id];
    if (!cur || c[4] > cur[4] || (c[4] === cur[4] && c[2] > cur[2])) cards[id] = c;
  }
  const seen = new Set<string>();
  const exams = [...(a?.exams ?? []), ...(b?.exams ?? [])]
    .filter((x) => { const k = `${x.key}|${x.date}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => y.date - x.date)
    .slice(0, 300);
  return { v: 1, at: Math.max(a?.at ?? 0, b?.at ?? 0), cards, exams };
}

const same = (a: Progress | undefined, b: Progress) => !!a && JSON.stringify({ c: a.cards, e: a.exams }) === JSON.stringify({ c: b.cards, e: b.exams });

export async function syncProgress(): Promise<{ ok: boolean; wrote: boolean; cards: number; exams: number; error?: string }> {
  if (!supabase) return { ok: false, wrote: false, cards: 0, exams: 0, error: "offline" };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, wrote: false, cards: 0, exams: 0, error: "auth" };
  const remote = (data.user.user_metadata as { nh_progress?: Progress })?.nh_progress;
  const local: Progress = { v: 1, at: Date.now(), cards: exportCards(), exams: loadHistory() };
  const merged = mergeProgress(remote, local);
  importCards(merged.cards);
  replaceHistory(merged.exams);
  let wrote = false;
  if (!same(remote, merged)) {
    const { error: e2 } = await supabase.auth.updateUser({ data: { nh_progress: { ...merged, at: Date.now() } } });
    if (e2) return { ok: false, wrote: false, cards: Object.keys(merged.cards).length, exams: merged.exams.length, error: e2.message };
    wrote = true;
  }
  try { localStorage.setItem(LAST, String(Date.now())); } catch { /* ignore */ }
  return { ok: true, wrote, cards: Object.keys(merged.cards).length, exams: merged.exams.length };
}

export const lastSync = (): number => { try { return Number(localStorage.getItem(LAST) || 0); } catch { return 0; } };
