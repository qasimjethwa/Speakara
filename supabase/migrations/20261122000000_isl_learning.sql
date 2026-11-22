-- Speakara ISL: sign animation clips authored by ISL educators, and learners' ISL course progress.
-- Additive only: two new tables; nothing existing is altered.

create table public.isl_sign_clips (
  sign_id text primary key check (sign_id ~ '^[A-Z0-9][A-Z0-9-]{0,40}$'),
  gloss text not null check (char_length(gloss) between 1 and 80),
  clip jsonb not null check (jsonb_typeof(clip) = 'object' and pg_column_size(clip) < 262144),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'validated')),
  reviewed_by text check (reviewed_by is null or char_length(reviewed_by) between 3 and 200),
  reviewed_at timestamptz,
  reviewer_notes text not null default '' check (char_length(reviewer_notes) <= 2000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  -- a sign can only be marked validated when a Deaf ISL reviewer is named
  check (status <> 'validated' or (reviewed_by is not null and reviewed_at is not null))
);
create index isl_sign_clips_updated_by_idx on public.isl_sign_clips (updated_by);

create table public.isl_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null check (item_id ~ '^(english|spanish):[a-z0-9]{2,8}:[a-z]{3,20}$'),
  score int not null default 0 check (score between 0 and 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.isl_sign_clips enable row level security;
alter table public.isl_progress enable row level security;
revoke all on public.isl_sign_clips, public.isl_progress from anon, authenticated;

-- Everyone (including guests) may read validated signs; staff also see drafts.
grant select on public.isl_sign_clips to anon, authenticated;
create policy "isl clips: read validated" on public.isl_sign_clips for select to anon, authenticated using (status = 'validated');
create policy "isl clips: staff read all" on public.isl_sign_clips for select to authenticated using ((select public.is_staff('editor')));
-- Only staff (editor/admin) author or review clips.
grant insert, update on public.isl_sign_clips to authenticated;
create policy "isl clips: staff write" on public.isl_sign_clips for insert to authenticated with check ((select public.is_staff('editor')) and updated_by = (select auth.uid()));
create policy "isl clips: staff update" on public.isl_sign_clips for update to authenticated using ((select public.is_staff('editor'))) with check ((select public.is_staff('editor')) and updated_by = (select auth.uid()));

grant select, insert, update, delete on public.isl_progress to authenticated;
create policy "isl progress: own" on public.isl_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
