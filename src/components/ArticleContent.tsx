// src/components/ArticleContent.tsx
import { Fragment } from "react";
import MCQQuiz from "./MCQQuiz";
import TrueFalseQuiz from "./TrueFalseQuiz";

type Props = {
  html: string;
  slug: string;
  className?: string;
};

const PLACEHOLDER_REGEX = /\[\[(MCQ_QUIZ|TF_QUIZ)(?::([a-z0-9-]+))?\]\]/gi;

export default function ArticleContent({ html, slug, className = "" }: Props) {
  const parts: Array<{ type: "html" | "mcq" | "tf"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(PLACEHOLDER_REGEX);
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", value: html.slice(lastIndex, match.index) });
    }

    const type = match[1].toUpperCase();
    const overrideSlug = match[2] || slug;

    parts.push({
      type: type === "MCQ_QUIZ" ? "mcq" : "tf",
      value: overrideSlug,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", value: html.slice(lastIndex) });
  }

  // لو مفيش placeholders، نرجع HTML عادي
  if (parts.length === 1 && parts[0].type === "html") {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === "html") {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: part.value }}
            />
          );
        }
        if (part.type === "mcq") {
          return <MCQQuiz key={index} slug={part.value} />;
        }
        return <TrueFalseQuiz key={index} slug={part.value} />;
      })}
    </div>
  );
}
