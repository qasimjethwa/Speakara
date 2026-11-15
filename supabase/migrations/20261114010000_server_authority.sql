-- Server authority for progress and rewards.
-- After this migration the browser can no longer write XP, gems, streaks, completions, achievements, quests or
-- review schedules. Those change only through apply_progress(), which accepts a delta computed and HMAC-signed by the
-- application server (/api/progress) after it has re-graded the session. The signing secret lives in a private schema.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_secrets (name text primary key, value text not null);

alter table public.profiles
  add column ui_lang text not null default 'en' check (ui_lang in ('en', 'es', 'hi')),
  add column is_public boolean not null default true,
  add column role text not null default 'learner' check (role in ('learner', 'editor', 'admin')),
  add column version int not null default 0,
  add column imported boolean not null default false;

-- Learners may edit only non-reward profile columns.
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (display_name, username, native_lang, course_id, goal, level, daily_goal_xp, onboarded, settings, ui_lang, is_public)
  on public.profiles to authenticated;

-- Reward and progress tables become read-only for learners.
do $$
declare t text;
begin
  foreach t in array array['lesson_completions', 'course_unlocks', 'story_completions', 'review_items', 'mistakes', 'quest_days', 'user_achievements', 'tutor_conversations'] loop
    execute format('drop policy "%s: own rows" on public.%I', t, t);
    execute format('create policy "%s: read own" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
  end loop;
end $$;
drop policy "xp_events: append own" on public.xp_events;
drop policy "xp_events: idempotent upsert" on public.xp_events;
revoke insert, update, delete on public.xp_events from authenticated, anon;

-- Idempotency ledger: one row per applied server operation.
create table public.applied_operations (
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation_id text not null check (char_length(operation_id) between 8 and 80),
  kind text not null,
  xp int not null default 0,
  applied_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
create index applied_operations_recent_idx on public.applied_operations (user_id, applied_at desc);
alter table public.applied_operations enable row level security;
create policy "applied_operations: read own" on public.applied_operations for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.applied_operations from authenticated, anon;

create table public.friend_quest_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  week date not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, friend_id, week)
);
create index friend_quest_claims_friend_idx on public.friend_quest_claims (friend_id);
alter table public.friend_quest_claims enable row level security;
create policy "friend_quest_claims: read own" on public.friend_quest_claims for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.friend_quest_claims from authenticated, anon;

-- Applies a signed progress delta atomically. Returns 'applied' or 'duplicate'.
create function public.apply_progress(p_payload text, p_signature text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v jsonb := p_payload::jsonb;
  uid uuid := (select auth.uid());
  secret text;
  cur public.profiles%rowtype;
  p jsonb := v -> 'profile';
  r jsonb;
  session_kinds constant text[] := array['lesson', 'practice', 'story', 'testout', 'placement'];
begin
  if uid is null or (v ->> 'user_id')::uuid is distinct from uid then raise exception 'not_authorised' using errcode = '42501'; end if;
  select value into secret from private.app_secrets where name = 'progress_hmac';
  if secret is null then raise exception 'signing_not_configured'; end if;
  if encode(extensions.hmac(convert_to(p_payload, 'utf8'), convert_to(secret, 'utf8'), 'sha256'), 'hex') is distinct from lower(p_signature) then
    raise exception 'bad_signature' using errcode = '42501';
  end if;
  if abs(extract(epoch from now()) - (v ->> 'issued_at')::double precision / 1000) > 300 then raise exception 'expired'; end if;

  select * into cur from public.profiles where id = uid for update;
  if exists (select 1 from public.applied_operations where user_id = uid and operation_id = v ->> 'operation_id') then return 'duplicate'; end if;
  if (v ->> 'base_version')::int is distinct from cur.version then raise exception 'stale_state'; end if;
  if (v ->> 'kind') = any (session_kinds) and exists (
    select 1 from public.applied_operations where user_id = uid and kind = any (session_kinds) and applied_at > now() - interval '10 seconds'
  ) then raise exception 'too_fast'; end if;
  if (v ->> 'kind') = 'import' and (cur.imported or cur.xp > 0) then raise exception 'already_imported'; end if;

  update public.profiles set
    xp = coalesce((p ->> 'xp')::int, xp), gems = coalesce((p ->> 'gems')::int, gems),
    streak_count = coalesce((p ->> 'streak_count')::int, streak_count),
    streak_last_day = case when p ? 'streak_last_day' then (p ->> 'streak_last_day')::date else streak_last_day end,
    streak_freezes = coalesce((p ->> 'streak_freezes')::int, streak_freezes),
    longest_streak = coalesce((p ->> 'longest_streak')::int, longest_streak),
    stats = coalesce(p -> 'stats', stats),
    imported = imported or (v ->> 'kind') = 'import',
    version = version + 1
  where id = uid;

  for r in select * from jsonb_array_elements(coalesce(v -> 'completions', '[]')) loop
    insert into public.lesson_completions (user_id, course_id, lesson_id, count, best_accuracy, completed_at)
    values (uid, r ->> 'course_id', r ->> 'lesson_id', (r ->> 'count')::int, (r ->> 'best_accuracy')::real, (r ->> 'completed_at')::timestamptz)
    on conflict (user_id, course_id, lesson_id) do update set count = excluded.count, best_accuracy = excluded.best_accuracy, completed_at = excluded.completed_at;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'unlocks', '[]')) loop
    insert into public.course_unlocks (user_id, course_id, unit_index) values (uid, r ->> 'course_id', (r ->> 'unit_index')::int)
    on conflict (user_id, course_id) do update set unit_index = greatest(public.course_unlocks.unit_index, excluded.unit_index);
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'stories', '[]')) loop
    insert into public.story_completions (user_id, story_id, completed_at) values (uid, r ->> 'story_id', (r ->> 'completed_at')::timestamptz)
    on conflict (user_id, story_id) do update set completed_at = excluded.completed_at;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'review', '[]')) loop
    insert into public.review_items (user_id, word_key, reps, interval_days, ease, due_at, lapses, seen, last_at)
    values (uid, r ->> 'word_key', (r ->> 'reps')::int, (r ->> 'interval_days')::int, (r ->> 'ease')::real, (r ->> 'due_at')::timestamptz, (r ->> 'lapses')::int, (r ->> 'seen')::int, (r ->> 'last_at')::timestamptz)
    on conflict (user_id, word_key) do update set reps = excluded.reps, interval_days = excluded.interval_days, ease = excluded.ease, due_at = excluded.due_at, lapses = excluded.lapses, seen = excluded.seen, last_at = excluded.last_at;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'achievements', '[]')) loop
    insert into public.user_achievements (user_id, achievement_id, earned_at) values (uid, r ->> 'achievement_id', (r ->> 'earned_at')::timestamptz)
    on conflict do nothing;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'xp_events', '[]')) loop
    insert into public.xp_events (id, user_id, amount, source, created_at) values (r ->> 'id', uid, (r ->> 'amount')::int, r ->> 'source', now())
    on conflict do nothing;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'mistakes_add', '[]')) loop
    insert into public.mistakes (user_id, course_id, sentence_id) values (uid, r ->> 'course_id', r ->> 'sentence_id') on conflict do nothing;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(v -> 'mistakes_remove', '[]')) loop
    delete from public.mistakes where user_id = uid and course_id = r ->> 'course_id' and sentence_id = r ->> 'sentence_id';
  end loop;
  if v ? 'quests' then
    insert into public.quest_days (user_id, day, items) values (uid, (v -> 'quests' ->> 'day')::date, v -> 'quests' -> 'items')
    on conflict (user_id, day) do update set items = excluded.items;
  end if;
  for r in select * from jsonb_array_elements(coalesce(v -> 'conversations', '[]')) loop
    insert into public.tutor_conversations (id, user_id, scenario, course_id, messages, created_at)
    values (r ->> 'id', uid, r ->> 'scenario', r ->> 'course_id', r -> 'messages', (r ->> 'created_at')::timestamptz)
    on conflict (user_id, id) do update set messages = excluded.messages;
  end loop;
  if v ? 'friend_claim' then
    insert into public.friend_quest_claims (user_id, friend_id, week) values (uid, (v -> 'friend_claim' ->> 'friend_id')::uuid, (v -> 'friend_claim' ->> 'week')::date);
  end if;

  insert into public.applied_operations (user_id, operation_id, kind, xp) values (uid, v ->> 'operation_id', v ->> 'kind', coalesce((v ->> 'xp')::int, 0));
  return 'applied';
end $$;
revoke execute on function public.apply_progress(text, text) from public, anon;
grant execute on function public.apply_progress(text, text) to authenticated;

-- ---------- privacy-aware public projections ----------
create or replace function public.weekly_leaderboard(max_rows int default 30)
returns table (user_id uuid, display_name text, weekly_xp bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, case when p.is_public or p.id = (select auth.uid()) then p.display_name else 'Private learner' end, sum(e.amount)::bigint as weekly_xp
  from public.xp_events e join public.profiles p on p.id = e.user_id
  where e.created_at >= date_trunc('week', now())
  group by p.id, p.display_name, p.is_public
  order by weekly_xp desc, p.id
  limit least(greatest(max_rows, 1), 100)
$$;

create or replace function public.find_profiles(q text)
returns table (id uuid, username text, display_name text, xp int, streak_count int, following boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.xp, p.streak_count,
         exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.id)
  from public.profiles p
  where char_length(q) >= 2 and p.is_public and p.username like replace(replace(lower(q), '%', ''), '_', '\_') || '%' and p.id <> (select auth.uid())
  order by p.username
  limit 10
$$;

-- Discovery: active public learners the caller does not follow yet.
create function public.suggested_learners()
returns table (id uuid, username text, display_name text, xp int, streak_count int, following boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.xp, p.streak_count, false
  from public.profiles p
  where p.is_public and p.onboarded and p.id <> (select auth.uid())
    and not exists (select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.id)
  order by p.updated_at desc
  limit 5
$$;

-- Friends quest: you and each mutual friend try to earn 200 XP together in a week.
create function public.friend_quests()
returns table (friend_id uuid, display_name text, combined_xp bigint, target int, week date, claimed boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name,
         coalesce((select sum(e.amount) from public.xp_events e where e.user_id in (p.id, (select auth.uid())) and e.created_at >= date_trunc('week', now())), 0)::bigint,
         200, date_trunc('week', now())::date,
         exists (select 1 from public.friend_quest_claims c where c.user_id = (select auth.uid()) and c.friend_id = p.id and c.week = date_trunc('week', now())::date)
  from public.follows a
  join public.follows b on b.follower_id = a.followee_id and b.followee_id = a.follower_id
  join public.profiles p on p.id = a.followee_id
  where a.follower_id = (select auth.uid())
$$;

-- Data retention: a learner can erase their account and everything attached to it.
create function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'not_authorised' using errcode = '42501'; end if;
  delete from auth.users where id = (select auth.uid());
end $$;

-- ---------- administration ----------
create function public.is_staff(min_role text default 'editor') returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and (role = 'admin' or (min_role = 'editor' and role = 'editor')))
$$;

create function public.admin_overview() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff('admin') then raise exception 'not_authorised' using errcode = '42501'; end if;
  return jsonb_build_object(
    'learners', (select count(*) from public.profiles),
    'onboarded', (select count(*) from public.profiles where onboarded),
    'active_7d', (select count(distinct user_id) from public.applied_operations where applied_at > now() - interval '7 days'),
    'sessions_7d', (select count(*) from public.applied_operations where applied_at > now() - interval '7 days' and kind in ('lesson', 'practice', 'story', 'testout', 'placement')),
    'xp_7d', (select coalesce(sum(amount), 0) from public.xp_events where created_at > now() - interval '7 days'),
    'tutor_conversations', (select count(*) from public.tutor_conversations),
    'open_suggestions', (select count(*) from public.content_suggestions where status = 'open'),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'sessions', (select count(*) from public.applied_operations o where o.applied_at::date = d::date), 'signups', (select count(*) from public.profiles pr where pr.created_at::date = d::date)) order by d), '[]')
               from generate_series(current_date - 13, current_date, interval '1 day') d),
    'by_course', (select coalesce(jsonb_agg(jsonb_build_object('course', course_id, 'learners', n) order by n desc), '[]') from (select course_id, count(*) n from public.profiles where onboarded group by course_id) c),
    'top_lessons', (select coalesce(jsonb_agg(jsonb_build_object('lesson', lesson_id, 'course', course_id, 'learners', n, 'accuracy', acc) order by n desc), '[]')
                    from (select course_id, lesson_id, count(*) n, round(avg(best_accuracy)::numeric, 2) acc from public.lesson_completions group by 1, 2 order by 3 desc limit 10) l)
  );
end $$;

create function public.admin_users(q text default '', max_rows int default 50)
returns table (id uuid, username text, display_name text, role text, xp int, streak_count int, course_id text, created_at timestamptz, last_active timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff('admin') then raise exception 'not_authorised' using errcode = '42501'; end if;
  return query
    select p.id, p.username, p.display_name, p.role, p.xp, p.streak_count, p.course_id, p.created_at,
           (select max(o.applied_at) from public.applied_operations o where o.user_id = p.id)
    from public.profiles p
    where q = '' or p.username like lower(q) || '%' or lower(p.display_name) like lower(q) || '%'
    order by p.created_at desc
    limit least(greatest(max_rows, 1), 200);
end $$;

create function public.admin_set_role(target uuid, new_role text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff('admin') then raise exception 'not_authorised' using errcode = '42501'; end if;
  if new_role not in ('learner', 'editor', 'admin') then raise exception 'invalid_role'; end if;
  if target = (select auth.uid()) then raise exception 'cannot_change_own_role'; end if;
  update public.profiles set role = new_role where id = target;
end $$;

-- Content review: anyone signed in can propose a correction; editors and admins decide.
create table public.content_suggestions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  item_id text not null,
  field text not null check (field in ('t', 'n', 'alt', 'other')),
  current_text text not null check (char_length(current_text) <= 500),
  proposed_text text not null check (char_length(proposed_text) between 1 and 500),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index content_suggestions_status_idx on public.content_suggestions (status, created_at desc);
create index content_suggestions_created_by_idx on public.content_suggestions (created_by);
create index content_suggestions_reviewed_by_idx on public.content_suggestions (reviewed_by);
alter table public.content_suggestions enable row level security;
create policy "suggestions: read own or staff" on public.content_suggestions for select to authenticated using ((select auth.uid()) = created_by or (select public.is_staff('editor')));
create policy "suggestions: propose as me" on public.content_suggestions for insert to authenticated with check ((select auth.uid()) = created_by and status = 'open' and reviewed_by is null);
create policy "suggestions: staff decide" on public.content_suggestions for update to authenticated using ((select public.is_staff('editor'))) with check ((select public.is_staff('editor')));
revoke delete on public.content_suggestions from authenticated, anon;

revoke execute on function public.suggested_learners(), public.friend_quests(), public.delete_my_account(), public.is_staff(text), public.admin_overview(), public.admin_users(text, int), public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.suggested_learners(), public.friend_quests(), public.delete_my_account(), public.is_staff(text), public.admin_overview(), public.admin_users(text, int), public.admin_set_role(uuid, text) to authenticated;
