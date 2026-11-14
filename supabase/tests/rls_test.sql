-- Run after local_stub.sql and the migrations. Any failed assertion aborts with an error.
\set ON_ERROR_STOP on
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

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.lesson_completions (user_id, course_id, lesson_id, best_accuracy) values ('00000000-0000-0000-0000-00000000000a', 'es-en', 'es1.1', 1);
insert into public.xp_events (id, user_id, amount, source) values ('e1', '00000000-0000-0000-0000-00000000000a', 20, 'lesson');
insert into public.xp_events (id, user_id, amount, source) values ('e1', '00000000-0000-0000-0000-00000000000a', 20, 'lesson') on conflict (user_id, id) do update set amount = excluded.amount; -- idempotent retry
insert into public.review_items (user_id, word_key, due_at) values ('00000000-0000-0000-0000-00000000000a', 'es-en:es1.1.w1', now());
update public.profiles set xp = 20, onboarded = true where id = '00000000-0000-0000-0000-00000000000a';
insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
do $$
declare n int;
begin
  assert (select count(*) from public.profiles) = 1, 'learner sees only their own profile';
  -- writes as someone else must be rejected
  begin insert into public.lesson_completions (user_id, course_id, lesson_id, best_accuracy) values ('00000000-0000-0000-0000-00000000000b', 'es-en', 'es1.1', 1); raise exception 'RLS hole: wrote another learner''s completion';
  exception when insufficient_privilege then null; end;
  begin insert into public.xp_events (id, user_id, amount, source) values ('x', '00000000-0000-0000-0000-00000000000b', 10, 'lesson'); raise exception 'RLS hole: wrote another learner''s XP';
  exception when insufficient_privilege then null; end;
  begin insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a'); raise exception 'RLS hole: followed as someone else';
  exception when insufficient_privilege then null; end;
  begin insert into public.xp_events (id, user_id, amount, source) values ('big', '00000000-0000-0000-0000-00000000000a', 5000, 'lesson'); raise exception 'XP cap not enforced';
  exception when check_violation then null; end;
  begin update public.xp_events set amount = 50 where id = 'e1'; raise exception 'xp_events should be append-only';
  exception when raise_exception then if sqlerrm not like '%append-only%' then raise; end if; end;
  begin insert into public.profiles (id, username) values (gen_random_uuid(), 'sneaky'); raise exception 'profiles must not be insertable by clients';
  exception when insufficient_privilege then null; end;
  update public.profiles set xp = 999999 where id = '00000000-0000-0000-0000-00000000000b'; get diagnostics n = row_count;
  assert n = 0, 'cannot update another learner''s profile';
  assert (select count(*) from public.weekly_leaderboard(30)) = 1 and (select weekly_xp from public.weekly_leaderboard(30)) = 20, 'leaderboard sums weekly XP';
  assert (select count(*) from public.my_friends()) = 1, 'my_friends lists followees';
  assert (select count(*) filter (where following) = 1 and count(*) = 2 from public.find_profiles('learner')), 'find_profiles reports follow state';
  assert (select count(*) from public.find_profiles('an')) = 0, 'find_profiles excludes self';
  assert (select count(*) from public.find_profiles('%')) = 0, 'wildcards are not searchable';
end $$;

set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from public.lesson_completions) = 0 and (select count(*) from public.review_items) = 0 and (select count(*) from public.xp_events) = 0, 'other learners'' rows are invisible';
  assert (select count(*) from public.follows) = 1, 'a followee can see who follows them';
end $$;
reset role;
set role anon;
do $$ begin
  assert (select count(*) from public.profiles) = 0, 'anonymous visitors read nothing';
  begin perform public.weekly_leaderboard(5); raise exception 'anon must not call leaderboard'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin assert (select count(*) from public.lesson_completions) = 0 and (select count(*) from public.follows) = 0, 'deleting a user cascades'; end $$;
select 'ALL DATABASE CHECKS PASSED' as result;
