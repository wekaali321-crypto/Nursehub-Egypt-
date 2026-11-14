/**
 * Which teaching drawing (public/cards/art/<name>.svg, made by scripts/build-term-art.mjs) explains a medical term.
 * Matched on the English term / word part, first rule wins — specific words before roots, roots before short prefixes
 * ("Myocardial" → heart before "My-" → muscle; "Abdomen" → abdomen before "Ab-" → away).
 * A root also covers the words built on it: "Gastritis", "Gastroscopy" → stomach.
 */
/** Checked on the whole term first: names whose first word would point to the wrong drawing. */
const WHOLE: Array<[RegExp, string]> = [
  [/multiple sclerosis/, "body-brain"], [/polycystic kidney/, "body-kidneys"], [/(^|\W)cox-/, "body-hip"],
];

const RULES: Array<[RegExp, string]> = [
  // whole words / exceptions
  [/^abduction/, "move-abduction"], [/^adduction/, "move-adduction"],
  [/^suprarenal/, "body-adrenal"], [/^intercostal/, "body-ribs"], [/^infracostal/, "pos-below"],
  [/^hypoderm/, "body-skin"], [/^periodontal/, "body-mouthTeeth"], [/^intramuscular/, "body-muscle"],
  [/^hypotherm/, "idea-cold"], [/^hypertherm|^pyre|^pyr/, "idea-hot"], [/^cry/, "idea-cold"],
  [/^myocard|^cardi|^ventricul|^atri(al|um)/, "body-heart"],
  [/^cholelith|^chole|^cholecyst/, "body-gallbladder"],
  [/^ascites|^borborygm/, "body-abdomen"],
  // organ & body-part roots
  [/^(cephal|cerebr|cerebell|encephal|mening|nerv|neur)/, "body-brain"],
  [/^crani/, "body-skull"],
  [/^(ocul|ophthalm|phot|opt)/, "body-eye"],
  [/^(ot-|oti|oto|acou|-acusis|myring|tympan|aur)/, "body-ear"],
  [/^(nas|rhin)/, "body-nose"],
  [/^(gingiv|stomat|dent|odont)/, "body-mouthTeeth"],
  [/^(lingu|gloss|or-|oral)/, "body-mouth"],
  [/^faci/, "body-face"],
  [/^(spondyl|rhac|rach|vertebr)/, "body-spine"],
  [/^(oss|oste)/, "body-bones"],
  [/^(arthr|articul)/, "body-joint"],
  [/^cox/, "body-hip"],
  [/^cost/, "body-ribs"],
  [/^carp/, "body-wrist"],
  [/^(dactyl|digit)/, "body-fingers"],
  [/^(myring)/, "body-ear"],
  [/^(my-|myo|myal|muscul|sarco)/, "body-muscle"],
  [/^(derm|cutane|cutan)/, "body-skin"],
  [/^(adip|lip-|lipo)/, "body-fat"],
  [/^(angi|arteri|vaso|vas-|ven-|veno|phleb|thromb|aort)/, "body-vessels"],
  [/^(pneum|pulmon|bronch)/, "body-lungs"],
  [/^(laryng|pharyng)/, "body-throat"],
  [/^trache/, "body-trachea"],
  [/^pleur/, "body-pleura"],
  [/^(thorac|pector|steth)/, "body-chest"],
  [/^gastr/, "body-stomach"],
  [/^duoden/, "body-duodenum"],
  [/^enter/, "body-intestine"],
  [/^colp/, "body-uterus"],
  [/^(col-|colo|colon|colitis|colect)/, "body-colon"],
  [/^(rect|proct)/, "body-rectum"],
  [/^hepat/, "body-liver"],
  [/^(abdomin|lapar|viscer)/, "body-abdomen"],
  [/^splen/, "body-spleen"],
  [/^(nephr|ren-|renal)/, "body-kidneys"],
  [/^ureter/, "body-ureters"],
  [/^(ur-|urin|urethr|urolog|urolith|cyst|vesic)/, "body-bladder"],
  [/^(uter|hyster|metr|vagin)/, "body-uterus"],
  [/^(ovari|oophor)/, "body-ovaries"],
  [/^(mamm|mast)/, "body-breast"],
  [/^(umbilic|omphal)/, "body-umbilicus"],
  [/^(thyr|parathyr)/, "body-thyroid"],
  [/^adren/, "body-adrenal"],
  [/^pelv/, "body-pelvis"],
  // position prefixes
  [/^(supra|super)-/, "pos-above"], [/^epi-/, "pos-on"], [/^(sub|infra)-/, "pos-below"], [/^inter-/, "pos-between"],
  [/^(intra|endo)-/, "pos-inside"], [/^(ec|ect|ecto|exo|extra)-/, "pos-outside"], [/^(peri|circum)-/, "pos-around"],
  [/^para-/, "pos-beside"], [/^retro-/, "pos-behind"], [/^ab-/, "pos-away"], [/^ad-/, "pos-toward"], [/^(trans|dia)-/, "pos-through"],
  [/^(contra|anti)-/, "pos-against"], [/^mes-/, "pos-middle"],
  // quantity / speed / quality ideas (prefix and the words built on it)
  [/^(hyper|ultra)/, "idea-increase"], [/^hypo/, "idea-decrease"],
  [/^tachy/, "idea-fast"], [/^brady/, "idea-slow"],
  [/^(macro|megal|mega)/, "idea-big"], [/^micro/, "idea-small"],
  [/^(uni|mono)-/, "idea-one"], [/^(bi|di)-/, "idea-two"], [/^(poly|multi)/, "idea-many"], [/^(hemi|semi)/, "idea-half"],
  [/^an?-/, "idea-none"], [/^dys/, "idea-bad"], [/^homo/, "idea-same"], [/^hetero/, "idea-different"], [/^co-/, "idea-together"],
];

/** "/cards/art/body-heart.svg" for "Cardi-", "Cardiomegaly"…; null when nothing fits. */
export function termArt(term: string | null | undefined): string | null {
  if (!term) return null;
  const t = term.toLowerCase();
  for (const [re, name] of WHOLE) if (re.test(t)) return `/cards/art/${name}.svg`;
  const parts = t.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) for (const [re, name] of RULES) if (re.test(p)) return `/cards/art/${name}.svg`;
  return null;
}
