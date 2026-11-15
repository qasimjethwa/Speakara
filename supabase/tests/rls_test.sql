-- Run after local_stub.sql and the migrations. Any failed assertion aborts with an error.
\set ON_ERROR_STOP on
insert into private.app_secrets values ('progress_hmac', 'test-secret');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.test', '{"username":"ana","display_name":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.test', '{"username":"ana","display_name":"Ben"}'),      -- duplicate username → fallback
  ('00000000-0000-0000-0000-00000000000c', 'c@example.test', '{"username":"BAD NAME!","display_name":""}');    -- invalid → fallback
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'trigger creates a profile per user';
  assert (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'ana';
  assert (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000b') like 'learner\_%', 'duplicate username falls back';
  assert (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Learner', 'empty name falls back';
end $$;

-- Test helper (superuser only): signs a payload exactly as the application server does.
create function pg_temp.sign(p text) returns text language sql as $$ select encode(extensions.hmac(convert_to(p, 'utf8'), convert_to('test-secret', 'utf8'), 'sha256'), 'hex') $$;
create temp table signed (name text primary key, payload text, sig text);
insert into signed (name, payload) values
  ('lesson', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-lesson-1', 'kind', 'lesson', 'xp', 20, 'base_version', 0, 'issued_at', extract(epoch from now()) * 1000,
     'profile', jsonb_build_object('xp', 20, 'gems', 5, 'streak_count', 1, 'streak_last_day', current_date, 'streak_freezes', 0, 'longest_streak', 1, 'stats', '{"lessons":1}'::jsonb),
     'completions', jsonb_build_array(jsonb_build_object('course_id', 'es-en', 'lesson_id', 'es1.1', 'count', 1, 'best_accuracy', 1, 'completed_at', now())),
     'review', jsonb_build_array(jsonb_build_object('word_key', 'es-en:es1.1.w1', 'reps', 1, 'interval_days', 1, 'ease', 2.35, 'due_at', now() + interval '1 day', 'lapses', 0, 'seen', 1, 'last_at', now())),
     'achievements', jsonb_build_array(jsonb_build_object('achievement_id', 'first-lesson', 'earned_at', now())),
     'xp_events', jsonb_build_array(jsonb_build_object('id', 'e1', 'amount', 20, 'source', 'lesson')),
     'mistakes_add', jsonb_build_array(jsonb_build_object('course_id', 'es-en', 'sentence_id', 'es1.1.s2')),
     'quests', jsonb_build_object('day', current_date, 'items', '[]'::jsonb))::text),
  ('second', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-lesson-2', 'kind', 'lesson', 'xp', 10, 'base_version', 1, 'issued_at', extract(epoch from now()) * 1000, 'profile', jsonb_build_object('xp', 30))::text),
  ('stale', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-stale-01', 'kind', 'freeze', 'base_version', 0, 'issued_at', extract(epoch from now()) * 1000, 'profile', jsonb_build_object('gems', 999))::text),
  ('old', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-old-0001', 'kind', 'freeze', 'base_version', 1, 'issued_at', (extract(epoch from now()) - 3600) * 1000, 'profile', jsonb_build_object('gems', 999))::text),
  ('huge', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-huge-001', 'kind', 'freeze', 'base_version', 1, 'issued_at', extract(epoch from now()) * 1000, 'xp_events', jsonb_build_array(jsonb_build_object('id', 'big', 'amount', 5000, 'source', 'lesson')))::text),
  ('freeze', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000a', 'operation_id', 'op-freeze-1', 'kind', 'freeze', 'base_version', 1, 'issued_at', extract(epoch from now()) * 1000, 'profile', jsonb_build_object('gems', 0, 'streak_freezes', 1))::text),
  ('forb', jsonb_build_object('user_id', '00000000-0000-0000-0000-00000000000b', 'operation_id', 'op-other-01', 'kind', 'lesson', 'base_version', 0, 'issued_at', extract(epoch from now()) * 1000, 'profile', jsonb_build_object('xp', 50))::text);
update signed set sig = pg_temp.sign(payload);
grant select on signed to authenticated;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare n int; r record;
begin
  -- 1. Learners cannot write rewards or progress directly any more.
  begin update public.profiles set xp = 999999 where id = '00000000-0000-0000-0000-00000000000a'; raise exception 'HOLE: learner changed own XP';
  exception when insufficient_privilege then null; end;
  begin update public.profiles set gems = 999, role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'; raise exception 'HOLE: learner changed gems/role';
  exception when insufficient_privilege then null; end;
  begin insert into public.xp_events (id, user_id, amount, source) values ('x', '00000000-0000-0000-0000-00000000000a', 10, 'lesson'); raise exception 'HOLE: learner inserted XP';
  exception when insufficient_privilege then null; end;
  begin insert into public.lesson_completions (user_id, course_id, lesson_id, best_accuracy) values ('00000000-0000-0000-0000-00000000000a', 'es-en', 'es3.4', 1); raise exception 'HOLE: learner inserted a completion';
  exception when insufficient_privilege then null; end;
  begin insert into public.user_achievements (user_id, achievement_id) values ('00000000-0000-0000-0000-00000000000a', 'streak-30'); raise exception 'HOLE: learner inserted an achievement';
  exception when insufficient_privilege then null; end;
  begin insert into public.applied_operations (user_id, operation_id, kind) values ('00000000-0000-0000-0000-00000000000a', 'fake-op-0001', 'lesson'); raise exception 'HOLE: learner wrote the idempotency ledger';
  exception when insufficient_privilege then null; end;
  begin perform 1 from private.app_secrets; raise exception 'HOLE: learner read the signing secret';
  exception when insufficient_privilege then null; end;
  -- ...but can still edit their own non-reward profile fields.
  update public.profiles set display_name = 'Ana B', ui_lang = 'hi', is_public = true, onboarded = true where id = '00000000-0000-0000-0000-00000000000a'; get diagnostics n = row_count;
  assert n = 1, 'learner can edit safe profile columns';

  -- 2. Signature checks.
  select * into r from signed where name = 'lesson';
  begin perform public.apply_progress(r.payload, repeat('0', 64)); raise exception 'HOLE: bad signature accepted';
  exception when insufficient_privilege then null; end;
  begin perform public.apply_progress(replace(r.payload, '"xp": 20', '"xp": 50'), r.sig); raise exception 'HOLE: tampered payload accepted';
  exception when insufficient_privilege then null; end;
  begin perform public.apply_progress((select payload from signed where name = 'forb'), (select sig from signed where name = 'forb')); raise exception 'HOLE: applied a payload signed for another user';
  exception when insufficient_privilege then null; end;

  -- 3. A valid signed delta applies atomically, exactly once.
  assert public.apply_progress(r.payload, r.sig) = 'applied';
  assert (select xp = 20 and gems = 5 and streak_count = 1 and version = 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'profile rewards applied';
  assert (select count(*) from public.lesson_completions) = 1 and (select count(*) from public.review_items) = 1 and (select count(*) from public.user_achievements) = 1
     and (select sum(amount) from public.xp_events) = 20 and (select count(*) from public.mistakes) = 1 and (select count(*) from public.quest_days) = 1, 'rows written';
  assert public.apply_progress(r.payload, r.sig) = 'duplicate', 'replay is a no-op';
  assert (select xp from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 20 and (select sum(amount) from public.xp_events) = 20, 'replay awarded nothing';

  -- 4. Stale, expired, over-cap and too-fast requests are refused.
  begin perform public.apply_progress((select payload from signed where name = 'stale'), (select sig from signed where name = 'stale')); raise exception 'HOLE: stale state accepted';
  exception when raise_exception then if sqlerrm <> 'stale_state' then raise; end if; end;
  begin perform public.apply_progress((select payload from signed where name = 'old'), (select sig from signed where name = 'old')); raise exception 'HOLE: expired payload accepted';
  exception when raise_exception then if sqlerrm <> 'expired' then raise; end if; end;
  begin perform public.apply_progress((select payload from signed where name = 'huge'), (select sig from signed where name = 'huge')); raise exception 'HOLE: XP cap not enforced';
  exception when check_violation then null; end;
  assert (select version from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 1, 'a failed apply changes nothing';
  begin perform public.apply_progress((select payload from signed where name = 'second'), (select sig from signed where name = 'second')); raise exception 'HOLE: back-to-back sessions accepted';
  exception when raise_exception then if sqlerrm <> 'too_fast' then raise; end if; end;
  assert public.apply_progress((select payload from signed where name = 'freeze'), (select sig from signed where name = 'freeze')) = 'applied', 'non-session operations are not rate limited';
  assert (select gems = 0 and streak_freezes = 1 and version = 2 from public.profiles where id = '00000000-0000-0000-0000-00000000000a');

  -- 5. Social graph and public projections.
  insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
  begin insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'); raise exception 'HOLE: followed as someone else';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.profiles) = 1, 'learner sees only their own profile row';
  assert (select count(*) = 1 and max(weekly_xp) = 20 from public.weekly_leaderboard(30)), 'leaderboard sums server-written XP';
  assert (select count(*) from public.my_friends()) = 1;
  assert (select count(*) filter (where following) = 1 and count(*) = 2 from public.find_profiles('learner'));
  assert (select count(*) from public.find_profiles('an')) = 0 and (select count(*) from public.find_profiles('%')) = 0, 'self and wildcards excluded';
  assert (select count(*) from public.friend_quests()) = 0, 'friends quest needs a mutual follow';

  -- 6. Staff-only functions and content suggestions.
  begin perform public.admin_overview(); raise exception 'HOLE: learner called admin_overview'; exception when insufficient_privilege then null; end;
  begin perform * from public.admin_users('', 10); raise exception 'HOLE: learner listed users'; exception when insufficient_privilege then null; end;
  begin perform public.admin_set_role('00000000-0000-0000-0000-00000000000a', 'admin'); raise exception 'HOLE: learner promoted themselves'; exception when insufficient_privilege then null; end;
  insert into public.content_suggestions (course_id, item_id, field, current_text, proposed_text) values ('es-en', 'es1.1.w1', 'n', 'hello', 'hi');
  update public.content_suggestions set status = 'approved'; get diagnostics n = row_count;
  assert n = 0, 'learners cannot approve suggestions';
end $$;

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from public.lesson_completions) = 0 and (select count(*) from public.review_items) = 0 and (select count(*) from public.xp_events) = 0
     and (select count(*) from public.applied_operations) = 0 and (select count(*) from public.content_suggestions) = 0, 'other learners'' rows are invisible';
  assert (select count(*) from public.follows) = 1, 'a followee can see who follows them';
  insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
  assert (select combined_xp = 20 and target = 200 and not claimed from public.friend_quests()), 'mutual follow creates a friends quest';
  update public.profiles set is_public = false where id = '00000000-0000-0000-0000-00000000000b';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from public.find_profiles('learner')) = 0, 'private profiles are not discoverable';
  assert (select display_name from public.weekly_leaderboard(30)) = 'Ana B', 'leaderboard shows public names';
  assert (select count(*) from public.suggested_learners()) = 1, 'discovery lists public, onboarded learners only';
end $$;
reset role;

-- Staff: promote C to admin (done by a database owner), then use the admin surface as C.
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';
set role authenticated;
do $$ declare n int; begin
  assert (public.admin_overview() ->> 'learners')::int = 3 and (public.admin_overview() ->> 'sessions_7d')::int = 1 and (public.admin_overview() ->> 'open_suggestions')::int = 1;
  assert (select count(*) from public.admin_users('', 50)) = 3;
  perform public.admin_set_role('00000000-0000-0000-0000-00000000000b', 'editor');
  begin perform public.admin_set_role('00000000-0000-0000-0000-00000000000c', 'learner'); raise exception 'admins must not change their own role';
  exception when raise_exception then if sqlerrm <> 'cannot_change_own_role' then raise; end if; end;
  update public.content_suggestions set status = 'approved', reviewed_by = '00000000-0000-0000-0000-00000000000c'; get diagnostics n = row_count;
  assert n = 1, 'staff can decide suggestions';
end $$;
reset role;
set role anon;
do $$ begin
  assert (select count(*) from public.profiles) = 0, 'anonymous visitors read nothing';
  begin perform public.weekly_leaderboard(5); raise exception 'anon must not call leaderboard'; exception when insufficient_privilege then null; end;
  begin perform public.apply_progress('{}', ''); raise exception 'anon must not call apply_progress'; exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Account deletion removes everything the learner owned.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select public.delete_my_account();
reset role;
do $$ begin
  assert (select count(*) from auth.users) = 2 and (select count(*) from public.lesson_completions) = 0 and (select count(*) from public.xp_events) = 0
     and (select count(*) from public.follows) = 0 and (select count(*) from public.applied_operations) = 0 and (select count(*) from public.content_suggestions) = 0, 'deleting an account cascades';
end $$;
select 'ALL DATABASE CHECKS PASSED' as result;
