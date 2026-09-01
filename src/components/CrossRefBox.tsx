import { Link } from "react-router-dom";
import { findCrossRefs, type CrossRefTable } from "../lib/drugCrossRef";

export default function CrossRefBox({ table, id }: { table: CrossRefTable; id: string }) {
  const refs = findCrossRefs(table, id);
  if (!refs.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
      <div className="mb-2 font-bold text-indigo-700 dark:text-indigo-400">🔗 هذا الدواء موجود أيضاً في:</div>
      <div className="flex flex-wrap gap-2">
        {refs.map((r) => (
          <Link
            key={r.path}
            to={r.path}
            className="rounded-full bg-white px-3 py-1 font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-slate-900 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-500/20"
          >
            {r.label} ←
          </Link>
        ))}
      </div>
    </div>
  );
}
