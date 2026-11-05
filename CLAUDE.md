# NurseHub Egypt — قواعد المشروع

## قاعدة Supabase Egress (إلزامية)
الخطة المجانية فيها حد Egress 5GB/شهر، وسبق تجاوزه. قبل إنهاء أي قسم/ميزة جديدة:

1. المحتوى الثابت (أمراض، حالات، أدلة، كتب) يوضع في ملفات JSON/SVG داخل `public/` وليس في Supabase.
2. لو لازم Supabase:
   - ممنوع `select('*')` على جداول كبيرة؛ اطلب الأعمدة المطلوبة فقط.
   - ممنوع تحميل كل الصفوف دفعة واحدة؛ استخدم pagination أو `count` خفيف (`select('id',{count:'exact',head:true})`).
   - حمّل الجدول فقط عند فتح الصفحة التي تحتاجه، لا عند بدء التطبيق (انظر `loadAllFromSupabase(light)` و`useExtraSearchIndex(enabled)`).
3. خزّن بيانات Supabase في IndexedDB عبر `src/lib/remoteCache.ts` (`cacheGet/cacheSet`) بمدة معقولة.
4. الصور والملفات الكبيرة تُخدم من Cloudflare Pages، لا من Supabase Storage.
5. قبل الدمج: افتح الصفحة بـ Playwright وعدّ طلبات Supabase، ثم اكتب في الرد سطرًا: "الطلبات لـ Supabase: كذا، الحجم التقريبي: كذا".

## ملاحظات
- ممنوع حفظ كائن مقال ناقص (بدون content) عبر `syncEntity` لأنه يمسح النص من القاعدة.
- لا تدمج في `main` إلا بعد أن يقول المستخدم "اعمل دمج".
- لا تطلب أو تقبل أي مفاتيح سرية (service role key في Cloudflare فقط).
