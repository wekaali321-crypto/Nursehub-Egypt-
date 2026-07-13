/**
 * Local auto-draft persistence for the article editor.
 * Ensures no work is lost if the browser closes/crashes/refreshes or the
 * network drops. Drafts are keyed per article (or "new" for a fresh article).
 */

export interface EditorDraft {
  id: string;            // article id or "new"
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover: string;
  tags: string;
  author: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  content: string;       // editor HTML
  savedAt: number;       // epoch ms
  synced: boolean;       // whether it has been committed to the store/cloud
  scrollY?: number;      // restore scroll position
}

const PREFIX = "nursehub_draft_";
const key = (id: string) => `${PREFIX}${id || "new"}`;

export function saveDraft(d: EditorDraft) {
  try { localStorage.setItem(key(d.id), JSON.stringify(d)); } catch { /* quota */ }
}

export function loadDraft(id: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as EditorDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(id: string) {
  try { localStorage.removeItem(key(id)); } catch { /* ignore */ }
}

export function markDraftSynced(id: string) {
  const d = loadDraft(id);
  if (d) saveDraft({ ...d, synced: true });
}

/** All locally-stored drafts (for the Recovery Center). */
export function allDrafts(): EditorDraft[] {
  const out: EditorDraft[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try { const d = JSON.parse(localStorage.getItem(k)!) as EditorDraft; out.push(d); } catch { /* ignore */ }
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "الآن";
  if (s < 60) return `منذ ${s} ثانية`;
  const m = Math.floor(s / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return new Date(ts).toLocaleString("ar-EG");
}
