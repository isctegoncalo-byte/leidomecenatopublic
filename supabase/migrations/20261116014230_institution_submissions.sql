create table if not exists public.institution_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'confirmed', 'rejected')),
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text
);

create index if not exists institution_submissions_owner_submitted_idx
  on public.institution_submissions(owner_id, submitted_at desc);
create index if not exists institution_submissions_status_submitted_idx
  on public.institution_submissions(status, submitted_at desc);

alter table public.institution_submissions enable row level security;

drop policy if exists "Institution owners can submit registration" on public.institution_submissions;
create policy "Institution owners can submit registration"
  on public.institution_submissions for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'submitted'
    and reviewed_at is null
    and reviewed_by is null
    and review_note is null
  );

drop policy if exists "Institution owners and admins can read submissions" on public.institution_submissions;
create policy "Institution owners and admins can read submissions"
  on public.institution_submissions for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Admins can review institution submissions" on public.institution_submissions;
create policy "Admins can review institution submissions"
  on public.institution_submissions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.institution_submissions to authenticated;
revoke all on public.institution_submissions from anon;
