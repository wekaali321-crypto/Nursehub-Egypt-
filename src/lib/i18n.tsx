import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

/** Translation dictionary. Keys are shared; values per language. */
const dict = {
  // Brand / generic
  "brand.tagline": { ar: "منصتك الأولى لتعليم التمريض", en: "Your #1 Nursing Education Platform" },
  "brand.egypt": { ar: "مصر", en: "Egypt" },
  "common.viewAll": { ar: "عرض الكل", en: "View All" },
  "common.more": { ar: "المزيد", en: "More" },
  "common.readMore": { ar: "اقرأ المزيد", en: "Read More" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.searchPlaceholder": { ar: "ابحث عن مقال، دواء، مهارة...", en: "Search articles, drugs, skills..." },
  "common.loading": { ar: "جارٍ التحميل...", en: "Loading..." },
  "common.comingSoon": { ar: "النسخة الإنجليزية قريباً.", en: "English version coming soon." },
  "common.comingSoonAr": { ar: "النسخة العربية قريباً.", en: "Arabic version coming soon." },
  "common.item": { ar: "عنصر", en: "items" },
  "common.download": { ar: "تحميل", en: "Download" },
  "common.startNow": { ar: "ابدأ الآن", en: "Start Now" },
  "common.subscribe": { ar: "اشترك", en: "Subscribe" },
  "common.send": { ar: "إرسال", en: "Send" },
  "common.noResults": { ar: "لا توجد نتائج مطابقة.", en: "No matching results." },
  "common.noData": { ar: "لا توجد بيانات", en: "No data available" },

  // Nav / menu
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.articles": { ar: "المقالات", en: "Articles" },
  "nav.summaries": { ar: "الملخصات", en: "Summaries" },
  "nav.drugs": { ar: "الأدوية", en: "Drugs" },
  "nav.skills": { ar: "المهارات", en: "Skills" },
  "nav.infectionControl": { ar: "مكافحة العدوى", en: "Infection Control" },
  "nav.careplans": { ar: "خطط الرعاية", en: "Care Plans" },
  "nav.books": { ar: "الكتب", en: "Books" },
  "nav.quizzes": { ar: "الاختبارات", en: "Quizzes" },
  "nav.tools": { ar: "الأدوات", en: "Tools" },
  "nav.ecg": { ar: "مكتبة ECG", en: "ECG Library" },
  "nav.store": { ar: "المتجر", en: "Store" },
  "nav.admin": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.login": { ar: "تسجيل الدخول", en: "Login" },
  "nav.menu": { ar: "القائمة", en: "Menu" },

  // Home sections
  "home.badge": { ar: "🏆 المنصة العربية الأولى لتعليم التمريض", en: "🏆 The #1 Nursing Education Platform" },
  "home.heroDesc": { ar: "مقالات، ملخصات، أدوية، مهارات وأدوات حسابية في مكان واحد.", en: "Articles, summaries, drugs, skills & medical calculators in one place." },
  "home.browse": { ar: "تصفح المحتوى", en: "Browse Content" },
  "home.drugGuide": { ar: "دليل الأدوية", en: "Drug Guide" },
  "home.featured": { ar: "محتوى مميز", en: "Featured Content" },
  "home.featuredSub": { ar: "أبرز المقالات والملفات المختارة", en: "Top selected articles & files" },
  "home.categories": { ar: "استكشف الأقسام", en: "Explore Categories" },
  "home.categoriesSub": { ar: "محتوى منظم حسب التخصص", en: "Content organized by specialty" },
  "home.latest": { ar: "أحدث المقالات", en: "Latest Articles" },
  "home.latestSub": { ar: "آخر ما تم نشره على المنصة", en: "Recently published" },
  "home.popular": { ar: "🔥 أكثر المقالات قراءة", en: "🔥 Most Read" },
  "home.popularSub": { ar: "الأكثر مشاهدة بين القراء", en: "Most viewed by readers" },
  "home.pdfs": { ar: "📄 آخر ملفات PDF والكتب", en: "📄 Latest PDFs & Books" },
  "home.pdfsSub": { ar: "حمّل أحدث الكتب والملخصات", en: "Download the newest books" },
  "home.quizzes": { ar: "🧠 اختبر معلوماتك", en: "🧠 Test Your Knowledge" },
  "home.quizzesSub": { ar: "اختبارات NCLEX و Prometric وبنوك أسئلة", en: "NCLEX, Prometric & MCQ banks" },
  "home.tools": { ar: "أدوات حسابية طبية", en: "Medical Calculators" },
  "home.toolsSub": { ar: "حاسبات احترافية تساعدك في عملك", en: "Professional calculators for your work" },
  "home.store": { ar: "المتجر الرقمي", en: "Digital Store" },
  "home.storeSub": { ar: "كتب، كورسات واشتراكات مميزة", en: "Books, courses & subscriptions" },
  "home.visitStore": { ar: "زيارة المتجر", en: "Visit Store" },
  "home.stat.article": { ar: "مقال تعليمي", en: "Articles" },
  "home.stat.book": { ar: "كتاب", en: "Books" },
  "home.stat.pdf": { ar: "ملف PDF", en: "PDF Files" },
  "home.stat.subscriber": { ar: "مشترك", en: "Subscribers" },
  "home.stat.tool": { ar: "أداة طبية", en: "Tools" },
  "home.stat.drug": { ar: "دواء", en: "Drugs" },
  "home.mascotPoint1": { ar: "رعاية بقلب واهتمام حقيقي", en: "Care with real compassion" },
  "home.mascotPoint2": { ar: "معرفة علمية وخبرة عملية", en: "Scientific knowledge & hands-on skill" },
  "home.mascotPoint3": { ar: "التزام مهني ومسؤولية دائمة", en: "Professional commitment & accountability" },
  "home.mascotAlt": { ar: "ممرض NurseHub Egypt", en: "NurseHub Egypt nurse" },
  "home.mascotTitle": { ar: "كيان التمريض في عالم المستشفى", en: "The Heart of Nursing in the Hospital World" },
  "home.mascotDesc": { ar: "من الطوارئ للعناية المركزة، الممرض هو حلقة الوصل بين المريض والفريق الصحي. نرافقك بمحتوى علمي موثوق في كل خطوة من رحلتك المهنية.", en: "From the ER to the ICU, the nurse is the vital link between patient and care team. We walk with you through every step of your professional journey with reliable, evidence-based content." },
  "home.mascotCredit": { ar: "RN. Ali Ashour", en: "RN. Ali Ashour" },

  // Newsletter
  "news.title": { ar: "اشترك في النشرة البريدية", en: "Subscribe to our Newsletter" },
  "news.desc": { ar: "احصل على أحدث المقالات والملخصات والعروض الحصرية مباشرة في بريدك.", en: "Get the latest articles, summaries and exclusive offers straight to your inbox." },
  "news.placeholder": { ar: "بريدك الإلكتروني", en: "Your email address" },
  "news.button": { ar: "اشترك الآن", en: "Subscribe Now" },
  "news.done": { ar: "✅ تم الاشتراك بنجاح! شكراً لك.", en: "✅ Subscribed successfully! Thank you." },

  // Footer
  "footer.sections": { ar: "الأقسام", en: "Sections" },
  "footer.important": { ar: "روابط مهمة", en: "Important Links" },
  "footer.legal": { ar: "قانوني", en: "Legal" },
  "footer.about": { ar: "من نحن", en: "About Us" },
  "footer.contact": { ar: "اتصل بنا", en: "Contact Us" },
  "footer.faq": { ar: "الأسئلة الشائعة", en: "FAQ" },
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "footer.terms": { ar: "شروط الاستخدام", en: "Terms of Use" },
  "footer.rights": { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
  "footer.madeWith": { ar: "صُمم بحب لطلاب التمريض 💙", en: "Made with love for nursing students 💙" },

  // Drugs
  "drugs.title": { ar: "دليل الأدوية", en: "Drug Guide" },
  "drugs.dose": { ar: "الجرعة", en: "Dosage" },
  "drugs.indications": { ar: "دواعي الاستعمال", en: "Indications" },
  "drugs.sideEffects": { ar: "الآثار الجانبية", en: "Side Effects" },
  "drugs.nursing": { ar: "الاعتبارات التمريضية", en: "Nursing Considerations" },
  "drugs.allCats": { ar: "كل الفئات", en: "All Categories" },

  // Quiz
  "quiz.start": { ar: "ابدأ الاختبار", en: "Start Quiz" },
  "quiz.questions": { ar: "سؤال", en: "questions" },
  "quiz.finish": { ar: "إنهاء وتصحيح", en: "Finish & Grade" },
  "quiz.next": { ar: "التالي", en: "Next" },
  "quiz.prev": { ar: "السابق", en: "Previous" },
  "quiz.passed": { ar: "ناجح ✅", en: "Passed ✅" },
  "quiz.failed": { ar: "لم تجتز درجة النجاح", en: "Did not pass" },
  "quiz.pageTitle": { ar: "الاختبارات والامتحانات", en: "Quizzes & Exams" },
  "quiz.pageDesc": { ar: "NCLEX · Prometric · بنوك أسئلة MCQ — مع مؤقت وتصحيح فوري وشهادة", en: "NCLEX · Prometric · MCQ banks — with a timer, instant grading & a certificate" },
  "quiz.numQuestions": { ar: "سؤال", en: "questions" },
  "quiz.questionLabel": { ar: "سؤال", en: "Question" },
  "quiz.time": { ar: "دقيقة", en: "min" },
  "quiz.noTimeLimit": { ar: "بدون وقت", en: "No time limit" },
  "quiz.passRate": { ar: "النجاح", en: "Pass" },
  "quiz.bestScore": { ar: "أفضل نتيجة", en: "Best score" },
  "quiz.startBtn": { ar: "ابدأ الآن", en: "Start Now" },
  "quiz.noQuizzesInCategory": { ar: "لا توجد اختبارات في هذا القسم بعد.", en: "No quizzes in this category yet." },
  "quiz.notFound": { ar: "الاختبار غير موجود", en: "Quiz not found" },
  "quiz.allQuizzes": { ar: "كل الاختبارات", en: "All Quizzes" },
  "quiz.numQuestionsLabel": { ar: "عدد الأسئلة", en: "Number of Questions" },
  "quiz.duration": { ar: "المدة", en: "Duration" },
  "quiz.notSpecified": { ar: "غير محدد", en: "Not specified" },
  "quiz.passScoreLabel": { ar: "درجة النجاح", en: "Passing Score" },
  "quiz.level": { ar: "المستوى", en: "Level" },
  "quiz.namePlaceholder": { ar: "اسمك (لإصدار الشهادة)", en: "Your name (for the certificate)" },
  "quiz.correctAnswersOf": { ar: "إجابة صحيحة", en: "correct answers" },
  "quiz.of": { ar: "من", en: "of" },
  "quiz.certificate": { ar: "شهادة إتمام", en: "Certificate of Completion" },
  "quiz.certifiedPassed": { ar: "اجتاز بنجاح", en: "Successfully passed" },
  "quiz.by": { ar: "بنسبة", en: "with" },
  "quiz.printCert": { ar: "🖨️ طباعة الشهادة", en: "🖨️ Print Certificate" },
  "quiz.retry": { ar: "إعادة", en: "Retry" },
  "quiz.otherQuizzes": { ar: "اختبارات أخرى", en: "Other Quizzes" },
  "quiz.reviewAnswers": { ar: "مراجعة الإجابات", en: "Review Answers" },
  "quiz.notAnswered": { ar: "لم تتم الإجابة", en: "Not answered" },
  "quiz.answered": { ar: "أُجيب", en: "Answered" },
  "quiz.trainee": { ar: "المتدرب", en: "Trainee" },
  "quiz.certAward": { ar: "تشهد", en: "certifies that" },
  "quiz.certBy": { ar: "بأن", en: "" },
  "quiz.certPassedQuiz": { ar: "قد اجتاز بنجاح اختبار", en: "has successfully passed the quiz" },
  "quiz.result": { ar: "النتيجة", en: "Score" },
  "quiz.date": { ar: "التاريخ", en: "Date" },
  "difficulty.easy": { ar: "سهل", en: "Easy" },
  "difficulty.medium": { ar: "متوسط", en: "Medium" },
  "difficulty.hard": { ar: "صعب", en: "Hard" },

  // Language
  "lang.switch": { ar: "English", en: "العربية" },

  // Tools page
  "tools.title": { ar: "🧮 الأدوات والحاسبات الطبية", en: "🧮 Medical Tools & Calculators" },
  "tools.sub": { ar: "حاسبات احترافية ومساعد ذكي لمساعدتك في عملك التمريضي", en: "Professional calculators & an AI assistant for your nursing work" },
  "tools.calc": { ar: "احسب", en: "Calculate" },

  // Category / search
  "cat.sortLatest": { ar: "الأحدث", en: "Latest" },
  "cat.sortPopular": { ar: "الأكثر مشاهدة", en: "Most viewed" },
  "cat.all": { ar: "الكل", en: "All" },
  "cat.protocolChecklists": { ar: "قوائم تحقق تفاعلية", en: "Interactive Checklists" },
  "cat.subcategories": { ar: "التصنيفات الفرعية", en: "Subcategories" },
  "cat.open": { ar: "افتح ←", en: "Open →" },
  "search.title": { ar: "🔍 البحث المتقدم", en: "🔍 Advanced Search" },
  "search.placeholder": { ar: "ابحث في المقالات، الكتب، الأدوية، المهارات...", en: "Search articles, books, drugs, skills..." },
  "search.results": { ar: "نتيجة", en: "results" },

  // Article page
  "article.notFound": { ar: "المقال غير موجود", en: "Article not found" },
  "article.backHome": { ar: "العودة للرئيسية", en: "Back to Home" },
  "article.related": { ar: "مقالات ذات صلة", en: "Related Articles" },
  "article.comments": { ar: "التعليقات", en: "Comments" },
  "article.rate": { ar: "قيّم هذا المقال", en: "Rate this article" },
  "article.share": { ar: "شارك المقال", en: "Share Article" },
  "article.readingTime": { ar: "دقيقة قراءة", en: "min read" },
  "article.views": { ar: "مشاهدة", en: "views" },
  "article.toc": { ar: "جدول المحتويات", en: "Table of Contents" },
  "article.author": { ar: "الكاتب", en: "Author" },
  "article.prev": { ar: "المقال السابق", en: "Previous Article" },
  "article.next": { ar: "المقال التالي", en: "Next Article" },
  "article.print": { ar: "طباعة", en: "Print" },
  "article.exportPdf": { ar: "تصدير PDF", en: "Export PDF" },
  "article.copyLink": { ar: "نسخ الرابط", en: "Copy Link" },
  "article.linkCopied": { ar: "تم نسخ الرابط", en: "Link copied" },
  "article.askAI": { ar: "اسأل عن هذا المقال", en: "Ask about this article" },
  "article.bookmark": { ar: "حفظ", en: "Save" },
  "article.bookmarked": { ar: "في المفضلة", en: "Saved" },
  "article.categories": { ar: "الأقسام", en: "Categories" },
  "article.lastUpdated": { ar: "آخر تحديث", en: "Last updated" },
} as const;

export type TKey = keyof typeof dict;

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string; dir: "rtl" | "ltr" } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("nursehub_lang");
    return saved === "en" || saved === "ar" ? saved : "ar";
  });

  useEffect(() => {
    localStorage.setItem("nursehub_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (k: TKey) => dict[k]?.[lang] ?? String(k);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return <I18nCtx.Provider value={{ lang, setLang, t, dir }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/**
 * Pick the right value from a bilingual pair, falling back gracefully.
 * Returns { text, fallback } so callers can show a "coming soon" note.
 */
export function bilingual(ar: string | null | undefined, en: string | null | undefined, lang: Lang): { text: string; missing: boolean } {
  if (lang === "en") {
    if (en && en.trim()) return { text: en, missing: false };
    return { text: ar ?? "", missing: true };
  }
  if (ar && ar.trim()) return { text: ar, missing: false };
  return { text: en ?? "", missing: true };
}
