import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs, AdSlot } from "../components/common";
import { useSEO } from "../lib/seo";
import { fetchAppliedPharmItems, type AppliedPharmItem } from "../lib/appliedPharmApi";
import { useStore } from "../lib/store";

const TYPE_META: Record<string, { label: string; icon: string; classes: string }> = {
  fact: { label: "معلومة", icon: "📌", classes: "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30" },
  qa: { label: "سؤال وجواب", icon: "💬", classes: "border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30" },
  alert: { label: "تنبيه صيدلاني", icon: "⚠️", classes: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30" },
  trivia: { label: "هل تعلم؟", icon: "💡", classes: "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30" },
  note: { label: "ملاحظة", icon: "📝", classes: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30" },
};

function ItemCard({ item }: { item: AppliedPharmItem }) {
  const meta = TYPE_META[item.item_type] || TYPE_META.fact;
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${meta.classes}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 items-center gap-1 rounded-full bg-white/70 px-3 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-900/50 dark:text-slate-300">
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </span>
        {item.title && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.title}</span>}
      </div>

      {item.item_type === "qa" ? (
        <div className="space-y-2">
          <p className="font-bold text-slate-800 dark:text-white">؟ {item.question}</p>
          <p className="whitespace-pre-line rounded-xl bg-white/60 p-3 text-[15px] leading-8 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            {item.answer}
          </p>
        </div>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{item.content}</p>
      )}
    </div>
  );
}

export function AppliedPharmHome() {
  const { settings } = useStore();
  const [items, setItems] = useState<AppliedPharmItem[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: `بنك الصيدلية التعليمي | ${settings.siteName}`,
    description: "ملخصات دوائية حسب الموضوع، وخطط علاجية كاملة لأشهر الحالات المرضية.",
    keywords: "بنك الصيدلية التعليمي, صيدلة سريرية, تمريض",
  });

  useEffect(() => {
    fetchAppliedPharmItems().then(setItems).finally(() => setLoading(false));
  }, []);

  const part1Topics = useMemo(() => {
    const map = new Map<string, { icon: string; count: number }>();
    items.filter((i) => i.part === 1).forEach((i) => {
      const cur = map.get(i.topic) || { icon: i.topic_icon || "💊", count: 0 };
      cur.count++;
      map.set(i.topic, cur);
    });
    return Array.from(map.entries()).map(([topic, v]) => ({ topic, ...v }));
  }, [items]);

  const part2Plans = useMemo(
    () => items.filter((i) => i.part === 2 && i.item_type === "treatment_plan"),
    [items]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "بنك الصيدلية التعليمي" }]} />

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 via-violet-600 to-purple-500 p-6 text-white shadow-lg sm:p-10">
        <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-5xl sm:text-6xl">🧠</div>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">بنك الصيدلية التعليمي</h1>
          <p className="mt-2 max-w-2xl text-violet-50">
            ملخصات دوائية عملية حسب الموضوع — معلومات، أسئلة وأجوبة، وتنبيهات صيدلانية — بالإضافة إلى
            خطط علاجية كاملة خطوة بخطوة لأشهر الحالات المرضية.
          </p>
        </div>
      </div>

      <div className="mb-6"><AdSlot label="إعلان بنك الصيدلية التعليمي" /></div>

      {loading && <div className="py-10 text-center text-slate-400">جارٍ التحميل...</div>}

      {!loading && (
        <>
          <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">📚 ملخصات حسب الموضوع</h2>
          {part1Topics.length === 0 && (
            <div className="mb-8 rounded-2xl border border-dashed border-slate-300 py-8 text-center text-slate-400 dark:border-slate-700">
              لسه معملتش رفع محتوى — قريبًا.
            </div>
          )}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {part1Topics.map((t) => (
              <Link
                key={t.topic}
                to={`/drugs/applied-pharm/topic/${encodeURIComponent(t.topic)}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{t.icon}</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{t.count}</span>
                </div>
                <h3 className="mt-3 font-black leading-tight">{t.topic}</h3>
                <span className="mt-2 inline-block text-sm font-bold text-white/90 group-hover:underline">افتح ←</span>
              </Link>
            ))}
          </div>

          <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-white">🩺 خطط علاجية كاملة</h2>
          {part2Plans.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-slate-400 dark:border-slate-700">
              لسه معملتش رفع خطط علاجية — قريبًا.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {part2Plans.map((p) => (
              <Link
                key={p.id}
                to={`/drugs/applied-pharm/plan/${p.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-3xl">🩺</span>
                <h3 className="mt-3 font-black leading-tight">{p.disease_name}</h3>
                <span className="mt-2 inline-block text-sm font-bold text-white/90 group-hover:underline">
                  عرض الخطة ←
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 text-center">
        <Link to="/drugs" className="text-sm font-bold text-sky-600 hover:underline">← العودة لدليل الأدوية</Link>
      </div>
    </div>
  );
}

export function AppliedPharmTopicPage() {
  const { topic } = useParams();
  const { settings } = useStore();
  const decodedTopic = decodeURIComponent(topic || "");
  const [items, setItems] = useState<AppliedPharmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useSEO({
    title: `${decodedTopic} | بنك الصيدلية التعليمي | ${settings.siteName}`,
    description: `ملخصات دوائية عن ${decodedTopic}.`,
    keywords: `${decodedTopic}, صيدلة سريرية`,
  });

  useEffect(() => {
    fetchAppliedPharmItems(1).then(setItems).finally(() => setLoading(false));
  }, []);

  const topicItems = useMemo(
    () =>
      items
        .filter((i) => i.topic === decodedTopic)
        .filter((i) => !q.trim() || (i.content || i.question || "").includes(q))
        .sort((a, b) => a.order_num - b.order_num),
    [items, decodedTopic, q]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "الأدوية", path: "/drugs" },
          { label: "بنك الصيدلية التعليمي", path: "/drugs/applied-pharm" },
          { label: decodedTopic },
        ]}
      />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-indigo-700 via-violet-600 to-purple-500 p-6 text-white sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">{decodedTopic}</h1>
        <p className="mt-1 text-white/85">{topicItems.length} عنصر</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان الموضوع" /></div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث في هذا الموضوع..."
        className="mb-5 w-full rounded-full border border-slate-200 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
      />

      {loading && <div className="py-10 text-center text-slate-400">جارٍ التحميل...</div>}

      <div className="space-y-3">
        {topicItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {!loading && topicItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-400 dark:border-slate-700">
            مفيش نتائج.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/applied-pharm" className="text-sky-600 hover:underline">← كل المواضيع</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">دليل الأدوية ←</Link>
      </div>
    </div>
  );
}

export default function AppliedPharmPlanPage() {
  const { id } = useParams();
  const { settings } = useStore();
  const [items, setItems] = useState<AppliedPharmItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppliedPharmItems(2).then(setItems).finally(() => setLoading(false));
  }, []);

  const plan = useMemo(() => items.find((i) => i.id === id), [items, id]);

  useSEO({
    title: plan ? `الخطة العلاجية — ${plan.disease_name} | ${settings.siteName}` : `خطة علاجية | ${settings.siteName}`,
    description: plan ? `الخطة العلاجية الكاملة لمرض ${plan.disease_name}.` : "خطة علاجية.",
    keywords: `${plan?.disease_name ?? ""}, خطة علاجية, تمريض`,
  });

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">جارٍ التحميل...</div>;
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">الخطة دي مش موجودة.</p>
        <Link to="/drugs/applied-pharm" className="font-bold text-emerald-600 hover:underline">
          الرجوع للقائمة
        </Link>
      </div>
    );
  }

  const lines = plan.treatment_lines || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "الأدوية", path: "/drugs" },
          { label: "بنك الصيدلية التعليمي", path: "/drugs/applied-pharm" },
          { label: plan.disease_name || "" },
        ]}
      />

      <div className="mb-6 rounded-3xl bg-gradient-to-l from-blue-700 via-indigo-600 to-violet-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">🩺</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">الخطة العلاجية الكاملة</h1>
        <p className="mt-1 text-white/90">{plan.disease_name}</p>
      </div>

      <div className="mb-6"><AdSlot label="إعلان الخطة العلاجية" /></div>

      <div className="space-y-4">
        {lines.map((l, idx) => (
          <div key={idx} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-black text-white shadow">
                {l.line_no}
              </span>
              <h3 className="font-black text-slate-800 dark:text-white">{l.title}</h3>
            </div>
            <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{l.content}</p>
          </div>
        ))}
        {lines.length === 0 && plan.content && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 dark:text-slate-300">{plan.content}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-bold">
        <Link to="/drugs/applied-pharm" className="text-sky-600 hover:underline">← كل الخطط العلاجية</Link>
        <Link to="/drugs" className="text-sky-600 hover:underline">دليل الأدوية ←</Link>
      </div>
    </div>
  );
}
