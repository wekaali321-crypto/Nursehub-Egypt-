// src/components/ArticleContent.tsx
import MCQQuiz from "./MCQQuiz";
import TrueFalseQuiz from "./TrueFalseQuiz";
import VitalCalculators from "./VitalCalculators";

type Props = {
  html: string;
  slug: string;
  className?: string;
};

type Part =
  | { type: "html"; value: string }
  | { type: "mcq"; value: string }
  | { type: "tf"; value: string }
  | { type: "calc"; value: string };

const PLACEHOLDER_REGEX = /\[\[(MCQ_QUIZ|TF_QUIZ|VITAL_CALCULATORS)(?::([a-z0-9-]+))?\]\]/gi;

export default function ArticleContent({ html, slug, className = "" }: Props) {
  const parts: Part[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(PLACEHOLDER_REGEX);
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", value: html.slice(lastIndex, match.index) });
    }

    const type = match[1].toUpperCase();
    const overrideSlug = match[2] || slug;

    // ✅ الإصلاح: 3 حالات صريحة بدل شرط ثنائي كان بيحوّل VITAL_CALCULATORS لصح/خطأ
    if (type === "MCQ_QUIZ") {
      parts.push({ type: "mcq", value: overrideSlug });
    } else if (type === "TF_QUIZ") {
      parts.push({ type: "tf", value: overrideSlug });
    } else {
      parts.push({ type: "calc", value: overrideSlug });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", value: html.slice(lastIndex) });
  }

  // لو مفيش placeholders، نرجع HTML عادي بدون أي معالجة إضافية
  if (parts.length === 1 && parts[0].type === "html") {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === "html") {
          return <div key={index} dangerouslySetInnerHTML={{ __html: part.value }} />;
        }
        if (part.type === "mcq") {
          return <MCQQuiz key={index} slug={part.value} />;
        }
        if (part.type === "tf") {
          return <TrueFalseQuiz key={index} slug={part.value} />;
        }
        // part.type === "calc"
        return <VitalCalculators key={index} />;
      })}
    </div>
  );
}
