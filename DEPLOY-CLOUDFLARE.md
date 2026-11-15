# نشر الموقع على Cloudflare Pages (مجاني، نقل بيانات غير محدود)

1. سجّل/ادخل على https://dash.cloudflare.com ← **Workers & Pages** ← **Create** ← **Pages** ← **Connect to Git**.
2. اختر المستودع `wekaali321-crypto/Nursehub-Egypt-` وفرع الإنتاج `main`.
3. إعدادات البناء: Framework preset = None · Build command = `npm run build` · Build output directory = `dist`.
4. المتغيّرات (Settings ← Variables and Secrets ← Production)، انسخها من لوحة Vercel (Project ← Settings ← Environment Variables):
   - `NODE_VERSION` = `22`
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (+ `VITE_ADMIN_EMAIL` إن وُجد) — متغيّرات البناء
   - للدوال الخلفية (اجعلها Secret): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
5. اضغط Save and Deploy. سمّ المشروع `nursehub-egypt` ليصبح الرابط `https://nursehub-egypt.pages.dev`.
6. في Supabase ← Authentication ← URL Configuration: أضف الرابط الجديد إلى Site URL وRedirect URLs.
7. الدوال الخلفية موجودة في مجلد `functions/` (تسجيل دخول الأدمن، الطلبات، تتبع الفاتورة، sitemap.xml) وتعمل تلقائيًا.
8. عند شراء الدومين الخاص: Pages ← Custom domains ← Set up a domain، ثم حدّث `public/robots.txt` و`public/.well-known/assetlinks.json` وأعد بناء تطبيق الأندرويد (APK) على الدومين الجديد.

## الامتحان الشفوي الذكي مع علي (Workers AI)
الزرار الطاير بتاع علي عاشور شغال في كل الصفحات. الوضع **المجاني** شغال من غير أي إعداد. الوضع **الذكي** محتاج ربط Workers AI مرة واحدة:
1. Workers & Pages ← مشروع `nursehub-egypt` ← **Settings** ← **Bindings** ← **Add** ← **Workers AI**.
2. اسم المتغيّر (Variable name) لازم يكون بالظبط `AI`. اعمله لـ **Production** (ولـ Preview لو عايز تجرّب هناك).
3. اعمل **Retry deployment** لآخر نشر، أو ادمج أي تعديل، عشان الربط يشتغل.
4. اختياري (Variables): `AI_DAILY_NEURONS` = الحد اليومي (الافتراضي 9000 من 10,000 المجانية)، و`AI_MODEL` لتغيير الموديل (الافتراضي `@cf/meta/llama-3.3-70b-instruct-fp8-fast`).
- العدّاد المباشر والتشغيل والإيقاف والحد اليومي: لوحة التحكم ← مفاتيح الميزات ← «الامتحان الشفوي الذكي».
- لما الحد يخلص (أو Workers AI يرفض)، الموقع بيحوّل للامتحان المجاني لوحده لحد 00:00 UTC (2 الفجر بتوقيت القاهرة).
- الاستهلاك: صف واحد في `nh_settings` لكل يوم (`ai_usage:YYYY-MM-DD`)، وكتابة واحدة لكل طلب AI. الصوت (كلام وسماع) من المتصفح نفسه ومجاني.
- أسئلة الوضع المجاني ملفات ثابتة في `public/exams/oral/` (مش من D1). بعد تحديث لقطة البيانات شغّل: `node scripts/build-oral-pools.mjs`.
