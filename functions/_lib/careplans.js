// Care plans for the crawler view (functions/[[path]].js) and the sitemap: same data as src/lib/carePlansApi.ts.
// Format 2 = diagnoses[]; older format 1 (student[] + hospital[]) is converted the same way as in the app.
const head = (s, re) => { const t = s.split(re)[0].replace(/\s*\([^)]*\)\s*$/, '').trim(); return t.length < s.length ? t : s; };
const legacyTitle = (d) => ({ ar: head(d.ar, /\s(?:مرتبط|مرتبطة)\s/), en: head(d.en, /\s(?:related to|r\/t)\s/i) });

export function normalizePlan(p) {
  if (Array.isArray(p.diagnoses)) return p;
  return {
    ...p,
    folder: 'disease',
    diagnoses: (p.student || []).map((s, i) => ({
      id: `dx-${i + 1}`, kind: 'actual', title: legacyTitle(s.diagnosis), statement: s.diagnosis,
      assessment: s.assessment, goals: { short: s.goals, long: { ar: [], en: [] } },
      interventions: s.interventions.map((x) => ({ type: 'independent', ...x })),
      evaluation: (s.evaluation?.ar || []).map((t) => ({ status: 'met', text: { ar: t, en: t } })),
      hospital: p.hospital?.[i] ? [p.hospital[i]] : [],
    })),
  };
}

/** Readable HTML of one diagnosis form (Arabic first, for the crawler). */
export function diagnosisHtml(plan, d, esc) {
  const li = (a) => (a?.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const part = (h, html) => (html ? `<h3>${h}</h3>${html}` : '');
  return `<article><h1>${esc(d.title.ar)} — خطة رعاية تمريضية: ${esc(plan.title.ar)}</h1><p lang="en">${esc(d.title.en)} — ${esc(plan.title.en)} Nursing Care Plan</p>` +
    (d.definition ? `<p>${esc(d.definition.ar)}</p>` : d.statement ? `<p>${esc(d.statement.ar)}</p>` : '') +
    `<h2>خطة الطلاب</h2>` +
    part('مرتبط بـ (Related to)', li(d.relatedTo?.ar)) +
    part(d.kind === 'risk' ? 'عوامل الخطورة' : 'ويظهر في (As evidenced by)', li((d.kind === 'risk' ? d.riskFactors : d.evidencedBy)?.ar)) +
    part('التقييم: بيانات ذاتية', li(d.assessment?.subjective?.ar)) + part('التقييم: بيانات موضوعية', li(d.assessment?.objective?.ar)) +
    part('الأهداف قصيرة المدى', li(d.goals?.short?.ar)) + part('الأهداف طويلة المدى', li(d.goals?.long?.ar)) +
    `<h3>التدخلات التمريضية والمبررات</h3><ol>${(d.interventions || []).map((x) => `<li>${esc(x.action.ar)} — المبرر: ${esc(x.rationale.ar)}</li>`).join('')}</ol>` +
    part('التقييم النهائي', li((d.evaluation || []).map((e) => e.text.ar))) +
    `<h2>خطة المستشفى</h2><ul>${(d.hospital || []).map((r) => `<li>${esc(r.need.ar)}: ${esc((r.actions?.ar || []).join('، '))} — ${esc(r.outcome.ar)} (${esc(r.timeframe.ar)})</li>`).join('')}</ul></article>`;
}
