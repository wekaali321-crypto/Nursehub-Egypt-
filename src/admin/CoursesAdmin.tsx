// src/admin/CoursesAdmin.tsx
// Admin CRUD screens for the "الكورسات" (Courses) section. Mirrors TravelQuestionsAdmin.tsx.
//
// Exports three components — mounted at:
//   /admin/courses          -> <CoursesAdmin />          (courses)
//   /admin/course-chapters  -> <CourseChaptersAdmin />   (chapters with bilingual HTML content)
//   /admin/course-questions -> <CourseQuestionsAdmin />  (quiz questions, multi-answer supported)

import { useEffect, useMemo, useState } from 'react';
import {
  fetchCourses,
  upsertCourse,
  deleteCourse,
  fetchCourseChapters,
  upsertCourseChapter,
  deleteCourseChapter,
  fetchCourseQuestions,
  upsertCourseQuestion,
  deleteCourseQuestion,
  type Course,
  type CourseChapter,
  type CourseQuestion,
  type CourseChoice,
} from '../lib/coursesApi';
import { AdminSection, TextField, TextAreaField } from './TravelQuestionsAdmin';
import { sanitizeHtml } from '../utils/sanitizeHtml';

function CourseSelect({ courses, value, onChange }: { courses: Course[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block mb-6">
      <span className="block text-xs text-slate-500 mb-1">اختر الكورس (Course)</span>
      <select className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— اختر —</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title_ar} ({c.id})
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// courses admin
// ---------------------------------------------------------------------------

const emptyCourse: Course = {
  id: '',
  order_num: 1,
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  icon: '🎓',
  image_url: '',
};

export function CoursesAdmin() {
  const [items, setItems] = useState<Course[]>([]);
  const [form, setForm] = useState<Course>(emptyCourse);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchCourses()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSave() {
    if (!form.id) return alert('لازم تدخل id فريد (unique id required)');
    await upsertCourse({ ...form, image_url: form.image_url?.trim() || null });
    setForm(emptyCourse);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟ سيتم حذف كل الفصول والأسئلة المرتبطة به أيضًا')) return;
    await deleteCourse(id);
    reload();
  }

  return (
    <AdminSection title="إدارة الكورسات (Courses)">
      <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <TextField label="id (مثال: acls)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
          <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
          <TextField label="العنوان بالعربي" value={form.title_ar} onChange={(v) => setForm({ ...form, title_ar: v })} />
          <TextField label="Title (English)" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
          <TextField label="الأيقونة (emoji)" value={form.icon ?? ''} onChange={(v) => setForm({ ...form, icon: v })} />
          <TextField label="رابط صورة الغلاف (اختياري)" value={form.image_url ?? ''} onChange={(v) => setForm({ ...form, image_url: v })} />
        </div>
        <TextAreaField label="الوصف بالعربي" value={form.description_ar ?? ''} onChange={(v) => setForm({ ...form, description_ar: v })} />
        <TextAreaField label="Description (English)" value={form.description_en ?? ''} onChange={(v) => setForm({ ...form, description_en: v })} />
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
                <span className="font-medium">{c.title_ar}</span> <span className="text-slate-400 text-xs">({c.id})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...emptyCourse, ...c })} className="text-xs text-blue-700 underline">
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
// chapters admin (bilingual HTML content with live preview)
// ---------------------------------------------------------------------------

function emptyChapter(courseId: string): CourseChapter {
  return { id: '', course_id: courseId, order_num: 1, title_ar: '', title_en: '', icon: '📖', content_ar: '', content_en: '' };
}

function HtmlField({ label, value, onChange, dir }: { label: string; value: string; onChange: (v: string) => void; dir: 'rtl' | 'ltr' }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs text-blue-700 underline">
          {preview ? 'تحرير HTML' : 'معاينة'}
        </button>
      </div>
      {preview ? (
        <div
          dir={dir}
          className="prose-content course-content max-w-none rounded-lg border border-slate-200 bg-white p-3 min-h-[200px]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        />
      ) : (
        <textarea
          dir={dir}
          className="w-full rounded-lg border border-slate-200 p-2 text-sm font-mono min-h-[260px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function CourseChaptersAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [items, setItems] = useState<CourseChapter[]>([]);
  const [form, setForm] = useState<CourseChapter>(emptyChapter(''));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  function reload(id: string) {
    if (!id) return setItems([]);
    setLoading(true);
    fetchCourseChapters(id)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(courseId);
    setForm(emptyChapter(courseId));
  }, [courseId]);

  async function handleSave() {
    if (!form.id || !form.course_id) return alert('لازم id و course_id');
    await upsertCourseChapter(form);
    setForm(emptyChapter(courseId));
    reload(courseId);
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteCourseChapter(id);
    reload(courseId);
  }

  return (
    <AdminSection title="إدارة فصول الكورسات (Course Chapters)">
      <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />

      {courseId && (
        <>
          <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <TextField label="id (مثال: acls-ch01)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
              <TextField label="الترتيب (order_num)" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
              <TextField label="العنوان بالعربي" value={form.title_ar} onChange={(v) => setForm({ ...form, title_ar: v })} />
              <TextField label="Title (English)" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
              <TextField label="الأيقونة (emoji)" value={form.icon ?? ''} onChange={(v) => setForm({ ...form, icon: v })} />
            </div>
            <HtmlField label="المحتوى بالعربي (HTML)" value={form.content_ar} onChange={(v) => setForm({ ...form, content_ar: v })} dir="rtl" />
            <HtmlField label="Content (English HTML)" value={form.content_en} onChange={(v) => setForm({ ...form, content_en: v })} dir="ltr" />
            <p className="mb-3 text-xs text-slate-400">
              الصور: /course-img/{courseId}/ملف.webp — استخدم &lt;figure class="nh-fig"&gt;&lt;img src alt&gt;&lt;figcaption&gt;…&lt;/figcaption&gt;&lt;/figure&gt; وصناديق &lt;div class="nh-box nh-info|nh-warning|nh-success|nh-error"&gt;.
            </p>
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
                  <div className="text-sm">
                    <span className="text-slate-400 text-xs">#{c.order_num}</span> <span className="me-1">{c.icon}</span>
                    <span className="font-medium">{c.title_ar}</span> <span className="text-slate-400 text-xs">({c.id})</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setForm(c)} className="text-xs text-blue-700 underline">
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 underline">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-slate-400 text-sm py-6 text-center">لا توجد فصول</div>}
            </div>
          )}
        </>
      )}
    </AdminSection>
  );
}

// ---------------------------------------------------------------------------
// questions admin (repeatable choices editor, multi-answer checkboxes)
// ---------------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyQuestion(courseId: string): CourseQuestion {
  const blank = () => LETTERS.slice(0, 4).map((letter) => ({ letter, text: '' }));
  return {
    id: '',
    course_id: courseId,
    chapter_id: null,
    order_num: 1,
    question_en: '',
    question_ar: '',
    choices: blank(),
    choices_ar: blank(),
    correct_letter: 'A',
    rationale_ar: '',
    rationale_en: '',
    image_url: null,
  };
}

export function CourseQuestionsAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [items, setItems] = useState<CourseQuestion[]>([]);
  const [form, setForm] = useState<CourseQuestion>(emptyQuestion(''));
  const [loading, setLoading] = useState(false);
  const [listSearch, setListSearch] = useState('');

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  function reload(id: string) {
    if (!id) return setItems([]);
    setLoading(true);
    fetchCourseQuestions(id)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(courseId);
    setForm(emptyQuestion(courseId));
    setListSearch('');
    setChapters([]);
    if (courseId) fetchCourseChapters(courseId).then(setChapters);
  }, [courseId]);

  function updateChoice(idx: number, patch: Partial<CourseChoice>) {
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
    setForm({
      ...form,
      choices: form.choices.filter((_, i) => i !== idx),
      choices_ar: (form.choices_ar ?? []).filter((_, i) => i !== idx),
    });
  }

  function editQuestion(q: CourseQuestion) {
    const choicesAr = q.choices.map((c, i) => q.choices_ar?.[i] ?? { letter: c.letter, text: '' });
    setForm({ ...q, choices_ar: choicesAr });
  }

  async function handleSave() {
    if (!form.id || !form.course_id) return alert('لازم id و course_id');
    await upsertCourseQuestion({ ...form, chapter_id: form.chapter_id || null });
    setForm(emptyQuestion(courseId));
    reload(courseId);
  }

  async function handleDelete(id: string) {
    if (!confirm('متأكد من الحذف؟')) return;
    await deleteCourseQuestion(id);
    reload(courseId);
  }

  const filteredItems = useMemo(() => {
    const term = listSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter((q) => q.question_en.toLowerCase().includes(term) || q.question_ar.toLowerCase().includes(term) || q.id.toLowerCase().includes(term));
  }, [items, listSearch]);

  return (
    <AdminSection title="إدارة أسئلة الكورسات (Course Questions)">
      <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />

      {courseId && (
        <>
          <div className="rounded-xl border border-slate-200 p-4 mb-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <TextField label="id (مثال: acls-q-001)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
              <TextField label="الترتيب (order_num) — فريد داخل الكورس" value={String(form.order_num)} onChange={(v) => setForm({ ...form, order_num: Number(v) || 0 })} />
            </div>
            <label className="block mb-3">
              <span className="block text-xs text-slate-500 mb-1">الفصل المرتبط (اختياري)</span>
              <select
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                value={form.chapter_id ?? ''}
                onChange={(e) => setForm({ ...form, chapter_id: e.target.value || null })}
              >
                <option value="">— بدون فصل —</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.order_num}. {c.title_ar} ({c.id})
                  </option>
                ))}
              </select>
            </label>
            <TextAreaField label="نص السؤال (question_en)" value={form.question_en} onChange={(v) => setForm({ ...form, question_en: v })} />
            <TextAreaField label="ترجمة السؤال بالعربي (question_ar)" value={form.question_ar} onChange={(v) => setForm({ ...form, question_ar: v })} />
            <TextField
              label={`رابط صورة السؤال (اختياري): /course-img/${courseId}/xxx.webp أو رابط كامل`}
              value={form.image_url ?? ''}
              onChange={(v) => setForm({ ...form, image_url: v.trim() || null })}
            />
            {form.image_url && <img src={form.image_url} alt="" className="mb-3 max-h-48 rounded-lg border border-slate-200" />}

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
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 p-2 text-sm"
                    value={choice.text}
                    onChange={(e) => updateChoice(idx, { text: e.target.value })}
                    placeholder="نص الاختيار (English)"
                  />
                  <input
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 p-2 text-sm"
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

            <div className="mb-3">
              <span className="block text-xs text-slate-500 mb-1">
                الإجابة الصحيحة (correct_letter) — اختر إجابة واحدة، أو أكثر من إجابة لسؤال "اختار كل ما ينطبق"
              </span>
              <div className="flex flex-wrap gap-3">
                {form.choices.map((c) => {
                  const set = form.correct_letter.split(',').map((x) => x.trim()).filter(Boolean);
                  const checked = set.includes(c.letter);
                  return (
                    <label key={c.letter} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? set.filter((x) => x !== c.letter) : [...set, c.letter];
                          next.sort();
                          setForm({ ...form, correct_letter: next.join(',') });
                        }}
                      />
                      {c.letter}
                    </label>
                  );
                })}
              </div>
              {form.correct_letter.includes(',') && (
                <p className="mt-1 text-xs text-amber-600">سؤال متعدد الاختيارات: سيظهر للطالب تنبيه ويجب اختيار كل الإجابات الصحيحة.</p>
              )}
            </div>

            <TextAreaField label="الشرح بالعربي (rationale_ar)" value={form.rationale_ar} onChange={(v) => setForm({ ...form, rationale_ar: v })} />
            <TextAreaField label="Rationale (English)" value={form.rationale_en} onChange={(v) => setForm({ ...form, rationale_en: v })} />

            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
              حفظ (Save)
            </button>
          </div>

          <div className="mb-3">
            <input
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              placeholder={`بحث داخل ${items.length} سؤال في هذا الكورس...`}
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
