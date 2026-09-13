import { useEffect, useState } from "react";
import { fetchIcuTopics, type IcuTopic } from "./icuTopicsApi";
import { fetchDialysisTopics, type DialysisTopic } from "./dialysisTopicsApi";
import { fetchNicuTopics, type NicuTopic } from "./nicuTopicsApi";
import { fetchPharmacologyTopics, type PharmacologyTopic } from "./pharmacologyTopicsApi";
import { fetchTerminologyTopics, type TerminologyTopic } from "./terminologyTopicsApi";
import { fetchFirstAidTopics, type FirstAidTopic } from "./firstAidTopicsApi";
import { fetchERReceptionTopics, type ERReceptionTopic } from "./erReceptionTopicsApi";
import { fetchPediatricTopics, type PediatricTopic } from "./pediatricTopicsApi";
import { fetchClinicalProtocols, type ClinicalProtocol } from "./clinicalProtocolsApi";
import { fetchLasaPairs, type LasaPair } from "./lasaApi";

interface ExtraSearchIndex {
  icuTopics: IcuTopic[];
  dialysisTopics: DialysisTopic[];
  nicuTopics: NicuTopic[];
  pharmacologyTopics: PharmacologyTopic[];
  terminologyTopics: TerminologyTopic[];
  firstAidTopics: FirstAidTopic[];
  erReceptionTopics: ERReceptionTopic[];
  pediatricTopics: PediatricTopic[];
  protocols: ClinicalProtocol[];
  lasaPairs: LasaPair[];
}

const empty: ExtraSearchIndex = { icuTopics: [], dialysisTopics: [], nicuTopics: [], pharmacologyTopics: [], terminologyTopics: [], firstAidTopics: [], erReceptionTopics: [], pediatricTopics: [], protocols: [], lasaPairs: [] };
let cache: ExtraSearchIndex | null = null;
let inFlight: Promise<ExtraSearchIndex> | null = null;

async function loadIndex(): Promise<ExtraSearchIndex> {
  const [icuTopics, dialysisTopics, nicuTopics, pharmacologyTopics, terminologyTopics, firstAidTopics, erReceptionTopics, pediatricTopics, protocols, lasaPairs] = await Promise.all([
    fetchIcuTopics().catch(() => []),
    fetchDialysisTopics().catch(() => []),
    fetchNicuTopics().catch(() => []),
    fetchPharmacologyTopics().catch(() => []),
    fetchTerminologyTopics().catch(() => []),
    fetchFirstAidTopics().catch(() => []),
    fetchERReceptionTopics().catch(() => []),
    fetchPediatricTopics().catch(() => []),
    fetchClinicalProtocols().catch(() => []),
    fetchLasaPairs().catch(() => []),
  ]);
  return { icuTopics, dialysisTopics, nicuTopics, pharmacologyTopics, terminologyTopics, firstAidTopics, erReceptionTopics, pediatricTopics, protocols, lasaPairs };
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
