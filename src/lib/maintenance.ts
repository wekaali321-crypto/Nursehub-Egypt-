import { useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "./supabase";

/**
 * Maintenance flag, stored server-side in `nh_settings` (key = 'maintenance'): one tiny row, read on its own so public pages
 * can be gated BEFORE they render, without waiting for the big store bundle. Anonymous reads are edge-cached (60 s) and
 * browser-cached (60 s), so this costs at most one D1 row read per edge location per minute.
 * Fail-open: if the check errors or is slow, the site is shown (an outage must never look like maintenance).
 */
export type MaintenanceState = { on: boolean; message?: string; until?: string };

const KEY = "maintenance";
const TIMEOUT_MS = 2500;
const OFF: MaintenanceState = { on: false };

let current: MaintenanceState | null = isSupabaseEnabled ? null : OFF;
const listeners = new Set<(s: MaintenanceState) => void>();
const publish = (s: MaintenanceState) => { current = s; listeners.forEach((l) => l(s)); };

const parse = (v: unknown): MaintenanceState => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { on: o.on === true, message: typeof o.message === "string" ? o.message : undefined, until: typeof o.until === "string" ? o.until : undefined };
};

/** Reads the flag (one row, one column). Resolves OFF on error/timeout. */
export async function fetchMaintenance(): Promise<MaintenanceState> {
  if (!isSupabaseEnabled || !supabase) return OFF;
  const query = (async () => {
    const { data, error } = await supabase!.from("nh_settings").select("value").eq("key", KEY).maybeSingle();
    if (error) throw error;
    return parse(data?.value);
  })();
  const timeout = new Promise<MaintenanceState>((resolve) => setTimeout(() => resolve(OFF), TIMEOUT_MS));
  try { return await Promise.race([query, timeout]); } catch { return OFF; }
}

/** Admin only (the API rejects the write without an admin session). */
export async function saveMaintenance(s: MaintenanceState): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from("nh_settings").upsert({ key: KEY, value: { on: !!s.on, message: s.message ?? "", until: s.until ?? "" } });
  if (error) throw error;
  publish({ on: !!s.on, message: s.message, until: s.until });
}

// Start at module load (app boot), in parallel with the store bundle; never blocks on it.
if (current === null) void fetchMaintenance().then(publish);

/** `null` while the first check is still running. */
export function useMaintenance(): MaintenanceState | null {
  const [s, setS] = useState<MaintenanceState | null>(current);
  useEffect(() => {
    listeners.add(setS);
    if (current !== s) setS(current);
    return () => { listeners.delete(setS); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}
