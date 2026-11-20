-- Speakara Live: AI avatar companion (LiveKit + Gemini Live + Anam) and one-to-one community language exchange.
-- Additive only: new tables and functions; nothing existing is altered or dropped.
--
-- Trust model
--  * Learners read their own rows through RLS and may edit only their own preferences, consents, blocks and reports,
--    and delete their own learning memory.
--  * Anything that costs money or pairs two people (avatar quota, sessions, matching, memory writes) changes only
--    through public.live_op(), which accepts a payload HMAC-signed by the application server. The key is derived from
--    the existing progress_hmac secret plus the suffix ':live', so a live payload can never be replayed as a progress
--    payload or the reverse. Every payload carries a one-time nonce and must be less than two minutes old.
--  * The Anam free plan allowance is shared by the whole application. It is accounted pessimistically: a session's
--    full allowance is charged when it starts and only the unused part is refunded after the room is confirmed closed.

-- ---------- configuration (server-side only) ----------
create table private.live_config (name text primary key, value int not null);
insert into private.live_config values
  ('avatar_monthly_seconds', 1680),   -- 28 of Anam's 30 free minutes; 2 minutes kept back for connection overhead
  ('avatar_session_seconds', 165),    -- hard stop 15 s before Anam's 3-minute free-plan conversation limit
  ('avatar_min_start_seconds', 45),   -- refuse to start a conversation that could only last a few seconds
  ('avatar_overhead_seconds', 15);    -- charged on top of measured time for avatar start-up and tear-down

-- ---------- learner-owned tables ----------
create table public.consents (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('ai_memory', 'community_calls', 'adult_18')),
  granted boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create table public.call_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  native_lang text not null check (native_lang ~ '^[a-z]{2}$'),
  target_lang text not null check (target_lang ~ '^[a-z]{2}$'),
  level int not null default 1 check (level between 1 and 5),
  availability jsonb not null default '{}'::jsonb check (jsonb_typeof(availability) = 'object' and pg_column_size(availability) < 2048),
  interests text[] not null default '{}' check (cardinality(interests) <= 10),
  updated_at timestamptz not null default now(),
  check (native_lang <> target_lang)
);

create table public.avatar_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  avatar_id text not null check (char_length(avatar_id) between 1 and 64),
  companion_name text not null default 'Kiko' check (char_length(companion_name) between 1 and 24),
  personality text not null default 'friendly' check (personality in ('friendly', 'calm', 'playful', 'professional')),
  teaching_style text not null default 'balanced' check (teaching_style in ('gentle', 'balanced', 'strict', 'immersive')),
  voice text not null default 'Puck' check (voice ~ '^[A-Z][a-z]{2,15}$'),
  target_lang text not null check (target_lang ~ '^[a-z]{2}$'),
  level int not null default 1 check (level between 1 and 5),
  scenario text not null default 'meet' check (scenario in ('meet', 'restaurant', 'airport', 'hotel', 'shopping', 'interview', 'everyday')),
  updated_at timestamptz not null default now()
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_idx on public.user_blocks (blocked_id);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid,
  reason text not null check (reason in ('harassment', 'inappropriate', 'spam', 'underage', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index user_reports_reporter_idx on public.user_reports (reporter_id);
create index user_reports_reported_idx on public.user_reports (reported_id);

-- ---------- server-written tables ----------
create table public.match_queue (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  native_lang text not null, target_lang text not null, level int not null, interests text[] not null default '{}',
  joined_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index match_queue_lang_idx on public.match_queue (target_lang, native_lang);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'declined', 'expired', 'ended')),
  a_accepted boolean not null default false,
  b_accepted boolean not null default false,
  room_name text,
  lang_pair text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  check (user_a <> user_b)
);
create index matches_a_idx on public.matches (user_a, created_at desc);
create index matches_b_idx on public.matches (user_b, created_at desc);

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ai', 'community')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete cascade,
  room_name text not null,
  status text not null default 'active' check (status in ('active', 'ended', 'expired', 'failed')),
  usage_month date,
  reserved_seconds int not null default 0 check (reserved_seconds >= 0),
  charged_seconds int not null default 0 check (charged_seconds >= 0),
  config jsonb not null default '{}'::jsonb,
  report jsonb,
  worker_claimed_at timestamptz,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index call_sessions_user_idx on public.call_sessions (user_id, started_at desc);
create index call_sessions_active_ai_idx on public.call_sessions (status) where kind = 'ai' and status = 'active';
create index call_sessions_match_idx on public.call_sessions (match_id);

create table public.avatar_usage (
  month date primary key,
  used_seconds int not null default 0 check (used_seconds >= 0),
  sessions int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lang text not null check (lang ~ '^[a-z]{2}$'),
  kind text not null check (kind in ('vocabulary', 'mistake', 'pronunciation', 'note')),
  content jsonb not null check (jsonb_typeof(content) = 'object' and pg_column_size(content) < 2048),
  source text not null check (source in ('ai', 'community')),
  session_id uuid references public.call_sessions (id) on delete set null,
  created_at timestamptz not null default now()
);
create index ai_memory_user_idx on public.ai_memory (user_id, lang, created_at desc);
create index ai_memory_session_idx on public.ai_memory (session_id);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits int not null
);
create table private.live_nonces (nonce text primary key, at timestamptz not null default now());

-- ---------- row level security ----------
alter table public.consents enable row level security;
alter table public.call_preferences enable row level security;
alter table public.avatar_preferences enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
alter table public.match_queue enable row level security;
alter table public.matches enable row level security;
alter table public.call_sessions enable row level security;
alter table public.avatar_usage enable row level security;
alter table public.ai_memory enable row level security;
alter table public.rate_limits enable row level security;

-- Start from nothing, then grant exactly what learners may do.
revoke all on public.consents, public.call_preferences, public.avatar_preferences, public.user_blocks, public.user_reports,
  public.match_queue, public.matches, public.call_sessions, public.avatar_usage, public.ai_memory, public.rate_limits from anon, authenticated;

grant select, insert, update, delete on public.consents, public.call_preferences, public.avatar_preferences to authenticated;
create policy "consents: own" on public.consents for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "call_preferences: own" on public.call_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "avatar_preferences: own" on public.avatar_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.user_blocks to authenticated;
create policy "blocks: own" on public.user_blocks for all to authenticated using ((select auth.uid()) = blocker_id) with check ((select auth.uid()) = blocker_id);

grant select, insert on public.user_reports to authenticated;
create policy "reports: read own" on public.user_reports for select to authenticated using ((select auth.uid()) = reporter_id or (select public.is_staff('editor')));
create policy "reports: file as me" on public.user_reports for insert to authenticated with check ((select auth.uid()) = reporter_id and status = 'open');

grant select on public.match_queue, public.call_sessions to authenticated;
create policy "match_queue: read own" on public.match_queue for select to authenticated using ((select auth.uid()) = user_id);
create policy "call_sessions: read own" on public.call_sessions for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.matches to authenticated;
create policy "matches: participants read" on public.matches for select to authenticated using ((select auth.uid()) in (user_a, user_b));

grant select, delete on public.ai_memory to authenticated;
create policy "ai_memory: read own" on public.ai_memory for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_memory: delete own" on public.ai_memory for delete to authenticated using ((select auth.uid()) = user_id);
-- avatar_usage and rate_limits: no policies, so no learner access at all.

-- ---------- helpers ----------
-- Fixed-window rate limit. Returns false when the caller is over the limit.
create function private.hit_rate(p_key text, p_limit int, p_window interval) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r public.rate_limits%rowtype;
begin
  insert into public.rate_limits as rl (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when rl.window_start < now() - p_window then 1 else rl.hits + 1 end,
    window_start = case when rl.window_start < now() - p_window then now() else rl.window_start end
  returning * into r;
  return r.hits <= p_limit;
end $$;

create function private.cfg(p_name text) returns int language sql stable security definer set search_path = '' as $$
  select value from private.live_config where name = p_name
$$;

-- Ends sessions whose clients vanished. Their full reservation stays charged, so the allowance can never be undercounted.
create function private.expire_stale_ai() returns void language sql security definer set search_path = '' as $$
  update public.call_sessions set status = 'expired', ended_at = now(), charged_seconds = reserved_seconds
  where kind = 'ai' and status = 'active' and started_at + make_interval(secs => reserved_seconds + 90) < now();
$$;

create function private.has_consent(p_uid uuid, p_kind text) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select granted from public.consents where user_id = p_uid and kind = p_kind), false)
$$;

-- Finishes an AI session and refunds the unused part only when the caller confirms the room (and so the avatar) is gone.
create function private.finish_ai(p_session uuid, p_room_closed boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.call_sessions%rowtype; charged int; refund int;
begin
  select * into s from public.call_sessions where id = p_session and kind = 'ai' for update;
  if not found then raise exception 'not_found'; end if;
  if s.status <> 'active' then return jsonb_build_object('status', s.status, 'charged_seconds', s.charged_seconds); end if;
  perform 1 from public.avatar_usage where month = s.usage_month for update;
  if p_room_closed then
    charged := least(s.reserved_seconds, ceil(extract(epoch from now() - s.started_at))::int + private.cfg('avatar_overhead_seconds'));
  else
    charged := s.reserved_seconds;
  end if;
  refund := s.reserved_seconds - charged;
  update public.call_sessions set status = 'ended', ended_at = now(), charged_seconds = charged where id = s.id;
  if refund > 0 then
    update public.avatar_usage set used_seconds = greatest(0, used_seconds - refund), updated_at = now() where month = s.usage_month;
  end if;
  return jsonb_build_object('status', 'ended', 'charged_seconds', charged);
end $$;

-- Public, non-sensitive view of the shared allowance for the "minutes left" display.
create function public.avatar_quota() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'month', date_trunc('month', now())::date,
    'monthly_seconds', private.cfg('avatar_monthly_seconds'),
    'session_seconds', private.cfg('avatar_session_seconds'),
    'remaining_seconds', greatest(0, private.cfg('avatar_monthly_seconds') - coalesce((select used_seconds from public.avatar_usage where month = date_trunc('month', now())::date), 0)),
    'busy', exists (select 1 from public.call_sessions where kind = 'ai' and status = 'active'
                    and started_at + make_interval(secs => reserved_seconds + 90) >= now()))
$$;

-- The caller's community state: queue entry and their most recent live or pending match, with the partner's public
-- projection only (display name, languages, level, interests). Also expires stale invitations and queue entries.
create function public.my_match_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); m public.matches%rowtype; partner uuid; p jsonb;
begin
  if uid is null then raise exception 'not_authorised' using errcode = '42501'; end if;
  update public.matches set status = 'expired' where status = 'invited' and expires_at < now() and uid in (user_a, user_b);
  delete from public.match_queue where user_id = uid and expires_at < now();
  select * into m from public.matches where uid in (user_a, user_b) and (status in ('invited', 'active') or (status in ('declined', 'expired', 'ended') and created_at > now() - interval '2 minutes'))
    order by created_at desc limit 1;
  if found then
    partner := case when m.user_a = uid then m.user_b else m.user_a end;
    select jsonb_build_object('id', pr.id, 'display_name', case when pr.is_public then pr.display_name else 'Learner' end,
             'native_lang', cp.native_lang, 'target_lang', cp.target_lang, 'level', cp.level, 'interests', to_jsonb(cp.interests))
      into p from public.profiles pr left join public.call_preferences cp on cp.user_id = pr.id where pr.id = partner;
  end if;
  return jsonb_build_object(
    'queued', exists (select 1 from public.match_queue where user_id = uid),
    'match', case when m.id is null then null else jsonb_build_object('id', m.id, 'status', m.status, 'room_name', case when m.status = 'active' then m.room_name end,
      'me_accepted', case when m.user_a = uid then m.a_accepted else m.b_accepted end,
      'partner_accepted', case when m.user_a = uid then m.b_accepted else m.a_accepted end,
      'expires_at', m.expires_at, 'started_at', m.started_at, 'partner', p) end);
end $$;

-- ---------- the signed entry point ----------
create function public.live_op(p_payload text, p_signature text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v jsonb := p_payload::jsonb;
  op text := v ->> 'op';
  uid uuid := nullif(v ->> 'uid', '')::uuid;
  secret text;
  v_month date := date_trunc('month', now())::date;
  s public.call_sessions%rowtype;
  m public.matches%rowtype;
  me public.call_preferences%rowtype;
  cand record;
  used int; remaining int; reserve int; elapsed int; r jsonb; n int := 0;
begin
  select value into secret from private.app_secrets where name = 'progress_hmac';
  if secret is null then raise exception 'signing_not_configured'; end if;
  if encode(extensions.hmac(convert_to(p_payload, 'utf8'), convert_to(secret || ':live', 'utf8'), 'sha256'), 'hex') is distinct from lower(p_signature) then
    raise exception 'bad_signature' using errcode = '42501';
  end if;
  if v ->> 'domain' is distinct from 'speakara-live' then raise exception 'bad_signature' using errcode = '42501'; end if;
  if abs(extract(epoch from now()) - (v ->> 'issued_at')::double precision / 1000) > 120 then raise exception 'expired'; end if;
  delete from private.live_nonces where at < now() - interval '10 minutes';
  begin
    insert into private.live_nonces (nonce) values (v ->> 'nonce');
  exception when unique_violation then raise exception 'replayed';
  end;
  if char_length(coalesce(v ->> 'nonce', '')) < 16 then raise exception 'bad_nonce'; end if;
  -- A signed-in caller must match the user the server vouched for.
  if (select auth.uid()) is not null and uid is distinct from (select auth.uid()) then raise exception 'not_authorised' using errcode = '42501'; end if;

  -- ===== AI avatar companion =====
  if op = 'avatar_start' then
    if uid is null then raise exception 'not_authorised'; end if;
    if not private.hit_rate('avatar_start:' || uid, 6, interval '1 hour') then raise exception 'rate_limited'; end if;
    insert into public.avatar_usage (month) values (v_month) on conflict do nothing;
    perform 1 from public.avatar_usage u where u.month = v_month for update;   -- serialises every start: one avatar at a time
    perform private.expire_stale_ai();
    if exists (select 1 from public.call_sessions where kind = 'ai' and status = 'active') then raise exception 'avatar_busy'; end if;
    select used_seconds into used from public.avatar_usage where avatar_usage.month = v_month;
    remaining := private.cfg('avatar_monthly_seconds') - used;
    if remaining < private.cfg('avatar_min_start_seconds') then raise exception 'quota_exhausted'; end if;
    reserve := least(private.cfg('avatar_session_seconds'), remaining);
    update public.avatar_usage set used_seconds = used_seconds + reserve, sessions = sessions + 1, updated_at = now() where avatar_usage.month = v_month;
    insert into public.call_sessions (kind, user_id, room_name, usage_month, reserved_seconds, config)
      values ('ai', uid, 'pending', v_month, reserve, coalesce(v -> 'config', '{}'::jsonb)) returning * into s;
    update public.call_sessions set room_name = 'ai_' || replace(s.id::text, '-', '') where id = s.id returning * into s;
    return jsonb_build_object('session_id', s.id, 'room_name', s.room_name, 'reserved_seconds', reserve, 'remaining_seconds', remaining - reserve);

  elsif op = 'avatar_end' then
    if uid is null then raise exception 'not_authorised'; end if;
    if not exists (select 1 from public.call_sessions where id = (v ->> 'session_id')::uuid and user_id = uid and kind = 'ai') then raise exception 'not_found'; end if;
    return private.finish_ai((v ->> 'session_id')::uuid, coalesce((v ->> 'room_closed')::boolean, false));

  elsif op = 'worker_claim' then
    -- The agent worker proves a dispatch is legitimate before it starts Gemini or the avatar. Each session is claimable once.
    select * into s from public.call_sessions where id = (v ->> 'session_id')::uuid and kind = 'ai' for update;
    if not found or s.room_name is distinct from (v ->> 'room_name') then raise exception 'not_found'; end if;
    if s.status <> 'active' or s.worker_claimed_at is not null then raise exception 'not_claimable'; end if;
    elapsed := ceil(extract(epoch from now() - s.started_at))::int;
    if elapsed >= s.reserved_seconds - 20 then raise exception 'not_claimable'; end if;
    update public.call_sessions set worker_claimed_at = now() where id = s.id;
    select coalesce(jsonb_agg(jsonb_build_object('kind', x.kind, 'content', x.content) order by x.created_at desc), '[]'::jsonb) into r
      from (select kind, content, created_at from public.ai_memory where user_id = s.user_id and lang = s.config ->> 'target_lang' order by created_at desc limit 25) x;
    return jsonb_build_object('session_id', s.id, 'config', s.config, 'seconds_left', s.reserved_seconds - elapsed,
      'memory', case when private.has_consent(s.user_id, 'ai_memory') then r else '[]'::jsonb end,
      'display_name', (select display_name from public.profiles where id = s.user_id));

  elsif op = 'worker_report' then
    select * into s from public.call_sessions where id = (v ->> 'session_id')::uuid and kind = 'ai' for update;
    if not found then raise exception 'not_found'; end if;
    if s.report is null and jsonb_typeof(v -> 'report') = 'object' and pg_column_size(v -> 'report') < 16384 then
      update public.call_sessions set report = v -> 'report' where id = s.id;
      if private.has_consent(s.user_id, 'ai_memory') then
        insert into public.ai_memory (user_id, lang, kind, content, source, session_id)
        select s.user_id, s.config ->> 'target_lang', x ->> 'kind', x -> 'content', 'ai', s.id
        from jsonb_array_elements(coalesce(v -> 'memory', '[]'::jsonb)) with ordinality as t(x, i)
        where i <= 30 and x ->> 'kind' in ('vocabulary', 'mistake', 'pronunciation', 'note') and jsonb_typeof(x -> 'content') = 'object' and pg_column_size(x -> 'content') < 2048;
      end if;
    end if;
    return private.finish_ai(s.id, coalesce((v ->> 'room_closed')::boolean, false));

  -- ===== community language exchange =====
  elsif op = 'match_join' then
    if uid is null then raise exception 'not_authorised'; end if;
    if not (private.has_consent(uid, 'community_calls') and private.has_consent(uid, 'adult_18')) then raise exception 'consent_required'; end if;
    if not private.hit_rate('match_join:' || uid, 30, interval '1 hour') then raise exception 'rate_limited'; end if;
    select * into me from public.call_preferences where user_id = uid;
    if not found then raise exception 'preferences_required'; end if;
    update public.matches set status = 'expired' where status = 'invited' and expires_at < now();
    if exists (select 1 from public.matches where uid in (user_a, user_b) and status in ('invited', 'active')) then raise exception 'already_matched'; end if;
    delete from public.match_queue where expires_at < now();
    insert into public.match_queue (user_id, native_lang, target_lang, level, interests, expires_at)
      values (uid, me.native_lang, me.target_lang, me.level, me.interests, now() + interval '3 minutes')
      on conflict (user_id) do update set native_lang = excluded.native_lang, target_lang = excluded.target_lang, level = excluded.level,
        interests = excluded.interests, expires_at = excluded.expires_at;
    select q.user_id,
           (case when q.native_lang = me.target_lang and q.target_lang = me.native_lang then 10 else 0 end)
           + (select count(*) from unnest(q.interests) i where i = any (me.interests))::int
           - abs(q.level - me.level) as score
      into cand
      from public.match_queue q
      join public.profiles pr on pr.id = q.user_id
     where q.user_id <> uid and q.expires_at >= now()
       and (q.native_lang = me.target_lang and q.target_lang = me.native_lang          -- a true exchange
            or (q.target_lang = me.target_lang and abs(q.level - me.level) <= 1))       -- or practice partners at a similar level
       and not exists (select 1 from public.user_blocks b where (b.blocker_id = uid and b.blocked_id = q.user_id) or (b.blocker_id = q.user_id and b.blocked_id = uid))
       and not exists (select 1 from public.user_reports rp where rp.status = 'open' and ((rp.reporter_id = uid and rp.reported_id = q.user_id) or (rp.reporter_id = q.user_id and rp.reported_id = uid)))
       and not exists (select 1 from public.matches pm where pm.status = 'declined' and pm.created_at > now() - interval '1 day'
                        and ((pm.user_a = uid and pm.user_b = q.user_id) or (pm.user_a = q.user_id and pm.user_b = uid)))
       and not exists (select 1 from public.matches am where q.user_id in (am.user_a, am.user_b) and am.status in ('invited', 'active'))
       and private.has_consent(q.user_id, 'community_calls') and private.has_consent(q.user_id, 'adult_18')
     order by score desc, q.joined_at asc
     limit 1
     for update of q skip locked;
    if cand.user_id is null then return jsonb_build_object('queued', true); end if;
    insert into public.matches (user_a, user_b, lang_pair, expires_at) values (uid, cand.user_id, me.native_lang || '-' || me.target_lang, now() + interval '45 seconds') returning * into m;
    delete from public.match_queue where user_id in (uid, cand.user_id);
    return jsonb_build_object('queued', false, 'match_id', m.id);

  elsif op = 'match_leave' then
    if uid is null then raise exception 'not_authorised'; end if;
    delete from public.match_queue where user_id = uid;
    return jsonb_build_object('queued', false);

  elsif op = 'match_respond' then
    if uid is null then raise exception 'not_authorised'; end if;
    select * into m from public.matches where id = (v ->> 'match_id')::uuid and uid in (user_a, user_b) for update;
    if not found then raise exception 'not_found'; end if;
    if m.status <> 'invited' or m.expires_at < now() then
      if m.status = 'invited' then update public.matches set status = 'expired' where id = m.id; end if;
      raise exception 'invitation_closed';
    end if;
    if not coalesce((v ->> 'accept')::boolean, false) then
      update public.matches set status = 'declined', ended_at = now() where id = m.id;
      return jsonb_build_object('status', 'declined');
    end if;
    if m.user_a = uid then update public.matches set a_accepted = true where id = m.id returning * into m;
    else update public.matches set b_accepted = true where id = m.id returning * into m; end if;
    if m.a_accepted and m.b_accepted then
      update public.matches set status = 'active', started_at = now(), room_name = 'cm_' || replace(m.id::text, '-', '') where id = m.id returning * into m;
      insert into public.call_sessions (kind, user_id, match_id, room_name) values ('community', m.user_a, m.id, m.room_name), ('community', m.user_b, m.id, m.room_name);
    end if;
    return jsonb_build_object('status', m.status);

  elsif op = 'match_end' then
    if uid is null then raise exception 'not_authorised'; end if;
    select * into m from public.matches where id = (v ->> 'match_id')::uuid and uid in (user_a, user_b) for update;
    if not found then raise exception 'not_found'; end if;
    if m.status in ('invited', 'active') then
      update public.matches set status = case when m.status = 'active' then 'ended' else 'declined' end, ended_at = now() where id = m.id;
      update public.call_sessions set status = 'ended', ended_at = now() where match_id = m.id and status = 'active';
    end if;
    return jsonb_build_object('status', 'ended');

  elsif op = 'memory_add' then
    -- Learner-chosen words from a community call. Stored only with consent.
    if uid is null then raise exception 'not_authorised'; end if;
    if not private.has_consent(uid, 'ai_memory') then raise exception 'consent_required'; end if;
    if not private.hit_rate('memory_add:' || uid, 30, interval '1 hour') then raise exception 'rate_limited'; end if;
    insert into public.ai_memory (user_id, lang, kind, content, source)
    select uid, v ->> 'lang', 'vocabulary', x, 'community'
    from jsonb_array_elements(coalesce(v -> 'items', '[]'::jsonb)) with ordinality as t(x, i)
    where i <= 20 and jsonb_typeof(x) = 'object' and pg_column_size(x) < 2048;
    get diagnostics n = row_count;
    return jsonb_build_object('saved', n);
  end if;
  raise exception 'unknown_op';
end $$;

revoke execute on function private.hit_rate(text, int, interval), private.cfg(text), private.expire_stale_ai(), private.has_consent(uuid, text), private.finish_ai(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.live_op(text, text), public.avatar_quota(), public.my_match_state() from public;
grant execute on function public.live_op(text, text) to anon, authenticated;     -- safe: rejects anything not signed by the server
grant execute on function public.avatar_quota(), public.my_match_state() to authenticated;
