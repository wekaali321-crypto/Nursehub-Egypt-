import type { TopicCode } from "../examTopics";
import type { Lang } from "./voice";

/** Live AI budget (GET /api/oral, cached ~20 s at the edge). null = the endpoint is not reachable (e.g. local dev). */
export interface AiStatus { ai: boolean; enabled: boolean; used: number; limit: number; pct: number; calls: number; resetsAt: string }
export async function getAiStatus(): Promise<AiStatus | null> {
  try {
    const r = await fetch("/api/oral", { headers: { accept: "application/json" } });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return null;
    return (await r.json()) as AiStatus;
  } catch { return null; }
}

export type Fallback = { fallback: true; reason: string };
export interface AiQuestion { q: string; points: string[] }
export interface AiGrade { score: number; feedback: string; missing: string[] }

async function post<T>(body: unknown): Promise<T | Fallback> {
  try {
    const r = await fetch("/api/oral", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    if (r.ok && j && !j.fallback) return j as T;
    return { fallback: true, reason: j?.reason || `http_${r.status}` };
  } catch { return { fallback: true, reason: "network" }; }
}
export const isFallback = (x: unknown): x is Fallback => !!x && typeof x === "object" && (x as Fallback).fallback === true;

export const aiGenerate = (a: { lang: Lang; title: string; text: string; topic: string; count: number }) =>
  post<{ questions: AiQuestion[] }>({ action: "generate", ...a });
export const aiGrade = (a: { lang: Lang; q: string; points: string[]; answer: string }) => post<AiGrade>({ action: "grade", ...a });

/** Free exam: a static question pool (public/exams/oral/<topic>.json — no D1). */
export interface PoolQuestion { id: string; en: string; ar?: string; c: string[]; ca?: string[]; a: number; r?: string; ra?: string }
const pools = new Map<string, Promise<PoolQuestion[]>>();
export function loadPool(topic: TopicCode | "mixed"): Promise<PoolQuestion[]> {
  if (!pools.has(topic)) {
    pools.set(topic, fetch(`/exams/oral/${topic}.json`).then((r) => (r.ok ? r.json() : { q: [] })).then((j) => (j.q as PoolQuestion[]) || []).catch(() => { pools.delete(topic); return []; }));
  }
  return pools.get(topic)!;
}
export function pickQuestions(pool: PoolQuestion[], n: number): PoolQuestion[] {
  const seen = recentIds();
  const fresh = pool.filter((q) => !seen.has(q.id));
  const src = fresh.length >= n ? fresh : pool;
  const out = [...src].sort(() => Math.random() - 0.5).slice(0, n);
  rememberIds(out.map((q) => q.id));
  return out;
}
const SEEN = "nh_oral_seen_v1";
function recentIds(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch { return new Set(); } }
function rememberIds(ids: string[]) { try { localStorage.setItem(SEEN, JSON.stringify([...ids, ...recentIds()].slice(0, 300))); } catch { /* ignore */ } }

/** The page the learner is on: its title and readable text (for the smart exam), without menus, buttons and footers. */
export function pageContext(): { title: string; text: string } {
  const main = document.getElementById("main-content");
  const h1 = main?.querySelector("h1")?.textContent?.trim();
  const title = h1 || document.title.replace(/\s*[|–-]\s*NurseHub.*$/i, "").trim();
  if (!main) return { title, text: "" };
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("nav,aside,button,form,script,style,svg,footer,[aria-hidden='true'],.print\\:hidden,[data-oral-skip]").forEach((n) => n.remove());
  const text = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim().slice(0, 3500);
  return { title, text };
}

/** Topic of the free question bank that fits the current page (falls back to a mix of all topics). */
const PATH_TOPICS: [RegExp, TopicCode][] = [
  [/ecg|cardiac|heart/i, "cardio"],
  [/obgyn|matern|pregnan/i, "maternity"],
  [/nicu|pediatric|peds/i, "pediatrics"],
  [/dialysis|renal/i, "renal"],
  [/pharm|drug|medication|high-alert|lasa|iv-compat|antidote|otc|rx|dose|suffix/i, "pharmacology"],
  [/first-aid|er-|emergency|icu/i, "emergency"],
  [/operating-room|infection/i, "infection"],
  [/fundamentals|interview/i, "leadership"],
];
export function topicForPath(pathname: string, search = ""): TopicCode | "mixed" {
  const sys = new URLSearchParams(search).get("system");
  const SYS: Record<string, TopicCode> = { cardio: "cardio", chest: "respiratory", neuro: "neuro", renal: "renal", gi: "gi", endo: "endocrine", mental: "mental", infect: "infection", blood: "oncology", rheum: "musculo" };
  if (sys && SYS[sys]) return SYS[sys];
  for (const [re, t] of PATH_TOPICS) if (re.test(pathname)) return t;
  return "mixed";
}
