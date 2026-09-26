// src/admin/InterviewQuestionsAdmin.tsx
// Admin CRUD screens for the "أسئلة المقابلات الشخصية" (Interview Questions) feature.
// Mirrors the pattern used by LicensureExamAdmin.tsx.
//
// Exports two components — mount them at whichever admin routes you use, e.g.:
//   /admin/interview-categories -> <InterviewCategoriesAdmin />
//   /admin/interview-questions  -> <InterviewQuestionsAdmin />

import { useEffect, useState } from 'react';
import {
  fetchInterviewCategories,
  upsertInterviewCategory,
  deleteInterviewCategory,
  fetchInterviewQuestions,
  upsertInterviewQuestion,
  deleteInterviewQuestion,
  type InterviewCategory,
  type InterviewQuestion,
} from '../lib/interviewQuestionsApi';

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
        className="w-full rounded-lg border border-slate-200 p-2 text-sm min-h-[90px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// interview_categories admin
// ---------------------------------------------------------------------------

const emptyCategory: InterviewCategory = {
  id: '',
  order_num: 1,
  name_ar: '',
  name_en: '',
  icon: '🎙️',
};

export function InterviewCategoriesAdmin() {
  const [items, setItems] = useState<InterviewCategory[]>([]);
  const [form, setForm] = useState<InterviewCategory>(emptyCategory);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchInterviewCategories()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSave() {
    if (!form.id) return alert('لازم تدخل id فريد (unique id required)');
    await upsertInterviewCategory(form);
    setForm(emptyCategory);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟ سيتم حذف كل الأسئلة المرتبطة به أيضًا')) return;
    await deleteInterviewCategory(id);
    reload();
  }

  return (
    <AdminSection title="إدارة أقسام أسئلة المقابلات (Interview Categories)">
      <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <TextField label="id (مثال: ventilators)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
          <TextField label="الاسم بالعربي" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} />
          <TextField label="Name (English)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} />
          <TextField label="الأيقونة (emoji)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
        </div>
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
// interview_questions admin
// ---------------------------------------------------------------------------

function emptyQuestion(categoryId: string): InterviewQuestion {
  return {
    id: '',
    category_id: categoryId,
    order_num: 1,
    question_ar: '',
    question_en: '',
    answer_ar: '',
    answer_en: '',
    related_path: '',
    related_label_ar: '',
    related_label_en: '',
    source_credit: '',
  };
}

export function InterviewQuestionsAdmin() {
  const [categories, setCategories] = useState<InterviewCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [items, setItems] = useState<InterviewQuestion[]>([]);
  const [form, setForm] = useState<InterviewQuestion>(emptyQuestion(''));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInterviewCategories().then(setCategories);
  }, []);

  function reload(categoryId: string) {
    if (!categoryId) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetchInterviewQuestions(categoryId)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(selectedCategoryId);
    setForm(emptyQuestion(selectedCategoryId));
  }, [selectedCategoryId]);

  async function handleSave() {
    if (!form.id || !form.category_id) return alert('لازم id و category_id');
    await upsertInterviewQuestion(form);
    setForm(emptyQuestion(selectedCategoryId));
    reload(selectedCategoryId);
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteInterviewQuestion(id);
    reload(selectedCategoryId);
  }

  return (
    <AdminSection title="إدارة أسئلة المقابلات (Interview Questions)">
      <label className="block mb-6">
        <span className="block text-xs text-slate-500 mb-1">اختر القسم (Category)</span>
        <select
          className="w-full rounded-lg border border-slate-200 p-2 text-sm"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">— اختر —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar} ({c.id})
            </option>
          ))}
        </select>
      </label>

      {selectedCategoryId && (
        <>
          <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <TextField label="id (مثال: iq-vent-001)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
              <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
            </div>
            <TextAreaField label="السؤال بالعربي (question_ar)" value={form.question_ar} onChange={(v) => setForm({ ...form, question_ar: v })} />
            <TextAreaField label="Question (English)" value={form.question_en ?? ''} onChange={(v) => setForm({ ...form, question_en: v })} />
            <TextAreaField label="الإجابة بالعربي (answer_ar)" value={form.answer_ar} onChange={(v) => setForm({ ...form, answer_ar: v })} />
            <TextAreaField label="Answer (English)" value={form.answer_en ?? ''} onChange={(v) => setForm({ ...form, answer_en: v })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <TextField
                label="رابط لمعرفة المزيد (related_path) — اختياري"
                value={form.related_path ?? ''}
                onChange={(v) => setForm({ ...form, related_path: v })}
                placeholder="/ecg أو /topics/anatomy/cardiovascular-system"
              />
              <TextField label="اسم الموضوع بالعربي (related_label_ar)" value={form.related_label_ar ?? ''} onChange={(v) => setForm({ ...form, related_label_ar: v })} />
              <TextField label="Topic name (related_label_en)" value={form.related_label_en ?? ''} onChange={(v) => setForm({ ...form, related_label_en: v })} />
              <TextField label="نسب المصدر (source_credit) — اختياري" value={form.source_credit ?? ''} onChange={(v) => setForm({ ...form, source_credit: v })} />
            </div>

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
                    <span className="font-medium">{q.question_ar.slice(0, 80)}</span>
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
