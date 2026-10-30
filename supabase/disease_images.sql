-- Disease image overrides (admin uploads / replaces images from the public page). Already applied.
create table if not exists public.disease_images (slot text primary key, url text not null, updated_at timestamptz not null default now());
alter table public.disease_images enable row level security;
create policy "disease_images public read" on public.disease_images for select using (true);
create policy "disease_images admin write" on public.disease_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
