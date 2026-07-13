import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { CATEGORY_LABELS } from "../lib/types";

const statusStyle: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10",
  draft: "bg-slate-200 text-slate-600 dark:bg-slate-700",
  scheduled: "bg-amber-100 text-amber-600 dark:bg-amber-500/10",
};
const statusLabel: Record<string, string> = { published: "منشور", draft: "مسودة", scheduled: "مجدول" };

export default function ArticlesAdmin() {
  const { articles, moveToTrash, logActivity } = useStore();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  let list = articles;
  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (search) list = list.filter((a) => a.title.includes(search));

  const del = (id: string) => {
    const art = articles.find((a) => a.id === id);
    if (art && confirm("نقل هذا المقال إلى سلة المحذوفات؟")) {
      moveToTrash("article", art, art.title);
      logActivity("حذف مقال (إلى السلة)", art.title);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", "published", "draft", "scheduled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{f === "all" ? "الكل" : statusLabel[f]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <Link to="/admin/editor" className="rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 px-4 py-2 text-sm font-bold text-white">+ مقال جديد</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <tr><th className="p-3">العنوان</th><th className="p-3">القسم</th><th className="p-3">الحالة</th><th className="p-3">المشاهدات</th><th className="p-3">التاريخ</th><th className="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-white">{a.title}</td>
                <td className="p-3 text-slate-500">{CATEGORY_LABELS[a.category]}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyle[a.status]}`}>{statusLabel[a.status]}</span></td>
                <td className="p-3 text-slate-500">{a.views.toLocaleString("ar-EG")}</td>
                <td className="p-3 text-slate-500">{a.publishDate}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => nav(`/admin/editor?id=${a.id}`)} className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
                    <button onClick={() => del(a.id)} className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">لا توجد مقالات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
