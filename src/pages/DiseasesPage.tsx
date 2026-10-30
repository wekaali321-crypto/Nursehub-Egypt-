// src/pages/DiseasesPage.tsx
// "الأمراض للتمريض": disease guides written for nurses.
//   /diseases       DiseasesHome — search, body-system filters, cards
//   /diseases/:id   DiseasePage  — sticky section tabs, nursing-first layout, quiz

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchDisease,
  fetchDiseaseIndex,
  loadRead,
  fetchImageOverrides,
  saveImageOverride,
  SLOT_RE,
  saveRead,
  pick,
  SYSTEMS,
  SECTIONS,
  LEVELS,
  type Disease,
  type DiseaseIndexItem,
} from '../lib/diseasesApi';
import { Breadcrumbs } from '../components/common';
import InlineLangToggle from '../components/InlineLangToggle';
import { ImageLightbox } from '../components/Lightbox';
import { wrapTables } from '../components/ArticleContent';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { useSEO } from '../lib/seo';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/theme';
import { uploadFile } from '../lib/storage';

const sys = (k: string) => SYSTEMS[k] ?? SYSTEMS.other;

function Loading() {
  return <div className="flex items-center justify-center py-24 text-slate-500"><span className="animate-pulse">…</span></div>;
}

// ---------------------------------------------------------------------------
// Hub — /diseases
// ---------------------------------------------------------------------------
export function DiseasesHome() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [items, setItems] = useState<DiseaseIndexItem[] | null>(null);
  const [read] = useState<string[]>(() => loadRead());
  const [q, setQ] = useState('');
  const [sp, setSp] = useState('all');
  const [lvl, setLvl] = useState(0);

  useSEO({
    title: ar ? 'الأمراض للتمريض | NurseHub Egypt' : 'Diseases for Nurses | NurseHub Egypt',
    description: ar
      ? 'شرح مبسّط لأهم الأمراض موجّه للممرض: إيه المرض، إزاي تتعرف عليه، والعلاج، ودورك التمريضي خطوة بخطوة.'
      : 'Nurse-focused guides to common diseases: what it is, how to recognise it, treatment and your nursing role step by step.',
  });

  useEffect(() => {
    void fetchDiseaseIndex().then(setItems);
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (items ?? []).forEach((c) => (m[c.system] = (m[c.system] || 0) + 1));
    return m;
  }, [items]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items ?? []).filter((c) => {
      if (sp !== 'all' && c.system !== sp) return false;
      if (lvl && c.level !== lvl) return false;
      if (!s) return true;
      return `${c.title.ar} ${c.title.en ?? ''} ${c.teaser.ar} ${(c.chips ?? []).map((x) => x.ar + ' ' + (x.en ?? '')).join(' ')}`.toLowerCase().includes(s);
    });
  }, [items, q, sp, lvl]);

  const total = items?.length ?? 0;
  const doneN = read.filter((id) => items?.some((c) => c.id === id)).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الأمراض للتمريض' : 'Diseases for Nurses' }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="dz-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm font-bold text-white/80">{ar ? '🩺 اتعلّم المرض… واتعلّم تتعامل معاه' : '🩺 Know the disease — know how to nurse it'}</div>
            <h1 className="mt-1 text-3xl font-black sm:text-5xl">{ar ? 'الأمراض للتمريض' : 'Diseases for Nurses'}</h1>
            <p className="mt-3 max-w-xl text-white/90">
              {ar
                ? 'كل مرض بنفس الترتيب: إيه هو، ليه بيحصل، إزاي تتعرف عليه، العلاج، وبعدين الأهم: إنت كممرض تعمل إيه ومتراقبش إيه.'
                : 'Every disease in the same order: what it is, why it happens, how to recognise it, treatment — then what matters most: what you do and what you watch as the nurse.'}
            </p>
          </div>
          <div className="mx-auto grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur"><div className="text-3xl font-black">{total}</div><div className="text-xs font-bold text-white/80">{ar ? 'مرض' : 'diseases'}</div></div>
            <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur"><div className="text-3xl font-black">{doneN}</div><div className="text-xs font-bold text-white/80">{ar ? 'قريتها' : 'read'}</div></div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? '🔎 ابحث باسم المرض أو العَرَض…' : '🔎 Search by disease or symptom…'}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSp('all')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${sp === 'all' ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
            {ar ? 'الكل' : 'All'} ({total})
          </button>
          {Object.keys(SYSTEMS).filter((k) => counts[k]).map((k) => (
            <button key={k} onClick={() => setSp(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${sp === k ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {SYSTEMS[k].icon} {ar ? SYSTEMS[k].ar : SYSTEMS[k].en} ({counts[k]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[0, 1, 2, 3].map((n) => (
            <button key={n} onClick={() => setLvl(n)} className={`rounded-full border px-3 py-1 font-bold ${lvl === n ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}>
              {n === 0 ? (ar ? 'كل الأنواع' : 'All') : ar ? LEVELS[n].ar : LEVELS[n].en}
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="py-20 text-center text-slate-500">{total === 0 ? (ar ? 'الأمراض قيد الإضافة… عُد قريبًا.' : 'Diseases are being added… check back soon.') : ar ? 'لا توجد نتائج مطابقة.' : 'No matches.'}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const s = sys(c.system);
            const lv = LEVELS[c.level ?? 1];
            return (
              <Link key={c.id} to={`/diseases/${c.id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className={`relative flex h-24 items-end justify-between bg-gradient-to-br ${s.grad} p-4 text-white`}>
                  <span className="text-4xl drop-shadow">{c.icon || s.icon}</span>
                  <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-black backdrop-blur">{ar ? s.ar : s.en}</span>
                  {read.includes(c.id) && <span className="absolute start-3 top-3 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-black text-emerald-950">✓ {ar ? 'قريتها' : 'Read'}</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-black leading-snug text-slate-900 group-hover:text-teal-600 dark:text-white">{pick(c.title, ar)}</h3>
                  {c.title.en && ar && <div className="text-xs text-slate-400" dir="ltr">{c.title.en}</div>}
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{pick(c.teaser, ar)}</p>
                  <div className="mt-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${lv.cls}`}>{ar ? lv.ar : lv.en}</span></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400">
        {ar ? 'محتوى تعليمي بصياغة ورسوم أصلية من إعداد الموقع. لا يغني عن تعليمات الطبيب ولا عن بروتوكولات مؤسستك.' : 'Educational content with original wording and illustrations. It does not replace physician orders or your institution’s protocols.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reader — /diseases/:id
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Image slot: built-in drawing or admin-uploaded picture; admins can upload / replace / hide it.
// ---------------------------------------------------------------------------
function Slot({ id, label, def, over, admin, ar, onSaved, onZoom }: { id: string; label: string; def?: string; over?: string; admin: boolean; ar: boolean; onSaved: () => void; onZoom: (u: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const isHidden = over !== undefined && (over === '' || over.startsWith('hidden:'));
  const kept = over && over.startsWith('hidden:') ? over.slice(7) : '';
  const url = isHidden ? '' : over !== undefined ? over : def || '';
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      onSaved();
    } catch {
      setErr(ar ? 'تعذّر الحفظ — تأكد إنك مسجّل دخول كأدمن.' : 'Save failed — make sure you are signed in as admin.');
    } finally {
      setBusy(false);
    }
  };
  const upload = (f: File) => act(async () => saveImageOverride(id, (await uploadFile(f, 'diseases')).item.url));
  if (!url && !admin) return null;
  const hidden = isHidden; // the admin hid a picture
  const showBar = !url && !open;
  const inp = (
    <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
  );
  // Admin: no picture yet -> a slim toggle bar instead of a big empty box
  if (showBar)
    return (
      <div className="my-2 flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-600">
        <span>📷 {hidden ? (ar ? 'صورة مخفية: ' : 'Hidden picture: ') : ar ? 'مكان صورة: ' : 'Picture slot: '}{label}</span>
        <span className="flex gap-1">
          {hidden && <button disabled={busy} onClick={() => act(() => saveImageOverride(id, kept || null))} className="rounded-full bg-teal-600 px-3 py-1 font-bold text-white">{ar ? '👁 إظهار' : 'Show'}</button>}
          {!hidden && <button onClick={() => setOpen(true)} className="rounded-full bg-teal-600 px-3 py-1 font-bold text-white">{ar ? '👁 إظهار / رفع' : 'Show / upload'}</button>}
        </span>
        {inp}
      </div>
    );
  return (
    <figure className="cs-fig">
      {url ? (
        <img src={url} alt={label} loading="lazy" onClick={() => onZoom(url)} />
      ) : (
        <button type="button" onClick={() => file.current?.click()} className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-slate-500 hover:border-teal-400 dark:border-slate-600">
          <span className="text-3xl">📷</span>
          <span className="text-sm font-bold">{label}</span>
          <span className="text-xs">{ar ? 'اضغط لرفع صورة' : 'Click to upload'}</span>
        </button>
      )}
      {label && url && <figcaption>{label}</figcaption>}
      {admin && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <button disabled={busy} onClick={() => file.current?.click()} className="rounded-full bg-teal-600 px-3 py-1 font-bold text-white disabled:opacity-50">{busy ? '…' : url ? (ar ? '🔄 تغيير الصورة' : 'Replace') : ar ? '⬆ رفع صورة' : 'Upload'}</button>
          {url ? (
            <button disabled={busy} onClick={() => act(() => saveImageOverride(id, `hidden:${over || def || ''}`))} className="rounded-full bg-slate-200 px-3 py-1 font-bold text-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100">{ar ? '🙈 إخفاء' : 'Hide'}</button>
          ) : (
            <button onClick={() => setOpen(false)} className="rounded-full bg-slate-200 px-3 py-1 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{ar ? '🙈 إخفاء الجزء' : 'Hide'}</button>
          )}
          {over !== undefined && !isHidden && <button disabled={busy} onClick={() => act(() => saveImageOverride(id, null))} className="rounded-full bg-slate-200 px-3 py-1 font-bold text-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100">{ar ? '↩ الافتراضي' : 'Reset'}</button>}
          {err && <span className="text-rose-500">{err}</span>}
        </div>
      )}
      {inp}
    </figure>
  );
}

function Prose({ html, ar, overrides, admin, onSaved, onZoom }: { html: string; ar: boolean; overrides: Record<string, string>; admin: boolean; onSaved: () => void; onZoom: (u: string) => void }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of html.matchAll(SLOT_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(<div key={`h${i}`} dangerouslySetInnerHTML={{ __html: wrapTables(sanitizeHtml(html.slice(last, idx))) }} />);
    parts.push(<Slot key={`s${i}`} id={m[1]} label={m[2]} def={m[3]} over={overrides[m[1]]} admin={admin} ar={ar} onSaved={onSaved} onZoom={onZoom} />);
    last = idx + m[0].length;
    i++;
  }
  if (last < html.length) parts.push(<div key="tail" dangerouslySetInnerHTML={{ __html: wrapTables(sanitizeHtml(html.slice(last))) }} />);
  return <div className="cs-prose" onClick={(e) => { const t = e.target as HTMLElement; if (t.tagName === 'IMG' && !t.closest('.cs-fig')) onZoom((t as HTMLImageElement).src); }}>{parts}</div>;
}

function Quiz({ d, ar }: { d: Disease; ar: boolean }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  if (!d.quiz?.length) return null;
  const score = d.quiz.filter((q, i) => picked[i] === q.answer).length;
  const answered = Object.keys(picked).length;
  return (
    <section id="sec-quiz" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="cs-h">🎯 {ar ? 'اختبر نفسك' : 'Test yourself'}</h2>
      <div className="space-y-5">
        {d.quiz.map((q, i) => (
          <div key={i}>
            <div className="mb-2 font-bold text-slate-900 dark:text-white">{i + 1}. {pick(q.q, ar)}</div>
            <div className="grid gap-2">
              {q.options.map((o, j) => {
                const chosen = picked[i] !== undefined;
                const right = j === q.answer;
                const cls = !chosen
                  ? 'border-slate-200 hover:border-teal-400 dark:border-slate-700'
                  : right
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : picked[i] === j
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : 'border-slate-200 opacity-60 dark:border-slate-700';
                return (
                  <button key={j} disabled={chosen} onClick={() => setPicked((p) => ({ ...p, [i]: j }))} className={`rounded-xl border px-3 py-2 text-start text-sm text-slate-800 transition dark:text-slate-100 ${cls}`}>
                    {pick(o, ar)}
                  </button>
                );
              })}
            </div>
            {picked[i] !== undefined && q.why && <div className="cs-box cs-info mt-2 text-sm">{pick(q.why, ar)}</div>}
          </div>
        ))}
      </div>
      {answered === d.quiz.length && (
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 p-4 text-center font-black text-white">
          {ar ? `نتيجتك: ${score} من ${d.quiz.length}` : `Your score: ${score}/${d.quiz.length}`} {score === d.quiz.length ? '🏆' : '👏'}
        </div>
      )}
    </section>
  );
}

export function DiseasePage() {
  const { id = '' } = useParams();
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const [d, setD] = useState<Disease | null | undefined>(undefined);
  const [index, setIndex] = useState<DiseaseIndexItem[]>([]);
  const [active, setActive] = useState('overview');
  const [zoom, setZoom] = useState<string | null>(null);
  const { loggedIn } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const refreshImgs = () => void fetchImageOverrides(true).then(setOverrides);
  useEffect(() => { void fetchImageOverrides().then(setOverrides); }, []);

  useEffect(() => {
    setD(undefined);
    void fetchDisease(id).then((x) => {
      setD(x);
      if (x) {
        const r = loadRead();
        if (!r.includes(x.id)) saveRead([...r, x.id]);
      }
    });
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => {
    void fetchDiseaseIndex().then(setIndex);
  }, []);

  useSEO({
    title: d ? `${pick(d.title, ar)} — ${ar ? 'شرح تمريضي' : 'nursing guide'} | NurseHub Egypt` : 'NurseHub Egypt',
    description: d ? pick(d.teaser, ar) : '',
  });

  const secs = useMemo(() => SECTIONS.filter((s) => d?.sections[s.key]), [d]);

  useEffect(() => {
    if (!secs.length) return;
    const obs = new IntersectionObserver(
      (es) => {
        const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setActive(v.target.id.replace('sec-', ''));
      },
      { rootMargin: '-110px 0px -60% 0px' },
    );
    secs.forEach((s) => {
      const el = document.getElementById(`sec-${s.key}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [secs]);

  if (d === undefined) return <Loading />;
  if (d === null)
    return (
      <div className="py-24 text-center" dir={ar ? 'rtl' : 'ltr'}>
        <p className="text-slate-500">{ar ? 'المرض غير موجود.' : 'Not found.'}</p>
        <Link to="/diseases" className="mt-3 inline-block font-bold text-teal-600">{ar ? '← كل الأمراض' : '← All diseases'}</Link>
      </div>
    );

  const s = sys(d.system);
  const pos = index.findIndex((x) => x.id === d.id);
  const prev = pos > 0 ? index[pos - 1] : null;
  const next = pos >= 0 && pos < index.length - 1 ? index[pos + 1] : null;
  const go = (k: string) => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الأمراض للتمريض' : 'Diseases', path: '/diseases' }, { label: pick(d.title, ar) }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <header className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${s.grad} p-6 text-white sm:p-8`}>
        <div className="text-5xl drop-shadow">{d.icon || s.icon}</div>
        <div className="mt-2 text-xs font-bold text-white/80">{ar ? s.ar : s.en}</div>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">{pick(d.title, ar)}</h1>
        {d.title.en && ar && <div className="text-sm text-white/80" dir="ltr">{d.title.en}</div>}
        <p className="mt-3 max-w-2xl text-white/95">{pick(d.teaser, ar)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(d.chips ?? []).map((c, i) => <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{pick(c, ar)}</span>)}
        </div>
      </header>

      <nav className="sticky top-14 z-20 -mx-4 mt-4 overflow-x-auto bg-slate-50/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
        <div className="flex gap-2">
          {secs.map((x) => (
            <button key={x.key} onClick={() => go(x.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition ${active === x.key ? 'bg-teal-500 text-white shadow' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {x.icon} {ar ? x.ar : x.en}
            </button>
          ))}
          {d.quiz?.length ? <button onClick={() => go('quiz')} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">🎯 {ar ? 'اختبر نفسك' : 'Quiz'}</button> : null}
        </div>
      </nav>

      <div className="mt-4 space-y-5">
        {secs.map((x) => (
          <section key={x.key} id={`sec-${x.key}`} className={`scroll-mt-28 rounded-3xl border-t-4 bg-white p-5 shadow-sm dark:bg-slate-900 ${x.ring} ${x.key === 'nursing' ? 'ring-2 ring-emerald-400/50' : ''}`}>
            <h2 className="cs-h">{x.icon} {ar ? x.ar : x.en}</h2>
            <Prose html={pick(d.sections[x.key], ar)} ar={ar} overrides={overrides} admin={loggedIn} onSaved={refreshImgs} onZoom={setZoom} />
          </section>
        ))}

        {d.keyPoints && (
          <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
            <h2 className="mb-3 text-xl font-black">⭐ {ar ? 'لو هتفتكر حاجات بس' : 'Remember these'}</h2>
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
            <summary className="cursor-pointer font-bold">📚 {ar ? 'المراجع التي رُوجع عليها المحتوى' : 'References'}</summary>
            <ul className="mt-2 list-disc ps-5">
              {d.refs.map((r, i) => <li key={i}>{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{r.title}</a> : r.title}</li>)}
            </ul>
          </details>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {prev ? <Link to={`/diseases/${prev.id}`} className="rounded-2xl border border-slate-200 p-3 text-sm font-bold hover:border-teal-400 dark:border-slate-800 dark:text-white">{ar ? '→' : '←'} {pick(prev.title, ar)}</Link> : <span />}
        {next ? <Link to={`/diseases/${next.id}`} className="rounded-2xl border border-slate-200 p-3 text-end text-sm font-bold hover:border-teal-400 dark:border-slate-800 dark:text-white">{pick(next.title, ar)} {ar ? '←' : '→'}</Link> : <span />}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">{ar ? 'للتعليم فقط — اتبع أوامر الطبيب وبروتوكول مؤسستك دائمًا.' : 'For education only — always follow physician orders and your institution’s protocol.'}</p>
      {zoom && <ImageLightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
