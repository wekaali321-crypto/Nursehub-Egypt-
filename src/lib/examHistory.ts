/**
 * Exam-simulator results, kept on this device only (localStorage) — no server writes, no D1 reads.
 * Used to show "your progress / weak areas" per question bank (travel category or licensure exam).
 */
export type ExamGroup = "travel" | "licensure";
export interface ExamAttempt {
  key: string;        // question-bank id (travel category id / licensure exam id)
  group: ExamGroup;
  title: string;
  path: string;       // where to practise it again
  date: number;
  correct: number;
  total: number;
  seconds: number;
}

const KEY = "nh_exam_history_v1";
const MAX = 300;

export function loadHistory(): ExamAttempt[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as ExamAttempt[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function addAttempt(a: ExamAttempt): void {
  try {
    const all = [a, ...loadHistory()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

export interface BankStats {
  key: string; title: string; path: string; attempts: number; last: number; best: number; avg: number; lastDate: number;
}

/** Per question bank: attempts, last / best / average score (%), weakest first. */
export function statsByBank(group?: ExamGroup): BankStats[] {
  const m = new Map<string, ExamAttempt[]>();
  for (const a of loadHistory()) {
    if (group && a.group !== group) continue;
    if (!a.total) continue;
    m.set(a.key, [...(m.get(a.key) ?? []), a]);
  }
  const pct = (a: ExamAttempt) => Math.round((a.correct / a.total) * 100);
  return [...m.entries()]
    .map(([key, list]) => ({
      key,
      title: list[0].title,
      path: list[0].path,
      attempts: list.length,
      last: pct(list[0]),
      best: Math.max(...list.map(pct)),
      avg: Math.round(list.reduce((s, a) => s + pct(a), 0) / list.length),
      lastDate: list[0].date,
    }))
    .sort((a, b) => a.avg - b.avg);
}
