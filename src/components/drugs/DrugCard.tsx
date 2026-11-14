import { Link } from "react-router-dom";
import type { Drug } from "../../lib/types";
import { useI18n, bilingual } from "../../lib/i18n";

/** Compact drug card for the drug-reference list: name, generic name, category and a High Alert badge when present. */
export default function DrugCard({ d, onOpen }: { d: Drug; onOpen?: () => void }) {
  const { lang, t } = useI18n();
  const name = bilingual(d.name, d.nameEn, lang).text;
  const generic = bilingual(d.genericName, d.genericNameEn, lang).text;
  const category = bilingual(d.category, d.categoryEn, lang).text;
  return (
    <Link
      to={`/drug/${d.slug}`}
      onClick={onOpen}
      className="group flex flex-col gap-1.5 rounded-2xl border border-slate-200 border-s-4 border-s-[#168C91] bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] dark:border-slate-800 dark:border-s-[#168C91] dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 dir="ltr" className="min-w-0 break-words text-start text-base font-black leading-snug text-[#153448] group-hover:text-[#168C91] dark:text-white dark:group-hover:text-teal-300">{name}</h3>
        {d.isHighAlert && (
          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">⚠ {t("drugs.highAlertBadge")}</span>
        )}
      </div>
      {generic && <p dir="ltr" className="break-words text-start text-sm text-slate-600 dark:text-slate-400">{generic}</p>}
      <span className="mt-auto w-fit max-w-full truncate rounded-full bg-[#168C91]/10 px-2.5 py-0.5 text-xs font-bold text-[#127378] dark:bg-[#168C91]/20 dark:text-teal-300">{category}</span>
    </Link>
  );
}
