import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useStore } from "../../lib/store";

/**
 * Enterprise Admin data hooks — connect the CMS to real Supabase data.
 *
 * When Supabase is configured, all reads/writes hit PostgreSQL.
 * When it is not (local preview), we transparently fall back to the
 * in-memory store so the CMS remains fully functional for demos.
 */

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  articles: number;
  publishedArticles: number;
  draftArticles: number;
  categories: number;
  books: number;
  pdfs: number;
  videos: number;
  images: number;
  exams: number;
  certificates: number;
  revenue: number;
  monthlyRevenue: number;
  orders: number;
  downloads: number;
  comments: number;
  pendingComments: number;
  aiUsage: number;
  storageBytes: number;
  loading: boolean;
  source: "supabase" | "local";
}

const EMPTY: AdminStats = {
  totalUsers: 0, activeUsers: 0, premiumUsers: 0, articles: 0,
  publishedArticles: 0, draftArticles: 0, categories: 0, books: 0,
  pdfs: 0, videos: 0, images: 0, exams: 0, certificates: 0,
  revenue: 0, monthlyRevenue: 0, orders: 0, downloads: 0,
  comments: 0, pendingComments: 0, aiUsage: 0, storageBytes: 0,
  loading: true, source: "local",
};

async function countRows(table: string, filter?: (q: any) => any): Promise<number> {
  if (!supabase) return 0;
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Live admin statistics — real data from Supabase (or local fallback). */
export function useAdminStats(): AdminStats {
  const store = useStore();
  const [stats, setStats] = useState<AdminStats>(EMPTY);

  const loadLocal = useCallback((): AdminStats => {
    const published = store.articles.filter((a: any) => a.status === "published").length;
    const drafts = store.articles.filter((a: any) => a.status === "draft").length;
    return {
      totalUsers: store.users.length,
      activeUsers: store.users.length,
      premiumUsers: store.users.filter((u: any) => u.role === "premium_student").length,
      articles: store.articles.length,
      publishedArticles: published,
      draftArticles: drafts,
      categories: store.categories.length,
      books: store.products.filter((p: any) => p.type === "book" || p.type === "pdf").length,
      pdfs: store.media.filter((m: any) => m.type === "pdf").length,
      videos: store.media.filter((m: any) => m.type === "video").length,
      images: store.media.filter((m: any) => m.type === "image").length,
      exams: store.quizzes.length,
      certificates: 0,
      revenue: 0,
      monthlyRevenue: 0,
      orders: (store.orders || []).length,
      downloads: store.downloads || 0,
      comments: store.comments.length,
      pendingComments: store.comments.filter((c: any) => c.status === "pending").length,
      aiUsage: 0,
      storageBytes: 0,
      loading: false,
      source: "local",
    };
  }, [store]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (alive) setStats(loadLocal());
        return;
      }

      try {
        // Use the get_admin_stats() RPC if available (fast, single round-trip)
        const { data: rpcData, error: rpcErr } = await supabase!.rpc("get_admin_stats");
        if (!rpcErr && rpcData) {
          const d = rpcData as any;
          if (alive) setStats({
            totalUsers: d.total_users ?? 0,
            activeUsers: d.total_users ?? 0,
            premiumUsers: d.total_subscriptions ?? 0,
            articles: (d.published_articles ?? 0) + (d.draft_articles ?? 0) + (d.scheduled_articles ?? 0),
            publishedArticles: d.published_articles ?? 0,
            draftArticles: d.draft_articles ?? 0,
            categories: d.total_categories ?? 0,
            books: d.total_books ?? 0,
            pdfs: d.total_pdfs ?? 0,
            videos: 0,
            images: 0,
            exams: d.total_quizzes ?? 0,
            certificates: d.total_certificates ?? 0,
            revenue: Number(d.total_revenue ?? 0),
            monthlyRevenue: Number(d.monthly_revenue ?? 0),
            orders: d.total_orders ?? 0,
            downloads: 0,
            comments: 0,
            pendingComments: d.pending_comments ?? 0,
            aiUsage: 0,
            storageBytes: Number(d.total_storage_bytes ?? 0),
            loading: false,
            source: "supabase",
          });
          return;
        }

        // Fallback: parallel COUNT queries
        const [
          totalUsers, articles, publishedArticles, draftArticles, categories,
          books, quizzes, certificates, orders, comments, pendingComments, media,
        ] = await Promise.all([
          countRows("profiles"),
          countRows("articles"),
          countRows("articles", (q) => q.eq("status", "published")),
          countRows("articles", (q) => q.eq("status", "draft")),
          countRows("categories"),
          countRows("books"),
          countRows("quizzes"),
          countRows("certificates"),
          countRows("orders"),
          countRows("comments"),
          countRows("comments", (q) => q.eq("status", "pending")),
          countRows("media_files"),
        ]);

        if (alive) setStats({
          ...EMPTY,
          totalUsers, articles, publishedArticles, draftArticles, categories,
          books, exams: quizzes, certificates, orders, comments, pendingComments,
          images: media,
          loading: false, source: "supabase",
        });
      } catch {
        if (alive) setStats(loadLocal());
      }
    })();
    return () => { alive = false; };
  }, [loadLocal]);

  return stats;
}

/** Format bytes to a human-readable string. */
export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/** Format currency (EGP). */
export function formatEGP(amount: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);
}
