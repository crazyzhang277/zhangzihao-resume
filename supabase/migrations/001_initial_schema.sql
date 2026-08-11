begin;

create schema if not exists private;

create function private.is_content_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner', false);
$$;

revoke all on function private.is_content_owner() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_content_owner() to authenticated;

create table public.profile_content (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profile_content_one_published_idx on public.profile_content (published) where published;
create index profile_content_published_idx on public.profile_content (published);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  github_id bigint not null unique,
  name text not null,
  description text not null default '',
  html_url text not null,
  language text,
  topics text[] not null default '{}',
  stars integer not null default 0 check (stars >= 0),
  forks integer not null default 0 check (forks >= 0),
  updated_at timestamptz not null,
  source text not null default 'github' check (source in ('github', 'manual')),
  fork boolean not null default false,
  archived boolean not null default false,
  stale boolean not null default false,
  visible boolean not null default true,
  featured_rank integer check (featured_rank is null or featured_rank >= 0),
  manual_title text,
  manual_description text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  record_updated_at timestamptz not null default now()
);

create index projects_visible_idx on public.projects (visible);
create index projects_featured_rank_idx on public.projects (featured_rank);
create index projects_updated_at_idx on public.projects (updated_at desc);

create table public.project_exclusions (
  id uuid primary key default gen_random_uuid(),
  github_id bigint unique,
  repository_slug text unique,
  reason text not null,
  created_at timestamptz not null default now(),
  check (github_id is not null or repository_slug is not null),
  check (repository_slug is null or repository_slug = lower(repository_slug))
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status text not null check (status in ('success', 'error')),
  fetched integer not null default 0 check (fetched >= 0),
  written integer not null default 0 check (written >= 0),
  filtered integer not null default 0 check (filtered >= 0),
  error text,
  created_at timestamptz not null default now(),
  check ((status = 'success' and error is null) or (status = 'error' and error is not null))
);

create index sync_runs_finished_at_idx on public.sync_runs (finished_at desc);

insert into public.project_exclusions (repository_slug, reason)
values ('zeroaigen-auto-mention', 'Permanently excluded by application contract')
on conflict (repository_slug) do update set reason = excluded.reason;

alter table public.profile_content enable row level security;
alter table public.projects enable row level security;
alter table public.project_exclusions enable row level security;
alter table public.sync_runs enable row level security;

create policy "public can read published profile content"
on public.profile_content
for select
to anon, authenticated
using (published);

create policy "owner can manage profile content"
on public.profile_content
for all
to authenticated
using (private.is_content_owner())
with check (private.is_content_owner());

create policy "public can read visible projects"
on public.projects
for select
to anon, authenticated
using (visible);

create policy "owner can manage projects"
on public.projects
for all
to authenticated
using (private.is_content_owner())
with check (private.is_content_owner());

create policy "owner can manage exclusions"
on public.project_exclusions
for all
to authenticated
using (private.is_content_owner())
with check (private.is_content_owner());

create policy "owner can manage sync runs"
on public.sync_runs
for all
to authenticated
using (private.is_content_owner())
with check (private.is_content_owner());

grant select on public.profile_content, public.projects to anon, authenticated;
grant select, insert, update, delete on public.profile_content, public.projects, public.project_exclusions, public.sync_runs to authenticated;

commit;
