-- Lei do Mecenato - medicoes ISP/IROD/ICS persistidas no Supabase
-- Colar no Supabase SQL Editor ou aplicar via CLI.

create table if not exists public.impact_measurements (
  proof_id text primary key,
  measurement jsonb not null default '{}'::jsonb,
  donation_context jsonb not null default '{}'::jsonb,
  isp_score integer not null default 0,
  irod_score integer not null default 0,
  ics_score integer not null default 0,
  impact_score integer not null default 0,
  company_name text,
  institution_name text,
  project_name text,
  donation_amount numeric,
  project_cost numeric,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.impact_measurements add column if not exists measurement jsonb not null default '{}'::jsonb;
alter table public.impact_measurements add column if not exists donation_context jsonb not null default '{}'::jsonb;
alter table public.impact_measurements add column if not exists isp_score integer not null default 0;
alter table public.impact_measurements add column if not exists irod_score integer not null default 0;
alter table public.impact_measurements add column if not exists ics_score integer not null default 0;
alter table public.impact_measurements add column if not exists impact_score integer not null default 0;
alter table public.impact_measurements add column if not exists sroi_ratio numeric;
alter table public.impact_measurements add column if not exists sroi_value numeric;
alter table public.impact_measurements add column if not exists company_name text;
alter table public.impact_measurements add column if not exists institution_name text;
alter table public.impact_measurements add column if not exists project_name text;
alter table public.impact_measurements add column if not exists donation_amount numeric;
alter table public.impact_measurements add column if not exists project_cost numeric;
alter table public.impact_measurements add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.impact_measurements add column if not exists created_at timestamptz not null default now();
alter table public.impact_measurements add column if not exists updated_at timestamptz not null default now();

create index if not exists impact_measurements_updated_at_idx on public.impact_measurements (updated_at desc);
create index if not exists impact_measurements_impact_score_idx on public.impact_measurements (impact_score desc);
create index if not exists impact_measurements_sroi_ratio_idx on public.impact_measurements (sroi_ratio desc);

alter table public.impact_measurements enable row level security;

drop policy if exists "impact_measurements_admin_select" on public.impact_measurements;
create policy "impact_measurements_admin_select"
on public.impact_measurements for select
using (public.is_admin());

drop policy if exists "impact_measurements_admin_insert" on public.impact_measurements;
create policy "impact_measurements_admin_insert"
on public.impact_measurements for insert
with check (public.is_admin());

drop policy if exists "impact_measurements_admin_update" on public.impact_measurements;
create policy "impact_measurements_admin_update"
on public.impact_measurements for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "impact_measurements_admin_delete" on public.impact_measurements;
create policy "impact_measurements_admin_delete"
on public.impact_measurements for delete
using (public.is_admin());

comment on table public.impact_measurements is 'Avaliacoes privadas ISP/IROD/ICS/SROI por donativo. Apenas administradores podem ler ou alterar.';
