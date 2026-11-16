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

## صوت الموقع الموحّد: Tarek (ElevenLabs)
صوت واحد لكل الموقع: جمل الممتحن في الامتحان الشفوي (علي أو دنيا) وقارئ الصفحات «استمع للمحتوى».
- Voice: **Tarek - Pleasant and Professional** — Voice ID `ckGEQg6YnSVooU5uDRsF` — Model `eleven_multilingual_v2` — MP3.
- المفتاح على السيرفر بس (Pages Function)، عمره ما بيوصل للمتصفح.

**الإعداد** (Cloudflare ← Workers & Pages ← `nursehub-egypt` ← Settings ← **Variables and Secrets** ← Production):
| الاسم | النوع | القيمة |
|---|---|---|
| `ELEVENLABS_API_KEY` | **Secret** | مفتاح ElevenLabs (Profile ← API Keys)، بصلاحية Text to Speech |
| `ELEVENLABS_TTS_MONTHLY_CHARS` | Text (اختياري) | حد الامتحان الشفوي في الشهر. الافتراضي **20000** |
| `SITE_READER_MONTHLY_CHARS` | Text (اختياري) | حد قارئ الموقع في الشهر. الافتراضي **8000** |

بعدها **Retry deployment** لآخر نشر.

**الحصص منفصلة:**
- الامتحان الشفوي: `/api/tts`، عدّاد `tts_usage:YYYY-MM`، إعداد اللوحة `oral_tts`، 150 جزء/ساعة لكل IP، 700 حرف للجزء.
- قارئ الموقع: `/api/ali-reader`، عدّاد `reader_usage:YYYY-MM`، إعداد اللوحة `site_reader`، 60 جزء/ساعة لكل IP، 1000 حرف للجزء.
- قراءة الصفحات عمرها ما تاكل من رصيد الامتحان. الافتراضي (20000 + 8000) أقل من 30,000 حرف (خطة Starter)؛ زوّدهم لو خطتك أكبر.
- حروف الجملة بتتحسب بس لما ElevenLabs يرجّع صوت فعلًا. الجمل المتكررة بتتخزن على Cloudflare ومش بتتحسب تاني.
- لوحة التحكم ← مفاتيح الميزات: عدّاد مباشر وتشغيل/إيقاف وحد أقل اختياري لكل واحد منهم.

**لما الصوت يقف** (الحد خلص، المفتاح غلط، ElevenLabs واقع): مفيش صوت تاني بيتكلم بداله. الامتحان بيكمل مكتوب مع تنبيه واضح، والقارئ بيقول إن الصوت مش متاح.
- مهم: الخطة المجانية في ElevenLabs ممنوع استخدامها تجاريًا (والموقع فيه إعلانات ومتجر)، فاستخدم خطة مدفوعة (Starter أو أعلى).
- Azure اتشال: متغيرات `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` مش مستخدمة تاني وتقدر تمسحها لو كنت ضفتها.
