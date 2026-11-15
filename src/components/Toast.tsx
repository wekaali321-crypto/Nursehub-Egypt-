import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const Ctx = createContext<{ notify: (msg: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const timers = useRef(new Map<number, number>());
  // The same message is never stacked: repeating it (e.g. pressing "login" again) just keeps the one toast on screen longer.
  const notify = useCallback((message: string, type: ToastType = "success") => {
    setToasts((t) => {
      const same = t.find((x) => x.message === message && x.type === type);
      const id = same ? same.id : Date.now() + Math.random();
      window.clearTimeout(timers.current.get(id));
      timers.current.set(id, window.setTimeout(() => { timers.current.delete(id); setToasts((l) => l.filter((x) => x.id !== id)); }, 3500));
      return same ? t : [...t.slice(-2), { id, type, message }];
    });
  }, []);

  const styles: Record<ToastType, string> = {
    success: "from-emerald-500 to-teal-500",
    error: "from-rose-500 to-red-500",
    info: "from-sky-500 to-blue-500",
  };
  const icons: Record<ToastType, string> = { success: "✅", error: "⚠️", info: "ℹ️" };

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-4 right-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl bg-gradient-to-l ${styles[t.type]} px-4 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in-up`}
          >
            <span>{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
