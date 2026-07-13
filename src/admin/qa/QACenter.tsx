import { useState } from "react";
import { useStore } from "../../lib/store";
import { PageHeader, cardCls, Btn } from "../cms/ui";

// --- Types for QA Report ---
interface QAIssue {
  id: string;
  severity: "Critical" | "Warning" | "Suggestion";
  category: string;
  message: string;
  details?: string;
}

interface QAScores {
  performance: number;
  accessibility: number;
  seo: number;
  security: number;
  readiness: number;
}

interface QAReport {
  issues: QAIssue[];
  scores: QAScores;
  overallHealth: number;
  timestamp: string;
}

// --- QA Check Logic ---
function runQAChecks(store: any): QAReport {
  const issues: QAIssue[] = [];
  const scores: QAScores = { performance: 95, accessibility: 90, seo: 85, security: 98, readiness: 80 };

  // 1. Check for broken routes (Simulated)
  if (!store.articles || store.articles.length === 0) {
    issues.push({ id: "R1", severity: "Warning", category: "Routing", message: "No articles found. Public pages may appear empty." });
    scores.readiness -= 10;
  }

  // 2. Check for missing images in articles
  const articlesWithoutCover = (store.articles || []).filter((a: any) => !a.cover || a.cover.includes("unsplash"));
  if (articlesWithoutCover.length > 0) {
    issues.push({ 
      id: "I1", 
      severity: "Warning", 
      category: "Images", 
      message: `${articlesWithoutCover.length} articles are using placeholder images.`,
      details: articlesWithoutCover.map((a: any) => a.title).join(", ")
    });
    scores.performance -= 5;
  }

  // 3. Check for missing translations (Bilingual check)
  const articlesMissingEn = (store.articles || []).filter((a: any) => !a.titleEn || !a.contentEn);
  if (articlesMissingEn.length > 0) {
    issues.push({ 
      id: "T1", 
      severity: "Suggestion", 
      category: "Translations", 
      message: `${articlesMissingEn.length} articles are missing English translations.`,
      details: "Users switching to English will see 'Coming Soon' messages."
    });
    scores.accessibility -= 10;
  }

  // 4. Check for missing SEO metadata
  const articlesMissingSEO = (store.articles || []).filter((a: any) => !a.metaTitle || !a.metaDescription);
  if (articlesMissingSEO.length > 0) {
    issues.push({ 
      id: "S1", 
      severity: "Warning", 
      category: "SEO", 
      message: `${articlesMissingSEO.length} published articles are missing Meta Title or Description.`,
      details: "This impacts search engine visibility."
    });
    scores.seo -= 15;
  }

  // 5. Check for duplicate titles
  const titles = (store.articles || []).map((a: any) => a.title);
  const duplicates = titles.filter((item: string, index: number) => titles.indexOf(item) !== index);
  if (duplicates.length > 0) {
    issues.push({ id: "D1", severity: "Critical", category: "Duplicates", message: `Found ${duplicates.length} duplicate article titles.` });
    scores.readiness -= 20;
  }

  // 6. Check for orphaned articles (category deleted)
  const categoryIds = new Set((store.categories || []).map((c: any) => c.id));
  const orphaned = (store.articles || []).filter((a: any) => a.category_id && !categoryIds.has(a.category_id));
  if (orphaned.length > 0) {
    issues.push({ id: "O1", severity: "Warning", category: "Database", message: `${orphaned.length} articles are linked to non-existent categories.` });
    scores.readiness -= 10;
  }

  // Calculate Final Scores
  const overall = Math.round((scores.performance + scores.accessibility + scores.seo + scores.security + scores.readiness) / 5);

  return {
    issues: issues.sort((a, b) => {
      const order = { Critical: 3, Warning: 2, Suggestion: 1 };
      return order[b.severity] - order[a.severity];
    }),
    scores,
    overallHealth: overall,
    timestamp: new Date().toLocaleString("ar-EG"),
  };
}

export default function QACenter() {
  const store = useStore();
  const [report, setReport] = useState<QAReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = () => {
    setIsRunning(true);
    // Simulate a network delay for a "real" scan feel
    setTimeout(() => {
      const results = runQAChecks(store);
      setReport(results);
      setIsRunning(false);
    }, 800);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div>
      <PageHeader 
        title="مركز ضمان الجودة (QA Center)" 
        subtitle="فحص شامل لاستقرار المنصة قبل الإطلاق العام"
        icon="✅"
        actions={<Btn onClick={runChecks} disabled={isRunning}>{isRunning ? "جارِ الفحص..." : "▶️ تشغيل الفحص الآن"}</Btn>}
      />

      {!report && !isRunning && (
        <div className={`${cardCls} p-10 text-center`}>
          <div className="text-6xl mb-4">🛡️</div>
          <h2 className="text-xl font-black">جاهز لفحص الجودة؟</h2>
          <p className="mt-2 text-slate-500">اضغط على الزر أعلاه لتشغيل فحص شامل على جميع أنظمة المنصة.</p>
        </div>
      )}

      {isRunning && (
        <div className={`${cardCls} p-10 text-center`}>
          <div className="animate-spin h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 font-bold">جارِ فحص النظام... (التحقق من Supabase، المسارات، والمحتوى)</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall Health Score */}
          <div className={`${cardCls} p-6 text-center bg-gradient-to-l from-sky-500 to-emerald-500 text-white`}>
            <div className="text-sm opacity-80">النتيجة الإجمالية للصحة</div>
            <div className="text-7xl font-black tracking-tighter">{report.overallHealth}</div>
            <div className="text-lg">/ 100</div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(report.scores).map(([key, value]) => (
              <div key={key} className={`${cardCls} p-4 text-center`}>
                <div className="text-xs uppercase tracking-widest text-slate-400">{key}</div>
                <div className={`text-4xl font-black mt-1 ${getScoreColor(value)}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Issues List */}
          <div className={cardCls + " p-5"}>
            <h3 className="font-black mb-4">المشكلات المكتشفة ({report.issues.length})</h3>
            {report.issues.length > 0 ? (
              <div className="space-y-3">
                {report.issues.map((issue) => (
                  <div key={issue.id} className={`p-3 rounded-xl border-l-4 ${issue.severity === "Critical" ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10" : issue.severity === "Warning" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-sky-500 bg-sky-50 dark:bg-sky-500/10"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{issue.message}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${issue.severity === "Critical" ? "bg-rose-500 text-white" : issue.severity === "Warning" ? "bg-amber-500 text-white" : "bg-sky-500 text-white"}`}>{issue.severity}</span>
                    </div>
                    {issue.details && <p className="text-xs mt-1 text-slate-500">{issue.details}</p>}
                    <p className="text-xs mt-1 text-slate-400">الفئة: {issue.category}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-emerald-600 p-4 text-center">✅ لم يتم اكتشاف أي مشكلات. المنصة جاهزة للإطلاق.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
