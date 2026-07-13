/** Reusable medical/nursing article templates for the editor. */

export interface EditorTemplate {
  key: string;
  name: string;
  icon: string;
  category: string;
  content: string; // starter HTML
}

export const TEMPLATES: EditorTemplate[] = [
  {
    key: "handbook", name: "دليل تمريضي (Handbook)", icon: "📘", category: "articles",
    content: `<h2>مقدمة</h2><p>نظرة عامة عن الموضوع...</p>
<div class="nh-box nh-info"><strong>🎯 أهداف التعلم:</strong><ul><li>الهدف الأول</li><li>الهدف الثاني</li></ul></div>
<h2>المحتوى الأساسي</h2><p>...</p>
<div class="nh-tip"><strong>💡 نصيحة تمريضية:</strong> ...</div>
<h2>النقاط الرئيسية</h2><ul><li>نقطة 1</li><li>نقطة 2</li></ul>
<div class="nh-box nh-info"><strong>🔖 المراجع:</strong><ol><li>...</li></ol></div>`,
  },
  {
    key: "drug", name: "دليل دواء (Drug Guide)", icon: "💊", category: "drugs",
    content: `<h2>اسم الدواء</h2>
<div class="nh-drug"><h4>💊 المعلومات الدوائية</h4><p><strong>الاسم العلمي:</strong> ...</p><p><strong>التصنيف:</strong> ...</p><p><strong>الجرعة:</strong> ...</p></div>
<h3>دواعي الاستعمال</h3><p>...</p>
<h3>موانع الاستعمال</h3><div class="nh-important"><strong>🚫 موانع:</strong> ...</div>
<h3>الآثار الجانبية</h3><ul><li>...</li></ul>
<div class="nh-clinical"><strong>🏥 الاعتبارات التمريضية:</strong> ...</div>`,
  },
  {
    key: "disease", name: "دليل مرض (Disease Guide)", icon: "🦠", category: "articles",
    content: `<h2>التعريف</h2><p><span class="nh-def">المرض</span>: ...</p>
<h2>الأسباب</h2><ul><li>...</li></ul>
<h2>الأعراض والعلامات</h2><ul><li>...</li></ul>
<h2>التشخيص</h2><p>...</p>
<h2>العلاج والتدبير التمريضي</h2><div class="nh-tip"><strong>💡 التدبير التمريضي:</strong> ...</div>
<h2>المضاعفات</h2><div class="nh-important"><strong>❗ المضاعفات:</strong> ...</div>`,
  },
  {
    key: "procedure", name: "إجراء (Procedure)", icon: "🩺", category: "skills",
    content: `<h2>اسم الإجراء</h2>
<div class="nh-box nh-info"><strong>🎯 الهدف:</strong> ...</div>
<div class="nh-procedure"><h4>🧰 الأدوات المطلوبة</h4><ul><li>...</li></ul></div>
<h3>الخطوات</h3><div class="nh-steps"><div class="nh-step"><strong>الخطوة 1</strong><br/>...</div><div class="nh-step"><strong>الخطوة 2</strong><br/>...</div></div>
<div class="nh-clinical"><strong>🏥 ملاحظات سريرية:</strong> ...</div>`,
  },
  {
    key: "careplan", name: "خطة رعاية (Care Plan)", icon: "📋", category: "careplans",
    content: `<h2>خطة الرعاية التمريضية</h2>
<table><thead><tr><th>التشخيص التمريضي</th><th>الأهداف</th><th>التدخلات</th><th>التقييم</th></tr></thead>
<tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td></tr></tbody></table>
<div class="nh-tip"><strong>💡 ملاحظة:</strong> ...</div>`,
  },
  {
    key: "case", name: "دراسة حالة (Case Study)", icon: "🧑‍⚕️", category: "articles",
    content: `<div class="nh-case"><h4>📋 بيانات المريض</h4><p>العمر / الجنس / الشكوى الرئيسية...</p></div>
<h2>العرض السريري</h2><p>...</p>
<div class="nh-scenario"><strong>🎭 السيناريو:</strong> ...<p><strong>السؤال:</strong> ما التصرف الأنسب؟</p></div>
<h2>الخطة العلاجية</h2><ol><li>...</li></ol>
<details class="nh-accordion"><summary>المناقشة والإجابة</summary><div>...</div></details>`,
  },
  {
    key: "osce", name: "OSCE Station", icon: "☑️", category: "skills",
    content: `<h2>محطة OSCE</h2>
<div class="nh-box nh-info"><strong>🎯 المهمة:</strong> ...</div>
<div class="nh-procedure"><h4>☑️ قائمة التقييم</h4><ul class="nh-checklist"><li>☐ الخطوة 1</li><li>☐ الخطوة 2</li><li>☐ الخطوة 3</li></ul></div>
<div class="nh-tip"><strong>💡 نصائح للنجاح:</strong> ...</div>`,
  },
  {
    key: "lecture", name: "ملاحظات محاضرة (Lecture Notes)", icon: "📝", category: "summaries",
    content: `<div class="nh-box nh-info"><strong>🎯 أهداف المحاضرة:</strong><ul><li>...</li></ul></div>
<h2>المحور الأول</h2><p>...</p>
<h2>المحور الثاني</h2><p>...</p>
<div class="nh-quickfacts"><strong>⚡ حقائق سريعة:</strong><ul><li>...</li></ul></div>
<h2>الخلاصة</h2><p>...</p>`,
  },
  {
    key: "research", name: "ملخص بحث (Research Summary)", icon: "🔬", category: "articles",
    content: `<h2>عنوان الدراسة</h2>
<div class="nh-card"><h4>الملخص (Abstract)</h4><p>...</p></div>
<h3>المنهجية</h3><p>...</p>
<h3>النتائج</h3><ul><li>...</li></ul>
<h3>الخلاصة والتوصيات</h3><p>...</p>
<div class="nh-box nh-info"><strong>🔖 المرجع:</strong> ...</div>`,
  },
  {
    key: "skills", name: "مهارات سريرية (Clinical Skills)", icon: "🤲", category: "skills",
    content: `<h2>المهارة السريرية</h2>
<div class="nh-box nh-info"><strong>🎯 المؤشرات:</strong> ...</div>
<h3>الخطوات العملية</h3><div class="nh-steps"><div class="nh-step">...</div><div class="nh-step">...</div></div>
<div class="nh-important"><strong>❗ احتياطات السلامة:</strong> ...</div>
<div class="nh-tip"><strong>💡 نصيحة:</strong> ...</div>`,
  },
];
