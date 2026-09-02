import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchClinicalProtocols,
  loadProtocolProgress,
  saveProtocolProgress,
  resetProtocolProgress,
  type ClinicalProtocol,
  type ProtocolPhase,
} from "../lib/clinicalProtocolsApi";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const LABELS = {
  loading: { ar: "جارِ التحميل...", en: "Loading..." },
  notFound: { ar: "لم يتم العثور على البروتوكول.", en: "Protocol not found." },
  back: { ar: "→ العودة للمهارات", en: "→ Back to Skills" },
  stepsOf: { ar: "خطوة", en: "steps" },
  resetProgress: { ar: "إعادة تعيين التقدم", en: "Reset progress" },
  resetConfirm: { ar: "هل تريد إعادة تعيين تقدّمك في هذا البروتوكول؟", en: "Reset your progress on this protocol?" },
  quickReference: { ar: "📌 قيم مرجعية سريعة", en: "📌 Quick Reference Values" },
  redFlagsTitle: { ar: "🚩 علامات تستدعي التصعيد الفوري", en: "🚩 Signs Requiring Immediate Escalation" },
  completed: { ar: "✅ أنجزت كل خطوات هذا البروتوكول", en: "✅ You have completed all steps of this protocol" },
};

function totalItemCount(phases: ProtocolPhase[]) {
  return phases.reduce((sum, ph) => sum + ph.items.length, 0);
}

function ProgressBar({ done, total, lang, colorClass = "bg-teal-600" }: { done: number; total: number; lang: "ar" | "en"; colorClass?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
        <span>{lang === "ar" ? `${done} من ${total} ${LABELS.stepsOf.ar}` : `${done} of ${total} ${LABELS.stepsOf.en}`}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ClinicalProtocolDetail() {
  const { id } = useParams();
  const { lang } = useI18n();
  const [protocol, setProtocol] = useState<ClinicalProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [openPhase, setOpenPhase] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchClinicalProtocols()
      .then((all) => {
        const p = all.find((x) => x.id === id) || null;
        setProtocol(p);
        if (p) {
          setProgress(loadProtocolProgress(p.id));
          setOpenPhase(p.phases[0]?.id ?? null);
        }
      })
      .catch(() => setProtocol(null))
      .finally(() => setLoading(false));
  }, [id]);

  const phases = useMemo(() => {
    if (!protocol) return [];
    return lang === "en" && protocol.phases_en && protocol.phases_en.length > 0 ? protocol.phases_en : protocol.phases;
  }, [protocol, lang]);

  const total = useMemo(() => totalItemCount(phases), [phases]);
  const done = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);

  function toggleItem(itemId: string) {
    if (!protocol) return;
    const next = { ...progress, [itemId]: !progress[itemId] };
    setProgress(next);
    saveProtocolProgress(protocol.id, next);
  }

  function handleReset() {
    if (!protocol) return;
    if (!confirm(LABELS.resetConfirm[lang])) return;
    resetProtocolProgress(protocol.id);
    setProgress({});
  }

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.loading[lang]}</div>;
  if (!protocol) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.notFound[lang]}</div>;

  const title = lang === "en" && protocol.name_en ? protocol.name_en : protocol.name_ar;
  const subtitle = lang === "en" ? protocol.name_ar : protocol.name_en;
  const summary = bilingual(protocol.summary, protocol.summary_en, lang).text;
  const guidelineSource = bilingual(protocol.guideline_source, protocol.guideline_source_en, lang).text;
  const redFlags = lang === "en" && protocol.red_flags_en && protocol.red_flags_en.length > 0 ? protocol.red_flags_en : protocol.red_flags;
  const keyValues = lang === "en" && protocol.key_values_en && Object.keys(protocol.key_values_en).length > 0 ? protocol.key_values_en : protocol.key_values;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link to="/category/skills" className="text-teal-700 dark:text-teal-400 text-sm inline-block">{LABELS.back[lang]}</Link>
        <InlineLangToggle />
      </div>

      {/* رأس البروتوكول */}
      <div className="rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-700 text-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl">{protocol.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
          </div>
        </div>
        {summary && <p className="text-sm opacity-90 mt-2">{summary}</p>}
        {guidelineSource && (
          <p className="text-xs opacity-75 mt-2">📚 {guidelineSource}</p>
        )}
      </div>

      {/* شريط التقدم الكلي */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <ProgressBar done={done} total={total} lang={lang} />
        <button onClick={handleReset} className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 mt-2">{LABELS.resetProgress[lang]}</button>
      </div>

      {/* بطاقة القيم المرجعية السريعة */}
      {keyValues && Object.keys(keyValues).length > 0 && (
        <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-2xl p-4 mb-4">
          <div className="text-xs font-bold text-cyan-800 dark:text-cyan-400 mb-2">{LABELS.quickReference[lang]}</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(keyValues).map(([k, v]) => (
              <div key={k} className="text-xs bg-white/70 dark:bg-slate-900/60 rounded-lg p-2">
                <div className="text-cyan-700 dark:text-cyan-400 font-semibold">{k.replace(/_/g, " ")}</div>
                <div className="text-slate-700 dark:text-slate-300">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* علامات تحذيرية — تنبيه أمان حقيقي، أحمر خافت مسموح استثناءً */}
      {redFlags && redFlags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 mb-6">
          <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">{LABELS.redFlagsTitle[lang]}</div>
          <ul className="space-y-1.5">
            {redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-300 leading-relaxed flex gap-2">
                <span>•</span><span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* المراحل */}
      <div className="space-y-3">
        {phases.map((phase) => {
          const phaseDone = phase.items.filter((it) => progress[it.id]).length;
          const isOpen = openPhase === phase.id;
          return (
            <div key={phase.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.id)}
                className="w-full flex items-center justify-between p-4 text-right"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{phase.icon}</span>
                  <span className="font-bold text-slate-800 dark:text-white">{phase.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{phaseDone}/{phase.items.length}</span>
                  <span className="text-slate-400 dark:text-slate-500">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                  {phase.items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${
                        item.critical
                          ? "bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20"
                          : "bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                      } ${progress[item.id] ? "opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={!!progress[item.id]}
                        onChange={() => toggleItem(item.id)}
                        className="mt-1 w-4 h-4 accent-teal-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className={`text-sm text-slate-800 dark:text-slate-100 ${progress[item.id] ? "line-through" : ""}`}>
                          {item.critical && <span className="text-red-600 dark:text-red-400 font-bold ml-1">⚠ </span>}
                          {item.text}
                        </div>
                        {item.detail && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.detail}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done === total && total > 0 && (
        <div className="mt-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-center p-4 font-bold">
          {LABELS.completed[lang]}
        </div>
      )}
    </div>
  );
}
