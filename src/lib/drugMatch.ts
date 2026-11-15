/** Finding drug names in a text (articles, topics) — pure function, tested in tests/d1/drugMatch.test.mjs. */
export type Row = [slug: string, ar: string, en: string, generic: string, highAlert: 0 | 1];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type Hit = { kind: "brand"; row: Row } | { kind: "generic"; name: string; highAlert: boolean };

/** Brand names link to that product's page; an active ingredient mentioned on its own (e.g. "Paracetamol", shared by
 *  several brands) is listed once, by its own name, and links to the search results — never to one arbitrary brand. */
export function matchDrugs(text: string, rows: Row[], limit = 8): Hit[] {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  const lower = plain.toLowerCase();
  const found = (n: string) => n.length >= 5 && (/[a-z]/i.test(n) ? new RegExp(`(^|[^a-z])${esc(n.toLowerCase())}([^a-z]|$)`).test(lower) : plain.includes(n));
  const out: Hit[] = [];
  const generics = new Map<string, boolean>();
  for (const r of rows) {
    const brand = [r[2], r[1]].map((x) => x.trim());
    const generic = r[3].split(/[+(/,]/)[0].trim();
    if (brand.some((b) => b.toLowerCase() !== generic.toLowerCase() && found(b))) {
      if (out.length < limit) out.push({ kind: "brand", row: r });
    } else if (found(generic)) {
      const k = generic.toLowerCase();
      generics.set(k, (generics.get(k) ?? false) || !!r[4]);
      if (!out.some((h) => h.kind === "generic" && h.name.toLowerCase() === k) && out.length < limit) out.push({ kind: "generic", name: generic, highAlert: !!r[4] });
    }
  }
  // a product page named exactly like the ingredient (e.g. "Paracetamol") wins over the ingredient entry: one link, not two
  const brandNames = new Set(out.flatMap((h) => (h.kind === "brand" ? [h.row[1], h.row[2]].map((x) => x.trim().toLowerCase()) : [])));
  return out
    .filter((h) => h.kind === "brand" || !brandNames.has(h.name.toLowerCase()))
    .map((h) => (h.kind === "generic" ? { ...h, highAlert: generics.get(h.name.toLowerCase()) ?? h.highAlert } : h));
}

