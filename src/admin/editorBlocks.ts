/** Block HTML templates for the professional editor, grouped by category. */

export interface BlockDef { key: string; label: string; icon: string; html: string; group: string }

export const BLOCKS: BlockDef[] = [
  // Callout / alert boxes
  { group: "صناديق", key: "info", label: "صندوق معلومات", icon: "ℹ️", html: `<div class="nh-box nh-info"><strong>معلومة:</strong> اكتب هنا...</div><p></p>` },
  { group: "صناديق", key: "success", label: "صندوق نجاح", icon: "✅", html: `<div class="nh-box nh-success"><strong>ملاحظة هامة:</strong> اكتب هنا...</div><p></p>` },
  { group: "صناديق", key: "warning", label: "صندوق تحذير", icon: "⚠️", html: `<div class="nh-box nh-warning"><strong>تحذير:</strong> اكتب هنا...</div><p></p>` },
  { group: "صناديق", key: "error", label: "صندوق خطأ", icon: "🚫", html: `<div class="nh-box nh-error"><strong>تنبيه:</strong> اكتب هنا...</div><p></p>` },
  { group: "صناديق", key: "callout", label: "Callout مميز", icon: "💬", html: `<div class="nh-box nh-callout">💡 اكتب الفكرة المميزة هنا...</div><p></p>` },
  { group: "صناديق", key: "important", label: "ملاحظة مهمة", icon: "❗", html: `<div class="nh-important"><strong>مهم جداً:</strong> اكتب هنا...</div><p></p>` },

  // Nursing / clinical
  { group: "طبي وتمريضي", key: "clinical", label: "تنبيه سريري", icon: "🏥", html: `<div class="nh-clinical"><strong>🏥 تنبيه سريري:</strong> اكتب الملاحظة السريرية...</div><p></p>` },
  { group: "طبي وتمريضي", key: "tip", label: "نصيحة تمريضية", icon: "💡", html: `<div class="nh-tip"><strong>💡 نصيحة تمريضية:</strong> اكتب النصيحة...</div><p></p>` },
  { group: "طبي وتمريضي", key: "pearl", label: "لؤلؤة سريرية", icon: "🦪", html: `<div class="nh-pearl"><strong>🦪 Clinical Pearl:</strong> اكتب المعلومة القيّمة...</div><p></p>` },
  { group: "طبي وتمريضي", key: "drug", label: "صندوق دواء", icon: "💊", html: `<div class="nh-drug"><h4>💊 اسم الدواء</h4><p><strong>الجرعة:</strong> ...</p><p><strong>دواعي الاستعمال:</strong> ...</p><p><strong>الاعتبارات التمريضية:</strong> ...</p></div><p></p>` },
  { group: "طبي وتمريضي", key: "procedure", label: "صندوق إجراء", icon: "🩺", html: `<div class="nh-procedure"><h4>🩺 الإجراء</h4><p><strong>الأدوات:</strong> ...</p><ol><li>الخطوة الأولى...</li><li>الخطوة الثانية...</li></ol></div><p></p>` },
  { group: "طبي وتمريضي", key: "quickfacts", label: "حقائق سريعة", icon: "⚡", html: `<div class="nh-quickfacts"><strong>⚡ حقائق سريعة:</strong><ul><li>حقيقة 1</li><li>حقيقة 2</li></ul></div><p></p>` },
  { group: "طبي وتمريضي", key: "case", label: "دراسة حالة", icon: "📋", html: `<div class="nh-case"><h4>📋 دراسة حالة</h4><p><strong>المريض:</strong> ...</p><p><strong>العرض:</strong> ...</p><p><strong>الخطة:</strong> ...</p></div><p></p>` },
  { group: "طبي وتمريضي", key: "scenario", label: "سيناريو سريري", icon: "🎭", html: `<div class="nh-scenario"><strong>🎭 سيناريو سريري:</strong><p>صف الموقف السريري هنا...</p><p><strong>السؤال:</strong> ما التصرف الصحيح؟</p></div><p></p>` },
  { group: "طبي وتمريضي", key: "osce", label: "قائمة OSCE", icon: "☑️", html: `<div class="nh-procedure"><h4>☑️ OSCE Checklist</h4><ul class="nh-checklist"><li>☐ الخطوة 1</li><li>☐ الخطوة 2</li><li>☐ الخطوة 3</li></ul></div><p></p>` },
  { group: "طبي وتمريضي", key: "definition", label: "تعريف مميّز", icon: "📖", html: `<p><span class="nh-def">المصطلح</span>: التعريف هنا...</p><p></p>` },
  { group: "طبي وتمريضي", key: "medformula", label: "معادلة طبية", icon: "🧮", html: `<div class="nh-drug"><h4>🧮 معادلة</h4><p style="text-align:center;font-size:1.1rem">معدل التنقيط = (الحجم × عامل التنقيط) ÷ الزمن</p></div><p></p>` },

  // Assessment / interactive
  { group: "تفاعلي وتقييم", key: "mcq", label: "سؤال اختيارات (MCQ)", icon: "🔘", html: `<div class="nh-mcq"><strong>❓ السؤال:</strong> اكتب السؤال هنا؟<ol type="a"><li>الخيار الأول</li><li>الخيار الثاني ✅</li><li>الخيار الثالث</li><li>الخيار الرابع</li></ol><details class="nh-accordion"><summary>الإجابة والشرح</summary><div>الإجابة الصحيحة: (ب). الشرح...</div></details></div><p></p>` },
  { group: "تفاعلي وتقييم", key: "truefalse", label: "صح / خطأ", icon: "✔️", html: `<div class="nh-mcq"><strong>صح أو خطأ:</strong> العبارة هنا...<details class="nh-accordion"><summary>الإجابة</summary><div>✅ صحيحة — الشرح...</div></details></div><p></p>` },
  { group: "تفاعلي وتقييم", key: "fillblank", label: "أكمل الفراغ", icon: "✏️", html: `<div class="nh-mcq"><p>أكمل الفراغ: المعدل الطبيعي لضربات القلب هو ______ نبضة/دقيقة.</p><details class="nh-accordion"><summary>الإجابة</summary><div>60-100</div></details></div><p></p>` },
  { group: "تفاعلي وتقييم", key: "flashcard", label: "بطاقة تعليمية", icon: "🎴", html: `<details class="nh-flashcard"><summary>🎴 اضغط لكشف الإجابة — السؤال هنا؟</summary><div style="margin-top:.6rem">الإجابة هنا...</div></details><p></p>` },
  { group: "تفاعلي وتقييم", key: "faq", label: "أسئلة شائعة", icon: "❔", html: `<details class="nh-accordion"><summary>سؤال شائع؟</summary><div>إجابة السؤال...</div></details><details class="nh-accordion"><summary>سؤال آخر؟</summary><div>إجابة...</div></details><p></p>` },

  // Structure / layout
  { group: "التخطيط", key: "quote", label: "اقتباس", icon: "❝", html: `<blockquote>اكتب الاقتباس هنا...</blockquote><p></p>` },
  { group: "التخطيط", key: "accordion", label: "أكورديون", icon: "🔽", html: `<details class="nh-accordion"><summary>العنوان</summary><div>المحتوى القابل للطي...</div></details><p></p>` },
  { group: "التخطيط", key: "tabs", label: "تبويبات", icon: "📑", html: `<details class="nh-accordion" open><summary>التبويب 1</summary><div>محتوى الأول...</div></details><details class="nh-accordion"><summary>التبويب 2</summary><div>محتوى الثاني...</div></details><p></p>` },
  { group: "التخطيط", key: "steps", label: "خطوات متسلسلة", icon: "📶", html: `<div class="nh-steps"><div class="nh-step"><strong>الخطوة الأولى</strong><br/>الوصف...</div><div class="nh-step"><strong>الخطوة الثانية</strong><br/>الوصف...</div></div><p></p>` },
  { group: "التخطيط", key: "timeline", label: "خط زمني", icon: "🕐", html: `<div class="nh-timeline"><div class="nh-tl-item"><strong>المرحلة 1</strong><br/>حدث...</div><div class="nh-tl-item"><strong>المرحلة 2</strong><br/>حدث...</div></div><p></p>` },
  { group: "التخطيط", key: "columns", label: "عمودان", icon: "🟰", html: `<div class="nh-columns"><div><p>العمود الأول...</p></div><div><p>العمود الثاني...</p></div></div><p></p>` },
  { group: "التخطيط", key: "threecols", label: "ثلاثة أعمدة", icon: "🔳", html: `<div class="nh-three-cols"><div><p>الأول...</p></div><div><p>الثاني...</p></div><div><p>الثالث...</p></div></div><p></p>` },
  { group: "التخطيط", key: "card", label: "بطاقة", icon: "🃏", html: `<div class="nh-card"><h4>عنوان البطاقة</h4><p>محتوى البطاقة...</p></div><p></p>` },
  { group: "التخطيط", key: "button", label: "زر", icon: "🔘", html: `<a href="#" class="nh-btn-block">اضغط هنا</a><p></p>` },
  { group: "التخطيط", key: "divider", label: "فاصل", icon: "➖", html: `<hr class="nh-divider"/>` },

  // Tables & media
  { group: "جداول ووسائط", key: "table", label: "جدول", icon: "📊", html: `<table><thead><tr><th>عنوان 1</th><th>عنوان 2</th></tr></thead><tbody><tr><td>خلية</td><td>خلية</td></tr><tr><td>خلية</td><td>خلية</td></tr></tbody></table><p></p>` },
  { group: "جداول ووسائط", key: "comparison", label: "جدول مقارنة", icon: "⚖️", html: `<table><thead><tr><th>المعيار</th><th>الخيار أ</th><th>الخيار ب</th></tr></thead><tbody><tr><td>...</td><td>...</td><td>...</td></tr></tbody></table><p></p>` },
  { group: "جداول ووسائط", key: "gallery", label: "معرض صور", icon: "🖼️", html: `<div class="nh-gallery"><img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300" alt=""/><img src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=300" alt=""/><img src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=300" alt=""/></div><p></p>` },
  { group: "جداول ووسائط", key: "beforeafter", label: "قبل / بعد", icon: "🔄", html: `<div class="nh-columns"><div><strong>قبل</strong><img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400" alt="قبل"/></div><div><strong>بعد</strong><img src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400" alt="بعد"/></div></div><p></p>` },
  { group: "جداول ووسائط", key: "youtube", label: "فيديو YouTube", icon: "▶️", html: `<div style="aspect-ratio:16/9;margin:1rem 0"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="width:100%;height:100%;border-radius:8px" allowfullscreen loading="lazy"></iframe></div><p></p>` },
  { group: "جداول ووسائط", key: "audio", label: "مشغّل صوت", icon: "🔊", html: `<audio controls style="width:100%;margin:1rem 0"><source src="#"/></audio><p></p>` },
  { group: "جداول ووسائط", key: "download", label: "زر تحميل", icon: "⬇️", html: `<div class="nh-drug"><span>📄 اسم الملف.pdf</span> <a href="#" class="nh-btn-block" style="margin-inline-start:8px">⬇️ تحميل</a></div><p></p>` },

  // Diagrams / references
  { group: "مخططات ومراجع", key: "flowchart", label: "مخطط انسيابي", icon: "🔀", html: `<div class="nh-steps"><div class="nh-step">البداية</div><div class="nh-step">القرار / الإجراء</div><div class="nh-step">النتيجة</div></div><p></p>` },
  { group: "مخططات ومراجع", key: "mindmap", label: "خريطة ذهنية", icon: "🧠", html: `<div class="nh-card"><h4>🧠 الفكرة المركزية</h4><ul><li>فرع 1<ul><li>تفصيل...</li></ul></li><li>فرع 2</li><li>فرع 3</li></ul></div><p></p>` },
  { group: "مخططات ومراجع", key: "infographic", label: "إنفوجرافيك", icon: "📈", html: `<div class="nh-scenario"><h4>📈 عنوان الإنفوجرافيك</h4><div class="nh-three-cols"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:#0ea5e9">١</div>نقطة</div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:#0ea5e9">٢</div>نقطة</div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:#0ea5e9">٣</div>نقطة</div></div></div><p></p>` },
  { group: "مخططات ومراجع", key: "reference", label: "مرجع", icon: "🔖", html: `<div class="nh-box nh-info"><strong>🔖 المراجع:</strong><ol><li>المرجع الأول...</li><li>المرجع الثاني...</li></ol></div><p></p>` },
  { group: "مخططات ومراجع", key: "toc", label: "جدول محتويات", icon: "📋", html: `<div class="nh-box nh-info"><strong>📑 جدول المحتويات</strong><br/>يُنشأ تلقائياً من العناوين عند العرض.</div><p></p>` },
  { group: "مخططات ومراجع", key: "code", label: "كتلة كود", icon: "</>", html: `<pre><code>// اكتب الكود هنا</code></pre><p></p>` },
  { group: "مخططات ومراجع", key: "html", label: "كود HTML", icon: "🧩", html: `<div><!-- الصق كود HTML هنا --></div><p></p>` },
];

/** Distinct groups in order for the block picker. */
export const BLOCK_GROUPS = Array.from(new Set(BLOCKS.map((b) => b.group)));

export const FONT_SIZES = [
  { label: "صغير جداً", value: "1" },
  { label: "صغير", value: "2" },
  { label: "عادي", value: "3" },
  { label: "متوسط", value: "4" },
  { label: "كبير", value: "5" },
  { label: "كبير جداً", value: "6" },
  { label: "ضخم", value: "7" },
];

export const FONT_FAMILIES = ["Cairo", "Tajawal", "Arial", "Times New Roman", "Courier New"];

export const TEXT_COLORS = ["#0f172a", "#ef4444", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ec4899", "#ffffff"];
export const BG_COLORS = ["transparent", "#fef3c7", "#dcfce7", "#dbeafe", "#fce7f3", "#ede9fe", "#fee2e2"];

/* ---------- Lightweight local "AI" helpers (rule-based, fully offline) ---------- */
export function aiTitleSuggestions(topic: string): string[] {
  const base = topic.trim() || "موضوع التمريض";
  return [
    `دليلك الشامل حول ${base}`,
    `${base}: كل ما يحتاج الممرض معرفته`,
    `${base} — شرح مبسط خطوة بخطوة`,
    `أهم 7 معلومات عن ${base} للممرضين`,
    `${base}: التطبيق العملي والاعتبارات التمريضية`,
  ];
}

export function aiMetaDescription(title: string, text: string): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const snippet = plain.slice(0, 150);
  return snippet || `${title} - مقال تعليمي متخصص في التمريض على منصة NurseHub Egypt.`;
}

export function aiKeywords(title: string, text: string): string[] {
  const stop = new Set(["في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي", "أو", "ثم", "كل", "بعد", "قبل"]);
  const words = (title + " " + text.replace(/<[^>]+>/g, " "))
    .replace(/[^\u0600-\u06FFa-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}

export function aiImproveText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/ ,/g, "،")
    .replace(/،(?=\S)/g, "، ")
    .replace(/\.(?=\S)/g, ". ")
    .trim();
}

export function aiSummarize(text: string): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = plain.split(/[.!؟]/).filter((s) => s.trim().length > 20);
  return sentences.slice(0, 3).join("، ") + (sentences.length ? "." : "");
}

/* ---------- Readability & SEO scoring ---------- */
export function readabilityScore(text: string): { score: number; label: string } {
  const plain = text.replace(/<[^>]+>/g, " ").trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  const sentences = Math.max(1, plain.split(/[.!؟]/).filter((s) => s.trim()).length);
  const avg = words / sentences;
  let score = 100 - Math.abs(avg - 15) * 3;
  score = Math.max(20, Math.min(100, Math.round(score)));
  const label = score >= 80 ? "ممتازة" : score >= 60 ? "جيدة" : score >= 40 ? "متوسطة" : "تحتاج تحسين";
  return { score, label };
}

export function seoScore(opts: { title: string; metaTitle: string; metaDescription: string; content: string; keywords: string; cover: string }): { score: number; checks: { ok: boolean; text: string }[] } {
  const wordCount = opts.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const hasH2 = /<h2/i.test(opts.content);
  const hasImg = /<img/i.test(opts.content) || !!opts.cover;
  const mt = opts.metaTitle || opts.title;
  const checks = [
    { ok: opts.title.length >= 10, text: "عنوان واضح (10+ حرف)" },
    { ok: mt.length >= 15 && mt.length <= 65, text: "Meta Title بطول مناسب (15-65)" },
    { ok: opts.metaDescription.length >= 50 && opts.metaDescription.length <= 160, text: "Meta Description (50-160 حرف)" },
    { ok: !!opts.keywords.trim(), text: "كلمات مفتاحية محددة" },
    { ok: wordCount >= 300, text: "محتوى كافٍ (300+ كلمة)" },
    { ok: hasH2, text: "يحتوي عناوين فرعية (H2)" },
    { ok: hasImg, text: "يحتوي صورة" },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}
