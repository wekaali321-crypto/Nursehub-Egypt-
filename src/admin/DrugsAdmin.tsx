import { useState } from "react";
import { useStore, slugify } from "../lib/store";
import { useToast } from "../components/Toast";
import type { Drug, DrugInteraction, DrugAntidote, DrugClassification, DrugSuffix, CardiacMedGroup, PharmMnemonic } from "../lib/types";

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
      imageUrl: form.imageUrl || "", showImage: form.showImage || false,
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
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-500/10">
          <label className="flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400">
            <input type="checkbox" checked={form.showImage ?? false} onChange={(e) => setForm({ ...form, showImage: e.target.checked })} />
            🖼️ إظهار صورة الدواء
          </label>
          {form.showImage && (
            <div className="mt-2 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1.5 * 1024 * 1024) { notify("الصورة كبيرة — اختاري صورة أقل من 1.5 ميجا", "error"); return; }
                  const reader = new FileReader();
                  reader.onload = () => setForm((f) => ({ ...f, imageUrl: String(reader.result) }));
                  reader.readAsDataURL(file);
                }}
                className={inp}
              />
              {form.imageUrl && (
                <div className="relative">
                  <img src={form.imageUrl} alt="معاينة" className="max-h-40 w-full rounded-lg object-contain" />
                  <button onClick={() => setForm({ ...form, imageUrl: "" })} className="mt-1 w-full rounded-lg bg-red-100 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف الصورة</button>
                </div>
              )}
            </div>
          )}
        </div>
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

export function DrugAntidotesAdmin() {
  const { drugAntidotes, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<DrugAntidote>>({});

  const save = () => {
    if (!form.toxin || !form.antidotes) return notify("أدخلي المادة السامة والترياق", "error");
    const a: DrugAntidote = { id: form.id || "at" + Date.now(), toxin: form.toxin!, antidotes: form.antidotes!, notes: form.notes || "" };
    setData((s) => ({ ...s, drugAntidotes: form.id ? s.drugAntidotes.map((x) => (x.id === form.id ? a : x)) : [a, ...s.drugAntidotes] }));
    logActivity(form.id ? "تعديل ترياق" : "إضافة ترياق", a.toxin);
    setForm({}); notify("تم حفظ الترياق");
  };
  const del = (id: string) => { setData((s) => ({ ...s, drugAntidotes: s.drugAntidotes.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {drugAntidotes.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">🧪 {a.toxin} <span className="text-sm font-normal text-emerald-600">← {a.antidotes}</span></div>
              <div className="flex gap-1">
                <button onClick={() => setForm(a)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            {a.notes && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.notes}</div>}
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل ترياق" : "➕ ترياق جديد"}</h3>
        <input placeholder="المادة السامة / الدواء" value={form.toxin ?? ""} onChange={(e) => setForm({ ...form, toxin: e.target.value })} className={inp} />
        <input placeholder="الترياق المناسب" value={form.antidotes ?? ""} onChange={(e) => setForm({ ...form, antidotes: e.target.value })} className={inp} />
        <textarea placeholder="ملاحظات (اختياري)" rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function DrugClassificationsAdmin() {
  const { drugClassifications, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<DrugClassification>>({});

  const save = () => {
    if (!form.name || !form.description) return notify("أدخلي اسم الصنف والوصف", "error");
    const c: DrugClassification = { id: form.id || "cl" + Date.now(), name: form.name!, description: form.description!, examples: form.examples || "" };
    setData((s) => ({ ...s, drugClassifications: form.id ? s.drugClassifications.map((x) => (x.id === form.id ? c : x)) : [c, ...s.drugClassifications] }));
    logActivity(form.id ? "تعديل صنف دوائي" : "إضافة صنف دوائي", c.name);
    setForm({}); notify("تم حفظ الصنف");
  };
  const del = (id: string) => { setData((s) => ({ ...s, drugClassifications: s.drugClassifications.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {drugClassifications.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">🧬 {c.name}</div>
              <div className="flex gap-1">
                <button onClick={() => setForm(c)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(c.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.description}</div>
            {c.examples && <div className="mt-1 text-xs font-bold text-violet-600">أمثلة: {c.examples}</div>}
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل صنف" : "➕ صنف جديد"}</h3>
        <input placeholder="اسم الصنف" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <textarea placeholder="الوصف" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
        <input placeholder="أمثلة (مفصولة بفاصلة)" value={form.examples ?? ""} onChange={(e) => setForm({ ...form, examples: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function DrugSuffixesAdmin() {
  const { drugSuffixes, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<DrugSuffix>>({});

  const save = () => {
    if (!form.suffix || !form.className) return notify("أدخلي اللاحقة والفئة", "error");
    const s: DrugSuffix = { id: form.id || "sf" + Date.now(), suffix: form.suffix!, className: form.className!, examples: form.examples || "" };
    setData((st) => ({ ...st, drugSuffixes: form.id ? st.drugSuffixes.map((x) => (x.id === form.id ? s : x)) : [s, ...st.drugSuffixes] }));
    logActivity(form.id ? "تعديل لاحقة دواء" : "إضافة لاحقة دواء", s.suffix);
    setForm({}); notify("تم الحفظ");
  };
  const del = (id: string) => { setData((st) => ({ ...st, drugSuffixes: st.drugSuffixes.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {drugSuffixes.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">🔤 {s.suffix} — {s.className}</div>
              <div className="flex gap-1">
                <button onClick={() => setForm(s)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(s.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.examples}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل لاحقة" : "➕ لاحقة جديدة"}</h3>
        <input placeholder="اللاحقة (مثال: -caine)" value={form.suffix ?? ""} onChange={(e) => setForm({ ...form, suffix: e.target.value })} className={inp} />
        <input placeholder="الفئة الدوائية" value={form.className ?? ""} onChange={(e) => setForm({ ...form, className: e.target.value })} className={inp} />
        <input placeholder="أمثلة (مفصولة بفاصلة)" value={form.examples ?? ""} onChange={(e) => setForm({ ...form, examples: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function CardiacMedGroupsAdmin() {
  const { cardiacMedGroups, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<CardiacMedGroup>>({});

  const save = () => {
    if (!form.name) return notify("أدخلي اسم الفئة", "error");
    const g: CardiacMedGroup = { id: form.id || "cm" + Date.now(), name: form.name!, examples: form.examples || "" };
    setData((st) => ({ ...st, cardiacMedGroups: form.id ? st.cardiacMedGroups.map((x) => (x.id === form.id ? g : x)) : [g, ...st.cardiacMedGroups] }));
    logActivity(form.id ? "تعديل فئة أدوية قلب" : "إضافة فئة أدوية قلب", g.name);
    setForm({}); notify("تم الحفظ");
  };
  const del = (id: string) => { setData((st) => ({ ...st, cardiacMedGroups: st.cardiacMedGroups.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {cardiacMedGroups.map((g) => (
          <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">❤️ {g.name}</div>
              <div className="flex gap-1">
                <button onClick={() => setForm(g)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(g.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{g.examples}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل فئة" : "➕ فئة جديدة"}</h3>
        <input placeholder="اسم الفئة" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <textarea placeholder="الأدوية (مفصولة بفاصلة)" rows={3} value={form.examples ?? ""} onChange={(e) => setForm({ ...form, examples: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function PharmMnemonicsAdmin() {
  const { pharmMnemonics, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<PharmMnemonic>>({});

  const save = () => {
    if (!form.title || !form.lines) return notify("أدخلي العنوان والبنود", "error");
    const m: PharmMnemonic = { id: form.id || "mn" + Date.now(), title: form.title!, code: form.code || "", lines: form.lines! };
    setData((st) => ({ ...st, pharmMnemonics: form.id ? st.pharmMnemonics.map((x) => (x.id === form.id ? m : x)) : [m, ...st.pharmMnemonics] }));
    logActivity(form.id ? "تعديل مذكرة" : "إضافة مذكرة", m.title);
    setForm({}); notify("تم الحفظ");
  };
  const del = (id: string) => { setData((st) => ({ ...st, pharmMnemonics: st.pharmMnemonics.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {pharmMnemonics.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="font-bold dark:text-white">🧠 {m.title} {m.code && `"${m.code}"`}</div>
              <div className="flex gap-1">
                <button onClick={() => setForm(m)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                <button onClick={() => del(m.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
            <div className="mt-1 whitespace-pre-line text-sm text-slate-500 dark:text-slate-400">{m.lines}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل مذكرة" : "➕ مذكرة جديدة"}</h3>
        <input placeholder="العنوان" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
        <input placeholder="كود المذكرة (مثال: SAMS)" value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inp} />
        <textarea placeholder="البنود — كل بند في سطر" rows={5} value={form.lines ?? ""} onChange={(e) => setForm({ ...form, lines: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}

export function PharmacyFactsAdmin() {
  const { pharmacyFacts, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<import("../lib/types").PharmacyFact>>({});

  const save = () => {
    if (!form.number || !form.content) return notify("أدخلي الرقم والمحتوى", "error");
    const chapter = form.chapter || (form.number <= 100 ? 1 : form.number <= 200 ? 2 : form.number <= 300 ? 3 : form.number <= 400 ? 4 : 5);
    const f = { id: form.id || "fact" + Date.now(), number: Number(form.number), content: form.content!, source: form.source || "", chapter };
    setData((st) => ({ ...st, pharmacyFacts: form.id ? st.pharmacyFacts.map((x) => (x.id === form.id ? f : x)) : [f, ...st.pharmacyFacts] }));
    logActivity(form.id ? "تعديل معلومة صيدلانية" : "إضافة معلومة صيدلانية", "رقم " + f.number);
    setForm({}); notify("تم الحفظ");
  };
  const del = (id: string) => { setData((st) => ({ ...st, pharmacyFacts: st.pharmacyFacts.filter((x) => x.id !== id) })); notify("تم الحذف"); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((ch) => {
          const chFacts = pharmacyFacts.filter((f) => f.chapter === ch).sort((a, b) => a.number - b.number);
          if (chFacts.length === 0) return null;
          return (
            <div key={ch}>
              <h3 className="mb-2 mt-4 font-bold text-slate-500 dark:text-slate-400">📁 الفصل {ch} ({chFacts.length})</h3>
              {chFacts.map((f) => (
                <div key={f.id} className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="font-bold dark:text-white">📖 معلومة {f.number}</div>
                    <div className="flex gap-1">
                      <button onClick={() => setForm(f)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                      <button onClick={() => del(f.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
                    </div>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{f.content}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل معلومة" : "➕ معلومة جديدة"}</h3>
        <input type="number" placeholder="الرقم" value={form.number ?? ""} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} className={inp} />
        <select value={form.chapter ?? ""} onChange={(e) => setForm({ ...form, chapter: Number(e.target.value) })} className={inp}>
          <option value="">الفصل (تلقائي حسب الرقم لو فاضي)</option>
          <option value="1">الفصل 1</option>
          <option value="2">الفصل 2</option>
          <option value="3">الفصل 3</option>
          <option value="4">الفصل 4</option>
          <option value="5">الفصل 5</option>
        </select>
        <textarea placeholder="المحتوى" rows={6} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inp} />
        <input placeholder="المصدر (اختياري)" value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}
