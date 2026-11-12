// src/pages/LabPages.tsx
// "التحاليل ودلالاتها": a lab-report styled section (own identity, not the disease template).
//   LabHub   — /section/lab-reference : result checker, tube guide, panels, the 3 guides
//   LabGuide — /guide/dis-56x         : reader where every reference table becomes a lab "report sheet"

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDisease, fetchDiseaseIndex, fetchImageOverrides, pick, sectionsFor, type Disease, type DiseaseIndexItem } from '../lib/diseasesApi';
import { Breadcrumbs } from '../components/common';
import InlineLangToggle from '../components/InlineLangToggle';
import { ImageLightbox } from '../components/Lightbox';
import { useSEO } from '../lib/seo';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/theme';
import { Prose, Quiz } from './DiseasesPage';

// ---------------------------------------------------------------------------
// Parsing: h4 + 2-column table  ->  panel of test rows with a parsed normal range
// ---------------------------------------------------------------------------
type Variant = { label: string; min?: number; max?: number };
type Row = { name: string; value: string; variants: Variant[] };
type Block = { kind: 'panel'; title: string; head: [string, string]; rows: Row[] } | { kind: 'html'; html: string };

const NUM = /(\d+(?:\.\d+)?)/;

function parseVariant(seg: string): Variant | null {
  const t = seg.replace(/(\d),(\d{3})/g, '$1$2').trim();
  if (!NUM.test(t)) return null;
  const label = t.split(/[\d<>≤≥]/)[0].replace(/(حتى|أقل من|اقل من|أكبر من|اكبر من|أعلى من|up to)\s*$/i, '').replace(/[:：]\s*$/, '').trim();
  const range = /(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/.exec(t);
  if (range) return { label, min: parseFloat(range[1]), max: parseFloat(range[2]) };
  const n = parseFloat(NUM.exec(t)![1]);
  if (/حتى|أقل من|اقل من|<|≤|up to|لا يزيد/i.test(t)) return { label: label === t ? '' : label, max: n };
  if (/أكبر من|اكبر من|أعلى من|>|≥|لا يقل/i.test(t)) return { label: label === t ? '' : label, min: n };
  return null;
}

function parseValue(value: string): Variant[] {
  if (value.includes('÷') || /\(العمر/.test(value)) return [];
  const segs = value.split('|').map((x) => x.trim());
  const vs = segs.map(parseVariant);
  if (vs.some((v) => !v)) {
    // a single value with a trailing note: try the first segment only
    const first = parseVariant(segs[0].replace(/\(.*$/, ''));
    return first && segs.length === 1 ? [first] : [];
  }
  return vs as Variant[];
}

function parseSection(html: string): Block[] {
  if (typeof DOMParser === 'undefined' || !html) return [{ kind: 'html', html }];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  const out: Block[] = [];
  const pushHtml = (h: string) => {
    if (!h.trim()) return;
    const last = out[out.length - 1];
    if (last && last.kind === 'html') last.html += h;
    else out.push({ kind: 'html', html: h });
  };
  const toPanel = (title: string, table: HTMLTableElement): Block | null => {
    const heads = Array.from(table.querySelectorAll('thead th')).map((x) => x.textContent?.trim() || '');
    const trs = Array.from(table.querySelectorAll('tbody tr'));
    if (heads.length !== 2 || !trs.length || trs.some((tr) => tr.children.length !== 2)) return null;
    return {
      kind: 'panel',
      title,
      head: [heads[0], heads[1]],
      rows: trs.map((tr) => {
        const v = tr.children[1].textContent?.trim() || '';
        return { name: tr.children[0].textContent?.trim() || '', value: v, variants: /القيمة|Value|BMI|الطبيعي|Normal|Range|Reference|Cutoff/i.test(heads[1]) ? parseValue(v) : [] };
      }),
    };
  };
  const kids = Array.from(root.childNodes);
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i];
    if (n.nodeType === 3) {
      pushHtml((n as Text).data);
      continue;
    }
    const el = n as HTMLElement;
    if (el.tagName === 'H4') {
      const nx = kids[i + 1] as HTMLElement | undefined;
      if (nx && nx.tagName === 'TABLE') {
        const p = toPanel(el.textContent || '', nx as HTMLTableElement);
        if (p) {
          out.push(p);
          i++;
          continue;
        }
      }
    }
    if (el.tagName === 'TABLE') {
      const p = toPanel('', el as HTMLTableElement);
      if (p) {
        out.push(p);
        continue;
      }
    }
    pushHtml(el.outerHTML);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------
const PANEL_COLORS: [RegExp, string, string][] = [
  [/CBC|الدم الكاملة/i, '#e11d48', '🩸'],
  [/التجلط|Coag/i, '#2563eb', '⏱️'],
  [/الأملاح|Electrolyte/i, '#d97706', '🧂'],
  [/الحديد|Iron/i, '#ea580c', '🔩'],
  [/الكبد|LFT/i, '#059669', '🫘'],
  [/الكلى|KFT/i, '#0891b2', '💧'],
  [/غازات|ABG/i, '#0284c7', '🫁'],
  [/الدهون|Lipid/i, '#ca8a04', '🧈'],
  [/الدرقية|Thyroid/i, '#7c3aed', '🦋'],
  [/BMI|كتلة/i, '#db2777', '⚖️'],
  [/القلب|Cardiac/i, '#be123c', '🫀'],
  [/الورم|المناعة|marker/i, '#a21caf', '🧬'],
  [/متنوعة/i, '#475569', '🧪'],
  [/الصيام/i, '#0d9488', '⏱️'],
  [/GTT|السكر/i, '#c2410c', '🍬'],
  [/البول/i, '#b45309', '🧴'],
  [/البراز|البصاق|المسحات/i, '#4d7c0f', '🧫'],
  [/فيدال|Widal/i, '#0f766e', '🧫'],
];
const panelStyle = (title: string) => {
  const m = PANEL_COLORS.find(([re]) => re.test(title));
  return { color: m?.[1] ?? '#0f766e', icon: m?.[2] ?? '🧪' };
};

type Status = 'low' | 'ok' | 'high';
const STATUS_UI: Record<Status, { ar: string; en: string; cls: string; dot: string }> = {
  low: { ar: 'أقل من الطبيعي', en: 'Below normal', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200', dot: '#0ea5e9' },
  ok: { ar: 'طبيعي', en: 'Normal', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200', dot: '#10b981' },
  high: { ar: 'أعلى من الطبيعي', en: 'Above normal', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200', dot: '#f43f5e' },
};
const judge = (v: number, r: Variant): Status => (r.min !== undefined && v < r.min ? 'low' : r.max !== undefined && v > r.max ? 'high' : 'ok');

function Gauge({ v, r, value }: { v: Variant; r: Variant; value: number }) {
  const hasBoth = r.min !== undefined && r.max !== undefined;
  const span = hasBoth ? r.max! - r.min! : Math.max(Math.abs(r.max ?? r.min ?? 1), 1) * 0.6;
  const lo = hasBoth ? Math.max(r.min! - span * 0.8, r.min! >= 0 ? 0 : -Infinity) : r.min !== undefined ? r.min - span : Math.max(0, (r.max ?? 0) - span * 1.6);
  const hi = hasBoth ? r.max! + span * 0.8 : r.min !== undefined ? r.min + span * 1.6 : (r.max ?? 0) + span;
  const pct = (x: number) => Math.min(100, Math.max(0, ((x - lo) / (hi - lo)) * 100));
  const a = r.min !== undefined ? pct(r.min) : 0;
  const b = r.max !== undefined ? pct(r.max) : 100;
  const st = judge(value, r);
  return (
    <div className="relative mt-2 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700" dir="ltr" aria-hidden="true" data-v={v.label}>
      <div className="absolute top-0 h-full bg-emerald-400/70" style={{ left: `${a}%`, width: `${Math.max(b - a, 1)}%` }} />
      <div className="absolute -top-1 h-5 w-1.5 rounded-full shadow" style={{ left: `calc(${pct(value)}% - 3px)`, background: STATUS_UI[st].dot }} />
    </div>
  );
}

function LabRow({ row, color, ar }: { row: Row; color: string; ar: boolean }) {
  const [val, setVal] = useState('');
  const [vi, setVi] = useState(0);
  const checkable = row.variants.length > 0;
  const variant = row.variants[Math.min(vi, row.variants.length - 1)];
  const num = parseFloat(val.replace(',', '.'));
  const has = checkable && val.trim() !== '' && !Number.isNaN(num);
  const st = has ? judge(num, variant) : null;
  return (
    <div className="border-b border-dashed border-slate-200 px-4 py-3 last:border-0 dark:border-slate-700/70">
      <div className="font-bold leading-snug text-slate-800 dark:text-slate-100">{row.name}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {row.value.split('|').map((seg, i) => (
          <span key={i} className="rounded-lg px-2.5 py-1 text-sm font-black tabular-nums leading-snug" style={{ background: `${color}14`, color }} dir="auto">
            {seg.trim()}
          </span>
        ))}
      </div>
      {checkable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {row.variants.length > 1 && (
            <select value={vi} onChange={(e) => setVi(parseInt(e.target.value, 10))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              {row.variants.map((x, i) => (
                <option key={i} value={i}>{x.label || (ar ? 'القيمة' : 'Value')}</option>
              ))}
            </select>
          )}
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={ar ? 'اكتب نتيجتك…' : 'Enter result…'}
            className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm tabular-nums outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            dir="ltr"
          />
          {st && <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${STATUS_UI[st].cls}`}>{ar ? STATUS_UI[st].ar : STATUS_UI[st].en}</span>}
        </div>
      )}
      {has && st && <Gauge v={variant} r={variant} value={num} />}
    </div>
  );
}

function Panel({ block, id, ar }: { block: Extract<Block, { kind: 'panel' }>; id: string; ar: boolean }) {
  const { color, icon } = panelStyle(block.title);
  return (
    <section id={id} className="lab-sheet scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {block.title && (
        <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-xl">{icon}</span>
          <h3 className="text-base font-black leading-snug">{block.title}</h3>
          <span className="ms-auto rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-bold">{block.rows.length} {ar ? 'تحليل' : 'tests'}</span>
        </header>
      )}
      <div className="flex justify-between bg-slate-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400 dark:bg-slate-800/60">
        <span>{block.head[0]}</span>
        <span>{block.head[1]}</span>
      </div>
      {block.rows.map((r, i) => (
        <LabRow key={i} row={r} color={color} ar={ar} />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tube guide (own drawing): cap colours and what each tube is for
// ---------------------------------------------------------------------------
const TUBES = [
  { c: '#dc2626', t: 'أحمر / ذهبي', u: 'سيرم: كيمياء، كبد، كلى، هرمونات، مناعة', n: 'من غير مانع تجلط', te: 'Red / gold', ue: 'Serum: chemistry, liver, kidney, hormones, immunology', ne: 'No anticoagulant' },
  { c: '#7c3aed', t: 'بنفسجي', u: 'EDTA: صورة دم CBC وفصيلة الدم', n: 'يتقلّب برفق', te: 'Lavender', ue: 'EDTA: CBC and blood group', ne: 'Invert gently' },
  { c: '#60a5fa', t: 'أزرق فاتح', u: 'سترات: تحاليل التجلط PT / aPTT', n: 'لازم يتملي للخط بالظبط', te: 'Light blue', ue: 'Citrate: coagulation tests PT / aPTT', ne: 'Must be filled exactly to the line' },
  { c: '#16a34a', t: 'أخضر', u: 'هيبارين: غازات وبعض الكيمياء', n: 'يتقلّب برفق', te: 'Green', ue: 'Heparin: gases and some chemistry', ne: 'Invert gently' },
  { c: '#6b7280', t: 'رمادي', u: 'فلوريد: سكر الدم (يوقف تكسير الجلوكوز)', n: 'للسكر واللاكتات', te: 'Grey', ue: 'Fluoride: blood glucose (stops glucose breakdown)', ne: 'For glucose and lactate' },
];
function TubeRack() {
  return (
    <svg viewBox="0 0 360 120" className="h-24 w-full max-w-sm" role="img" aria-label="Sample tubes">
      {TUBES.map((t, i) => (
        <g key={i} transform={`translate(${24 + i * 66},6)`}>
          <rect x="0" y="0" width="26" height="14" rx="3" fill={t.c} />
          <rect x="3" y="14" width="20" height="92" rx="8" fill="#e2e8f0" opacity=".7" stroke="#94a3b8" strokeWidth="1.2" />
          <rect x="5" y={68 - i * 5} width="16" height={36 + i * 5} rx="6" fill={t.c} opacity=".55" />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hub
// ---------------------------------------------------------------------------
export function LabHub() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [guides, setGuides] = useState<DiseaseIndexItem[]>([]);
  const [ref, setRef] = useState<Disease | null>(null);
  const [q, setQ] = useState('');
  useSEO({
    title: ar ? 'التحاليل ودلالاتها | NurseHub Egypt' : 'Lab Tests & Meaning | NurseHub Egypt',
    description: ar ? 'القيم الطبيعية للتحاليل مع فاحص نتيجة فوري، وتحضير المريض وجمع العينات، ومفاتيح تشخيص التحاليل.' : 'Normal lab values with an instant result checker, patient preparation, specimens and diagnostic lab pearls.',
  });
  useEffect(() => {
    void fetchDiseaseIndex().then((all) => setGuides(all.filter((i) => i.target === 'lab-reference')));
    void fetchDisease('dis-560').then(setRef);
  }, []);

  const panels = useMemo(() => {
    if (!ref) return [] as { sec: string; block: Extract<Block, { kind: 'panel' }> }[];
    const out: { sec: string; block: Extract<Block, { kind: 'panel' }> }[] = [];
    for (const k of Object.keys(ref.sections)) {
      for (const b of parseSection(pick(ref.sections[k as keyof typeof ref.sections], ar) || '')) if (b.kind === 'panel') out.push({ sec: k, block: b });
    }
    return out;
  }, [ref, ar]);

  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const rows: { row: Row; panel: string; color: string }[] = [];
    for (const p of panels) for (const r of p.block.rows) if (r.name.toLowerCase().includes(s)) rows.push({ row: r, panel: p.block.title, color: panelStyle(p.block.title).color });
    return rows.slice(0, 12);
  }, [q, panels]);

  const ref560 = guides.find((g) => g.id === 'dis-560');
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'التحاليل ودلالاتها' : 'Lab Tests & Meaning' }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="lab-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-9">
        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black tracking-wider text-teal-200">🧫 LAB REPORT · {ar ? 'مرجع المعمل' : 'LAB REFERENCE'}</div>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">{ar ? 'التحاليل ودلالاتها' : 'Lab Tests & Meaning'}</h1>
            <p className="mt-3 max-w-xl text-teal-50/90">
              {ar ? 'اكتب اسم التحليل وقيمة نتيجتك، وشوف فوراً: طبيعي ولا أعلى ولا أقل. وكمان تحضير المريض، وجمع العينات، ومفاتيح بتخلّيك تفهم التقرير.' : 'Type a test and your result and see instantly whether it is normal, high or low — plus patient prep, specimen collection and diagnostic pearls.'}
            </p>
          </div>
          <div className="mx-auto"><TubeRack /></div>
        </div>
      </div>

      {/* instant checker */}
      <div className="lab-sheet mt-6 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm dark:border-teal-500/30 dark:bg-slate-900">
        <div className="mb-2 flex items-center gap-2 font-black text-teal-700 dark:text-teal-300">⚡ {ar ? 'فاحص النتيجة السريع' : 'Quick result checker'}</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? '🔎 ابحث عن تحليل: Hb، كرياتينين، SGPT، TSH، فيتامين…' : '🔎 Search a test: Hb, creatinine, SGPT, TSH…'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        {q.trim() && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {found.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">{ar ? 'مفيش تحليل بالاسم ده، جرّب اسم تاني أو الاختصار.' : 'No match.'}</div>
            ) : (
              found.map((f, i) => (
                <div key={i}>
                  <div className="bg-slate-50 px-4 pt-2 text-[11px] font-bold text-slate-400 dark:bg-slate-800/50">{f.panel}</div>
                  <LabRow row={f.row} color={f.color} ar={ar} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* panels */}
      {panels.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">🧪 {ar ? 'اختر مجموعة التحاليل' : 'Choose a panel'}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {panels.map((p, i) => {
              const st = panelStyle(p.block.title);
              return (
                <Link key={i} to={`/guide/dis-560#${p.sec}`} className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <div className="grid h-10 w-10 place-items-center rounded-xl text-xl text-white" style={{ background: st.color }}>{st.icon}</div>
                  <div className="mt-2 text-sm font-black leading-snug text-slate-800 group-hover:underline dark:text-slate-100">{p.block.title.replace(/\s*[—(].*$/, '')}</div>
                  <div className="text-[11px] text-slate-400">{p.block.rows.length} {ar ? 'تحليل' : 'tests'}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* tubes */}
      <div className="lab-sheet mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-1 text-xl font-black text-slate-900 dark:text-white">🩸 {ar ? 'ألوان أنابيب الدم' : 'Blood tube colours'}</h2>
        <p className="mb-3 text-xs text-slate-500">{ar ? 'القاعدة العامة المتعارف عليها؛ سياسة المعمل عندك هي المرجع.' : 'General convention; your laboratory’s policy is the reference.'}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TUBES.map((t) => (
            <div key={t.t} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 dark:border-slate-800">
              <span className="h-9 w-4 shrink-0 rounded-md" style={{ background: t.c }} />
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-800 dark:text-slate-100">{ar ? t.t : t.te}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{ar ? t.u : t.ue} — {ar ? t.n : t.ne}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          {ar ? 'ترتيب السحب الشائع: مزرعة دم ← أزرق فاتح ← أحمر/ذهبي ← أخضر ← بنفسجي ← رمادي (عشان ما تتنقلش المواد بين الأنابيب).' : 'Common order of draw: blood culture → light blue → red/gold → green → lavender → grey.'}
        </div>
      </div>

      {/* the guides */}
      <div className="mt-8">
        <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">📚 {ar ? 'الأدلة' : 'Guides'}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {guides.map((g, i) => (
            <Link key={g.id} to={`/guide/${g.id}`} className="group relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl" style={{ background: ['linear-gradient(135deg,#0f766e,#0e7490)', 'linear-gradient(135deg,#7c3aed,#4f46e5)', 'linear-gradient(135deg,#be123c,#c2410c)'][i % 3] }}>
              <div className="text-4xl">{['📊', '🧫', '🔑'][i % 3]}</div>
              <h3 className="mt-2 text-lg font-black leading-snug">{pick(g.title, ar)}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-white/85">{pick(g.teaser, ar)}</p>
              <div className="mt-3 text-xs font-black text-white/90">{ar ? 'افتح الدليل ←' : 'Open →'}</div>
            </Link>
          ))}
        </div>
        {ref560 && <p className="sr-only">{ref560.id}</p>}
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">{ar ? 'القيم مرجعية تقريبية وتختلف حسب المعمل والجهاز والعمر والجنس؛ اعتمد على المدى المطبوع في التقرير.' : 'Values are approximate references; rely on the range printed in your lab report.'}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reader for the lab guides
// ---------------------------------------------------------------------------
export function LabGuide({ d, ar }: { d: Disease; ar: boolean }) {
  const { loggedIn } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);
  const refresh = () => void fetchImageOverrides(true).then(setOverrides);
  useEffect(() => {
    void fetchImageOverrides().then(setOverrides);
  }, []);
  useSEO({ title: `${pick(d.title, ar)} | NurseHub Egypt`, description: pick(d.teaser, ar) });

  const secs = sectionsFor('lab-reference', d).filter((s) => d.sections[s.key]);
  const parsed = useMemo(() => secs.map((s) => ({ s, blocks: parseSection(pick(d.sections[s.key], ar) || '') })), [d, ar]); // eslint-disable-line react-hooks/exhaustive-deps
  const tabs: { id: string; label: string }[] = [];
  parsed.forEach(({ s, blocks }) => {
    blocks.forEach((b, i) => b.kind === 'panel' && b.title && tabs.push({ id: `${s.key}-${i}`, label: b.title.replace(/\s*[—(].*$/, '') }));
  });
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (h) setTimeout(() => go(h), 400);
  }, [d.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'التحاليل ودلالاتها' : 'Lab Tests', path: '/section/lab-reference' }, { label: pick(d.title, ar) }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <header className="lab-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-wider text-teal-200">🧾 LAB GUIDE</div>
          <h1 className="mt-3 text-2xl font-black leading-snug sm:text-4xl">{pick(d.title, ar)}</h1>
          <p className="mt-2 max-w-2xl text-teal-50/90">{pick(d.teaser, ar)}</p>
          <div className="mt-3 flex flex-wrap gap-2">{(d.chips ?? []).map((c, i) => <span key={i} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{pick(c, ar)}</span>)}</div>
        </div>
      </header>

      {tabs.length > 0 && (
        <nav className="sticky top-14 z-20 -mx-4 mt-4 overflow-x-auto bg-slate-50/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm hover:bg-teal-500 hover:text-white dark:bg-slate-800 dark:text-slate-200">{t.label}</button>
            ))}
          </div>
        </nav>
      )}

      <div className="mt-5 space-y-8">
        {parsed.map(({ s, blocks }) => {
          const lab = d.labels?.[s.key];
          return (
            <section key={s.key} id={s.key} className="scroll-mt-28">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/15 text-lg">{lab?.i ?? s.icon}</span>
                {ar ? (lab?.t ?? s.ar) : (lab?.en ?? s.en)}
              </h2>
              <div className="space-y-4">
                {blocks.map((b, i) =>
                  b.kind === 'panel' ? (
                    <Panel key={i} id={`${s.key}-${i}`} block={b} ar={ar} />
                  ) : (
                    <div key={i} className={s.key === 'nursing' ? 'rounded-2xl border border-emerald-300/60 bg-white p-4 dark:border-emerald-500/30 dark:bg-slate-900' : s.key === 'redflags' ? 'rounded-2xl border border-rose-300/60 bg-white p-4 dark:border-rose-500/30 dark:bg-slate-900' : 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'}>
                      <Prose html={b.html} ar={ar} overrides={overrides} admin={loggedIn} onSaved={refresh} onZoom={setZoom} />
                    </div>
                  ),
                )}
              </div>
            </section>
          );
        })}

        {d.keyPoints && (
          <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-5 text-white shadow-lg">
            <h2 className="mb-3 text-lg font-black">⭐ {ar ? 'خلاصة سريعة' : 'Quick summary'}</h2>
            <ul className="space-y-2">
              {(ar ? d.keyPoints.ar : d.keyPoints.en?.length ? d.keyPoints.en : d.keyPoints.ar).map((k, i) => (
                <li key={i} className="flex gap-2"><span className="font-black">✔</span><span>{k}</span></li>
              ))}
            </ul>
          </section>
        )}
        <Quiz d={d} ar={ar} />
        {d.refs?.length ? (
          <details className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            <summary className="cursor-pointer font-bold">📚 {ar ? 'المراجع' : 'References'}</summary>
            <ul className="mt-2 list-disc ps-5">{d.refs.map((r, i) => <li key={i}>{r.title}</li>)}</ul>
          </details>
        ) : null}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">{ar ? 'للتعليم فقط — القرار للطبيب، والمدى المطبوع في تقرير المعمل هو المرجع.' : 'Education only — the physician decides; your lab’s printed range is the reference.'}</p>
      {zoom && <ImageLightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
