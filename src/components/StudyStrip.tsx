import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDiseaseIndex, loadRead, pick, type DiseaseIndexItem } from "../lib/diseasesApi";
import { useI18n } from "../lib/i18n";
import { Flame, Zap, Layers, ClipboardCheck } from "lucide-react";
import EmojiIcon from "./EmojiIcon";
import { touchStreak } from "../lib/streak";

const path = (i: DiseaseIndexItem) => (!i.target || i.target === "diseases" ? `/diseases/${i.id}` : `/guide/${i.id}`);

export default function StudyStrip() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState<DiseaseIndexItem[] | null>(null);
  const [streak] = useState(touchStreak);
  const [read] = useState(loadRead);

  // Load the (static, cached) guide index only when this strip scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) {
        io.disconnect();
        fetchDiseaseIndex().then(setIdx).catch(() => setIdx([]));
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const total = idx?.length || 0;
  const done = idx ? read.filter((id) => idx.some((x) => x.id === id)).length : read.length;
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const day = Math.floor(Date.now() / 864e5);
  const daily = idx && idx.length ? idx[(day * 7919) % idx.length] : null;
  const lastId = read[read.length - 1];
  const last = idx?.find((x) => x.id === lastId) || null;
  const R = 26, C = 2 * Math.PI * R;

  return (
    <div ref={ref} className="mt-8 grid gap-3 text-start sm:grid-cols-3" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-white backdrop-blur">
        <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="7" />
          <circle cx="32" cy="32" r={R} fill="none" stroke="#5eead4" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
        </svg>
        <div>
          <div className="text-lg font-black">{done}{total ? <span className="text-sm font-bold text-slate-300"> / {total}</span> : null}</div>
          <div className="text-xs font-bold text-slate-300">{ar ? "دليل خلّصته من مشوارك" : "guides you've read"}</div>
        </div>
      </div>

      <Link to="/cards" className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/15">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#168C91]/40 text-amber-300"><Flame size={32} aria-hidden="true" /></div>
        <div>
          <div className="text-lg font-black">{streak} {ar ? (streak === 1 ? "يوم" : "أيام متتالية") : streak === 1 ? "day" : "days in a row"}</div>
          <div className="text-xs font-bold text-slate-300">{ar ? "راجع بطاقات النهارده وماتكسرش السلسلة ←" : "Review today's flashcards to keep it going →"}</div>
        </div>
      </Link>

      {daily || last ? (
        <Link to={path(daily || last!)} className="group flex items-center gap-3 rounded-2xl bg-[#168C91] p-3 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1aa0a6]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20"><EmojiIcon emoji={daily?.icon} fallback="🎯" size={30} /></div>
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-wide text-teal-50">{ar ? "تحدي النهارده" : "Today's challenge"}</div>
            <div className="line-clamp-2 text-sm font-black leading-5">{pick(daily?.title, ar)}</div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center justify-center rounded-2xl bg-white/20 p-3 text-sm font-bold text-white">{ar ? "تحدي النهارده جاي…" : "Today's challenge…"}</div>
      )}

      {/* Quick tools: always visible at the top of the home page (they are also in the menu). */}
      <div className="sm:col-span-3 grid grid-cols-3 gap-2">
        {[
          { to: "/shift", icon: <Zap size={20} aria-hidden="true" />, ar: "وضع الشيفت", en: "Shift mode", subAr: "أدوية وحاسبات بدون نت", subEn: "Drugs & calculators offline" },
          { to: "/cards", icon: <Layers size={20} aria-hidden="true" />, ar: "بطاقات المذاكرة", en: "Flashcards", subAr: "مصطلحات وأدوية", subEn: "Terms & drugs" },
          { to: "/tests/licensure", icon: <ClipboardCheck size={20} aria-hidden="true" />, ar: "محاكي الامتحان", en: "Exam simulator", subAr: "ترخيص وسفر", subEn: "Licensure & travel" },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/10 px-2 py-3 text-center text-white backdrop-blur transition hover:bg-white/20 sm:flex-row sm:gap-3 sm:text-start">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#168C91] text-white">{x.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5">{ar ? x.ar : x.en}</span>
              <span className="hidden text-xs font-semibold text-slate-300 sm:block">{ar ? x.subAr : x.subEn}</span>
            </span>
          </Link>
        ))}
      </div>

      {last && daily && last.id !== daily.id && (
        <Link to={path(last)} className="sm:col-span-3 flex items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25">
          <span className="min-w-0 truncate">▶ {ar ? "كمّل من حيث وقفت:" : "Continue:"} {pick(last.title, ar)}</span>
          <span>{ar ? "←" : "→"}</span>
        </Link>
      )}
    </div>
  );
}
