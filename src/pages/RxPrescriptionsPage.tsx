import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRxPrescriptions, RX_CATEGORY_ORDER, RX_CATEGORY_LABELS, type RxPrescription } from "../lib/rxApi";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";

const LABELS = {
  loading: { ar: "جارِ التحميل...", en: "Loading..." },
  disclaimer: {
    ar: "⚠ برجاء المراجعة قبل تطبيق أي من هذه الوصفات — المحتوى هنا لأغراض تعليمية للتمريض وليس بديلاً عن تقييم الطبيب واستشارته.",
    en: "⚠ Please review before applying any of these prescriptions - this content is for nursing education purposes and does not replace a physician's assessment and consultation.",
  },
  title: { ar: "روشتات صيدلية", en: "Pharmacy Prescriptions" },
  subtitle: { ar: "مرجع تعليمي لأشهر الروشتات الطبية حسب الحالة — بشكل الروشتة الحقيقية.", en: "An educational reference for common prescriptions by condition - in real prescription format." },
  rxCount: { ar: "روشتة", en: "prescriptions" },
  searchPlaceholder: { ar: "ابحث عن حالة أو دواء أو قسم...", en: "Search by condition, drug, or section..." },
  noResults: { ar: "لا توجد روشتات مطابقة لبحثك.", en: "No matching prescriptions found." },
  drugCount: { ar: "دواء", en: "drugs" },
  back: { ar: "→ العودة لكل الروشتات", en: "→ Back to all prescriptions" },
  notFound: { ar: "لم يتم العثور على الروشتة.", en: "Prescription not found." },
  notes: { ar: "ملاحظات", en: "Notes" },
  footerNote: { ar: "مرجع تعليمي — ليس بديلاً عن استشارة الطبيب", en: "Educational reference - does not replace physician consultation" },
};

function categoryLabel(cat: string, lang: "ar" | "en") {
  return RX_CATEGORY_LABELS[cat]?.[lang] || cat;
}

function DisclaimerBanner({ lang }: { lang: "ar" | "en" }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-6 leading-relaxed dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300">
      {LABELS.disclaimer[lang]}
    </div>
  );
}

export function RxPrescriptionsHome() {
  const { lang } = useI18n();
  const [items, setItems] = useState<RxPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchRxPrescriptions().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.loading[lang]}</div>;

  const query = q.trim().toLowerCase();
  const filtered = !query
    ? items
    : items.filter((r) =>
        r.condition_ar.toLowerCase().includes(query) ||
        (r.condition_en || "").toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        r.items.some((it) => it.drug_name.toLowerCase().includes(query))
      );

  const grouped = RX_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    rx: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.rx.length > 0);

  // أي فئة موجودة في البيانات ومش في الترتيب المعرّف، تتضاف في الآخر بدل ما تختفي
  const knownCats = new Set(RX_CATEGORY_ORDER);
  const extra = Array.from(new Set(filtered.filter((i) => !knownCats.has(i.category)).map((i) => i.category)))
    .map((cat) => ({ category: cat, rx: filtered.filter((i) => i.category === cat) }));

  const allGroups = [...grouped, ...extra];

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 text-white p-6 mb-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold">{LABELS.title[lang]}</h1>
          <InlineLangToggle light />
        </div>
        <p className="opacity-90 text-sm">{LABELS.subtitle[lang]}</p>
        <p className="mt-2 text-sm bg-white/10 rounded-lg inline-block px-3 py-1">{items.length} {LABELS.rxCount[lang]}</p>
      </div>

      <div className="relative mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={LABELS.searchPlaceholder[lang]}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute right-3 top-3 text-slate-400">🔍</span>
      </div>

      <DisclaimerBanner lang={lang} />

      {allGroups.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-10">{LABELS.noResults[lang]}</div>
      )}

      {allGroups.map((g) => (
        <div key={g.category} className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{categoryLabel(g.category, lang)}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.rx.map((r) => {
              const title = lang === "en" && r.condition_en ? r.condition_en : r.condition_ar;
              const subtitle = lang === "en" ? r.condition_ar : r.condition_en;
              return (
                <Link
                  key={r.id}
                  to={`/drugs/prescriptions/${r.id}`}
                  className="rounded-xl p-4 bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition dark:bg-slate-900 dark:border-slate-800"
                >
                  <div className="font-bold text-slate-800 dark:text-white">{title}</div>
                  {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">{r.items.length} {LABELS.drugCount[lang]}</div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RxPrescriptionDetail() {
  const { id } = useParams();
  const { lang } = useI18n();
  const [rx, setRx] = useState<RxPrescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchRxPrescriptions()
      .then((all) => setRx(all.find((r) => r.id === id) || null))
      .catch(() => setRx(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.loading[lang]}</div>;
  if (!rx) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{LABELS.notFound[lang]}</div>;

  const title = lang === "en" && rx.condition_en ? rx.condition_en : rx.condition_ar;
  const subtitle = lang === "en" ? rx.condition_ar : rx.condition_en;
  const displayItems = lang === "en" && rx.items_en && rx.items_en.length > 0 ? rx.items_en : rx.items;

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link to="/drugs/prescriptions" className="text-emerald-700 dark:text-emerald-400 text-sm inline-block">{LABELS.back[lang]}</Link>
        <InlineLangToggle />
      </div>

      <DisclaimerBanner lang={lang} />

      {/* بطاقة الروشتة نفسها — مصممة بشكل روشتة حقيقية */}
      <div className="bg-white rounded-2xl border-2 border-emerald-700/20 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-emerald-500/20">
        {/* رأس الروشتة */}
        <div className="bg-emerald-50 border-b-2 border-dashed border-emerald-700/30 p-5 flex items-start justify-between dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide mb-1">{categoryLabel(rx.category, lang)}</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="text-4xl text-emerald-700 dark:text-emerald-400 font-serif leading-none">℞</div>
        </div>

        {/* قائمة الأدوية */}
        <div className="p-5 space-y-4">
          {displayItems.map((it, idx) => (
            <div key={idx} className="border-b border-dotted border-slate-200 dark:border-slate-700 pb-3 last:border-0">
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{idx + 1}.</span>
                <span className="font-semibold text-slate-800 dark:text-white">{it.drug_name}</span>
              </div>
              {it.dose && <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 pr-5 leading-relaxed">{it.dose}</p>}
              {it.note && <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 pr-5 italic">{it.note}</p>}
            </div>
          ))}
        </div>

        {/* ملاحظات إكلينيكية */}
        {rx.clinical_note && (
          <div className="mx-5 mb-5 rounded-lg bg-slate-50 border border-slate-200 p-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{LABELS.notes[lang]}</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{bilingual(rx.clinical_note, rx.clinical_note_en, lang).text}</p>
          </div>
        )}

        {/* توقيع الطبيب */}
        <div className="border-t-2 border-dashed border-emerald-700/30 dark:border-emerald-500/20 p-5 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div className="text-xs text-slate-400 dark:text-slate-500">{LABELS.footerNote[lang]}</div>
          {rx.doctor_name && (
            <div className="text-sm text-slate-600 dark:text-slate-300 font-serif italic">{rx.doctor_name}</div>
          )}
        </div>
      </div>
    </div>
  );
}
