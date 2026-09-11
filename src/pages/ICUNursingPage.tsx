import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { useCart } from "../lib/cart";
import { fetchIcuTopics, type IcuTopic } from "../lib/icuTopicsApi";

const card = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const PER_TOPIC_PRINT_PRICE = 10;
const PRINT_ALL_PRICE = 70;

export function ICUNursingHome() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  useSEO({ title: `${t("nav.icuNursing")} | NurseHub Egypt` });
  const { add } = useCart();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<IcuTopic[] | null>(null);
  const [category, setCategory] = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIcuTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedToCart = () => {
    if (selected.size === 0 || !topics) return;
    for (const id of selected) {
      const tp = topics.find((x) => x.id === id);
      if (!tp) continue;
      add({
        productId: `icu-print-${tp.id}`,
        title: `${isEn ? "Print: " : "طباعة: "}${isEn && tp.title_en ? tp.title_en : tp.title_ar}`,
        price: PER_TOPIC_PRINT_PRICE,
        qty: 1,
      });
    }
    navigate("/checkout");
  };

  const addPrintAllToCart = () => {
    add({
      productId: "icu-print-all",
      title: isEn ? "Print all ICU Nursing topics" : "طباعة كل مواضيع العناية المركزة",
      price: PRINT_ALL_PRICE,
      qty: 1,
    });
    navigate("/checkout");
  };

  const categories = Array.from(new Set((topics || []).map((tp) => tp.category).filter(Boolean))) as string[];
  const list = category === "all" ? topics || [] : (topics || []).filter((tp) => tp.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.icuNursing") }]} />

      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-rose-600 via-red-500 to-orange-500 p-8 text-white shadow-lg">
        <div className="text-5xl">🏥</div>
        <h1 className="mt-3 text-3xl font-black">{t("nav.icuNursing")}</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          {isEn
            ? "A complete, structured reference for ICU nursing: unit fundamentals, mechanical ventilation, TPN, and more — organized by topic, with full nursing-care and monitoring detail."
            : "مرجع شامل ومنظّم لتمريض العناية المركزة: أساسيات الوحدة، التهوية الآلية، التغذية الوريدية الكاملة، وغيرها — مقسّمة بالمواضيع، مع تفاصيل الرعاية التمريضية والمراقبة كاملة."}
        </p>
        <Link
          to="/drugs/icu-medications"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose-600 shadow hover:bg-rose-50"
        >
          💊 {isEn ? "ICU Medications" : "أدوية العناية المركزة"}
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        {categories.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("all")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === "all" ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
            >
              {isEn ? "All" : "الكل"}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200"}`}
              >
                {c}
              </button>
            ))}
          </div>
        ) : <div />}
        <button
          onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${selectMode ? "bg-slate-800 text-white dark:bg-slate-700" : "border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:hover:bg-rose-500/10"}`}
        >
          {selectMode ? `✕ ${t("icuPrint.cancelSelect")}` : `🖨️ ${t("icuPrint.selectMode")}`}
        </button>
      </div>

      {topics === null ? (
        <div className="py-16 text-center text-slate-400">{t("common.loading")}</div>
      ) : list.length === 0 ? (
        <div className={`${card} py-16 text-center text-slate-400`}>
          <div className="text-4xl">🚧</div>
          <p className="mt-2">{isEn ? "Content coming soon." : "المحتوى قيد الإضافة قريبًا."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tp) => {
            const isSelected = selected.has(tp.id);
            const cardInner = (
              <>
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{tp.icon || "🏥"}</div>
                  {selectMode && (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${isSelected ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 text-transparent dark:border-slate-600"}`}>✓</span>
                  )}
                </div>
                <h3 className="mt-2 font-black text-slate-800 group-hover:text-rose-600 dark:text-white">
                  {isEn && tp.title_en ? tp.title_en : tp.title_ar}
                </h3>
                {tp.category && <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10">{tp.category}</span>}
                {(isEn ? tp.summary_en : tp.summary_ar) && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{isEn ? tp.summary_en : tp.summary_ar}</p>
                )}
                <div className="mt-3 text-xs font-bold text-rose-500">
                  {selectMode ? (isSelected ? (isEn ? "Selected for print" : "مُختار للطباعة") : (isEn ? "Tap to select" : "اضغط للاختيار")) : <>{tp.sections.length} {isEn ? "sections" : "أقسام"} ←</>}
                </div>
              </>
            );
            return selectMode ? (
              <button
                key={tp.id}
                type="button"
                onClick={() => toggleSelected(tp.id)}
                className={`${card} group p-5 text-start transition hover:-translate-y-0.5 hover:shadow-lg ${isSelected ? "ring-2 ring-rose-500" : ""}`}
              >
                {cardInner}
              </button>
            ) : (
              <Link key={tp.id} to={`/icu-nursing/${tp.id}`} className={`${card} group p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}>
                {cardInner}
              </Link>
            );
          })}
        </div>
      )}

      {/* Pay-to-print section */}
      <div className={`${card} mt-8 p-6`}>
        <h2 className="text-lg font-black text-slate-800 dark:text-white">{t("icuPrint.sectionTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("icuPrint.sectionDesc")}</p>

        {selectMode && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 dark:bg-rose-500/10">
            <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
              {selected.size} {t("icuPrint.selectedCount")} — {selected.size * PER_TOPIC_PRINT_PRICE} {isEn ? "EGP" : "جنيه"}
            </span>
            <button
              onClick={addSelectedToCart}
              disabled={selected.size === 0}
              className="rounded-full bg-rose-500 px-6 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {t("icuPrint.addSelectedToCart")}
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("icuPrint.printAllBanner")}</span>
          <button onClick={addPrintAllToCart} className="rounded-full bg-gradient-to-l from-rose-600 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow">
            {t("icuPrint.printAllBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ICUNursingTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topic, setTopic] = useState<IcuTopic | null | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const unlocked = searchParams.get("unlocked") === "1";
  const { add } = useCart();
  const navigate = useNavigate();

  const buyPrint = () => {
    if (!topic) return;
    add({
      productId: `icu-print-${topic.id}`,
      title: `${isEn ? "Print: " : "طباعة: "}${isEn && topic.title_en ? topic.title_en : topic.title_ar}`,
      price: PER_TOPIC_PRINT_PRICE,
      qty: 1,
    });
    navigate("/checkout");
  };

  useEffect(() => {
    let cancelled = false;
    fetchIcuTopics().then((all) => {
      if (!cancelled) setTopic(all.find((tp) => tp.id === id) || null);
    }).catch(() => { if (!cancelled) setTopic(null); });
    return () => { cancelled = true; };
  }, [id]);

  useSEO({ title: `${topic ? (isEn && topic.title_en ? topic.title_en : topic.title_ar) : ""} | ${t("nav.icuNursing")} | NurseHub Egypt` });

  if (topic === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }
  if (!topic) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">❓</div>
        <h1 className="mt-3 text-2xl font-black dark:text-white">{isEn ? "Topic not found" : "الموضوع غير موجود"}</h1>
        <Link to="/icu-nursing" className="mt-4 inline-block rounded-full bg-rose-500 px-6 py-2 font-bold text-white">{t("nav.icuNursing")}</Link>
      </div>
    );
  }

  const title = isEn && topic.title_en ? topic.title_en : topic.title_ar;
  const summary = isEn ? topic.summary_en : topic.summary_ar;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.icuNursing"), path: "/icu-nursing" }, { label: title }]} />

      <div className="mb-6 text-center print:hidden">
        <div className="text-5xl">{topic.icon || "🏥"}</div>
        <h1 className="mt-3 text-3xl font-black dark:text-white">{title}</h1>
        {summary && <p className="mt-2 text-slate-500 dark:text-slate-400">{summary}</p>}
      </div>

      <div className="mb-6 hidden text-center print:block">
        <h1 className="mt-3 text-2xl font-black">{title}</h1>
      </div>

      <div className={`${card} mb-6 flex flex-wrap items-center justify-between gap-3 p-4 print:hidden ${unlocked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10" : ""}`}>
        {unlocked ? (
          <>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ {t("icuPrint.unlockedNote")}</span>
            <button onClick={() => window.print()} className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white">
              {t("icuPrint.printNow")}
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {isEn ? "Want a clean, print-ready copy of this topic?" : "عايز نسخة قابلة للطباعة من الموضوع ده؟"}
            </span>
            <button onClick={buyPrint} className="rounded-full bg-rose-500 px-6 py-2 text-sm font-bold text-white">
              {t("icuPrint.perTopicBtn")}
            </button>
          </>
        )}
      </div>

      <div className="space-y-6">
        {topic.sections.map((s, i) => {
          const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
          const body = isEn && s.body_en ? s.body_en : s.body_ar;
          return (
            <section key={s.id || i} className={`${card} p-5`}>
              <h2 className="mb-3 text-lg font-black text-rose-600">{heading}</h2>
              {s.image_url && (
                <img src={s.image_url} alt={heading} className="mb-4 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              )}
              <div className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{body}</div>
            </section>
          );
        })}
      </div>

      {topic.sources && topic.sources.length > 0 && (
        <div className={`${card} mt-6 p-4 text-xs text-slate-400`}>
          <div className="mb-1 font-bold text-slate-500 dark:text-slate-400">{isEn ? "Sources" : "المصادر"}</div>
          <ul className="list-inside list-disc space-y-0.5">
            {topic.sources.map((src, i) => <li key={i}>{src}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-center print:hidden">
        <Link to="/icu-nursing" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">
          {isEn ? "← Back to ICU Nursing" : "← رجوع لقسم العناية المركزة"}
        </Link>
      </div>
    </div>
  );
}

export function ICUPrintAllPage() {
  const { t, lang } = useI18n();
  const isEn = lang === "en";
  const [topics, setTopics] = useState<IcuTopic[] | null>(null);
  const [searchParams] = useSearchParams();
  const unlocked = searchParams.get("unlocked") === "1";
  const { add } = useCart();
  const navigate = useNavigate();
  useSEO({ title: `${t("nav.icuNursing")} | ${isEn ? "Print All" : "طباعة الكل"} | NurseHub Egypt` });

  useEffect(() => {
    fetchIcuTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  const buyPrintAll = () => {
    add({
      productId: "icu-print-all",
      title: isEn ? "Print all ICU Nursing topics" : "طباعة كل مواضيع العناية المركزة",
      price: PRINT_ALL_PRICE,
      qty: 1,
    });
    navigate("/checkout");
  };

  if (topics === null) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">{t("common.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: t("nav.icuNursing"), path: "/icu-nursing" }, { label: isEn ? "Print All" : "طباعة الكل" }]} />

      <div className="mb-6 text-center print:hidden">
        <div className="text-5xl">🖨️</div>
        <h1 className="mt-3 text-3xl font-black dark:text-white">{isEn ? "Print All ICU Nursing Topics" : "طباعة كل مواضيع العناية المركزة"}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {isEn ? `All ${topics.length} topics, print-ready.` : `كل الـ ${topics.length} موضوعًا، جاهزين للطباعة.`}
        </p>
      </div>

      <div className={`${card} mb-6 flex flex-wrap items-center justify-between gap-3 p-4 print:hidden ${unlocked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10" : ""}`}>
        {unlocked ? (
          <>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ {t("icuPrint.unlockedNote")}</span>
            <button onClick={() => window.print()} className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white">
              {t("icuPrint.printNow")}
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {isEn ? "Unlock a print-ready copy of the entire ICU Nursing section." : "افتح نسخة قابلة للطباعة من قسم العناية المركزة كله."}
            </span>
            <button onClick={buyPrintAll} className="rounded-full bg-gradient-to-l from-rose-600 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow">
              {t("icuPrint.printAllBtn")}
            </button>
          </>
        )}
      </div>

      {!unlocked ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {topics.map((tp) => (
            <div key={tp.id} className={`${card} flex items-center gap-2 p-3 text-sm`}>
              <span className="text-xl">{tp.icon || "🏥"}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{isEn && tp.title_en ? tp.title_en : tp.title_ar}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {topics.map((tp) => {
            const title = isEn && tp.title_en ? tp.title_en : tp.title_ar;
            return (
              <div key={tp.id} style={{ breakBefore: "page" }}>
                <div className="mb-4 text-center">
                  <div className="text-4xl">{tp.icon || "🏥"}</div>
                  <h2 className="mt-2 text-2xl font-black dark:text-white">{title}</h2>
                  {(isEn ? tp.summary_en : tp.summary_ar) && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isEn ? tp.summary_en : tp.summary_ar}</p>
                  )}
                </div>
                <div className="space-y-6">
                  {tp.sections.map((s, i) => {
                    const heading = isEn && s.heading_en ? s.heading_en : s.heading_ar;
                    const body = isEn && s.body_en ? s.body_en : s.body_ar;
                    return (
                      <section key={s.id || i} className={`${card} p-5`}>
                        <h3 className="mb-3 text-lg font-black text-rose-600">{heading}</h3>
                        <div className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{body}</div>
                      </section>
                    );
                  })}
                </div>
                {tp.sources && tp.sources.length > 0 && (
                  <div className={`${card} mt-6 p-4 text-xs text-slate-400`}>
                    <div className="mb-1 font-bold text-slate-500 dark:text-slate-400">{isEn ? "Sources" : "المصادر"}</div>
                    <ul className="list-inside list-disc space-y-0.5">
                      {tp.sources.map((src, i) => <li key={i}>{src}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-center print:hidden">
        <Link to="/icu-nursing" className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">
          {isEn ? "← Back to ICU Nursing" : "← رجوع لقسم العناية المركزة"}
        </Link>
      </div>
    </div>
  );
}
