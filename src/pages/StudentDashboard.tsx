import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ArticleCard } from "../components/common";

interface ContinueItem {
  id: string;
  title: string;
  cover: string;
  progress: number;
  type: string;
  link: string;
}

interface QuizResult {
  id: string;
  title: string;
  score: number;
  passed: boolean;
  date: string;
}

interface Certificate {
  id: string;
  title: string;
  percentage: number;
  issued_at: string;
  code: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function StudentDashboard() {
  const { loggedIn } = useAuth();
  const { lang } = useI18n();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [continueLearning, setContinueLearning] = useState<ContinueItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [downloadedPDFs, setDownloadedPDFs] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [learningProgress, setLearningProgress] = useState({ completed: 0, total: 0, percent: 0 });

  const isRTL = lang === "ar";

  useEffect(() => {
    if (!loggedIn) return;

    const loadDashboard = async () => {
      setLoading(true);

      if (!isSupabaseConfigured() || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get current user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setUserProfile(profile);
        }

        // 2. Continue Learning (from reading_history where not completed)
        const { data: progressData } = await supabase
          .from("reading_history")
          .select("article_id, progress_percent, updated_at")
          .eq("user_id", user?.id)
          .eq("completed", false)
          .order("updated_at", { ascending: false })
          .limit(6);

        if (progressData && progressData.length > 0) {
          const articleIds = progressData.map((p: any) => p.article_id);
          const { data: articlesData } = await supabase
            .from("articles")
            .select("id, title, cover, slug")
            .in("id", articleIds);

          const mapped = progressData.map((p: any) => {
            const art = articlesData?.find((a: any) => a.id === p.article_id);
            return art
              ? {
                  id: art.id,
                  title: art.title,
                  cover: art.cover,
                  progress: p.progress_percent,
                  type: "article",
                  link: `/article/${art.slug}`,
                }
              : null;
          }).filter(Boolean);
          setContinueLearning(mapped as ContinueItem[]);
        }

        // 3. Recently Viewed
        const { data: recentData } = await supabase
          .from("reading_history")
          .select("article_id, updated_at")
          .eq("user_id", user?.id)
          .order("updated_at", { ascending: false })
          .limit(10);

        if (recentData) {
          const ids = recentData.map((r: any) => r.article_id);
          const { data: arts } = await supabase
            .from("articles")
            .select("id, title, cover, slug, category, views")
            .in("id", ids);
          setRecentlyViewed(arts || []);
        }

        // 4. Saved Articles (Bookmarks)
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("content_id")
          .eq("user_id", user?.id)
          .eq("content_type", "article")
          .limit(8);

        if (bookmarks && bookmarks.length > 0) {
          const ids = bookmarks.map((b: any) => b.content_id);
          const { data: savedArts } = await supabase
            .from("articles")
            .select("id, title, cover, slug, category")
            .in("id", ids);
          setSavedArticles(savedArts || []);
        }

        // 5. Downloaded PDFs (from book_downloads)
        const { data: downloads } = await supabase
          .from("book_downloads")
          .select("book_id, downloaded_at")
          .eq("user_id", user?.id)
          .order("downloaded_at", { ascending: false })
          .limit(6);

        if (downloads && downloads.length > 0) {
          const bookIds = downloads.map((d: any) => d.book_id);
          const { data: booksData } = await supabase
            .from("books")
            .select("id, title, cover_image, slug")
            .in("id", bookIds);
          setDownloadedPDFs(booksData || []);
        }

        // 6. Quiz Results
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("id, quiz_id, score, is_passed, submitted_at")
          .eq("user_id", user?.id)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(8);

        if (attempts) {
          const quizIds = attempts.map((a: any) => a.quiz_id);
          const { data: quizData } = await supabase
            .from("quizzes")
            .select("id, title")
            .in("id", quizIds);

          const results = attempts.map((a: any) => {
            const quiz = quizData?.find((q: any) => q.id === a.quiz_id);
            return {
              id: a.id,
              title: quiz?.title || "Quiz",
              score: a.score,
              passed: a.is_passed,
              date: a.submitted_at?.slice(0, 10) || "",
            };
          });
          setQuizResults(results);
        }

        // 7. Certificates
        const { data: certs } = await supabase
          .from("certificates")
          .select("id, title, percentage, issued_at, certificate_code")
          .eq("user_id", user?.id)
          .is("revoked_at", null)
          .order("issued_at", { ascending: false });

        if (certs) {
          setCertificates(
            certs.map((c: any) => ({
              id: c.id,
              title: c.title,
              percentage: c.percentage,
              issued_at: c.issued_at,
              code: c.certificate_code,
            }))
          );
        }

        // 8. Notifications
        const { data: notifs } = await supabase
          .from("notifications")
          .select("id, title, message, created_at, is_read")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (notifs) setNotifications(notifs);

        // 9. Learning Progress (from reading_history)
        const { count: completed } = await supabase
          .from("reading_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("completed", true);

        const { count: total } = await supabase
          .from("reading_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id);

        const percent = total && total > 0 ? Math.round(((completed || 0) / total) * 100) : 0;
        setLearningProgress({ completed: completed || 0, total: total || 0, percent });

      } catch (err) {
        console.error("Dashboard load error:", err);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-slate-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* 1. Welcome Card */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <img
            src={userProfile?.avatar_url || `https://i.pravatar.cc/80?u=${userProfile?.id}`}
            alt="Avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-black dark:text-white">{userProfile?.full_name || "Student"}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{userProfile?.email}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-sky-100 px-3 py-0.5 font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                {userProfile?.role || "student"}
              </span>
              <span className="text-slate-400">Member since {userProfile?.created_at?.slice(0, 10)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Continue Learning */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Continue Learning</h2>
        {continueLearning.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueLearning.map((item) => (
              <Link key={item.id} to={item.link} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <img src={item.cover} alt={item.title} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="font-semibold dark:text-white">{item.title}</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="mt-1 text-right text-xs text-emerald-600">{item.progress}%</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">You haven't started learning yet.</p>
          </div>
        )}
      </section>

      {/* 3. Recently Viewed */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Recently Viewed</h2>
        {recentlyViewed.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((a: any) => (
              <Link key={a.id} to={`/article/${a.slug}`} className="group block rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3">
                  <img src={a.cover} alt={a.title} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold dark:text-white">{a.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{a.views} views</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No articles viewed yet.</p>
          </div>
        )}
      </section>

      {/* 4. Saved Articles */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Saved Articles</h2>
        {savedArticles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedArticles.map((a: any) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">You haven't saved any articles yet.</p>
          </div>
        )}
      </section>

      {/* 5. Downloaded PDFs */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Downloaded PDFs</h2>
        {downloadedPDFs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {downloadedPDFs.map((b: any) => (
              <Link key={b.id} to={`/book/${b.slug}`} className="block rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="font-bold dark:text-white">{b.title}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No PDFs downloaded yet.</p>
          </div>
        )}
      </section>

      {/* 6. Quiz Results */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Quiz Results</h2>
        {quizResults.length > 0 ? (
          <div className="space-y-3">
            {quizResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="font-semibold dark:text-white">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.date}</div>
                </div>
                <div className={`font-bold ${r.passed ? "text-emerald-600" : "text-rose-600"}`}>
                  {r.score}% {r.passed ? "✓ Passed" : "✗ Failed"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No quiz results yet.</p>
          </div>
        )}
      </section>

      {/* 7. Learning Progress */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Learning Progress</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex justify-between text-sm">
            <span>Completed</span>
            <span className="font-bold">{learningProgress.completed} / {learningProgress.total}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${learningProgress.percent}%` }} />
          </div>
          <div className="mt-1 text-right text-xs text-emerald-600">{learningProgress.percent}%</div>
        </div>
      </section>

      {/* 8. Certificates */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Certificates</h2>
        {certificates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <div key={c.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-500/10">
                <div className="font-bold dark:text-white">{c.title}</div>
                <div className="text-sm text-emerald-600">{c.percentage}% • {c.issued_at}</div>
                <div className="mt-2 text-xs text-emerald-500">Code: {c.code}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No certificates earned yet.</p>
          </div>
        )}
      </section>

      {/* 9. Notifications */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold dark:text-white">Notifications</h2>
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" : "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-500/10"}`}>
                <div className="font-semibold dark:text-white">{n.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{n.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No notifications yet.</p>
          </div>
        )}
      </section>

      {/* 10. Account Information */}
      <section>
        <h2 className="mb-4 text-xl font-bold dark:text-white">Account Information</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div><span className="text-slate-400">Email:</span> {userProfile?.email}</div>
            <div><span className="text-slate-400">Language:</span> {userProfile?.locale || "ar"}</div>
            <div><span className="text-slate-400">Theme:</span> {userProfile?.theme || "light"}</div>
            <div><span className="text-slate-400">Subscription:</span> {userProfile?.subscription_status || "Free"}</div>
            <div><span className="text-slate-400">Joined:</span> {userProfile?.created_at?.slice(0, 10)}</div>
            <div><span className="text-slate-400">Last Activity:</span> {userProfile?.last_seen_at?.slice(0, 10) || "—"}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
