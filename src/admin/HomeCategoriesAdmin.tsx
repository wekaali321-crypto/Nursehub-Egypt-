import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import MediaPicker from "./MediaPicker";
import type { HomeCategory } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

const COLORS = [
  "from-sky-500 to-blue-500", "from-emerald-500 to-teal-500", "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500", "from-rose-500 to-pink-500", "from-cyan-500 to-sky-500",
  "from-indigo-500 to-blue-600", "from-fuchsia-500 to-pink-500", "from-lime-500 to-green-500",
  "from-slate-600 to-slate-700",
];
const ICONS = ["📝", "📚", "💊", "🩺", "📋", "📖", "🧠", "🧮", "🎓", "🏥", "❤️", "🔬", "💉", "📊", "🎯", "⭐", "🔖", "📁"];

// Common internal destinations to pick from (plus a custom URL option)
const LINK_PRESETS = [
  { label: "المقالات", value: "/category/articles" },
  { label: "الملخصات", value: "/category/summaries" },
  { label: "المهارات", value: "/category/skills" },
  { label: "خطط الرعاية", value: "/category/careplans" },
  { label: "الكتب وPDF", value: "/category/books" },
  { label: "دليل الأدوية", value: "/drugs" },
  { label: "الاختبارات", value: "/quizzes" },
  { label: "الأدوات الطبية", value: "/tools" },
  { label: "المتجر", value: "/store" },
  { label: "من نحن", value: "/about" },
  { label: "اتصل بنا", value: "/contact" },
];

const blank = (order: number): HomeCategory => ({
  id: "hc" + Date.now(), title: "", icon: "📝", description: "",
  color: COLORS[0], order, visible: true, link: "/category/articles",
});

export function HomeCategoriesAdmin() {
  const { homeCategories, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [editing, setEditing] = useState<HomeCategory | null>(null);
  const [picker, setPicker] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [customLink, setCustomLink] = useState(false);

  const cards = [...homeCategories].sort((a, b) => a.order - b.order);

  const persist = (next: HomeCategory[]) =>
    setData((d) => ({ ...d, homeCategories: next.map((c, i) => ({ ...c, order: i })) }));

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) return notify("أدخل عنوان البطاقة", "error");
    const exists = homeCategories.some((c) => c.id === editing.id);
    const next = exists ? homeCategories.map((c) => (c.id === editing.id ? editing : c)) : [...homeCategories, editing];
    persist([...next].sort((a, b) => a.order - b.order));
    logActivity(exists ? "تعديل بطاقة رئيسية" : "إضافة بطاقة رئيسية", editing.title);
    notify("تم الحفظ — تم تحديث الصفحة الرئيسية");
    setEditing(null); setCustomLink(false);
  };
  const del = (id: string) => { if (confirm("حذف هذه البطاقة؟")) { persist(homeCategories.filter((c) => c.id !== id)); notify("تم الحذف"); } };
  const toggle = (id: string) => persist(homeCategories.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));

  const move = (from: number, to: number) => {
    const arr = [...cards];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    persist(arr);
  };

  // ---- Editor form ----
  if (editing) {
    const isPreset = LINK_PRESETS.some((l) => l.value === editing.link);
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">{homeCategories.some((c) => c.id === editing.id) ? "تعديل بطاقة" : "بطاقة جديدة"}</h2>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(null); setCustomLink(false); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700 dark:text-white">إلغاء</button>
            <button onClick={save} className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-bold text-white">حفظ</button>
          </div>
        </div>

        {/* Live preview */}
        <div className={card}>
          <div className="mb-2 text-xs font-bold text-slate-400">معاينة</div>
          <div className="mx-auto w-40 rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            {editing.image
              ? <img src={editing.image} alt="" className="mx-auto mb-2 h-14 w-14 rounded-xl object-cover" />
              : <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${editing.color} text-2xl text-white`}>{editing.icon}</div>}
            <div className="text-sm font-bold dark:text-white">{editing.title || "العنوان"}</div>
            <div className="text-[11px] text-slate-400">{editing.description || "الوصف"}</div>
          </div>
        </div>

        <div className={`space-y-3 ${card}`}>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">العنوان</label><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inp} /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">الوصف</label><input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inp} /></div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">الأيقونة</label>
            <div className="flex flex-wrap gap-1">
              {ICONS.map((ic) => <button key={ic} onClick={() => setEditing({ ...editing, icon: ic })} className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${editing.icon === ic ? "bg-sky-500" : "bg-slate-100 dark:bg-slate-800"}`}>{ic}</button>)}
              <input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-center dark:border-slate-700 dark:bg-slate-800" placeholder="مخصص" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">اللون</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((cl) => <button key={cl} onClick={() => setEditing({ ...editing, color: cl })} className={`h-8 w-8 rounded-lg bg-gradient-to-br ${cl} ${editing.color === cl ? "ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-slate-900" : ""}`} />)}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">صورة (اختياري — تحل محل الأيقونة)</label>
            <div className="flex gap-2">
              <input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="رابط الصورة أو اختر من المكتبة" className={inp} />
              <button onClick={() => setPicker(true)} className="shrink-0 rounded-lg bg-sky-500 px-3 text-sm font-bold text-white">📚</button>
              {editing.image && <button onClick={() => setEditing({ ...editing, image: "" })} className="shrink-0 rounded-lg bg-red-100 px-3 text-sm font-bold text-red-600 dark:bg-red-500/10">✕</button>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">الوجهة (صفحة أو رابط)</label>
            {!customLink && isPreset ? (
              <select value={editing.link} onChange={(e) => { if (e.target.value === "__custom") { setCustomLink(true); } else setEditing({ ...editing, link: e.target.value }); }} className={inp}>
                {LINK_PRESETS.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.value})</option>)}
                <option value="__custom">🔗 رابط مخصص...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="/custom-page أو https://..." className={inp} />
                <button onClick={() => { setCustomLink(false); setEditing({ ...editing, link: LINK_PRESETS[0].value }); }} className="shrink-0 rounded-lg bg-slate-100 px-3 text-xs font-bold dark:bg-slate-800 dark:text-white">قائمة</button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm dark:text-white">
            <input type="checkbox" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} /> ظاهرة في الصفحة الرئيسية
          </label>
        </div>

        {picker && <MediaPicker accept={["image"]} onPick={(m) => { setEditing({ ...editing, image: m.url }); setPicker(false); }} onClose={() => setPicker(false)} />}
      </div>
    );
  }

  // ---- List with drag & drop ----
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">🖱️ اسحب البطاقات لإعادة الترتيب. كل التغييرات تنعكس فوراً على الصفحة الرئيسية.</p>
        <button onClick={() => setEditing(blank(homeCategories.length))} className="shrink-0 rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white">+ بطاقة</button>
      </div>

      <div className="space-y-2">
        {cards.map((c, i) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
            className={`flex cursor-move items-center gap-3 ${card} ${!c.visible ? "opacity-50" : ""}`}
          >
            <span className="text-slate-400">⠿</span>
            {c.image
              ? <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
              : <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-xl text-white`}>{c.icon}</div>}
            <div className="flex-1">
              <div className="font-bold dark:text-white">{c.title} {c.demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">Demo</span>}</div>
              <div className="text-xs text-slate-400">{c.link}</div>
            </div>
            <button onClick={() => toggle(c.id)} className={`rounded-full px-3 py-1 text-xs font-bold ${c.visible ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>{c.visible ? "ظاهرة" : "مخفية"}</button>
            <button onClick={() => setEditing(c)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
            <button onClick={() => del(c.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
          </div>
        ))}
        {cards.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">لا توجد بطاقات — أضف أول بطاقة</div>}
      </div>
    </div>
  );
}
