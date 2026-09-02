import type { Drug } from "./types";
import { fetchICUMedications, type ICUMedication } from "./icuMedApi";
import { fetchERMedications, type ERMedication } from "./erMedApi";
import { fetchPedsMedications, type PedsMedication } from "./pedsMedApi";
import { fetchHighAlertRef, type HighAlertRefCategory } from "./highAlertRefApi";
import { fetchLasaPairs, type LasaPair } from "./lasaApi";
import { fetchRxPrescriptions, type RxPrescription } from "./rxApi";
import { fetchOrganDoseAdjustments, type OrganDoseAdjustment } from "./organDoseApi";
import { fetchPregnancyLactationSafety, type PregnancyLactationSafety } from "./pregnancyLactationApi";
import { fetchIVCompatibility, type IVCompatibilityPair } from "./ivCompatibilityApi";

export interface GlobalSearchData {
  icu: ICUMedication[];
  er: ERMedication[];
  peds: PedsMedication[];
  highAlert: HighAlertRefCategory[];
  lasa: LasaPair[];
  rx: RxPrescription[];
  organDose: OrganDoseAdjustment[];
  pregnancy: PregnancyLactationSafety[];
  iv: IVCompatibilityPair[];
}

export async function loadGlobalSearchData(): Promise<GlobalSearchData> {
  const [icu, er, peds, highAlert, lasa, rx, organDose, pregnancy, iv] = await Promise.all([
    fetchICUMedications().catch(() => []),
    fetchERMedications().catch(() => []),
    fetchPedsMedications().catch(() => []),
    fetchHighAlertRef().catch(() => []),
    fetchLasaPairs().catch(() => []),
    fetchRxPrescriptions().catch(() => []),
    fetchOrganDoseAdjustments().catch(() => []),
    fetchPregnancyLactationSafety().catch(() => []),
    fetchIVCompatibility().catch(() => []),
  ]);
  return { icu, er, peds, highAlert, lasa, rx, organDose, pregnancy, iv };
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sourceLabel: string;
  to: string;
}

export function searchGlobalDrugs(query: string, drugs: Drug[], data: GlobalSearchData, limit = 30): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const d of drugs) {
    if (d.name.toLowerCase().includes(q) || d.genericName.toLowerCase().includes(q) || d.drugClass.toLowerCase().includes(q)) {
      results.push({ id: `d-${d.id}`, title: d.name, subtitle: d.genericName, icon: "💊", sourceLabel: "الأدوية الرئيسية", to: `/drug/${d.slug}` });
    }
  }
  for (const i of data.icu) {
    if (i.drug_name.toLowerCase().includes(q) || (i.drug_class || "").toLowerCase().includes(q)) {
      results.push({ id: `icu-${i.id}`, title: i.drug_name, subtitle: i.drug_class || "أدوية العناية المركزة", icon: "🏥", sourceLabel: "العناية المركزة", to: `/drugs/icu-medications/${i.id}` });
    }
  }
  for (const e of data.er) {
    if (e.drug_name.toLowerCase().includes(q) || (e.drug_class || "").toLowerCase().includes(q)) {
      results.push({ id: `er-${e.id}`, title: e.drug_name, subtitle: e.drug_class || "أدوية الطوارئ", icon: "🚑", sourceLabel: "الطوارئ", to: `/drugs/er-medications/${e.id}` });
    }
  }
  for (const p of data.peds) {
    if (p.drug_name.toLowerCase().includes(q)) {
      results.push({ id: `peds-${p.id}`, title: p.drug_name, subtitle: p.category || "بروتوكولات الأطفال", icon: "🧒", sourceLabel: "الأطفال", to: `/drugs/peds-medications/${p.id}` });
    }
  }
  for (const h of data.highAlert) {
    const matchDrug = h.drugs.find((dr) => dr.toLowerCase().includes(q));
    if (matchDrug || h.category_ar.toLowerCase().includes(q)) {
      const term = matchDrug || h.category_ar;
      results.push({ id: `ha-${h.id}`, title: matchDrug || h.category_ar, subtitle: "عالي الخطورة", icon: "⚠️", sourceLabel: "الأدوية عالية الخطورة", to: `/drugs/high-alert-ref?q=${encodeURIComponent(term)}` });
    }
  }
  for (const l of data.lasa) {
    if (l.drug_a.toLowerCase().includes(q) || l.drug_b.toLowerCase().includes(q)) {
      const term = l.drug_a.toLowerCase().includes(q) ? l.drug_a : l.drug_b;
      results.push({ id: `lasa-${l.id}`, title: `${l.drug_a} ↔ ${l.drug_b}`, subtitle: "متشابه الاسم (LASA)", icon: "🔤", sourceLabel: "LASA", to: `/drugs/lasa?q=${encodeURIComponent(term)}` });
    }
  }
  for (const r of data.rx) {
    const matchItem = r.items.find((it) => it.drug_name.toLowerCase().includes(q));
    if (matchItem || r.condition_ar.toLowerCase().includes(q)) {
      results.push({ id: `rx-${r.id}`, title: r.condition_ar, subtitle: matchItem ? matchItem.drug_name : r.category, icon: "℞", sourceLabel: "روشتات صيدلية", to: `/drugs/prescriptions/${r.id}` });
    }
  }
  for (const o of data.organDose) {
    if (o.drug_name.toLowerCase().includes(q)) {
      results.push({
        id: `od-${o.id}`,
        title: o.drug_name,
        subtitle: o.adjustment_type === "renal" ? "تعديل جرعة كلوي" : "تعديل جرعة كبدي",
        icon: o.adjustment_type === "renal" ? "🫘" : "🫀",
        sourceLabel: "تعديل الجرعات",
        to: `/drugs/organ-dose?q=${encodeURIComponent(o.drug_name)}&tab=${o.adjustment_type}`,
      });
    }
  }
  for (const p of data.pregnancy) {
    if (p.drug_name.toLowerCase().includes(q)) {
      results.push({ id: `pl-${p.id}`, title: p.drug_name, subtitle: "أمان الحمل والرضاعة", icon: "🤰", sourceLabel: "الحمل والرضاعة", to: `/drugs/pregnancy-lactation?q=${encodeURIComponent(p.drug_name)}` });
    }
  }
  for (const iv of data.iv) {
    if (iv.drug_a.toLowerCase().includes(q) || iv.drug_b.toLowerCase().includes(q)) {
      const term = iv.drug_a.toLowerCase().includes(q) ? iv.drug_a : iv.drug_b;
      results.push({ id: `iv-${iv.id}`, title: `${iv.drug_a} + ${iv.drug_b}`, subtitle: "توافق أدوية وريدية", icon: "🧫", sourceLabel: "توافق IV", to: `/drugs/iv-compatibility?q=${encodeURIComponent(term)}` });
    }
  }

  return results.slice(0, limit);
}
