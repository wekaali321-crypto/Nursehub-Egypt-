import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Real, privacy-friendly reading analytics.
 *
 * Writes go directly to the production Supabase tables `page_views` and
 * `search_history` (both allow anonymous inserts under RLS, so every
 * visitor — logged in or not — contributes real numbers).
 *
 * Everything is best-effort: if Supabase isn't configured or a write fails,
 * we fail silently so the reading experience is never affected.
 */

export type ArticleEventType = "download" | "share" | "bookmark" | "print" | "pdf_export";

let currentViewRowId: string | number | null = null;
let viewStartedAt = 0;
let maxScrollPct = 0;
let activeSeconds = 0;
let lastTick = 0;

function detectDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function detectReferrerSource(): string {
  const ref = document.referrer;
  if (!ref) return "direct";
  if (/google\./i.test(ref)) return "google";
  if (/facebook\./i.test(ref)) return "facebook";
  if (/twitter\.|x\.com/i.test(ref)) return "twitter";
  if (/instagram\./i.test(ref)) return "instagram";
  if (/youtube\./i.test(ref)) return "youtube";
  if (/tiktok\./i.test(ref)) return "tiktok";
  return "other";
}

/** Call once when an article view starts — inserts the initial page_view row. */
export async function startArticleView(opts: { contentId: string; slug: string; title: string }) {
  viewStartedAt = Date.now();
  maxScrollPct = 0;
  activeSeconds = 0;
  lastTick = Date.now();
  currentViewRowId = null;

  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { data, error } = await supabase
      .from("page_views")
      .insert({
        content_type: "article",
        content_id: opts.contentId,
        content_slug: opts.slug,
        path: `/article/${opts.slug}`,
        title: opts.title,
        referrer: document.referrer || null,
        referrer_source: detectReferrerSource(),
        device_type: detectDevice(),
      })
      .select("id")
      .single();
    if (!error && data) currentViewRowId = data.id;
  } catch {
    /* silent — analytics must never break the reading experience */
  }
}

/** Call on scroll — tracks the deepest scroll position reached. */
export function trackScrollDepth() {
  const h = document.documentElement;
  const scrollable = h.scrollHeight - h.clientHeight;
  const pct = scrollable > 0 ? Math.min(100, Math.round((h.scrollTop / scrollable) * 100)) : 0;
  if (pct > maxScrollPct) maxScrollPct = pct;
}

/** Call on a ~1-2s interval (only counts time while the tab is visible). */
export function tickActiveReadingTime() {
  const now = Date.now();
  if (!document.hidden) activeSeconds += Math.min(3, (now - lastTick) / 1000);
  lastTick = now;
}

/** Call on unmount/navigation — finalizes reading time + scroll depth on the row. */
export async function endArticleView() {
  if (!isSupabaseConfigured() || !supabase || currentViewRowId == null) {
    currentViewRowId = null;
    return;
  }
  const finalSeconds = Math.round(activeSeconds || (Date.now() - viewStartedAt) / 1000);
  try {
    await supabase
      .from("page_views")
      .update({
        time_on_page_seconds: finalSeconds,
        scroll_depth_percent: maxScrollPct,
        is_bounce: finalSeconds < 10,
      })
      .eq("id", currentViewRowId);
  } catch {
    /* silent */
  }
  currentViewRowId = null;
}

/** Log a discrete interaction: download, share, bookmark, print, pdf export. */
export async function logArticleEvent(type: ArticleEventType, opts: { contentId: string; slug: string; label?: string }) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from("page_views").insert({
      content_type: type,
      content_id: opts.contentId,
      content_slug: opts.slug,
      path: `/article/${opts.slug}#${type}${opts.label ? "-" + opts.label : ""}`,
      title: opts.label ?? type,
      device_type: detectDevice(),
    });
  } catch {
    /* silent */
  }
}

/** Log a search query (Arabic or English) for real search analytics. */
export async function logSearch(query: string, resultsCount: number, searchType: string, language: "ar" | "en") {
  if (!isSupabaseConfigured() || !supabase || !query.trim()) return;
  try {
    await supabase.from("search_history").insert({
      query,
      query_normalized: query.trim().toLowerCase(),
      language,
      search_type: searchType,
      results_count: resultsCount,
    });
  } catch {
    /* silent */
  }
}
