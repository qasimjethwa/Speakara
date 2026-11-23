-- Learning Twin tables: run after isl_test.sql. Two learners must never see or change each other's data.
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a7', 'a7@example.test', '{"username":"twin_a","display_name":"A"}'),
  ('00000000-0000-0000-0000-0000000000b7', 'b7@example.test', '{"username":"twin_b","display_name":"B"}');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a7';
do $$ begin
  insert into public.learning_twin (user_id, prefs, brief) values ('00000000-0000-0000-0000-0000000000a7', '{"goal":"travel"}', '["Measured weaker areas: grammar."]');
  insert into public.learning_events (user_id, at, course, skill, correct, item, source) values ('00000000-0000-0000-0000-0000000000a7', now(), 'es-en', 'grammar', false, 's1', 'lesson');
  begin insert into public.learning_events (user_id, at, course, skill, correct, source) values ('00000000-0000-0000-0000-0000000000b7', now(), 'es-en', 'grammar', true, 'lesson'); raise exception 'wrote others events'; exception when insufficient_privilege then null; end;
  begin insert into public.learning_events (user_id, at, course, skill, correct, source) values ('00000000-0000-0000-0000-0000000000a7', now(), 'es-en', 'mood', true, 'lesson'); raise exception 'bad skill accepted'; exception when check_violation then null; end;
  begin insert into public.learning_twin (user_id, brief) values ('00000000-0000-0000-0000-0000000000a7', '[1,2,3,4,5,6,7,8,9,10,11,12,13]') on conflict (user_id) do update set brief = excluded.brief; raise exception 'long brief accepted'; exception when check_violation then null; end;
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b7';
do $$ begin
  assert (select count(*) from public.learning_events) = 0, 'learner B sees no events of A';
  assert (select count(*) from public.learning_twin) = 0, 'learner B sees no twin of A';
  update public.learning_twin set brief = '[]' where user_id = '00000000-0000-0000-0000-0000000000a7';
  delete from public.learning_events where user_id = '00000000-0000-0000-0000-0000000000a7';
end $$;
reset role;
do $$ begin
  assert (select jsonb_array_length(brief) from public.learning_twin where user_id = '00000000-0000-0000-0000-0000000000a7') = 1, 'B cannot change A';
  assert (select count(*) from public.learning_events where user_id = '00000000-0000-0000-0000-0000000000a7') = 1, 'B cannot delete A events';
end $$;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a7';
do $$ begin
  begin update public.learning_events set correct = true; raise exception 'events are editable'; exception when insufficient_privilege then null; end;
  delete from public.learning_events; assert (select count(*) from public.learning_events) = 0, 'A can delete own history';
end $$;
reset role; reset request.jwt.claim.sub; set role anon;
do $$ begin
  begin perform * from public.learning_twin; raise exception 'anon read twin'; exception when insufficient_privilege then null; end;
  begin perform * from public.learning_events; raise exception 'anon read events'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'ALL LEARNING TWIN DATABASE CHECKS PASSED' as result;
