/**
 * Built-in teaching diagram per topic SECTION, per department (files: public/cards/art, made by scripts/build-*-art.mjs).
 * Only sections a picture really explains. Each one is the default of that section's image slot, so the admin can still
 * upload a better picture, hide it, or reset it (see EditableImage). Anatomy keeps its own map in AnatomyPage.
 * Keys are section ids inside the department's topics table (ids repeat across departments, so maps are per department).
 */
export const SECTION_ART: Record<string, Record<string, string>> = {
  dialysis: {
    f3: "dial-solute-forces", f4: "dial-water-forces", f6: "dial-toxin-sizes", m1: "dial-two-circuits", m2: "dial-blood-circuit",
    w2: "dial-pre-ro", w3: "dial-ro-post", av1: "dial-fistula", av4: "dial-fistula-check", g1: "dial-graft", g2: "dial-cvc",
    al2: "dial-pressures", cr2: "dial-crrt-types", kv1: "dial-ktv", kv3: "dial-urr", ht2: "dial-dry-weight", nc3: "dial-five-moments",
  },
  // ICU section ids repeat across topics, so keys are "<topic id>/<section id>"
  icu: {
    "icu-fundamentals/f3": "icu-care-levels", "icu-fundamentals/f8": "icu-monitor", "critical-neurology/n1": "icu-circle-of-willis",
    "critical-cardiology/c3": "icu-ecg-territories", "critical-cardiology/c26": "icu-chest-tube", "critical-cardiology/c27": "anat-heart-chambers",
    "acls-adult/a1": "icu-cpr", "acls-adult/a2": "icu-aed-pads", "acls-adult/aw16": "icu-sync-shock",
    "mechanical-ventilation/v16": "icu-vent-pressure-curve", "mechanical-ventilation/v17": "icu-oxygen-cascade", "mechanical-ventilation/v18": "icu-vent-circuit",
    "mechanical-ventilation/v22": "icu-ett", "mechanical-ventilation/v27": "icu-vent-modes", "burns-icu/b1": "icu-rule-of-nines",
    "delirium-cam-icu/d3": "icu-rass", "delirium-cam-icu/d4": "icu-cam-icu", "respiratory-system-critical/r7": "icu-oxygen-devices",
    "pressure-injury-staging/p3": "icu-pressure-stages", "iv-fluids-access/if2": "icu-drip-rate", "iv-fluids-access/if3": "anat-arm-veins",
    "icu-nursing-procedures/aw1": "icu-opa-npa", "icu-nursing-procedures/aw6": "icu-cvp", "icu-nursing-procedures/aw10": "icu-ngt-measure",
    "icu-nursing-procedures/aw12": "anat-catheter", "icu-nursing-procedures/aw22": "icu-ecg-leads", "traumatic-brain-injury/t5": "icu-icp",
    "ecmo-support/ecmo1": "icu-ecmo",
  },
};

/** `sectionArt` prop for TopicSectionDetail (keys: "<section id>" or, where ids repeat, "<topic id>/<section id>"). */
export const sectionArtFor = (dept: string) => (s: { id?: string }, _i?: number, topicId?: string) => {
  const map = SECTION_ART[dept];
  const name = s.id ? (topicId && map?.[`${topicId}/${s.id}`]) || map?.[s.id] : undefined;
  return name ? `/cards/art/${name}.svg` : null;
};
