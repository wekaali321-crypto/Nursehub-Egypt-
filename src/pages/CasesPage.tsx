// src/pages/CasesPage.tsx
// "الحالات السريرية" (Clinical Cases): an interactive, story-driven case reader.
//   /cases       CasesHome — filters, progress, case cards
//   /cases/:id   CasePage  — step-by-step: story → exam → investigations → think → reveal

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchCase,
  fetchCaseIndex,
  loadDoneCases,
  saveDoneCases,
  rememberLastCase,
  lastCase,
  pick,
  pickList,
  SPECIALTIES,
  DIFFICULTY,
  type CaseIndexItem,
  type ClinicalCase,
} from '../lib/casesApi';
import { Breadcrumbs } from '../components/common';
import InlineLangToggle from '../components/InlineLangToggle';
import { ImageLightbox } from '../components/Lightbox';
import { wrapTables } from '../components/ArticleContent';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { useSEO } from '../lib/seo';
import { useI18n } from '../lib/i18n';

const spec = (k: string) => SPECIALTIES[k] ?? SPECIALTIES.other;

function Dots({ level }: { level: string }) {
  const d = DIFFICULTY[level] ?? DIFFICULTY.medium;
  return (
    <span className={`inline-flex items-center gap-0.5 ${d.cls}`} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= d.dots ? 'bg-current' : 'bg-slate-300 dark:bg-slate-600'}`} />
      ))}
    </span>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-24 text-slate-500"><span className="animate-pulse">…</span></div>;
}

// ---------------------------------------------------------------------------
// Hub — /cases
// ---------------------------------------------------------------------------
export function CasesHome() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const nav = useNavigate();
  const [cases, setCases] = useState<CaseIndexItem[] | null>(null);
  const [done, setDone] = useState<string[]>(() => loadDoneCases());
  const [q, setQ] = useState('');
  const [sp, setSp] = useState('all');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState<'all' | 'new' | 'done'>('all');

  useSEO({
    title: ar ? 'الحالات السريرية | NurseHub Egypt' : 'Clinical Cases | NurseHub Egypt',
    description: ar ? 'حالات سريرية تفاعلية من الطب الباطني والطوارئ: القصة، الفحص، الفحوصات، ثم فكّر قبل كشف التشخيص.' : 'Interactive acute-medicine clinical cases: history, exam, investigations — think first, then reveal.',
  });

  useEffect(() => {
    void fetchCaseIndex().then(setCases);
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (cases ?? []).forEach((c) => (m[c.specialty] = (m[c.specialty] || 0) + 1));
    return m;
  }, [cases]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (cases ?? []).filter((c) => {
      if (sp !== 'all' && c.specialty !== sp) return false;
      if (diff !== 'all' && c.difficulty !== diff) return false;
      if (status === 'done' && !done.includes(c.id)) return false;
      if (status === 'new' && done.includes(c.id)) return false;
      if (!s) return true;
      const hay = `${c.num} ${c.title.ar} ${c.title.en ?? ''} ${c.teaser.ar} ${c.teaser.en ?? ''} ${(c.chips ?? []).map((x) => x.ar + ' ' + (x.en ?? '')).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }, [cases, q, sp, diff, status, done]);

  const total = cases?.length ?? 0;
  const pct = total ? Math.round((done.filter((id) => cases?.some((c) => c.id === id)).length / total) * 100) : 0;
  const last = lastCase();
  const lastItem = cases?.find((c) => c.id === last);

  const random = () => {
    const pool = (cases ?? []).filter((c) => !done.includes(c.id));
    const list = pool.length ? pool : cases ?? [];
    if (list.length) nav(`/cases/${list[Math.floor(Math.random() * list.length)].id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الحالات السريرية' : 'Clinical Cases' }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div className="cs-hero relative overflow-hidden rounded-3xl p-6 text-white sm:p-10">
        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm font-bold text-white/80">{ar ? '🩺 تعلّم بالحالات' : '🩺 Learn by cases'}</div>
            <h1 className="mt-1 text-3xl font-black sm:text-5xl">{ar ? 'الحالات السريرية' : 'Clinical Cases'}</h1>
            <p className="mt-3 max-w-xl text-white/90">
              {ar
                ? 'كل حالة قصة حقيقية من الطوارئ: اقرأ القصة، افحص المريض، حلّل الفحوصات... ثم فكّر قبل أن تكشف التشخيص.'
                : 'Every case is a real emergency story: read the history, examine the patient, interpret the tests… then think before you reveal the diagnosis.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={random} className="rounded-full bg-white px-5 py-2.5 font-black text-slate-900 shadow-lg transition hover:scale-105">🎲 {ar ? 'حالة عشوائية' : 'Random case'}</button>
              {lastItem && (
                <Link to={`/cases/${lastItem.id}`} className="rounded-full bg-white/20 px-5 py-2.5 font-bold backdrop-blur hover:bg-white/30">
                  ▶ {ar ? `كمّل: حالة ${lastItem.num}` : `Continue: case ${lastItem.num}`}
                </Link>
              )}
            </div>
          </div>
          <div className="mx-auto flex flex-col items-center">
            <div className="cs-ring" style={{ ['--p' as string]: `${pct}` }}>
              <span>{pct}%</span>
            </div>
            <div className="mt-2 text-sm font-bold text-white/90">{done.length}/{total} {ar ? 'مكتملة' : 'done'}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? '🔎 ابحث بالعنوان أو الأعراض أو رقم الحالة…' : '🔎 Search by title, symptom or case number…'}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSp('all')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${sp === 'all' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
            {ar ? 'الكل' : 'All'} ({total})
          </button>
          {Object.keys(SPECIALTIES).filter((k) => counts[k]).map((k) => (
            <button key={k} onClick={() => setSp(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${sp === k ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {SPECIALTIES[k].icon} {ar ? SPECIALTIES[k].ar : SPECIALTIES[k].en} ({counts[k]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button key={d} onClick={() => setDiff(d)} className={`rounded-full border px-3 py-1 font-bold ${diff === d ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}>
              {d === 'all' ? (ar ? 'كل المستويات' : 'All levels') : ar ? DIFFICULTY[d].ar : DIFFICULTY[d].en}
            </button>
          ))}
          <span className="mx-1 text-slate-300">|</span>
          {(['all', 'new', 'done'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3 py-1 font-bold ${status === s ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}>
              {s === 'all' ? (ar ? 'الكل' : 'Any') : s === 'new' ? (ar ? 'لم أبدأها' : 'Not done') : ar ? '✓ أنجزتها' : '✓ Done'}
            </button>
          ))}
        </div>
      </div>

      {cases === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="py-20 text-center text-slate-500">{total === 0 ? (ar ? 'الحالات قيد الإضافة… عُد قريبًا.' : 'Cases are being added… check back soon.') : ar ? 'لا توجد حالات مطابقة.' : 'No matching cases.'}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const s = spec(c.specialty);
            const isDone = done.includes(c.id);
            return (
              <Link key={c.id} to={`/cases/${c.id}`} className="cs-card group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className={`relative flex h-28 items-end justify-between bg-gradient-to-br ${s.grad} p-4 text-white`}>
                  {c.cover && <img src={c.cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />}
                  <span className="relative text-4xl drop-shadow">{c.icon || s.icon}</span>
                  <span className="relative rounded-full bg-black/25 px-3 py-1 text-xs font-black backdrop-blur">{ar ? 'حالة' : 'Case'} {c.num}</span>
                  {isDone && <span className="absolute start-3 top-3 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-black text-emerald-950">✓ {ar ? 'تمت' : 'Done'}</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-black leading-snug text-slate-900 group-hover:text-sky-600 dark:text-white">{pick(c.title, ar)}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{pick(c.teaser, ar)}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{ar ? s.ar : s.en}</span>
                    <span className="inline-flex items-center gap-1.5">{ar ? DIFFICULTY[c.difficulty]?.ar : DIFFICULTY[c.difficulty]?.en} <Dots level={c.difficulty} /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400">
        {ar ? 'حالات تعليمية بصياغة ورسوم أصلية من إعداد الموقع، مبنية على سيناريوهات الطب الإسعافي الشائعة. لا تغني عن التقييم الإكلينيكي ولا عن بروتوكولات مؤسستك.' : 'Educational cases with original wording and illustrations by the site, built on common acute-medicine scenarios. They do not replace clinical judgement or your institution’s protocols.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reader — /cases/:id
// ---------------------------------------------------------------------------
type StepKey = 'story' | 'exam' | 'tests' | 'think' | 'answer';

function Html({ html, onZoom }: { html: string; onZoom: (src: string, alt: string) => void }) {
  const safe = useMemo(() => wrapTables(sanitizeHtml(html || '')), [html]);
  return (
    <div
      className="cs-prose prose-content"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === 'IMG') onZoom((t as HTMLImageElement).src, (t as HTMLImageElement).alt);
      }}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function KeyPoints({ items, ar }: { items: string[]; ar: boolean }) {
  const [known, setKnown] = useState<number[]>([]);
  if (!items.length) return null;
  return (
    <div className="mt-8">
      <h3 className="mb-1 text-xl font-black dark:text-white">🎯 {ar ? 'ما تحتاج أن تتذكره' : 'Take-home points'}</h3>
      <p className="mb-3 text-xs text-slate-400">{ar ? 'اضغط على النقطة التي حفظتها لتعليمها ✓' : 'Tap a point once you have it down ✓'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((k, i) => {
          const on = known.includes(i);
          return (
            <button
              key={i}
              onClick={() => setKnown((s) => (on ? s.filter((x) => x !== i) : [...s, i]))}
              className={`cs-kp rounded-2xl border p-4 text-start transition ${on ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 bg-white hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900'}`}
            >
              <span className={`me-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${on ? 'bg-emerald-500 text-white' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'}`}>{on ? '✓' : i + 1}</span>
              <span className="text-sm leading-7 text-slate-700 dark:text-slate-200">{k}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CasePage() {
  const { id = '' } = useParams();
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const nav = useNavigate();
  const [c, setC] = useState<ClinicalCase | null | undefined>(undefined);
  const [index, setIndex] = useState<CaseIndexItem[]>([]);
  const [step, setStep] = useState<StepKey>('story');
  const [visited, setVisited] = useState<StepKey[]>(['story']);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [done, setDone] = useState<string[]>(() => loadDoneCases());
  const [guess, setGuess] = useState('');
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setC(undefined);
    setStep('story');
    setVisited(['story']);
    setGuess('');
    void fetchCase(id).then((x) => {
      setC(x);
      if (x) rememberLastCase(x.id);
    });
    void fetchCaseIndex().then(setIndex);
  }, [id]);

  useSEO({
    title: c ? `${ar ? 'حالة' : 'Case'} ${c.num}: ${pick(c.title, ar)} | NurseHub Egypt` : ar ? 'حالة سريرية | NurseHub Egypt' : 'Clinical case | NurseHub Egypt',
    description: c ? pick(c.teaser, ar) : '',
  });

  const steps = useMemo(() => {
    if (!c) return [] as { k: StepKey; label: string; icon: string }[];
    const list: { k: StepKey; label: string; icon: string }[] = [{ k: 'story', label: ar ? 'القصة' : 'History', icon: '📖' }];
    if (pick(c.exam, ar).trim()) list.push({ k: 'exam', label: ar ? 'الفحص' : 'Exam', icon: '🩺' });
    if (pick(c.investigations, ar).trim()) list.push({ k: 'tests', label: ar ? 'الفحوصات' : 'Tests', icon: '🔬' });
    list.push({ k: 'think', label: ar ? 'فكّر' : 'Think', icon: '💭' });
    list.push({ k: 'answer', label: ar ? 'الإجابة' : 'Answer', icon: '💡' });
    return list;
  }, [c, ar]);

  if (c === undefined) return <Loading />;
  if (c === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl">🔍</div>
        <p className="mt-3 text-slate-500">{ar ? 'هذه الحالة غير موجودة.' : 'Case not found.'}</p>
        <Link to="/cases" className="mt-4 inline-block rounded-full bg-sky-600 px-6 py-2 font-bold text-white">{ar ? 'كل الحالات' : 'All cases'}</Link>
      </div>
    );
  }

  const s = spec(c.specialty);
  const idx = steps.findIndex((x) => x.k === step);
  const go = (k: StepKey) => {
    setStep(k);
    setVisited((v) => (v.includes(k) ? v : [...v, k]));
    window.setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const next = () => idx < steps.length - 1 && go(steps[idx + 1].k);
  const prev = () => idx > 0 && go(steps[idx - 1].k);
  const isDone = done.includes(c.id);
  const toggleDone = () => {
    const nd = isDone ? done.filter((x) => x !== c.id) : [...done, c.id];
    setDone(nd);
    saveDoneCases(nd);
  };
  const pos = index.findIndex((x) => x.id === c.id);
  const nextCase = pos >= 0 ? index[pos + 1] : undefined;
  const prevCase = pos > 0 ? index[pos - 1] : undefined;
  const pearls = pickList(c.pearls, ar);
  const sexIcon = c.patient?.sex === 'F' ? '👩' : c.patient?.sex === 'M' ? '👨' : '🧑';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6" dir={ar ? 'rtl' : 'ltr'}>
      <Breadcrumbs items={[{ label: ar ? 'الحالات السريرية' : 'Clinical Cases', path: '/cases' }, { label: `${ar ? 'حالة' : 'Case'} ${c.num}` }]} />
      <div className="mb-3 flex justify-end"><InlineLangToggle /></div>

      <div ref={top} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg`}>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur">{c.icon || s.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/85">
              <span className="rounded-full bg-black/25 px-2.5 py-0.5">{ar ? 'حالة' : 'Case'} {c.num}</span>
              <span>{ar ? s.ar : s.en}</span>
              <span className="inline-flex items-center gap-1">· {ar ? DIFFICULTY[c.difficulty]?.ar : DIFFICULTY[c.difficulty]?.en} <Dots level={c.difficulty} /></span>
            </div>
            <h1 className="mt-1 text-2xl font-black leading-snug sm:text-3xl">{pick(c.title, ar)}</h1>
          </div>
        </div>
        {(c.patient || (c.chips ?? []).length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
            {c.patient && (
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                {sexIcon} {c.patient.age ? (ar ? `${c.patient.age} سنة` : `${c.patient.age} y`) : ''}
                {c.patient.setting ? ` · ${pick(c.patient.setting, ar)}` : ''}
              </span>
            )}
            {(c.chips ?? []).map((ch, i) => <span key={i} className="rounded-full bg-black/20 px-3 py-1">{pick(ch, ar)}</span>)}
          </div>
        )}
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-4 bg-slate-50/90 px-4 py-2 backdrop-blur dark:bg-slate-950/90">
        <div className="flex items-center gap-1.5">
          {steps.map((st, i) => {
            const active = st.k === step;
            const seen = visited.includes(st.k) && !active;
            return (
              <button key={st.k} onClick={() => go(st.k)} className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold transition ${active ? 'bg-sky-500 text-white shadow' : seen ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-white text-slate-400 dark:bg-slate-800'}`}>
                <span className="text-base leading-none">{seen ? '✓' : st.icon}</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-500 transition-all" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div key={step} className="cs-step-in mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {step === 'story' && (
          <>
            <h2 className="cs-h">📖 {ar ? 'القصة المرضية' : 'History'}</h2>
            <Html html={pick(c.story, ar)} onZoom={(src, alt) => setZoom({ src, alt })} />
          </>
        )}
        {step === 'exam' && (
          <>
            <h2 className="cs-h">🩺 {ar ? 'الفحص الإكلينيكي' : 'Examination'}</h2>
            <Html html={pick(c.exam, ar)} onZoom={(src, alt) => setZoom({ src, alt })} />
          </>
        )}
        {step === 'tests' && (
          <>
            <h2 className="cs-h">🔬 {ar ? 'الفحوصات' : 'Investigations'}</h2>
            <Html html={pick(c.investigations, ar)} onZoom={(src, alt) => setZoom({ src, alt })} />
          </>
        )}
        {step === 'think' && (
          <>
            <h2 className="cs-h">💭 {ar ? 'والآن… فكّر!' : 'Now… think!'}</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{ar ? 'جاوب بنفسك أولًا — الإجابة مش هتهرب 😉' : 'Answer for yourself first — the answer is not going anywhere 😉'}</p>
            <ol className="space-y-3">
              {c.questions.map((qq, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-sky-50 p-4 dark:bg-sky-500/10">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white">{i + 1}</span>
                  <span className="font-bold leading-8 text-slate-800 dark:text-slate-100">{pick(qq, ar)}</span>
                </li>
              ))}
            </ol>
            <textarea
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              rows={4}
              placeholder={ar ? '✍️ اكتب تشخيصك وخطتك هنا (اختياري)…' : '✍️ Write your diagnosis and plan here (optional)…'}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button onClick={() => go('answer')} className="cs-reveal mt-4 w-full rounded-2xl px-6 py-4 text-lg font-black text-white shadow-lg transition hover:scale-[1.02]">
              🔓 {ar ? 'اكشف التشخيص والإجابة' : 'Reveal the diagnosis & answer'}
            </button>
          </>
        )}
        {step === 'answer' && (
          <>
            <div className="cs-diagnosis rounded-3xl p-6 text-center text-white">
              <div className="text-sm font-bold text-white/80">{ar ? '✅ التشخيص' : '✅ Diagnosis'}</div>
              <div className="mt-1 text-2xl font-black leading-snug sm:text-3xl">{pick(c.diagnosis, ar)}</div>
            </div>
            {guess.trim() && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-600">
                <b>{ar ? 'إجابتك كانت:' : 'Your answer:'}</b> {guess}
              </div>
            )}
            <div className="mt-6"><Html html={pick(c.answer, ar)} onZoom={(src, alt) => setZoom({ src, alt })} /></div>
            {pearls.length > 0 && (
              <div className="cs-box cs-pearl mt-6">
                <strong>💎 {ar ? 'لآلئ إكلينيكية' : 'Clinical pearls'}</strong>
                <ul>{pearls.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            <KeyPoints items={pickList(c.keyPoints, ar)} ar={ar} />
            <button onClick={toggleDone} className={`mt-8 w-full rounded-2xl px-6 py-3.5 font-black transition ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'}`}>
              {isDone ? (ar ? '✓ تم إنجاز هذه الحالة (اضغط للإلغاء)' : '✓ Case completed (tap to undo)') : ar ? '🏁 أنهيت هذه الحالة' : '🏁 Mark case as completed'}
            </button>
          </>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={prev} disabled={idx <= 0} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300">
            {ar ? '→ السابق' : '← Back'}
          </button>
          {step !== 'answer' && step !== 'think' && (
            <button onClick={next} className="rounded-full bg-sky-500 px-6 py-2 text-sm font-black text-white shadow hover:bg-sky-600">
              {ar ? 'التالي ←' : 'Next →'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {prevCase ? (
          <button onClick={() => nav(`/cases/${prevCase.id}`)} className="rounded-2xl border border-slate-200 bg-white p-3 text-start text-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-400">{ar ? '→ الحالة السابقة' : '← Previous case'}</div>
            <div className="line-clamp-1 font-bold dark:text-white">{prevCase.num}. {pick(prevCase.title, ar)}</div>
          </button>
        ) : <span />}
        {nextCase ? (
          <button onClick={() => nav(`/cases/${nextCase.id}`)} className="rounded-2xl border border-slate-200 bg-white p-3 text-start text-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-400">{ar ? 'الحالة التالية ←' : 'Next case →'}</div>
            <div className="line-clamp-1 font-bold dark:text-white">{nextCase.num}. {pick(nextCase.title, ar)}</div>
          </button>
        ) : <span />}
      </div>

      {zoom && <ImageLightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}
