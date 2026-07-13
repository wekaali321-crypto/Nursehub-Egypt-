import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { allDrafts, clearDraft, timeAgo, type EditorDraft } from "../lib/draft";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";

const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

export function RecoveryCenter() {
  const nav = useNavigate();
  const { articles, versions } = useStore();
  const { notify } = useToast();
  const [drafts, setDrafts] = useState<EditorDraft[]>(() => allDrafts());
  const [tab, setTab] = useState<"drafts" | "versions" | "recent">("drafts");

  const refresh = () => setDrafts(allDrafts());
  const openDraft = (d: EditorDraft) => nav(d.id === "new" ? "/admin/editor" : `/admin/editor?id=${d.id}`);
  const discard = (id: string) => { clearDraft(id); refresh(); notify("تم حذف المسودة المحلية"); };

  const recentArticles = [...articles].sort((a, b) => (b.updatedDate || b.publishDate).localeCompare(a.updatedDate || a.publishDate)).slice(0, 10);
  const recentVersions = versions.slice(0, 15);

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">
        🛟 مركز الاسترجاع يحفظ عملك تلقائياً محلياً. حتى لو أُغلق المتصفح أو انقطع الإنترنت أو نفدت بطارية الجهاز، لن تفقد مقالك.
      </p>

      <div className="flex flex-wrap gap-2">
        {([["drafts", `المسودات التلقائية (${drafts.length})`], ["versions", `سجل النسخ (${recentVersions.length})`], ["recent", "أحدث المقالات"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{l}</button>
        ))}
      </div>

      {tab === "drafts" && (
        <div className="space-y-2">
          {drafts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700"><div className="text-4xl">✅</div><p className="mt-2">لا توجد مسودات غير محفوظة — كل شيء آمن</p></div>}
          {drafts.map((d) => (
            <div key={d.id} className={`flex items-center justify-between ${card}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold dark:text-white">{d.title || "(بدون عنوان)"}</span>
                  {!d.synced && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10">غير محفوظة</span>}
                  {d.id === "new" && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:bg-sky-500/10">مقال جديد</span>}
                </div>
                <div className="text-xs text-slate-400">آخر حفظ {timeAgo(d.savedAt)} · {d.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length} كلمة</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openDraft(d)} className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">استرجاع</button>
                <button onClick={() => discard(d.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "versions" && (
        <div className="space-y-2">
          {recentVersions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">لا توجد نسخ محفوظة بعد</div>}
          {recentVersions.map((v) => (
            <div key={v.id} className={`flex items-center justify-between ${card}`}>
              <div><div className="font-bold dark:text-white">{v.title}</div><div className="text-xs text-slate-400">{v.savedAt} · {v.author}</div></div>
              <button onClick={() => nav(v.articleId === "new" || v.articleId === "draft" ? "/admin/editor" : `/admin/editor?id=${v.articleId}`)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">فتح المقال</button>
            </div>
          ))}
        </div>
      )}

      {tab === "recent" && (
        <div className="space-y-2">
          {recentArticles.map((a) => (
            <div key={a.id} className={`flex items-center justify-between ${card}`}>
              <div><div className="font-bold dark:text-white">{a.title}</div><div className="text-xs text-slate-400">{a.status} · {a.updatedDate || a.publishDate}</div></div>
              <button onClick={() => nav(`/admin/editor?id=${a.id}`)} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">تعديل</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
