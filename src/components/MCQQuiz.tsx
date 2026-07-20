// src/components/MCQQuiz.tsx
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
};

type Props = {
  slug: string; // article slug — looked up to find its questions
};

export default function MCQQuiz({ slug }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
        .eq("type", "mcq")
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

  function select(qId: string, option: string) {
    if (answers[qId] !== undefined) return; // answer already locked in
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  }

  if (loading) {
    return <p className="my-6 text-center text-sm text-slate-400">جارِ تحميل الأسئلة...</p>;
  }
  if (questions.length === 0) return null;

  return (
    <div dir="rtl" className="my-8 not-prose">
      <h3 className="mb-1 text-xl font-black dark:text-white">❓ أسئلة اختيار من متعدد</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        اختر إجابة واحدة — الحل يظهر فورًا بعد الاختيار.
      </p>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const selected = answers[q.id];
          const answered = selected !== undefined;
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="mb-3 font-bold dark:text-white">
                {i + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const isCorrect = opt === q.correct_answer;
                  const isSelected = opt === selected;
                  let cls =
                    "border-slate-200 bg-slate-50 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800";
                  if (answered && isSelected && isCorrect)
                    cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
                  else if (answered && isSelected && !isCorrect)
                    cls = "border-rose-400 bg-rose-50 dark:bg-rose-500/10";
                  else if (answered && isCorrect)
                    cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => select(q.id, opt)}
                      disabled={answered}
                      className={`rounded-lg border px-4 py-2 text-right text-sm font-semibold transition dark:text-white ${cls} ${
                        answered ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && q.explanation && (
                <p className="mt-3 rounded-lg bg-sky-50 p-2 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                  💡 {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
