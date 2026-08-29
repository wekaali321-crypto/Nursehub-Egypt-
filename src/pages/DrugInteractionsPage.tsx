import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";

export default function DrugInteractionsPage() {
  const { drugs, drugInteractions, settings } = useStore();
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  useSEO({
    title: `فحص تفاعلات الأدوية | ${settings.siteName}`,
    description: "أداة سريعة لفحص التفاعلات الدوائية المعروفة بين دواءين من دليل الأدوية.",
    keywords: "تفاعلات الأدوية, drug interactions, تمريض, أمان الدواء",
  });

  const sorted = useMemo(() => [...drugs].sort((a, b) => a.name.localeCompare(b.name)), [drugs]);

  const result = useMemo(() => {
    if (!aId || !bId || aId === bId) return null;
    return (
      drugInteractions.find(
        (i) => (i.drugAId === aId && i.drugBId === bId) || (i.drugAId === bId && i.drugBId === aId)
      ) || "none"
    );
  }, [aId, bId, drugInteractions]);

  const drugA = drugs.find((d) => d.id === aId);
  const drugB = drugs.find((d) => d.id === bId);

  const sevStyle: Record<string, string> = {
    severe: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-400",
    moderate: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-400",
    minor: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300",
  };
  const sevLabel: Record<string, string> = { severe: "خطير", moderate: "متوسط", minor: "بسيط" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "فحص التفاعلات" }]} />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-violet-600 to-sky-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🔄</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">فحص تفاعلات الأدوية</h1>
        <p className="mt-1 text-sky-50">اختاري دوائين من دليل الأدوية واعرفي هل بينهم تفاعل معروف.</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان فحص التفاعلات" /></div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DrugPicker label="الدواء الأول" value={aId} onChange={setAId} drugs={sorted} />
        <DrugPicker label="الدواء الثاني" value={bId} onChange={setBId} drugs={sorted} />
      </div>

      <div className="mt-6">
        {aId && bId && aId === bId && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400 dark:border-slate-700">
            اختاري دوائين مختلفين للمقارنة.
          </div>
        )}

        {result === "none" && drugA && drugB && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400">
            <h3 className="mb-1 flex items-center gap-2 font-bold">✅ لا يوجد تفاعل مسجل</h3>
            <p className="text-sm leading-relaxed">
              مفيش تفاعل موثّق حاليًا بين <b>{drugA.name}</b> و<b>{drugB.name}</b> في قاعدة البيانات دي. ده مش ضمان مطلق لعدم وجود تفاعل — دايمًا راجعي مرجع دوائي معتمد أو الصيدلي قبل الإعطاء المشترك.
            </p>
          </div>
        )}

        {result && result !== "none" && drugA && drugB && (
          <div className={`rounded-2xl border-2 p-5 ${sevStyle[result.severity]}`}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">⚠️ {drugA.name} + {drugB.name}</h3>
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-bold dark:bg-black/20">خطورة: {sevLabel[result.severity]}</span>
            </div>
            <p className="leading-relaxed">{result.description}</p>
            {result.management && (
              <p className="mt-2 font-bold">💡 التوصية التمريضية: {result.management}</p>
            )}
          </div>
        )}

        {(!aId || !bId) && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 dark:border-slate-700">
            اختاري دوائين من القائمتين فوق عشان تظهر النتيجة.
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-slate-800 dark:bg-amber-500/5 dark:text-amber-400">
        ⚠️ هذه الأداة لأغراض تعليمية فقط ولا تغني عن مراجعة مرجع دوائي معتمد أو استشارة الصيدلي/الطبيب قبل أي قرار سريري.
      </div>

      <div className="mt-4 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}

function DrugPicker({
  label,
  value,
  onChange,
  drugs,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  drugs: { id: string; name: string; genericName: string }[];
}) {
  const [q, setQ] = useState("");
  const picked = drugs.find((d) => d.id === value);
  const matches = q.trim()
    ? drugs.filter((d) => (d.name + " " + d.genericName).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40)
    : [];

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 text-sm font-black text-slate-500 dark:text-slate-400">{label}</div>

      {picked ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 p-3 dark:bg-sky-500/10">
          <div className="min-w-0">
            <div className="truncate font-bold text-slate-900 dark:text-white">{picked.name}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{picked.genericName}</div>
          </div>
          <button
            onClick={() => { onChange(""); setQ(""); }}
            className="shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            تغيير
          </button>
        </div>
      ) : (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اكتبي اسم الدواء..."
            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800"
          />
          {matches.length > 0 && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              {matches.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { onChange(d.id); setQ(""); }}
                  className="block w-full min-w-0 border-b border-slate-100 p-2.5 text-right last:border-0 hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-sky-500/10"
                >
                  <span className="block truncate text-sm font-bold text-slate-800 dark:text-white">{d.name}</span>
                  <span className="block truncate text-xs text-slate-400">{d.genericName}</span>
                </button>
              ))}
            </div>
          )}
          {q.trim() && matches.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">مفيش دواء بالاسم ده.</p>
          )}
        </>
      )}
    </div>
  );
}
