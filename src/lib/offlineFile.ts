import { cacheGet, cacheSet } from "./remoteCache";

/**
 * Static JSON (served by Cloudflare Pages, never D1/Supabase) with an on-device copy for offline use.
 * Network first; a successful answer refreshes the IndexedDB copy. Offline (or any fetch error) → the saved copy, however old.
 */
export async function loadOfflineJson<T>(url: string, key: string): Promise<{ data: T; fromDevice: boolean }> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as T;
    void cacheSet(key, data);
    return { data, fromDevice: false };
  } catch (e) {
    const saved = await cacheGet<T>(key, Number.MAX_SAFE_INTEGER);
    if (saved) return { data: saved, fromDevice: true };
    throw e;
  }
}
