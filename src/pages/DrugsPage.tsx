import { Fragment, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSEO } from "../lib/seo";
import { useI18n, bilingual } from "../lib/i18n";
import InlineLangToggle from "../components/InlineLangToggle";
import DrugCard from "../components/drugs/DrugCard";
import { indexDrugs, searchDrugs } from "../lib/drugsListSearch";

const PAGE = 40;
const KEY = "nh_drugs_list_v1";

type Saved = { q: string; cat: string; letter: string; sort: string; visible: number; y: number; key: string; ts: number };

const L = {
  home: { ar: "الرئيسية", en: "Home" },
  searchPh: { ar: "ابحث بالاسم أو الاسم العلمي أو دواعي الاستعمال…", en: "Search by name, generic name or indication…" },
  clear: { ar: "مسح البحث", en: "Clear search" },
  results: { ar: "نتيجة", en: "results" },
  reset: { ar: "إعادة ضبط الفلاتر", en: "Reset filters" },
  loadMore: { ar: "عرض المزيد", en: "Show more" },
  remaining: { ar: "متبقي", en: "left" },
  byInd: { ar: "مطابقة في الصنف أو دواعي الاستعمال", en: "Matches in class or indications" },
  noRes: { ar: "لا توجد نتائج مطابقة", en: "No matching drugs" },
  hint: { ar: "جرّب الاسم الإنجليزي أو الاسم العلمي أو كلمة من دواعي الاستعمال.", en: "Try the English name, the generic name, or a word from the indications." },
  filters: { ar: "تصفية حسب الفئة", en: "Filter by category" },
  letters: { ar: "الحرف الأول", en: "First letter" },
  allShort: { ar: "الكل", en: "All" },
};

/** Saved list state is only valid for the very same history entry and for a short time, so it can never resurface in a fresh visit. */
function readSaved(key: string): Saved | null {
  try {
    const r = sessionStorage.getItem(KEY);
    const s = r ? (JSON.parse(r) as Saved) : null;
    return s && s.key === key && Date.now() - s.ts < 30 * 60 * 1000 ? s : null;
  } catch { return null; }
}
function clearSaved() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

export default function DrugsListPage() {
  const { drugs, settings } = useStore();
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const navType = useNavigationType();
  const location = useLocation();
  // Only a "back" navigation (POP) may restore the previous list state; any fresh visit starts clean.
  const saved = useRef<Saved | null>(navType === "POP" ? readSaved(location.key) : null).current;

  const [q, setQ] = useState(saved?.q ?? "");
  const [cat, setCat] = useState(saved?.cat ?? params.get("cat") ?? "");
  const [letter, setLetter] = useState(saved?.letter ?? "");
  const [sort, setSort] = useState(saved?.sort ?? "alpha");
  const [visible, setVisible] = useState(saved?.visible ?? PAGE);
  const highAlertOnly = params.get("high") === "1";
  const dq = useDeferredValue(q);

  useEffect(() => { if (!saved) clearSaved(); }, [saved]);

  // Restore the scroll position after the list has rendered (the page can be very tall).
  useEffect(() => {
    if (!saved) return;
    let tries = 0;
    let raf = 0;
    const go = () => {
      window.scrollTo(0, saved.y);
      const reached = Math.abs(window.scrollY - saved.y) < 4;
      if (!reached && tries++ < 40) raf = requestAnimationFrame(go);
      else clearSaved();
    };
    raf = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf);
  }, [saved]);

  const saveState = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ q, cat, letter, sort, visible, y: window.scrollY, key: location.key, ts: Date.now() } satisfies Saved)); } catch { /* ignore */ }
  };

  useSEO({
    title: `${t("drugs.allDrugs")} | ${settings.siteName}`,
    description: t("drugs.seoDesc"),
    keywords: "أدوية, دليل أدوية, جرعات, تمريض, دواء",
  });

  const index = useMemo(() => indexDrugs(drugs), [drugs]);
  const categories = useMemo(() => {
    const m = new Map<string, { n: number; en?: string }>();
    drugs.forEach((d) => {
      const cur = m.get(d.category) || { n: 0, en: d.categoryEn };
      cur.n += 1; if (!cur.en && d.categoryEn) cur.en = d.categoryEn;
      m.set(d.category, cur);
    });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [drugs]);
  const letters = useMemo(() => Array.from(new Set(drugs.map((d) => d.name[0].toUpperCase()))).sort(), [drugs]);

  const { list, nameCount } = useMemo(() => {
    const accept = (d: (typeof drugs)[number]) =>
      (!cat || d.category === cat) && (!letter || d.name.toUpperCase().startsWith(letter)) && (!highAlertOnly || !!d.isHighAlert);
    const split = searchDrugs(index, dq, accept);
    const cmp = (a: (typeof drugs)[number], b: (typeof drugs)[number]) => (sort === "alpha" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    const a = [...split.byName].sort(cmp);
    const b = [...split.byIndication].sort(cmp);
    return { list: [...a, ...b], nameCount: a.length };
  }, [index, dq, cat, letter, sort, highAlertOnly]);

  const filtersActive = !!(q || cat || letter || highAlertOnly);
  const touch = () => setVisible(PAGE);
  const toggleHighAlert = () => {
    const next = new URLSearchParams(params);
    if (highAlertOnly) next.delete("high"); else next.set("high", "1");
    setParams(next, { replace: true });
    touch();
  };
  const resetAll = () => {
    setQ(""); setCat(""); setLetter(""); touch();
    const next = new URLSearchParams(params); next.delete("high"); next.delete("cat");
    setParams(next, { replace: true });
  };

  const shown = list.slice(0, visible);
  const chip = (active: boolean) =>
    `shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91] ${
      active
        ? "border-[#168C91] bg-[#168C91] text-white"
        : "border-slate-200 bg-white text-[#153448] hover:border-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    }`;

  return (
    <div className="bg-[#F1F4F6] pb-12 dark:bg-slate-950">
      <header className="relative overflow-hidden bg-[#153448] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
        <div aria-hidden className="pointer-events-none absolute -top-20 end-[-5rem] h-60 w-60 rounded-full bg-[#168C91]/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-4 md:pb-6 md:pt-6">
          <div className="flex items-start justify-between gap-3">
            <nav aria-label="Breadcrumb" className="text-xs text-slate-300 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link to="/" className="hover:text-teal-200">{L.home[lang]}</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link to="/drugs" className="hover:text-teal-200">{t("drugs.title")}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-semibold text-white">{t("drugs.allDrugs")}</li>
              </ol>
            </nav>
            <InlineLangToggle light />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <h1 className="text-2xl font-black md:text-3xl">{t("drugs.allDrugs")}</h1>
            <span className="text-sm text-teal-200">{drugs.length} {t("drugs.count")}</span>
          </div>
          <div className="relative mt-3 max-w-2xl">
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); touch(); }}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              aria-label={L.searchPh[lang]}
              placeholder={L.searchPh[lang]}
              className="w-full rounded-2xl border-0 bg-white py-3 ps-11 pe-11 text-slate-800 shadow-lg outline-none ring-2 ring-white/30 focus:ring-[#168C91] placeholder:text-slate-400 dark:bg-slate-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
            />
            <span aria-hidden="true" className="pointer-events-none absolute start-4 top-3 text-lg text-slate-400">🔍</span>
            {q && (
              <button type="button" aria-label={L.clear[lang]} onClick={() => { setQ(""); touch(); }} className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <section aria-label={L.filters[lang]} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          <button type="button" onClick={toggleHighAlert} aria-pressed={highAlertOnly}
            className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold transition ${highAlertOnly ? "border-red-600 bg-red-600 text-white" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300"}`}>
            ⚠ {t("drugs.highAlertBadge")}
          </button>
          <button type="button" onClick={() => { setCat(""); touch(); }} aria-pressed={!cat} className={chip(!cat)}>{t("drugs.allCats")}</button>
          {categories.map(([c, info]) => (
            <button key={c} type="button" onClick={() => { setCat(cat === c ? "" : c); touch(); }} aria-pressed={cat === c} className={chip(cat === c)}>
              {bilingual(c, info.en, lang).text} <span className="opacity-70">{info.n}</span>
            </button>
          ))}
        </section>

        <section aria-label={L.letters[lang]} className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          <button type="button" onClick={() => { setLetter(""); touch(); }} aria-pressed={!letter} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${!letter ? "bg-[#153448] text-white" : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{L.allShort[lang]}</button>
          {letters.map((l) => (
            <button key={l} type="button" onClick={() => { setLetter(letter === l ? "" : l); touch(); }} aria-pressed={letter === l} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${letter === l ? "bg-[#153448] text-white" : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{l}</button>
          ))}
        </section>

        <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            <span className="font-bold text-[#153448] dark:text-white">{list.length} {L.results[lang]}</span>
            {filtersActive && (
              <button type="button" onClick={resetAll} className="font-bold text-[#168C91] underline-offset-2 hover:underline dark:text-teal-300">{L.reset[lang]}</button>
            )}
          </div>
          <select aria-label={t("drugs.sortAZ")} value={sort} onChange={(e) => { setSort(e.target.value); touch(); }} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-[#153448] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#168C91] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="alpha">{t("drugs.sortAZ")}</option>
            <option value="alphaDesc">{t("drugs.sortZA")}</option>
          </select>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="font-bold text-[#153448] dark:text-white">{L.noRes[lang]}</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{L.hint[lang]}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((d, i) => (
                <Fragment key={d.id}>
                  {q.trim() && i === nameCount && nameCount < list.length && (
                    <h2 className="col-span-full mt-3 border-s-4 border-[#168C91] ps-3 text-base font-black text-[#153448] dark:text-white">{L.byInd[lang]}</h2>
                  )}
                  <DrugCard d={d} onOpen={saveState} />
                </Fragment>
              ))}
            </div>
            {visible < list.length && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="rounded-full bg-[#153448] px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-[#168C91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168C91]">
                  {L.loadMore[lang]} ({list.length - visible} {L.remaining[lang]})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
