import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartLine { productId: string; title: string; price: number; qty: number; cover?: string }

const KEY = "nursehub_cart_v1";
const Ctx = createContext<{
  items: CartLine[];
  add: (l: CartLine) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (l: CartLine) =>
    setItems((prev) => {
      const ex = prev.find((x) => x.productId === l.productId);
      if (ex) return prev.map((x) => (x.productId === l.productId ? { ...x, qty: x.qty + l.qty } : x));
      return [...prev, l];
    });
  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.productId !== id));
  const setQty = (id: string, qty: number) => setItems((prev) => prev.map((x) => (x.productId === id ? { ...x, qty: Math.max(1, qty) } : x)));
  const clear = () => setItems([]);
  const count = items.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
