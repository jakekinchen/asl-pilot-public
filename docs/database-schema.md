# Database Schema

Default proposed provider: Supabase/Postgres. Adapt to existing backend if present.

## SQL sketch

```sql
create table if not exists profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists vocabulary_items (
  id text primary key,
  gloss text not null,
  display_prompt text not null,
  language text not null default 'ASL',
  recognition_status text not null check (recognition_status in ('active','content_only','disabled')),
  module_id text,
  hint_metadata jsonb not null default '{}'::jsonb
);

create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references profiles(id),
  started_at timestamptz default now(),
  ended_at timestamptz,
  model_version text
);

create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id),
  learner_id uuid not null references profiles(id),
  vocabulary_item_id text not null references vocabulary_items(id),
  attempt_number int not null,
  decision text not null check (decision in ('pass','fail','abstain')),
  reason text,
  confidence numeric,
  margin numeric,
  capture_quality jsonb not null default '{}'::jsonb,
  hint_id text,
  model_version text,
  created_at timestamptz default now()
);

create table if not exists mastery_states (
  learner_id uuid not null references profiles(id),
  vocabulary_item_id text not null references vocabulary_items(id),
  attempts int not null default 0,
  passes int not null default 0,
  fails int not null default 0,
  last_practiced_at timestamptz,
  status text not null default 'new',
  primary key (learner_id, vocabulary_item_id)
);
```

## privacy invariant

No table contains raw video, frame blobs, or remote video URLs.
