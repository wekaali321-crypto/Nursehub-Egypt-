import { ShieldAlert } from "lucide-react";
import { useI18n } from "../lib/i18n";

/** One educational disclaimer for the whole site (articles, drugs, topics). Change the wording here only. */
export const DISCLAIMER = {
  ar: "المحتوى المنشور على NurseHub Egypt لأغراض تعليمية وتثقيفية، ولا يغني عن السياسات والبروتوكولات المعتمدة داخل المؤسسة الصحية أو التقييم السريري أو توجيهات المختصين.",
  en: "Content published on NurseHub Egypt is for educational purposes only. It does not replace your healthcare facility's approved policies and protocols, clinical assessment, or the guidance of qualified professionals.",
};

export default function MedicalDisclaimer({ lang: forced, className = "" }: { lang?: "ar" | "en"; className?: string }) {
  const { lang } = useI18n();
  const l = forced ?? (lang === "en" ? "en" : "ar");
  return (
    <aside role="note" aria-label={l === "ar" ? "تنبيه تعليمي" : "Educational notice"} lang={l} dir={l === "ar" ? "rtl" : "ltr"}
      className={`flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 ${className}`}>
      <ShieldAlert size={20} className="mt-1 shrink-0" aria-hidden="true" />
      <p>{DISCLAIMER[l]}</p>
    </aside>
  );
}
