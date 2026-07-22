// src/components/FillBlankQuiz.tsx
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type Question = {
  id: string;
  question: string; // contains "_______" as the blank marker
  correct_answer: string;
  order_index: number;
};

type Props = {
  slug: string;
};

export default function FillBlankQuiz({ slug }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured() || !supabase) {
        setLoading(false);
        return;
      }
      const { data: article } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!article) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("article_id", article.id)
        .eq("type", "fill_blank")
        .order("order_index", { ascending: true });

      if (!cancelled) {
        if (!error && data) setQuestions(data as Question[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <p className="my-6 text-center text-sm text-slate-400">جارِ تحميل الأسئلة...</p>;
  }
  if (questions.length === 0) return null;

  return (
    <div dir="rtl" className="my-8 not-prose">
      <h3 className="mb-1 text-xl font-black dark:text-white">📝 أكمل الفراغ</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        اضغط على "إظهار الإجابة" بعد ما تحاول تتذكرها بنفسك.
      </p>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const isRevealed = revealed[q.id];
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-semibold dark:text-white">
                {i + 1}. {q.question}
              </p>
              {isRevealed ? (
                <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  ✅ {q.correct_answer}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed((prev) => ({ ...prev, [q.id]: true }))}
                  className="mt-2 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-600"
                >
                  إظهار الإجابة
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
