import { useEffect, useState, useCallback } from "react";
import { DEFAULT_FEATURES, type FeatureToggles } from "../../lib/types";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/**
 * Feature toggles — enable/disable modules instantly without redeploy.
 * Persisted to Supabase `nh_settings` (key='features') with localStorage cache.
 */

const LS_KEY = "nursehub_features";
const SETTINGS_KEY = "features";

let cache: FeatureToggles | null = null;
const listeners = new Set<(f: FeatureToggles) => void>();

function readLocal(): FeatureToggles {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_FEATURES, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_FEATURES;
}

function writeLocal(f: FeatureToggles) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(f)); } catch { /* ignore */ }
}

async function loadRemote(): Promise<FeatureToggles> {
  if (!isSupabaseConfigured() || !supabase) return readLocal();
  try {
    const { data } = await supabase.from("nh_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
    if (data?.value) {
      const merged = { ...DEFAULT_FEATURES, ...(data.value as Partial<FeatureToggles>) };
      writeLocal(merged);
      return merged;
    }
  } catch { /* fall through */ }
  return readLocal();
}

async function saveRemote(f: FeatureToggles) {
  writeLocal(f);
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from("nh_settings").upsert({ key: SETTINGS_KEY, value: f, updated_at: new Date().toISOString() });
  } catch { /* localStorage keeps it */ }
}

/** Hook: read + update feature toggles (shared across app). */
export function useFeatures() {
  const [features, setFeatures] = useState<FeatureToggles>(() => cache ?? readLocal());

  useEffect(() => {
    let alive = true;
    if (!cache) {
      loadRemote().then((f) => {
        if (!alive) return;
        cache = f;
        setFeatures(f);
        listeners.forEach((l) => l(f));
      });
    }
    const listener = (f: FeatureToggles) => setFeatures(f);
    listeners.add(listener);
    return () => { alive = false; listeners.delete(listener); };
  }, []);

  const update = useCallback(async (key: keyof FeatureToggles, value: boolean) => {
    const next = { ...(cache ?? readLocal()), [key]: value };
    cache = next;
    setFeatures(next);
    listeners.forEach((l) => l(next));
    await saveRemote(next);
  }, []);

  const setAll = useCallback(async (next: FeatureToggles) => {
    cache = next;
    setFeatures(next);
    listeners.forEach((l) => l(next));
    await saveRemote(next);
  }, []);

  return { features, update, setAll };
}

/** Non-hook helper for checking a feature synchronously (uses cache). */
export function isFeatureEnabled(key: keyof FeatureToggles): boolean {
  const f = cache ?? readLocal();
  return f[key];
}
