-- ============================================================
-- NurseHub Egypt — تم تنفيذه فعليًا على مشروع Supabase بتاعك
-- (لقينا إن جدولي products و orders أصلاً موجودين من شغل سابق،
-- فمكنش محتاج ننشئهم تاني — بس صلّحنا مشكلة أمان خطيرة فيهم)
-- ============================================================

-- المشكلة اللي كانت موجودة:
-- 1) orders: RLS كانت متقفلة (disabled) خالص يعني أي حد معاه الـ anon key
--    (اللي بيبقى ظاهر في كود الفرونت end أصلاً) يقدر يقرا/يعدّل/يمسح
--    كل الطلبات (أسماء وأرقام عملاء).
-- 2) products: كان فيه policy اسمها public_all_products بتسمح لأي حد
--    بره الموقع يعمل SELECT/INSERT/UPDATE/DELETE على المنتجات كلها.

-- الحل اللي اتنفذ:
drop policy if exists "public_all_products" on products;

create policy "public_read_products"
on products for select
to public
using (true);

alter table orders enable row level security;

create policy "public_insert_pending_orders"
on orders for insert
to public
with check (status = 'pending');

-- النتيجة:
-- - أي زائر لسه يقدر يشوف المنتجات (عشان يظهروا في المتجر) وينشئ طلب جديد بس.
-- - محدش بره الموقع يقدر يقرا/يعدّل الطلبات أو يعدّل/يمسح المنتجات إلا
--   عن طريق service_role key (اللي بتستخدمه لوحة التحكم فقط، من السيرفر).

-- عملنا كمان bucket خاص جديد اسمه "pdf-store" (private) في Storage
-- عشان ملفات الـ PDF المدفوعة تتخزن فيه بدل ما تكون في bucket "media"
-- العام اللي عندك أصلاً.
