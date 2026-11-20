# استعادة كلمة المرور برمز البريد (OTP)

## الفكرة
1. العضو يكتب بريده في `/forgot` ← الرد واحد دائمًا (لا يكشف وجود الحساب).
2. لو الحساب موجود وليس أدمن: يُرسل رمز من 6 أرقام عبر Gmail SMTP.
   - الرمز صالح 10 دقائق.
   - إعادة الإرسال بعد 60 ثانية، وبحد أقصى 3 رسائل للطلب.
   - 5 محاولات إدخال، بعدها يُقفل الطلب ويبدأ العضو من جديد.
3. بعد رمز صحيح يحصل المتصفح على رمز إعادة تعيين لمرة واحدة (15 دقيقة). يكتب العضو كلمة مرور جديدة (8 أحرف على الأقل) فتُحفظ بنفس تشفير PBKDF2، ويُسجَّل خروجه من كل الأجهزة.

## الملفات
| الملف | الدور |
|---|---|
| `functions/_lib/sbauth.js` | المسارات `otp/request`، `otp/resend`، `otp/verify`، `otp/reset` |
| `functions/_lib/mailer.js` | عميل Gmail SMTP (`smtp.gmail.com:465` TLS) عبر `cloudflare:sockets` |
| `functions/_lib/resetEmail.js` | قالب الرسالة (HTML + نص عادي) |
| `functions/_lib/ratelimit.js` | حدود `otp*` |
| `cloudflare/migrations/0003_password_resets.sql` | جدول الطلبات (Idempotent) |
| `.github/workflows/d1-password-resets.yml` | تطبيق الجدول على D1 الإنتاج يدويًا (check / apply) |
| `src/pages/AuthPages.tsx` و`src/lib/passwordReset.ts` | صفحة الخطوات الثلاث |

## الأمان
- الرمز يُولّد بـ `crypto.getRandomValues`، ويُخزن HMAC-SHA256 مربوطًا بمعرّف الطلب (`JWT_SECRET`)، لا نصًا.
- رمز إعادة التعيين يُخزن SHA-256 فقط، ويُلغى بعد الاستخدام.
- طلب جديد للبريد يلغي كل الطلبات القديمة.
- البريد غير المسجل وحسابات الأدمن (`ADMIN_EMAIL` وأدوار admin/superadmin):
  - نفس الرد ونفس الصف في الجدول.
  - لا تُرسل رسالة.
  - لا يمكن أبدًا الوصول لخطوة كلمة المرور.
- الإرسال يتم في الخلفية (`waitUntil`)، فزمن الرد واحد سواء أُرسلت رسالة أم لا.
- الحدود:
  - 6 طلبات/ساعة لكل IP.
  - 5 رسائل/ساعة لكل بريد.
  - 30 خطأ/ساعة لكل IP في التحقق.
  - 450 رسالة/يوم إجمالًا (حد Gmail حوالي 500).
- السجلات لا تحتوي الرمز ولا كلمة المرور ولا الـ App Password: فقط فئة الخطأ، مثل `smtp_auth_535`.
- بعد التغيير تُحذف كل الـ refresh tokens. الـ access token الحالي ينتهي خلال ساعة كحد أقصى، لأنه JWT لا يُسحب.

## الإعداد (مرة واحدة)
1. **App Password من Google:**
   1. حساب Gmail الذي سيرسل → https://myaccount.google.com/security → فعّل **2-Step Verification**.
   2. افتح https://myaccount.google.com/apppasswords واكتب اسمًا (مثلًا `NurseHub Cloudflare`) ← Create.
   3. انسخ الـ 16 حرفًا. لا تُرسلها لأحد ولا تضعها في GitHub.
2. **Cloudflare:**
   1. اذهب إلى Workers & Pages ← مشروع الموقع ← Settings ← Variables and Secrets ← Production ← Add.
   2. أضف `GMAIL_USER` (Type: Secret) = عنوان Gmail المرسل.
   3. أضف `GMAIL_APP_PASSWORD` (Type: Secret) = الـ 16 حرفًا، والمسافات لا تضر.
   4. اختياري: `MAIL_FROM_NAME` (الافتراضي `NurseHub Egypt`).
3. **الجدول:**
   1. اذهب إلى GitHub ← Actions ← **D1 password-reset table** ← Run workflow.
   2. شغّله بوضع `check` أولًا، ثم `apply`.
   3. بديل محلي: `npx wrangler@4 d1 execute nursehub --remote --file=cloudflare/migrations/0003_password_resets.sql`
4. أعد النشر (Deployments ← Retry deployment)، أو ادمج الفرع، حتى تُقرأ الـ Secrets الجديدة.
5. **اختبار حقيقي:**
   1. افتح `/forgot` ببريد عضو عادي (ليس الأدمن).
   2. لو الرسالة لم تصل خلال دقيقة: Workers & Pages ← المشروع ← Functions ← Real-time Logs، وابحث عن `password reset e-mail not sent: …`.
   3. معاني الأخطاء:
      - `smtp_auth_535`: الـ App Password أو البريد خطأ.
      - `smtp_connect`: الاتصال بـ Gmail فشل.
      - `smtp_timeout`: Gmail لم يرد في الوقت.

بدون الـ Secrets، الصفحة تعرض بوضوح أن الاستعادة بالبريد غير متاحة (503 `email_not_configured`)، ولا تدّعي الإرسال.
