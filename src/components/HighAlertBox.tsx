import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { DrugAntidote } from "../lib/types";

/**
 * Standing safety reminders for a high-alert drug (ISMP practice: independent double check, the rights of administration)
 * and, when the site's antidote list names this drug as a whole word, its antidote. Uses data already on the page.
 */
const words = (s: string) => s.toLowerCase().split(/[^a-z؀-ۿ]+/).filter((w) => w.length >= 5);
export function antidotesFor(names: string[], list: DrugAntidote[]): DrugAntidote[] {
  const keys = new Set(names.flatMap((n) => words(n || "")));
  if (!keys.size) return [];
  return list.filter((a) => words(`${a.toxin} ${a.toxinEn ?? ""}`).some((w) => keys.has(w)));
}

export default function HighAlertBox({ names, antidotes }: { names: string[]; antidotes: DrugAntidote[] }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const found = antidotesFor(names, antidotes).slice(0, 2);
  return (
    <aside role="note" aria-label={ar ? "سلامة الدواء عالي الخطورة" : "High-alert medication safety"} className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 text-sm leading-7 text-orange-950 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100">
      <h2 className="mb-1 flex items-center gap-2 text-base font-black"><ShieldAlert size={20} aria-hidden="true" />{ar ? "دواء عالي الخطورة — قبل الإعطاء" : "High-alert drug — before giving it"}</h2>
      <ul className="list-disc space-y-0.5 ps-5">
        <li>{ar ? "تحقق مستقل مزدوج: ممرض تاني يراجع الحساب والتحضير بنفسه قبل الإعطاء." : "Independent double check: a second nurse checks the calculation and preparation on their own before you give it."}</li>
        <li>{ar ? "طابق: المريض الصح، الدواء والتركيز، الجرعة، المسار، المعدل والتوقيت — واقرأ الملصق مرتين." : "Match the right patient, drug and strength, dose, route, rate and time — read the label twice."}</li>
        <li>{ar ? "اتبع بروتوكول مؤسستك، ووثّق، وبلّغ عن أي خطأ أو قرب حدوث خطأ." : "Follow your facility's protocol, document, and report any error or near miss."}</li>
      </ul>
      {found.length > 0 && (
        <p className="mt-2 font-bold">
          {ar ? "الترياق: " : "Antidote: "}
          {found.map((a) => (ar ? a.antidotes : a.antidotesEn || a.antidotes)).join(" · ")}
          {" — "}<Link to="/drugs/antidotes" className="underline">{ar ? "دليل الترياقات" : "Antidote guide"}</Link>
        </p>
      )}
      <Link to="/drugs/high-alert-ref" className="mt-2 inline-block font-bold underline">{ar ? "مرجع الأدوية عالية الخطورة" : "High-alert medication reference"}</Link>
    </aside>
  );
}
