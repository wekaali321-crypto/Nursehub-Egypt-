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

## صوت علي المصري (Microsoft Azure Speech — شاكر / سلمى)
من غيره، علي بيتكلم بصوت موبايل الزائر. لتشغيل الصوت المصري الطبيعي (مجاني لحد 500,000 حرف في الشهر):
1. اعمل حساب على https://portal.azure.com (ممكن يطلب كارت للتحقق، والخطة المجانية مش بتسحب فلوس).
2. **Create a resource** ← ابحث عن **Speech service** ← Create:
   - Resource group: جديد (مثلًا `nursehub`)
   - Region: **West Europe** (أو أي منطقة تانية فيها أصوات ar-EG)
   - Name: أي اسم (مثلًا `nursehub-voice`)
   - Pricing tier: **Free F0** ← لازم يبقى F0 عشان مفيش أي فلوس
3. بعد ما يخلص: افتح المورد ← **Keys and Endpoint** ← انسخ **KEY 1** وخد اسم المنطقة **Location/Region** (مثلًا `westeurope`).
4. في Cloudflare ← Workers & Pages ← `nursehub-egypt` ← Settings ← **Variables and Secrets** ← Production:
   - `AZURE_SPEECH_KEY` = KEY 1، ونوعه **Secret**
   - `AZURE_SPEECH_REGION` = `westeurope` (Text)
5. **Retry deployment** لآخر نشر.
- العدّاد والتشغيل والحد الشهري: لوحة التحكم ← مفاتيح الميزات ← «صوت علي المصري». الحد الافتراضي 450,000 (هامش أمان).
- الجمل المتكررة (الترحيب، «صح! برافو»، أسئلة البنك) بتتخزن على Cloudflare ومش بتتحسب تاني. لما الحد يخلص، علي بيتكلم بصوت الموبايل لحد أول الشهر.
