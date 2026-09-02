# 🩺 NurseHub Egypt — منصة تعليم التمريض

منصة عربية احترافية متخصصة في تعليم التمريض، مبنية بـ **React + TypeScript + Tailwind CSS + Vite**،
مع لوحة تحكم كاملة، أدوات طبية، دليل أدوية، نظام تحقيق دخل، تحسين SEO شامل، ودعم **Supabase**
كقاعدة بيانات للإنتاج.

> الموقع يعمل **فوراً** بدون أي إعدادات (وضع تجريبي محلي)، وعند إضافة مفاتيح Supabase
> يتحول تلقائياً إلى الاعتماد على قاعدة البيانات السحابية.

---

## 📑 المحتويات

1. [المميزات](#-المميزات)
2. [التقنيات المستخدمة](#-التقنيات-المستخدمة)
3. [المتطلبات](#-المتطلبات)
4. [التشغيل محلياً](#-التشغيل-محلياً)
5. [ربط Supabase](#-ربط-supabase)
6. [النشر على Vercel](#-النشر-على-vercel)
7. [النشر على Netlify](#-النشر-على-netlify)
8. [النسخ الاحتياطي والاستعادة](#-النسخ-الاحتياطي-والاستعادة)
9. [إعداد بوابات الدفع](#-إعداد-بوابات-الدفع)
10. [المصادقة البيومترية](#-تفعيل-المصادقة-البيومترية)
11. [PWA (تطبيق الويب التقدمي)](#-pwa-تطبيق-الويب-التقدمي)
12. [هيكل المشروع](#-هيكل-المشروع)
13. [لوحة التحكم](#-لوحة-التحكم)
14. [رفع الوسائط من الهاتف](#-رفع-الوسائط-من-الهاتف-)
15. [الأمان](#-الأمان)
16. [أسئلة شائعة للمطورين](#-أسئلة-شائعة-للمطورين)

---

## ✨ المميزات

- **واجهة عربية كاملة (RTL)** مع وضع ليلي / نهاري.
- **صفحات**: الرئيسية، المقالات، الملخصات، الأدوية، المهارات، خطط الرعاية، الكتب/PDF، البحث المتقدم، الأدوات، المتجر، تحقيق الدخل، من نحن، اتصل بنا، الأسئلة الشائعة، الخصوصية، الشروط.
- **دليل أدوية** مع بحث، تصفية، ترتيب أبجدي، وصفحة مستقلة لكل دواء.
- **7 أدوات طبية**: BMI، IV Drip، Fluid Balance، Drug Dosage، Pregnancy، GCS، Pediatric Dose + مساعد ذكي.
- **محرر مقالات (WYSIWYG)** يدعم الصور، الفيديو، الجداول، الأكواد، المعادلات، إدراج PDF، وجدول محتويات تلقائي.
- **لوحة تحكم شاملة**: مقالات، أدوية، صفحات، تصنيفات، وسوم، وسائط، تعليقات، نشرة بريدية، منتجات، إعلانات، شركاء (Affiliate)، مستخدمون وصلاحيات، تخصيص الرئيسية بالسحب والإفلات، القائمة، SEO، إعادة التوجيه (301)، سجل النشاط، النسخ الاحتياطي.
- **SEO متقدم**: Meta tags، Open Graph، Twitter Cards، Canonical، JSON-LD (Article / Breadcrumb / Drug / WebSite)، robots.txt، sitemap.xml، توليد Slug تلقائي.
- **الأداء**: Code Splitting، Lazy Loading، ضغط الصور وتحويلها إلى WebP تلقائياً، Skeleton Loading.
- **تجربة استخدام**: إشعارات Toast، صفحات 404/500، انتقالات سلسة.

---

## 🛠 التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| الواجهة | React 19 + TypeScript |
| التنسيق | Tailwind CSS 4 |
| البناء | Vite 7 |
| التوجيه | React Router 7 |
| قاعدة البيانات | Supabase (PostgreSQL + Auth + Storage) |

---

## 📦 المتطلبات

- **Node.js** الإصدار 18 أو أحدث.
- **npm** (أو pnpm / yarn).
- حساب **Supabase** (اختياري — للإنتاج).
- حساب **Vercel** أو **Netlify** (للنشر).

---

## 🚀 التشغيل محلياً

```bash
# 1) تثبيت الحزم
npm install

# 2) تشغيل بيئة التطوير
npm run dev

# 3) بناء نسخة الإنتاج
npm run build

# 4) معاينة نسخة الإنتاج محلياً
npm run preview
```

افتح المتصفح على العنوان الذي يظهر (افتراضياً `http://localhost:5173`).

### الدخول إلى لوحة التحكم (Supabase Auth — مصدر واحد للصلاحية)

**لا يمكن إنشاء حساب المدير من المتصفح إطلاقاً.** الخطوات (تُنفَّذ مرة واحدة فقط):

1. من لوحة تحكم Supabase: **Authentication → Users → Add user**، أنشئ حساب المدير ببريده الحقيقي وكلمة مرور قوية.
2. اضبط `VITE_ADMIN_EMAIL=admin@yourdomain.com` في متغيرات بيئة النشر (Vercel) — بنفس بريد الحساب الذي أنشأته.
3. (لتفعيل لوحة الطلبات تحديداً) اضبط `ADMIN_PASSWORD` سيرفر-فقط بنفس كلمة مرور الحساب، و`ADMIN_SESSION_SECRET` بسرّ عشوائي طويل — راجع `.env.example`.
4. أعد النشر، وسجّل الدخول من `/admin` بنفس البريد وكلمة المرور.

تسجيل الدخول يمر بالكامل عبر `supabase.auth.signInWithPassword` — وهو المصدر الوحيد الذي يقرر من هو المدير (بمطابقة البريد المُتحقَّق منه من Supabase مع `VITE_ADMIN_EMAIL`). لا توجد أي جلسة أو بيانات اعتماد مخزَّنة في localStorage كمصدر ثقة أمني.

> 🔒 محاولات الدخول محدودة (5 محاولات ثم قفل مؤقت 5 دقائق من المتصفح، بالإضافة لحماية Supabase Auth نفسها من جهة الخادم) + تحقق CAPTCHA. لوحة الطلبات (`/admin/orders`) تعمل عبر endpoint سيرفر منفصل بجلسة موقّعة HttpOnly، لأنها تحتاج مفتاح service role لتخطي RLS.

---

## 🔗 ربط Supabase

> **الإنتاج = Supabase حصراً.** عند وجود مفاتيح Supabase، تُخزَّن *كل* البيانات
> (المقالات، الوسائط، الملفات، المستخدمون، التعليقات، الإعدادات، المنتجات، الإعلانات،
> الأفلييت...) في Supabase فقط — قاعدة بيانات PostgreSQL + Supabase Storage.
> **لا يُستخدم localStorage لأي بيانات إنتاجية** (فقط لتفضيلات الواجهة مثل الوضع الليلي
> وترتيب الصفحة الرئيسية).
>
> الوضع المحلي (localStorage) يعمل **فقط للمعاينة** عند غياب مفاتيح Supabase.

### آلية العمل

- عند الإقلاع: يجلب التطبيق كل الجداول من Supabase (`src/lib/dataApi.ts → loadAllFromSupabase`).
- عند أي تعديل: يُزامَن التغيير فوراً مع الجدول المقابل في Supabase (upsert/delete).
- رفع الملفات: يذهب مباشرةً إلى **Supabase Storage** (bucket باسم `media`) ويُعاد رابط عام —
  **لا حاجة لإدخال أي روابط يدوياً**.

التطبيق مُهيأ للعمل مع Supabase عبر متغيرات البيئة.

### 1) إنشاء مشروع

- ادخل إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً.
- من **Project Settings → API** انسخ:
  - `Project URL`
  - `anon public key`

### 2) إضافة متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع (انسخه من `.env.example`):

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

عند وجود هذه المفاتيح:
- `isSupabaseEnabled` تصبح `true`.
- يُنشأ عميل Supabase تلقائياً في `src/lib/supabase.ts`.
- يظهر في لوحة المعلومات أن الـ Backend = `supabase`.

### 3) إنشاء الجداول

نفّذ محتوى ملف `supabase/schema.sql` داخل **SQL Editor** في Supabase. يُنشئ هذا:
- جداول: `articles`, `comments`, `media`, `products`, `profiles`, `pages`, `categories`,
  `tags`, `subscribers`, `ads`, `affiliates`, `redirects`, `activity_log`, `ratings`, `drugs`, `site_settings`.
- سياسات **Row Level Security (RLS)**.
- صلاحيات القراءة العامة للمحتوى المنشور.

### 4) التخزين (Storage)

ملف `supabase/schema.sql` يُنشئ تلقائياً bucket باسم `media` (عام) مع سياسات الرفع/القراءة.
إن أردت إنشاءه يدوياً: **Storage → New bucket → الاسم `media` → Public**.

- الصور تُضغط وتُحوَّل إلى **WebP** في المتصفح قبل الرفع.
- الحد الأقصى: 200MB لكل ملف.
- الأنواع المدعومة: صور، فيديو، PDF، Word، Excel، PowerPoint.
- أسماء الجداول معرّفة مركزياً في `src/lib/supabase.ts` ضمن الكائن `TABLES`.

### 5) إدخال بيانات البداية (اختياري)

بعد تنفيذ المخطط، ادخل لوحة التحكم → **النسخ والاستعادة** → زر
**«إدخال بيانات البداية إلى Supabase»** لتعبئة الجداول بمحتوى تجريبي، أو ابدأ من الصفر.

---

## ▲ النشر على Vercel

1. ارفع المشروع إلى مستودع GitHub.
2. من Vercel: **New Project → Import** المستودع.
3. الإعدادات (تُكتشف تلقائياً):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. أضف متغيرات البيئة في **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. اضغط **Deploy**.

### دعم التوجيه (SPA)

أضف ملف `vercel.json` التالي (موجود في المشروع) لإعادة كل المسارات إلى `index.html`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🌐 النشر على Netlify

1. **Add new site → Import** من Git.
2. الإعدادات:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. أضف متغيرات البيئة نفسها.
4. ملف `netlify.toml` (موجود) يضمن إعادة توجيه مسارات الـ SPA.

---

## 💾 النسخ الاحتياطي والاستعادة

من لوحة التحكم: **النسخ والاستعادة** (`/admin/backup`):

- **تنزيل نسخة احتياطية**: يصدّر كل البيانات كملف `JSON`.
- **استيراد**: ارفع ملف `JSON` أو الصقه لاستعادة البيانات.
- **إعادة التعيين**: يعيد البيانات للوضع الافتراضي (لا يمكن التراجع).

> في الإنتاج مع Supabase، استخدم أيضاً **Database Backups** المدمجة في لوحة Supabase
> (Daily backups) للحماية الكاملة.

تصدير المشتركين بصيغة CSV متاح من **النشرة البريدية** (`/admin/subscribers`).

---

## 💰 إعداد بوابات الدفع

### Paymob
1. سجّل في [Paymob Dashboard](https://dashboard.paymob.com)
2. من **Developers → API Keys** انسخ الـ API Key
3. من **Accept → Integrations** أنشئ تكامل جديد واحصل على Integration ID
4. من **Accept → iFrames** احصل على iFrame ID
5. أضف القيم في `.env`:
   ```bash
   VITE_PAYMOB_API_KEY=your_paymob_api_key
   VITE_PAYMOB_INTEGRATION_ID=123456
   VITE_PAYMOB_IFRAME_ID=789012
   ```

### Fawry
1. سجّل في [Fawry Developers](https://developer.fawrystaging.com)
2. من لوحة التحكم احصل على Merchant Code و Security Key
3. أضف القيم في `.env`:
   ```bash
   VITE_FAWRY_MERCHANT_CODE=your_fawry_merchant_code
   VITE_FAWRY_SECURITY_KEY=your_fawry_security_key
   ```

> بوابات الدفع معطّلة افتراضياً — لا تُفعَّل إلا بعد إدخال مفاتيح حقيقية.

---

## 🔐 تفعيل المصادقة البيومترية

المصادقة البيومترية (بصمة/وجه) عبر WebAuthn تعمل تلقائياً على الأجهزة الداعمة:
- **iPhone/iPad**: Face ID / Touch ID
- **Android**: بصمة الإصبع
- **Windows**: Windows Hello
- **Mac**: Touch ID

### كيفية الاستخدام
1. سجّل الدخول بالبريد وكلمة المرور أول مرة.
2. اذهب إلى لوحة التحكم ← **المصادقة البيومترية**.
3. سجّل جهازك (مثال: "iPhone الخاص بي").
4. في المرة القادمة، سيظهر زر **"تسجيل دخول بيومتري"** في صفحة الدخول.

> لا تعمل على المتصفحات القديمة (يحتاج Chrome 67+, Safari 14+, Edge 79+).

---

## 📱 PWA (تطبيق الويب التقدمي)

الموقع يعمل كتطبيق مثبت:
- **Android**: زر "Install" يظهر تلقائياً في Chrome.
- **iOS**: Share → Add to Home Screen.
- **Desktop**: أيقونة التثبيت في شريط العنوان.

### الميزات
- ✅ يعمل بدون اتصال (Offline)
- ✅ إشعارات Push
- ✅ أيقونة مخصصة
- ✅ شاشة Splash

---

## 🗂 هيكل المشروع

```
nursehub-egypt/
├── public/
│   ├── robots.txt              # توجيهات محركات البحث
│   └── sitemap.xml             # خريطة الموقع
├── supabase/
│   └── schema.sql              # مخطط قاعدة البيانات + RLS
├── src/
│   ├── components/             # مكونات مشتركة
│   │   ├── Navbar.tsx          # الشريط العلوي + بحث ذكي
│   │   ├── Footer.tsx
│   │   ├── PublicLayout.tsx    # تخطيط الصفحات العامة + زر العودة للأعلى
│   │   ├── SmartSearch.tsx     # بحث مع اقتراحات فورية
│   │   ├── Newsletter.tsx
│   │   ├── Toast.tsx           # نظام الإشعارات
│   │   ├── Skeleton.tsx        # هياكل التحميل
│   │   ├── ErrorBoundary.tsx   # صفحة 500
│   │   └── common.tsx          # بطاقات، Breadcrumbs، AdSlot
│   ├── pages/                  # صفحات الموقع العامة
│   │   ├── Home.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── ArticlePage.tsx     # مقال + تقييم + مشاركة + SEO
│   │   ├── DrugsPage.tsx / DrugPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── ToolsPage.tsx       # 7 حاسبات + مساعد ذكي
│   │   ├── StorePage.tsx
│   │   ├── MonetizationPage.tsx
│   │   ├── StaticPages.tsx     # من نحن، اتصل بنا، FAQ، الخصوصية، الشروط
│   │   └── NotFound.tsx        # 404 + 500
│   ├── admin/                  # لوحة التحكم
│   │   ├── AdminLayout.tsx     # القائمة الجانبية
│   │   ├── Login.tsx           # دخول + CAPTCHA
│   │   ├── Dashboard.tsx
│   │   ├── ArticlesAdmin.tsx
│   │   ├── Editor.tsx          # محرر المقالات (يدعم رفع الكاميرا)
│   │   ├── MediaAdmin.tsx      # مكتبة وسائط + مجلدات + رفع من الهاتف
│   │   ├── DrugsAdmin.tsx
│   │   ├── SimpleAdmins.tsx    # تعليقات، منتجات، مستخدمون
│   │   ├── AdminExtras.tsx     # صفحات، تصنيفات، وسوم، مشتركون، إعلانات، شركاء، redirects، نشاط
│   │   └── Builders.tsx        # تخصيص الرئيسية، القائمة، SEO، النسخ الاحتياطي
│   ├── lib/
│   │   ├── types.ts            # كل أنواع TypeScript
│   │   ├── store.tsx           # حالة التطبيق + سجل النشاط
│   │   ├── seed.ts / seed2.ts  # بيانات أولية
│   │   ├── supabase.ts         # عميل Supabase + أسماء الجداول
│   │   ├── seo.ts              # hook لإدارة الـ SEO و JSON-LD
│   │   └── image.ts            # ضغط الصور + WebP
│   ├── App.tsx                 # التوجيه (Routing) + Lazy Loading
│   ├── main.tsx
│   └── index.css               # أنماط عامة + RTL + الوضع الليلي
├── index.html
├── vercel.json                 # إعادة توجيه SPA
├── netlify.toml                # إعدادات Netlify
├── .env.example                # نموذج متغيرات البيئة
└── package.json
```

---

## 🎛 لوحة التحكم

| المسار | الوظيفة |
|--------|----------|
| `/admin` | لوحة المعلومات والإحصائيات |
| `/admin/articles` | إدارة المقالات (إنشاء/تعديل/حذف/جدولة) |
| `/admin/editor` | محرر المقالات |
| `/admin/drugs` | إدارة الأدوية |
| `/admin/pages` | إدارة الصفحات |
| `/admin/categories` · `/admin/tags` | التصنيفات والوسوم |
| `/admin/media` | مكتبة الوسائط (رفع من الهاتف/الكاميرا) |
| `/admin/comments` | إدارة التعليقات |
| `/admin/subscribers` | النشرة البريدية + تصدير CSV |
| `/admin/products` · `/admin/ads` · `/admin/affiliates` | تحقيق الدخل |
| `/admin/users` | المستخدمون والصلاحيات (Admin/Editor/Author) |
| `/admin/home-builder` | تخصيص الرئيسية بالسحب والإفلات |
| `/admin/menu` · `/admin/seo` | القائمة وإعدادات SEO |
| `/admin/redirects` | إعادة التوجيه 301/302 |
| `/admin/activity` | سجل النشاط |
| `/admin/backup` | النسخ الاحتياطي والاستعادة |

---

## 📱 رفع الوسائط من الهاتف 

تم تفعيل رفع الصور والفيديو مباشرةً من الهاتف المحمول في موضعين:

### 1) مكتبة الوسائط (`/admin/media`)
ثلاثة أزرار مخصّصة للجوال:
- **📷 التقاط صورة** — يفتح كاميرا الهاتف مباشرةً.
- **🎥 تصوير فيديو** — يفتح كاميرا الفيديو مباشرةً.
- **🖼️ من المعرض** — لاختيار صور/فيديوهات موجودة.

### 2) محرر المقالات (`/admin/editor`)
أزرار في شريط الأدوات:
- **🖼️ رفع صورة** من الجهاز.
- **📷 التقاط صورة** بالكاميرا (يظهر على الهاتف).
- **🎥 رفع فيديو** من الجهاز/الكاميرا.
- **🌐 صورة عبر رابط** و **🎬 فيديو YouTube**.

> الصور تُضغط وتُحوّل تلقائياً إلى صيغة **WebP** قبل الإدراج لتحسين سرعة الموقع.
> الحد الأقصى لحجم الملف: **200MB**.

التقنية المستخدمة: خاصية `capture="environment"` على عناصر `<input type="file">`،
وهي مدعومة في متصفحات الهواتف (Safari iOS، Chrome Android).

---

## 🔒 الأمان

- **تسجيل دخول** للوحة التحكم مع **CAPTCHA** حسابي.
- **صلاحيات**: Admin / Editor / Author.
- **سجل نشاط** لكل العمليات الإدارية.
- في الإنتاج: استبدل المصادقة المحلية بـ **Supabase Auth** وفعّل **Row Level Security (RLS)**
  (المخطط جاهز في `supabase/schema.sql`).
- لحماية XSS: محتوى المقالات يُعرض عبر HTML موثوق من المحررين فقط — يُنصح بإضافة
  مكتبة تنقية مثل `DOMPurify` قبل العرض إذا سمحت بمحتوى من مستخدمين غير موثوقين.

---

## ❓ أسئلة شائعة للمطورين

**س: كيف أضيف صفحة جديدة؟**
أنشئ مكوناً في `src/pages/`، ثم أضف مساراً في `src/App.tsx`، ويمكنك إضافته للقائمة من `/admin/menu`.

**س: أين أغيّر الألوان والهوية؟**
الألوان الأساسية (سماوي/أخضر) في أصناف Tailwind داخل المكونات، والأنماط العامة في `src/index.css`.

**س: كيف أربط دفع حقيقي للمتجر؟**
استبدل أزرار «شراء الآن» في `StorePage.tsx` بتكامل Stripe / Paymob / Fawry.

**س: كيف أنقل البيانات من المحلي إلى Supabase؟**
صدّر نسخة JSON من `/admin/backup`، ثم اكتب سكربت إدخال بسيط باستخدام عميل Supabase
لنقل المصفوفات إلى الجداول المقابلة.

---

## 📄 الرخصة

هذا المشروع مملوك لـ **NurseHub Egypt**. يُمنع إعادة التوزيع دون إذن.

صُمم بحب لطلاب التمريض 💙
