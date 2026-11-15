import { useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "./supabase";

/**
 * Maintenance flag, stored server-side in `nh_settings` (key = 'maintenance'): one tiny row, read on its own so public pages
 * can be gated BEFORE they render, without waiting for the big store bundle. Anonymous reads are edge-cached (60 s) and
 * browser-cached (60 s), so this costs at most one D1 row read per edge location per minute.
 *
 * Three states: 'on' / 'off' (read succeeded) and 'unknown' (read failed or is still running after the timeout).
 * 'unknown' is NEVER treated as 'off' for writes: the admin cannot toggle from it and a message-only save re-reads the live
 * flag first. Visitors fail open on 'unknown' (an outage must not look like maintenance), but a late answer that says 'on'
 * still switches them to the maintenance screen.
 */
export type MaintenanceStatus = "on" | "off" | "unknown";
export type MaintenanceState = { status: MaintenanceStatus; message?: string; until?: string };

const KEY = "maintenance";
const TIMEOUT_MS = 2500;
const UNKNOWN: MaintenanceState = { status: "unknown" };

let current: MaintenanceState | null = isSupabaseEnabled ? null : { status: "off" };
const listeners = new Set<(s: MaintenanceState) => void>();
const publish = (s: MaintenanceState) => { current = s; listeners.forEach((l) => l(s)); };

const parse = (v: unknown): MaintenanceState => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    status: o.on === true ? "on" : "off",
    message: typeof o.message === "string" ? o.message : undefined,
    until: typeof o.until === "string" ? o.until : undefined,
  };
};

/** One read of the row (one column). No row = never enabled = 'off'. Any error = 'unknown'. */
async function readOnce(): Promise<MaintenanceState> {
  if (!isSupabaseEnabled || !supabase) return { status: "off" };
  try {
    const { data, error } = await supabase.from("nh_settings").select("value").eq("key", KEY).maybeSingle();
    if (error) return UNKNOWN;
    return parse(data?.value);
  } catch {
    return UNKNOWN;
  }
}

/**
 * Reads the flag and publishes the result. After `timeoutMs` without an answer, 'unknown' is published (pages stop waiting),
 * but the read keeps going and its answer is still published when it arrives. A failed read never overwrites a known state.
 */
export function refreshMaintenance(timeoutMs = TIMEOUT_MS): Promise<MaintenanceState> {
  const timer = setTimeout(() => { if (current === null) publish(UNKNOWN); }, timeoutMs);
  return readOnce().then((s) => {
    clearTimeout(timer);
    if (s.status !== "unknown" || current === null || current.status === "unknown") publish(s);
    return s;
  });
}

/** Last published state (`null` while the first read is running and the timeout has not passed). */
export const getMaintenance = (): MaintenanceState | null => current;

export function onMaintenance(fn: (s: MaintenanceState) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * Admin only (the API rejects the write without an admin session).
 * `on` omitted = keep the switch as it is on the server: the live row is re-read first, and if that read fails nothing is
 * written (throws), so a message-only save can never turn maintenance on or off.
 */
export async function saveMaintenance(patch: { on?: boolean; message?: string; until?: string }): Promise<MaintenanceState> {
  if (!isSupabaseEnabled || !supabase) throw new Error("Supabase not configured");
  let on = patch.on;
  let base = current;
  if (on === undefined) {
    const live = await readOnce();
    if (live.status === "unknown") throw new Error("maintenance state unknown: not saved");
    on = live.status === "on";
    base = live;
  }
  const value = { on, message: patch.message ?? base?.message ?? "", until: patch.until ?? base?.until ?? "" };
  const { error } = await supabase.from("nh_settings").upsert({ key: KEY, value });
  if (error) throw error;
  const s: MaintenanceState = { status: on ? "on" : "off", message: value.message, until: value.until };
  publish(s);
  return s;
}

// Start at module load (app boot), in parallel with the store bundle; never blocks on it.
if (current === null) void refreshMaintenance();

/** `null` while the first read is running (at most TIMEOUT_MS), then the latest state; late answers update it. */
export function useMaintenance(): MaintenanceState | null {
  const [s, setS] = useState<MaintenanceState | null>(current);
  useEffect(() => {
    const off = onMaintenance(setS);
    if (current !== s) setS(current);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}
