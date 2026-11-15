/**
 * Free oral exam: which choice did the learner SAY? (speech-to-text output, Arabic or English, Egyptian wording)
 *  - a letter or an order: "B", "بي", "الإجابة ب", "التانية", "second", "رقم 3"
 *  - or the words of the answer itself, compared with every choice (English and Arabic text)
 * Returns the choice index, or -1 when it is not clear (then Ali asks again / the learner taps).
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "") // harakat, tatweel
    .replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// spoken forms of letters / positions → index
const ORDER: [RegExp, number][] = [
  [/^(a|ay|eh|اي|ايه|إيه|ا|الف|اول|الاول|الاولي|الاوله|first|one|1|واحد)$/, 0],
  [/^(b|bee|be|بي|ب|باء|تاني|التاني|التانيه|الثاني|الثانيه|second|two|2|اتنين|اثنين)$/, 1],
  [/^(c|see|sea|سي|ج|جيم|تالت|التالت|التالته|الثالث|الثالثه|third|three|3|تلاته|ثلاثه)$/, 2],
  [/^(d|dee|دي|د|دال|رابع|الرابع|الرابعه|fourth|four|for|4|اربعه)$/, 3],
  [/^(e|ee|اي|ه|هاء|خامس|الخامس|الخامسه|fifth|five|5|خمسه)$/, 4],
];
const LEAD = [/^(the |my )?(answer is|answer|choice|option|letter|number|it s|its|it is|i think|i choose) ?/, /^(الاجابه|الاختيار|اختيار|اجابه|رقم|حرف|انا اختار|انا|اختار|هي|هو|اظن|بصراحه) ?/];

export function letterOf(spoken: string, n: number): number {
  let s = normalize(spoken);
  for (let k = 0; k < 3; k++) for (const re of LEAD) s = s.replace(re, "").trim();
  // a lone letter / position ("B", "التانية", "second one"); a longer sentence is matched by its words instead
  const ws = s.split(" ");
  const first = ws.length <= 2 ? ws : [];
  for (const w of [s, ...first]) {
    for (const [re, i] of ORDER) if (i < n && re.test(w)) return i;
  }
  return -1;
}

const STOP = new Set("the a an of to in on for and or is are be with by at as it this that from his her their patient nurse should which most first ال في من علي على الي إلى عن و او أو هو هي ده دي اللي التي الذي مع".split(" "));
const words = (s: string) => normalize(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map((w) => w.replace(/^ال(?=..)/, ""));

/** Overlap score of the spoken words with one choice (0..1, share of the choice's words that were said). */
export function overlap(spoken: string, choice: string): number {
  const said = new Set(words(spoken));
  const want = words(choice);
  if (!want.length) return 0;
  let hit = 0;
  for (const w of want) if (said.has(w) || [...said].some((x) => x.length > 3 && (x.startsWith(w.slice(0, 4)) || w.startsWith(x.slice(0, 4))))) hit++;
  return hit / want.length;
}

export function matchChoice(spoken: string, choices: string[][]): number {
  const n = choices.length;
  if (!normalize(spoken)) return -1;
  const byLetter = letterOf(spoken, n);
  if (byLetter >= 0) return byLetter;
  // best choice by its words (each choice may have several language versions)
  const scores = choices.map((versions) => Math.max(...versions.filter(Boolean).map((v) => overlap(spoken, v))));
  const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
  const [best, second] = order;
  if (best[0] >= 0.5 && best[0] - (second?.[0] ?? 0) >= 0.2) return best[1];
  return -1;
}
