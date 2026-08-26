import { useState } from "react";
import { useStore, slugify } from "../lib/store";
import { useToast } from "../components/Toast";
import type { Drug, DrugInteraction } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

export function DrugsAdmin() {
  const { drugs, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<Drug>>({});
  const [search, setSearch] = useState("");

  const save = () => {
    if (!form.name) return notify("أدخل اسم الدواء", "error");
    const d: Drug = {
      id: form.id || "d" + Date.now(),
      name: form.name!, genericName: form.genericName || "", drugClass: form.drugClass || "",
      category: form.category || "عام", dose: form.dose || "", indications: form.indications || "",
      sideEffects: form.sideEffects || "", nursingConsiderations: form.nursingConsiderations || "",
      contraindications: form.contraindications || "", storage: form.storage || "", references: form.references || "",
      slug: form.slug || slugify(form.name!),
      isHighAlert: form.isHighAlert || false, highAlertWarnings: form.highAlertWarnings || "",
    };
    setData((s) => ({ ...s, drugs: form.id ? s.drugs.map((x) => (x.id === form.id ? d : x)) : [d, ...s.drugs] }));
    logActivity(form.id ? "تعديل دواء" : "إضافة دواء", d.name);
    setForm({}); notify("تم حفظ الدواء");
  };
  const del = (id: string) => { setData((s) => ({ ...s, drugs: s.drugs.filter((x) => x.id !== id) })); notify("تم حذف الدواء"); };

  const list = drugs.filter((d) => (d.name + d.genericName).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الأدوية..." className={inp} />
        {list.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-2 font-bold dark:text-white">
                💊 {d.name}
                {d.isHighAlert && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-500/10">⚠️ عالي الخطورة</span>}
              </div>
              <div className="text-sm text-slate-400">{d.genericName} • {d.category}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setForm(d)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
              <button onClick={() => del(d.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل دواء" : "➕ دواء جديد"}</h3>
        <input placeholder="الاسم التجاري" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <input placeholder="الاسم العلمي" value={form.genericName ?? ""} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className={inp} />
        <input placeholder="الفئة الدوائية (Class)" value={form.drugClass ?? ""} onChange={(e) => setForm({ ...form, drugClass: e.target.value })} className={inp} />
        <input placeholder="التصنيف" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp} />
        <input placeholder="الجرعة" value={form.dose ?? ""} onChange={(e) => setForm({ ...form, dose: e.target.value })} className={inp} />
        <textarea placeholder="دواعي الاستعمال" rows={2} value={form.indications ?? ""} onChange={(e) => setForm({ ...form, indications: e.target.value })} className={inp} />
        <textarea placeholder="الآثار الجانبية" rows={2} value={form.sideEffects ?? ""} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} className={inp} />
        <textarea placeholder="الاعتبارات التمريضية" rows={2} value={form.nursingConsiderations ?? ""} onChange={(e) => setForm({ ...form, nursingConsiderations: e.target.value })} className={inp} />
        <textarea placeholder="موانع الاستعمال (Contraindications)" rows={2} value={form.contraindications ?? ""} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} className={inp} />
        <input placeholder="طريقة التخزين (Storage)" value={form.storage ?? ""} onChange={(e) => setForm({ ...form, storage: e.target.value })} className={inp} />
        <input placeholder="المراجع (References)" value={form.references ?? ""} onChange={(e) => setForm({ ...form, references: e.target.value })} className={inp} />
        <label className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-400">
          <input type="checkbox" checked={form.isHighAlert ?? false} onChange={(e) => setForm({ ...form, isHighAlert: e.target.checked })} />
          ⚠️ دواء عالي الخطورة (High-Alert)
        </label>
        {form.isHighAlert && (
          <textarea placeholder="تحذيرات واحتياطات دواء عالي الخطورة" rows={3} value={form.highAlertWarnings ?? ""} onChange={(e) => setForm({ ...form, highAlertWarnings: e.target.value })} className={inp} />
        )}
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function DrugInteractionsAdmin() {
  const { drugs, drugInteractions, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<DrugInteraction>>({ severity: "moderate" });

  const sorted = [...drugs].sort((a, b) => a.name.localeCompare(b.name));

  const save = () => {
    if (!form.drugAId || !form.drugBId) return notify("اختاري الدوائين", "error");
    if (form.drugAId === form.drugBId) return notify("اختاري دوائين مختلفين", "error");
    if (!form.description) return notify("أدخلي وصف التفاعل", "error");
    const i: DrugInteraction = {
      id: form.id || "di" + Date.now(),
      drugAId: form.drugAId!, drugBId: form.drugBId!,
      severity: (form.severity as DrugInteraction["severity"]) || "moderate",
      description: form.description!, management: form.management || "",
    };
    setData((s) => ({ ...s, drugInteractions: form.id ? s.drugInteractions.map((x) => (x.id === form.id ? i : x)) : [i, ...s.drugInteractions] }));
    logActivity(form.id ? "تعديل تفاعل دوائي" : "إضافة تفاعل دوائي", `${drugs.find((d) => d.id === i.drugAId)?.name} + ${drugs.find((d) => d.id === i.drugBId)?.name}`);
    setForm({ severity: "moderate" }); notify("تم حفظ التفاعل");
  };
  const del = (id: string) => { setData((s) => ({ ...s, drugInteractions: s.drugInteractions.filter((x) => x.id !== id) })); notify("تم حذف التفاعل"); };

  const nameOf = (id: string) => drugs.find((d) => d.id === id)?.name || "؟";
  const sevLabel: Record<string, string> = { severe: "خطير", moderate: "متوسط", minor: "بسيط" };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {drugInteractions.map((i) => (
          <div key={i.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">🔄 {nameOf(i.drugAId)} + {nameOf(i.drugBId)} <span className="text-xs font-bold text-amber-600">({sevLabel[i.severity]})</span></div>
              <div className="flex gap-1">
                <button onClick={() => setForm(i)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(i.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{i.description}</div>
          </div>
        ))}
        {drugInteractions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">لا يوجد تفاعلات مسجلة بعد.</div>}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل تفاعل" : "➕ تفاعل جديد"}</h3>
        <select value={form.drugAId ?? ""} onChange={(e) => setForm({ ...form, drugAId: e.target.value })} className={inp}>
          <option value="">الدواء الأول...</option>
          {sorted.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={form.drugBId ?? ""} onChange={(e) => setForm({ ...form, drugBId: e.target.value })} className={inp}>
          <option value="">الدواء الثاني...</option>
          {sorted.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={form.severity ?? "moderate"} onChange={(e) => setForm({ ...form, severity: e.target.value as DrugInteraction["severity"] })} className={inp}>
          <option value="minor">بسيط</option>
          <option value="moderate">متوسط</option>
          <option value="severe">خطير</option>
        </select>
        <textarea placeholder="وصف التفاعل" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
        <textarea placeholder="التوصية التمريضية (اختياري)" rows={2} value={form.management ?? ""} onChange={(e) => setForm({ ...form, management: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({ severity: "moderate" })} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}
