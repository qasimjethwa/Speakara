-- Speakara Personal Learning Twin. Additive only: two new tables; nothing existing is altered.
-- learning_twin: the learner's explicit preferences and (with consent) a short teaching brief for the AI companion.
-- learning_events: graded answers (skill, right/wrong, item id) used to estimate mastery. No audio, video or transcripts.

create table public.learning_twin (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 8192),
  brief jsonb not null default '[]'::jsonb check (jsonb_typeof(brief) = 'array' and jsonb_array_length(brief) <= 12 and pg_column_size(brief) < 8192),
  updated_at timestamptz not null default now()
);

create table public.learning_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  at timestamptz not null,
  course text not null check (char_length(course) between 2 and 20),
  skill text not null check (skill in ('vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking', 'isl')),
  correct boolean not null,
  item text check (item is null or char_length(item) <= 60),
  topic text check (topic is null or char_length(topic) <= 80),
  source text not null check (source in ('lesson', 'practice', 'story', 'placement', 'testout', 'isl', 'diagnostic')),
  created_at timestamptz not null default now(),
  check (at <= now() + interval '1 day')
);
create index learning_events_user_at_idx on public.learning_events (user_id, at desc);

alter table public.learning_twin enable row level security;
alter table public.learning_events enable row level security;
revoke all on public.learning_twin, public.learning_events from anon, authenticated;

grant select, insert, update, delete on public.learning_twin to authenticated;
create policy "learning_twin: own" on public.learning_twin for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.learning_events to authenticated;
create policy "learning_events: read own" on public.learning_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "learning_events: add own" on public.learning_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "learning_events: delete own" on public.learning_events for delete to authenticated using ((select auth.uid()) = user_id);
