// ربط يدوي صريح (زي drugCrossRef.ts بالظبط) بين أدوية دليل الأدوية الرئيسية
// (drugs / icu_medications / er_medications) وبين المراجع الجديدة: تعديل
// الجرعات الكلوية/الكبدية، أمان الحمل والرضاعة، وتوافق الأدوية الوريدية.
// مفيش مطابقة تلقائية بالاسم عشان نضمن دقة الربط الإكلينيكي 100%.

export type DrugSourceTable = "drugs" | "icu_medications" | "er_medications";
export type SafetyRefType = "renal" | "hepatic" | "pregnancy" | "iv";

interface SafetyLinkTarget {
  table: DrugSourceTable;
  id: string;
}

interface SafetyLinkEntry {
  refType: SafetyRefType;
  label: string; // نص مختصر لعرضه في البادچ
  searchTerm: string; // نص مضمون إنه موجود في drug_name بالصفحة الهدف عشان رابط البحث يشتغل صح
  drugs: SafetyLinkTarget[];
}

const SAFETY_LINKS: SafetyLinkEntry[] = [
  // ===== تعديل الجرعات الكلوية =====
  { refType: "renal", label: "ميتفورمين", searchTerm: "Metformin", drugs: [{ table: "drugs", id: "d4" }, { table: "drugs", id: "pd218" }] },
  { refType: "renal", label: "ديجوكسين", searchTerm: "Digoxin", drugs: [{ table: "drugs", id: "d9" }, { table: "drugs", id: "pd91" }] },
  { refType: "renal", label: "أمينوغليكوزيدات", searchTerm: "Gentamicin", drugs: [{ table: "drugs", id: "pd210" }, { table: "drugs", id: "pd132" }] },
  { refType: "renal", label: "فانكومايسين", searchTerm: "Vancomycin", drugs: [{ table: "icu_medications", id: "icu43" }, { table: "icu_medications", id: "icu44" }] },
  { refType: "renal", label: "إينوكسابارين", searchTerm: "Enoxaparin", drugs: [{ table: "icu_medications", id: "icu2" }] },
  { refType: "renal", label: "NSAIDs", searchTerm: "NSAIDs", drugs: [{ table: "drugs", id: "pd81" }, { table: "drugs", id: "pd82" }, { table: "drugs", id: "pd149" }, { table: "drugs", id: "pd150" }, { table: "er_medications", id: "er1" }] },
  { refType: "renal", label: "ACEI/ARB", searchTerm: "ACEI/ARB", drugs: [{ table: "drugs", id: "d13" }, { table: "drugs", id: "pd28" }, { table: "drugs", id: "pd88" }, { table: "drugs", id: "pd117" }, { table: "drugs", id: "pd245" }] },
  { refType: "renal", label: "ألوبيورينول", searchTerm: "Allopurinol", drugs: [{ table: "drugs", id: "pd184" }] },
  { refType: "renal", label: "المورفين", searchTerm: "Morphine", drugs: [{ table: "icu_medications", id: "icu8" }, { table: "er_medications", id: "er11" }] },
  { refType: "renal", label: "غابابنتين/بريغابالين", searchTerm: "Gabapentin", drugs: [{ table: "drugs", id: "pd166" }, { table: "drugs", id: "pd167" }] },
  { refType: "renal", label: "أتينولول", searchTerm: "Atenolol", drugs: [{ table: "drugs", id: "d12" }, { table: "drugs", id: "pd164" }] },
  { refType: "renal", label: "سبيرونولاكتون", searchTerm: "Spironolactone", drugs: [{ table: "drugs", id: "pd57" }] },
  { refType: "renal", label: "كوتريموكسازول", searchTerm: "Co-trimoxazole", drugs: [{ table: "drugs", id: "pd270" }] },
  { refType: "renal", label: "أسيكلوفير", searchTerm: "Acyclovir", drugs: [{ table: "drugs", id: "pd87" }] },

  // ===== تعديل الجرعات الكبدية =====
  { refType: "hepatic", label: "باراسيتامول", searchTerm: "Paracetamol", drugs: [{ table: "drugs", id: "d1" }, { table: "drugs", id: "pd145" }] },
  { refType: "hepatic", label: "وارفارين", searchTerm: "Warfarin", drugs: [{ table: "drugs", id: "d10" }] },
  { refType: "hepatic", label: "ستاتينات", searchTerm: "Statin", drugs: [{ table: "drugs", id: "d15" }, { table: "drugs", id: "pd2" }, { table: "drugs", id: "pd102" }, { table: "drugs", id: "pd71" }, { table: "drugs", id: "pds20" }] },
  { refType: "hepatic", label: "فينيتوين", searchTerm: "Phenytoin", drugs: [{ table: "drugs", id: "d24" }] },
  { refType: "hepatic", label: "ديازيبام", searchTerm: "Diazepam", drugs: [{ table: "drugs", id: "d23" }, { table: "icu_medications", id: "icu22" }, { table: "er_medications", id: "er8" }, { table: "drugs", id: "pd197" }] },
  { refType: "hepatic", label: "فالبرويك", searchTerm: "Valproate", drugs: [{ table: "icu_medications", id: "icu48" }, { table: "drugs", id: "pd196" }] },
  { refType: "hepatic", label: "ميترونيدازول", searchTerm: "Metronidazole", drugs: [{ table: "drugs", id: "pd199" }] },
  { refType: "hepatic", label: "أميودارون", searchTerm: "Amiodarone", drugs: [{ table: "drugs", id: "d11" }, { table: "icu_medications", id: "icu18" }, { table: "drugs", id: "pd99" }] },
  { refType: "hepatic", label: "مضادات فطريات آزولية", searchTerm: "Fluconazole", drugs: [{ table: "drugs", id: "pd202" }] },
  { refType: "hepatic", label: "المورفين", searchTerm: "Morphine", drugs: [{ table: "icu_medications", id: "icu8" }, { table: "er_medications", id: "er11" }] },
  { refType: "hepatic", label: "بروبرانولول/لابيتالول", searchTerm: "Propranolol", drugs: [{ table: "drugs", id: "pd137" }] },
  { refType: "hepatic", label: "لابيتالول", searchTerm: "Labetalol", drugs: [{ table: "icu_medications", id: "icu59" }] },
  { refType: "hepatic", label: "الإريثرومايسين", searchTerm: "Erythromycin", drugs: [{ table: "drugs", id: "pd129" }] },

  // ===== أمان الحمل والرضاعة =====
  { refType: "pregnancy", label: "باراسيتامول", searchTerm: "Paracetamol", drugs: [{ table: "drugs", id: "d1" }, { table: "drugs", id: "pd145" }] },
  { refType: "pregnancy", label: "الأسبرين", searchTerm: "Aspirin", drugs: [{ table: "drugs", id: "pd248" }] },
  { refType: "pregnancy", label: "NSAIDs", searchTerm: "NSAIDs", drugs: [{ table: "drugs", id: "pd81" }, { table: "drugs", id: "pd82" }, { table: "drugs", id: "pd149" }, { table: "drugs", id: "pd150" }, { table: "er_medications", id: "er1" }] },
  { refType: "pregnancy", label: "المورفين وشبيهاته", searchTerm: "Morphine", drugs: [{ table: "icu_medications", id: "icu7" }, { table: "icu_medications", id: "icu8" }, { table: "icu_medications", id: "icu9" }, { table: "er_medications", id: "er10" }, { table: "er_medications", id: "er11" }, { table: "er_medications", id: "er12" }, { table: "drugs", id: "pd116" }] },
  { refType: "pregnancy", label: "أموكسيسيلين", searchTerm: "Amoxicillin", drugs: [{ table: "drugs", id: "d5" }, { table: "drugs", id: "pd14" }, { table: "drugs", id: "pd15" }] },
  { refType: "pregnancy", label: "تتراسيكلين", searchTerm: "Tetracycline", drugs: [{ table: "drugs", id: "pd37" }, { table: "drugs", id: "pd172" }] },
  { refType: "pregnancy", label: "الجنتاميسين", searchTerm: "Gentamicin", drugs: [{ table: "drugs", id: "pd210" }] },
  { refType: "pregnancy", label: "الوارفارين", searchTerm: "Warfarin", drugs: [{ table: "drugs", id: "d10" }] },
  { refType: "pregnancy", label: "الهيبارين", searchTerm: "Heparin", drugs: [{ table: "drugs", id: "d2" }, { table: "icu_medications", id: "icu1" }, { table: "er_medications", id: "er23" }, { table: "icu_medications", id: "icu2" }] },
  { refType: "pregnancy", label: "ACEI/ARB", searchTerm: "ACEI/ARB", drugs: [{ table: "drugs", id: "d13" }, { table: "drugs", id: "pd28" }, { table: "drugs", id: "pd88" }, { table: "drugs", id: "pd117" }, { table: "drugs", id: "pd245" }] },
  { refType: "pregnancy", label: "ميثيل دوبا", searchTerm: "Methyldopa", drugs: [{ table: "drugs", id: "pd175" }] },
  { refType: "pregnancy", label: "لابيتالول", searchTerm: "Labetalol", drugs: [{ table: "icu_medications", id: "icu59" }] },
  { refType: "pregnancy", label: "فالبرويك", searchTerm: "Valproate", drugs: [{ table: "icu_medications", id: "icu48" }, { table: "drugs", id: "pd196" }] },
  { refType: "pregnancy", label: "ليفيتيراسيتام", searchTerm: "Levetiracetam", drugs: [{ table: "icu_medications", id: "icu47" }] },
  { refType: "pregnancy", label: "الإنسولين", searchTerm: "Insulin", drugs: [{ table: "drugs", id: "d7" }, { table: "icu_medications", id: "icu4" }, { table: "er_medications", id: "er13" }] },
  { refType: "pregnancy", label: "الميتفورمين", searchTerm: "Metformin", drugs: [{ table: "drugs", id: "d4" }, { table: "drugs", id: "pd218" }] },
  { refType: "pregnancy", label: "أوندانسيترون", searchTerm: "Ondansetron", drugs: [{ table: "drugs", id: "d25" }, { table: "drugs", id: "pd176" }] },
  { refType: "pregnancy", label: "المغنيسيوم كبريتات", searchTerm: "Magnesium", drugs: [{ table: "icu_medications", id: "icu33" }] },
  { refType: "pregnancy", label: "SSRIs", searchTerm: "Sertraline", drugs: [{ table: "drugs", id: "pd4" }] },
  { refType: "pregnancy", label: "SSRIs", searchTerm: "Fluoxetine", drugs: [{ table: "drugs", id: "pd49" }] },

  // ===== توافق الأدوية الوريدية =====
  { refType: "iv", label: "فينيتوين + دكستروز", searchTerm: "فينيتوين", drugs: [{ table: "drugs", id: "d24" }] },
  { refType: "iv", label: "فينيتوين + دكستروز", searchTerm: "دكستروز", drugs: [{ table: "icu_medications", id: "icu23" }, { table: "er_medications", id: "er9" }] },
  { refType: "iv", label: "كالسيوم + بيكربونات", searchTerm: "الكالسيوم", drugs: [{ table: "icu_medications", id: "icu31" }] },
  { refType: "iv", label: "كالسيوم + بيكربونات", searchTerm: "بيكربونات", drugs: [{ table: "icu_medications", id: "icu29" }] },
  { refType: "iv", label: "فوروسيميد + ميدازولام", searchTerm: "فوروسيميد", drugs: [{ table: "drugs", id: "d3" }, { table: "icu_medications", id: "icu21" }, { table: "er_medications", id: "er7" }] },
  { refType: "iv", label: "فوروسيميد + ميدازولام", searchTerm: "ميدازولام", drugs: [{ table: "icu_medications", id: "icu30" }] },
  { refType: "iv", label: "ديازيبام", searchTerm: "ديازيبام", drugs: [{ table: "drugs", id: "d23" }, { table: "icu_medications", id: "icu22" }, { table: "er_medications", id: "er8" }, { table: "drugs", id: "pd197" }] },
  { refType: "iv", label: "دوبامين/دوبيوتامين + بيكربونات", searchTerm: "الدوبامين", drugs: [{ table: "icu_medications", id: "icu16" }, { table: "er_medications", id: "er21" }, { table: "icu_medications", id: "icu17" }, { table: "er_medications", id: "er22" }] },
  { refType: "iv", label: "سيفترياكسون + كالسيوم", searchTerm: "سيفترياكسون", drugs: [{ table: "drugs", id: "d19" }, { table: "drugs", id: "pd193" }] },
  { refType: "iv", label: "هيبارين + جنتاميسين", searchTerm: "الهيبارين", drugs: [{ table: "drugs", id: "d2" }, { table: "icu_medications", id: "icu1" }, { table: "er_medications", id: "er23" }] },
  { refType: "iv", label: "فانكومايسين + هيبارين/بيبراسيلين", searchTerm: "فانكومايسين", drugs: [{ table: "icu_medications", id: "icu43" }, { table: "icu_medications", id: "icu44" }] },
  { refType: "iv", label: "بيبراسيلين/تازوباكتام", searchTerm: "بيبراسيلين", drugs: [{ table: "icu_medications", id: "icu41" }] },
  { refType: "iv", label: "نورأدرينالين + فازوبريسين/دوبيوتامين", searchTerm: "نورأدرينالين", drugs: [{ table: "icu_medications", id: "icu15" }, { table: "er_medications", id: "er20" }] },
  { refType: "iv", label: "فازوبريسين", searchTerm: "فازوبريسين", drugs: [{ table: "icu_medications", id: "icu54" }] },
  { refType: "iv", label: "فنتانيل + ميدازولام", searchTerm: "فنتانيل", drugs: [{ table: "icu_medications", id: "icu10" }] },
  { refType: "iv", label: "إنسولين + بوتاسيوم/دكستروز", searchTerm: "الإنسولين", drugs: [{ table: "drugs", id: "d7" }, { table: "icu_medications", id: "icu4" }, { table: "er_medications", id: "er13" }] },
  { refType: "iv", label: "بوتاسيوم كلوريد", searchTerm: "بوتاسيوم", drugs: [{ table: "icu_medications", id: "icu32" }, { table: "drugs", id: "d8" }] },
  { refType: "iv", label: "بروبوفول", searchTerm: "بروبوفول", drugs: [{ table: "icu_medications", id: "icu11" }] },
];

export interface SafetyLink {
  refType: SafetyRefType;
  label: string;
  to: string;
}

const REF_META: Record<SafetyRefType, { path: string; icon: string; title: string }> = {
  renal: { path: "/drugs/organ-dose", icon: "🫘", title: "تعديل جرعة كلوي" },
  hepatic: { path: "/drugs/organ-dose", icon: "🫀", title: "تعديل جرعة كبدي" },
  pregnancy: { path: "/drugs/pregnancy-lactation", icon: "🤰", title: "أمان الحمل والرضاعة" },
  iv: { path: "/drugs/iv-compatibility", icon: "🧫", title: "توافق أدوية وريدية" },
};

export function findSafetyLinks(table: DrugSourceTable, id: string): SafetyLink[] {
  return SAFETY_LINKS.filter((e) => e.drugs.some((d) => d.table === table && d.id === id)).map((e) => {
    const meta = REF_META[e.refType];
    const params = new URLSearchParams({ q: e.searchTerm });
    if (e.refType === "hepatic") params.set("tab", "hepatic");
    return {
      refType: e.refType,
      label: meta.title,
      to: `${meta.path}?${params.toString()}`,
    };
  });
}
