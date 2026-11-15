import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, CircleCheck, CircleHelp, CircleX, CloudOff, Droplet, Pill, Search, ShieldAlert, Shuffle, TriangleAlert, WifiOff } from "lucide-react";
import { useSEO } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { normalizeSearch } from "../lib/drugsListSearch";
import { drugPhoneticKeys, phoneticKey, phoneticScore } from "../lib/phonetic";
import { loadOfflineJson } from "../lib/offlineFile";
import { DoseRateCalculator, Dosage, IVDrip, PediatricDose } from "./ToolsPage";
import EmojiIcon from "../components/EmojiIcon";

/**
 * Shift mode (/shift): the bedside quick reference — drug dose lookup, IV compatibility, high-alert list, LASA pairs and the
 * dose/drip calculators on one page, with big touch targets. Data = static JSON from Cloudflare (public/shift, public/data),
 * saved on the device after the first visit so the page keeps working without a connection. No D1 / Supabase reads.
 */

type LiteDrug = {
  s: string; n?: string; ne?: string; g?: string; ge?: string; c?: string; ce?: string;
  d?: string; de?: string; x?: string; xe?: string; k?: string; ke?: string; h?: 1; w?: string; we?: string;
};
type IVRow = { id: string; drug_a: string; drug_b: string; drug_a_en?: string; drug_b_en?: string; status: "compatible" | "incompatible" | "consult"; reason?: string; reason_en?: string; nursing_action?: string; nursing_action_en?: string; source?: string; order_num?: number };
type HARow = { id: string; icon?: string; category_ar: string; category_en?: string; drugs: string[]; drugs_en?: string[]; safety_strategy?: string; safety_strategy_en?: string; order_num?: number };
type LasaRow = { id: string; drug_a: string; drug_b: string; tall_man_a?: string; tall_man_b?: string; notes?: string; notes_en?: string; order_num?: number };

type Tab = "drugs" | "iv" | "high" | "lasa" | "calc";
const TAB_KEY = "nh_shift_tab";

const L = {
  title: { ar: "وضع الشيفت", en: "Shift mode" },
  sub: { ar: "الجرعات والمحاليل والتحذيرات والحاسبات في صفحة واحدة — بتشتغل من غير نت بعد أول فتحة.", en: "Doses, IV compatibility, alerts and calculators on one page — works offline after the first visit." },
  ready: { ar: "جاهز من غير نت", en: "Ready offline" },
  loading: { ar: "بيتحفظ على موبايلك…", en: "Saving to your phone…" },
  offline: { ar: "انت أوفلاين — بنعرض النسخة المحفوظة", en: "You're offline — showing the saved copy" },
  failed: { ar: "محتاج نت أول مرة عشان نحفظ البيانات", en: "Needs a connection once to save the data" },
  tabs: {
    drugs: { ar: "الأدوية", en: "Drugs" }, iv: { ar: "توافق المحاليل", en: "IV compatibility" },
    high: { ar: "عالية الخطورة", en: "High alert" }, lasa: { ar: "أسماء متشابهة", en: "Look-alike names" }, calc: { ar: "الحاسبات", en: "Calculators" },
  },
  drugSearch: { ar: "اكتب اسم الدواء (عربي أو إنجليزي)…", en: "Type a drug name (Arabic or English)…" },
  ivSearch: { ar: "اكتب اسم دواء أو محلول…", en: "Type a drug or fluid…" },
  dose: { ar: "الجرعة", en: "Dose" }, contra: { ar: "موانع الاستعمال", en: "Contraindications" },
  nursing: { ar: "اعتبارات تمريضية", en: "Nursing considerations" }, warn: { ar: "تحذير", en: "Warning" },
  full: { ar: "الصفحة الكاملة", en: "Full page" }, highBadge: { ar: "عالي الخطورة", en: "High alert" },
  none: { ar: "مفيش نتائج — جرّب اسم تاني أو الاسم العلمي", en: "No results — try another or the generic name" },
  typeToStart: { ar: "ابدأ اكتب اسم الدواء — أو اختار من الأكثر بحثًا تحت", en: "Start typing a drug name" },
  status: { compatible: { ar: "متوافق", en: "Compatible" }, incompatible: { ar: "غير متوافق", en: "Incompatible" }, consult: { ar: "راجع الصيدلي", en: "Check with pharmacist" } },
  action: { ar: "الإجراء التمريضي", en: "Nursing action" }, strategy: { ar: "إستراتيجية الأمان", en: "Safety strategy" },
  disclaimer: { ar: "مرجع سريع للتذكير — التزم دايمًا بأمر الطبيب وبروتوكول المستشفى وراجع الصيدلي عند الشك.", en: "Quick reminder reference — always follow the order, hospital protocol, and check with the pharmacist when unsure." },
};

export default function ShiftPage() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const tx = (o: { ar: string; en: string }) => (ar ? o.ar : o.en);
  useSEO({ title: `${L.title[ar ? "ar" : "en"]} | NurseHub Egypt`, description: L.sub[ar ? "ar" : "en"] });

  const [tab, setTab] = useState<Tab>(() => { try { return (localStorage.getItem(TAB_KEY) as Tab) || "drugs"; } catch { return "drugs"; } });
  useEffect(() => { try { localStorage.setItem(TAB_KEY, tab); } catch { /* private mode */ } }, [tab]);

  const [drugs, setDrugs] = useState<LiteDrug[] | null>(null);
  const [iv, setIv] = useState<IVRow[] | null>(null);
  const [ha, setHa] = useState<HARow[] | null>(null);
  const [lasa, setLasa] = useState<LasaRow[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "device" | "failed">("loading");

  // Load (and save) everything on the first visit, so every tab works offline afterwards.
  useEffect(() => {
    let alive = true;
    const byOrder = <T extends { order_num?: number }>(a: T[]) => [...a].sort((x, y) => (x.order_num ?? 0) - (y.order_num ?? 0));
    Promise.allSettled([
      loadOfflineJson<{ drugs: LiteDrug[] }>("/shift/drugs-lite.json", "shift_drugs_v1"),
      loadOfflineJson<IVRow[]>("/data/iv_compatibility.json", "shift_iv_v1"),
      loadOfflineJson<HARow[]>("/data/high_alert_ref.json", "shift_ha_v1"),
      loadOfflineJson<LasaRow[]>("/data/lasa_pairs.json", "shift_lasa_v1"),
    ]).then(([d, i, h, l]) => {
      if (!alive) return;
      if (d.status === "fulfilled") setDrugs(d.value.data.drugs); else setDrugs([]);
      if (i.status === "fulfilled") setIv(byOrder(i.value.data)); else setIv([]);
      if (h.status === "fulfilled") setHa(byOrder(h.value.data)); else setHa([]);
      if (l.status === "fulfilled") setLasa(byOrder(l.value.data)); else setLasa([]);
      const all = [d, i, h, l];
      if (all.some((r) => r.status === "rejected")) setState("failed");
      else if (all.some((r) => r.status === "fulfilled" && r.value.fromDevice)) setState("device");
      else setState("ready");
    });
    return () => { alive = false; };
  }, []);

  const tabs: { id: Tab; icon: typeof Pill }[] = [
    { id: "drugs", icon: Pill }, { id: "iv", icon: Droplet }, { id: "high", icon: ShieldAlert }, { id: "lasa", icon: Shuffle }, { id: "calc", icon: Calculator },
  ];

  return (
    <div className="pb-12">
      <section className="nh-hero text-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <h1 className="text-2xl font-black sm:text-3xl">{tx(L.title)}</h1>
          <p className="mt-1.5 text-sm text-teal-50 sm:text-base">{tx(L.sub)}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold" role="status" aria-live="polite">
            {state === "loading" && <><CloudOff size={14} aria-hidden="true" />{tx(L.loading)}</>}
            {state === "ready" && <><CircleCheck size={14} className="text-emerald-300" aria-hidden="true" />{tx(L.ready)}</>}
            {state === "device" && <><WifiOff size={14} className="text-amber-300" aria-hidden="true" />{tx(L.offline)}</>}
            {state === "failed" && <><TriangleAlert size={14} className="text-amber-300" aria-hidden="true" />{tx(L.failed)}</>}
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-20 border-b border-slate-200 bg-[#F1F4F6]/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <nav className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-2.5" aria-label={tx(L.title)}>
          {tabs.map(({ id, icon: I }) => (
            <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-black transition ${tab === id ? "bg-[#153448] text-white dark:bg-[#168C91]" : "bg-white text-[#153448] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"}`}>
              <I size={18} aria-hidden="true" />{tx(L.tabs[id])}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-4">
        {tab === "drugs" && <DrugsTab drugs={drugs} ar={ar} tx={tx} />}
        {tab === "iv" && <IVTab rows={iv} ar={ar} tx={tx} />}
        {tab === "high" && <HighAlertTab rows={ha} ar={ar} tx={tx} />}
        {tab === "lasa" && <LasaTab rows={lasa} ar={ar} />}
        {tab === "calc" && (
          <div className="space-y-3">
            <DoseRateCalculator />
            <IVDrip />
            <Dosage />
            <PediatricDose />
          </div>
        )}
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{tx(L.disclaimer)}
        </p>
      </div>
    </div>
  );
}

type TabProps<T> = { rows: T[] | null; ar: boolean; tx: (o: { ar: string; en: string }) => string };
const Loading = () => <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>;
const inputCls = "w-full rounded-2xl border border-slate-200 bg-white py-3.5 pe-4 ps-11 text-base font-semibold text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} enterKeyHint="search" autoComplete="off" className={inputCls} />
    </label>
  );
}

function DrugsTab({ drugs, ar, tx }: { drugs: LiteDrug[] | null; ar: boolean; tx: (o: { ar: string; en: string }) => string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const index = useMemo(() => (drugs ?? []).map((d) => ({ d, key: normalizeSearch([d.n, d.ne, d.g, d.ge, d.c, d.ce].filter(Boolean).join(" | ")), name: normalizeSearch([d.n, d.ne].filter(Boolean).join(" ")), phon: drugPhoneticKeys([d.n, d.ne, d.g, d.ge]) })), [drugs]);
  const results = useMemo(() => {
    const n = normalizeSearch(q);
    if (!n) return index.filter((x) => x.d.h).map((x) => x.d).slice(0, 12); // nothing typed: show the high-alert drugs first
    const starts = index.filter((x) => x.name.split(" ").some((w) => w.startsWith(n)));
    const rest = index.filter((x) => !starts.includes(x) && x.key.includes(n));
    if (starts.length + rest.length === 0) {
      // sound-alike: "باراسيتامول" → Paracetamol, "ceftriaxon" → Ceftriaxone
      const qk = phoneticKey(q);
      return index.map((x) => ({ x, s: phoneticScore(qk, x.phon) })).filter((h) => h.s > 0).sort((a, b) => b.s - a.s).slice(0, 30).map((h) => h.x.d);
    }
    return [...starts, ...rest].slice(0, 30).map((x) => x.d);
  }, [index, q]);

  if (!drugs) return <Loading />;
  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder={tx(L.drugSearch)} />
      {!q && <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{tx(L.typeToStart)}</p>}
      {q && results.length === 0 && <p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{tx(L.none)}</p>}
      <ul className="space-y-2">
        {results.map((d) => {
          const isOpen = open === d.s;
          const dose = ar ? d.d || d.de : d.de || d.d;
          const contra = ar ? d.x || d.xe : d.xe || d.x;
          const nurse = ar ? d.k || d.ke : d.ke || d.k;
          const warn = ar ? d.w || d.we : d.we || d.w;
          return (
            <li key={d.s} className={`overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 ${d.h ? "border-red-200 dark:border-red-900" : "border-slate-200 dark:border-slate-800"}`}>
              <button onClick={() => setOpen(isOpen ? null : d.s)} aria-expanded={isOpen} className="flex min-h-16 w-full items-center gap-3 p-3 text-start">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${d.h ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-[#168C91]/10 text-[#127378] dark:text-teal-300"}`}>
                  {d.h ? <TriangleAlert size={22} aria-hidden="true" /> : <Pill size={22} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-base font-black text-[#153448] dark:text-white">{ar ? d.n || d.ne : d.ne || d.n}</span>
                    {d.n && d.ne && d.n !== d.ne && <span className="text-sm font-bold text-slate-500 dark:text-slate-400" dir="auto">{ar ? d.ne : d.n}</span>}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-600 dark:text-slate-400">{[ar ? d.c || d.ce : d.ce || d.c, ar ? d.g : d.ge || d.g].filter(Boolean).join(" · ")}</span>
                </span>
                {d.h && <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">{tx(L.highBadge)}</span>}
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-slate-100 p-4 text-sm leading-7 dark:border-slate-800">
                  {warn && <Field title={tx(L.warn)} tone="red" body={warn} />}
                  {dose && <Field title={tx(L.dose)} tone="teal" body={dose} />}
                  {contra && <Field title={tx(L.contra)} tone="amber" body={contra} />}
                  {nurse && <Field title={tx(L.nursing)} tone="slate" body={nurse} />}
                  {d.h && <p className="rounded-xl bg-red-50 p-2 text-xs font-bold text-red-800 dark:bg-red-500/10 dark:text-red-200">{ar ? "تحقق مستقل مزدوج مع ممرض تاني قبل التحضير والإعطاء." : "Independent double check with a second nurse before preparing and giving."}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/drug/${d.s}`} className="inline-flex min-h-11 items-center rounded-full bg-[#168C91] px-5 text-sm font-black text-white hover:bg-[#127378]">{tx(L.full)}</Link>
                    {d.h && <Link to="/drugs/high-alert-ref" className="inline-flex min-h-11 items-center rounded-full border border-red-300 px-5 text-sm font-black text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-500/10">{ar ? "إرشادات السلامة" : "Safety guidance"}</Link>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ title, body, tone }: { title: string; body: string; tone: "teal" | "red" | "amber" | "slate" }) {
  const c = { teal: "text-[#127378] dark:text-teal-300", red: "text-red-700 dark:text-red-300", amber: "text-amber-700 dark:text-amber-300", slate: "text-slate-700 dark:text-slate-300" }[tone];
  return (
    <div>
      <div className={`text-xs font-black ${c}`}>{title}</div>
      <div className="whitespace-pre-line text-slate-800 dark:text-slate-200">{body}</div>
    </div>
  );
}

function IVTab({ rows, ar, tx }: TabProps<IVRow>) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = normalizeSearch(q);
    return (rows ?? []).filter((r) => !n || normalizeSearch([r.drug_a, r.drug_b, r.drug_a_en, r.drug_b_en].filter(Boolean).join(" ")).includes(n));
  }, [rows, q]);
  if (!rows) return <Loading />;
  const tone = {
    compatible: { box: "border-emerald-200 dark:border-emerald-900", pill: "bg-emerald-600", I: CircleCheck },
    incompatible: { box: "border-red-200 dark:border-red-900", pill: "bg-red-600", I: CircleX },
    consult: { box: "border-amber-200 dark:border-amber-900", pill: "bg-amber-600", I: CircleHelp },
  };
  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder={tx(L.ivSearch)} />
      {list.length === 0 && <p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">{tx(L.none)}</p>}
      {list.map((r) => {
        const t = tone[r.status] ?? tone.consult;
        return (
          <article key={r.id} className={`rounded-2xl border bg-white p-4 dark:bg-slate-900 ${t.box}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-black text-[#153448] dark:text-white">{ar ? r.drug_a : r.drug_a_en || r.drug_a} <span className="text-slate-400">+</span> {ar ? r.drug_b : r.drug_b_en || r.drug_b}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black text-white ${t.pill}`}><t.I size={14} aria-hidden="true" />{tx(L.status[r.status] ?? L.status.consult)}</span>
            </div>
            {(ar ? r.reason : r.reason_en || r.reason) && <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{ar ? r.reason : r.reason_en || r.reason}</p>}
            {(ar ? r.nursing_action : r.nursing_action_en || r.nursing_action) && (
              <p className="mt-2 rounded-xl bg-[#F1F4F6] p-3 text-sm leading-7 text-slate-800 dark:bg-slate-800 dark:text-slate-200"><b className="text-[#127378] dark:text-teal-300">{tx(L.action)}: </b>{ar ? r.nursing_action : r.nursing_action_en || r.nursing_action}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function HighAlertTab({ rows, ar, tx }: TabProps<HARow>) {
  if (!rows) return <Loading />;
  return (
    <>
    <Link to="/drugs/high-alert-ref" className="mb-3 inline-flex min-h-11 items-center rounded-full border border-red-300 px-5 text-sm font-black text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300">{ar ? "المرجع الكامل للأدوية عالية الخطورة ←" : "Full high-alert reference →"}</Link>
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <article key={r.id} className="rounded-2xl border border-red-200 bg-white p-4 dark:border-red-900 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-base font-black text-red-700 dark:text-red-300">
            <EmojiIcon emoji={r.icon} fallback="⚠" size={20} />{ar ? r.category_ar : r.category_en || r.category_ar}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {(ar ? r.drugs : r.drugs_en?.length ? r.drugs_en : r.drugs).map((d) => <li key={d} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-800 dark:bg-red-500/10 dark:text-red-200" dir="auto">{d}</li>)}
          </ul>
          {(ar ? r.safety_strategy : r.safety_strategy_en || r.safety_strategy) && (
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300"><b className="text-[#127378] dark:text-teal-300">{tx(L.strategy)}: </b>{ar ? r.safety_strategy : r.safety_strategy_en || r.safety_strategy}</p>
          )}
        </article>
      ))}
    </div>
    </>
  );
}

function LasaTab({ rows, ar }: { rows: LasaRow[] | null; ar: boolean }) {
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xl font-black tracking-wide text-[#153448] dark:text-white" dir="ltr">
            <span>{r.tall_man_a || r.drug_a}</span><Shuffle size={18} className="text-amber-500" aria-hidden="true" /><span>{r.tall_man_b || r.drug_b}</span>
          </div>
          {(ar ? r.notes : r.notes_en || r.notes) && <p className="mt-2 text-center text-sm leading-7 text-slate-700 dark:text-slate-300">{ar ? r.notes : r.notes_en || r.notes}</p>}
        </article>
      ))}
    </div>
  );
}
