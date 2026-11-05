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
  const db = await open();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).put({ ts: Date.now(), data }, key);
  } catch {
    /* ignore quota / private mode */
  }
}
