import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserAuth } from "../lib/userAuth";
import { useI18n } from "../lib/i18n";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ArticleCard } from "../components/common";

export default function StudentDashboard() {
  const { user, loggedIn, loading: authLoading } = useUserAuth();
  const { lang } = useI18n();
  const isRTL = lang === "ar";

  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedIn || !user) return;

    const loadDashboard = async () => {
      setLoading(true);
      if (!isSupabaseConfigured() || !supabase) { setLoading(false); return; }

      try {
        // Recently viewed (reading_history)
        const { data: history } = await supabase
          .from("reading_history")
          .select("article_id, read_at")
          .eq("user_id", user.id)
          .order("read_at", { ascending: false })
          .limit(10);

        if (history && history.length > 0) {
          const ids = [...new Set(history.map((h: any) => h.article_id))];
          const { data: arts } = await supabase
            .from("articles")
            .select("id, title, cover, slug, category, views")
            .in("id", ids);
          setRecentlyViewed(arts || []);
        } else {
          setRecentlyViewed([]);
        }

        // Saved articles (bookmarks)
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("article_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);

        if (bookmarks && bookmarks.length > 0) {
          const ids = [...new Set(bookmarks.map((b: any) => b.article_id))];
          const { data: savedArts } = await supabase
            .from("articles")
            .select("id, title, cover, slug, category")
            .in("id", ids);
          setSavedArticles(savedArts || []);
        } else {
          setSavedArticles([]);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    };

    loadDashboard();
  }, [loggedIn, user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!loggedIn || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg text-slate-500 dark:text-slate-400">
          {isRTL ? "يجب تسجيل الدخول لعرض حسابك." : "Please log in to view your dashboard."}
        </p>
        <Link to="/login" className="rounded-full bg-sky-500 px-6 py-2 font-bold text-white">
          {isRTL ? "تسجيل الدخول" : "Log in"}
        </Link>
      </div>
    );
  }

  const displayName = (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || user.email?.split("@")[0] || "User";
  const avatarUrl = (user.user_metadata as any)?.avatar_url || (user.user_metadata as any)?.picture || `https://i.pravatar.cc/80?u=${user.id}`;
  const joinedDate = user.created_at ? user.created_at.slice(0, 10) : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Welcome Card */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-black dark:text-white">{displayName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">{isRTL ? "عضو منذ" : "Member since"} {joinedDate}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <>
          {/* Recently Viewed */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold dark:text-white">{isRTL ? "شوهد مؤخراً" : "Recently Viewed"}</h2>
            {recentlyViewed.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentlyViewed.map((a: any) => (
                  <Link key={a.id} to={`/article/${a.slug}`} className="group block rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex gap-3">
                      <img src={a.cover} alt={a.title} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-semibold dark:text-white">{a.title}</div>
                        <div className="mt-1 text-xs text-slate-400">{a.views} {isRTL ? "مشاهدة" : "views"}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">{isRTL ? "لم تقرأ أي مقال بعد." : "No articles viewed yet."}</p>
              </div>
            )}
          </section>

          {/* Saved Articles */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold dark:text-white">{isRTL ? "المقالات المحفوظة" : "Saved Articles"}</h2>
            {savedArticles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedArticles.map((a: any) => (
                  <ArticleCard key={a.id} a={a} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">{isRTL ? "لم تحفظ أي مقال بعد." : "You haven't saved any articles yet."}</p>
              </div>
            )}
          </section>

          {/* Account Information */}
          <section>
            <h2 className="mb-4 text-xl font-bold dark:text-white">{isRTL ? "معلومات الحساب" : "Account Information"}</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div><span className="text-slate-400">{isRTL ? "البريد الإلكتروني" : "Email"}:</span> {user.email}</div>
                <div><span className="text-slate-400">{isRTL ? "تاريخ الانضمام" : "Joined"}:</span> {joinedDate}</div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
