-- Reconcile the live attempts table (May-21 verdict-based draft, created via
-- the dashboard before the repo migrations existed) with the application
-- contract in web/src/lib/supabase-store.ts: passed / predicted_id /
-- model_id / model_status / reason columns, and an attempt_progress view
-- that exposes attempts/passes/fails counts.
--
-- Conservative: legacy draft columns (verdict, threshold, hint_kind,
-- model_version) keep their data but stop blocking inserts; legacy rows are
-- backfilled into the new contract.

alter table public.attempts
  add column if not exists passed boolean not null default false;
alter table public.attempts
  add column if not exists predicted_id text
  check (predicted_id is null or char_length(predicted_id) <= 128);
alter table public.attempts
  add column if not exists model_id text not null default 'unknown'
  check (char_length(model_id) between 1 and 128);
alter table public.attempts
  add column if not exists model_status text not null default 'not_trained'
  check (model_status in ('not_trained', 'trained'));
alter table public.attempts
  add column if not exists reason text not null default ''
  check (char_length(reason) <= 600);

-- Legacy draft columns: keep data, stop them from blocking inserts.
alter table public.attempts alter column verdict drop not null;
alter table public.attempts alter column threshold drop not null;
alter table public.attempts alter column model_version drop not null;
-- These exist in both schemas but the application contract allows nulls.
alter table public.attempts alter column predicted_label drop not null;
alter table public.attempts alter column duration_ms drop not null;
alter table public.attempts alter column frame_count drop not null;

-- Backfill the new contract from legacy rows.
update public.attempts
  set passed = (verdict = 'pass')
  where verdict is not null and passed = false;
update public.attempts
  set model_id = coalesce(nullif(model_version, ''), model_id)
  where model_id = 'unknown' and model_version is not null;

-- Indexes from the repo schema (no-ops when already present).
create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_vocabulary_idx
  on public.attempts (user_id, vocabulary_id);

-- attempt_progress per the application contract (counts, security invoker).
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

revoke all on public.attempt_progress from anon;
grant select on public.attempt_progress to authenticated;
