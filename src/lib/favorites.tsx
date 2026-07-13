import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "nursehub_favorites_v1";

const Ctx = createContext<{
  favorites: string[];
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => void;
} | null>(null);

/** Per-visitor bookmarks/favorites for articles (UI preference — local only). */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(favorites)); }, [favorites]);

  const isFav = (id: string) => favorites.includes(id);
  const toggleFav = (id: string) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));

  return <Ctx.Provider value={{ favorites, isFav, toggleFav }}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
