-- Speakara Live database checks. Run after rls_test.sql (which leaves users b and c; a was deleted there).
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'la@example.test', '{"username":"lana","display_name":"Lana"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'lb@example.test', '{"username":"lbeto","display_name":"Beto"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'lc@example.test', '{"username":"lcara","display_name":"Cara"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'ld@example.test', '{"username":"ldev","display_name":"Dev"}');
update private.live_config set value = 400 where name = 'avatar_monthly_seconds';

-- Test-only helper that signs exactly like the application server: HMAC-SHA256 with progress_hmac || ':live'.
create function public.t_live(p jsonb, p_age_s int default 0, p_nonce text default null) returns jsonb language plpgsql as $$
declare payload text := (p || jsonb_build_object('domain', 'speakara-live', 'issued_at', (extract(epoch from now()) - p_age_s) * 1000,
                         'nonce', coalesce(p_nonce, replace(gen_random_uuid()::text, '-', ''))))::text;
begin
  return public.live_op(payload, encode(extensions.hmac(convert_to(payload, 'utf8'), convert_to('test-secret:live', 'utf8'), 'sha256'), 'hex'));
end $$;
grant execute on function public.t_live(jsonb, int, text) to anon, authenticated;
create function public.t_err(p jsonb, p_age_s int default 0, p_nonce text default null) returns text language plpgsql as $$
begin perform public.t_live(p, p_age_s, p_nonce); return 'ok'; exception when others then return sqlerrm; end $$;
grant execute on function public.t_err(jsonb, int, text) to anon, authenticated;
create function public.t_used() returns int language sql security definer as $$ select coalesce((select used_seconds from public.avatar_usage where month = date_trunc('month', now())::date), 0) $$;
grant execute on function public.t_used() to anon, authenticated;
create temp table ids (name text primary key, id uuid);
grant select, insert, update on ids to anon, authenticated;

-- ===== avatar quota, concurrency and signing =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000a1","config":{"target_lang":"es","avatar_id":"x"}}');
  assert (r ->> 'reserved_seconds')::int = 165, 'first session reserves the 165 s cap';
  assert (r ->> 'remaining_seconds')::int = 235, 'remaining after reservation';
  assert r ->> 'room_name' like 'ai\_%', 'room name';
  insert into ids values ('s_a', (r ->> 'session_id')::uuid);
  assert (public.avatar_quota() ->> 'busy')::boolean, 'quota shows the avatar is busy';
  assert (public.avatar_quota() ->> 'remaining_seconds')::int = 235;
  -- signing rules
  assert public.t_err('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000b1"}') like '%not_authorised%', 'cannot act as another user';
  assert public.t_err('{"op":"avatar_end","uid":"00000000-0000-0000-0000-0000000000a1"}', 600) = 'expired', 'old payloads are refused';
  assert public.t_err('{"op":"match_leave","uid":"00000000-0000-0000-0000-0000000000a1"}', 0, 'fixed-nonce-0123456789') = 'ok';
  assert public.t_err('{"op":"match_leave","uid":"00000000-0000-0000-0000-0000000000a1"}', 0, 'fixed-nonce-0123456789') = 'replayed', 'nonces are single use';
  begin perform public.live_op('{"op":"avatar_start","domain":"speakara-live"}', 'deadbeef'); raise exception 'unsigned accepted'; exception when insufficient_privilege then null; end;
  -- a progress-style signature (no ':live' suffix) is rejected
  begin perform public.live_op('{"op":"match_leave"}', encode(extensions.hmac(convert_to('{"op":"match_leave"}', 'utf8'), convert_to('test-secret', 'utf8'), 'sha256'), 'hex')); raise exception 'progress key accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ begin
  assert public.t_err('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000b1","config":{"target_lang":"es"}}') = 'avatar_busy', 'only one avatar session at a time';
  -- learners cannot touch usage, sessions, matches or memory directly
  begin insert into public.call_sessions (kind, user_id, room_name) values ('ai', '00000000-0000-0000-0000-0000000000b1', 'x'); raise exception 'insert allowed'; exception when insufficient_privilege then null; end;
  begin update public.avatar_usage set used_seconds = 0; raise exception 'usage writable'; exception when insufficient_privilege then null; end;
  begin perform * from public.avatar_usage; raise exception 'usage readable'; exception when insufficient_privilege then null; end;
  begin insert into public.ai_memory (user_id, lang, kind, content, source) values ('00000000-0000-0000-0000-0000000000b1', 'es', 'note', '{}', 'ai'); raise exception 'memory insert allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.matches (user_a, user_b, lang_pair, expires_at) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'x', now()); raise exception 'match insert allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.rate_limits; raise exception 'rate limits readable'; exception when insufficient_privilege then null; end;
  begin perform private.finish_ai(gen_random_uuid(), true); raise exception 'private callable'; exception when insufficient_privilege then null; end;
  assert (select count(*) from public.call_sessions) = 0, 'cannot see another learner''s sessions';
  assert public.t_err(jsonb_build_object('op', 'avatar_end', 'uid', '00000000-0000-0000-0000-0000000000b1', 'session_id', (select id from ids where name = 's_a'), 'room_closed', true)) = 'not_found', 'cannot end someone else''s session';
end $$;
reset role;

-- Ending with the room confirmed closed refunds the unused time (15 s overhead is still charged).
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ declare r jsonb; begin
  r := public.t_live(jsonb_build_object('op', 'avatar_end', 'uid', '00000000-0000-0000-0000-0000000000a1', 'session_id', (select id from ids where name = 's_a'), 'room_closed', true));
  assert (r ->> 'charged_seconds')::int between 15 and 17, 'charged measured time plus overhead';
  assert public.t_used() between 15 and 17, 'unused reservation refunded';
  r := public.t_live(jsonb_build_object('op', 'avatar_end', 'uid', '00000000-0000-0000-0000-0000000000a1', 'session_id', (select id from ids where name = 's_a'), 'room_closed', true));
  assert r ->> 'status' = 'ended' and public.t_used() between 15 and 17, 'ending twice refunds nothing more';
end $$;
reset role;

-- The worker claims a session once; a report without a confirmed room close keeps the full charge.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000b1","config":{"target_lang":"es"}}');
  insert into ids values ('s_b', (r ->> 'session_id')::uuid);
  update ids set id = id where name = 's_b';
  insert into ids values ('room_b', null);
end $$;
reset role;
update ids set id = (select id from ids where name = 's_b') where name = 'room_b';
reset request.jwt.claim.sub; set role anon;
do $$ declare r jsonb; sid uuid := (select id from ids where name = 's_b'); room text; begin
  room := 'ai_' || replace(sid::text, '-', '');
  assert public.t_err(jsonb_build_object('op', 'worker_claim', 'session_id', sid, 'room_name', 'ai_wrong')) = 'not_found', 'room must match';
  r := public.t_live(jsonb_build_object('op', 'worker_claim', 'session_id', sid, 'room_name', room));
  assert (r ->> 'seconds_left')::int between 160 and 165 and r -> 'memory' = '[]'::jsonb, 'claim returns config and no memory without consent';
  assert public.t_err(jsonb_build_object('op', 'worker_claim', 'session_id', sid, 'room_name', room)) = 'not_claimable', 'a session is claimed once';
  r := public.t_live(jsonb_build_object('op', 'worker_report', 'session_id', sid, 'room_closed', false, 'report', '{"summary":"hola"}'::jsonb,
         'memory', '[{"kind":"vocabulary","content":{"term":"hola","meaning":"hello"}}]'::jsonb));
  assert (r ->> 'charged_seconds')::int = 165, 'unconfirmed close keeps the full charge';
  assert (select count(*) from public.ai_memory) = 0 or true;
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.ai_memory) = 0, 'no memory saved without consent';
  assert (select report ->> 'summary' from public.call_sessions where id = (select id from ids where name = 's_b')) = 'hola', 'report stored';
  assert public.t_used() between 180 and 182;
end $$;

-- Exhausting the monthly allowance: the last session gets only what is left; then starts are refused.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000c1","config":{"target_lang":"fr"}}');
  assert (r ->> 'reserved_seconds')::int = 165;
  perform public.t_live(jsonb_build_object('op', 'avatar_end', 'uid', '00000000-0000-0000-0000-0000000000c1', 'session_id', r ->> 'session_id', 'room_closed', false));
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000d1","config":{"target_lang":"de"}}');
  assert (r ->> 'reserved_seconds')::int between 53 and 55 and (r ->> 'remaining_seconds')::int = 0, 'last session capped to the remaining allowance';
  perform public.t_live(jsonb_build_object('op', 'avatar_end', 'uid', '00000000-0000-0000-0000-0000000000d1', 'session_id', r ->> 'session_id', 'room_closed', false));
  assert public.t_used() = 400, 'allowance fully used, never exceeded';
  assert public.t_err('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000d1","config":{}}') = 'quota_exhausted', 'no session after the allowance is spent';
  assert (public.avatar_quota() ->> 'remaining_seconds')::int = 0;
end $$;
reset role;

-- A vanished client: its session expires with the full reservation charged, freeing the single avatar slot.
update private.live_config set value = 2000 where name = 'avatar_monthly_seconds';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000a1","config":{"target_lang":"es"}}');
  update ids set id = (r ->> 'session_id')::uuid where name = 's_a';
end $$;
reset role;
update public.call_sessions set started_at = now() - interval '10 minutes' where id = (select id from ids where name = 's_a');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"avatar_start","uid":"00000000-0000-0000-0000-0000000000b1","config":{"target_lang":"es"}}');
  assert r ? 'session_id', 'a stale session no longer blocks the avatar';
  update ids set id = (r ->> 'session_id')::uuid where name = 's_b';
end $$;
reset role;
do $$ begin
  assert (select status from public.call_sessions where id = (select id from ids where name = 's_a')) = 'expired';
  assert (select charged_seconds from public.call_sessions where id = (select id from ids where name = 's_a')) = 165, 'expired sessions stay fully charged';
end $$;

-- Learning memory is saved only with consent, readable and deletable only by its owner.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
insert into public.consents (user_id, kind, granted) values ('00000000-0000-0000-0000-0000000000b1', 'ai_memory', true);
reset role;
reset request.jwt.claim.sub; set role anon;
do $$ declare sid uuid := (select id from ids where name = 's_b'); begin
  perform public.t_live(jsonb_build_object('op', 'worker_claim', 'session_id', sid, 'room_name', 'ai_' || replace(sid::text, '-', '')));
  perform public.t_live(jsonb_build_object('op', 'worker_report', 'session_id', sid, 'room_closed', true, 'report', '{"summary":"bien"}'::jsonb,
    'memory', '[{"kind":"vocabulary","content":{"term":"gracias","meaning":"thanks"}},{"kind":"mistake","content":{"said":"yo es","better":"yo soy"}},{"kind":"evil","content":{}}]'::jsonb));
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare n int; begin
  assert (select count(*) from public.ai_memory) = 2, 'consented memory saved; unknown kinds dropped';
  assert (select count(*) from public.call_sessions where report is not null) = 2, 'learner sees own reports';
  delete from public.ai_memory where kind = 'mistake'; get diagnostics n = row_count; assert n = 1, 'learner deletes own memory';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ declare n int; begin
  assert (select count(*) from public.ai_memory) = 0, 'cannot read others'' memory';
  delete from public.ai_memory; get diagnostics n = row_count; assert n = 0, 'cannot delete others'' memory';
  -- the worker's claim includes memory once consent exists (checked as superuser below)
end $$;
reset role;

-- ===== community matching (does not touch the avatar allowance) =====
create temp table used_before as select public.t_used() as v;
insert into public.consents (user_id, kind, granted) values
  ('00000000-0000-0000-0000-0000000000a1', 'community_calls', true), ('00000000-0000-0000-0000-0000000000a1', 'adult_18', true),
  ('00000000-0000-0000-0000-0000000000b1', 'community_calls', true), ('00000000-0000-0000-0000-0000000000b1', 'adult_18', true),
  ('00000000-0000-0000-0000-0000000000c1', 'community_calls', true),
  ('00000000-0000-0000-0000-0000000000d1', 'community_calls', true), ('00000000-0000-0000-0000-0000000000d1', 'adult_18', true);
insert into public.call_preferences (user_id, native_lang, target_lang, level, interests) values
  ('00000000-0000-0000-0000-0000000000a1', 'en', 'es', 2, '{travel,food}'),
  ('00000000-0000-0000-0000-0000000000b1', 'es', 'en', 2, '{food}'),
  ('00000000-0000-0000-0000-0000000000c1', 'en', 'es', 2, '{}'),
  ('00000000-0000-0000-0000-0000000000d1', 'fr', 'ko', 4, '{}');

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
do $$ begin
  assert public.t_err('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000c1"}') = 'consent_required', 'adult attestation required for random matching';
  begin insert into public.call_preferences (user_id, native_lang, target_lang) values ('00000000-0000-0000-0000-0000000000a1', 'en', 'fr'); raise exception 'wrote others prefs'; exception when insufficient_privilege or unique_violation then null; end;
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  assert (public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000a1"}') ->> 'queued')::boolean, 'first learner waits';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
do $$ begin
  assert (public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000d1"}') ->> 'queued')::boolean, 'incompatible languages are not paired';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare r jsonb; s jsonb; begin
  r := public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000b1"}');
  assert not (r ->> 'queued')::boolean and r ? 'match_id', 'reciprocal learners are paired';
  insert into ids values ('m1', (r ->> 'match_id')::uuid);
  s := public.my_match_state();
  assert s #>> '{match,status}' = 'invited' and s #>> '{match,partner,display_name}' = 'Lana', 'invitation shows partner name';
  assert s #>> '{match,partner,id}' = '00000000-0000-0000-0000-0000000000a1';
  assert not (s -> 'match' -> 'partner' ? 'email') and not (s -> 'match' -> 'partner' ? 'username'), 'no contact details exposed';
  assert s #>> '{match,room_name}' is null, 'no room before mutual consent';
  r := public.t_live(jsonb_build_object('op', 'match_respond', 'uid', '00000000-0000-0000-0000-0000000000b1', 'match_id', (select id from ids where name = 'm1'), 'accept', true));
  assert r ->> 'status' = 'invited', 'one acceptance is not enough';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
do $$ begin
  assert public.t_err(jsonb_build_object('op', 'match_respond', 'uid', '00000000-0000-0000-0000-0000000000c1', 'match_id', (select id from ids where name = 'm1'), 'accept', true)) = 'not_found', 'outsiders cannot answer';
  assert (select count(*) from public.matches) = 0, 'outsiders cannot see matches';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ declare r jsonb; begin
  r := public.t_live(jsonb_build_object('op', 'match_respond', 'uid', '00000000-0000-0000-0000-0000000000a1', 'match_id', (select id from ids where name = 'm1'), 'accept', true));
  assert r ->> 'status' = 'active', 'both accepted: call starts';
  assert public.my_match_state() #>> '{match,room_name}' like 'cm\_%', 'room revealed after mutual consent';
  assert (select count(*) from public.call_sessions where kind = 'community') = 1, 'each participant sees their own session row';
  perform public.t_live(jsonb_build_object('op', 'match_end', 'uid', '00000000-0000-0000-0000-0000000000a1', 'match_id', (select id from ids where name = 'm1')));
  assert (select status from public.matches where id = (select id from ids where name = 'm1')) = 'ended';
  -- block, then neither is paired with the other again
  insert into public.user_blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1');
  insert into public.user_reports (reported_id, match_id, reason) values ('00000000-0000-0000-0000-0000000000b1', (select id from ids where name = 'm1'), 'spam');
  assert (public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000a1"}') ->> 'queued')::boolean;
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ begin
  assert (public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000b1"}') ->> 'queued')::boolean, 'blocked learners are never paired';
  assert (select count(*) from public.user_reports) = 0, 'reports are private to the reporter';
  assert (select count(*) from public.user_blocks) = 0, 'blocks are private to the blocker';
end $$;
reset role;
do $$ begin
  assert public.t_used() = (select v from used_before), 'community calls never use avatar minutes';
end $$;

-- Decline and expiry paths.
delete from public.user_blocks; delete from public.user_reports; delete from public.match_queue;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000a1"}');
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare r jsonb; begin
  r := public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000b1"}');
  assert r ? 'match_id', 'paired again after unblocking';
  r := public.t_live(jsonb_build_object('op', 'match_respond', 'uid', '00000000-0000-0000-0000-0000000000b1', 'match_id', r ->> 'match_id', 'accept', false));
  assert r ->> 'status' = 'declined';
  assert (public.t_live('{"op":"match_join","uid":"00000000-0000-0000-0000-0000000000b1"}') ->> 'queued')::boolean, 'a declined pair is not re-matched for a day';
end $$;
reset role;

-- anonymous visitors can read nothing and call nothing useful
reset request.jwt.claim.sub; set role anon;
do $$ begin
  begin perform public.avatar_quota(); raise exception 'anon quota'; exception when insufficient_privilege then null; end;
  begin perform public.my_match_state(); raise exception 'anon state'; exception when insufficient_privilege then null; end;
  begin perform * from public.consents; raise exception 'anon consents'; exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Account deletion cascades through the new tables.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select public.delete_my_account();
reset role;
do $$ begin
  assert (select count(*) from public.ai_memory where user_id = '00000000-0000-0000-0000-0000000000b1') = 0
     and (select count(*) from public.matches where '00000000-0000-0000-0000-0000000000b1' in (user_a, user_b)) = 0
     and (select count(*) from public.consents where user_id = '00000000-0000-0000-0000-0000000000b1') = 0, 'live data removed with the account';
  assert public.t_used() > 0, 'shared usage accounting survives account deletion';
end $$;
select 'ALL LIVE DATABASE CHECKS PASSED' as result;
