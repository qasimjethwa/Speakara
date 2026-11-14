-- Speakara learner core: profiles, progress, review schedule, gamification, tutor history, social graph.
-- Every table has RLS enabled. Learners can only read and write their own rows; cross-user reads go through
-- SECURITY DEFINER functions that expose a minimal public projection (display name, XP, streak).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default 'Learner' check (char_length(display_name) between 1 and 30),
  native_lang text not null default 'en',
  course_id text not null default 'es-en',
  goal text not null default '',
  level text not null default 'new' check (level in ('new', 'some')),
  daily_goal_xp int not null default 20 check (daily_goal_xp in (10, 20, 30, 50)),
  onboarded boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  xp int not null default 0 check (xp >= 0),
  gems int not null default 0 check (gems >= 0),
  streak_count int not null default 0 check (streak_count >= 0),
  streak_last_day date,
  streak_freezes int not null default 0 check (streak_freezes between 0 and 2),
  longest_streak int not null default 0 check (longest_streak >= 0),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_completions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  count int not null default 1 check (count > 0),
  best_accuracy real not null check (best_accuracy between 0 and 1),
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_id)
);

create table public.course_unlocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  unit_index int not null check (unit_index >= 0),
  primary key (user_id, course_id)
);

create table public.story_completions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  story_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- One row per (learner, word): the spaced-repetition schedule. word_key = '<course_id>:<word_id>'.
create table public.review_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_key text not null,
  reps int not null default 0 check (reps >= 0),
  interval_days int not null default 0 check (interval_days >= 0),
  ease real not null default 2.3 check (ease between 1.3 and 2.8),
  due_at timestamptz not null,
  lapses int not null default 0 check (lapses >= 0),
  seen int not null default 0 check (seen >= 0),
  last_at timestamptz not null default now(),
  primary key (user_id, word_key)
);
create index review_items_due_idx on public.review_items (user_id, due_at);

create table public.mistakes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  sentence_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, sentence_id)
);

-- Append-only XP ledger. A single session can never award more than 50 XP.
create table public.xp_events (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount between 1 and 50),
  source text not null check (source in ('lesson', 'practice', 'story', 'testout', 'tutor', 'placement')),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index xp_events_week_idx on public.xp_events (created_at, user_id);

create table public.quest_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  items jsonb not null,
  primary key (user_id, day)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.tutor_conversations (
  id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  scenario text not null,
  course_id text not null,
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array' and pg_column_size(messages) < 65536),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- ---------- row level security ----------
alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- Inserts happen only through the signup trigger; deletes cascade from auth.users.

do $$
declare t text;
begin
  foreach t in array array['lesson_completions', 'course_unlocks', 'story_completions', 'review_items', 'mistakes', 'quest_days', 'user_achievements', 'tutor_conversations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: own rows" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
  end loop;
end $$;

alter table public.xp_events enable row level security;
create policy "xp_events: read own" on public.xp_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "xp_events: append own" on public.xp_events for insert to authenticated with check ((select auth.uid()) = user_id);
-- The client upserts idempotently; an update may not change what was awarded.
create policy "xp_events: idempotent upsert" on public.xp_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.xp_events_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.amount <> old.amount or new.source <> old.source or new.created_at <> old.created_at then raise exception 'xp_events are append-only'; end if;
  return new;
end $$;
create trigger xp_events_immutable before update on public.xp_events for each row execute function public.xp_events_immutable();

alter table public.follows enable row level security;
create policy "follows: read mine" on public.follows for select to authenticated using ((select auth.uid()) in (follower_id, followee_id));
create policy "follows: follow as me" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "follows: unfollow as me" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

-- ---------- triggers ----------
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Creates the profile row when a user signs up. Falls back to a generated username if the requested one is taken or invalid.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  wanted text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  shown text := left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''), 30);
begin
  if wanted !~ '^[a-z0-9_]{3,20}$' or exists (select 1 from public.profiles where username = wanted) then
    wanted := 'learner_' || right(replace(new.id::text, '-', ''), 12);
  end if;
  insert into public.profiles (id, username, display_name) values (new.id, wanted, coalesce(shown, 'Learner'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- public projections ----------
-- Weekly league board: XP earned since Monday 00:00 UTC. Exposes display name and XP only.
create function public.weekly_leaderboard(max_rows int default 30)
returns table (user_id uuid, display_name text, weekly_xp bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name, sum(e.amount)::bigint as weekly_xp
  from public.xp_events e join public.profiles p on p.id = e.user_id
  where e.created_at >= date_trunc('week', now())
  group by p.id, p.display_name
  order by weekly_xp desc, p.id
  limit least(greatest(max_rows, 1), 100)
$$;

create function public.find_profiles(q text)
returns table (id uuid, username text, display_name text, xp int, streak_count int, following boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.xp, p.streak_count,
         exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.id)
  from public.profiles p
  where char_length(q) >= 2 and p.username like replace(replace(lower(q), '%', ''), '_', '\_') || '%' and p.id <> (select auth.uid())
  order by p.username
  limit 10
$$;

create function public.my_friends()
returns table (id uuid, username text, display_name text, xp int, streak_count int)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.xp, p.streak_count
  from public.follows f join public.profiles p on p.id = f.followee_id
  where f.follower_id = (select auth.uid())
  order by p.xp desc
$$;

revoke execute on function public.weekly_leaderboard(int), public.find_profiles(text), public.my_friends() from public, anon;
grant execute on function public.weekly_leaderboard(int), public.find_profiles(text), public.my_friends() to authenticated;
revoke execute on function public.handle_new_user(), public.touch_updated_at(), public.xp_events_immutable() from public, anon, authenticated;
