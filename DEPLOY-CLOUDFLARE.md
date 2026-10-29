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
