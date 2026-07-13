-- ═══════════════════════════════════════════════════════════════════════════════
-- NurseHub Egypt — Production Database Schema v2.0
-- ═══════════════════════════════════════════════════════════════════════════════
-- Author: RN. Ali Ashour
-- Date: 2026
-- Description: Complete production schema for nursing education platform
-- 40+ tables | 15 modules | Full RLS | Storage policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. UTILITY FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Soft delete helper
create or replace function soft_delete()
returns trigger as $$
begin
  new.deleted_at = now();
  return new;
end;
$$ language plpgsql;

-- Audit log helper
create or replace function log_audit()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_id, action, entity_type, entity_id, new_values, ip_address)
    values (auth.uid(), 'create', TG_TABLE_NAME, new.id, to_jsonb(new), current_setting('request.headers', true)::json->>'x-forwarded-for');
  elsif TG_OP = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      insert into audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
      values (auth.uid(), 'delete', TG_TABLE_NAME, new.id, to_jsonb(old), to_jsonb(new));
    elsif old.* is distinct from new.* then
      insert into audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
      values (auth.uid(), 'update', TG_TABLE_NAME, new.id, to_jsonb(old), to_jsonb(new));
    end if;
  elsif TG_OP = 'DELETE' then
    insert into audit_logs (actor_id, action, entity_type, entity_id, old_values)
    values (auth.uid(), 'delete', TG_TABLE_NAME, old.id, to_jsonb(old));
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. AUTHENTICATION & ROLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1.1 Roles table
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name_ar text not null,
  display_name_en text not null,
  description text,
  level int not null default 0,
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_roles_name on roles(name);
create index idx_roles_level on roles(level);

-- Insert default roles
insert into roles (name, display_name_ar, display_name_en, level, permissions) values
  ('super_admin', 'المدير العام', 'Super Admin', 100, '["*"]'::jsonb),
  ('admin', 'مدير', 'Admin', 90, '["manage_content","manage_users","manage_payments","manage_settings","view_analytics","manage_ai","manage_affiliates"]'::jsonb),
  ('moderator', 'مشرف محتوى', 'Moderator', 70, '["moderate_content","view_reports","hide_comments"]'::jsonb),
  ('editor', 'محرر', 'Editor', 60, '["edit_content","publish_articles","manage_books","manage_quizzes"]'::jsonb),
  ('instructor', 'مدرس', 'Instructor', 50, '["create_courses","create_quizzes","view_students","grade_assignments"]'::jsonb),
  ('author', 'كاتب', 'Author', 40, '["create_articles","upload_media","respond_comments"]'::jsonb),
  ('premium_student', 'طالب مميز', 'Premium Student', 20, '["view_premium","download_all","take_courses","ai_assistant","certificates"]'::jsonb),
  ('student', 'طالب', 'Student', 10, '["view_free","download_limited","take_quizzes","bookmark","comment","rate"]'::jsonb),
  ('guest', 'زائر', 'Guest', 1, '["view_public_only"]'::jsonb)
on conflict (name) do nothing;

-- 1.2 Profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null,
  full_name_en text,
  avatar_url text,
  bio text,
  bio_en text,
  locale text not null default 'ar' check (locale in ('ar','en')),
  timezone text default 'Africa/Cairo',
  country text,
  university text,
  specialty text,
  graduation_year int,
  experience_years int default 0,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  suspension_reason text,
  last_seen_at timestamptz,
  email_notifications boolean default true,
  push_notifications boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_profiles_username on profiles(username) where deleted_at is null;
create index idx_profiles_locale on profiles(locale);
create index idx_profiles_specialty on profiles(specialty) where deleted_at is null;
create index idx_profiles_full_name_trgm on profiles using gin (full_name gin_trgm_ops);

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
for each row execute function update_updated_at_column();

drop trigger if exists trg_profiles_audit on profiles;
create trigger trg_profiles_audit after insert or update or delete on profiles
for each row execute function log_audit();

-- 1.3 User Roles (M:M)
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  unique(user_id, role_id)
);

create index idx_user_roles_user on user_roles(user_id) where is_active = true;
create index idx_user_roles_role on user_roles(role_id) where is_active = true;
create index idx_user_roles_expires on user_roles(expires_at) where expires_at is not null;

-- Helper: Check if user has a specific role
create or replace function has_role(p_user_id uuid, p_role_name text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = p_user_id and r.name = p_role_name
    and ur.is_active = true
    and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

-- Helper: Check if current user is admin
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select has_role(auth.uid(), 'super_admin') or has_role(auth.uid(), 'admin');
$$;

-- Helper: Check if current user is instructor or above
create or replace function can_publish()
returns boolean language sql stable security definer set search_path = public
as $$
  select has_role(auth.uid(), 'super_admin') or has_role(auth.uid(), 'admin') 
    or has_role(auth.uid(), 'editor') or has_role(auth.uid(), 'instructor');
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. EDUCATIONAL CONTENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2.1 Categories (self-referencing tree)
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  name_en text not null,
  slug text unique not null,
  description text,
  description_en text,
  icon text,
  color text default '#0ea5e9',
  image_url text,
  display_order int not null default 0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  meta_title text,
  meta_description text,
  view_count bigint not null default 0,
  article_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_categories_parent on categories(parent_id) where deleted_at is null;
create index idx_categories_slug on categories(slug) where deleted_at is null;
create index idx_categories_featured on categories(is_featured) where is_featured = true and deleted_at is null;
create index idx_categories_order on categories(display_order) where deleted_at is null;

drop trigger if exists trg_categories_updated on categories;
create trigger trg_categories_updated before update on categories
for each row execute function update_updated_at_column();

-- 2.2 Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  color text default '#94a3b8',
  usage_count int not null default 0,
  is_trending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tags_slug on tags(slug);
create index idx_tags_usage on tags(usage_count desc);
create index idx_tags_name_trgm on tags using gin (name gin_trgm_ops);

-- 2.3 Articles
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  slug text unique not null,
  excerpt text,
  excerpt_en text,
  content text not null,
  content_en text,
  cover_image text,
  video_url text,
  audio_url text,
  pdf_url text,
  reading_time_minutes int default 1,
  word_count int default 0,
  category_id uuid references categories(id) on delete set null,
  author_id uuid references profiles(id) on delete set null,
  instructor_id uuid references profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  difficulty_level text default 'intermediate' check (difficulty_level in ('beginner','intermediate','advanced','expert')),
  primary_language text default 'bilingual' check (primary_language in ('ar','en','bilingual')),
  view_count bigint not null default 0,
  unique_view_count int not null default 0,
  like_count int not null default 0,
  share_count int not null default 0,
  comment_count int not null default 0,
  bookmark_count int not null default 0,
  reading_count int not null default 0,
  is_featured boolean not null default false,
  is_premium boolean not null default false,
  is_medical_reviewed boolean not null default false,
  medical_reviewer_id uuid references profiles(id),
  medical_review_date timestamptz,
  medical_review_status text check (medical_review_status in ('pending','approved','rejected','not_required')),
  published_at timestamptz,
  scheduled_at timestamptz,
  last_revised_at timestamptz,
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_image text,
  og_title text,
  og_description text,
  canonical_url text,
  schema_type text default 'Article',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_articles_slug on articles(slug) where deleted_at is null;
create index idx_articles_status on articles(status) where deleted_at is null;
create index idx_articles_category on articles(category_id) where deleted_at is null;
create index idx_articles_author on articles(author_id) where deleted_at is null;
create index idx_articles_published on articles(published_at desc) where status = 'published';
create index idx_articles_featured on articles(is_featured) where is_featured = true and deleted_at is null;
create index idx_articles_scheduled on articles(scheduled_at) where status = 'scheduled';
create index idx_articles_title_trgm on articles using gin (title gin_trgm_ops);
create index idx_articles_tags on articles using gin (tags);

drop trigger if exists trg_articles_updated on articles;
create trigger trg_articles_updated before update on articles
for each row execute function update_updated_at_column();

drop trigger if exists trg_articles_audit on articles;
create trigger trg_articles_audit after insert or update or delete on articles
for each row execute function log_audit();

-- 2.4 Article Versions (History)
create table article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  version_number int not null,
  title text not null,
  content text not null,
  change_summary text,
  editor_id uuid references profiles(id),
  diff jsonb,
  is_current boolean not null default false,
  is_restore_point boolean not null default false,
  created_at timestamptz not null default now(),
  unique(article_id, version_number)
);

create index idx_article_versions_article on article_versions(article_id);
create index idx_article_versions_current on article_versions(is_current) where is_current = true;
create index idx_article_versions_created on article_versions(created_at desc);

-- 2.5 Article Sections (Table of Contents)
create table article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  section_title text not null,
  section_title_en text,
  section_content text,
  section_level int not null default 2 check (section_level between 1 and 6),
  section_order int not null default 0,
  section_anchor text,
  section_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_article_sections_article on article_sections(article_id, section_order);

-- 2.6 Article Images
create table article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  media_id uuid, -- references media_files(id)
  image_url text not null,
  image_alt text,
  image_caption text,
  image_credit text,
  image_position int not null default 0,
  is_cover boolean not null default false,
  is_inline boolean not null default false,
  is_infographic boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_article_images_article on article_images(article_id, image_position);

-- 2.7 Article Tags (M:M)
create table article_tags (
  article_id uuid not null references articles(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, tag_id)
);

create index idx_article_tags_tag on article_tags(tag_id);

-- 2.8 Article Related (Self M:M)
create table article_related (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  related_article_id uuid not null references articles(id) on delete cascade,
  relation_type text default 'related' check (relation_type in ('related','similar','prerequisite','next','series')),
  relevance_score int default 50 check (relevance_score between 0 and 100),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(article_id, related_article_id),
  check (article_id != related_article_id)
);

create index idx_article_related_article on article_related(article_id, display_order);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. NURSING RESOURCES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3.1 Books
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  slug text unique not null,
  subtitle text,
  description text,
  description_en text,
  cover_image text,
  author_id uuid references profiles(id) on delete set null,
  publisher text,
  isbn text,
  edition_number int default 1,
  pages_count int,
  language text default 'bilingual' check (language in ('ar','en','bilingual')),
  publication_year int,
  category_id uuid references categories(id),
  specialty text,
  is_free boolean not null default false,
  price numeric(10,2) default 0,
  original_price numeric(10,2),
  discount_percentage int default 0 check (discount_percentage between 0 and 100),
  preview_pages int default 0,
  full_pdf_url text,
  pdf_storage_path text,
  file_size_bytes bigint,
  download_count int not null default 0,
  purchase_count int not null default 0,
  view_count bigint not null default 0,
  rating_avg numeric(3,2) default 0,
  rating_count int not null default 0,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_visible boolean not null default true,
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_books_slug on books(slug) where deleted_at is null;
create index idx_books_category on books(category_id) where deleted_at is null;
create index idx_books_featured on books(is_featured) where is_featured = true and deleted_at is null;
create index idx_books_free on books(is_free) where is_free = true and deleted_at is null;
create index idx_books_title_trgm on books using gin (title gin_trgm_ops);

-- 3.2 Book Versions
create table book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  version_label text not null,
  version_number int not null,
  release_date date,
  change_log text,
  pdf_url text,
  pdf_storage_path text,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique(book_id, version_number)
);

create index idx_book_versions_book on book_versions(book_id);
create index idx_book_versions_current on book_versions(is_current) where is_current = true;

-- 3.3 Book Downloads (Tracking)
create table book_downloads (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  order_id uuid,
  version_id uuid references book_versions(id),
  download_token text unique,
  download_count int not null default 1,
  max_downloads int default 3,
  ip_address inet,
  user_agent text,
  expires_at timestamptz,
  is_revoked boolean not null default false,
  revoked_reason text,
  first_downloaded_at timestamptz,
  last_downloaded_at timestamptz default now()
);

create index idx_book_downloads_user on book_downloads(user_id);
create index idx_book_downloads_book on book_downloads(book_id);
create index idx_book_downloads_token on book_downloads(download_token);

-- 3.4 PDF Files (Standalone)
create table pdf_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  storage_path text,
  file_size_bytes bigint,
  pages_count int,
  language text default 'ar',
  subject text,
  category_id uuid references categories(id),
  is_free boolean not null default true,
  price numeric(10,2) default 0,
  download_count int not null default 0,
  view_count int not null default 0,
  is_visible boolean not null default true,
  cover_image text,
  tags text[] default '{}',
  created_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_pdf_files_category on pdf_files(category_id) where deleted_at is null;

-- 3.5 Nursing Care Plans
create table nursing_care_plans (
  id uuid primary key default gen_random_uuid(),
  diagnosis text not null,
  diagnosis_en text,
  nanda_code text,
  domain text,
  classification text,
  related_diagnoses text[] default '{}',
  patient_population text,
  age_group text,
  gender text,
  assessment_data jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  nursing_interventions jsonb not null default '[]'::jsonb,
  rationale text,
  evaluation_criteria jsonb not null default '[]'::jsonb,
  expected_outcomes text,
  references text[] default '{}',
  evidence_level text check (evidence_level in ('Level I','Level II','Level III','Level IV','Level V','Level VI','Level VII')),
  is_reviewed boolean not null default false,
  reviewer_id uuid references profiles(id),
  published_by uuid references profiles(id),
  published_at timestamptz,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_care_plans_nanda on nursing_care_plans(nanda_code);
create index idx_care_plans_domain on nursing_care_plans(domain);

-- 3.6 Drug Guides
create table drug_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null,
  slug text unique not null,
  generic_name text,
  trade_names text[] default '{}',
  drug_class text,
  atc_code text,
  mechanism_of_action text,
  pharmacokinetics text,
  indications jsonb not null default '[]'::jsonb,
  contraindications jsonb not null default '[]'::jsonb,
  dosage_forms jsonb not null default '[]'::jsonb,
  drug_interactions jsonb not null default '[]'::jsonb,
  adverse_effects jsonb not null default '[]'::jsonb,
  nursing_considerations jsonb not null default '[]'::jsonb,
  patient_education text,
  storage_requirements text,
  pregnancy_category text,
  lactation_safety text,
  category_id uuid references categories(id),
  references text[] default '{}',
  cover_image text,
  view_count bigint not null default 0,
  is_visible boolean not null default true,
  verified_by uuid references profiles(id),
  last_updated_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_drug_guides_slug on drug_guides(slug);
create index idx_drug_guides_class on drug_guides(drug_class);
create index idx_drug_guides_name_trgm on drug_guides using gin (name gin_trgm_ops);

-- 3.7 Medical Calculators
create table medical_calculators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  description_en text,
  calculator_type text not null check (calculator_type in ('BMI','IV_Drip','GCS','Pediatric_Dose','Apgar','MAP','Creatinine_Clearance','Fluid_Resuscitation','Burn_Surface','Cardiac_Risk','Anion_Gap','BMI_Pediatric','Drug_Dose','Other')),
  formula text,
  input_schema jsonb not null default '[]'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  reference_url text,
  clinical_notes text,
  uses_count bigint not null default 0,
  is_premium boolean not null default false,
  is_visible boolean not null default true,
  category_id uuid references categories(id),
  display_order int not null default 0,
  created_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_calculators_slug on medical_calculators(slug);
create index idx_calculators_type on medical_calculators(calculator_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. COURSES (Future)
-- ═══════════════════════════════════════════════════════════════════════════════

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  slug text unique not null,
  subtitle text,
  description text,
  description_en text,
  cover_image text,
  promo_video text,
  instructor_id uuid not null references profiles(id) on delete restrict,
  co_instructors uuid[] default '{}',
  category_id uuid references categories(id),
  level text default 'beginner' check (level in ('beginner','intermediate','advanced','expert')),
  duration_hours numeric(6,2) default 0,
  lessons_count int default 0,
  price numeric(10,2) default 0,
  original_price numeric(10,2),
  is_free boolean not null default false,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  requirements text[] default '{}',
  learning_outcomes text[] default '{}',
  certificate_id uuid,
  max_students int,
  language text default 'bilingual',
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  enrolled_count int not null default 0,
  completion_count int not null default 0,
  rating_avg numeric(3,2) default 0,
  rating_count int not null default 0,
  view_count bigint not null default 0,
  published_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_courses_slug on courses(slug) where deleted_at is null;
create index idx_courses_instructor on courses(instructor_id) where deleted_at is null;
create index idx_courses_published on courses(is_published) where is_published = true and deleted_at is null;
create index idx_courses_featured on courses(is_featured) where is_featured = true;

-- 4.2 Course Modules
create table course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  module_title text not null,
  module_title_en text,
  module_description text,
  module_description_en text,
  order_index int not null default 0,
  duration_minutes int default 0,
  is_free_preview boolean not null default false,
  unlock_after_days int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_course_modules_course on course_modules(course_id, order_index);

-- 4.3 Lessons
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null,
  title_en text,
  content_type text not null check (content_type in ('video','text','quiz','file','live','assignment')),
  content_url text,
  content_text text,
  video_duration_seconds int,
  video_transcript text,
  attachments jsonb default '[]'::jsonb,
  resources jsonb default '[]'::jsonb,
  order_index int not null default 0,
  is_free_preview boolean not null default false,
  is_mandatory boolean not null default true,
  min_time_seconds int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lessons_course on lessons(course_id, order_index);
create index idx_lessons_module on lessons(module_id, order_index);

-- 4.4 Course Progress
create table course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  time_spent_seconds int not null default 0,
  last_position int default 0,
  notes text,
  bookmarks jsonb default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index idx_course_progress_user on course_progress(user_id);
create index idx_course_progress_course on course_progress(course_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. EXAMS & QUIZZES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 5.1 Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  description text,
  description_en text,
  quiz_type text not null default 'practice' check (quiz_type in ('nclex','prometric','mock_exam','final','practice','quiz','survey')),
  category_id uuid references categories(id),
  specialty text,
  difficulty text default 'intermediate' check (difficulty in ('beginner','intermediate','advanced','expert')),
  time_limit_minutes int,
  passing_score int not null default 70 check (passing_score between 0 and 100),
  max_attempts int default 0,
  total_questions int default 0,
  randomize_questions boolean not null default true,
  randomize_answers boolean not null default true,
  show_answers_after text default 'submission' check (show_answers_after in ('immediate','after_submit','after_pass','after_deadline','never')),
  show_explanations boolean not null default true,
  is_published boolean not null default false,
  is_premium boolean not null default false,
  is_certified boolean not null default false,
  language text default 'en',
  meta_title text,
  meta_description text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_quizzes_type on quizzes(quiz_type) where deleted_at is null;
create index idx_quizzes_published on quizzes(is_published) where is_published = true;
create index idx_quizzes_category on quizzes(category_id) where deleted_at is null;

-- 5.2 Question Bank (Reusable Questions)
create table question_bank (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  question_text_en text,
  question_type text not null check (question_type in ('mcq','true_false','fill_blank','clinical_case','matching','ordering','short_answer','multiple_select')),
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  explanation text,
  explanation_en text,
  reference_url text,
  category_id uuid references categories(id),
  topic text,
  difficulty text default 'intermediate' check (difficulty in ('beginner','intermediate','advanced','expert')),
  tags text[] default '{}',
  media_id uuid,
  points int not null default 1,
  usage_count bigint not null default 0,
  correct_rate numeric(5,2) default 0,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_question_bank_type on question_bank(question_type) where is_active = true;
create index idx_question_bank_category on question_bank(category_id) where is_active = true;
create index idx_question_bank_topic on question_bank(topic) where is_active = true;
create index idx_question_bank_difficulty on question_bank(difficulty) where is_active = true;
create index idx_question_bank_tags on question_bank using gin (tags);
create index idx_question_bank_text_trgm on question_bank using gin (question_text gin_trgm_ops);

-- 5.3 Quiz Questions (Quiz-specific linking)
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references question_bank(id) on delete cascade,
  order_index int not null default 0,
  points_override int,
  section_name text,
  created_at timestamptz not null default now(),
  unique(quiz_id, question_id)
);

create index idx_quiz_questions_quiz on quiz_questions(quiz_id, order_index);

-- 5.4 Quiz Attempts
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  attempt_number int not null default 1,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','abandoned','expired','graded')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz,
  time_taken_seconds int,
  score int default 0,
  total_score int default 0,
  percentage numeric(5,2) default 0,
  is_passed boolean default false,
  certificate_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quiz_attempts_user on quiz_attempts(user_id);
create index idx_quiz_attempts_quiz on quiz_attempts(quiz_id);
create index idx_quiz_attempts_status on quiz_attempts(status);

-- 5.5 Quiz Answers
create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references question_bank(id) on delete cascade,
  user_answer jsonb,
  is_correct boolean,
  points_earned int default 0,
  time_spent_seconds int default 0,
  answered_at timestamptz default now(),
  flagged_for_review boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_quiz_answers_attempt on quiz_answers(attempt_id);
create index idx_quiz_answers_question on quiz_answers(question_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. CERTIFICATES
-- ═══════════════════════════════════════════════════════════════════════════════

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  certificate_code text unique not null,
  qr_code_url text,
  qr_code_data jsonb,
  pdf_url text,
  pdf_storage_path text,
  title text not null,
  title_en text,
  description text,
  description_en text,
  score int not null default 0,
  max_score int not null default 100,
  percentage numeric(5,2) not null default 0,
  grade text,
  language text default 'en',
  template_id text,
  issued_at date not null default current_date,
  expires_at date,
  revoked_at timestamptz,
  revoked_reason text,
  verification_url text,
  verified_count int not null default 0,
  is_public boolean not null default true,
  instructor_signature text,
  signature_image_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_certificates_user on certificates(user_id);
create index idx_certificates_code on certificates(certificate_code);
create index idx_certificates_quiz on certificates(quiz_id);
create index idx_certificates_course on certificates(course_id);
create index idx_certificates_issued on certificates(issued_at desc);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. COMMUNITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- 7.1 Comments (Polymorphic)
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_type text not null check (content_type in ('article','book','course','quiz','drug','care_plan','calculator','video')),
  content_id uuid not null,
  parent_comment_id uuid references comments(id) on delete cascade,
  reply_to_user_id uuid references profiles(id) on delete set null,
  content text not null,
  is_edited boolean not null default false,
  edited_at timestamptz,
  like_count int not null default 0,
  reply_count int not null default 0,
  report_count int not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','spam','hidden','deleted')),
  moderated_by uuid references profiles(id),
  moderated_at timestamptz,
  moderation_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_comments_content on comments(content_type, content_id) where deleted_at is null;
create index idx_comments_user on comments(user_id) where deleted_at is null;
create index idx_comments_parent on comments(parent_comment_id) where parent_comment_id is not null;
create index idx_comments_status on comments(status) where deleted_at is null;
create index idx_comments_created on comments(created_at desc) where status = 'approved';

-- 7.2 Ratings
create table ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_type text not null check (content_type in ('article','book','course','quiz','drug','care_plan','calculator','product')),
  content_id uuid not null,
  rating int not null check (rating between 1 and 5),
  review_title text,
  review_text text,
  is_verified_purchase boolean not null default false,
  helpful_count int not null default 0,
  unhelpful_count int not null default 0,
  language text default 'ar',
  sentiment_score numeric(3,2),
  status text not null default 'approved' check (status in ('pending','approved','hidden','flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, content_type, content_id)
);

create index idx_ratings_content on ratings(content_type, content_id) where deleted_at is null;
create index idx_ratings_user on ratings(user_id) where deleted_at is null;
create index idx_ratings_value on ratings(rating) where deleted_at is null;

-- 7.3 Bookmarks / Favorites
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_type text not null check (content_type in ('article','book','course','quiz','drug','care_plan','calculator','video','page')),
  content_id uuid not null,
  folder_name text default 'default',
  color text,
  notes text,
  is_favorite boolean not null default false,
  reminder_at timestamptz,
  last_accessed_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, content_type, content_id, folder_name)
);

create index idx_bookmarks_user on bookmarks(user_id);
create index idx_bookmarks_content on bookmarks(content_type, content_id);
create index idx_bookmarks_favorite on bookmarks(is_favorite) where is_favorite = true;
create index idx_bookmarks_folder on bookmarks(user_id, folder_name);

-- 7.4 Reading History
create table reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  last_position int default 0,
  scroll_depth int default 0 check (scroll_depth between 0 and 100),
  time_spent_seconds int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  device_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, article_id)
);

create index idx_reading_history_user on reading_history(user_id, updated_at desc);
create index idx_reading_history_article on reading_history(article_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('system','comment','reply','like','follow','mention','quiz','certificate','payment','subscription','course','book','reminder','ai','maintenance','security','admin')),
  title text not null,
  title_en text,
  message text not null,
  message_en text,
  icon text,
  color text,
  action_url text,
  action_type text,
  related_content_type text,
  related_content_id uuid,
  sender_id uuid references profiles(id) on delete set null,
  channels jsonb not null default '{"in_app":true}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  is_archived boolean not null default false,
  archived_at timestamptz,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where is_read = false;
create index idx_notifications_type on notifications(type);
create index idx_notifications_priority on notifications(priority, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. AI SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- 9.1 AI Chat Sessions
create table ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_token text unique not null,
  title text,
  context_type text check (context_type in ('article','book','course','quiz','drug','general','study','clinical')),
  context_id uuid,
  mode text not null default 'general' check (mode in ('general','study','clinical','exam','tutor')),
  model_name text default 'gpt-4',
  model_version text,
  system_prompt text,
  total_messages int not null default 0,
  total_tokens_used int not null default 0,
  language text default 'ar',
  is_archived boolean not null default false,
  rating int check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_ai_sessions_user on ai_chat_sessions(user_id, last_message_at desc);
create index idx_ai_sessions_context on ai_chat_sessions(context_type, context_id) where context_id is not null;

-- 9.2 AI Chat Messages
create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','function')),
  content text not null,
  content_type text default 'text' check (content_type in ('text','code','table','image','audio','function_call')),
  function_name text,
  function_args jsonb,
  function_result jsonb,
  tokens_input int default 0,
  tokens_output int default 0,
  latency_ms int,
  model_name text,
  referenced_articles uuid[] default '{}',
  referenced_drugs uuid[] default '{}',
  feedback int check (feedback in (-1, 0, 1)),
  flagged_inappropriate boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_messages_session on ai_chat_messages(session_id, created_at);

-- 9.3 AI Generated Content
create table ai_generated_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('summary','quiz','care_plan','translation','flashcards','explanation','mnemonic','case_study','differential','drug_interaction')),
  source_content_type text,
  source_content_id uuid,
  prompt text not null,
  generated_content text not null,
  final_content text,
  model_used text default 'gpt-4',
  temperature numeric(3,2) default 0.7,
  quality_score numeric(3,2),
  accuracy_score numeric(3,2),
  user_rating int check (user_rating between 1 and 5),
  was_edited boolean not null default false,
  edit_distance int default 0,
  tokens_used int default 0,
  generation_time_ms int,
  cost_cents int default 0,
  user_id uuid references profiles(id) on delete set null,
  is_public boolean not null default false,
  shared_count int not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_content_type on ai_generated_content(content_type);
create index idx_ai_content_source on ai_generated_content(source_content_type, source_content_id);
create index idx_ai_content_user on ai_generated_content(user_id);

-- 9.4 AI Usage Tracking
create table ai_usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  feature text not null check (feature in ('chat','summary','quiz_generation','translation','image_generation','voice_transcription','code_explanation')),
  requests_count int not null default 0,
  tokens_input int not null default 0,
  tokens_output int not null default 0,
  cost_cents int not null default 0,
  rate_limit_remaining int,
  plan_tier text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date, feature)
);

create index idx_ai_usage_user_date on ai_usage_tracking(user_id, date desc);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 10.1 Page Views
create table page_views (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  session_id text,
  content_type text,
  content_id uuid,
  content_slug text,
  path text not null,
  title text,
  referrer text,
  referrer_source text check (referrer_source in ('google','facebook','twitter','instagram','youtube','tiktok','direct','email','other')),
  country text,
  city text,
  region text,
  ip_hash text, -- privacy-safe hash
  device_type text check (device_type in ('mobile','tablet','desktop','bot')),
  browser text,
  os text,
  screen_resolution text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  time_on_page_seconds int default 0,
  scroll_depth_percent int default 0,
  is_bounce boolean default false,
  is_unique_session boolean default false,
  viewed_at timestamptz not null default now()
);

create index idx_page_views_content on page_views(content_type, content_id) where content_id is not null;
create index idx_page_views_user on page_views(user_id) where user_id is not null;
create index idx_page_views_viewed on page_views(viewed_at desc);
create index idx_page_views_path on page_views(path);
create index idx_page_views_country on page_views(country, viewed_at desc);

-- Partitioning recommendation: For high traffic, consider monthly partitions
-- create table page_views_2026_01 partition of page_views for values from ('2026-01-01') to ('2026-02-01');

-- 10.2 Search History
create table search_history (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  session_id text,
  query text not null,
  query_normalized text,
  language text default 'ar',
  search_type text default 'all' check (search_type in ('all','article','drug','book','quiz','video','product','user')),
  filters jsonb default '{}'::jsonb,
  results_count int default 0,
  clicked_result_id uuid,
  clicked_result_position int,
  clicked_result_type text,
  time_to_click_ms int,
  time_on_results_ms int default 0,
  abandoned boolean not null default false,
  ip_hash text,
  searched_at timestamptz not null default now()
);

create index idx_search_user on search_history(user_id, searched_at desc);
create index idx_search_query on search_history using gin (query gin_trgm_ops);
create index idx_search_normalized on search_history(query_normalized);
create index idx_search_type on search_history(search_type);

-- 10.3 User Activity
create table user_activity (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  session_id text,
  activity_type text not null check (activity_type in ('login','logout','page_view','article_read','book_download','quiz_start','quiz_complete','course_start','course_complete','certificate_earned','payment','comment','bookmark','search','ai_chat','video_play','share')),
  activity_target_type text,
  activity_target_id uuid,
  duration_seconds int default 0,
  device_info jsonb,
  location jsonb,
  referrer_page text,
  next_page text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_user_activity_user on user_activity(user_id, created_at desc);
create index idx_user_activity_type on user_activity(activity_type);
create index idx_user_activity_target on user_activity(activity_target_type, activity_target_id) where activity_target_id is not null;

-- 10.4 Popular Content (Materialized View - manually refreshed)
create table popular_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  period text not null default 'daily' check (period in ('hourly','daily','weekly','monthly','all_time')),
  score numeric(10,2) not null default 0,
  view_count bigint not null default 0,
  unique_visitors bigint not null default 0,
  avg_time_on_page int default 0,
  engagement_rate numeric(5,4) default 0,
  share_count int default 0,
  save_count int default 0,
  rank int,
  metadata jsonb default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique(content_type, content_id, period)
);

create index idx_popular_content on popular_content(content_type, period, rank);
create index idx_popular_score on popular_content(period, score desc);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. STORE & PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 11.1 Products (Unified)
create table products (
  id uuid primary key default gen_random_uuid(),
  product_type text not null check (product_type in ('book','course','pdf','subscription','bundle','merchandise')),
  title text not null,
  title_en text,
  slug text unique not null,
  description text,
  description_en text,
  short_description text,
  cover_image text,
  gallery text[] default '{}',
  preview_url text,
  file_urls jsonb default '[]'::jsonb,
  price numeric(10,2) not null default 0,
  original_price numeric(10,2),
  cost numeric(10,2) default 0,
  currency text not null default 'EGP',
  tax_rate numeric(5,2) default 14,
  tax_included boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_digital boolean not null default true,
  requires_shipping boolean not null default false,
  stock_quantity int,
  sold_count int not null default 0,
  view_count bigint not null default 0,
  download_count int not null default 0,
  download_limit int,
  access_duration_days int,
  license_type text default 'single' check (license_type in ('single','multi','team','enterprise','unlimited')),
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  content_id uuid,
  created_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_products_type on products(product_type) where deleted_at is null;
create index idx_products_featured on products(is_featured) where is_featured = true and deleted_at is null;
create index idx_products_active on products(is_active) where is_active = true and deleted_at is null;

-- 11.2 Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references profiles(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  subtotal numeric(10,2) not null default 0,
  tax_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  shipping_amount numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'EGP',
  coupon_id uuid,
  coupon_code text,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','completed','cancelled','refunded','failed')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','partially_refunded')),
  payment_method text,
  payment_id uuid,
  billing_address jsonb,
  shipping_address jsonb,
  customer_notes text,
  internal_notes text,
  ip_address inet,
  user_agent text,
  affiliate_id uuid,
  referral_code text,
  placed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user on orders(user_id, placed_at desc);
create index idx_orders_status on orders(status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_email on orders(customer_email);

-- 11.3 Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  product_sku text,
  variant_id text,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  discount_amount numeric(10,2) default 0,
  tax_amount numeric(10,2) default 0,
  total numeric(10,2) not null,
  download_urls jsonb default '[]'::jsonb,
  access_granted_at timestamptz,
  expires_at timestamptz,
  max_downloads int,
  download_count int not null default 0,
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','processing','completed','refunded','cancelled')),
  license_keys jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);
create index idx_order_items_fulfillment on order_items(fulfillment_status);

-- 11.4 Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,
  user_id uuid references profiles(id) on delete set null,
  payment_gateway text not null check (payment_gateway in ('paymob','stripe','paypal','fawry','meeza','vodafone_cash','orange_cash','bank_transfer','manual','other')),
  gateway_transaction_id text,
  gateway_payment_id text,
  gateway_intent_id text,
  gateway_response jsonb default '{}'::jsonb,
  amount numeric(10,2) not null,
  fee_amount numeric(10,2) default 0,
  net_amount numeric(10,2),
  currency text not null default 'EGP',
  exchange_rate numeric(10,4) default 1,
  status text not null default 'pending' check (status in ('pending','processing','successful','failed','refunded','disputed','cancelled','expired')),
  payment_method text check (payment_method in ('credit_card','debit_card','wallet','bank_transfer','cash','mobile_money','crypto','other')),
  card_brand text,
  card_last4 text,
  card_exp_month int,
  card_exp_year int,
  installment_count int default 1,
  is_3d_secure boolean default false,
  fraud_score numeric(3,2),
  ip_address inet,
  device_fingerprint text,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  webhook_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order on payments(order_id);
create index idx_payments_user on payments(user_id);
create index idx_payments_gateway on payments(payment_gateway);
create index idx_payments_status on payments(status);
create index idx_payments_txn on payments(gateway_transaction_id);

-- 11.5 Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  order_id uuid references orders(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_tax_id text,
  billing_address jsonb,
  company_info jsonb default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null,
  tax_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  shipping_amount numeric(10,2) default 0,
  total numeric(10,2) not null,
  currency text not null default 'EGP',
  qr_code_url text,
  qr_code_data text,
  pdf_url text,
  pdf_storage_path text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  status text not null default 'draft' check (status in ('draft','issued','paid','overdue','voided','refunded')),
  notes text,
  internal_notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_order on invoices(order_id);
create index idx_invoices_user on invoices(user_id);
create index idx_invoices_status on invoices(status);

-- 11.6 Refunds
create table refunds (
  id uuid primary key default gen_random_uuid(),
  refund_number text unique not null,
  payment_id uuid not null references payments(id) on delete restrict,
  order_id uuid references orders(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  reason text not null,
  description text,
  refund_type text not null default 'full' check (refund_type in ('full','partial')),
  amount numeric(10,2) not null,
  currency text not null default 'EGP',
  refund_method text check (refund_method in ('original','wallet','bank_transfer','manual')),
  gateway_refund_id text,
  gateway_response jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','processing','completed','failed')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  processed_at timestamptz,
  processed_by uuid references profiles(id),
  completed_at timestamptz,
  failure_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_refunds_payment on refunds(payment_id);
create index idx_refunds_status on refunds(status);

-- 11.7 Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  name_en text,
  description text,
  description_en text,
  discount_type text not null check (discount_type in ('percent','fixed','free_shipping','buy_x_get_y')),
  discount_value numeric(10,2) not null,
  max_discount_amount numeric(10,2),
  min_order_amount numeric(10,2) default 0,
  usage_limit int,
  used_count int not null default 0,
  per_user_limit int default 1,
  applicable_products uuid[] default '{}',
  applicable_categories uuid[] default '{}',
  first_purchase_only boolean not null default false,
  is_active boolean not null default true,
  is_public boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by uuid references profiles(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_coupons_code on coupons(code);
create index idx_coupons_active on coupons(is_active, starts_at, expires_at);

-- Coupon Usage Tracking
create table coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  discount_amount numeric(10,2) not null,
  used_at timestamptz not null default now()
);

create index idx_coupon_usage_coupon on coupon_usage(coupon_id);
create index idx_coupon_usage_user on coupon_usage(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 12.1 Subscription Plans
create table subscription_plans (
  id text primary key, -- 'free', 'pro', 'team', etc.
  name text not null,
  slug text unique not null,
  display_name_ar text not null,
  display_name_en text not null,
  description_ar text,
  description_en text,
  features jsonb not null default '[]'::jsonb,
  limitations jsonb default '{}'::jsonb,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) default 0,
  currency text not null default 'EGP',
  trial_days int default 0,
  max_concurrent_devices int default 1,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  sort_order int not null default 0,
  badge_text text,
  badge_color text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plans_active on subscription_plans(is_active, sort_order);

-- 12.2 User Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id text not null references subscription_plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','trial','cancelled','expired','paused','past_due','pending')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','quarterly','yearly','lifetime')),
  amount numeric(10,2) not null,
  currency text not null default 'EGP',
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancel_at_period_end boolean not null default false,
  auto_renew boolean not null default true,
  payment_method text,
  last_payment_id uuid references payments(id),
  next_payment_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user on subscriptions(user_id, status);
create index idx_subscriptions_status on subscriptions(status, current_period_end);
create index idx_subscriptions_plan on subscriptions(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. AFFILIATE SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

create table affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  referral_code text unique not null,
  qr_code_url text,
  landing_page_url text,
  commission_rate numeric(5,2) not null default 10,
  commission_type text not null default 'percent' check (commission_type in ('percent','fixed')),
  total_clicks int not null default 0,
  unique_clicks int not null default 0,
  total_signups int not null default 0,
  total_conversions int not null default 0,
  total_earnings numeric(10,2) not null default 0,
  pending_earnings numeric(10,2) not null default 0,
  paid_earnings numeric(10,2) not null default 0,
  tier text default 'bronze' check (tier in ('bronze','silver','gold','platinum','diamond')),
  tier_progress numeric(5,2) default 0,
  status text not null default 'pending' check (status in ('pending','active','suspended','terminated')),
  payment_email text,
  payment_method text,
  payment_details jsonb default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_affiliates_user on affiliates(user_id);
create index idx_affiliates_code on affiliates(referral_code);
create index idx_affiliates_status on affiliates(status);

-- 13.2 Affiliate Clicks
create table affiliate_clicks (
  id bigserial primary key,
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  visitor_id text,
  ip_hash text,
  user_agent text,
  referrer text,
  landing_page text,
  target_url text,
  country text,
  city text,
  device_type text,
  converted boolean not null default false,
  conversion_order_id uuid references orders(id),
  clicked_at timestamptz not null default now()
);

create index idx_affiliate_clicks_affiliate on affiliate_clicks(affiliate_id, clicked_at desc);
create index idx_affiliate_clicks_converted on affiliate_clicks(affiliate_id) where converted = true;

-- 13.3 Affiliate Payouts
create table affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'EGP',
  period_start date not null,
  period_end date not null,
  transactions_count int not null default 0,
  payment_method text,
  transaction_reference text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  notes text,
  processed_by uuid references profiles(id),
  requested_at timestamptz default now(),
  processed_at timestamptz,
  paid_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_affiliate_payouts on affiliate_payouts(affiliate_id, created_at desc);
create index idx_affiliate_payouts_status on affiliate_payouts(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. MEDIA LIBRARY
-- ═══════════════════════════════════════════════════════════════════════════════

-- 14.1 Media Folders (Hierarchical)
create table media_folders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references media_folders(id) on delete cascade,
  name text not null,
  slug text not null,
  full_path text not null,
  owner_id uuid references profiles(id) on delete set null,
  description text,
  color text,
  icon text,
  is_system boolean not null default false,
  is_protected boolean not null default false,
  file_count int not null default 0,
  total_size_bytes bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parent_id, slug)
);

create index idx_media_folders_parent on media_folders(parent_id);
create index idx_media_folders_owner on media_folders(owner_id);

-- 14.2 Media Files
create table media_files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_filename text not null,
  storage_bucket text not null default 'media',
  storage_path text not null,
  file_url text not null,
  thumbnail_url text,
  mime_type text not null,
  file_type text not null check (file_type in ('image','video','pdf','audio','document','archive','font','other')),
  file_extension text,
  file_size_bytes bigint not null,
  width int,
  height int,
  duration_seconds int,
  aspect_ratio text,
  alt_text text,
  caption text,
  credit text,
  license text,
  copyright_owner text,
  folder_id uuid references media_folders(id) on delete set null,
  uploaded_by uuid references profiles(id) on delete set null,
  is_public boolean not null default true,
  is_optimized boolean not null default false,
  compression_status text default 'pending' check (compression_status in ('pending','processing','completed','failed','skipped')),
  variants jsonb default '{}'::jsonb, -- {thumbnail, small, medium, large, webp, avif}
  exif_data jsonb,
  ai_alt_text text,
  ai_tags text[] default '{}',
  usage_count int not null default 0,
  download_count int not null default 0,
  view_count int not null default 0,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  checksum text,
  virus_scan_status text default 'pending' check (virus_scan_status in ('pending','scanning','clean','infected','failed')),
  virus_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_media_files_folder on media_files(folder_id) where deleted_at is null;
create index idx_media_files_type on media_files(file_type) where deleted_at is null;
create index idx_media_files_uploader on media_files(uploaded_by) where deleted_at is null;
create index idx_media_files_public on media_files(is_public) where is_public = true and deleted_at is null;
create index idx_media_files_created on media_files(created_at desc) where deleted_at is null;
create index idx_media_files_tags on media_files using gin (tags);

drop trigger if exists trg_media_files_updated on media_files;
create trigger trg_media_files_updated before update on media_files
for each row execute function update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. AUDIT LOGS
-- ═══════════════════════════════════════════════════════════════════════════════

create table audit_logs (
  id bigserial primary key,
  actor_id uuid references profiles(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user','admin','system','service')),
  action text not null, -- 'create','read','update','delete','login','logout','export','import','publish','unpublish','approve','reject','restore','backup','restore_backup','settings_change','role_assign','role_revoke','payment','refund','download','upload'
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[] default '{}',
  ip_address inet,
  user_agent text,
  session_id text,
  request_id text,
  request_method text,
  request_path text,
  severity text not null default 'info' check (severity in ('debug','info','warning','error','critical')),
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_actor on audit_logs(actor_id, created_at desc);
create index idx_audit_entity on audit_logs(entity_type, entity_id, created_at desc);
create index idx_audit_action on audit_logs(action);
create index idx_audit_severity on audit_logs(severity, created_at desc);
create index idx_audit_created on audit_logs(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 16. ROW LEVEL SECURITY (RLS) - PRODUCTION POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table roles enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_versions enable row level security;
alter table article_sections enable row level security;
alter table article_images enable row level security;
alter table article_tags enable row level security;
alter table article_related enable row level security;
alter table books enable row level security;
alter table book_versions enable row level security;
alter table book_downloads enable row level security;
alter table pdf_files enable row level security;
alter table nursing_care_plans enable row level security;
alter table drug_guides enable row level security;
alter table medical_calculators enable row level security;
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table course_progress enable row level security;
alter table quizzes enable row level security;
alter table question_bank enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;
alter table certificates enable row level security;
alter table comments enable row level security;
alter table ratings enable row level security;
alter table bookmarks enable row level security;
alter table reading_history enable row level security;
alter table notifications enable row level security;
alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;
alter table ai_generated_content enable row level security;
alter table ai_usage_tracking enable row level security;
alter table page_views enable row level security;
alter table search_history enable row level security;
alter table user_activity enable row level security;
alter table popular_content enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table refunds enable row level security;
alter table coupons enable row level security;
alter table coupon_usage enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table affiliates enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_payouts enable row level security;
alter table media_folders enable row level security;
alter table media_files enable row level security;
alter table audit_logs enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper: service role bypasses RLS (Supabase default)

-- ===== ROLES =====
create policy "roles_read_all" on roles for select using (true);
create policy "roles_admin_write" on roles for all using (is_admin()) with check (is_admin());

-- ===== PROFILES =====
create policy "profiles_read_all" on profiles for select using (deleted_at is null);
create policy "profiles_self_update" on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy "profiles_admin_all" on profiles for all using (is_admin()) with check (is_admin());

-- ===== USER_ROLES =====
create policy "user_roles_read_all" on user_roles for select using (true);
create policy "user_roles_admin_write" on user_roles for all using (is_admin()) with check (is_admin());

-- ===== CATEGORIES =====
create policy "categories_read_visible" on categories for select using (is_visible = true and deleted_at is null);
create policy "categories_admin_write" on categories for all using (is_admin()) with check (is_admin());

-- ===== TAGS =====
create policy "tags_read_all" on tags for select using (true);
create policy "tags_admin_write" on tags for all using (can_publish()) with check (can_publish());

-- ===== ARTICLES =====
create policy "articles_read_published" on articles for select using (
  (status = 'published' and deleted_at is null)
  or author_id = auth.uid()
  or is_admin()
);
create policy "articles_author_insert" on articles for insert with check (
  author_id = auth.uid() or is_admin() or can_publish()
);
create policy "articles_author_update" on articles for update using (
  author_id = auth.uid() or is_admin() or can_publish()
) with check (author_id = auth.uid() or is_admin() or can_publish());
create policy "articles_admin_delete" on articles for delete using (is_admin() or author_id = auth.uid());

-- ===== ARTICLE_VERSIONS =====
create policy "article_versions_read" on article_versions for select using (
  exists (select 1 from articles where id = article_id and (status = 'published' or author_id = auth.uid() or is_admin()))
);
create policy "article_versions_write" on article_versions for insert with check (auth.uid() = editor_id or is_admin());
create policy "article_versions_admin_delete" on article_versions for delete using (is_admin());

-- ===== ARTICLE_SECTIONS =====
create policy "article_sections_read" on article_sections for select using (true);
create policy "article_sections_write" on article_sections for all using (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin() or can_publish()))
) with check (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin() or can_publish()))
);

-- ===== ARTICLE_IMAGES =====
create policy "article_images_read" on article_images for select using (true);
create policy "article_images_write" on article_images for all using (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin() or can_publish()))
) with check (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin() or can_publish()))
);

-- ===== ARTICLE_TAGS =====
create policy "article_tags_read" on article_tags for select using (true);
create policy "article_tags_write" on article_tags for all using (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin() or can_publish()))
);

-- ===== ARTICLE_RELATED =====
create policy "article_related_read" on article_related for select using (true);
create policy "article_related_write" on article_related for all using (
  exists (select 1 from articles where id = article_id and (author_id = auth.uid() or is_admin()))
);

-- ===== BOOKS =====
create policy "books_read_visible" on books for select using (is_visible = true and deleted_at is null);
create policy "books_admin_write" on books for all using (is_admin() or can_publish()) with check (is_admin() or can_publish());

-- ===== BOOK_VERSIONS =====
create policy "book_versions_read" on book_versions for select using (true);
create policy "book_versions_write" on book_versions for all using (
  exists (select 1 from books where id = book_id and (is_admin() or can_publish()))
);

-- ===== BOOK_DOWNLOADS =====
create policy "book_downloads_self_read" on book_downloads for select using (user_id = auth.uid() or is_admin());
create policy "book_downloads_self_create" on book_downloads for insert with check (user_id = auth.uid() or is_admin());
create policy "book_downloads_admin_all" on book_downloads for all using (is_admin());

-- ===== PDF_FILES =====
create policy "pdf_files_read_visible" on pdf_files for select using (is_visible = true and deleted_at is null);
create policy "pdf_files_admin_write" on pdf_files for all using (is_admin() or can_publish()) with check (is_admin() or can_publish());

-- ===== NURSING_CARE_PLANS =====
create policy "care_plans_read" on nursing_care_plans for select using (true);
create policy "care_plans_write" on nursing_care_plans for all using (is_admin() or can_publish());

-- ===== DRUG_GUIDES =====
create policy "drug_guides_read_visible" on drug_guides for select using (is_visible = true);
create policy "drug_guides_write" on drug_guides for all using (is_admin() or can_publish());

-- ===== MEDICAL_CALCULATORS =====
create policy "calculators_read_visible" on medical_calculators for select using (is_visible = true);
create policy "calculators_write" on medical_calculators for all using (is_admin() or can_publish());

-- ===== COURSES =====
create policy "courses_read_published" on courses for select using ((is_published = true and deleted_at is null) or instructor_id = auth.uid() or is_admin());
create policy "courses_instructor_write" on courses for all using (instructor_id = auth.uid() or is_admin()) with check (instructor_id = auth.uid() or is_admin());

-- ===== COURSE_MODULES =====
create policy "course_modules_read" on course_modules for select using (true);
create policy "course_modules_write" on course_modules for all using (
  exists (select 1 from courses where id = course_id and (instructor_id = auth.uid() or is_admin()))
);

-- ===== LESSONS =====
create policy "lessons_read" on lessons for select using (true);
create policy "lessons_write" on lessons for all using (
  exists (select 1 from courses where id = course_id and (instructor_id = auth.uid() or is_admin()))
);

-- ===== COURSE_PROGRESS =====
create policy "course_progress_self_read" on course_progress for select using (user_id = auth.uid() or is_admin());
create policy "course_progress_self_write" on course_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== QUIZZES =====
create policy "quizzes_read_published" on quizzes for select using ((is_published = true and deleted_at is null) or is_admin() or can_publish());
create policy "quizzes_admin_write" on quizzes for all using (is_admin() or can_publish()) with check (is_admin() or can_publish());

-- ===== QUESTION_BANK =====
create policy "question_bank_read_active" on question_bank for select using (is_active = true);
create policy "question_bank_admin_write" on question_bank for all using (is_admin() or can_publish()) with check (is_admin() or can_publish());

-- ===== QUIZ_QUESTIONS =====
create policy "quiz_questions_read" on quiz_questions for select using (true);
create policy "quiz_questions_write" on quiz_questions for all using (
  exists (select 1 from quizzes where id = quiz_id and (is_admin() or can_publish()))
);

-- ===== QUIZ_ATTEMPTS =====
create policy "quiz_attempts_self_read" on quiz_attempts for select using (user_id = auth.uid() or is_admin());
create policy "quiz_attempts_self_insert" on quiz_attempts for insert with check (user_id = auth.uid() or is_admin());
create policy "quiz_attempts_self_update" on quiz_attempts for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== QUIZ_ANSWERS =====
create policy "quiz_answers_self_read" on quiz_answers for select using (
  exists (select 1 from quiz_attempts where id = attempt_id and (user_id = auth.uid() or is_admin()))
);
create policy "quiz_answers_self_write" on quiz_answers for all using (
  exists (select 1 from quiz_attempts where id = attempt_id and (user_id = auth.uid() or is_admin()))
);

-- ===== CERTIFICATES =====
create policy "certificates_read_public" on certificates for select using (is_public = true and (revoked_at is null) and (expires_at is null or expires_at > current_date));
create policy "certificates_self_read" on certificates for select using (user_id = auth.uid() or is_admin());
create policy "certificates_admin_write" on certificates for all using (is_admin() or can_publish()) with check (is_admin() or can_publish());

-- ===== COMMENTS =====
create policy "comments_read_approved" on comments for select using (status = 'approved' and deleted_at is null);
create policy "comments_self_read" on comments for select using (user_id = auth.uid() or is_admin());
create policy "comments_insert" on comments for insert with check (user_id = auth.uid());
create policy "comments_self_update" on comments for update using (user_id = auth.uid() or is_admin());
create policy "comments_moderator_delete" on comments for delete using (user_id = auth.uid() or is_admin() or has_role(auth.uid(), 'moderator'));

-- ===== RATINGS =====
create policy "ratings_read_approved" on ratings for select using (status = 'approved' and deleted_at is null);
create policy "ratings_insert" on ratings for insert with check (user_id = auth.uid());
create policy "ratings_self_update" on ratings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings_admin_all" on ratings for all using (is_admin());

-- ===== BOOKMARKS =====
create policy "bookmarks_self_read" on bookmarks for select using (user_id = auth.uid());
create policy "bookmarks_self_write" on bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== READING_HISTORY =====
create policy "reading_history_self_read" on reading_history for select using (user_id = auth.uid() or is_admin());
create policy "reading_history_self_write" on reading_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== NOTIFICATIONS =====
create policy "notifications_self_read" on notifications for select using (user_id = auth.uid());
create policy "notifications_self_update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_admin_insert" on notifications for insert with check (is_admin() or user_id = auth.uid());

-- ===== AI CHAT =====
create policy "ai_sessions_self" on ai_chat_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_messages_self" on ai_chat_messages for all using (
  exists (select 1 from ai_chat_sessions where id = session_id and user_id = auth.uid())
) with check (
  exists (select 1 from ai_chat_sessions where id = session_id and user_id = auth.uid())
);
create policy "ai_content_self" on ai_generated_content for select using (user_id = auth.uid() or is_public = true);
create policy "ai_content_write" on ai_generated_content for insert with check (user_id = auth.uid());
create policy "ai_usage_self" on ai_usage_tracking for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== ANALYTICS =====
create policy "page_views_insert_any" on page_views for insert with check (true);
create policy "page_views_admin_read" on page_views for select using (is_admin());
create policy "search_history_insert_any" on search_history for insert with check (true);
create policy "search_history_self_read" on search_history for select using (user_id = auth.uid() or is_admin());
create policy "user_activity_self" on user_activity for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "popular_content_read" on popular_content for select using (true);
create policy "popular_content_write" on popular_content for all using (is_admin());

-- ===== PRODUCTS =====
create policy "products_read_active" on products for select using (is_active = true and deleted_at is null);
create policy "products_admin_write" on products for all using (is_admin()) with check (is_admin());

-- ===== ORDERS =====
create policy "orders_self_read" on orders for select using (user_id = auth.uid() or customer_email = (select email from profiles where id = auth.uid()) or is_admin());
create policy "orders_insert" on orders for insert with check (user_id = auth.uid() or user_id is null);
create policy "orders_self_update" on orders for update using (user_id = auth.uid() or is_admin());
create policy "orders_admin_all" on orders for all using (is_admin());

-- ===== ORDER_ITEMS =====
create policy "order_items_self_read" on order_items for select using (
  exists (select 1 from orders where id = order_id and (user_id = auth.uid() or is_admin()))
);
create policy "order_items_insert" on order_items for insert with check (true);
create policy "order_items_admin_all" on order_items for all using (is_admin());

-- ===== PAYMENTS =====
create policy "payments_self_read" on payments for select using (user_id = auth.uid() or is_admin());
create policy "payments_admin_write" on payments for all using (is_admin());

-- ===== INVOICES =====
create policy "invoices_self_read" on invoices for select using (user_id = auth.uid() or is_admin());
create policy "invoices_admin_write" on invoices for all using (is_admin());

-- ===== REFUNDS =====
create policy "refunds_self_read" on refunds for select using (user_id = auth.uid() or is_admin());
create policy "refunds_admin_write" on refunds for all using (is_admin());

-- ===== COUPONS =====
create policy "coupons_read_active" on coupons for select using (is_active = true and is_public = true);
create policy "coupons_admin_write" on coupons for all using (is_admin()) with check (is_admin());
create policy "coupon_usage_self_read" on coupon_usage for select using (user_id = auth.uid() or is_admin());
create policy "coupon_usage_admin_write" on coupon_usage for all using (is_admin());

-- ===== SUBSCRIPTIONS =====
create policy "plans_read_active" on subscription_plans for select using (is_active = true);
create policy "plans_admin_write" on subscription_plans for all using (is_admin()) with check (is_admin());
create policy "subscriptions_self_read" on subscriptions for select using (user_id = auth.uid() or is_admin());
create policy "subscriptions_admin_write" on subscriptions for all using (is_admin());

-- ===== AFFILIATES =====
create policy "affiliates_read_active" on affiliates for select using (status = 'active' or user_id = auth.uid() or is_admin());
create policy "affiliates_self_write" on affiliates for insert with check (user_id = auth.uid());
create policy "affiliates_admin_all" on affiliates for all using (is_admin() or user_id = auth.uid());
create policy "affiliate_clicks_insert" on affiliate_clicks for insert with check (true);
create policy "affiliate_clicks_read" on affiliate_clicks for select using (
  exists (select 1 from affiliates where id = affiliate_id and (user_id = auth.uid() or is_admin()))
);
create policy "affiliate_payouts_self_read" on affiliate_payouts for select using (user_id = auth.uid() or is_admin());
create policy "affiliate_payouts_admin_write" on affiliate_payouts for all using (is_admin());

-- ===== MEDIA =====
create policy "media_folders_read" on media_folders for select using (true);
create policy "media_folders_write" on media_folders for all using (is_admin() or owner_id = auth.uid()) with check (is_admin() or owner_id = auth.uid());
create policy "media_files_read_public" on media_files for select using (is_public = true and deleted_at is null);
create policy "media_files_self_read" on media_files for select using (uploaded_by = auth.uid() or is_admin());
create policy "media_files_upload" on media_files for insert with check (uploaded_by = auth.uid() or is_admin());
create policy "media_files_self_update" on media_files for update using (uploaded_by = auth.uid() or is_admin());
create policy "media_files_admin_delete" on media_files for delete using (is_admin() or uploaded_by = auth.uid());

-- ===== AUDIT LOGS =====
create policy "audit_logs_admin_read" on audit_logs for select using (is_admin());
create policy "audit_logs_admin_write" on audit_logs for all using (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 17. STORAGE BUCKETS & POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('articles', 'articles', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('books', 'books', false, 104857600, array['application/pdf','application/epub+zip','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('pdfs', 'pdfs', false, 52428800, array['application/pdf']),
  ('videos', 'videos', false, 524288000, array['video/mp4','video/webm','video/ogg','video/quicktime']),
  ('certificates', 'certificates', false, 10485760, array['application/pdf']),
  ('thumbnails', 'thumbnails', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('attachments', 'attachments', false, 26214400, null)
on conflict (id) do nothing;

-- Storage policies
-- Public buckets: avatars, articles, thumbnails
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_update_own" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name)));
create policy "avatars_delete_own" on storage.objects for delete using (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name)) or is_admin()));

create policy "articles_read" on storage.objects for select using (bucket_id = 'articles');
create policy "articles_upload" on storage.objects for insert with check (bucket_id = 'articles' and (auth.role() = 'authenticated' or is_admin()));
create policy "articles_admin_delete" on storage.objects for delete using (bucket_id = 'articles' and is_admin());

create policy "thumbnails_read" on storage.objects for select using (bucket_id = 'thumbnails');
create policy "thumbnails_upload" on storage.objects for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');

-- Private buckets: books, pdfs, videos, certificates, attachments
create policy "books_read_authenticated" on storage.objects for select using (
  bucket_id = 'books' and (auth.role() = 'authenticated' or is_admin())
);
create policy "books_upload_admin" on storage.objects for insert with check (
  bucket_id = 'books' and is_admin()
);
create policy "books_admin_all" on storage.objects for all using (bucket_id = 'books' and is_admin());

create policy "pdfs_read_authenticated" on storage.objects for select using (
  bucket_id = 'pdfs' and (auth.role() = 'authenticated' or is_admin())
);
create policy "pdfs_upload_admin" on storage.objects for insert with check (
  bucket_id = 'pdfs' and is_admin()
);
create policy "pdfs_admin_all" on storage.objects for all using (bucket_id = 'pdfs' and is_admin());

create policy "videos_read_authenticated" on storage.objects for select using (
  bucket_id = 'videos' and (auth.role() = 'authenticated' or is_admin())
);
create policy "videos_upload_admin" on storage.objects for insert with check (
  bucket_id = 'videos' and is_admin()
);
create policy "videos_admin_all" on storage.objects for all using (bucket_id = 'videos' and is_admin());

create policy "certificates_read_owner" on storage.objects for select using (
  bucket_id = 'certificates' and (auth.role() = 'authenticated' or is_admin())
);
create policy "certificates_admin_write" on storage.objects for all using (bucket_id = 'certificates' and is_admin());

create policy "attachments_read_authenticated" on storage.objects for select using (
  bucket_id = 'attachments' and (auth.role() = 'authenticated' or is_admin())
);
create policy "attachments_upload_authenticated" on storage.objects for insert with check (
  bucket_id = 'attachments' and (auth.role() = 'authenticated' or is_admin())
);
create policy "attachments_admin_all" on storage.objects for all using (bucket_id = 'attachments' and is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 18. INITIAL DATA / SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Subscription Plans
insert into subscription_plans (id, name, slug, display_name_ar, display_name_en, description_ar, description_en, features, price_monthly, price_yearly, currency, trial_days, is_active, is_featured, is_popular, sort_order, badge_text, badge_color) values
  ('free', 'Free', 'free', 'مجاني', 'Free', 'للوصول الأساسي المجاني', 'Basic free access', '["قراءة المقالات المجانية","3 تحميلات PDF شهرياً","الاختبارات الأساسية","الأدوات الطبية"]'::jsonb, 0, 0, 'EGP', 0, true, false, false, 0, null, null),
  ('pro', 'Pro', 'pro', 'احترافي', 'Pro', 'وصول كامل للمحتوى المميز', 'Full access to premium content', '["كل المقالات","تحميل غير محدود","كورسات فيديو كاملة","NCLEX + Prometric","AI مساعد","شهادات معتمدة"]'::jsonb, 99, 830, 'EGP', 7, true, true, true, 1, 'الأكثر شعبية', '#0ea5e9'),
  ('team', 'Team', 'team', 'فريق', 'Team', 'للفرق والمجموعات', 'For teams and groups', '["كل ميزات Pro","5 مستخدمين","لوحة تحكم الفريق","تقارير متقدمة"]'::jsonb, 399, 3990, 'EGP', 14, true, false, false, 2, null, null)
on conflict (id) do nothing;

-- Default Categories (Medical Specialties)
insert into categories (name, name_en, slug, description, icon, color, display_order, is_featured, is_visible) values
  ('عناية مركزة', 'ICU', 'icu', 'رعاية الحالات الحرجة والعناية المركزة', '🏥', '#ef4444', 1, true, true),
  ('طوارئ', 'Emergency', 'emergency', 'طب الطوارئ والإسعافات الأولية', '🚑', '#f97316', 2, true, true),
  ('أطفال', 'Pediatrics', 'pediatrics', 'رعاية الأطفال وحديثي الولادة', '👶', '#ec4899', 3, true, true),
  ('أمومة وتوليد', 'Obstetrics', 'obstetrics', 'تمريض الأم والولادة', '🤰', '#a855f7', 4, true, true),
  ('جراحة', 'Surgery', 'surgery', 'تمريض ما قبل وبعد العمليات', '🔪', '#6366f1', 5, true, true),
  ('باطنة', 'Internal Medicine', 'internal', 'الأمراض الباطنية', '💊', '#0ea5e9', 6, true, true),
  ('أدوية', 'Pharmacology', 'pharmacology', 'علم الأدوية والجرعات', '💉', '#14b8a6', 7, true, true),
  ('مهارات', 'Clinical Skills', 'skills', 'المهارات السريرية', '🩺', '#06b6d4', 8, true, true),
  ('خطط رعاية', 'Care Plans', 'care-plans', 'خطط الرعاية NANDA', '📋', '#10b981', 9, true, true),
  ('NCLEX', 'NCLEX', 'nclex', 'اختبارات الرخصة الأمريكية', '🎓', '#8b5cf6', 10, true, true)
on conflict (slug) do nothing;

-- Default Tags
insert into tags (name, slug, color) values
  ('حساب الجرعات', 'dose-calculation', '#0ea5e9'),
  ('IV Therapy', 'iv-therapy', '#10b981'),
  ('ECG', 'ecg', '#ef4444'),
  ('NCLEX', 'nclex', '#8b5cf6'),
  ('Prometric', 'prometric', '#f59e0b'),
  ('أدوية طوارئ', 'emergency-drugs', '#dc2626'),
  ('Vital Signs', 'vital-signs', '#06b6d4'),
  ('Infection Control', 'infection-control', '#14b8a6'),
  ('Patient Safety', 'patient-safety', '#f97316'),
  ('CPR', 'cpr', '#dc2626')
on conflict (slug) do nothing;

-- Default Coupons
insert into coupons (code, name, name_en, discount_type, discount_value, max_discount_amount, min_order_amount, usage_limit, is_active, is_public, starts_at) values
  ('WELCOME10', 'خصم ترحيبي 10%', 'Welcome 10%', 'percent', 10, 50, 0, 1000, true, true, now()),
  ('NURSE20', 'خصم الممرضين 20%', 'Nurses 20%', 'percent', 20, 200, 100, 500, true, true, now()),
  ('STUDENT50', 'خصم الطلاب 50 ج', 'Students EGP 50', 'fixed', 50, 50, 200, 200, true, true, now())
on conflict (code) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 19. VIEWS FOR ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Daily statistics view
create or replace view daily_stats as
select
  date_trunc('day', viewed_at)::date as date,
  count(*) as total_views,
  count(distinct coalesce(user_id::text, session_id)) as unique_visitors,
  count(distinct ip_hash) as unique_ips,
  count(*) filter (where is_bounce) as bounces,
  count(*) filter (where content_type = 'article') as article_views,
  count(*) filter (where content_type = 'book') as book_views,
  count(*) filter (where device_type = 'mobile') as mobile_views,
  count(*) filter (where device_type = 'desktop') as desktop_views,
  avg(time_on_page_seconds) as avg_time_on_page,
  avg(scroll_depth_percent) as avg_scroll_depth
from page_views
group by date_trunc('day', viewed_at)
order by date desc;

-- Revenue dashboard view
create or replace view revenue_summary as
select
  date_trunc('day', paid_at)::date as date,
  count(*) as successful_payments,
  sum(amount) as gross_revenue,
  sum(fee_amount) as total_fees,
  sum(net_amount) as net_revenue,
  count(distinct user_id) as paying_customers,
  payment_gateway,
  currency
from payments
where status = 'successful' and paid_at is not null
group by date_trunc('day', paid_at), payment_gateway, currency
order by date desc;

-- Top performing content view
create or replace view top_content as
select
  'article' as content_type,
  id as content_id,
  title,
  view_count as views,
  like_count,
  comment_count,
  bookmark_count,
  rating_count,
  view_count as popularity_score
from articles
where status = 'published' and deleted_at is null
order by view_count desc
limit 100;

-- Grant access to views
grant select on daily_stats to anon, authenticated;
grant select on revenue_summary to authenticated, service_role;
grant select on top_content to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 20. FUNCTIONS FOR APPLICATION LOGIC
-- ═══════════════════════════════════════════════════════════════════════════════

-- Track article view (increments view count, logs page view)
create or replace function track_article_view(
  p_article_id uuid,
  p_session_id text,
  p_user_id uuid default null,
  p_ip_hash text default null,
  p_user_agent text default null,
  p_referrer text default null,
  p_device_type text default 'desktop',
  p_country text default null,
  p_time_spent int default 0
)
returns void language plpgsql security definer as $$
declare
  v_slug text;
  v_title text;
begin
  -- Get article info
  select slug, title into v_slug, v_title from articles where id = p_article_id and deleted_at is null;
  if v_slug is null then return; end if;

  -- Increment view count
  update articles set view_count = view_count + 1 where id = p_article_id;

  -- Log page view
  insert into page_views (user_id, session_id, content_type, content_id, content_slug, path, title, ip_hash, user_agent, referrer, device_type, country, time_on_page_seconds, is_unique_session)
  values (p_user_id, p_session_id, 'article', p_article_id, v_slug, '/article/' || v_slug, v_title, p_ip_hash, p_user_agent, p_referrer, p_device_type, p_country, p_time_spent, true);

  -- Log user activity
  if p_user_id is not null then
    insert into user_activity (user_id, session_id, activity_type, activity_target_type, activity_target_id, duration_seconds)
    values (p_user_id, p_session_id, 'article_read', 'article', p_article_id, p_time_spent);
  end if;
end;
$$;

-- Track quiz attempt result
create or replace function submit_quiz_attempt(
  p_quiz_id uuid,
  p_score int,
  p_total_score int,
  p_time_taken int,
  p_answers jsonb
)
returns table (
  attempt_id uuid,
  is_passed boolean,
  percentage numeric,
  certificate_id uuid
) language plpgsql security definer as $$
declare
  v_attempt_id uuid;
  v_percentage numeric(5,2);
  v_is_passed boolean;
  v_passing_score int;
  v_quiz_type text;
  v_user_name text;
  v_user_email text;
  v_new_cert_id uuid;
  v_cert_code text;
begin
  v_percentage := (p_score::numeric / NULLIF(p_total_score, 0)) * 100;
  select passing_score, quiz_type into v_passing_score, v_quiz_type from quizzes where id = p_quiz_id;
  v_is_passed := v_percentage >= COALESCE(v_passing_score, 70);

  -- Create attempt
  insert into quiz_attempts (user_id, quiz_id, status, submitted_at, time_taken_seconds, score, total_score, percentage, is_passed)
  values (auth.uid(), p_quiz_id, 'submitted', now(), p_time_taken, p_score, p_total_score, v_percentage, v_is_passed)
  returning id into v_attempt_id;

  -- If passed and quiz is certifiable, create certificate
  if v_is_passed and exists (select 1 from quizzes where id = p_quiz_id and is_certified = true) then
    select full_name into v_user_name from profiles where id = auth.uid();
    v_cert_code := 'NH-' || upper(substring(md5(random()::text), 1, 8)) || '-' || extract(year from now());
    
    insert into certificates (user_id, quiz_id, certificate_code, title, score, max_score, percentage, grade)
    values (auth.uid(), p_quiz_id, v_cert_code, 'Certificate of Completion - ' || v_user_name, p_score, p_total_score, v_percentage,
      case when v_percentage >= 90 then 'A' when v_percentage >= 80 then 'B' when v_percentage >= 70 then 'C' else 'D' end)
    returning id into v_new_cert_id;

    update quiz_attempts set certificate_id = v_new_cert_id where id = v_attempt_id;
  end if;

  return query select v_attempt_id, v_is_passed, v_percentage, v_new_cert_id;
end;
$$;

-- Get user dashboard stats
create or replace function get_user_stats(p_user_id uuid)
returns json language plpgsql stable as $$
declare
  v_result json;
begin
  select json_build_object(
    'articles_read', coalesce((select count(*) from reading_history where user_id = p_user_id), 0),
    'bookmarks', coalesce((select count(*) from bookmarks where user_id = p_user_id), 0),
    'comments', coalesce((select count(*) from comments where user_id = p_user_id and status = 'approved' and deleted_at is null), 0),
    'quizzes_completed', coalesce((select count(*) from quiz_attempts where user_id = p_user_id and status = 'submitted'), 0),
    'quizzes_passed', coalesce((select count(*) from quiz_attempts where user_id = p_user_id and is_passed = true), 0),
    'certificates_earned', coalesce((select count(*) from certificates where user_id = p_user_id and revoked_at is null), 0),
    'ai_chats', coalesce((select count(*) from ai_chat_sessions where user_id = p_user_id), 0),
    'orders', coalesce((select count(*) from orders where user_id = p_user_id), 0),
    'total_spent', coalesce((select sum(total) from orders where user_id = p_user_id and payment_status = 'paid'), 0),
    'subscription_active', exists (select 1 from subscriptions where user_id = p_user_id and status in ('active','trial') and current_period_end > now()),
    'reading_time_hours', coalesce((select sum(time_spent_seconds) / 3600.0 from reading_history where user_id = p_user_id), 0)
  ) into v_result;
  
  return v_result;
end;
$$;

-- Get admin dashboard stats
create or replace function get_admin_stats()
returns json language plpgsql stable security definer as $$
declare
  v_result json;
begin
  select json_build_object(
    'total_users', (select count(*) from profiles where deleted_at is null),
    'new_users_today', (select count(*) from profiles where deleted_at is null and created_at::date = current_date),
    'published_articles', (select count(*) from articles where status = 'published' and deleted_at is null),
    'draft_articles', (select count(*) from articles where status = 'draft' and deleted_at is null),
    'scheduled_articles', (select count(*) from articles where status = 'scheduled' and deleted_at is null),
    'total_books', (select count(*) from books where deleted_at is null),
    'total_courses', (select count(*) from courses where deleted_at is null),
    'total_quizzes', (select count(*) from quizzes where deleted_at is null),
    'total_questions', (select count(*) from question_bank where is_active = true),
    'total_drugs', (select count(*) from drug_guides where is_visible = true),
    'total_care_plans', (select count(*) from nursing_care_plans),
    'total_calculators', (select count(*) from medical_calculators where is_visible = true),
    'pending_comments', (select count(*) from comments where status = 'pending' and deleted_at is null),
    'total_certificates', (select count(*) from certificates where revoked_at is null),
    'total_subscriptions', (select count(*) from subscriptions where status in ('active','trial')),
    'total_orders', (select count(*) from orders),
    'total_revenue', coalesce((select sum(net_amount) from payments where status = 'successful'), 0),
    'monthly_revenue', coalesce((select sum(net_amount) from payments where status = 'successful' and paid_at >= date_trunc('month', now())), 0),
    'pending_orders', (select count(*) from orders where status = 'pending'),
    'pending_refunds', (select count(*) from refunds where status in ('pending','processing')),
    'active_affiliates', (select count(*) from affiliates where status = 'active'),
    'total_media_files', (select count(*) from media_files where deleted_at is null),
    'total_storage_bytes', (select coalesce(sum(file_size_bytes), 0) from media_files where deleted_at is null)
  ) into v_result;
  return v_result;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 21. TRIGGERS FOR AUTOMATIC COUNTERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update article comment count
create or replace function update_article_comment_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'approved' and NEW.content_type = 'article' then
    update articles set comment_count = comment_count + 1 where id = NEW.content_id;
  elsif TG_OP = 'DELETE' and OLD.status = 'approved' and OLD.content_type = 'article' then
    update articles set comment_count = greatest(0, comment_count - 1) where id = OLD.content_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'approved' and NEW.status = 'approved' and NEW.content_type = 'article' then
      update articles set comment_count = comment_count + 1 where id = NEW.content_id;
    elsif OLD.status = 'approved' and NEW.status != 'approved' and OLD.content_type = 'article' then
      update articles set comment_count = greatest(0, comment_count - 1) where id = OLD.content_id;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_comments_count
  after insert or update or delete on comments
  for each row execute function update_article_comment_count();

-- Update tag usage count
create or replace function update_tag_usage_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update tags set usage_count = usage_count + 1 where id = NEW.tag_id;
  elsif TG_OP = 'DELETE' then
    update tags set usage_count = greatest(0, usage_count - 1) where id = OLD.tag_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_tags_count
  after insert or delete on article_tags
  for each row execute function update_tag_usage_count();

-- Update category article count
create or replace function update_category_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'published' and NEW.deleted_at is null then
    update categories set article_count = article_count + 1 where id = NEW.category_id;
  elsif TG_OP = 'DELETE' and OLD.status = 'published' and OLD.deleted_at is null then
    update categories set article_count = greatest(0, article_count - 1) where id = OLD.category_id;
  elsif TG_OP = 'UPDATE' and NEW.deleted_at is null then
    if OLD.status = 'published' and OLD.deleted_at is null then
      update categories set article_count = greatest(0, article_count - 1) where id = OLD.category_id;
    end if;
    if NEW.status = 'published' and NEW.deleted_at is null then
      update categories set article_count = article_count + 1 where id = NEW.category_id;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_category_count
  after insert or update or delete on articles
  for each row execute function update_category_count();

-- Update coupon used count
create or replace function update_coupon_used_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update coupons set used_count = used_count + 1 where id = NEW.coupon_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_coupon_count
  after insert on coupon_usage
  for each row execute function update_coupon_used_count();

-- Save article version on update
create or replace function save_article_version()
returns trigger language plpgsql as $$
begin
  if OLD.content IS DISTINCT FROM NEW.content or OLD.title IS DISTINCT FROM NEW.title then
    insert into article_versions (article_id, version_number, title, content, editor_id, is_current, change_summary)
    values (
      NEW.id,
      coalesce((select max(version_number) + 1 from article_versions where article_id = NEW.id), 1),
      NEW.title,
      NEW.content,
      auth.uid(),
      false,
      'Auto-saved on update'
    );
  end if;
  return NEW;
end;
$$;

create trigger trg_article_version
  after update on articles
  for each row execute function save_article_version();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 22. REALTIME SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add tables to Realtime publication
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table articles;
alter publication supabase_realtime add table quizzes;
alter publication supabase_realtime add table bookmarks;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 23. COMPLETION MESSAGE
-- ═══════════════════════════════════════════════════════════════════════════════

do $$
begin
  raise notice '✅ NurseHub Egypt Production Schema installed successfully!';
  raise notice '';
  raise notice '📊 Summary:';
  raise notice '  • 40+ tables created';
  raise notice '  • 9 default roles inserted';
  raise notice '  • 3 subscription plans seeded';
  raise notice '  • 10 default categories';
  raise notice '  • 10 default tags';
  raise notice '  • 3 default coupons';
  raise notice '  • Full RLS enabled on all tables';
  raise notice '  • 8 storage buckets created';
  raise notice '  • 4 views created (daily_stats, revenue_summary, top_content, ...)';
  raise notice '  • All triggers and functions installed';
  raise notice '';
  raise notice '🚀 Next steps:';
  raise notice '  1. Create your first admin user in Supabase Auth dashboard';
  raise notice '  2. Run: insert into user_roles (user_id, role_id) select ''<USER_ID>'', id from roles where name = ''super_admin'';';
  raise notice '  3. Start adding content from your app!';
end $$;
