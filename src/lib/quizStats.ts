import type { Quiz, QuizAttempt, Question, QuestionLogEntry } from "./types";

export type QuizMode = "quick10" | "timed" | "levelup" | "weakest" | "mock";

const toDay = (dateStr: string) => dateStr.slice(0, 10);

/** All calendar days (YYYY-MM-DD) on which the visitor answered at least one question. */
export function studiedDates(attempts: QuizAttempt[], questionLog: QuestionLogEntry[]): Set<string> {
  const days = new Set<string>();
  attempts.forEach((a) => days.add(toDay(a.date)));
  questionLog.forEach((e) => days.add(toDay(e.date)));
  return days;
}

/** Consecutive-day study streak, counting back from today (or yesterday, so the
 * streak doesn't reset to 0 the moment a new day starts before today is studied). */
export function computeStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const today = new Date();
  let cursor = new Date(today);
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  studied: boolean;
  isToday: boolean;
}

/** Last `count` days (oldest first) with a studied flag, for a streak calendar grid. */
export function buildCalendar(days: Set<string>, count = 14): CalendarDay[] {
  const out: CalendarDay[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso, dayOfMonth: d.getDate(), studied: days.has(iso), isToday: iso === todayStr });
  }
  return out;
}

export interface CategoryStat {
  category: string;
  categoryEn?: string;
  total: number;
  correct: number;
  pct: number;
}

export interface QuizAnalytics {
  quizCount: number;
  questionCount: number;
  studyMinutes: number;
  learningCurve: { label: string; score: number }[];
  categoryBreakdown: CategoryStat[];
}

export function computeAnalytics(attempts: QuizAttempt[], questionLog: QuestionLogEntry[]): QuizAnalytics {
  const byCategory = new Map<string, CategoryStat>();
  questionLog.forEach((e) => {
    const key = e.category || "عام";
    const cur = byCategory.get(key) ?? { category: e.category || "عام", categoryEn: e.categoryEn, total: 0, correct: 0, pct: 0 };
    cur.total += 1;
    if (e.isCorrect) cur.correct += 1;
    byCategory.set(key, cur);
  });
  const categoryBreakdown = Array.from(byCategory.values())
    .map((c) => ({ ...c, pct: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);

  const learningCurve = [...attempts]
    .reverse() // attempts are stored newest-first
    .slice(-12)
    .map((a, i) => ({ label: `${i + 1}`, score: a.score }));

  const studyMinutes = attempts.reduce((sum, a) => sum + Math.max(1, Math.round(a.total * 0.8)), 0);

  return {
    quizCount: attempts.length,
    questionCount: questionLog.length,
    studyMinutes,
    learningCurve,
    categoryBreakdown,
  };
}

interface PoolItem {
  quiz: Quiz;
  question: Question;
}

function flattenPool(quizzes: Quiz[], categoryFilter?: string): PoolItem[] {
  const pool: PoolItem[] = [];
  quizzes
    .filter((q) => q.status === "published" && !q.id.startsWith("mode-"))
    .forEach((quiz) => {
      if (categoryFilter && quiz.category !== categoryFilter) return;
      quiz.questions.forEach((question) => pool.push({ quiz, question }));
    });
  return pool;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deterministic "Question of the Day": same question for everyone, changes daily. */
export function pickQuestionOfDay(quizzes: Quiz[], dateStr: string): PoolItem | null {
  const pool = flattenPool(quizzes);
  if (pool.length === 0) return null;
  return pool[hashStr(dateStr) % pool.length];
}

function toVirtualQuiz(mode: QuizMode, items: PoolItem[], meta: { title: string; titleEn: string; description: string; descriptionEn: string; timeLimit: number }): Quiz {
  const questionCategoryMap: Record<string, { ar: string; en?: string }> = {};
  const questions: Question[] = items.map(({ quiz, question }) => {
    const uid = `${quiz.id}__${question.id}`;
    questionCategoryMap[uid] = { ar: quiz.category, en: quiz.categoryEn };
    return { ...question, id: uid };
  });
  return {
    id: `mode-${mode}`,
    title: meta.title,
    titleEn: meta.titleEn,
    description: meta.description,
    descriptionEn: meta.descriptionEn,
    category: meta.title,
    categoryEn: meta.titleEn,
    difficulty: "متوسط",
    timeLimit: meta.timeLimit,
    passScore: 60,
    questions,
    status: "published",
    demo: false,
    questionCategoryMap,
  };
}

export const MODE_META: Record<QuizMode, { title: string; titleEn: string; description: string; descriptionEn: string; icon: string }> = {
  quick10: { title: "اختبار سريع (10 أسئلة)", titleEn: "Quick 10 Quiz", description: "10 أسئلة عشوائية من كل بنوك الأسئلة، بدون وقت.", descriptionEn: "10 random questions from all question banks, no time limit.", icon: "🔟" },
  timed: { title: "اختبار بمؤقت", titleEn: "Timed Quiz", description: "15 سؤال عشوائي تحت ضغط الوقت.", descriptionEn: "15 random questions against the clock.", icon: "⏱️" },
  levelup: { title: "المستوى التصاعدي", titleEn: "Level Up", description: "تبدأ بأسئلة سهلة وتتصاعد الصعوبة تدريجيًا.", descriptionEn: "Starts easy and ramps up in difficulty.", icon: "📈" },
  weakest: { title: "أضعف موضوع عندك", titleEn: "Weakest Subject Quiz", description: "أسئلة من الموضوع اللي نسبة نجاحك فيه أقل حاجة.", descriptionEn: "Questions from the subject where your accuracy is lowest.", icon: "📕" },
  mock: { title: "امتحان تجريبي شامل", titleEn: "Mock Exam", description: "امتحان طويل يغطي كل الأقسام، بمؤقت زي الامتحان الحقيقي.", descriptionEn: "A long exam covering every category, timed like the real thing.", icon: "🗓️" },
};

export const QUIZ_MODE_ORDER: QuizMode[] = ["quick10", "timed", "levelup", "weakest", "mock"];

/** Builds a synthetic Quiz object for one of the Pocket-Prep-style quiz modes. */
export function buildModeQuiz(mode: QuizMode, quizzes: Quiz[], categoryBreakdown: CategoryStat[]): Quiz | null {
  const meta = MODE_META[mode];

  if (mode === "quick10") {
    const items = shuffle(flattenPool(quizzes)).slice(0, 10);
    if (items.length === 0) return null;
    return toVirtualQuiz(mode, items, { ...meta, timeLimit: 0 });
  }

  if (mode === "timed") {
    const items = shuffle(flattenPool(quizzes)).slice(0, 15);
    if (items.length === 0) return null;
    return toVirtualQuiz(mode, items, { ...meta, timeLimit: 15 });
  }

  if (mode === "mock") {
    const items = shuffle(flattenPool(quizzes)).slice(0, 40);
    if (items.length === 0) return null;
    return toVirtualQuiz(mode, items, { ...meta, timeLimit: 60 });
  }

  if (mode === "levelup") {
    const tiers: Array<"سهل" | "متوسط" | "صعب"> = ["سهل", "متوسط", "صعب"];
    const items = tiers.flatMap((d) => shuffle(flattenPool(quizzes).filter((p) => p.quiz.difficulty === d)).slice(0, 4));
    const finalItems = items.length > 0 ? items : shuffle(flattenPool(quizzes)).slice(0, 12);
    if (finalItems.length === 0) return null;
    return toVirtualQuiz(mode, finalItems, { ...meta, timeLimit: 0 });
  }

  // weakest
  const weakest = categoryBreakdown.find((c) => c.total >= 3);
  const targetCategory = weakest?.category;
  let items = targetCategory ? shuffle(flattenPool(quizzes, targetCategory)).slice(0, 10) : [];
  if (items.length === 0) items = shuffle(flattenPool(quizzes)).slice(0, 10);
  if (items.length === 0) return null;
  const description = weakest
    ? `أسئلة من "${weakest.category}" — نسبة نجاحك فيه ${weakest.pct}% حاليًا.`
    : meta.description;
  const descriptionEn = weakest
    ? `Questions from "${weakest.categoryEn || weakest.category}" — your current accuracy there is ${weakest.pct}%.`
    : meta.descriptionEn;
  return toVirtualQuiz(mode, items, { ...meta, description, descriptionEn, timeLimit: 0 });
}
