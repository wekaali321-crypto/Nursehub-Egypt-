// src/components/ArticleContent.tsx
import MCQQuiz from "./MCQQuiz";
import TrueFalseQuiz from "./TrueFalseQuiz";
import FillBlankQuiz from "./FillBlankQuiz";
import VitalCalculators from "./VitalCalculators";

type Props = {
  html: string;
  slug: string;
  className?: string;
};

type PartType = "html" | "mcq" | "tf" | "fb" | "calc";

const PLACEHOLDER_REGEX =
  /\[\[(MCQ_QUIZ|TF_QUIZ|FB_QUIZ|VITAL_CALCULATORS)(?::([a-z0-9-]+))?\]\]/gi;

function typeFor(tag: string): PartType {
  switch (tag.toUpperCase()) {
    case "MCQ_QUIZ":
      return "mcq";
    case "TF_QUIZ":
      return "tf";
    case "FB_QUIZ":
      return "fb";
    default:
      return "calc";
  }
}

export default function ArticleContent({ html, slug, className = "" }: Props) {
  const parts: Array<{ type: PartType; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(PLACEHOLDER_REGEX);
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", value: html.slice(lastIndex, match.index) });
    }

    const overrideSlug = match[2] || slug;
    parts.push({ type: typeFor(match[1]), value: overrideSlug });

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
        switch (part.type) {
          case "html":
            return <div key={index} dangerouslySetInnerHTML={{ __html: part.value }} />;
          case "mcq":
            return <MCQQuiz key={index} slug={part.value} />;
          case "tf":
            return <TrueFalseQuiz key={index} slug={part.value} />;
          case "fb":
            return <FillBlankQuiz key={index} slug={part.value} />;
          case "calc":
            return <VitalCalculators key={index} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
