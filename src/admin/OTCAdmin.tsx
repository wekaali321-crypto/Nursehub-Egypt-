import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import type { OTCCondition } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

const CATEGORIES = ["تنفسي", "هضمي", "جلدية", "عظام ومفاصل", "فم وأسنان", "مسالك بولية", "نسائية", "أخرى"];

export default function OTCAdmin() {
  const { otcConditions, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<OTCCondition>>({});
  const [search, setSearch] = useState("");

  const save = () => {
    if (!form.nameAr || !form.treatment) return notify("أدخلي على الأقل الاسم بالعربي والعلاج", "error");
    const c: OTCCondition = {
      id: form.id || "otc" + Date.now(),
      orderNum: form.orderNum ?? (otcConditions.length + 1),
      nameAr: form.nameAr!,
      nameEn: form.nameEn || "",
      icon: form.icon || "🩺",
      category: form.category || CATEGORIES[0],
      summary: form.summary || "",
      symptoms: form.symptoms || "",
      keyQuestions: form.keyQuestions || "",
      redFlags: form.redFlags || "",
      treatment: form.treatment!,
      patientAdvice: form.patientAdvice || "",
    };
    setData((s) => ({
      ...s,
      otcConditions: form.id ? s.otcConditions.map((x) => (x.id === form.id ? c : x)) : [c, ...s.otcConditions],
    }));
    logActivity(form.id ? "تعديل حالة شائعة" : "إضافة حالة شائعة", c.nameAr);
    setForm({});
    notify("تم الحفظ");
  };

  const del = (id: string) => {
    setData((s) => ({ ...s, otcConditions: s.otcConditions.filter((x) => x.id !== id) }));
    notify("تم الحذف");
  };

  const list = [...otcConditions]
    .filter((c) => (c.nameAr + c.nameEn).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.orderNum - b.orderNum);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الحالات..." className={inp} />
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.icon}</span>
              <div>
                <div className="font-bold dark:text-white">{c.orderNum}. {c.nameAr}</div>
                <div className="text-xs text-slate-400">{c.category} · {c.id}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setForm(c)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
              <button onClick={() => del(c.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="py-10 text-center text-slate-400">مفيش حالات مطابقة.</div>}
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{form.id ? "✏️ تعديل حالة" : "➕ حالة جديدة"}</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="الترتيب" value={form.orderNum ?? ""} onChange={(e) => setForm({ ...form, orderNum: Number(e.target.value) })} className={inp} />
          <input placeholder="الأيقونة (إيموجي)" value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inp} />
        </div>
        <input placeholder="الاسم بالعربي" value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className={inp} />
        <input placeholder="الاسم بالإنجليزي" value={form.nameEn ?? ""} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inp} />
        <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
          <option value="">اختاري الفئة</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea placeholder="الملخص" rows={2} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inp} />
        <textarea placeholder="الأعراض" rows={3} value={form.symptoms ?? ""} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className={inp} />
        <textarea placeholder="الأسئلة المهمة قبل الصرف" rows={2} value={form.keyQuestions ?? ""} onChange={(e) => setForm({ ...form, keyQuestions: e.target.value })} className={inp} />
        <textarea placeholder="علامات الخطر (تحويل للطبيب) — أو — لو مفيش" rows={2} value={form.redFlags ?? ""} onChange={(e) => setForm({ ...form, redFlags: e.target.value })} className={inp} />
        <textarea placeholder="العلاج" rows={4} value={form.treatment ?? ""} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className={inp} />
        <textarea placeholder="نصائح للمريض — أو — لو مفيش" rows={2} value={form.patientAdvice ?? ""} onChange={(e) => setForm({ ...form, patientAdvice: e.target.value })} className={inp} />
        <button onClick={save} className="w-full rounded-lg bg-emerald-600 py-2 font-bold text-white">حفظ</button>
        {form.id && <button onClick={() => setForm({})} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-bold dark:border-slate-700">إلغاء</button>}
      </div>
    </div>
  );
}
