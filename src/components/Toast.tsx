import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const Ctx = createContext<{ notify: (msg: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
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
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
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
