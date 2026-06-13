create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id text not null check (char_length(vocabulary_id) between 1 and 128),
  passed boolean not null default false,
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  predicted_id text check (predicted_id is null or char_length(predicted_id) <= 128),
  predicted_label text check (predicted_label is null or char_length(predicted_label) <= 128),
  model_id text not null check (char_length(model_id) between 1 and 128),
  model_status text not null check (model_status in ('not_trained', 'trained')),
  hint text not null default '' check (char_length(hint) <= 600),
  reason text not null default '' check (char_length(reason) <= 600),
  duration_ms integer check (duration_ms is null or (duration_ms >= 0 and duration_ms <= 30000)),
  frame_count integer check (frame_count is null or (frame_count >= 1 and frame_count <= 256)),
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_vocabulary_idx on public.attempts (user_id, vocabulary_id);

alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own"
on public.attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own"
on public.attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop view if exists public.attempt_progress;
create view public.attempt_progress
with (security_invoker = true)
as
select
  attempts.user_id,
  attempts.vocabulary_id,
  count(*)::integer as attempts,
  count(*) filter (where attempts.passed)::integer as passes,
  count(*) filter (where not attempts.passed)::integer as fails,
  max(attempts.created_at) as last_attempt_at
from public.attempts
group by attempts.user_id, attempts.vocabulary_id;

revoke all on public.profiles from anon;
revoke all on public.attempts from anon;
revoke all on public.attempt_progress from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.attempts to authenticated;
grant select on public.attempt_progress to authenticated;
