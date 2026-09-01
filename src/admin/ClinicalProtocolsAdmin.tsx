import { useEffect, useState } from "react";
import {
  fetchClinicalProtocols,
  upsertClinicalProtocol,
  deleteClinicalProtocol,
  type ClinicalProtocol,
  type ProtocolPhase,
  type ProtocolItem,
} from "../lib/clinicalProtocolsApi";

const EMPTY: ClinicalProtocol = {
  id: "",
  order_num: 0,
  name_ar: "",
  name_en: "",
  category: "",
  icon: "📋",
  summary: "",
  guideline_source: "",
  red_flags: [],
  key_values: {},
  phases: [],
};

let itemCounter = 0;
function newItemId() { itemCounter += 1; return `new_i${Date.now()}_${itemCounter}`; }
function newPhaseId() { itemCounter += 1; return `new_p${Date.now()}_${itemCounter}`; }

const inp = "border border-slate-200 rounded-lg p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export default function ClinicalProtocolsAdmin() {
  const [items, setItems] = useState<ClinicalProtocol[]>([]);
  const [editing, setEditing] = useState<ClinicalProtocol | null>(null);
  const [redFlagsText, setRedFlagsText] = useState("");
  const [keyValuesRows, setKeyValuesRows] = useState<{ key: string; value: string }[]>([]);
  const [phases, setPhases] = useState<ProtocolPhase[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchClinicalProtocols().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startEdit(p: ClinicalProtocol | null) {
    const target = p ? { ...p } : { ...EMPTY };
    setEditing(target);
    setRedFlagsText((target.red_flags || []).join("\n"));
    setKeyValuesRows(
      target.key_values ? Object.entries(target.key_values).map(([key, value]) => ({ key, value })) : []
    );
    setPhases(target.phases ? target.phases.map((ph) => ({ ...ph, items: ph.items.map((it) => ({ ...it })) })) : []);
  }

  function addPhase() {
    setPhases([...phases, { id: newPhaseId(), title: "", icon: "📌", items: [] }]);
  }

  function updatePhase(idx: number, patch: Partial<ProtocolPhase>) {
    const next = [...phases]; next[idx] = { ...next[idx], ...patch }; setPhases(next);
  }

  function removePhase(idx: number) {
    setPhases(phases.filter((_, i) => i !== idx));
  }

  function addItem(phaseIdx: number) {
    const next = [...phases];
    next[phaseIdx] = { ...next[phaseIdx], items: [...next[phaseIdx].items, { id: newItemId(), text: "", detail: "", critical: false }] };
    setPhases(next);
  }

  function updateItem(phaseIdx: number, itemIdx: number, patch: Partial<ProtocolItem>) {
    const next = [...phases];
    const items = [...next[phaseIdx].items];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    next[phaseIdx] = { ...next[phaseIdx], items };
    setPhases(next);
  }

  function removeItem(phaseIdx: number, itemIdx: number) {
    const next = [...phases];
    next[phaseIdx] = { ...next[phaseIdx], items: next[phaseIdx].items.filter((_, i) => i !== itemIdx) };
    setPhases(next);
  }

  async function save() {
    if (!editing) return;
    if (!editing.id.trim() || !editing.name_ar.trim()) {
      alert("لازم تحدد المعرف (id) واسم البروتوكول على الأقل.");
      return;
    }
    const red_flags = redFlagsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const key_values = keyValuesRows.filter((r) => r.key.trim())
      .reduce((acc, r) => ({ ...acc, [r.key.trim()]: r.value }), {} as Record<string, string>);
    await upsertClinicalProtocol({
      ...editing,
      red_flags,
      key_values,
      phases: phases.map((ph) => ({ ...ph, items: ph.items.filter((it) => it.text.trim()) })).filter((ph) => ph.title.trim()),
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    await deleteClinicalProtocol(id);
    load();
  }

  if (loading) return <div className="p-8 dark:text-slate-300">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-white">إدارة البروتوكولات الإكلينيكية ({items.length})</h1>
        <button onClick={() => startEdit(null)} className="bg-teal-600 text-white rounded-lg px-4 py-2">+ إضافة بروتوكول</button>
      </div>

      {!editing && (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <div className="font-semibold dark:text-white">{p.icon} {p.name_ar}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{p.phases.length} مرحلة</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="text-teal-700 dark:text-teal-400 text-sm">تعديل</button>
                <button onClick={() => remove(p.id)} className="text-red-500 text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="id (فريد، إنجليزي)" value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })} className={inp} />
            <input type="number" placeholder="الترتيب" value={editing.order_num}
              onChange={(e) => setEditing({ ...editing, order_num: Number(e.target.value) })} className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم البروتوكول بالعربي" value={editing.name_ar}
              onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} className={inp} />
            <input placeholder="بالإنجليزي (اختياري)" value={editing.name_en || ""}
              onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} className={inp} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <input placeholder="التصنيف" value={editing.category || ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inp} />
            <input placeholder="أيقونة (إيموجي)" value={editing.icon || ""}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className={inp} />
            <input placeholder="مصدر الإرشادات" value={editing.guideline_source || ""}
              onChange={(e) => setEditing({ ...editing, guideline_source: e.target.value })} className={inp} />
          </div>

          <textarea placeholder="ملخص قصير" value={editing.summary || ""}
            onChange={(e) => setEditing({ ...editing, summary: e.target.value })} className={`${inp} w-full`} rows={2} />

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">القيم المرجعية السريعة (مفتاح / قيمة)</div>
            {keyValuesRows.map((r, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="المفتاح" value={r.key} onChange={(e) => {
                  const next = [...keyValuesRows]; next[i] = { ...next[i], key: e.target.value }; setKeyValuesRows(next);
                }} className={`${inp} w-40`} />
                <input placeholder="القيمة" value={r.value} onChange={(e) => {
                  const next = [...keyValuesRows]; next[i] = { ...next[i], value: e.target.value }; setKeyValuesRows(next);
                }} className={`${inp} flex-1`} />
                <button onClick={() => setKeyValuesRows(keyValuesRows.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
              </div>
            ))}
            <button onClick={() => setKeyValuesRows([...keyValuesRows, { key: "", value: "" }])} className="text-teal-700 dark:text-teal-400 text-sm">+ إضافة قيمة</button>
          </div>

          <div>
            <div className="font-semibold mb-1 text-sm dark:text-white">العلامات التحذيرية (سطر لكل علامة)</div>
            <textarea value={redFlagsText} onChange={(e) => setRedFlagsText(e.target.value)}
              className={`${inp} w-full`} rows={4} />
          </div>

          <div>
            <div className="font-bold mb-2 dark:text-white">المراحل والخطوات</div>
            {phases.map((phase, pIdx) => (
              <div key={phase.id} className="border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 mb-3">
                <div className="flex gap-2 mb-2">
                  <input placeholder="أيقونة" value={phase.icon || ""} onChange={(e) => updatePhase(pIdx, { icon: e.target.value })}
                    className={`${inp} w-16`} />
                  <input placeholder="عنوان المرحلة" value={phase.title} onChange={(e) => updatePhase(pIdx, { title: e.target.value })}
                    className={`${inp} flex-1`} />
                  <button onClick={() => removePhase(pIdx)} className="text-red-500 text-sm">حذف المرحلة</button>
                </div>

                <div className="space-y-2 pr-4">
                  {phase.items.map((item, iIdx) => (
                    <div key={item.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 space-y-1">
                      <input placeholder="نص الخطوة" value={item.text}
                        onChange={(e) => updateItem(pIdx, iIdx, { text: e.target.value })}
                        className={`${inp} w-full`} />
                      <input placeholder="تفصيل إضافي (اختياري)" value={item.detail || ""}
                        onChange={(e) => updateItem(pIdx, iIdx, { detail: e.target.value })}
                        className={`${inp} w-full`} />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1 text-xs dark:text-slate-300">
                          <input type="checkbox" checked={!!item.critical}
                            onChange={(e) => updateItem(pIdx, iIdx, { critical: e.target.checked })} />
                          خطوة حرجة (تُبرز بالأحمر)
                        </label>
                        <button onClick={() => removeItem(pIdx, iIdx)} className="text-red-500 text-xs">حذف الخطوة</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addItem(pIdx)} className="text-teal-700 dark:text-teal-400 text-xs">+ إضافة خطوة</button>
                </div>
              </div>
            ))}
            <button onClick={addPhase} className="bg-slate-100 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 text-sm">+ إضافة مرحلة جديدة</button>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button onClick={save} className="bg-teal-600 text-white rounded-lg px-5 py-2">حفظ</button>
            <button onClick={() => setEditing(null)} className="bg-slate-100 dark:bg-slate-800 dark:text-white rounded-lg px-5 py-2">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
