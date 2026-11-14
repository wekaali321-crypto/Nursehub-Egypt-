import { isStaticFallbackActive } from './staticFallback';

// Tiny IndexedDB cache for the public data bundle (so a visitor does not re-download every table on each page load).
const DB = 'nh_cache';
const STORE = 'kv';

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function cacheGet<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => {
        const v = r.result as { ts: number; data: T } | undefined;
        resolve(v && Date.now() - v.ts < maxAgeMs ? v.data : null);
      };
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function cacheSet(key: string, data: unknown): Promise<void> {
  // Never store snapshot data (served while the backend is down) as if it were fresh: it would stay for hours after recovery.
  if (isStaticFallbackActive()) return;
  const db = await open();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).put({ ts: Date.now(), data }, key);
  } catch {
    /* ignore quota / private mode */
  }
}

/** True when a signed-in user's session exists in this browser (admin): such readers always get live data, never a cached copy. */
export function hasUserSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sb-.+-auth-token$/.test(k) && localStorage.getItem(k)) return true;
    }
  } catch { /* no storage */ }
  return false;
}

/** Client cache lifetimes for public data (IndexedDB). Admin sessions bypass the cache entirely. */
export const TTL = {
  topics: 3 * 3600 * 1000, // section lists (same as the public bundle)
  content: 6 * 3600 * 1000, // exams, questions, applied pharmacology, travel counts
} as const;

const inflight = new Map<string, Promise<unknown>>();
/**
 * Read-through cache for PUBLIC data (IndexedDB, `ttlMs`) with in-session de-duplication.
 * - signed-in users (admin) bypass it completely;
 * - empty results are not stored (an empty list usually means an outage, not "no content");
 * - nothing is stored while the static snapshot is serving reads (see cacheSet).
 */
export function cachedQuery<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  if (hasUserSession()) return fn();
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = (async () => {
    const hit = await cacheGet<T>(key, ttlMs);
    if (hit) return hit;
    const fresh = await fn();
    const empty = Array.isArray(fresh) ? fresh.length === 0 : fresh == null;
    if (!empty) void cacheSet(key, fresh);
    return fresh;
  })();
  inflight.set(key, p);
  p.then(() => setTimeout(() => inflight.delete(key), 0), () => inflight.delete(key));
  return p;
}
