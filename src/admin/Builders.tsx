import { useState } from "react";
import { useStore } from "../lib/store";

const sectionLabels: Record<string, string> = {
  hero: "🎯 البانر الرئيسي (Hero)",
  search: "🔍 شريط البحث",
  stats: "📊 الإحصائيات",
  featured: "⭐ المحتوى المميز",
  categories: "📂 الأقسام",
  latest: "🆕 أحدث المقالات",
  popular: "🔥 الأكثر قراءة",
  pdfs: "📄 ملفات PDF والكتب",
  quizzes: "🧠 الاختبارات",
  tools: "🧮 الأدوات الطبية",
  store: "🛒 المتجر",
  newsletter: "📧 النشرة البريدية",
};

// Sections available to add from the builder
const AVAILABLE_SECTIONS = ["hero", "search", "stats", "featured", "categories", "latest", "popular", "pdfs", "quizzes", "tools", "store", "newsletter"];

const EDITABLE_META = ["featured", "categories", "latest", "popular", "pdfs", "quizzes", "tools", "store"];

export function HomeBuilder() {
  const { homeSections, homeSectionMeta, setData } = useStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [editMeta, setEditMeta] = useState<string | null>(null);

  const move = (from: number, to: number) => {
    setData((d) => {
      const arr = [...d.homeSections];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...d, homeSections: arr };
    });
  };

  const setMeta = (key: string, field: "title" | "subtitle", value: string) =>
    setData((d) => ({ ...d, homeSectionMeta: { ...d.homeSectionMeta, [key]: { title: d.homeSectionMeta[key]?.title ?? "", subtitle: d.homeSectionMeta[key]?.subtitle ?? "", [field]: value } } }));

  return (
    <div className="max-w-2xl space-y-3">
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">🖱️ اسحب لإعادة الترتيب · ✏️ لتعديل عناوين الأقسام · ✕ لإخفائها. كل التغييرات تنعكس فوراً. لإدارة بطاقات الأقسام استخدم <a href="/admin/home-categories" className="font-bold underline">«بطاقات الرئيسية»</a>.</p>
      {homeSections.map((s, i) => (
        <div key={s} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
            className="flex cursor-move items-center justify-between p-4 hover:border-sky-400"
          >
            <span className="flex items-center gap-3 font-semibold dark:text-white"><span className="text-slate-400">⠿</span>{sectionLabels[s] ?? s}</span>
            <div className="flex gap-1">
              {EDITABLE_META.includes(s) && <button onClick={() => setEditMeta(editMeta === s ? null : s)} className="rounded-lg bg-sky-100 px-2 py-1 text-sky-600 dark:bg-sky-500/10" title="تعديل العنوان">✏️</button>}
              <button onClick={() => i > 0 && move(i, i - 1)} className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">↑</button>
              <button onClick={() => i < homeSections.length - 1 && move(i, i + 1)} className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">↓</button>
              <button onClick={() => setData((d) => ({ ...d, homeSections: d.homeSections.filter((_, idx) => idx !== i) }))} className="rounded-lg bg-red-100 px-2 py-1 text-red-600 dark:bg-red-500/10" title="إخفاء القسم">✕</button>
            </div>
          </div>
          {editMeta === s && EDITABLE_META.includes(s) && (
            <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <input value={homeSectionMeta[s]?.title ?? ""} onChange={(e) => setMeta(s, "title", e.target.value)} placeholder="عنوان القسم" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input value={homeSectionMeta[s]?.subtitle ?? ""} onChange={(e) => setMeta(s, "subtitle", e.target.value)} placeholder="العنوان الفرعي" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </div>
          )}
        </div>
      ))}

      {/* Add hidden sections */}
      {AVAILABLE_SECTIONS.filter((s) => !homeSections.includes(s)).length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <h4 className="mb-2 text-sm font-bold dark:text-white">➕ إضافة قسم مخفي</h4>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SECTIONS.filter((s) => !homeSections.includes(s)).map((s) => (
              <button key={s} onClick={() => setData((d) => ({ ...d, homeSections: [...d.homeSections, s] }))} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">+ {sectionLabels[s] ?? s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MenuAdmin() {
  const { menu, setData } = useStore();
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");

  const add = () => {
    if (!label || !path) return;
    setData((d) => ({ ...d, menu: [...d.menu, { label, path }] }));
    setLabel(""); setPath("");
  };
  const del = (i: number) => setData((d) => ({ ...d, menu: d.menu.filter((_, idx) => idx !== i) }));
  const move = (from: number, to: number) => setData((d) => { const arr = [...d.menu]; const [it] = arr.splice(from, 1); arr.splice(to, 0, it); return { ...d, menu: arr }; });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-2">
        {menu.map((m, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div><span className="font-semibold dark:text-white">{m.label}</span><span className="ms-2 text-sm text-slate-400">{m.path}</span></div>
            <div className="flex gap-1">
              <button onClick={() => i > 0 && move(i, i - 1)} className="rounded bg-slate-100 px-2 dark:bg-slate-800">↑</button>
              <button onClick={() => i < menu.length - 1 && move(i, i + 1)} className="rounded bg-slate-100 px-2 dark:bg-slate-800">↓</button>
              <button onClick={() => del(i)} className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="اسم الرابط" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="المسار مثل /about" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <button onClick={add} className="rounded-lg bg-sky-500 px-5 font-bold text-white">إضافة</button>
      </div>
    </div>
  );
}

export function SEOAdmin() {
  const { settings, setData } = useStore();
  const [local, setLocal] = useState(settings);
  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

  const save = () => { setData((d) => ({ ...d, settings: local })); alert("✅ تم حفظ الإعدادات"); };

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">⚙️ إعدادات الموقع</h3>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">اسم الموقع</label><input value={local.siteName} onChange={(e) => setLocal({ ...local, siteName: e.target.value })} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">الشعار النصي</label><input value={local.tagline} onChange={(e) => setLocal({ ...local, tagline: e.target.value })} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">Meta Description</label><textarea value={local.metaDescription} onChange={(e) => setLocal({ ...local, metaDescription: e.target.value })} rows={3} className={inp} /></div>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">💰 إعدادات الإعلانات</h3>
        <label className="flex items-center gap-2"><input type="checkbox" checked={local.adsenseEnabled} onChange={(e) => setLocal({ ...local, adsenseEnabled: e.target.checked })} /><span className="text-sm dark:text-slate-300">تفعيل Google AdSense</span></label>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">معرّف AdSense (ca-pub-...)</label><input value={local.adsenseClient} onChange={(e) => setLocal({ ...local, adsenseClient: e.target.value })} className={inp} /></div>
        <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600 dark:bg-emerald-500/10">✅ تم تفعيل: Schema.org، Open Graph، Canonical URLs، Sitemap.xml، Robots.txt، Lazy Loading، WebP، توليد Slug تلقائي.</div>
      </div>
      <div className="lg:col-span-2"><button onClick={save} className="rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 px-8 py-2.5 font-bold text-white">حفظ الإعدادات</button></div>
    </div>
  );
}

export function BackupAdmin() {
  const { exportData, importData, resetData, backend, seedRemote, hasDemoData, deleteDemoData } = useStore();
  const [text, setText] = useState("");
  const [seeding, setSeeding] = useState(false);

  const doSeed = async () => {
    if (!confirm("سيتم إدخال بيانات البداية إلى Supabase. متابعة؟")) return;
    setSeeding(true);
    try { await seedRemote(); alert("✅ تم إدخال البيانات إلى Supabase"); }
    catch { alert("❌ فشل — تأكد من تنفيذ schema.sql والصلاحيات"); }
    finally { setSeeding(false); }
  };

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nursehub-backup-${Date.now()}.json`; a.click();
  };

  const doImport = () => {
    if (importData(text)) { alert("✅ تم استيراد البيانات بنجاح"); setText(""); }
    else alert("❌ صيغة JSON غير صحيحة");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f); }
  };

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">💾 نسخ احتياطي وتصدير</h3>
        <p className="text-sm text-slate-500">قم بتنزيل نسخة كاملة من بيانات الموقع (المقالات، المنتجات، الإعدادات...).</p>
        <button onClick={download} className="w-full rounded-lg bg-sky-500 py-2.5 font-bold text-white">⬇️ تنزيل نسخة احتياطية (JSON)</button>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">📥 استيراد واستعادة</h3>
        <input type="file" accept=".json" onChange={onFile} className="text-sm" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="أو الصق محتوى JSON هنا..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <button onClick={doImport} className="w-full rounded-lg bg-emerald-500 py-2.5 font-bold text-white">📤 استيراد البيانات</button>
      </div>

      <div className={`lg:col-span-2 rounded-2xl border p-5 ${backend === "supabase" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/5" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/5"}`}>
        <h3 className="font-bold dark:text-white">🗄️ قاعدة البيانات: {backend === "supabase" ? "Supabase (إنتاج)" : "وضع المعاينة المحلي"}</h3>
        <p className="my-2 text-sm text-slate-600 dark:text-slate-300">
          {backend === "supabase"
            ? "كل البيانات (المقالات، الوسائط، المستخدمون، التعليقات، الإعدادات، الملفات) تُحفظ حصرياً في Supabase. للنسخ الاحتياطي الكامل استخدم أيضاً Database Backups في لوحة Supabase."
            : "لا توجد مفاتيح Supabase — يعمل الموقع بوضع معاينة محلي. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في .env للتشغيل الإنتاجي الكامل."}
        </p>
        {backend === "supabase" && (
          <button onClick={doSeed} disabled={seeding} className="rounded-lg bg-sky-500 px-6 py-2 font-bold text-white disabled:opacity-60">
            {seeding ? "جارٍ الإدخال..." : "🌱 إدخال بيانات البداية إلى Supabase"}
          </button>
        )}
      </div>

      {hasDemoData && (
        <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-500/5">
          <h3 className="font-bold text-amber-600">🎭 بيانات تجريبية (Demo)</h3>
          <p className="my-2 text-sm text-amber-600 dark:text-amber-400">يحتوي الموقع على محتوى تجريبي (اختبارات، أنواع محتوى) مُعلّم كـ Demo. يمكنك حذفه بالكامل بنقرة واحدة للبدء بمحتوى نظيف.</p>
          <button onClick={() => { if (confirm("حذف كل البيانات التجريبية؟")) deleteDemoData(); }} className="rounded-lg bg-amber-500 px-6 py-2 font-bold text-white">🗑️ حذف البيانات التجريبية</button>
        </div>
      )}

      <div className="lg:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-500/5">
        <h3 className="font-bold text-red-600">{backend === "supabase" ? "🔄 إعادة تحميل من Supabase" : "⚠️ منطقة الخطر"}</h3>
        <p className="my-2 text-sm text-red-500">{backend === "supabase" ? "إعادة جلب أحدث البيانات من قاعدة Supabase." : "إعادة تعيين كل البيانات للوضع الافتراضي. لا يمكن التراجع."}</p>
        <button onClick={() => { if (backend === "supabase" || confirm("هل أنت متأكد من إعادة التعيين؟")) resetData(); }} className="rounded-lg bg-red-500 px-6 py-2 font-bold text-white">{backend === "supabase" ? "إعادة التحميل" : "إعادة تعيين البيانات"}</button>
      </div>
    </div>
  );
}
