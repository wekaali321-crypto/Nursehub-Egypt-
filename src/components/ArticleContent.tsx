// src/components/ArticleContent.tsx
import MCQQuiz from "./MCQQuiz";
import TrueFalseQuiz from "./TrueFalseQuiz";
import FillBlankQuiz from "./FillBlankQuiz";
import VitalCalculators from "./VitalCalculators";

type Props = {
  html: string;
  slug: string;
  lang?: "ar" | "en";
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

/** Wide tables scroll sideways inside their own box instead of being clipped by (or stretching) the page. */
export function wrapTables(html: string): string {
  return html.replace(/<table(\s|>)/gi, '<div class="nh-table-wrap"><table$1').replace(/<\/table>/gi, "</table></div>");
}

export default function ArticleContent({ html, slug, lang = "ar", className = "" }: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";
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
    return <div dir={dir} className={className} dangerouslySetInnerHTML={{ __html: wrapTables(html) }} />;
  }

  return (
    <div dir={dir} className={className}>
      {parts.map((part, index) => {
        switch (part.type) {
          case "html":
            return <div key={index} dangerouslySetInnerHTML={{ __html: wrapTables(part.value) }} />;
          case "mcq":
            return <MCQQuiz key={index} slug={part.value} lang={lang} />;
          case "tf":
            return <TrueFalseQuiz key={index} slug={part.value} lang={lang} />;
          case "fb":
            return <FillBlankQuiz key={index} slug={part.value} lang={lang} />;
          case "calc":
            return <VitalCalculators key={index} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
