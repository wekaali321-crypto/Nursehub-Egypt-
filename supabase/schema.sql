-- ============================================================
-- NurseHub Egypt — Supabase Complete Schema (Enterprise)
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (Users)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  name text not null,
  email text unique not null,
  role text not null default 'viewer' check (role in ('superadmin','admin','editor','author','viewer')),
  avatar_url text,
  bio text,
  language text default 'ar',
  theme text default 'light',
  created_at timestamptz default now(),
  last_login timestamptz
);

-- Biometrics (WebAuthn)
create table if not exists user_biometrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  credential_id bytea not null,
  credential_public_key bytea not null,
  device_name text,
  last_used timestamptz default now(),
  created_at timestamptz default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  parent_id uuid references categories(id),
  order_idx int default 0,
  visible boolean default true
);

-- Tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

-- Articles
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  slug text unique not null,
  category text not null,
  excerpt text,
  excerpt_en text,
  content text,
  content_en text,
  cover text,
  tags text[] default '{}',
  author text,
  status text not null default 'draft' check (status in ('published','draft','scheduled','private','archived')),
  publish_date date,
  updated_date date,
  views int default 0,
  featured boolean default false,
  video_url text,
  attachments jsonb default '[]',
  meta_title text,
  meta_description text,
  rating numeric default 0,
  rating_count int default 0,
  medically_reviewed boolean default false,
  reviewer text,
  created_at timestamptz default now()
);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references profiles(id),
  name text not null,
  text text not null,
  status text not null default 'pending' check (status in ('approved','pending','spam')),
  created_at timestamptz default now()
);

-- Ratings
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references profiles(id),
  value int not null check (value between 1 and 5),
  created_at timestamptz default now()
);

-- Media
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  url text not null,
  size text,
  folder text default 'f-root',
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Drugs
create table if not exists drugs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  drug_class text,
  category text,
  dose text,
  indications text,
  side_effects text,
  nursing_considerations text,
  contraindications text,
  storage text,
  references text,
  slug text unique not null
);

-- Pages
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text,
  status text not null default 'published'
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  type text not null check (type in ('pdf','course','subscription')),
  price numeric default 0,
  old_price numeric,
  cover text,
  description text,
  sales int default 0,
  slug text,
  gallery text[],
  preview_pdf text,
  full_content text,
  author text,
  pages_count int
);

-- Payment Gateways (Admin configured)
create table if not exists payment_gateways (
  id text primary key, -- 'paymob','stripe','paypal','fawry'
  name text not null,
  region text,
  enabled boolean default false,
  mode text default 'sandbox',
  api_key text,
  secret_key text,
  webhook_secret text,
  connected boolean default false
);

-- Coupons
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text check (type in ('percent','fixed')),
  value numeric,
  max_uses int,
  used_count int default 0,
  min_purchase numeric default 0,
  expires date,
  active boolean default true
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  user_id uuid references profiles(id),
  customer_name text not null,
  email text not null,
  phone text,
  items jsonb not null,
  subtotal numeric,
  discount numeric default 0,
  tax numeric default 0,
  total numeric,
  coupon_code text,
  gateway text,
  payment_status text check (payment_status in ('pending','paid','failed','refunded')),
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Affiliates
create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text,
  url text,
  network text,
  commission text,
  clicks int default 0,
  sales int default 0,
  earnings numeric default 0
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  target text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Subscribers
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- Reading Progress (for books/articles)
create table if not exists reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content_id text not null, -- article id, product id, etc
  content_type text not null, -- 'article','book','course'
  current_page int default 1,
  total_pages int,
  completed boolean default false,
  last_opened timestamptz,
  reading_time_seconds int default 0,
  created_at timestamptz default now(),
  unique(user_id, content_id, content_type)
);

-- Notes & Highlights
create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content_id text not null,
  content_type text not null,
  type text check (type in ('highlight','note','bookmark','drawing')),
  page_num int,
  text_snippet text,
  note text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYMENT-SPECIFIC TABLES
-- ============================================================

create table if not exists paymob_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  paymob_order_id text,
  paymob_transaction_id text,
  amount_cents int,
  currency text default 'EGP',
  status text check (status in ('pending','success','failed')),
  response_data jsonb,
  created_at timestamptz default now()
);

create table if not exists fawry_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  fawry_ref_number text,
  customer_email text,
  customer_phone text,
  amount numeric,
  status text check (status in ('pending','paid','expired','cancelled')),
  payment_date timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Payment Gateways
insert into payment_gateways (id, name, region, enabled, mode) values
('paymob', 'Paymob', 'eg', false, 'sandbox'),
('fawry', 'Fawry', 'eg', false, 'sandbox'),
('stripe', 'Stripe', 'intl', false, 'sandbox'),
('paypal', 'PayPal', 'intl', false, 'sandbox')
on conflict (id) do nothing;

-- Default Admin (superadmin)
insert into profiles (name, email, role) values
('المدير العام', 'admin@nursehub.eg', 'superadmin')
on conflict (email) do nothing;

-- Default Categories
insert into categories (name, slug, icon, order_idx) values
('عناية مركزة', 'icu', '🏥', 0),
('طوارئ', 'er', '🚑', 1),
('أطفال', 'pediatrics', '👶', 2),
('ولادة', 'obstetrics', '🤰', 3),
('جراحة', 'surgical', '🔪', 4),
('أدوية', 'pharmacology', '💊', 5),
('تمريض نفسي', 'psychiatry', '🧠', 6),
('مهارات سريرية', 'clinical-skills', '🩺', 7),
('خطط رعاية', 'care-plans', '📋', 8),
('أدلة أدوية', 'drug-guides', '💉', 9)
on conflict (slug) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table user_biometrics enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table comments enable row level security;
alter table ratings enable row level security;
alter table media enable row level security;
alter table drugs enable row level security;
alter table pages enable row level security;
alter table products enable row level security;
alter table payment_gateways enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table affiliates enable row level security;
alter table activity_log enable row level security;
alter table subscribers enable row level security;
alter table reading_progress enable row level security;
alter table annotations enable row level security;
alter table paymob_transactions enable row level security;
alter table fawry_payments enable row level security;

-- Public read access for published content
create policy "public read published articles" on articles
  for select using (status = 'published');

create policy "public read categories" on categories
  for select using (true);

create policy "public read tags" on tags
  for select using (true);

create policy "public read drugs" on drugs
  for select using (true);

create policy "public read pages" on pages
  for select using (status = 'published');

create policy "public read products" on products
  for select using (true);

create policy "public read approved comments" on comments
  for select using (status = 'approved');

-- Authenticated users full access
create policy "authenticated full articles" on articles
  for all to authenticated using (true) with check (true);

create policy "authenticated full comments" on comments
  for all to authenticated using (true) with check (true);

create policy "authenticated full orders" on orders
  for all to authenticated using (true) with check (true);

create policy "authenticated full reading_progress" on reading_progress
  for all to authenticated using (true) with check (true);

create policy "authenticated full annotations" on annotations
  for all to authenticated using (true) with check (true);

-- Biometrics: user can only access their own
create policy "user own biometrics" on user_biometrics
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update reading progress timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger annotations_updated_at
  before update on annotations
  for each row
  execute function update_updated_at();

-- Increment coupon usage on order creation
create or replace function increment_coupon_usage()
returns trigger as $$
begin
  if new.coupon_code is not null then
    update coupons set used_count = used_count + 1
    where code = new.coupon_code and used_count < max_uses;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger coupon_usage_trigger
  after insert on orders
  for each row
  execute function increment_coupon_usage();

-- ============================================================
-- STORAGE BUCKETS (Media)
-- ============================================================

-- Create media bucket (public)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "authenticated upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "authenticated update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "authenticated delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
