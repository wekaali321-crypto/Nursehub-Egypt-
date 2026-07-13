import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { PageHeader, cardCls, StatCard } from "../cms/ui";

// --- Types ---
interface ContentStats {
  totalArticles: number; publishedArticles: number; draftArticles: number; scheduledArticles: number;
  totalBooks: number; totalQuizzes: number; totalClinicalTools: number; totalVideos: number;
  totalCategories: number; totalTags: number; aiIndexedArticles: number;
}



interface SeoIssue {
  id: string;
  title: string;
  score: number;
  issues: string[];
}

interface DuplicateItem {
  id: string;
  title: string;
  type: string;
  duplicate_count: number;
}

export default function ContentOperationsCenter() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [seoIssues, setSeoIssues] = useState<SeoIssue[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setLoading(false);
        return;
      }
      try {
        // 1. Statistics
        const [articles, published, drafts, scheduled, books, quizzes, calculators, videos, categories, tags, indexed] = await Promise.all([
          supabase.from("articles").select("id", { count: "exact", head: true }),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
          supabase.from("books").select("id", { count: "exact", head: true }),
          supabase.from("quizzes").select("id", { count: "exact", head: true }),
          supabase.from("medical_calculators").select("id", { count: "exact", head: true }),
          supabase.from("media_files").select("id", { count: "exact", head: true }).eq("file_type", "video"),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("tags").select("id", { count: "exact", head: true }),
          supabase.from("ai_generated_content").select("id", { count: "exact", head: true }).eq("content_type", "summary"),
        ]);

        setStats({
          totalArticles: articles.count || 0, publishedArticles: published.count || 0, draftArticles: drafts.count || 0, scheduledArticles: scheduled.count || 0,
          totalBooks: books.count || 0, totalQuizzes: quizzes.count || 0, totalClinicalTools: calculators.count || 0, totalVideos: videos.count || 0,
          totalCategories: categories.count || 0, totalTags: tags.count || 0, aiIndexedArticles: indexed.count || 0,
        });

        // 2. Content Pipeline (Latest 10 items needing action)
        const { data: pipelineData } = await supabase
          .from("articles")
          .select("id, title, status, updated_at")
          .in("status", ["draft", "scheduled"])
          .order("updated_at", { ascending: false })
          .limit(10);
        setPipeline(pipelineData || []);

        // 3. SEO Issues (Articles with low SEO score - simulated via missing meta)
        const { data: seoData } = await supabase
          .from("articles")
          .select("id, title, meta_title, meta_description")
          .eq("status", "published")
          .or("meta_title.is.null,meta_description.is.null")
          .limit(8);
        
        const issues = (seoData || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          score: (!a.meta_title ? 0 : 50) + (!a.meta_description ? 0 : 50),
          issues: [!a.meta_title && "Missing Meta Title", !a.meta_description && "Missing Meta Description"].filter(Boolean) as string[],
        }));
        setSeoIssues(issues);

        // 4. Duplicate Detection (Simple title match)
        const { data: allArticles } = await supabase.from("articles").select("id, title");
        const titleMap = new Map<string, number>();
        (allArticles || []).forEach((a: any) => {
          const count = titleMap.get(a.title) || 0;
          titleMap.set(a.title, count + 1);
        });
        const dups = Array.from(titleMap.entries())
          .filter(([, count]) => count > 1)
          .slice(0, 5)
          .map(([title, count]) => ({ id: "dup-" + title, title, type: "Article", duplicate_count: count }));
        setDuplicates(dups);

      } catch (error) {
        console.error("Content Ops Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Content Operations Center...</div>;

  return (
    <div>
      <PageHeader title="مركز عمليات المحتوى" subtitle="إدارة ومراقبة المحتوى التعليمي على نطاق واسع" icon="📚" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="إجمالي المقالات" value={stats?.totalArticles || 0} icon="📝" gradient="from-sky-500 to-blue-500" />
        <StatCard label="منشورة" value={stats?.publishedArticles || 0} icon="✅" gradient="from-emerald-500 to-teal-500" />
        <StatCard label="مسودات" value={stats?.draftArticles || 0} icon="📄" gradient="from-slate-500 to-slate-600" />
        <StatCard label="مجدولة" value={stats?.scheduledArticles || 0} icon="🕒" gradient="from-amber-500 to-orange-500" />
        <StatCard label="الكتب" value={stats?.totalBooks || 0} icon="📚" gradient="from-rose-500 to-pink-500" />
        <StatCard label="الاختبارات" value={stats?.totalQuizzes || 0} icon="🎯" gradient="from-purple-500 to-fuchsia-500" />
        <StatCard label="الأدوات الطبية" value={stats?.totalClinicalTools || 0} icon="🧮" gradient="from-cyan-500 to-sky-500" />
        <StatCard label="الفيديوهات" value={stats?.totalVideos || 0} icon="🎬" gradient="from-orange-500 to-amber-500" />
        <StatCard label="التصنيفات" value={stats?.totalCategories || 0} icon="📂" gradient="from-violet-500 to-purple-500" />
        <StatCard label="الوسوم" value={stats?.totalTags || 0} icon="🏷️" gradient="from-teal-500 to-emerald-500" />
        <StatCard label="مفهرس بالـ AI" value={stats?.aiIndexedArticles || 0} icon="🤖" gradient="from-indigo-500 to-blue-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Content Pipeline */}
        <div className={cardCls + " p-5"}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black">خط أنابيب المحتوى (Pipeline)</h3>
            <Link to="/admin/articles" className="text-xs text-sky-500 hover:underline">إدارة</Link>
          </div>
          {pipeline.length > 0 ? (
            <div className="space-y-2 text-sm">
              {pipeline.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="truncate">{item.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{item.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 p-4 text-center">لا يوجد محتوى في خط الأنابيب.</p>}
        </div>

        {/* SEO Issues */}
        <div className={cardCls + " p-5"}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black">مشكلات SEO</h3>
            <Link to="/admin/seo" className="text-xs text-sky-500 hover:underline">مركز SEO</Link>
          </div>
          {seoIssues.length > 0 ? (
            <div className="space-y-2 text-sm">
              {seoIssues.map((item) => (
                <div key={item.id} className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                  <div className="font-semibold truncate">{item.title}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">{item.issues.join(" • ")}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-emerald-500 p-4 text-center">✅ لا توجد مشكلات SEO واضحة.</p>}
        </div>

        {/* Duplicate Detection */}
        <div className={cardCls + " p-5 lg:col-span-2"}>
          <h3 className="font-black mb-4">الكشف عن التكرار (Duplicate Detection)</h3>
          {duplicates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {duplicates.map((item) => (
                <div key={item.id} className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-900">
                  <div className="font-semibold text-rose-700 dark:text-rose-400 truncate">{item.title}</div>
                  <div className="text-xs mt-1">تم العثور على {item.duplicate_count} نسخ مطابقة.</div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-emerald-500 p-4 text-center">✅ لا يوجد محتوى مكرر.</p>}
        </div>

      </div>
      
      <div className="mt-6 text-center text-xs text-slate-400">
        مركز عمليات المحتوى • بيانات حقيقية من Supabase • لا بيانات وهمية
      </div>
    </div>
  );
}
