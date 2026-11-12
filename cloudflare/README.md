# الانتقال من Supabase إلى Cloudflare (D1 + R2)

الباك إند الجديد (`functions/rest`, `functions/auth`, `functions/storage` + `functions/_lib/sb*.js`) متوافق مع Supabase،
فالموقع يشتغل بنفس الكود؛ التبديل بمتغير واحد `VITE_SUPABASE_URL=self`.

## الخطوات (مرة واحدة)
1. **Cloudflare → My Profile → API Tokens → Create Token** بصلاحيات: `Account · D1 · Edit` و`Account · Workers R2 Storage · Edit` و`Account · Cloudflare Pages · Edit`. انسخ التوكن.
   وانسخ **Account ID** من صفحة Workers & Pages.
2. **GitHub → المستودع → Settings → Secrets and variables → Actions → New repository secret**:
   - `CLOUDFLARE_API_TOKEN` و`CLOUDFLARE_ACCOUNT_ID`
   - `ADMIN_PASSWORD` (نفس كلمة سر الأدمن الموجودة في Cloudflare Pages)
   - اختياري لسحب البيانات الحديثة والخاصة (طلبات/مشتركين/تعليقات): `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY`
3. **Actions → "Cloudflare setup" → Run workflow**: اكتب بريد الأدمن، **اترك cutover مقفول**. ينشئ D1 وR2 ويطبّق الجداول ويربطهم بالمشروع ويعيد النشر.
4. **Actions → "Cloudflare import" → Run workflow**: بريد الأدمن. ينقل البيانات.
5. افتح الموقع وجرّب لوحة التحكم (الأدمن يدخل بنفس الإيميل وكلمة سر `ADMIN_PASSWORD`).
6. **Actions → "Cloudflare setup" مرة تانية** وفعّل **cutover** → الموقع يتحول للباك إند الجديد ويعيد النشر.
7. بعد أسبوع من الاستقرار، يمكن إيقاف مشروع Supabase.

## ملاحظات
- المستخدمون العاديون (23 حساب) لازم يسجلوا من جديد: كلمات السر القديمة لا تُنقل. الأدمن يدخل بـ `ADMIN_PASSWORD`.
- تسجيل الدخول بـ Google يحتاج `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` كمتغيرات (Secret) في Cloudflare Pages وإضافة `https://nursehubegypt.com/auth/v1/callback` في Google Console.
- نسيان كلمة السر: لا يوجد بريد صادر على الخطة المجانية؛ الأدمن يعيد التعيين يدويًا.
- إشعارات الدفع (send-push) غير مفعّلة بعد على هذا الباك إند.
- رفع ملفات من لوحة التحكم يذهب إلى R2 (`MEDIA`)، والملفات القديمة تبقى في `public/media`.
- `PBKDF2_ITER` (افتراضي 15000) لتشفير كلمات سر المستخدمين؛ مناسب للخطة المجانية (حد 10ms CPU).
- اختبار محلي: `npx wrangler@3 pages dev dist --d1=DB --r2=MEDIA --binding JWT_SECRET=... ADMIN_PASSWORD=... ADMIN_EMAIL=...` ثم `node cloudflare/import.mjs`.
