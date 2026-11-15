import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardCheck, History, Layers, Target } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { srsSummary } from "../lib/srs";
import { loadHistory, statsByBank } from "../lib/examHistory";
import { loadVisits } from "../lib/recentVisits";
import { cardClass, ButtonLink, SectionHeader } from "./ui";

/**
 * "My learning" on the dashboard: flashcards (due / learned / to practise), exam results and weak banks, recently opened
 * learning pages, and next steps. Everything comes from this device (localStorage) — no request, no D1 read or write.
 */
export default function LearningOverview() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const cards = useMemo(srsSummary, []);
  const banks = useMemo(() => statsByBank(), []);
  const attempts = useMemo(() => loadHistory().slice(0, 5), []);
  const visits = useMemo(loadVisits, []);
  const weak = banks.filter((b) => b.avg < 60).slice(0, 3);
  const dateFmt = (t: number) => new Date(t).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short" });

  const next: { to: string; text: string }[] = [];
  if (cards.due > 0) next.push({ to: "/cards", text: ar ? `راجع ${cards.due} بطاقة مستحقة النهارده` : `Review ${cards.due} due flashcards today` });
  for (const w of weak) next.push({ to: w.path, text: ar ? `تدرّب تاني على «${w.title}» (متوسطك ${w.avg}%)` : `Practise “${w.title}” again (average ${w.avg}%)` });
  if (visits[0]) next.push({ to: visits[0].path, text: ar ? `كمّل: ${visits[0].title}` : `Continue: ${visits[0].title}` });
  if (next.length === 0) next.push({ to: "/cards", text: ar ? "ابدأ أول جلسة بطاقات مذاكرة" : "Start your first flashcard session" }, { to: "/tests/licensure", text: ar ? "جرّب محاكي الامتحان" : "Try the exam simulator" });

  const stat = (n: number | string, label: string) => (
    <div className="rounded-xl bg-nh-surface p-3 text-center dark:bg-slate-800">
      <div className="text-2xl font-black text-nh-navy dark:text-white">{n}</div>
      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  );

  return (
    <section aria-labelledby="my-learning" className="mb-8">
      <SectionHeader id="my-learning" title={ar ? "مذاكرتي" : "My learning"} subtitle={ar ? "محفوظة على الجهاز ده" : "Saved on this device"} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cardClass(false, "p-5")}>
          <h3 className="mb-3 flex items-center gap-2 font-black text-nh-navy dark:text-white"><Layers size={18} className="text-nh-teal" aria-hidden="true" />{ar ? "بطاقات المذاكرة" : "Flashcards"}</h3>
          <div className="grid grid-cols-3 gap-2">{stat(cards.due, ar ? "مستحقة" : "Due")}{stat(cards.learned, ar ? "اتعلمتها" : "Learned")}{stat(cards.learning, ar ? "محتاجة تمرين" : "Practising")}</div>
          <ButtonLink to="/cards" size="sm" className="mt-4 w-full">{cards.due > 0 ? (ar ? "راجع دلوقتي" : "Review now") : (ar ? "افتح البطاقات" : "Open flashcards")}</ButtonLink>
        </div>

        <div className={cardClass(false, "p-5")}>
          <h3 className="mb-3 flex items-center gap-2 font-black text-nh-navy dark:text-white"><ClipboardCheck size={18} className="text-nh-teal" aria-hidden="true" />{ar ? "الامتحانات" : "Exams"}</h3>
          {attempts.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{ar ? "لسه ما امتحنتش على الجهاز ده." : "No exam taken on this device yet."}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {attempts.map((a) => (
                <li key={`${a.key}-${a.date}`} className="flex items-center justify-between gap-2">
                  <Link to={a.path} className="min-w-0 truncate font-semibold text-nh-navy hover:underline dark:text-slate-100">{a.title}</Link>
                  <span className={`shrink-0 font-black ${a.correct / a.total >= 0.6 ? "text-nh-success" : "text-nh-danger"}`}>{Math.round((a.correct / a.total) * 100)}%</span>
                  <span className="shrink-0 text-xs text-slate-500">{dateFmt(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
          {weak.length > 0 && <p className="mt-3 text-xs font-bold text-nh-danger">{ar ? "محتاج تركيز: " : "Needs focus: "}{weak.map((w) => w.title).join("، ")}</p>}
        </div>

        <div className={cardClass(false, "p-5")}>
          <h3 className="mb-3 flex items-center gap-2 font-black text-nh-navy dark:text-white"><History size={18} className="text-nh-teal" aria-hidden="true" />{ar ? "فتحتها مؤخرًا" : "Recently opened"}</h3>
          {visits.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{ar ? "الصفحات اللي هتذاكرها هتظهر هنا." : "Pages you study will show here."}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {visits.slice(0, 5).map((v) => (
                <li key={v.path}><Link to={v.path} className="flex items-center gap-2 font-semibold text-nh-navy hover:underline dark:text-slate-100"><BookOpen size={14} className="shrink-0 text-nh-teal" aria-hidden="true" /><span className="truncate">{v.title}</span></Link></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={cardClass(false, "mt-4 p-5")}>
        <h3 className="mb-3 flex items-center gap-2 font-black text-nh-navy dark:text-white"><Target size={18} className="text-nh-teal" aria-hidden="true" />{ar ? "الخطوة الجاية" : "Next steps"}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {next.slice(0, 4).map((n) => (
            <li key={n.to + n.text}><Link to={n.to} className="block rounded-xl bg-nh-teal-soft px-3 py-2.5 text-sm font-bold text-nh-teal-dark hover:underline dark:bg-teal-500/10 dark:text-teal-300">{n.text}</Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
