import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookA, ChevronRight, Flame, Layers, Pill, RotateCcw, Shuffle, Target } from "lucide-react";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { loadOfflineJson } from "../lib/offlineFile";
import { parseTermBody } from "../components/TermBody";
import { buildSession, DAILY_GOAL, deckStats, doneToday, rate, type Rating } from "../lib/srs";
import { touchStreak } from "../lib/streak";
import { termArt } from "../lib/termArt";
import EditableImage from "../components/EditableImage";

/**
 * Flashcards with spaced repetition (/cards). Decks are built in the browser from static files (no D1 / Supabase):
 * medical terms + abbreviations from /data/terminology_topics.json (same parser as the Terminology section), drugs from
 * /shift/drugs-lite.json, look-alike names from /data/lasa_pairs.json. Progress, daily goal and streak stay on the device.
 */

type Card = { id: string; front: string; frontSub?: string; back: string; backSub?: string; ltrFront?: boolean; art?: string | null };
type DeckId = "terms" | "abbr" | "drugs" | "lasa";
type Deck = { id: DeckId; title: string; titleEn: string; icon: typeof Pill; cards: Card[] };

type TermTopic = { id: string; sections: Array<{ id: string; body_ar?: string; body_en?: string }> | string };
type LiteDrug = { s: string; n?: string; ne?: string; c?: string; ce?: string; d?: string; de?: string };
type Lasa = { id: string; drug_a: string; drug_b: string; tall_man_a?: string; tall_man_b?: string; notes?: string; notes_en?: string };

const clip = (s = "", n = 260) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);

function buildDecks(terms: TermTopic[], drugs: LiteDrug[], lasa: Lasa[]): Deck[] {
  const t: Card[] = [], a: Card[] = [];
  const seen = new Set<string>();
  for (const topic of terms) {
    const secs = typeof topic.sections === "string" ? (() => { try { return JSON.parse(topic.sections as string); } catch { return []; } })() : topic.sections;
    for (const sec of secs ?? []) {
      for (const it of parseTermBody(sec.body_ar || "")) {
        if (it.k === "term" && it.en && it.ar) {
          const key = (it.abbr || it.en).toLowerCase();
          if (seen.has(key)) continue; seen.add(key);
          const card: Card = { id: `t:${topic.id}:${key}`, front: it.abbr || it.en, frontSub: it.abbr ? it.en : undefined, back: it.ar, backSub: clip(it.def, 220), ltrFront: true, art: it.abbr ? null : termArt(it.en) };
          (it.abbr ? a : t).push(card);
        } else if (it.k === "chips") {
          for (const p of it.pairs) {
            const key = p.en.toLowerCase();
            if (!p.en || !p.ar || seen.has(key)) continue; seen.add(key);
            t.push({ id: `t:${topic.id}:${key}`, front: p.en, back: p.ar, backSub: it.label, ltrFront: true, art: termArt(p.en) });
          }
        }
      }
    }
  }
  const d: Card[] = drugs.filter((x) => (x.ne || x.n) && (x.c || x.ce) && (x.d || x.de)).map((x) => ({
    id: `d:${x.s}`, front: x.ne || x.n || "", frontSub: x.n && x.n !== x.ne ? x.n : undefined, back: x.c || x.ce || "", backSub: clip(x.d || x.de, 240), ltrFront: true,
  }));
  const l: Card[] = lasa.map((x) => ({ id: `l:${x.id}`, front: x.tall_man_a || x.drug_a, frontSub: "≠ ?", back: x.tall_man_b || x.drug_b, backSub: x.notes, ltrFront: true }));
  return [
    { id: "terms", title: "المصطلحات الطبية", titleEn: "Medical terms", icon: BookA, cards: t },
    { id: "abbr", title: "الاختصارات الطبية", titleEn: "Abbreviations", icon: Layers, cards: a },
    { id: "drugs", title: "الأدوية: الفئة والجرعة", titleEn: "Drugs: class & dose", icon: Pill, cards: d },
    { id: "lasa", title: "أسماء أدوية متشابهة", titleEn: "Look-alike drug names", icon: Shuffle, cards: l },
  ].filter((x) => x.cards.length > 0) as Deck[];
}

export default function CardsPage() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  useSEO({ title: `${ar ? "بطاقات المذاكرة" : "Flashcards"} | NurseHub Egypt`, description: "بطاقات مذاكرة بالتكرار المتباعد: مصطلحات، اختصارات، أدوية — بتفتكر اللي بتغلط فيه أكتر." });
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<Deck | null>(null);
  const [tick, setTick] = useState(0); // refresh stats after a session
  const [streak] = useState(touchStreak);

  useEffect(() => {
    Promise.all([
      loadOfflineJson<TermTopic[]>("/data/terminology_topics.json", "cards_terms_v1"),
      loadOfflineJson<{ drugs: LiteDrug[] }>("/shift/drugs-lite.json", "shift_drugs_v1"),
      loadOfflineJson<Lasa[]>("/data/lasa_pairs.json", "shift_lasa_v1"),
    ]).then(([t, d, l]) => setDecks(buildDecks(t.data, d.data.drugs, l.data))).catch(() => setFailed(true));
  }, []);

  if (active) return <Session deck={active} ar={ar} onExit={() => { setActive(null); setTick((x) => x + 1); }} />;

  const done = doneToday();
  void tick;
  return (
    <div className="pb-12">
      <section className="nh-hero text-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <h1 className="text-2xl font-black sm:text-3xl">{ar ? "بطاقات المذاكرة" : "Flashcards"}</h1>
          <p className="mt-1.5 text-sm text-teal-50 sm:text-base">{ar ? "البطاقة اللي بتغلط فيها بترجعلك أكتر، واللي بتعرفها بتبعد — 10 دقايق في اليوم تكفي." : "Cards you miss come back sooner, the ones you know drift away — 10 minutes a day is enough."}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3"><Flame size={26} className="text-amber-300" aria-hidden="true" /><div><div className="text-lg font-black">{streak}</div><div className="text-[11px] font-bold text-teal-50">{ar ? "أيام متتالية" : "day streak"}</div></div></div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3"><Target size={26} className="text-emerald-300" aria-hidden="true" /><div><div className="text-lg font-black tabular-nums">{Math.min(done, DAILY_GOAL)}/{DAILY_GOAL}</div><div className="text-[11px] font-bold text-teal-50">{ar ? "هدف النهارده" : "today's goal"}</div></div></div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 pt-5">
        {failed && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{ar ? "محتاج نت أول مرة عشان نجهّز البطاقات." : "Needs a connection once to prepare the cards."}</p>}
        {!decks && !failed && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {decks?.map((d) => {
            const st = deckStats(d.cards.map((c) => c.id));
            const pct = Math.round((st.known / st.total) * 100);
            return (
              <button key={d.id} onClick={() => setActive(d)} className="rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-nh-teal/10 text-nh-teal-dark dark:text-teal-300"><d.icon size={24} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-nh-navy dark:text-white">{ar ? d.title : d.titleEn}</div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{st.total} {ar ? "بطاقة" : "cards"} · {ar ? "حافظ" : "known"} {st.known}{st.due ? ` · ${ar ? "مستحق" : "due"} ${st.due}` : ""}</div>
                  </div>
                  {st.due > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white">{st.due}</span>}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(2, pct)}%` }} /></div>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] text-slate-500">{ar ? "تقدّمك محفوظ على الجهاز ده بس." : "Your progress is saved on this device only."}</p>
      </div>
    </div>
  );
}

function Session({ deck, ar, onExit }: { deck: Deck; ar: boolean; onExit: () => void }) {
  const byId = useMemo(() => new Map(deck.cards.map((c) => [c.id, c])), [deck]);
  const [queue, setQueue] = useState<string[]>(() => buildSession(deck.cards.map((c) => c.id)).queue);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const card = queue[0] ? byId.get(queue[0]) : undefined;

  const answer = useCallback((r: Rating) => {
    if (!card) return;
    rate(card.id, r);
    setReviewed((n) => n + 1);
    setFlipped(false);
    // "again": see it once more later in this session
    setQueue((q) => (r === "again" ? [...q.slice(1, 4), q[0], ...q.slice(4)] : q.slice(1)));
  }, [card]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && e.key === "1") answer("again");
      else if (flipped && e.key === "2") answer("hard");
      else if (flipped && e.key === "3") answer("good");
      else if (flipped && e.key === "4") answer("easy");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [flipped, answer]);

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button onClick={onExit} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-black text-nh-teal-dark dark:text-teal-300"><ChevronRight size={18} aria-hidden="true" />{ar ? "البطاقات" : "Decks"}</button>
        <span className="text-sm font-black text-nh-navy dark:text-white">{ar ? deck.title : deck.titleEn}</span>
        <span className="text-xs font-bold tabular-nums text-slate-500">{reviewed} ✓ · {queue.length} {ar ? "باقي" : "left"}</span>
      </div>

      {!card ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="text-2xl font-black text-nh-navy dark:text-white">{ar ? "خلصت بطاقات النهارده" : "Done for today"}</div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{ar ? `راجعت ${reviewed} بطاقة. البطاقات هترجعلك في ميعادها.` : `You reviewed ${reviewed} cards. They'll come back when due.`}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={onExit} className="min-h-12 rounded-full bg-nh-teal px-6 font-black text-white hover:bg-nh-teal-dark">{ar ? "رجوع للبطاقات" : "Back to decks"}</button>
            <Link to="/" className="inline-flex min-h-12 items-center rounded-full border border-slate-200 px-5 font-black text-nh-navy dark:border-slate-700 dark:text-white">{ar ? "الرئيسية" : "Home"}</Link>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => setFlipped((f) => !f)} aria-label={ar ? "اقلب البطاقة" : "Flip card"}
            className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border p-6 text-center shadow-sm ${flipped ? "border-nh-teal bg-white dark:bg-slate-900" : "nh-hero border-transparent text-white"}`}>
            {!flipped ? (
              <>
                <div className="text-3xl font-black leading-tight" dir={card.ltrFront ? "ltr" : "auto"}>{card.front}</div>
                {card.frontSub && <div className="mt-2 text-base font-bold text-teal-50" dir="auto">{card.frontSub}</div>}
                <div className="mt-8 inline-flex items-center gap-1.5 text-xs font-bold text-teal-50/80"><RotateCcw size={14} aria-hidden="true" />{ar ? "دوس عشان تشوف الإجابة" : "Tap to reveal"}</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-500" dir={card.ltrFront ? "ltr" : "auto"}>{card.front}</div>
                {card.art && <EditableImage key={card.art} slot={`art:${card.art.split("/").pop()!.replace(".svg", "")}`} src={card.art} label={card.front} emptyHint={false} render={(u) => <img src={u} alt="" decoding="async" className="mt-3 h-36 w-auto max-w-full rounded-2xl bg-white object-contain p-2 ring-1 ring-slate-200 dark:ring-slate-700" />} />}
                <div className="mt-2 text-2xl font-black leading-snug text-nh-navy dark:text-white" dir="auto">{card.back}</div>
                {card.backSub && <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300" dir="auto">{card.backSub}</div>}
              </>
            )}
          </button>
          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button onClick={() => answer("again")} className="min-h-14 rounded-2xl bg-red-600 font-black text-white hover:bg-red-700">{ar ? "مش فاكر" : "Again"}<span className="block text-[10px] font-bold opacity-80">{ar ? "تاني دلوقتي" : "now"}</span></button>
              <button onClick={() => answer("hard")} className="min-h-14 rounded-2xl bg-amber-500 font-black text-white hover:bg-amber-600">{ar ? "صعب" : "Hard"}<span className="block text-[10px] font-bold opacity-80">{ar ? "بكرة" : "tomorrow"}</span></button>
              <button onClick={() => answer("good")} className="min-h-14 rounded-2xl bg-nh-teal-dark font-black text-white hover:bg-nh-teal-darker">{ar ? "فاكر" : "Good"}<span className="block text-[10px] font-bold opacity-80">{ar ? "بعد أيام" : "in days"}</span></button>
              <button onClick={() => answer("easy")} className="min-h-14 rounded-2xl bg-emerald-600 font-black text-white hover:bg-emerald-700">{ar ? "سهل" : "Easy"}<span className="block text-[10px] font-bold opacity-80">{ar ? "بعد مدة أطول" : "much later"}</span></button>
            </div>
          ) : (
            <button onClick={() => setFlipped(true)} className="mt-4 min-h-14 w-full rounded-2xl bg-nh-navy font-black text-white">{ar ? "اعرض الإجابة" : "Show answer"}</button>
          )}
        </>
      )}
    </div>
  );
}
