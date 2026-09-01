import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchClinicalProtocols,
  loadProtocolProgress,
  saveProtocolProgress,
  resetProtocolProgress,
  type ClinicalProtocol,
} from "../lib/clinicalProtocolsApi";

function totalItemCount(p: ClinicalProtocol) {
  return p.phases.reduce((sum, ph) => sum + ph.items.length, 0);
}

function ProgressBar({ done, total, colorClass = "bg-teal-600" }: { done: number; total: number; colorClass?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
        <span>{done} من {total} خطوة</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ClinicalProtocolsHome() {
  const [protocols, setProtocols] = useState<ClinicalProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    fetchClinicalProtocols()
      .then((d) => {
        setProtocols(d);
        const pm: Record<string, Record<string, boolean>> = {};
        d.forEach((p) => { pm[p.id] = loadProtocolProgress(p.id); });
        setProgressMap(pm);
      })
      .catch(() => setProtocols([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-700 text-white p-6 mb-8">
        <h1 className="text-2xl font-bold mb-1">قوائم تحقق البروتوكولات الإكلينيكية</h1>
        <p className="opacity-90 text-sm">
          بروتوكولات تفاعلية خطوة بخطوة وفق المصادر العالمية — علّم على كل خطوة تنفّذها وتقدّمك يُحفظ تلقائيًا.
        </p>
      </div>

      {protocols.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد بروتوكولات متاحة حالياً.</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {protocols.map((p) => {
          const total = totalItemCount(p);
          const done = Object.values(progressMap[p.id] || {}).filter(Boolean).length;
          return (
            <Link
              key={p.id}
              to={`/drugs/protocols/${p.id}`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-sm transition p-5 block"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{p.name_ar}</div>
                  {p.name_en && <div className="text-xs text-slate-500 dark:text-slate-400">{p.name_en}</div>}
                </div>
              </div>
              {p.summary && <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{p.summary}</p>}
              <ProgressBar done={done} total={total} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ClinicalProtocolDetail() {
  const { id } = useParams();
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

  const total = useMemo(() => (protocol ? totalItemCount(protocol) : 0), [protocol]);
  const done = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);

  function toggleItem(itemId: string) {
    if (!protocol) return;
    const next = { ...progress, [itemId]: !progress[itemId] };
    setProgress(next);
    saveProtocolProgress(protocol.id, next);
  }

  function handleReset() {
    if (!protocol) return;
    if (!confirm("هل تريد إعادة تعيين تقدّمك في هذا البروتوكول؟")) return;
    resetProtocolProgress(protocol.id);
    setProgress({});
  }

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;
  if (!protocol) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">لم يتم العثور على البروتوكول.</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/drugs/protocols" className="text-teal-700 dark:text-teal-400 text-sm mb-4 inline-block">→ العودة لكل البروتوكولات</Link>

      {/* رأس البروتوكول */}
      <div className="rounded-2xl bg-gradient-to-l from-teal-600 to-cyan-700 text-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl">{protocol.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{protocol.name_ar}</h1>
            {protocol.name_en && <p className="text-sm opacity-90">{protocol.name_en}</p>}
          </div>
        </div>
        {protocol.summary && <p className="text-sm opacity-90 mt-2">{protocol.summary}</p>}
        {protocol.guideline_source && (
          <p className="text-xs opacity-75 mt-2">📚 {protocol.guideline_source}</p>
        )}
      </div>

      {/* شريط التقدم الكلي */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <ProgressBar done={done} total={total} />
        <button onClick={handleReset} className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 mt-2">إعادة تعيين التقدم</button>
      </div>

      {/* بطاقة القيم المرجعية السريعة */}
      {protocol.key_values && Object.keys(protocol.key_values).length > 0 && (
        <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-2xl p-4 mb-4">
          <div className="text-xs font-bold text-cyan-800 dark:text-cyan-400 mb-2">📌 قيم مرجعية سريعة</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(protocol.key_values).map(([k, v]) => (
              <div key={k} className="text-xs bg-white/70 dark:bg-slate-900/60 rounded-lg p-2">
                <div className="text-cyan-700 dark:text-cyan-400 font-semibold">{k.replace(/_/g, " ")}</div>
                <div className="text-slate-700 dark:text-slate-300">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* علامات تحذيرية — تنبيه أمان حقيقي، أحمر خافت مسموح استثناءً */}
      {protocol.red_flags && protocol.red_flags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 mb-6">
          <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">🚩 علامات تستدعي التصعيد الفوري</div>
          <ul className="space-y-1.5">
            {protocol.red_flags.map((flag, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-300 leading-relaxed flex gap-2">
                <span>•</span><span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* المراحل */}
      <div className="space-y-3">
        {protocol.phases.map((phase) => {
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
          ✅ أنجزت كل خطوات هذا البروتوكول
        </div>
      )}
    </div>
  );
}
