/**
 * Sound-alike matching for drug names typed in Arabic letters or with small spelling mistakes:
 * "باراسيتامول" ≈ "Paracetamol", "كتافلام" ≈ "Cataflam", "اموكسيسيلين" ≈ "Amoxicillin", "ceftriaxon" ≈ "Ceftriaxone".
 * Both scripts are reduced to the same consonant skeleton (Egyptian pronunciation: ج = g, p = b, v = f, soft c = s),
 * vowels and doubled letters dropped. Dictionary-free, a few microseconds per name.
 */
const AR: Record<string, string> = {
  "ب": "b", "پ": "b", "ت": "t", "ث": "s", "ج": "g", "ح": "h", "خ": "k", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s",
  "ش": "s", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "غ": "g", "ف": "f", "ڤ": "f", "ق": "k", "ك": "k", "گ": "g", "ل": "l",
  "م": "m", "ن": "n", "ه": "h",
};

export function phoneticKey(input: string): string {
  let s = (input || "").toLowerCase();
  if (/[؀-ۿ]/.test(s)) {
    s = [...s].map((ch) => AR[ch] ?? (/[a-z]/.test(ch) ? ch : "")).join("");
  } else {
    s = s
      .replace(/[^a-z]/g, "")
      .replace(/ph/g, "f").replace(/th/g, "t").replace(/ch/g, "k").replace(/sh/g, "s").replace(/ck/g, "k")
      .replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/q/g, "k").replace(/x/g, "ks")
      .replace(/p/g, "b").replace(/v/g, "f").replace(/j/g, "g").replace(/w/g, "");
  }
  // z and s are one sound class: "Lasix" is said and written "لازكس", "Omeprazole" "أوميبرازول"
  return s.replace(/z/g, "s").replace(/[aeiouy]/g, "").replace(/h(?=[^aeiou]|$)/g, (m, i) => (i === 0 ? m : "")).replace(/(.)\1+/g, "$1");
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/**
 * 0 = no match; higher = better. `queryKey` = phoneticKey(query) (compute once), `keys` = phonetic keys of a candidate's names.
 * Needs at least 3 consonants so short queries do not match everything.
 */
export function phoneticScore(queryKey: string, keys: string[]): number {
  if (queryKey.length < 3) return 0;
  let best = 0;
  for (const k of keys) {
    if (!k) continue;
    if (k === queryKey) return 100;
    if (k.startsWith(queryKey)) best = Math.max(best, 80);
    else if (queryKey.length >= 5) {
      // typo tolerance only for longer names: 4-consonant keys are too ambiguous (bndl ≈ bnzl)
      const head = k.slice(0, queryKey.length);
      const d = Math.min(lev(queryKey, head), lev(queryKey, k));
      if (d <= (queryKey.length >= 7 ? 2 : 1)) best = Math.max(best, 60 - d * 10);
    }
  }
  return best;
}

/** Keys for a drug's names: each full name and its first word ("Diclofenac potassium" → also "Diclofenac"). */
export function drugPhoneticKeys(names: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const n of names) {
    if (!n) continue;
    out.add(phoneticKey(n));
    const first = n.trim().split(/[\s(/,-]+/)[0];
    if (first && first !== n) out.add(phoneticKey(first));
  }
  out.delete("");
  return [...out];
}
