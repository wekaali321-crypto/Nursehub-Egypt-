/**
 * Some in-app browsers (Facebook/Telegram/WebViews) block web storage: merely reading
 * window.localStorage throws a SecurityError, which used to crash the whole app.
 * If storage is unavailable, install a working in-memory replacement so every
 * existing localStorage/sessionStorage call keeps working (just without persistence).
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k: string) => (data.has(k) ? (data.get(k) as string) : null),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
  } as Storage;
}

function ensure(name: "localStorage" | "sessionStorage") {
  try {
    const s = window[name];
    const probe = "__nh_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
  } catch {
    try {
      Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
    } catch {
      /* nothing more we can do */
    }
  }
}

if (typeof window !== "undefined") {
  ensure("localStorage");
  ensure("sessionStorage");
}
