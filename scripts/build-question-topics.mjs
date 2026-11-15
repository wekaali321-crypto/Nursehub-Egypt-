// Tags every exam / travel question with a nursing topic (keyword rules on the English stem + choices) for the simulator's
// "by topic" results. Output: public/exams/topics/<group>-<bankId>.json  { v, topics: { questionId: topicCode } }.
// Static files (no D1). Re-run after refreshing the snapshot:  node scripts/build-question-topics.mjs
// The rules only decide a TOPIC; difficulty is never guessed. Questions that match nothing are "general".
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const read = (t) => JSON.parse(readFileSync(join(ROOT, 'public/data', t + '.json'), 'utf8'));

// order matters only for ties (earlier wins)
export const TOPICS = {
  cardio: /\b(heart|cardiac|myocard|angina|arrhythm|atrial|ventricular|ecg|ekg|hypertens|blood pressure|digoxin|heart failure|chf|pulse|tachycard|bradycard|coronary|stemi|cabg|anticoagul|heparin|warfarin|embol|dvt|thromb|aneurysm|cardiogenic|pacemaker|defibrill)\w*/g,
  respiratory: /\b(lung|pulmonar|respirat|asthma|copd|pneumon|oxygen|ventilat|airway|bronch|tracheost|chest tube|pleur|dyspnea|sputum|spo2|abg|hypoxi|inhaler|tuberculo|\btb\b|intubat|suction)\w*/g,
  neuro: /\b(neuro|brain|stroke|seizure|epilep|intracranial|icp|glasgow|gcs|conscious|spinal cord|meningit|parkinson|alzheimer|dementia|myasthenia|multiple sclerosis|guillain|head injur|cranial)\w*/g,
  renal: /\b(renal|kidney|dialysis|urinar|urine|bladder|catheter|creatinine|nephr|potassium|sodium|calcium|magnesium|electrolyte|fluid balance|dehydrat|hyperkal|hypokal|hyponat|edema|diures)\w*/g,
  gi: /\b(esophag|oesophag|varic|portal hypertension|gastr|bowel|colon|liver|hepat|cirrho|pancrea|ulcer|nasogastric|ng tube|vomit|diarrh|constipat|stoma|colostom|ileostom|appendic|cholecyst|gallbladder|enteral|tpn|feeding tube|abdomen|abdominal)\w*/g,
  endocrine: /\b(diabet|insulin|glucose|hypoglyc|hyperglyc|ketoacid|dka|thyroid|adrenal|cushing|addison|cortisol|pituitar|hba1c)\w*/g,
  maternity: /\b(pregnan|labor|labour|deliver|postpartum|fetal|fetus|uterus|uterine|cesarean|placenta|gestation|contraction|obstetric|antepartum|prenatal|breastfeed|lochia|preeclampsia|eclampsia|amniot|trimester|newborn|neonat)\w*/g,
  pediatrics: /\b(preterm|premature infant|child|infant|toddler|pediatric|paediatric|adolescent|school-age|preschool|immuniz|vaccin|growth|milestone)\w*/g,
  mental: /\b(psych|depress|anxiety|schizo|bipolar|suicid|mental|delusion|hallucinat|substance|alcohol|withdrawal|panic|personality disorder|therapeutic communication)\w*/g,
  pharmacology: /\b(dose|dosage|mg\/kg|drip rate|infusion rate|gtt|ml\/hr|medication administration|side effect|adverse effect|antibiotic|analgesic|opioid|morphine|drug interaction|pharmac)\w*/g,
  infection: /\b(infection|isolation|hand hygiene|sterile|aseptic|ppe|precaution|mrsa|sepsis|septic|steriliz|disinfect|contamina|droplet|airborne)\w*/g,
  oncology: /\b(cancer|tumor|tumour|chemotherap|radiation therapy|oncolog|leukemia|lymphoma|anemi|transfus|platelet|hemoglobin|sickle)\w*/g,
  musculo: /\b(fracture|bone|cast|traction|orthop|joint|arthritis|osteopor|amputat|hip replacement|knee|musculoskeletal|crutch)\w*/g,
  emergency: /\b(emergency|trauma|triage|cpr|resuscitat|cardiac arrest|shock|burn|poison|overdose|anaphyla|first aid|hemorrhag|bleeding)\w*/g,
  community: /\b(community|public health|epidemiolog|prevalence|incidence|screening|health promotion|primary prevention|secondary prevention|school health|occupational|home visit|population)\w*/g,
  leadership: /\b(manager|management|leader|delegat|prioriti|assign|charge nurse|staff|ethic|legal|consent|confidential|malpractice|negligen|documentation|quality improvement|accountab)\w*/g,
};

export function topicOf(q) {
  // the question stem says what the question is about; the choices only add a hint (half weight)
  const stem = String(q.question_en || '').toLowerCase();
  const choices = (Array.isArray(q.choices) ? q.choices.map((c) => c?.text ?? c?.en ?? '') : []).join(' ').toLowerCase();
  let best = 'general', score = 0;
  for (const [k, re] of Object.entries(TOPICS)) {
    const n = ((stem.match(re) || []).length * 2 + (choices.match(re) || []).length) * (k === 'pharmacology' || k === 'leadership' ? 0.8 : 1);
    if (n > score) { best = k; score = n; }
  }
  return best;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = join(ROOT, 'public/exams/topics');
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const stats = {};
  const write = (group, rows, bankOf) => {
    const banks = new Map();
    for (const q of rows) {
      const b = bankOf(q); if (!b) continue;
      const t = topicOf(q);
      stats[t] = (stats[t] || 0) + 1;
      if (!banks.has(b)) banks.set(b, {});
      banks.get(b)[q.id] = t;
    }
    for (const [b, topics] of banks) writeFileSync(join(OUT, `${group}-${b.replace(/[^\w-]/g, '_')}.json`), JSON.stringify({ v: 1, topics }));
    return banks.size;
  };
  const nl = write('licensure', read('exam_questions'), (q) => q.exam_id);
  const nt = write('travel', read('travel_questions'), (q) => q.category_id);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  console.log(`question topics: ${total} questions, ${nl} licensure + ${nt} travel banks`);
  console.log(Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${Math.round((v / total) * 100)}%)`).join(', '));
}
