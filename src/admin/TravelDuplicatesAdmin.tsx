// src/admin/TravelDuplicatesAdmin.tsx
// One-time cleanup screen: lists the reviewed redundant duplicate travel questions and deletes
// the selected ones in one click. Route: /admin/travel-duplicates
import { useEffect, useMemo, useState } from 'react';
import { fetchTravelQuestions, deleteTravelQuestions, type TravelQuestion } from '../lib/travelQuestionsApi';
import { TRAVEL_DUPLICATE_IDS } from './travelDuplicateIds';

export function TravelDuplicatesAdmin() {
  const [rows, setRows] = useState<TravelQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchTravelQuestions();
        const wanted = new Set(TRAVEL_DUPLICATE_IDS);
        const found = all.filter((q) => wanted.has(q.id));
        setRows(found);
        setSelected(new Set(found.map((q) => q.id)));
      } catch (e) {
        setMsg('تعذر تحميل الأسئلة: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const count = selected.size;
  const allChecked = useMemo(() => rows.length > 0 && count === rows.length, [rows, count]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const removeSelected = async () => {
    if (!count || busy) return;
    if (!window.confirm(`سيتم حذف ${count} سؤال مكرر نهائيًا. متأكد؟`)) return;
    setBusy(true);
    setMsg('');
    try {
      const ids = [...selected];
      for (let i = 0; i < ids.length; i += 50) await deleteTravelQuestions(ids.slice(i, i + 50));
      setRows((r) => r.filter((q) => !selected.has(q.id)));
      setSelected(new Set());
      setMsg(`✅ تم حذف ${ids.length} سؤال مكرر.`);
    } catch (e) {
      setMsg('❌ فشل الحذف: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6" dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 mb-2">حذف الأسئلة المكررة (أسئلة السفر)</h1>
      <p className="text-sm text-slate-500 mb-4">
        قائمة بالأسئلة المكررة التي تمت مراجعتها (النسخة الأفضل من كل سؤال تبقى). أزل علامة أي سؤال لا تريد حذفه ثم اضغط حذف.
      </p>
      {loading ? (
        <p>جاري التحميل…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 p-4 text-emerald-700">لا توجد أسئلة مكررة متبقية ✅</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((q) => q.id)))}
              />
              تحديد الكل ({rows.length})
            </label>
            <button
              onClick={removeSelected}
              disabled={!count || busy}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? 'جاري الحذف…' : `حذف المحدد (${count})`}
            </button>
          </div>
          <ul className="space-y-2">
            {rows.map((q) => (
              <li key={q.id} className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} />
                <div className="min-w-0">
                  <div className="text-xs text-slate-400" dir="ltr">{q.id}</div>
                  <div className="line-clamp-2 text-slate-700" dir="ltr">{q.question_en}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {msg && <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">{msg}</p>}
    </div>
  );
}
