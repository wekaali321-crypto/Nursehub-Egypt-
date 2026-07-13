# NurseHub Egypt — تعليمات التنفيذ الكاملة

## 🚀 تشغيل المشروع (خطوة بخطوة)

### الخطوة 1: تثبيت الحزم
```bash
npm install
```

### الخطوة 2: تشغيل بيئة التطوير
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:5173`

### الخطوة 3: بناء نسخة الإنتاج
```bash
npm run build
npm run preview
```

---

## 🔗 ربط Supabase

### الخطوة 1: إنشاء مشروع Supabase
1. ادخل إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. من **Project Settings → API** انسخ:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`

### الخطوة 2: تنفيذ مخطط قاعدة البيانات
1. في لوحة Supabase، اذهب إلى **SQL Editor**
2. انسخ محتوى ملف `supabase/schema.sql` والصقه
3. اضغط **Run**

### الخطوة 3: إضافة متغيرات البيئة
أنشئ ملف `.env` في جذر المشروع:
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# مدير الموقع (اختياري — بدلاً من الإعداد الأولي)
VITE_ADMIN_EMAIL=admin@nursehub.eg
VITE_ADMIN_PASSWORD_HASH=<أنشئه عبر وحدة تحكم المتصفح>

# Paymob (للدفع الإلكتروني)
VITE_PAYMOB_API_KEY=your_paymob_api_key
VITE_PAYMOB_INTEGRATION_ID=123456
VITE_PAYMOB_IFRAME_ID=789012

# Fawry (للدفع)
VITE_FAWRY_MERCHANT_CODE=your_fawry_merchant_code
VITE_FAWRY_SECURITY_KEY=your_fawry_security_key
```

### الخطوة 4: إنشاء أول مدير
بدلاً من استخدام الإعداد الأولي، يمكنك توليد هاش كلمة المرور:
```javascript
// في وحدة تحكم المتصفح (F12 → Console):
import("/src/lib/auth.ts").then(m =>
  m.hashPassword("YourStrongPassword123").then(console.log)
);
```
انسخ الناتج إلى `VITE_ADMIN_PASSWORD_HASH`.

---

## 💰 إعداد بوابات الدفع

### Paymob
1. سجّل في [Paymob Dashboard](https://dashboard.paymob.com)
2. من **Developers → API Keys** انسخ الـ API Key
3. من **Accept → Integrations** أنشئ تكامل جديد واحصل على Integration ID
4. من **Accept → iFrames** احصل على iFrame ID
5. أضف القيم في `.env`

### Fawry
1. سجّل في [Fawry Developers](https://developer.fawrystaging.com)
2. من لوحة التحكم احصل على Merchant Code و Security Key
3. أضف القيم في `.env`

---

## 🔐 تفعيل المصادقة البيومترية

المصادقة البيومترية (بصمة/وجه) تعمل تلقائياً على الأجهزة الداعمة:
- **iPhone/iPad**: Face ID / Touch ID
- **Android**: بصمة الإصبع
- **Windows**: Windows Hello
- **Mac**: Touch ID

### كيفية الاستخدام:
1. سجّل الدخول بالبريد وكلمة المرور أول مرة
2. اذهب إلى لوحة التحكم ← **المصادقة البيومترية**
3. سجّل جهازك (مثال: "iPhone الخاص بي")
4. في المرة القادمة، سيظهر زر **"تسجيل دخول بيومتري"** في صفحة الدخول

---

## 📱 PWA (تطبيق الويب التقدمي)

الموقع يعمل كتطبيق مثبت:
- **Android**: زر "Install" يظهر تلقائياً في Chrome
- **iOS**: Share → Add to Home Screen
- **Desktop**: أيقونة التثبيت في شريط العنوان

### الميزات:
- ✅ يعمل بدون اتصال (Offline)
- ✅ إشعارات Push
- ✅ أيقونة مخصصة
- ✅ شاشة Splash

---

## 🗂️ هيكل المشروع

```
nursehub-egypt/
├── public/
│   ├── favicon.svg          # شعار الموقع
│   ├── icon-512.png         # أيقونة التطبيق
│   ├── manifest.webmanifest # بيانات PWA
│   └── sw.js                # Service Worker
├── supabase/
│   └── schema.sql           # مخطط قاعدة البيانات الكامل
├── src/
│   ├── components/          # مكوّنات مشتركة
│   ├── pages/              # صفحات الموقع العامة
│   ├── admin/              # لوحة التحكم
│   └── lib/                # طبقة البيانات والخدمات
│       ├── auth.ts          # نظام المصادقة الآمن
│       ├── webauthn.ts      # المصادقة البيومترية
│       ├── paymob.ts        # تكامل Paymob
│       ├── fawry.ts         # تكامل Fawry
│       ├── store.tsx        # إدارة الحالة
│       └── ...
├── .env.example             # نموذج متغيرات البيئة
└── INSTRUCTIONS.md          # هذا الملف
```

---

## 🔄 النشر على Vercel

1. ارفع المشروع إلى GitHub
2. من Vercel: **New Project → Import**
3. أضف متغيرات البيئة في Settings → Environment Variables
4. اضغط **Deploy**

---

## 🛡️ الأمان

- ✅ كلمات المرور مشفّرة بـ PBKDF2 (210,000 تكرار)
- ✅ المصادقة البيومترية (WebAuthn)
- ✅ تحديد محاولات الدخول (Rate Limiting)
- ✅ تحقق CAPTCHA
- ✅ Row Level Security في Supabase
- ✅ تسجيل نشاط شامل

---

## 📊 الإحصائيات الحقيقية

كل الأرقام في لوحة التحكم تأتي من البيانات الفعلية:
- لا توجد إحصائيات وهمية
- عندما لا توجد بيانات، تظهر **"0"** أو **"لا توجد بيانات"**
- تتحدث تلقائياً مع تغيّر البيانات

---

## 🌍 تعدد اللغات

الموقع يدعم العربية والإنجليزية:
- زر **🌍 EN/ع** في شريط التنقل
- تبديل تلقائي RTL ↔ LTR
- المحتوى ثنائي اللغة في المقالات

---

## 📝 ملاحظات هامة

1. **بيانات العرض التجريبي**: المقالات والأدوية والاختبارات معلقة كـ Demo — يمكن حذفها بنقرة واحدة من لوحة التحكم.
2. **البوابات المالية**: معطلة افتراضياً. فعّلها فقط بعد إدخال مفاتيح حقيقية.
3. **البيومتريك**: لا يعمل على المتصفحات القديمة (يحتاج Chrome 67+, Safari 14+, Edge 79+).
