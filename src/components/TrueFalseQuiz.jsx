// src/components/TrueFalseQuiz.tsx
import { useState } from "react";
import { getTF, type TFItem } from "../data/quizzes";

function TFItemBox({ item, index }: { item: TFItem; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<boolean | null>(null);

  const choose = (val: boolean) => {
    if (revealed) return;
    setPicked(val);
    setRevealed(true);
  };

  const isCorrect = picked === item.correct;

  const btnClass = (val: boolean) => {
    const base =
      "flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2";
    if (!revealed)
      return `${base} border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`;
    if (val === item.correct)
      return `${base} border-green-500 bg-green-500 text-white`;
    if (val === picked)
      return `${base} border-red-500 bg-red-500 text-white`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-50 text-slate-500`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
      <p className="font-semibold text-slate-800 
