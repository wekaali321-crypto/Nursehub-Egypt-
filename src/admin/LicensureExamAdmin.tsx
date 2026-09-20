// src/admin/LicensureExamAdmin.tsx
// Admin CRUD screens for the "مزاولة المهنة" (Professional Licensure Exams) feature.
// Mirrors the repeatable-field-editor pattern used by RxPrescriptionsAdmin.tsx / ClinicalProtocolsAdmin.tsx.
//
// Exports three components — mount them at whichever admin routes you use, e.g.:
//   /admin/exam-categories -> <ExamCategoriesAdmin />
//   /admin/exams           -> <ExamsAdmin />
//   /admin/exam-questions  -> <ExamQuestionsAdmin />

import { useEffect, useState } from 'react';
import {
  fetchExamCategories,
  upsertExamCategory,
  deleteExamCategory,
  fetchExams,
  upsertExam,
  deleteExam,
  fetchExamQuestions,
  upsertExamQuestion,
  deleteExamQuestion,
  type ExamCategory,
  type Exam,
  type ExamQuestion,
  type ExamChoice,
} from '../lib/examLicensureApi';

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6" dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 mb-4">{title}</h1>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-200 p-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      <textarea
        className="w-full rounded-lg border border-slate-200 p-2 text-sm min-h-[80px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// exam_categories admin
// ---------------------------------------------------------------------------

const emptyCategory: ExamCategory = {
  id: '',
  order_num: 1,
  name_ar: '',
  name_en: '',
  icon: '📜',
  description_ar: '',
  description_en: '',
};

export function ExamCategoriesAdmin() {
  const [items, setItems] = useState<ExamCategory[]>([]);
  const [form, setForm] = useState<ExamCategory>(emptyCategory);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchExamCategories()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSave() {
    if (!form.id) return alert('لازم تدخل id فريد (unique id required)');
    await upsertExamCategory(form);
    setForm(emptyCategory);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteExamCategory(id);
    reload();
  }

  return (
    <AdminSection title="إدارة أقسام الاختبارات (Exam Categories)">
      <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <TextField label="id (مثال: licensure-exams)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
          <TextField label="الاسم بالعربي" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} />
          <TextField label="Name (English)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} />
          <TextField label="الأيقونة (emoji)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
        </div>
        <TextAreaField label="وصف بالعربي" value={form.description_ar ?? ''} onChange={(v) => setForm({ ...form, description_ar: v })} />
        <TextAreaField label="Description (English)" value={form.description_en ?? ''} onChange={(v) => setForm({ ...form, description_en: v })} />
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm">
          حفظ (Save)
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">جاري التحميل...</div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <span className="me-2">{c.icon}</span>
                <span className="font-medium">{c.name_ar}</span>{' '}
                <span className="text-slate-400 text-xs">({c.id})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm(c)} className="text-xs text-sky-700 underline">
                  تعديل
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 underline">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}

// ---------------------------------------------------------------------------
// exams admin
// ---------------------------------------------------------------------------

const emptyExam: Exam = {
  id: '',
  category_id: '',
  order_num: 1,
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  question_count: 0,
};

export function ExamsAdmin() {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [items, setItems] = useState<Exam[]>([]);
  const [form, setForm] = useState<Exam>(emptyExam);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([fetchExamCategories(), fetchExams()])
      .then(([cats, exs]) => {
        setCategories(cats);
        setItems(exs);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSave() {
    if (!form.id || !form.category_id) return alert('لازم id و category_id');
    await upsertExam(form);
    setForm(emptyExam);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟ سيتم حذف كل الأسئلة المرتبطة به أيضًا إن وجد قيد ON DELETE CASCADE')) return;
    await deleteExam(id);
    reload();
  }

  return (
    <AdminSection title="إدارة الامتحانات (Exams)">
      <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <TextField label="id (مثال: licensure-exam-2)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <label className="block mb-3">
            <span className="block text-xs text-slate-500 mb-1">القسم (category)</span>
            <select
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">— اختر —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </label>
          <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
          <TextField label="عدد الأسئلة (question_count)" value={String(form.question_count)} onChange={(v) => setForm({ ...form, question_count: Number(v) || 0 })} />
          <TextField label="العنوان بالعربي" value={form.title_ar} onChange={(v) => setForm({ ...form, title_ar: v })} />
          <TextField label="Title (English)" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
        </div>
        <TextAreaField label="وصف بالعربي" value={form.description_ar ?? ''} onChange={(v) => setForm({ ...form, description_ar: v })} />
        <TextAreaField label="Description (English)" value={form.description_en ?? ''} onChange={(v) => setForm({ ...form, description_en: v })} />
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm">
          حفظ (Save)
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">جاري التحميل...</div>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <span className="font-medium">{e.title_ar}</span>{' '}
                <span className="text-slate-400 text-xs">
                  ({e.id} — {e.category_id} — {e.question_count} سؤال)
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm(e)} className="text-xs text-sky-700 underline">
                  تعديل
                </button>
                <button onClick={() => handleDelete(e.id)} className="text-xs text-red-600 underline">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}

// ---------------------------------------------------------------------------
// exam_questions admin (repeatable choices editor)
// ---------------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyQuestion(examId: string): ExamQuestion {
  return {
    id: '',
    exam_id: examId,
    order_num: 1,
    question_en: '',
    choices: [
      { letter: 'A', text: '' },
      { letter: 'B', text: '' },
      { letter: 'C', text: '' },
      { letter: 'D', text: '' },
    ],
    correct_letter: 'A',
    rationale_ar: '',
    rationale_en: '',
  };
}

export function ExamQuestionsAdmin() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [items, setItems] = useState<ExamQuestion[]>([]);
  const [form, setForm] = useState<ExamQuestion>(emptyQuestion(''));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams().then(setExams);
  }, []);

  function reload(examId: string) {
    if (!examId) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetchExamQuestions(examId)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(selectedExamId);
    setForm(emptyQuestion(selectedExamId));
  }, [selectedExamId]);

  function updateChoice(idx: number, patch: Partial<ExamChoice>) {
    const next = [...form.choices];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, choices: next });
  }

  function addChoice() {
    const nextLetter = LETTERS[form.choices.length] ?? String(form.choices.length + 1);
    setForm({ ...form, choices: [...form.choices, { letter: nextLetter, text: '' }] });
  }

  function removeChoice(idx: number) {
    const next = form.choices.filter((_, i) => i !== idx);
    setForm({ ...form, choices: next });
  }

  async function handleSave() {
    if (!form.id || !form.exam_id) return alert('لازم id و exam_id');
    await upsertExamQuestion(form);
    setForm(emptyQuestion(selectedExamId));
    reload(selectedExamId);
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteExamQuestion(id);
    reload(selectedExamId);
  }

  return (
    <AdminSection title="إدارة أسئلة الامتحان (Exam Questions)">
      <label className="block mb-6">
        <span className="block text-xs text-slate-500 mb-1">اختر الامتحان (Exam)</span>
        <select
          className="w-full rounded-lg border border-slate-200 p-2 text-sm"
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="">— اختر —</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title_ar} ({e.id})
            </option>
          ))}
        </select>
      </label>

      {selectedExamId && (
        <>
          <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <TextField label="id (مثال: licexam1-q457)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
              <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
            </div>
            <TextAreaField label="نص السؤال (question_en)" value={form.question_en} onChange={(v) => setForm({ ...form, question_en: v })} />

            <div className="mb-3">
              <span className="block text-xs text-slate-500 mb-2">الاختيارات (Choices)</span>
              {form.choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    className="w-14 rounded-lg border border-slate-200 p-2 text-sm text-center"
                    value={choice.letter}
                    onChange={(e) => updateChoice(idx, { letter: e.target.value })}
                  />
                  <input
                    className="flex-1 rounded-lg border border-slate-200 p-2 text-sm"
                    value={choice.text}
                    onChange={(e) => updateChoice(idx, { text: e.target.value })}
                    placeholder="نص الاختيار"
                  />
                  <button onClick={() => removeChoice(idx)} className="text-xs text-red-600 px-2">
                    حذف
                  </button>
                </div>
              ))}
              <button onClick={addChoice} className="text-xs text-sky-700 underline">
                + إضافة اختيار
              </button>
            </div>

            <label className="block mb-3">
              <span className="block text-xs text-slate-500 mb-1">الإجابة الصحيحة (correct_letter)</span>
              <select
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                value={form.correct_letter}
                onChange={(e) => setForm({ ...form, correct_letter: e.target.value })}
              >
                {form.choices.map((c) => (
                  <option key={c.letter} value={c.letter}>
                    {c.letter}
                  </option>
                ))}
              </select>
            </label>

            <TextAreaField label="الشرح بالعربي (rationale_ar)" value={form.rationale_ar} onChange={(v) => setForm({ ...form, rationale_ar: v })} />
            <TextAreaField label="Rationale (English)" value={form.rationale_en} onChange={(v) => setForm({ ...form, rationale_en: v })} />

            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm">
              حفظ (Save)
            </button>
          </div>

          {loading ? (
            <div className="text-slate-400">جاري التحميل...</div>
          ) : (
            <div className="space-y-2">
              {items.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="text-sm">
                    <span className="text-slate-400 text-xs">#{q.order_num}</span>{' '}
                    <span className="font-medium">{q.question_en.slice(0, 80)}...</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setForm(q)} className="text-xs text-sky-700 underline">
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="text-xs text-red-600 underline">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminSection>
  );
}
