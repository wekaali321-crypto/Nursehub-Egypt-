import { Link } from "react-router-dom";
import { findSafetyLinks, type DrugSourceTable } from "../lib/drugSafetyLinks";
import { useI18n } from "../lib/i18n";

const ICONS: Record<string, string> = {
  renal: "🫘",
  hepatic: "🫀",
  pregnancy: "🤰",
  iv: "🧫",
};

export default function SafetyLinksBox({ table, id }: { table: DrugSourceTable; id: string }) {
  const { t } = useI18n();
  const links = findSafetyLinks(table, id);
  if (!links.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="mb-2 font-bold text-amber-800 dark:text-amber-400">{t("drug.additionalSafetyInfo")}</div>
      <div className="flex flex-wrap gap-2">
        {links.map((l, i) => (
          <Link
            key={i}
            to={l.to}
            className="rounded-full bg-white px-3 py-1 font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20"
          >
            {ICONS[l.refType]} {l.label} ←
          </Link>
        ))}
      </div>
    </div>
  );
}
