import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { cachedQuery } from "./remoteCache";
import { saveImageOverride } from "./diseasesApi";

/**
 * Admin image overrides for ANY picture on the site, in the same `disease_images` table and with the same meaning as the
 * diseases section (no schema change): slot → url; '' or 'hidden:<previous url>' = hidden; no row = the built-in default.
 * Slot names: art:<drawing>, sec:<section>:<topic>:<part>, drug:<slug>, icu:<id>, case:<id> … (see EditableImage callers).
 * Visitors read the whole (small) table once, cached on the device for 3 minutes (edge: 60 s); signed-in admins always read it live.
 */
const TTL = 3 * 60 * 1000;
let cache: Promise<Record<string, string>> | null = null;
let current: Record<string, string> = {};
const listeners = new Set<(m: Record<string, string>) => void>();

async function readAll(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("disease_images").select("slot,url");
  if (error) throw error;
  const m: Record<string, string> = {};
  for (const r of (data ?? []) as Array<{ slot: string; url: string }>) m[r.slot] = r.url;
  return m;
}

export function loadImageSlots(force = false): Promise<Record<string, string>> {
  if (force || !cache) {
    cache = (force ? readAll() : cachedQuery("img_slots_v1", TTL, readAll))
      .catch(() => ({}) as Record<string, string>)
      .then((m) => { current = m; listeners.forEach((l) => l(m)); return m; });
  }
  return cache;
}

/** All overrides; re-renders when an admin saves one anywhere on the page. */
export function useImageSlots(): Record<string, string> {
  const [m, setM] = useState<Record<string, string>>(current);
  useEffect(() => {
    listeners.add(setM);
    void loadImageSlots().then(setM);
    return () => { listeners.delete(setM); };
  }, []);
  return m;
}

export type SlotState = { url: string; hidden: boolean; overridden: boolean; kept: string };

/** What a slot shows, given its built-in default. */
export function resolveSlot(over: string | undefined, def: string | null | undefined): SlotState {
  const hidden = over !== undefined && (over === "" || over.startsWith("hidden:"));
  const kept = over && over.startsWith("hidden:") ? over.slice(7) : "";
  return { url: hidden ? "" : over !== undefined ? over : def || "", hidden, overridden: over !== undefined, kept };
}

/** url = new picture, "hidden:<url>" = hide, null = back to the built-in default. Refreshes every slot on the page. */
export async function saveSlot(slot: string, value: string | null): Promise<void> {
  await saveImageOverride(slot, value);
  await loadImageSlots(true);
}
