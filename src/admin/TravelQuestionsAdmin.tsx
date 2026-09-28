// src/admin/TravelQuestionsAdmin.tsx
// Admin CRUD screens for the "أسئلة السفر للخارج" (Questions for Traveling Abroad) feature.
// Mirrors the repeatable-choices-editor pattern used by LicensureExamAdmin.tsx's ExamQuestionsAdmin.
//
// Exports two components — mount them at whichever admin routes you use, e.g.:
//   /admin/travel-categories -> <TravelCategoriesAdmin />
//   /admin/travel-questions  -> <TravelQuestionsAdmin />

import { useEffect, useMemo, useState } from 'react';
import {
  fetchTravelCategories,
  upsertTravelCategory,
  deleteTravelCategory,
  fetchTravelQuestions,
  upsertTravelQuestion,
  deleteTravelQuestion,
  type TravelCategory,
  type TravelQuestion,
  type TravelChoice,
} from '../lib/travelQuestionsApi';

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
// travel_categories admin
// ---------------------------------------------------------------------------

const emptyCategory: TravelCategory = {
  id: '',
  order_num: 1,
  name_ar: '',
  name_en: '',
  icon: '✈️',
};

export function TravelCategoriesAdmin() {
  const [items, setItems] = useState<TravelCategory[]>([]);
  const [form, setForm] = useState<TravelCategory>(emptyCategory);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchTravelCategories()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSave() {
    if (!form.id) return alert('لازم تدخل id فريد (unique id required)');
    await upsertTravelCategory(form);
    setForm(emptyCategory);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟ سيتم حذف كل الأسئلة المرتبطة به أيضًا')) return;
    await deleteTravelCategory(id);
    reload();
  }

  return (
    <AdminSection title="إدارة أقسام أسئلة السفر للخارج (Travel Categories)">
      <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <TextField label="id (مثال: medsurg)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
          <TextField label="الاسم بالعربي" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} />
          <TextField label="Name (English)" value={form.name_en ?? ''} onChange={(v) => setForm({ ...form, name_en: v })} />
          <TextField label="الأيقونة (emoji)" value={form.icon ?? ''} onChange={(v) => setForm({ ...form, icon: v })} />
        </div>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
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
                <button onClick={() => setForm(c)} className="text-xs text-blue-700 underline">
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
// travel_questions admin (repeatable choices editor)
// ---------------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyQuestion(categoryId: string): TravelQuestion {
  return {
    id: '',
    category_id: categoryId,
    order_num: 1,
    question_en: '',
    question_ar: '',
    choices: [
      { letter: 'A', text: '' },
      { letter: 'B', text: '' },
      { letter: 'C', text: '' },
      { letter: 'D', text: '' },
    ],
    choices_ar: [
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

export function TravelQuestionsAdmin() {
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [items, setItems] = useState<TravelQuestion[]>([]);
  const [form, setForm] = useState<TravelQuestion>(emptyQuestion(''));
  const [loading, setLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');

  useEffect(() => {
    fetchTravelCategories().then(setCategories);
  }, []);

  function reload(categoryId: string) {
    if (!categoryId) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetchTravelQuestions(categoryId)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(selectedCategoryId);
    setForm(emptyQuestion(selectedCategoryId));
    setListSearch('');
  }, [selectedCategoryId]);

  function updateChoice(idx: number, patch: Partial<TravelChoice>) {
    const next = [...form.choices];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, choices: next });
  }

  function updateChoiceAr(idx: number, text: string) {
    const letter = form.choices[idx]?.letter ?? '';
    const next = [...(form.choices_ar ?? [])];
    next[idx] = { letter, text };
    setForm({ ...form, choices_ar: next });
  }

  function addChoice() {
    const nextLetter = LETTERS[form.choices.length] ?? String(form.choices.length + 1);
    setForm({
      ...form,
      choices: [...form.choices, { letter: nextLetter, text: '' }],
      choices_ar: [...(form.choices_ar ?? []), { letter: nextLetter, text: '' }],
    });
  }

  function removeChoice(idx: number) {
    const next = form.choices.filter((_, i) => i !== idx);
    const nextAr = (form.choices_ar ?? []).filter((_, i) => i !== idx);
    setForm({ ...form, choices: next, choices_ar: nextAr });
  }

  function editQuestion(q: TravelQuestion) {
    const choicesAr = q.choices.map((c, i) => q.choices_ar?.[i] ?? { letter: c.letter, text: '' });
    setForm({ ...q, question_ar: q.question_ar ?? '', choices_ar: choicesAr });
  }

  async function handleSave() {
    if (!form.id || !form.category_id) return alert('لازم id و category_id');
    await upsertTravelQuestion(form);
    setForm(emptyQuestion(selectedCategoryId));
    reload(selectedCategoryId);
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteTravelQuestion(id);
    reload(selectedCategoryId);
  }

  const filteredItems = useMemo(() => {
    const term = listSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (q) => q.question_en.toLowerCase().includes(term) || (q.question_ar ?? '').toLowerCase().includes(term) || q.id.toLowerCase().includes(term)
    );
  }, [items, listSearch]);

  return (
    <AdminSection title="إدارة أسئلة السفر للخارج (Travel Questions)">
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
              <TextField label="id (مثال: travel-medsurg-001)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
              <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
            </div>
            <TextAreaField label="نص السؤال (question_en)" value={form.question_en} onChange={(v) => setForm({ ...form, question_en: v })} />
            <TextAreaField label="ترجمة السؤال بالعربي (question_ar)" value={form.question_ar ?? ''} onChange={(v) => setForm({ ...form, question_ar: v })} />

            <div className="mb-3">
              <span className="block text-xs text-slate-500 mb-2">الاختيارات (Choices) — إنجليزي وترجمتها بالعربي</span>
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
                    placeholder="نص الاختيار (English)"
                  />
                  <input
                    className="flex-1 rounded-lg border border-slate-200 p-2 text-sm"
                    value={form.choices_ar?.[idx]?.text ?? ''}
                    onChange={(e) => updateChoiceAr(idx, e.target.value)}
                    placeholder="الترجمة بالعربي"
                  />
                  <button onClick={() => removeChoice(idx)} className="text-xs text-red-600 px-2">
                    حذف
                  </button>
                </div>
              ))}
              <button onClick={addChoice} className="text-xs text-blue-700 underline">
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

            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
              حفظ (Save)
            </button>
          </div>

          <div className="mb-3">
            <input
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              placeholder={`بحث داخل ${items.length} سؤال في هذا القسم...`}
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-slate-400">جاري التحميل...</div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="text-sm">
                    <span className="text-slate-400 text-xs">#{q.order_num}</span>{' '}
                    <span className="font-medium">{(q.question_ar || q.question_en).slice(0, 80)}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => editQuestion(q)} className="text-xs text-blue-700 underline">
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="text-xs text-red-600 underline">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && <div className="text-slate-400 text-sm py-6 text-center">لا توجد نتائج</div>}
            </div>
          )}
        </>
      )}
    </AdminSection>
  );
}
