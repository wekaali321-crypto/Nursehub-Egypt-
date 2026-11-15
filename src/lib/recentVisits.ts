/**
 * The last learning pages opened on THIS device (path + page title), for "continue where you left off" on the dashboard.
 * Kept in localStorage only: nothing is sent to the server, nothing is written to D1.
 */
const KEY = "nh_recent_v1";
const MAX = 8;
// pages worth coming back to (topics, guides, drugs, articles, exams) — not hubs, search, account or admin pages
const LEARNING = /^\/(article|drug|diseases|guide|cases|icu-nursing|dialysis|radiology|nicu|pharmacology|terminology|first-aid|er-reception|pediatrics|anatomy|fundamentals|operating-room|obgyn|courses|travel-questions|tests\/licensure)\/[^/]+/;

export type Visit = { path: string; title: string; at: number };

export function loadVisits(): Visit[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function recordVisit(path: string, rawTitle: string): void {
  if (!LEARNING.test(path)) return;
  const title = rawTitle.split(" | ")[0].trim();
  if (!title || title === "NurseHub Egypt") return;
  try {
    const list = [{ path, title, at: Date.now() }, ...loadVisits().filter((v) => v.path !== path)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage full / private mode */ }
}
