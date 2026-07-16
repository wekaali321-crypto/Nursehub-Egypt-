import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { useStore, slugify, readingTime } from "../lib/store";
import { useToast } from "../components/Toast";
import { compressToWebP } from "../lib/image";
import { saveDraft, loadDraft, clearDraft, type EditorDraft } from "../lib/draft";
import { supabase } from "../lib/supabase";
import MediaPicker from "./MediaPicker";
import { CATEGORY_LABELS, type Article, type Category, type MediaItem } from "../lib/types";
import {
  BLOCKS, BLOCK_GROUPS, FONT_SIZES, FONT_FAMILIES, TEXT_COLORS, BG_COLORS,
  aiTitleSuggestions, aiMetaDescription, aiKeywords, aiImproveText, aiSummarize,
  readabilityScore, seoScore,
} from "./editorBlocks";
import { TEMPLATES } from "./editorTemplates";

const EMOJIS = ["😀","👍","❤️","⭐","✅","❌","⚠️","💡","🩺","💊","🏥","🧠","🫀","🩸","🌡️","💉","🧬","📋","📊","🔬","👨‍⚕️","👩‍⚕️","🚑","➕","➖","❗","❓","🔥","📌","🎯"];
const SPECIAL_CHARS = ["→","←","↑","↓","°","±","×","÷","≈","≤","≥","≠","∞","µ","α","β","γ","Δ","Σ","√","℃","℉","™","©","®","§","•","–","—","«","»"];
const DEFAULT_CONTENT = "<h2>عنوان فرعي</h2><p>ابدأ الكتابة هنا...</p>";

// Legacy execCommand-style fontSize values (1-7) mapped to real CSS sizes,
// used if editorBlocks.FONT_SIZES still ships the old numeric scale.
const LEGACY_SIZE_PX: Record<string, string> = { "1": "10px", "2": "13px", "3": "16px", "4": "18px", "5": "24px", "6": "32px", "7": "48px" };
const toCssSize = (v: string) => (/px|em|rem|%/.test(v) ? v : (LEGACY_SIZE_PX[v] ?? v));

// --- Custom Tiptap extensions (not published as separate packages) ---

/** Adds a `fontSize` attribute to the textStyle mark, rendered as inline CSS. */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.fontSize || null,
          renderHTML: (attributes: { fontSize?: string | null }) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

/** Adds a `lineHeight` attribute to paragraphs & headings, rendered as inline CSS. */
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() { return { types: ["paragraph", "heading"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
          renderHTML: (attributes: { lineHeight?: string | null }) => {
            if (!attributes.lineHeight) return {};
            return { style: `line-height: ${attributes.lineHeight}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) => {
        return this.options.types.every((t: string) => commands.updateAttributes(t, { lineHeight }));
      },
    } as any;
  },
});

function ToolBtn({ onClick, children, title, active }: { onClick: () => void; children: React.ReactNode; title: string; active?: boolean }) {
  return (
    <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-bold transition ${active ? "bg-sky-500 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
      {children}
    </button>
  );
}
const Sep = () => <div className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />;

export default function Editor() {
  const { articles, setData, logActivity, saveVersion, versions, pushNotification } = useStore();
  const { notify } = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const editing = articles.find((a) => a.id === editId);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [category, setCategory] = useState<Category>(editing?.category ?? "articles");
  const [excerpt, setExcerpt] = useState(editing?.excerpt ?? "");
  const [cover, setCover] = useState(editing?.cover ?? "");
  const [tags, setTags] = useState(editing?.tags.join(", ") ?? "");
  const [author, setAuthor] = useState(editing?.author ?? "المدير العام");
  const [status, setStatus] = useState(editing?.status ?? "draft");
  const [publishDate, setPublishDate] = useState(editing?.publishDate ?? new Date().toISOString().slice(0, 10));
  const videoUrl = editing?.videoUrl ?? "";
  const [metaTitle, setMetaTitle] = useState(editing?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(editing?.metaDescription ?? "");
  const [titleEn, setTitleEn] = useState(editing?.titleEn ?? "");
  const [excerptEn, setExcerptEn] = useState(editing?.excerptEn ?? "");
  const [contentEn, setContentEn] = useState(editing?.contentEn ?? "");
  const [autoSlug, setAutoSlug] = useState(!editing);
  const [picker, setPicker] = useState<null | { mode: "insert" | "cover" }>(null);
  const [blockMenu, setBlockMenu] = useState(false);
  const [blockSearch, setBlockSearch] = useState("");
  const [swatchOpen, setSwatchOpen] = useState<null | "text" | "bg">(null);
  const [stats, setStats] = useState({ words: 0, chars: 0, mins: 0 });
  const [tab, setTab] = useState<"editor" | "seo" | "ai" | "history" | "en">("editor");
  const [autoSaved, setAutoSaved] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"google" | "social">("google");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");
  const [fullscreen, setFullscreen] = useState(false);
  const [zen, setZen] = useState(false); // distraction-free
  const [zoom, setZoom] = useState(100);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState<null | "emoji" | "chars">(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [, forceTick] = useState(0); // re-render toolbar so active-state buttons stay in sync with selection
  const draftId = editId ?? "new";

  // Refs used to break the circular dependency between the editor instance
  // (created once) and callbacks that are (re)created after it.
  const refreshStatsRef = useRef<() => void>(() => {});
  const scheduleAutoSaveRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      LineHeight,
      FontFamily.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ inline: false }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Placeholder.configure({ placeholder: "ابدأ الكتابة هنا..." }),
    ],
    content: editing?.content ?? DEFAULT_CONTENT,
    editorProps: {
      attributes: {
        class: "prose-content min-h-[460px] p-5 text-slate-700 outline-none transition-all dark:text-slate-200 focus:outline-none",
      },
    },
    onUpdate: () => { refreshStatsRef.current(); scheduleAutoSaveRef.current(); },
    onSelectionUpdate: () => forceTick((n) => n + 1),
  });

  const collectDraft = useCallback((): EditorDraft => ({
    id: draftId, title, slug, category, excerpt, cover, tags, author, status,
    metaTitle, metaDescription, content: editor?.getHTML() ?? "",
    savedAt: Date.now(), synced: false, scrollY: window.scrollY,
  }), [draftId, title, slug, category, excerpt, cover, tags, author, status, metaTitle, metaDescription, editor]);

  const insertHTML = (h: string) => {
    editor?.chain().focus().insertContent(h).run();
    refreshStatsRef.current();
    scheduleAutoSaveRef.current();
  };

  const runReplace = (all: boolean) => {
    if (!editor || !findText) return;
    const safe = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, all ? "g" : "");
    const html = editor.getHTML().replace(re, replaceText);
    editor.commands.setContent(html, { emitUpdate: true });
    refreshStatsRef.current();
    notify(all ? "تم استبدال جميع النتائج" : "تم الاستبدال", "success");
  };

  const applyTemplate = (html: string) => {
    if (!editor) return;
    const cur = editor.getText().trim();
    if (cur.length > 30 && !confirm("سيتم استبدال المحتوى الحالي بالقالب. متابعة؟")) return;
    editor.commands.setContent(html, { emitUpdate: true });
    refreshStatsRef.current(); setTplOpen(false); notify("تم تطبيق القالب", "success");
  };

  const refreshStats = useCallback(() => {
    const html = editor?.getHTML() ?? "";
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = plain ? plain.split(/\s+/).length : 0;
    setStats({ words, chars: plain.length, mins: readingTime(html) });
  }, [editor]);
  refreshStatsRef.current = refreshStats;

  const insertMedia = (item: MediaItem) => {
    if (picker?.mode === "cover") { setCover(item.url); setPicker(null); notify("تم تعيين صورة الغلاف"); return; }
    if (item.type === "image") insertHTML(`<figure><img src="${item.url}" alt="${item.name}" loading="lazy"/><figcaption style="text-align:center;font-size:0.85rem;color:#64748b">${item.name}</figcaption></figure>`);
    else if (item.type === "video") insertHTML(`<video src="${item.url}" controls style="width:100%;border-radius:8px"></video><p></p>`);
    else if (item.type === "pdf") insertHTML(`<div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center"><span>📄 ${item.name}</span><a href="${item.url}" target="_blank" style="background:#0ea5e9;color:#fff;padding:4px 12px;border-radius:9999px">عرض / تحميل</a></div><p></p>`);
    else insertHTML(`<div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center"><span>📎 ${item.name}</span><a href="${item.url}" target="_blank" style="background:#10b981;color:#fff;padding:4px 12px;border-radius:9999px">تحميل</a></div><p></p>`);
    setPicker(null);
    notify("تم الإدراج من المكتبة", "success");
  };

  // On mount: stats for the initial content, and offer to recover an unsaved local draft.
  const [recovery, setRecovery] = useState<EditorDraft | null>(null);
  useEffect(() => {
    refreshStatsRef.current();
    const d = loadDraft(draftId);
    // Show recovery prompt only if there is a meaningful unsynced draft
    if (d && !d.synced && (d.title?.trim() || (d.content && d.content.replace(/<[^>]+>/g, "").trim().length > 20))) {
      setRecovery(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => { if (autoSlug) setSlug(slugify(title)); }, [title, autoSlug]);

  const applyDraft = (d: EditorDraft) => {
    setTitle(d.title); setSlug(d.slug); setCategory(d.category as Category); setExcerpt(d.excerpt);
    setCover(d.cover); setTags(d.tags); setAuthor(d.author); setStatus(d.status as Article["status"]);
    setMetaTitle(d.metaTitle); setMetaDescription(d.metaDescription); setAutoSlug(false);
    editor?.commands.setContent(d.content, { emitUpdate: true });
    refreshStatsRef.current(); setRecovery(null);
    // Restore scroll & focus position exactly where the user stopped.
    setTimeout(() => { if (typeof d.scrollY === "number") window.scrollTo({ top: d.scrollY }); editor?.commands.focus(); }, 60);
    notify("تم استرجاع المسودة المحفوظة", "success");
  };

  // Debounced local auto-save (~2.5s after last change) — never lose work.
  const saveTimer = useRef<number | undefined>(undefined);
  const scheduleAutoSave = useCallback(() => {
    setSaveStatus("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveDraft(collectDraft());
      setSaveStatus(navigator.onLine ? "saved" : "offline");
      setAutoSaved(new Date().toLocaleTimeString("ar-EG"));
    }, 2500);
  }, [collectDraft]);
  scheduleAutoSaveRef.current = scheduleAutoSave;

  // Trigger autosave when any field changes.
  useEffect(() => {
    if (title || excerpt || cover || tags) scheduleAutoSave();
    return () => window.clearTimeout(saveTimer.current);
  }, [title, slug, category, excerpt, cover, tags, author, status, metaTitle, metaDescription, scheduleAutoSave]);

  // Periodic version snapshots (every 2 min) — like Google Docs history.
  useEffect(() => {
    const t = setInterval(() => {
      if (title.trim() && editor) saveVersion(draftId, title, editor.getHTML(), author);
    }, 120000);
    return () => clearInterval(t);
  }, [title, draftId, author, saveVersion, editor]);

  // Save immediately before the page unloads / tab closes.
  useEffect(() => {
    const handler = () => { if (title.trim() || (editor?.getText().trim().length ?? 0) > 20) saveDraft(collectDraft()); };
    window.addEventListener("beforeunload", handler);
    document.addEventListener("visibilitychange", handler);
    const online = () => setSaveStatus("saved");
    const offline = () => setSaveStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [collectDraft, title, editor]);

  // Clean up the editor instance on unmount.
  useEffect(() => () => editor?.destroy(), [editor]);

  // Media upload inputs
  const imgInput = useRef<HTMLInputElement>(null);
  const camInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const out = await compressToWebP(file);
    insertHTML(`<img src="${out.url}" alt="${file.name}" loading="lazy"/>`);
    notify("تم إدراج الصورة (WebP)", "success"); e.target.value = "";
  };
  const onPickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    insertHTML(`<video src="${URL.createObjectURL(file)}" controls style="width:100%;border-radius:8px"></video><p></p>`);
    notify("تم إدراج الفيديو", "success"); e.target.value = "";
  };

  const addEmbed = (kind: "youtube" | "vimeo") => {
    const url = prompt(kind === "youtube" ? "رابط YouTube:" : "رابط Vimeo:");
    if (!url) return;
    let embed = url;
    if (kind === "youtube") embed = url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
    else { const id = url.split("/").pop(); embed = `https://player.vimeo.com/video/${id}`; }
    insertHTML(`<div style="aspect-ratio:16/9;margin:1rem 0"><iframe src="${embed}" style="width:100%;height:100%;border-radius:8px" allowfullscreen loading="lazy"></iframe></div><p></p>`);
  };

  // Text / background color now apply through Tiptap's Color + Highlight
  // extensions, which work on any selection — including text inside
  // headings, so coloring a heading works exactly like coloring a paragraph.
  const setColor = (c: string) => editor?.chain().focus().setColor(c).run();
  const setBg = (c: string) => {
    if (c === "transparent") editor?.chain().focus().unsetHighlight().run();
    else editor?.chain().focus().toggleHighlight({ color: c }).run();
  };
  const setLink = () => {
    const u = prompt("الرابط:");
    if (!u) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: u }).run();
  };
  const setHeading = (v: string) => {
    if (v === "p") editor?.chain().focus().setParagraph().run();
    else editor?.chain().focus().toggleHeading({ level: Number(v.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  };
  const setFontSizeValue = (v: string) => (editor?.chain().focus() as any).setFontSize(toCssSize(v)).run();
  const setFontFamilyValue = (v: string) => editor?.chain().focus().setFontFamily(v).run();
  const setLineHeightValue = (v: string) => { if (v) (editor?.chain().focus() as any).setLineHeight(v).run(); };
  const insertTable = () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  // AI helpers
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const runAI = (action: string) => {
    const html = editor?.getHTML() ?? "";
    if (action === "titles") setAiTitles(aiTitleSuggestions(title));
    else if (action === "meta") { setMetaDescription(aiMetaDescription(title, html)); notify("تم توليد الوصف"); }
    else if (action === "keywords") { setTags(aiKeywords(title, html).join(", ")); notify("تم اقتراح الكلمات المفتاحية"); }
    else if (action === "summary") { setExcerpt(aiSummarize(html)); notify("تم تلخيص المقال"); }
    else if (action === "improve") {
      const { from, to } = editor?.state.selection ?? { from: 0, to: 0 };
      const sel = editor?.state.doc.textBetween(from, to, " ") ?? "";
      if (sel) { editor?.chain().focus().insertContent(aiImproveText(sel)).run(); notify("تم تحسين النص المحدد"); }
      else notify("حدد نصاً أولاً لتحسينه", "info");
    }
  };

  const save = (forceStatus?: string) => {
    if (!title.trim()) { notify("الرجاء إدخال عنوان المقال", "error"); return; }
    const content = editor?.getHTML() ?? "";
    if (editing) saveVersion(editing.id, editing.title, editing.content, author); // snapshot previous
    const finalStatus = (forceStatus ?? status) as Article["status"];
    const article: Article = {
      id: editing?.id ?? "a" + Date.now(),
      title, slug: slug || slugify(title), category, excerpt: excerpt || title,
      content, cover: cover || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author, status: finalStatus, publishDate,
      updatedDate: new Date().toISOString().slice(0, 10),
      views: editing?.views ?? 0, featured: editing?.featured, videoUrl: videoUrl || undefined,
      attachments: editing?.attachments, metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined,
      titleEn: titleEn || undefined, excerptEn: excerptEn || undefined, contentEn: contentEn || undefined,
      rating: editing?.rating, ratingCount: editing?.ratingCount,
    };
    setData((d) => ({ ...d, articles: editing ? d.articles.map((a) => (a.id === editing.id ? article : a)) : [article, ...d.articles] }));
    logActivity(editing ? "تعديل مقال" : "نشر مقال", article.title);
    if (finalStatus === "published") pushNotification("system", `تم نشر مقال: ${article.title}`);
    // Notify subscribed visitors — only on the transition into "published", not on every later edit.
    const isNewlyPublished = finalStatus === "published" && editing?.status !== "published";
    if (isNewlyPublished && supabase) {
      supabase.functions.invoke("send-push", {
        body: {
          title: "📰 مقال جديد",
          body: article.title,
          link: `/article/${article.slug}`,
          tag: article.id,
          role: "visitor",
        },
      }).catch(() => {}); // best-effort — never block saving on this
    }
    clearDraft(draftId); // committed to store — remove local auto-draft
    notify("تم الحفظ بنجاح!", "success");
    nav("/admin/articles");
  };

  const restoreVersion = (content: string) => {
    editor?.commands.setContent(content, { emitUpdate: true });
    refreshStatsRef.current(); notify("تم استعادة النسخة"); setTab("editor");
  };

  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800";
  const cats = Object.keys(CATEGORY_LABELS) as Category[];
  const myVersions = versions.filter((v) => v.articleId === (editId ?? "draft")).slice(0, 15);
  const seo = seoScore({ title, metaTitle, metaDescription, content: editor?.getHTML() ?? "", keywords: tags, cover });
  const read = readabilityScore(editor?.getHTML() ?? "");
  const scoreColor = (s: number) => (s >= 80 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-rose-500");

  return (
    <div className={`grid gap-6 ${zen ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_330px]"} ${fullscreen ? "fixed inset-0 z-[80] overflow-y-auto bg-white p-4 dark:bg-slate-950" : ""}`}>
      {recovery && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center dark:bg-slate-900">
            <div className="text-4xl">📝</div>
            <h3 className="mt-2 text-lg font-black dark:text-white">لديك مسودة غير محفوظة</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              وجدنا مسودة محفوظة تلقائياً{recovery.title ? ` بعنوان "${recovery.title}"` : ""}. هل تريد متابعة التعديل؟
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => applyDraft(recovery)} className="rounded-full bg-gradient-to-l from-sky-500 to-emerald-500 px-6 py-2 font-bold text-white">متابعة التعديل</button>
              <button onClick={() => { clearDraft(draftId); setRecovery(null); }} className="rounded-full border border-slate-200 px-6 py-2 font-bold dark:border-slate-700 dark:text-white">تجاهل المسودة</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المقال..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xl font-bold outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-slate-200 bg-white/95 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <select onChange={(e) => setHeading(e.target.value)} className="h-8 rounded-md border border-slate-200 px-1 text-xs dark:border-slate-700 dark:bg-slate-800" title="نوع الفقرة">
              <option value="p">فقرة</option>
              <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option>
              <option value="h4">H4</option><option value="h5">H5</option><option value="h6">H6</option>
            </select>
            <select onChange={(e) => setFontSizeValue(e.target.value)} className="h-8 rounded-md border border-slate-200 px-1 text-xs dark:border-slate-700 dark:bg-slate-800" title="حجم الخط">
              {FONT_SIZES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select onChange={(e) => setFontFamilyValue(e.target.value)} className="h-8 rounded-md border border-slate-200 px-1 text-xs dark:border-slate-700 dark:bg-slate-800" title="نوع الخط">
              {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <Sep />
            <ToolBtn title="عريض" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
            <ToolBtn title="مائل" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
            <ToolBtn title="تحته خط" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></ToolBtn>
            <ToolBtn title="يتوسطه خط" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}><s>S</s></ToolBtn>
            <Sep />
            {/* Text color — also colors heading text, since headings contain the same text nodes.
                Tap-toggled (not hover) so it works on touch/mobile too. */}
            <div className="relative">
              <ToolBtn title="لون النص (يعمل أيضاً على العناوين)" active={swatchOpen === "text"} onClick={() => setSwatchOpen(swatchOpen === "text" ? null : "text")}>🎨</ToolBtn>
              {swatchOpen === "text" && (
                <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">لون النص</span>
                    <button onMouseDown={(e) => { e.preventDefault(); setSwatchOpen(null); }} className="text-xs text-slate-400">✕</button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {TEXT_COLORS.map((c) => <button key={c} title={c} onMouseDown={(e) => { e.preventDefault(); setColor(c); setSwatchOpen(null); }} className="h-9 w-9 rounded-lg border-2 border-slate-200 dark:border-slate-600" style={{ background: c }} />)}
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                    <label className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 text-base dark:border-slate-600">
                      🎨
                      <input type="color" defaultValue="#000000" onChange={(e) => { setColor(e.target.value); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">اختر لوناً يدوياً (كل الألوان)</span>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <ToolBtn title="لون الخلفية" active={swatchOpen === "bg"} onClick={() => setSwatchOpen(swatchOpen === "bg" ? null : "bg")}>🖍️</ToolBtn>
              {swatchOpen === "bg" && (
                <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">لون الخلفية</span>
                    <button onMouseDown={(e) => { e.preventDefault(); setSwatchOpen(null); }} className="text-xs text-slate-400">✕</button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {BG_COLORS.map((c) => <button key={c} title={c} onMouseDown={(e) => { e.preventDefault(); setBg(c); setSwatchOpen(null); }} className="h-9 w-9 rounded-lg border-2 border-slate-200 dark:border-slate-600" style={{ background: c === "transparent" ? "#fff" : c }} />)}
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                    <label className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 text-base dark:border-slate-600">
                      🖍️
                      <input type="color" defaultValue="#ffff00" onChange={(e) => { setBg(e.target.value); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">اختر لوناً يدوياً (كل الألوان)</span>
                  </div>
                </div>
              )}
            </div>
            <Sep />
            <ToolBtn title="محاذاة يمين" active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>⬅</ToolBtn>
            <ToolBtn title="توسيط" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>↔</ToolBtn>
            <ToolBtn title="محاذاة يسار" active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>➡</ToolBtn>
            <Sep />
            <ToolBtn title="قائمة نقطية" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</ToolBtn>
            <ToolBtn title="قائمة رقمية" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1.</ToolBtn>
            <ToolBtn title="قائمة مهام" onClick={() => insertHTML(`<ul style="list-style:none;padding-right:0"><li>☐ مهمة</li></ul>`)}>☑</ToolBtn>
            <Sep />
            <ToolBtn title="مكتبة الوسائط" onClick={() => setPicker({ mode: "insert" })}>📚</ToolBtn>
            <ToolBtn title="رفع صورة" onClick={() => imgInput.current?.click()}>🖼️</ToolBtn>
            <ToolBtn title="كاميرا الهاتف" onClick={() => camInput.current?.click()}>📷</ToolBtn>
            <ToolBtn title="رفع فيديو" onClick={() => vidInput.current?.click()}>🎥</ToolBtn>
            <ToolBtn title="YouTube" onClick={() => addEmbed("youtube")}>▶️</ToolBtn>
            <ToolBtn title="Vimeo" onClick={() => addEmbed("vimeo")}>🎞️</ToolBtn>
            <ToolBtn title="رابط" active={editor?.isActive("link")} onClick={setLink}>🔗</ToolBtn>
            <ToolBtn title="جدول" onClick={insertTable}>▦</ToolBtn>
            <Sep />
            <div className="relative">
              <ToolBtn title="إدراج كتلة" onClick={() => setBlockMenu((b) => !b)} active={blockMenu}>➕ كتلة</ToolBtn>
              {blockMenu && (
                <div className="absolute right-0 top-9 z-30 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  <input
                    autoFocus
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="🔍 ابحث عن كتلة... (info, دواء, MCQ)"
                    className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900"
                  />
                  {BLOCK_GROUPS.map((g) => {
                    const items = BLOCKS.filter((b) => b.group === g && (!blockSearch || (b.label + b.key).toLowerCase().includes(blockSearch.toLowerCase())));
                    if (items.length === 0) return null;
                    return (
                      <div key={g} className="mb-2">
                        <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g}</div>
                        <div className="grid grid-cols-2 gap-1">
                          {items.map((b) => (
                            <button key={b.group + b.key} onMouseDown={(e) => { e.preventDefault(); insertHTML(b.html); setBlockMenu(false); setBlockSearch(""); }} className="flex items-center gap-1.5 rounded-lg p-2 text-right text-xs font-semibold hover:bg-sky-50 dark:text-white dark:hover:bg-slate-700">
                              <span>{b.icon}</span><span className="truncate">{b.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Sep />
            <ToolBtn title="تراجع" onClick={() => editor?.chain().focus().undo().run()}>↶</ToolBtn>
            <ToolBtn title="إعادة" onClick={() => editor?.chain().focus().redo().run()}>↷</ToolBtn>
            <ToolBtn title="مسح التنسيق" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>🧹</ToolBtn>
            <Sep />
            <ToolBtn title="أس علوي" active={editor?.isActive("superscript")} onClick={() => editor?.chain().focus().toggleSuperscript().run()}>x²</ToolBtn>
            <ToolBtn title="أس سفلي" active={editor?.isActive("subscript")} onClick={() => editor?.chain().focus().toggleSubscript().run()}>x₂</ToolBtn>
            <ToolBtn title="زيادة إزاحة" onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}>⇥</ToolBtn>
            <ToolBtn title="تقليل إزاحة" onClick={() => editor?.chain().focus().liftListItem("listItem").run()}>⇤</ToolBtn>
            <select onChange={(e) => setLineHeightValue(e.target.value)} className="h-8 rounded-md border border-slate-200 px-1 text-xs dark:border-slate-700 dark:bg-slate-800" title="ارتفاع السطر">
              <option value="">تباعد</option><option value="1.2">1.2</option><option value="1.5">1.5</option><option value="1.8">1.8</option><option value="2">2.0</option><option value="2.5">2.5</option>
            </select>
            <ToolBtn title="معادلة LaTeX" onClick={() => { const eq = prompt("أدخل المعادلة (LaTeX أو نص):"); if (eq) insertHTML(`<span class="nh-latex" style="font-style:italic;background:#f1f5f9;padding:2px 8px;border-radius:4px">${eq}</span>&nbsp;`); }}>∑</ToolBtn>
            {/* Emoji */}
            <div className="relative">
              <ToolBtn title="إيموجي" onClick={() => setEmojiOpen(emojiOpen === "emoji" ? null : "emoji")} active={emojiOpen === "emoji"}>😀</ToolBtn>
              {emojiOpen === "emoji" && (
                <div className="absolute right-0 top-9 z-30 grid w-56 grid-cols-8 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  {EMOJIS.map((e) => <button key={e} onMouseDown={(ev) => { ev.preventDefault(); insertHTML(e); setEmojiOpen(null); }} className="rounded p-1 text-lg hover:bg-slate-100 dark:hover:bg-slate-700">{e}</button>)}
                </div>
              )}
            </div>
            {/* Special chars */}
            <div className="relative">
              <ToolBtn title="رموز خاصة" onClick={() => setEmojiOpen(emojiOpen === "chars" ? null : "chars")} active={emojiOpen === "chars"}>Ω</ToolBtn>
              {emojiOpen === "chars" && (
                <div className="absolute right-0 top-9 z-30 grid w-56 grid-cols-8 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  {SPECIAL_CHARS.map((c) => <button key={c} onMouseDown={(ev) => { ev.preventDefault(); insertHTML(c); setEmojiOpen(null); }} className="rounded p-1 text-sm hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700">{c}</button>)}
                </div>
              )}
            </div>
            <Sep />
            {/* Templates */}
            <div className="relative">
              <ToolBtn title="قوالب طبية" onClick={() => setTplOpen((o) => !o)} active={tplOpen}>📄 قوالب</ToolBtn>
              {tplOpen && (
                <div className="absolute right-0 top-9 z-30 max-h-80 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                  {TEMPLATES.map((tp) => (
                    <button key={tp.key} onMouseDown={(e) => { e.preventDefault(); applyTemplate(tp.content); }} className="flex w-full items-center gap-2 rounded-lg p-2 text-right text-xs font-semibold hover:bg-sky-50 dark:text-white dark:hover:bg-slate-700">
                      <span className="text-base">{tp.icon}</span>{tp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ToolBtn title="بحث واستبدال" onClick={() => setFindOpen((o) => !o)} active={findOpen}>🔍</ToolBtn>
            <ToolBtn title="تصغير" onClick={() => setZoom((z) => Math.max(50, z - 10))}>➖</ToolBtn>
            <span className="px-1 text-xs font-bold text-slate-400">{zoom}%</span>
            <ToolBtn title="تكبير" onClick={() => setZoom((z) => Math.min(200, z + 10))}>➕</ToolBtn>
            <ToolBtn title="وضع التركيز" onClick={() => setZen((z) => !z)} active={zen}>🧘</ToolBtn>
            <ToolBtn title="ملء الشاشة" onClick={() => setFullscreen((f) => !f)} active={fullscreen}>⛶</ToolBtn>
            <ToolBtn title="معاينة الطباعة" onClick={() => window.print()}>🖨️</ToolBtn>
          </div>

          {findOpen && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/50">
              <input value={findText} onChange={(e) => setFindText(e.target.value)} placeholder="بحث عن..." className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="استبدال بـ..." className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <button onClick={() => runReplace(false)} className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-600 dark:bg-sky-500/10">استبدال</button>
              <button onClick={() => runReplace(true)} className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white">استبدال الكل</button>
            </div>
          )}

          <input ref={imgInput} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <input ref={camInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickImage} />
          <input ref={vidInput} type="file" accept="video/*" capture="environment" className="hidden" onChange={onPickVideo} />

          <div style={{ fontSize: `${zoom}%` }}>
            <EditorContent editor={editor} />
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex gap-3">
              <span>📝 {stats.words} كلمة</span>
              <span>🔤 {stats.chars} حرف</span>
              <span>⏱ {stats.mins} دقيقة قراءة</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={scoreColor(read.score)}>قابلية القراءة: {read.label}</span>
              {saveStatus === "saving" && <span className="text-amber-500">⏳ جارٍ الحفظ...</span>}
              {saveStatus === "saved" && autoSaved && <span className="text-emerald-500">✅ تم الحفظ {autoSaved}</span>}
              {saveStatus === "offline" && <span className="text-rose-500">📴 مسودة محفوظة محلياً (بدون اتصال)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar with tabs */}
      <aside className={`space-y-4 ${zen ? "hidden" : ""}`}>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {([["editor", "نشر"], ["en", "🇬🇧 EN"], ["seo", "SEO"], ["ai", "AI"], ["history", "السجل"]] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${tab === t ? "bg-sky-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{l}</button>
          ))}
        </div>

        {tab === "editor" && (
          <>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold dark:text-white">⚙️ النشر</h3>
              <select value={status} onChange={(e) => setStatus(e.target.value as Article["status"])} className={input}>
                <option value="draft">مسودة</option><option value="published">منشور</option><option value="scheduled">مجدول</option><option value="private">خاص</option><option value="archived">مؤرشف</option>
              </select>
              {status === "scheduled" && <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className={input} />}
              <div className="flex gap-2">
                <button onClick={() => save()} className="flex-1 rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2 font-bold text-white">حفظ</button>
                <button onClick={() => save("published")} className="rounded-lg border border-sky-500 px-3 py-2 text-sm font-bold text-sky-500">نشر</button>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold dark:text-white">📋 التفاصيل</h3>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">القسم</label><select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={input}>{cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">الرابط (Slug)</label><input value={slug} onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }} className={input} /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">الكاتب</label><input value={author} onChange={(e) => setAuthor(e.target.value)} className={input} /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">الوسوم</label><input value={tags} onChange={(e) => setTags(e.target.value)} className={input} /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">صورة الغلاف</label><div className="flex gap-2"><input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="اختر من المكتبة" className={input} /><button type="button" onClick={() => setPicker({ mode: "cover" })} className="shrink-0 rounded-lg bg-sky-500 px-3 text-sm font-bold text-white">📚</button></div>{cover && <img src={cover} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />}</div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500">المقتطف</label><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className={input} /></div>
            </div>
          </>
        )}

        {tab === "seo" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-bold dark:text-white">🔎 تحسين SEO</h3>
              <span className={`text-lg font-black ${scoreColor(seo.score)}`}>{seo.score}%</span>
            </div>
            <div className="space-y-1">
              {seo.checks.map((c, i) => <div key={i} className="flex items-center gap-2 text-xs"><span>{c.ok ? "✅" : "⬜"}</span><span className={c.ok ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}>{c.text}</span></div>)}
            </div>
            <div><label className="mb-1 block text-xs font-semibold text-slate-500">Meta Title</label><input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={input} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-slate-500">Meta Description</label><textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} className={input} /></div>

            <div className="flex gap-1">
              <button onClick={() => setPreviewMode("google")} className={`flex-1 rounded py-1 text-xs font-bold ${previewMode === "google" ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>Google</button>
              <button onClick={() => setPreviewMode("social")} className={`flex-1 rounded py-1 text-xs font-bold ${previewMode === "social" ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>Social</button>
            </div>
            {previewMode === "google" ? (
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="text-xs text-emerald-600">nursehub.eg › article › {slug || "slug"}</div>
                <div className="text-sm font-bold text-blue-700 dark:text-blue-400">{(metaTitle || title || "عنوان المقال").slice(0, 60)}</div>
                <div className="text-xs text-slate-500">{(metaDescription || excerpt || "وصف المقال يظهر هنا...").slice(0, 155)}</div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                {cover && <img src={cover} alt="" className="h-28 w-full object-cover" />}
                <div className="p-2"><div className="text-[10px] uppercase text-slate-400">nursehub.eg</div><div className="text-sm font-bold dark:text-white">{(metaTitle || title || "عنوان المقال").slice(0, 70)}</div><div className="text-xs text-slate-500">{(metaDescription || excerpt).slice(0, 100)}</div></div>
              </div>
            )}
            <p className="rounded-lg bg-emerald-50 p-2 text-[10px] text-emerald-600 dark:bg-emerald-500/10">يتم توليد Article + Breadcrumb Schema و Open Graph و Twitter Cards و Canonical تلقائياً.</p>
          </div>
        )}

        {tab === "en" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold dark:text-white">🇬🇧 المحتوى الإنجليزي (اختياري)</h3>
            <p className="rounded-lg bg-sky-50 p-2 text-[11px] text-sky-600 dark:bg-sky-500/10">إن تركت الحقول فارغة، تظهر رسالة «English version coming soon» للزوار الذين يختارون الإنجليزية.</p>
            <div><label className="mb-1 block text-xs font-semibold text-slate-500" dir="ltr">English Title</label><input dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={input} placeholder="Article title in English" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-slate-500" dir="ltr">English Excerpt</label><textarea dir="ltr" value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} rows={3} className={input} placeholder="Short summary..." /></div>
            <div><label className="mb-1 block text-xs font-semibold text-slate-500" dir="ltr">English Content (HTML)</label><textarea dir="ltr" value={contentEn} onChange={(e) => setContentEn(e.target.value)} rows={12} className={`${input} font-mono text-xs`} placeholder="<h2>Heading</h2><p>English body...</p>" /></div>
            <button onClick={() => { if (editor) { setContentEn(editor.getHTML()); notify("تم نسخ المحتوى العربي كنقطة بداية للترجمة", "info"); } }} className="w-full rounded-lg bg-slate-100 py-2 text-xs font-bold dark:bg-slate-800 dark:text-white">نسخ المحتوى العربي كبداية</button>
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold dark:text-white">✨ مساعد الكتابة الذكي</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => runAI("titles")} className="rounded-lg bg-sky-50 py-2 text-xs font-bold text-sky-600 dark:bg-sky-500/10">💡 اقتراح عناوين</button>
              <button onClick={() => runAI("meta")} className="rounded-lg bg-sky-50 py-2 text-xs font-bold text-sky-600 dark:bg-sky-500/10">📝 توليد وصف</button>
              <button onClick={() => runAI("keywords")} className="rounded-lg bg-sky-50 py-2 text-xs font-bold text-sky-600 dark:bg-sky-500/10">🏷️ كلمات مفتاحية</button>
              <button onClick={() => runAI("summary")} className="rounded-lg bg-sky-50 py-2 text-xs font-bold text-sky-600 dark:bg-sky-500/10">📋 تلخيص</button>
              <button onClick={() => runAI("improve")} className="col-span-2 rounded-lg bg-emerald-50 py-2 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">✏️ تحسين النص المحدد</button>
            </div>
            {aiTitles.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">اقتراحات العناوين:</p>
                {aiTitles.map((t, i) => <button key={i} onClick={() => setTitle(t)} className="block w-full rounded-lg bg-slate-50 p-2 text-right text-xs hover:bg-sky-50 dark:bg-slate-800 dark:text-white">{t}</button>)}
              </div>
            )}
            <p className="text-[10px] text-slate-400">مساعد محلي يعمل دون اتصال. يمكن ربطه بـ OpenAI عبر Supabase Edge Functions لاحقاً.</p>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold dark:text-white">🕘 سجل النسخ ({myVersions.length})</h3>
            {myVersions.length === 0 && <p className="text-xs text-slate-400">لا توجد نسخ محفوظة بعد. يتم حفظ نسخة تلقائياً كل دقيقتين، والمسودة المحلية كل بضع ثوانٍ.</p>}
            {myVersions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700">
                <div><div className="font-semibold dark:text-white">{v.savedAt}</div><div className="text-slate-400">{v.author}</div></div>
                <button onClick={() => restoreVersion(v.content)} className="rounded bg-sky-100 px-2 py-1 font-bold text-sky-600 dark:bg-sky-500/10">استعادة</button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {picker && <MediaPicker onPick={insertMedia} onClose={() => setPicker(null)} accept={picker.mode === "cover" ? ["image"] : undefined} />}
    </div>
  );
}
