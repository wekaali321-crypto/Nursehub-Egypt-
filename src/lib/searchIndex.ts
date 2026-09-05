import { useEffect, useState } from "react";
import { fetchIcuTopics, type IcuTopic } from "./icuTopicsApi";
import { fetchClinicalProtocols, type ClinicalProtocol } from "./clinicalProtocolsApi";
import { fetchLasaPairs, type LasaPair } from "./lasaApi";

interface ExtraSearchIndex {
  icuTopics: IcuTopic[];
  protocols: ClinicalProtocol[];
  lasaPairs: LasaPair[];
}

const empty: ExtraSearchIndex = { icuTopics: [], protocols: [], lasaPairs: [] };
let cache: ExtraSearchIndex | null = null;
let inFlight: Promise<ExtraSearchIndex> | null = null;

async function loadIndex(): Promise<ExtraSearchIndex> {
  const [icuTopics, protocols, lasaPairs] = await Promise.all([
    fetchIcuTopics().catch(() => []),
    fetchClinicalProtocols().catch(() => []),
    fetchLasaPairs().catch(() => []),
  ]);
  return { icuTopics, protocols, lasaPairs };
}

/** ICU nursing topics, clinical protocols & LASA drug pairs live in their own
 * Supabase tables, outside the generic `articles`/`drugs` store — so global
 * search can't see them unless it fetches this separately. Fetched once and
 * shared (in-memory) across every caller (navbar quick-search, /search page). */
export function useExtraSearchIndex(): ExtraSearchIndex {
  const [data, setData] = useState<ExtraSearchIndex>(cache ?? empty);
  useEffect(() => {
    if (cache) return;
    if (!inFlight) inFlight = loadIndex();
    inFlight.then((res) => { cache = res; setData(res); });
  }, []);
  return data;
}
