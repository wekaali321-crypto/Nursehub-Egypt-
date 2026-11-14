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
  nicu: {
    "nicu-fundamentals/f2": "nicu-temp-probe", "nicu-fundamentals/f4": "nicu-gestational-age", "nicu-fundamentals/f5": "nicu-birth-weight",
    "newborn-examination/ex1": "nicu-fontanelles", "nicu-intubation-ventilation/iv2": "nicu-ett-size", "nicu-vitals-thermoregulation/s3": "nicu-heat-loss",
    "nicu-basic-definitions-apgar/s3": "nicu-apgar", "nicu-fetal-circulation-adaptation/s1": "nicu-fetal-circulation",
    "nicu-fetal-circulation-adaptation/s5": "nicu-birth-transition", "nicu-central-lines-access/cl1": "nicu-umbilical-lines",
    "neonatal-cpr/cpr1": "nicu-bag-mask", "neonatal-cpr/cpr3": "nicu-two-thumb", "nicu-infection-control/s1": "dial-five-moments",
  },
  "operating-room": {
    "or-team-members": "or-team-layout", "sterile-field-maintenance": "or-sterile-field", "scrub-technique-steps": "or-scrub",
    "cssd-layout": "or-cssd-flow", "positioning-goals-common-types": "or-positions", "operating-table-parts": "or-table-parts",
    "scalpel-blade-handle-types": "or-scalpel", "surgical-needle-classification": "or-needles", "monopolar-vs-bipolar": "or-electrosurgery",
    "tourniquet-purpose-use": "or-tourniquet", "surgical-safety-checklist": "or-safety-checklist", "laparoscopic-principle": "or-laparoscopy",
    "anesthesia-types": "or-anesthesia-types", "wound-contamination-classification": "or-wound-classes", "wound-healing-stages": "or-wound-healing",
    "fire-triad-prevention": "or-fire-triad", "radiation-safety-principles": "or-radiation", "pneumatic-compression-device-use": "or-ipc",
    "ppe-hand-hygiene": "dial-five-moments",
  },
  "first-aid": {
    f2: "fa-drsabc", rc2: "fa-recovery-position", rc3: "fa-avpu", ca2: "icu-cpr", ca3: "icu-aed-pads", ci1: "fa-child-infant-cpr",
    ch1: "fa-choking", bc2: "fa-seep", bc3: "fa-pressure-points", bd2: "fa-burn-degrees", bd3: "icu-rule-of-nines", cs3: "fa-fast",
    sh2: "fa-shock-position", ni1: "fa-nosebleed", fr3: "fa-splint",
  },
  fundamentals: {
    "pressure-injury-causes-sites": "fun-pressure-sites", "body-positions": "anat-patient-positions", pulse: "anat-pulse-points",
    "intradermal-subcutaneous": "fun-injection-angles", "intramuscular-intravenous": "anat-im-deltoid-vastus", "iv-cannula-basics": "fun-cannula-sizes",
    "suture-removal-timing": "fun-suture-removal", "lumbar-puncture-procedure": "anat-lumbar-puncture", "oxygen-indications-delivery": "icu-oxygen-devices",
    "transfusion-indications-blood-groups": "fun-blood-groups", "urinary-catheterization": "anat-catheter", "ng-tube-basics": "icu-ngt-measure",
    "nursing-process-overview": "fun-adpie", "maslow-hierarchy-nursing": "fun-maslow", "hand-hygiene": "dial-five-moments",
    "isolation-precaution-types": "fun-isolation", "pain-types-assessment": "fun-pain-scale", "immobility-risks-rom-exercises": "anat-joint-movements",
  },
  obgyn: {
    "gestational-age-edd-estimation": "ob-fundal-height", "leopold-four-steps": "ob-leopold", "fetal-heart-tone-location": "ob-fetal-heart",
    "supine-hypotension-syndrome": "ob-supine-hypotension", "placenta-previa-features": "ob-placenta-previa", "abruptio-placentae-features": "ob-abruptio",
    "labor-stage-one": "ob-cervix-dilation", "labor-stages-two-three-four": "ob-labor-stages", "fhr-baseline-patterns": "ob-fhr-decels",
    "involution-lochia": "ob-involution", "umbilical-cord-prolapse": "ob-cord-prolapse", "pelvis-types-classification": "ob-pelvis-types",
    "fertilization-implantation": "ob-fertilization", "apgar-scoring": "nicu-apgar",
  },
};

/** `sectionArt` prop for TopicSectionDetail (keys: "<section id>" or, where ids repeat, "<topic id>/<section id>"). */
export const sectionArtFor = (dept: string) => (s: { id?: string }, _i?: number, topicId?: string) => {
  const map = SECTION_ART[dept];
  const name = s.id ? (topicId && map?.[`${topicId}/${s.id}`]) || map?.[s.id] : undefined;
  return name ? `/cards/art/${name}.svg` : null;
};
