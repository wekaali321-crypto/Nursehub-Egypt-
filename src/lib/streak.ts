/** Study streak kept on-device only (no server calls). Shared by the home study strip and the flashcards. */
export function touchStreak(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = JSON.parse(localStorage.getItem("nh_streak") || "null") as { last: string; n: number } | null;
    if (raw?.last === today) return raw.n;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const n = raw?.last === y ? raw.n + 1 : 1;
    localStorage.setItem("nh_streak", JSON.stringify({ last: today, n }));
    return n;
  } catch {
    return 1;
  }
}
