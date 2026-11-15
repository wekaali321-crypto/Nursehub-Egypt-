/**
 * Spaced repetition for the flashcards (Leitner boxes), kept on this device only (localStorage) — no server calls.
 * "again" → back to box 0, seen again this session; "hard" → same box, back tomorrow; "good" → next box;
 * "easy" → two boxes up. Gaps grow 1, 3, 7, 14, 30, 60 days: cards you know drift away, the ones you miss keep coming back.
 * Per card it also keeps the number of reviews, how many were remembered and when it was last reviewed.
 */
export type Rating = "again" | "hard" | "good" | "easy";
type CardState = { b: number; due: number; n?: number; ok?: number; last?: number };
type Store = { cards: Record<string, CardState>; day: string; done: number };

const KEY = "nh_srs_v1";
const DAY = 864e5;
const GAPS = [1, 3, 7, 14, 30, 60];
export const DAILY_GOAL = 20;
export const NEW_PER_SESSION = 15;

const today = () => new Date().toISOString().slice(0, 10);

function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Store | null;
    if (s && s.cards) return s.day === today() ? s : { ...s, day: today(), done: 0 };
  } catch { /* ignore */ }
  return { cards: {}, day: today(), done: 0 };
}
function save(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full / private mode */ }
}

/** Build a session: due cards first (oldest first), then up to NEW_PER_SESSION unseen ones, in deck order. */
export function buildSession(ids: string[]): { queue: string[]; due: number; fresh: number } {
  const s = load();
  const now = Date.now();
  const due = ids.filter((id) => s.cards[id] && s.cards[id].due <= now).sort((a, b) => s.cards[a].due - s.cards[b].due);
  const fresh = ids.filter((id) => !s.cards[id]).slice(0, NEW_PER_SESSION);
  return { queue: [...due, ...fresh], due: due.length, fresh: fresh.length };
}

export function rate(id: string, r: Rating): void {
  const s = load();
  const cur = s.cards[id] ?? { b: 0, due: 0 };
  const now = Date.now();
  let next: CardState;
  const stats = { n: (cur.n ?? 0) + 1, ok: (cur.ok ?? 0) + (r === "again" ? 0 : 1), last: now };
  if (r === "again") next = { b: 0, due: now };
  else if (r === "hard") next = { b: cur.b, due: now + DAY };
  else { const b = Math.min(cur.b + (r === "easy" ? 2 : 1), GAPS.length - 1); next = { b, due: now + GAPS[b] * DAY }; }
  s.cards[id] = { ...next, ...stats };
  s.done += 1;
  save(s);
}

/** Per deck: how many cards are known (box ≥ 2), learning, due now, never seen. */
export function deckStats(ids: string[]) {
  const s = load();
  const now = Date.now();
  let known = 0, learning = 0, due = 0;
  for (const id of ids) {
    const c = s.cards[id];
    if (!c) continue;
    if (c.b >= 2) known++; else learning++;
    if (c.due <= now) due++;
  }
  return { known, learning, due, unseen: ids.length - known - learning, total: ids.length };
}

export const doneToday = () => load().done;

/** Whole-device summary for the dashboard: due now, learned (box ≥ 2), still learning, reviews done, last review time. */
export function srsSummary() {
  const s = load();
  const now = Date.now();
  let due = 0, learned = 0, learning = 0, reviews = 0, last = 0;
  for (const c of Object.values(s.cards)) {
    if (c.due <= now) due++;
    if (c.b >= 2) learned++; else learning++;
    reviews += c.n ?? 0;
    if ((c.last ?? 0) > last) last = c.last!;
  }
  return { due, learned, learning, reviews, last, today: s.done };
}
