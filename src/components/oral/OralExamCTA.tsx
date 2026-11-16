import { Mic } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useFeatures } from "../../admin/cms/useFeatures";
import { examinerName, openOralExam, type OralPreset } from "./OralLauncher";
import NurseHubAvatar from "../avatar/NurseHubAvatar";

/** Inline "Ali quizzes you out loud" card (article end, exam hubs, dashboard). Opens the same panel as the floating button. */
export default function OralExamCTA({ preset, title, text, className = "" }: { preset?: OralPreset; title?: string; text?: string; className?: string }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { features } = useFeatures();
  if (features.oralExam === false) return null;
  const name = examinerName(ar);
  return (
    <div data-oral-skip className={`flex items-center gap-4 overflow-hidden rounded-2xl bg-nh-navy p-4 text-white shadow-sm print:hidden ${className}`}>
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#173a5a] ring-2 ring-nh-teal">
        <NurseHubAvatar framing="head" size={64} animated={false} label={ar ? "مساعد NurseHub" : "NurseHub assistant"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{title ?? (ar ? `اختبرني شفوي مع ${name}` : `Oral exam with ${name}`)}</p>
        <p className="text-xs leading-5 text-slate-300">{text ?? (ar ? `${name} ${name === "دنيا" ? "هتسألك" : "هيسألك"} بصوت على اللي ذاكرته، وانت تجاوب بصوتك وتاخد تقييمك فورًا.` : `${name} asks out loud about what you studied; answer out loud and get marked right away.`)}</p>
      </div>
      <button type="button" onClick={() => openOralExam(preset)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-nh-teal px-4 py-2 text-sm font-black text-white hover:bg-nh-teal-dark">
        <Mic size={16} aria-hidden="true" />{ar ? "ابدأ" : "Start"}
      </button>
    </div>
  );
}
