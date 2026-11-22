-- ISL tables: run after live_test.sql.
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e2', 'ed@example.test', '{"username":"isl_editor","display_name":"Editor"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'le@example.test', '{"username":"isl_learner","display_name":"Learner"}');
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000e2';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
do $$ begin
  insert into public.isl_sign_clips (sign_id, gloss, clip, updated_by) values ('HELLO', 'hello', '{"keys":[]}', '00000000-0000-0000-0000-0000000000e2');
  begin update public.isl_sign_clips set status = 'validated' where sign_id = 'HELLO'; raise exception 'validated without reviewer'; exception when check_violation then null; end;
  update public.isl_sign_clips set status = 'validated', reviewed_by = 'Test reviewer (Deaf ISL signer)', reviewed_at = now(), updated_by = '00000000-0000-0000-0000-0000000000e2' where sign_id = 'HELLO';
  insert into public.isl_sign_clips (sign_id, gloss, clip, updated_by) values ('MOTHER', 'mother', '{"keys":[]}', '00000000-0000-0000-0000-0000000000e2');
  assert (select count(*) from public.isl_sign_clips) = 2, 'staff see drafts';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
do $$ begin
  assert (select count(*) from public.isl_sign_clips) = 1, 'learners see only validated signs';
  begin insert into public.isl_sign_clips (sign_id, gloss, clip, updated_by) values ('FAKE', 'fake', '{}', '00000000-0000-0000-0000-0000000000f2'); raise exception 'learner authored a sign'; exception when insufficient_privilege then null; end;
  update public.isl_sign_clips set status = 'validated', reviewed_by = 'me me me', reviewed_at = now() where sign_id = 'MOTHER';
  insert into public.isl_progress (user_id, item_id, score) values ('00000000-0000-0000-0000-0000000000f2', 'spanish:es1:reading', 80);
  begin insert into public.isl_progress (user_id, item_id) values ('00000000-0000-0000-0000-0000000000e2', 'english:en1:quiz'); raise exception 'wrote others progress'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  assert (select status from public.isl_sign_clips where sign_id = 'MOTHER') = 'draft', 'learners cannot validate a sign';
end $$;
reset request.jwt.claim.sub; set role anon;
do $$ begin
  assert (select count(*) from public.isl_sign_clips) = 1, 'guests read validated signs only';
  begin perform * from public.isl_progress; raise exception 'anon read progress'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'ALL ISL DATABASE CHECKS PASSED' as result;
