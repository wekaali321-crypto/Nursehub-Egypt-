import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Pill } from "lucide-react";
import { loadOfflineJson } from "../lib/offlineFile";
import { useI18n } from "../lib/i18n";
import { Chip } from "./ui";
import { matchDrugs, type Row } from "../lib/drugMatch";

/**
 * Drugs mentioned in a text (article, topic), linked to their drug pages — from the static 25 KB names index
 * (public/shift/drug-names.json, built by scripts/build-shift-data.mjs): no database read. A name must appear as a whole
 * word (Latin) or as the full Arabic name; names shorter than 5 letters are ignored to avoid false matches.
 */
let index: Promise<Row[]> | null = null;
const loadIndex = () => (index ??= loadOfflineJson<{ drugs: Row[] }>("/shift/drug-names.json", "drug_names_v1").then((r) => r.data.drugs).catch(() => { index = null; return []; }));

export default function RelatedDrugs({ text, excludeSlug }: { text: string; excludeSlug?: string }) {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => { if (text) void loadIndex().then(setRows); }, [text]);
  const hits = useMemo(() => (rows ? matchDrugs(text, rows).filter((h) => h.kind !== "brand" || h.row[0] !== excludeSlug) : []), [rows, text, excludeSlug]);
  if (!hits.length) return null;
  const anyHighAlert = hits.some((h) => (h.kind === "brand" ? !!h.row[4] : h.highAlert));
  return (
    <section aria-labelledby="rel-drugs" className="rounded-2xl border border-nh-line bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="rel-drugs" className="mb-3 flex items-center gap-2 text-lg font-black text-nh-navy dark:text-white"><Pill size={20} className="text-nh-teal" aria-hidden="true" />{ar ? "أدوية مذكورة في الموضوع" : "Drugs mentioned here"}</h2>
      <ul className="flex flex-wrap gap-2">
        {hits.map((h) => {
          const to = h.kind === "brand" ? `/drug/${h.row[0]}` : `/search?q=${encodeURIComponent(h.name)}`;
          const label = h.kind === "brand" ? (ar ? h.row[1] || h.row[2] : h.row[2] || h.row[1]) : h.name;
          const ha = h.kind === "brand" ? !!h.row[4] : h.highAlert;
          return (
            <li key={to}>
              <Link to={to} className="inline-flex items-center gap-1.5 rounded-xl border border-nh-line px-3 py-2 text-sm font-bold text-nh-navy hover:border-nh-teal hover:bg-nh-teal-soft dark:border-slate-700 dark:text-slate-100 dark:hover:bg-teal-500/10">
                {label}
                {ha ? <Chip tone="alert">{ar ? "عالي الخطورة" : "High alert"}</Chip> : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {anyHighAlert && (
        <Link to="/drugs/high-alert-ref" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-nh-alert hover:underline">
          <AlertTriangle size={16} aria-hidden="true" />{ar ? "إرشادات السلامة للأدوية عالية الخطورة" : "High-alert medication safety"}
        </Link>
      )}
    </section>
  );
}
