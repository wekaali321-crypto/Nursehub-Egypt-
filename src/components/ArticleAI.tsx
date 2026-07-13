import { useState } from "react";
import { searchArticleContent, answerFromKnowledgeBase, EXTERNAL_SOURCES } from "../lib/aiKnowledge";
import { useI18n } from "../lib/i18n";

type Source = "article" | "kb" | "external" | "info";
interface Msg { role: "user" | "bot"; text: string; source: Source }

/**
 * "Ask about this article" assistant.
 * Answers strictly from the current article's content first, then a curated
 * nursing knowledge base, and only then clearly points to external sources —
 * it never invents medical facts.
 */
export default function ArticleAI({ articleHtml, articleTitle }: { articleHtml: string; articleTitle: string }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      source: "info",
      text: lang === "ar"
        ? `اسألني عن أي شيء متعلق بمقال "${articleTitle}" وسأجيبك من محتوى المقال أولاً.`
        : `Ask me anything about "${articleTitle}" — I'll answer from this article first.`,
    },
  ]);

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    const fromArticle = searchArticleContent(articleHtml, q, lang);
    let answer: Msg;
    if (fromArticle) {
      answer = { role: "bot", source: "article", text: fromArticle };
    } else {
      const kb = answerFromKnowledgeBase(q, lang);
      if (kb) {
        answer = { role: "bot", source: "kb", text: kb };
      } else {
        answer = {
          role: "bot",
          source: "external",
          text: lang === "ar"
            ? "لم أجد إجابة مباشرة داخل هذا المقال. يُفضّل مراجعة مصادر طبية موثوقة خارجية للتأكد:"
            : "I couldn't find a direct answer within this article. Please check trusted external medical sources to confirm:",
        };
      }
    }
    setMsgs((m) => [...m, { role: "user", source: "info", text: q }, answer]);
    setInput("");
  };

  const sourceLabel = (s: Source) =>
    s === "article" ? (lang === "ar" ? "📄 من هذا المقال" : "📄 From this article")
    : s === "kb" ? (lang === "ar" ? "🩺 معرفة تمريضية عامة" : "🩺 General nursing knowledge")
    : s === "external" ? (lang === "ar" ? "🌐 مصدر خارجي" : "🌐 External source")
    : "";

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-emerald-50 dark:border-sky-900/60 dark:from-sky-500/5 dark:to-emerald-500/5 print:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-4 text-right"
      >
        <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
          <span aria-hidden="true">🤖</span> {t("article.askAI")}
        </span>
        <span className="text-slate-400" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-sky-100 p-4 dark:border-sky-900/50">
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-left" : ""}>
                <div className={`inline-block max-w-[92%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-sky-500 text-white" : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                  {m.role === "bot" && m.source !== "info" && (
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-60">{sourceLabel(m.source)}</div>
                  )}
                  {m.text}
                  {m.source === "external" && (
                    <ul className="mt-2 space-y-0.5">
                      {EXTERNAL_SOURCES.map((s) => (
                        <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-sky-500 underline">{s.name} ↗</a></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={ask} className="mt-3 flex gap-2">
            <label htmlFor="article-ai-input" className="sr-only">{t("article.askAI")}</label>
            <input
              id="article-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "ar" ? "اكتب سؤالك..." : "Type your question..."}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button className="shrink-0 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white">{lang === "ar" ? "إرسال" : "Send"}</button>
          </form>
          <p className="mt-2 text-[11px] text-slate-400">
            {lang === "ar" ? "إجابات تعليمية عامة — لا تُغني عن استشارة مختص." : "General educational answers — not a substitute for professional advice."}
          </p>
        </div>
      )}
    </div>
  );
}
