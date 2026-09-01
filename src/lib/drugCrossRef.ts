// روابط تقاطع بين نفس الدواء الموجود في أكثر من قسم (كل الأدوية / العناية المركزة / الطوارئ)
export type CrossRefTable = "drugs" | "icu_medications" | "er_medications";

export interface CrossRefEntry {
  table: CrossRefTable;
  id: string;
  label: string;
  path: string;
}

function e(table: CrossRefTable, id: string, label: string, path: string): CrossRefEntry {
  return { table, id, label, path };
}

export const CROSS_REF_GROUPS: CrossRefEntry[][] = [
  [
    e("icu_medications", "icu14", "أدرينالين — العناية المركزة", "/drugs/icu-medications/icu14"),
    e("er_medications", "er19", "Adrenaline — الطوارئ", "/drugs/er-medications/er19"),
  ],
  [
    e("icu_medications", "icu15", "نورأدرينالين — العناية المركزة", "/drugs/icu-medications/icu15"),
    e("er_medications", "er20", "Noradrenaline — الطوارئ", "/drugs/er-medications/er20"),
  ],
  [
    e("icu_medications", "icu16", "دوبامين — العناية المركزة", "/drugs/icu-medications/icu16"),
    e("er_medications", "er21", "Dopamine — الطوارئ", "/drugs/er-medications/er21"),
  ],
  [
    e("icu_medications", "icu17", "دوبوتامين — العناية المركزة", "/drugs/icu-medications/icu17"),
    e("er_medications", "er22", "Dobutrex (Dobutamine) — الطوارئ", "/drugs/er-medications/er22"),
  ],
  [
    e("icu_medications", "icu13", "أتروبين — العناية المركزة", "/drugs/icu-medications/icu13"),
    e("er_medications", "er18", "Atropine — الطوارئ", "/drugs/er-medications/er18"),
  ],
  [
    e("drugs", "d2", "Heparin — كل الأدوية", "/drug/heparin"),
    e("icu_medications", "icu1", "الهيبارين — العناية المركزة", "/drugs/icu-medications/icu1"),
    e("er_medications", "er23", "Heparin — الطوارئ", "/drugs/er-medications/er23"),
  ],
  [
    e("drugs", "d3", "Furosemide — كل الأدوية", "/drug/furosemide"),
    e("icu_medications", "icu21", "فوروسيميد — العناية المركزة", "/drugs/icu-medications/icu21"),
    e("er_medications", "er7", "Lasix (Furosemide) — الطوارئ", "/drugs/er-medications/er7"),
  ],
  [
    e("drugs", "d7", "Insulin (Regular) — كل الأدوية", "/drug/insulin-regular"),
    e("icu_medications", "icu4", "الأنسولين — العناية المركزة", "/drugs/icu-medications/icu4"),
    e("er_medications", "er13", "Insuline — الطوارئ", "/drugs/er-medications/er13"),
  ],
  [
    e("drugs", "d11", "Amiodarone — كل الأدوية", "/drug/amiodarone"),
    e("icu_medications", "icu18", "أميودارون — العناية المركزة", "/drugs/icu-medications/icu18"),
  ],
  [
    e("icu_medications", "icu27", "فيتامين ك — العناية المركزة", "/drugs/icu-medications/icu27"),
    e("er_medications", "er17", "Vit K — الطوارئ", "/drugs/er-medications/er17"),
  ],
  [
    e("icu_medications", "icu23", "دكستروز 40% — العناية المركزة", "/drugs/icu-medications/icu23"),
    e("er_medications", "er9", "Dextrose 40% — الطوارئ", "/drugs/er-medications/er9"),
  ],
  [
    e("icu_medications", "icu22", "ديازيبام — العناية المركزة", "/drugs/icu-medications/icu22"),
    e("er_medications", "er8", "Valium (Diazepam) — الطوارئ", "/drugs/er-medications/er8"),
  ],
  [
    e("icu_medications", "icu19", "هيدروكورتيزون — العناية المركزة", "/drugs/icu-medications/icu19"),
    e("er_medications", "er5", "Hydrocortisone — الطوارئ", "/drugs/er-medications/er5"),
  ],
  [
    e("icu_medications", "icu20", "أمينوفيلين — العناية المركزة", "/drugs/icu-medications/icu20"),
    e("er_medications", "er6", "Aminophylline — الطوارئ", "/drugs/er-medications/er6"),
  ],
  [
    e("icu_medications", "icu28", "نيتروغليسرين — العناية المركزة", "/drugs/icu-medications/icu28"),
    e("er_medications", "er24", "Nitroglycerin — الطوارئ", "/drugs/er-medications/er24"),
  ],
  [
    e("icu_medications", "icu8", "مورفين — العناية المركزة", "/drugs/icu-medications/icu8"),
    e("er_medications", "er11", "Morphine — الطوارئ", "/drugs/er-medications/er11"),
  ],
  [
    e("icu_medications", "icu7", "بيثيدين — العناية المركزة", "/drugs/icu-medications/icu7"),
    e("er_medications", "er10", "Pethidine — الطوارئ", "/drugs/er-medications/er10"),
  ],
  [
    e("drugs", "d8", "Potassium Chloride (IV) — كل الأدوية", "/drug/potassium-chloride-iv"),
    e("icu_medications", "icu32", "البوتاسيوم (KCL) — العناية المركزة", "/drugs/icu-medications/icu32"),
  ],
];

export function findCrossRefs(table: CrossRefTable, id: string): CrossRefEntry[] {
  const group = CROSS_REF_GROUPS.find((g) => g.some((entry) => entry.table === table && entry.id === id));
  if (!group) return [];
  return group.filter((entry) => !(entry.table === table && entry.id === id));
}
