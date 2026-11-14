import { useEffect, useState } from "react";
import { fetchIcuTopics, type IcuTopic } from "./icuTopicsApi";
import { fetchDialysisTopics, type DialysisTopic } from "./dialysisTopicsApi";
import { fetchRadiologyTopics, type RadiologyTopic } from "./radiologyTopicsApi";
import { fetchNicuTopics, type NicuTopic } from "./nicuTopicsApi";
import { fetchPharmacologyTopics, type PharmacologyTopic } from "./pharmacologyTopicsApi";
import { fetchTerminologyTopics, type TerminologyTopic } from "./terminologyTopicsApi";
import { fetchFirstAidTopics, type FirstAidTopic } from "./firstAidTopicsApi";
import { fetchERReceptionTopics, type ERReceptionTopic } from "./erReceptionTopicsApi";
import { fetchPediatricTopics, type PediatricTopic } from "./pediatricTopicsApi";
import { fetchAnatomyTopics, type AnatomyTopic } from "./anatomyTopicsApi";
import { fetchFundamentalsTopics, type FundamentalsTopic } from "./fundamentalsTopicsApi";
import { fetchOperatingRoomTopics, type OperatingRoomTopic } from "./operatingRoomTopicsApi";
import { fetchObgynTopics, type ObgynTopic } from "./obgynTopicsApi";
import { fetchClinicalProtocols, type ClinicalProtocol } from "./clinicalProtocolsApi";
import { fetchLasaPairs, type LasaPair } from "./lasaApi";
import { cacheGet, cacheSet, cachedQuery, TTL } from "./remoteCache";
import { fetchTravelQuestionsLite, type TravelQuestionLite } from "./travelQuestionsApi";
import { fetchCourseChaptersLite, type CourseChapterLite } from "./coursesApi";

interface ExtraSearchIndex {
  icuTopics: IcuTopic[];
  dialysisTopics: DialysisTopic[];
  radiologyTopics: RadiologyTopic[];
  nicuTopics: NicuTopic[];
  pharmacologyTopics: PharmacologyTopic[];
  terminologyTopics: TerminologyTopic[];
  firstAidTopics: FirstAidTopic[];
  erReceptionTopics: ERReceptionTopic[];
  pediatricTopics: PediatricTopic[];
  anatomyTopics: AnatomyTopic[];
  fundamentalsTopics: FundamentalsTopic[];
  operatingRoomTopics: OperatingRoomTopic[];
  obgynTopics: ObgynTopic[];
  protocols: ClinicalProtocol[];
  lasaPairs: LasaPair[];
  travelQuestions: TravelQuestionLite[];
  courseChapters: CourseChapterLite[];
}

const empty: ExtraSearchIndex = { icuTopics: [], dialysisTopics: [], radiologyTopics: [], nicuTopics: [], pharmacologyTopics: [], terminologyTopics: [], firstAidTopics: [], erReceptionTopics: [], pediatricTopics: [], anatomyTopics: [], fundamentalsTopics: [], operatingRoomTopics: [], obgynTopics: [], protocols: [], lasaPairs: [], travelQuestions: [], courseChapters: [] };
let cache: ExtraSearchIndex | null = null;
let inFlight: Promise<ExtraSearchIndex> | null = null;

async function loadIndex(): Promise<ExtraSearchIndex> {
  const [icuTopics, dialysisTopics, radiologyTopics, nicuTopics, pharmacologyTopics, terminologyTopics, firstAidTopics, erReceptionTopics, pediatricTopics, anatomyTopics, fundamentalsTopics, operatingRoomTopics, obgynTopics, protocols, lasaPairs, travelQuestions, courseChapters] = await Promise.all([
    cachedQuery("topics_v1_icu", TTL.topics, () => fetchIcuTopics()).catch(() => []),
    cachedQuery("topics_v1_dialysis", TTL.topics, () => fetchDialysisTopics()).catch(() => []),
    cachedQuery("topics_v1_radiology", TTL.topics, () => fetchRadiologyTopics()).catch(() => []),
    cachedQuery("topics_v1_nicu", TTL.topics, () => fetchNicuTopics()).catch(() => []),
    cachedQuery("topics_v1_pharmacology", TTL.topics, () => fetchPharmacologyTopics()).catch(() => []),
    cachedQuery("topics_v1_terminology", TTL.topics, () => fetchTerminologyTopics()).catch(() => []),
    cachedQuery("topics_v1_first_aid", TTL.topics, () => fetchFirstAidTopics()).catch(() => []),
    cachedQuery("topics_v1_er_reception", TTL.topics, () => fetchERReceptionTopics()).catch(() => []),
    cachedQuery("topics_v1_pediatric", TTL.topics, () => fetchPediatricTopics()).catch(() => []),
    cachedQuery("topics_v1_anatomy", TTL.topics, () => fetchAnatomyTopics()).catch(() => []),
    cachedQuery("topics_v1_fundamentals", TTL.topics, () => fetchFundamentalsTopics()).catch(() => []),
    cachedQuery("topics_v1_operating_room", TTL.topics, () => fetchOperatingRoomTopics()).catch(() => []),
    cachedQuery("topics_v1_obgyn", TTL.topics, () => fetchObgynTopics()).catch(() => []),
    fetchClinicalProtocols().catch(() => []),
    fetchLasaPairs().catch(() => []),
    fetchTravelQuestionsLite().catch(() => []),
    fetchCourseChaptersLite().catch(() => []),
  ]);
  return { icuTopics, dialysisTopics, radiologyTopics, nicuTopics, pharmacologyTopics, terminologyTopics, firstAidTopics, erReceptionTopics, pediatricTopics, anatomyTopics, fundamentalsTopics, operatingRoomTopics, obgynTopics, protocols, lasaPairs, travelQuestions, courseChapters };
}

/** ICU nursing topics, clinical protocols & LASA drug pairs live in their own
 * Supabase tables, outside the generic `articles`/`drugs` store — so global
 * search can't see them unless it fetches this separately. Fetched once and
 * shared (in-memory) across every caller (navbar quick-search, /search page). */
export function useExtraSearchIndex(enabled = true): ExtraSearchIndex {
  const [data, setData] = useState<ExtraSearchIndex>(cache ?? empty);
  useEffect(() => {
    // Lazy: the index (thousands of rows) is only downloaded once someone actually uses search,
    // and then kept in IndexedDB for 12 hours so it is not re-downloaded on every visit.
    if (!enabled) return;
    if (cache) {
      setData(cache);
      return;
    }
    if (!inFlight) {
      inFlight = cacheGet<ExtraSearchIndex>('search_index_v1', 12 * 3600 * 1000).then(async (hit) => {
        if (hit) return hit;
        const fresh = await loadIndex();
        void cacheSet('search_index_v1', fresh);
        return fresh;
      });
    }
    inFlight.then((res) => { cache = res; setData(res); });
  }, [enabled]);
  return data;
}
