-- Real site traffic tracking: visitors, live presence, app installs.
-- Run once in the Supabase SQL Editor. Safe to re-run.

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null check (length(visitor_id) between 8 and 64),
  session_id text check (session_id is null or length(session_id) <= 64),
  path text not null check (length(path) <= 300),
  device_type text check (device_type in ('mobile','tablet','desktop')),
  source text check (source is null or length(source) <= 40),
  is_app boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor_id, created_at desc);

create table if not exists public.site_pings (
  id bigint generated always as identity primary key,
  visitor_id text not null check (length(visitor_id) between 8 and 64),
  path text check (path is null or length(path) <= 300),
  device_type text check (device_type in ('mobile','tablet','desktop')),
  is_app boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists site_pings_created_idx on public.site_pings (created_at desc);

create table if not exists public.site_installs (
  id bigint generated always as identity primary key,
  visitor_id text not null check (length(visitor_id) between 8 and 64),
  kind text not null check (kind in ('install_click','installed','apk_download','app_open')),
  platform text check (platform is null or length(platform) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists site_installs_created_idx on public.site_installs (created_at desc);

alter table public.site_visits enable row level security;
alter table public.site_pings enable row level security;
alter table public.site_installs enable row level security;

drop policy if exists site_visits_insert on public.site_visits;
drop policy if exists site_pings_insert on public.site_pings;
drop policy if exists site_installs_insert on public.site_installs;
drop policy if exists site_visits_admin_read on public.site_visits;
drop policy if exists site_pings_admin_read on public.site_pings;
drop policy if exists site_installs_admin_read on public.site_installs;
create policy site_visits_insert on public.site_visits for insert to anon, authenticated with check (true);
create policy site_pings_insert on public.site_pings for insert to anon, authenticated with check (true);
create policy site_installs_insert on public.site_installs for insert to anon, authenticated with check (true);
create policy site_visits_admin_read on public.site_visits for select to authenticated using (public.is_admin());
create policy site_pings_admin_read on public.site_pings for select to authenticated using (public.is_admin());
create policy site_installs_admin_read on public.site_installs for select to authenticated using (public.is_admin());

create or replace function public.admin_site_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  tz constant text := 'Africa/Cairo';
  today date := (now() at time zone tz)::date;
  res jsonb;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  delete from public.site_pings where created_at < now() - interval '3 days';
  select jsonb_build_object(
    'generated_at', now(),
    'online_now', (select count(distinct visitor_id) from (
        select visitor_id from site_pings where created_at > now() - interval '2 minutes'
        union all select visitor_id from site_visits where created_at > now() - interval '2 minutes') o),
    'online_app', (select count(distinct visitor_id) from (
        select visitor_id from site_pings where is_app and created_at > now() - interval '2 minutes'
        union all select visitor_id from site_visits where is_app and created_at > now() - interval '2 minutes') o),
    'today', jsonb_build_object(
      'visitors', (select count(distinct visitor_id) from site_visits where (created_at at time zone tz)::date = today),
      'views', (select count(*) from site_visits where (created_at at time zone tz)::date = today),
      'new_visitors', (select count(*) from (select visitor_id, min(created_at) f from site_visits group by visitor_id) v where (f at time zone tz)::date = today),
      'installs', (select count(distinct visitor_id) from site_installs where kind in ('installed','apk_download') and (created_at at time zone tz)::date = today),
      'app_users', (select count(distinct visitor_id) from site_visits where is_app and (created_at at time zone tz)::date = today)),
    'yesterday', jsonb_build_object(
      'visitors', (select count(distinct visitor_id) from site_visits where (created_at at time zone tz)::date = today - 1),
      'views', (select count(*) from site_visits where (created_at at time zone tz)::date = today - 1)),
    'totals', jsonb_build_object(
      'visitors', (select count(distinct visitor_id) from site_visits),
      'views', (select count(*) from site_visits),
      'installers', (select count(distinct visitor_id) from site_installs where kind in ('installed','apk_download')),
      'since', (select min(created_at) from site_visits)),
    'daily', coalesce((select jsonb_agg(d order by d->>'day') from (
        select jsonb_build_object('day', g.day::date, 'visitors', coalesce(v.visitors,0), 'views', coalesce(v.views,0), 'installs', coalesce(i.installs,0)) d
        from generate_series(today - 29, today, interval '1 day') as g(day)
        left join (select (created_at at time zone tz)::date as dy, count(distinct visitor_id) as visitors, count(*) as views from site_visits group by 1) v on v.dy = g.day::date
        left join (select (created_at at time zone tz)::date as dy, count(distinct visitor_id) as installs from site_installs where kind in ('installed','apk_download') group by 1) i on i.dy = g.day::date) x), '[]'::jsonb),
    'monthly', coalesce((select jsonb_agg(m order by m->>'month' desc) from (
        select jsonb_build_object('month', to_char(g.mon,'YYYY-MM'), 'visitors', coalesce(v.visitors,0), 'views', coalesce(v.views,0), 'installs', coalesce(i.installs,0), 'app_users', coalesce(v.app_users,0)) m
        from generate_series(date_trunc('month', today::timestamp) - interval '11 months', date_trunc('month', today::timestamp), interval '1 month') as g(mon)
        left join (select date_trunc('month', created_at at time zone tz) as mo, count(distinct visitor_id) as visitors, count(*) as views, count(distinct visitor_id) filter (where is_app) as app_users from site_visits group by 1) v on v.mo = g.mon
        left join (select date_trunc('month', created_at at time zone tz) as mo, count(distinct visitor_id) as installs from site_installs where kind in ('installed','apk_download') group by 1) i on i.mo = g.mon) y), '[]'::jsonb),
    'installs_by_kind', coalesce((select jsonb_object_agg(kind, c) from (select kind, count(*) c from site_installs group by kind) k), '{}'::jsonb),
    'installs_by_platform', coalesce((select jsonb_object_agg(coalesce(platform,'unknown'), c) from (select platform, count(distinct visitor_id) c from site_installs where kind in ('installed','apk_download') group by platform) k), '{}'::jsonb),
    'devices_30d', coalesce((select jsonb_object_agg(coalesce(device_type,'unknown'), c) from (select device_type, count(distinct visitor_id) c from site_visits where created_at > now() - interval '30 days' group by 1) k), '{}'::jsonb),
    'sources_30d', coalesce((select jsonb_object_agg(coalesce(source,'direct'), c) from (select source, count(distinct visitor_id) c from site_visits where created_at > now() - interval '30 days' group by 1) k), '{}'::jsonb),
    'top_pages_30d', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'views', c, 'visitors', u) order by c desc) from (
        select path, count(*) c, count(distinct visitor_id) u from site_visits where created_at > now() - interval '30 days' group by path order by c desc limit 15) t), '[]'::jsonb)
  ) into res;
  return res;
end;
$fn$;

revoke all on function public.admin_site_stats() from public, anon;
grant execute on function public.admin_site_stats() to authenticated;
