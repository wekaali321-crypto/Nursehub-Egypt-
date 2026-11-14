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
};

/** `sectionArt` prop for TopicSectionDetail. */
export const sectionArtFor = (dept: string) => (s: { id?: string }) => {
  const name = s.id ? SECTION_ART[dept]?.[s.id] : undefined;
  return name ? `/cards/art/${name}.svg` : null;
};
