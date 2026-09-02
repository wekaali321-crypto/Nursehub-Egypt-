import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchLasaPairs, type LasaPair } from "../lib/lasaApi";

const SIMILARITY_LABELS: Record<string, string> = {
  look_alike: "تشابه شكلي (الاسم المكتوب)",
  sound_alike: "تشابه صوتي (النطق)",
  both: "تشابه شكلي وصوتي معًا",
};

function TallMan({ a, b }: { a: string | null; b: string | null }) {
  if (!a && !b) return null;
  return (
    <div className="mt-2 text-xs bg-green-50 border border-green-100 rounded-lg p-2 font-mono text-green-800 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-300">
      {a && <div>{a}</div>}
      {b && <div>{b}</div>}
    </div>
  );
}

export default function LasaPage() {
  const [searchParams] = useSearchParams();
  const [pairs, setPairs] = useState<LasaPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");

  useEffect(() => {
    fetchLasaPairs().then(setPairs).catch(() => setPairs([])).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return pairs;
    return pairs.filter(
      (p) => p.drug_a.toLowerCase().includes(query) || p.drug_b.toLowerCase().includes(query)
    );
  }, [pairs, query]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جارِ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-green-600 to-emerald-700 text-white p-6 mb-8">
        <h1 className="text-2xl font-bold mb-1">أدوية متشابهة الاسم (LASA)</h1>
        <p className="opacity-90 text-sm">
          أزواج أدوية اسمها متشابه كتابيًا أو نطقيًا وهي سبب رئيسي لأخطاء الدواء عالميًا — الحل المعياري هو
          التخزين المنفصل فعليًا على الرف، وكتابة جزء من الاسم بحروف كبيرة (TALL man lettering)، والتحقق
          المزدوج المستقل قبل الإعطاء.
        </p>
      </div>

      <div className="relative mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن اسم دواء..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 outline-none focus:border-green-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-4 top-3.5 text-slate-400">🔍</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">لا توجد نتائج مطابقة لبحثك.</div>
      )}

      <div className="space-y-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="font-bold text-lg text-slate-800 dark:text-white">{p.drug_a} ↔ {p.drug_b}</div>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20">
                {SIMILARITY_LABELS[p.similarity_type]}
              </span>
            </div>
            <TallMan a={p.tall_man_a} b={p.tall_man_b} />
            {p.notes && <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">{p.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
