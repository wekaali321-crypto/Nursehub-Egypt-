import { useMemo, useState } from "react";

/** Splits at the first separator that is outside parentheses. */
function splitTop(s: string, sep: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "（") depth++;
    else if (c === ")" || c === "）") depth = Math.max(0, depth - 1);
    else if (depth === 0 && s.startsWith(sep, i)) return [s.slice(0, i), s.slice(i + sep.length)];
  }
  return null;
}
function splitAllTop(s: string, sep: string): string[] {
  const out: string[] = [];
  let rest = s;
  for (;;) {
    const p = splitTop(rest, sep);
    if (!p) break;
    out.push(p[0]);
    rest = p[1];
  }
  out.push(rest);
  return out.map((x) => x.trim()).filter(Boolean);
}
const latinRatio = (s: string) => {
  const l = (s.match(/[A-Za-z]/g) || []).length;
  const a = (s.match(/[؀-ۿ]/g) || []).length;
  return l + a === 0 ? 0 : l / (l + a);
};
/** "Neutropenia (قلة العدلات)" -> {en, ar} */
function enAr(head: string): { en: string; ar: string } {
  head = head.trim().replace(/[.。]+$/, "");
  const m = head.match(/^(.*?)\s*[(（]([^()（）]*)[)）]\s*$/);
  return m ? { en: m[1].trim(), ar: m[2].trim() } : { en: head.trim(), ar: "" };
}

type Item =
  | { k: "term"; abbr?: string; en: string; ar: string; def: string }
  | { k: "chips"; label: string; pairs: { en: string; ar: string }[] }
  | { k: "note"; head: string; text: string }
  | { k: "p"; text: string };

function parse(body: string): Item[] {
  const out: Item[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^[-•*]\s+/.test(line);
    const s = line.replace(/^[-•*]\s+/, "");
    if (!bullet) { out.push({ k: "p", text: s }); continue; }
    const c = splitTop(s, ": ");
    const head = (c ? c[0] : s).trim();
    const rest = (c ? c[1] : "").trim();
    // list of word pairs: "Label: A (x) — B (y) — C (z)"
    const parts = splitAllTop(rest, " — ");
    if (parts.length >= 3 && parts.every((x) => /[(（]/.test(x)) && latinRatio(parts[0]) > 0.4) {
      out.push({ k: "chips", label: head, pairs: parts.map(enAr) });
      continue;
    }
    // abbreviation: "T — Temperature (درجة الحرارة)"
    const ab = splitTop(head, " — ");
    if (ab && /^[A-Za-z0-9/.\-&+ ]{1,14}$/.test(ab[0].trim()) && latinRatio(enAr(ab[1]).en) > 0.5) {
      const e = enAr(ab[1]);
      out.push({ k: "term", abbr: ab[0].trim(), en: e.en, ar: e.ar, def: rest });
      continue;
    }
    if (latinRatio(enAr(head).en) > 0.5 && head.length < 90) {
      const e = enAr(head);
      out.push({ k: "term", en: e.en, ar: e.ar, def: rest });
      continue;
    }
    out.push({ k: "note", head, text: rest });
  }
  return out;
}

const ltr = { direction: "ltr" as const, unicodeBidi: "isolate" as const };

export default function TermBody({ body, isEn }: { body: string; isEn: boolean }) {
  const items = useMemo(() => parse(body || ""), [body]);
  const [hide, setHide] = useState(false);
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [q, setQ] = useState("");
  const terms = items.filter((i) => i.k === "term" || i.k === "chips").length;
  const ql = q.trim().toLowerCase();
  const match = (i: Item) => {
    if (!ql) return true;
    return JSON.stringify(i).toLowerCase().includes(ql);
  };
  if (terms === 0) return <div className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{body}</div>;

  return (
    <div>
      {terms >= 6 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isEn ? "Search in this section…" : "ابحث في هذا القسم…"}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={() => { setHide((h) => !h); setShown({}); }}
            className={`rounded-xl px-3 py-2 text-xs font-black transition ${hide ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"}`}
          >
            {hide ? (isEn ? "🙈 Study mode ON" : "🙈 وضع المذاكرة شغال") : (isEn ? "🎯 Test yourself" : "🎯 اختبر نفسك (إخفاء المعاني)")}
          </button>
        </div>
      )}
      <div className="space-y-2.5">
        {items.map((it, idx) => {
          if (!match(it)) return null;
          if (it.k === "p") return <p key={idx} className="text-sm leading-7 text-slate-600 dark:text-slate-300">{it.text}</p>;
          if (it.k === "note")
            return (
              <div key={idx} className="rounded-xl border-r-4 border-amber-400 bg-amber-50/70 p-3 text-sm leading-7 dark:bg-amber-500/10">
                <b className="text-amber-800 dark:text-amber-300">{it.head}</b>
                {it.text && <span className="text-slate-700 dark:text-slate-300"> — {it.text}</span>}
              </div>
            );
          if (it.k === "chips")
            return (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 text-xs font-black text-violet-700 dark:text-violet-300">{it.label}</div>
                <div className="flex flex-wrap gap-2">
                  {it.pairs.map((p, j) => {
                    const key = idx * 1000 + j;
                    const covered = hide && !shown[key];
                    return (
                      <button key={j} onClick={() => setShown((s) => ({ ...s, [key]: !s[key] }))}
                        className="rounded-xl border border-violet-100 bg-white px-3 py-1.5 text-center shadow-sm transition active:scale-95 dark:border-violet-500/20 dark:bg-slate-900">
                        <div className="text-sm font-black text-slate-800 dark:text-white" style={ltr}>{p.en}</div>
                        <div className={`text-xs text-violet-700 transition dark:text-violet-300 ${covered ? "select-none blur-sm" : ""}`}>{p.ar}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          const covered = hide && !shown[idx];
          return (
            <div key={idx} onClick={() => hide && setShown((s) => ({ ...s, [idx]: !s[idx] }))}
              className={`flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${hide ? "cursor-pointer" : ""}`}>
              {it.abbr && (
                <div className="flex h-12 min-w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 px-2 text-base font-black text-white shadow" style={ltr}>
                  {it.abbr}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`font-black ${it.abbr ? "text-slate-700 dark:text-slate-200" : "text-violet-700 dark:text-violet-300"} text-[15px]`} style={ltr}>{it.en}</span>
                  {it.ar && <span className={`rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700 transition dark:bg-violet-500/15 dark:text-violet-200 ${covered ? "select-none blur-sm" : ""}`}>{it.ar}</span>}
                </div>
                {it.def && <p className={`mt-1 text-[13px] leading-6 text-slate-600 transition dark:text-slate-400 ${covered ? "select-none blur-sm" : ""}`}>{it.def}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
