-- Lei do Mecenato - backend real Supabase
-- Colar este ficheiro no Supabase: SQL Editor > New query > Run.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('empresa', 'instituicao', 'admin')),
  email text not null,
  name text not null,
  nif text not null,
  company_activity text,
  institution_legal_name text,
  institution_category text,
  institution_logo_url text,
  consent_logo_display boolean not null default false,
  consent_rgpd boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text not null default 'empresa';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists nif text not null default '';
alter table public.profiles add column if not exists company_activity text;
alter table public.profiles add column if not exists institution_legal_name text;
alter table public.profiles add column if not exists institution_category text;
alter table public.profiles add column if not exists institution_logo_url text;
alter table public.profiles add column if not exists consent_logo_display boolean not null default false;
alter table public.profiles add column if not exists consent_rgpd boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop index if exists public.profiles_email_unique;
drop index if exists public.profiles_nif_unique;
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_nif_idx on public.profiles (nif);

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_new_user_profile();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  storage_path text not null,
  public_url text,
  mime_type text,
  size bigint not null default 0,
  accepted boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'accepted', 'rejected')),
  review_note text,
  reviewed_by text,
  review_history jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists accepted boolean not null default false;
alter table public.documents add column if not exists review_status text not null default 'pending';
alter table public.documents add column if not exists review_note text;
alter table public.documents add column if not exists reviewed_by text;
alter table public.documents add column if not exists review_history jsonb not null default '[]'::jsonb;
alter table public.documents add column if not exists reviewed_at timestamptz;
create index if not exists documents_owner_id_idx on public.documents (owner_id);
create index if not exists documents_review_status_idx on public.documents (review_status);

create table if not exists public.impact_measurements (
  proof_id text primary key,
  measurement jsonb not null,
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

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null unique,
  company_profile_id uuid references public.profiles(id) on delete set null,
  company_name text not null default '',
  company_nif text not null default '',
  company_email text not null default '',
  institution_id text,
  institution_name text not null default '',
  donation_type text,
  donation_amount numeric not null default 0,
  donation_date text,
  project_cost numeric,
  selected_need_ids text[] not null default '{}'::text[],
  report_tier_id text,
  report_tier_name text not null default '',
  report_price numeric not null default 0,
  report_vat numeric not null default 0,
  report_total numeric not null default 0,
  payment_provider text not null default 'stripe',
  payment_link_url text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  currency text not null default 'eur',
  amount_subtotal_cents integer,
  amount_tax_cents integer,
  amount_total_cents integer,
  raw_event jsonb not null default '{}'::jsonb,
  invoice_receipt_status text not null default 'pending' check (invoice_receipt_status in ('pending', 'issued', 'not_required')),
  invoice_receipt_number text,
  invoice_receipt_issued_at date,
  invoice_receipt_file_url text,
  invoice_receipt_note text,
  invoice_receipt_updated_at timestamptz,
  invoice_receipt_updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists contract_id text not null default '';
alter table public.transactions add column if not exists company_profile_id uuid references public.profiles(id) on delete set null;
alter table public.transactions add column if not exists company_name text not null default '';
alter table public.transactions add column if not exists company_nif text not null default '';
alter table public.transactions add column if not exists company_email text not null default '';
alter table public.transactions add column if not exists institution_id text;
alter table public.transactions add column if not exists institution_name text not null default '';
alter table public.transactions add column if not exists donation_type text;
alter table public.transactions add column if not exists donation_amount numeric not null default 0;
alter table public.transactions add column if not exists donation_date text;
alter table public.transactions add column if not exists project_cost numeric;
alter table public.transactions add column if not exists selected_need_ids text[] not null default '{}'::text[];
alter table public.transactions add column if not exists report_tier_id text;
alter table public.transactions add column if not exists report_tier_name text not null default '';
alter table public.transactions add column if not exists report_price numeric not null default 0;
alter table public.transactions add column if not exists report_vat numeric not null default 0;
alter table public.transactions add column if not exists report_total numeric not null default 0;
alter table public.transactions add column if not exists payment_provider text not null default 'stripe';
alter table public.transactions add column if not exists payment_link_url text;
alter table public.transactions add column if not exists stripe_checkout_session_id text;
alter table public.transactions add column if not exists stripe_payment_intent_id text;
alter table public.transactions add column if not exists stripe_customer_id text;
alter table public.transactions add column if not exists stripe_receipt_url text;
alter table public.transactions add column if not exists status text not null default 'pending';
alter table public.transactions add column if not exists currency text not null default 'eur';
alter table public.transactions add column if not exists amount_subtotal_cents integer;
alter table public.transactions add column if not exists amount_tax_cents integer;
alter table public.transactions add column if not exists amount_total_cents integer;
alter table public.transactions add column if not exists raw_event jsonb not null default '{}'::jsonb;
alter table public.transactions add column if not exists invoice_receipt_status text not null default 'pending';
alter table public.transactions add column if not exists invoice_receipt_number text;
alter table public.transactions add column if not exists invoice_receipt_issued_at date;
alter table public.transactions add column if not exists invoice_receipt_file_url text;
alter table public.transactions add column if not exists invoice_receipt_note text;
alter table public.transactions add column if not exists invoice_receipt_updated_at timestamptz;
alter table public.transactions add column if not exists invoice_receipt_updated_by uuid references public.profiles(id) on delete set null;
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists updated_at timestamptz not null default now();
create unique index if not exists transactions_contract_id_key on public.transactions (contract_id);
create unique index if not exists transactions_stripe_checkout_session_id_key on public.transactions (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create index if not exists transactions_company_profile_id_idx on public.transactions (company_profile_id);
create index if not exists transactions_company_email_idx on public.transactions (lower(company_email));
create index if not exists transactions_status_idx on public.transactions (status);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'admin' and auth.uid() is not null and not public.is_admin() then
      raise exception 'Only an existing admin can create admin profiles';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admins can change profile roles';
    end if;
    new.updated_at = now();
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  safe_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'empresa');
  safe_role := case
    when requested_role = 'instituicao' then 'instituicao'
    else 'empresa'
  end;

  insert into public.profiles (
    id,
    role,
    email,
    name,
    nif,
    company_activity,
    institution_legal_name,
    institution_category,
    consent_logo_display,
    consent_rgpd
  )
  values (
    new.id,
    safe_role,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Conta'),
    coalesce(nullif(new.raw_user_meta_data->>'nif', ''), '000000000'),
    nullif(new.raw_user_meta_data->>'company_activity', ''),
    nullif(new.raw_user_meta_data->>'institution_legal_name', ''),
    nullif(new.raw_user_meta_data->>'institution_category', ''),
    coalesce(nullif(new.raw_user_meta_data->>'consent_logo_display', '')::boolean, false),
    coalesce(nullif(new.raw_user_meta_data->>'consent_rgpd', '')::boolean, false)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (
  id,
  role,
  email,
  name,
  nif,
  company_activity,
  institution_legal_name,
  institution_category,
  consent_logo_display,
  consent_rgpd,
  created_at
)
select
  users.id,
  case
    when coalesce(users.raw_user_meta_data->>'role', 'empresa') = 'instituicao' then 'instituicao'
    else 'empresa'
  end as role,
  coalesce(users.email, '') as email,
  coalesce(nullif(users.raw_user_meta_data->>'name', ''), split_part(coalesce(users.email, ''), '@', 1), 'Conta') as name,
  coalesce(nullif(users.raw_user_meta_data->>'nif', ''), '000000000') as nif,
  nullif(users.raw_user_meta_data->>'company_activity', '') as company_activity,
  nullif(users.raw_user_meta_data->>'institution_legal_name', '') as institution_legal_name,
  nullif(users.raw_user_meta_data->>'institution_category', '') as institution_category,
  coalesce(nullif(users.raw_user_meta_data->>'consent_logo_display', '')::boolean, false) as consent_logo_display,
  coalesce(nullif(users.raw_user_meta_data->>'consent_rgpd', '')::boolean, false) as consent_rgpd,
  coalesce(users.created_at, now()) as created_at
from auth.users as users
where not exists (
  select 1 from public.profiles
  where profiles.id = users.id
);

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.impact_measurements enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (
  id = auth.uid()
  and role in ('empresa', 'instituicao')
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "documents_select_own_or_admin" on public.documents;
create policy "documents_select_own_or_admin"
on public.documents for select
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
on public.documents for insert
with check (owner_id = auth.uid());

drop policy if exists "documents_delete_own_or_admin" on public.documents;
create policy "documents_delete_own_or_admin"
on public.documents for delete
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "documents_update_admin" on public.documents;
create policy "documents_update_admin"
on public.documents for update
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "transactions_select_own_or_admin" on public.transactions;
create policy "transactions_select_own_or_admin"
on public.transactions for select
using (
  public.is_admin()
  or company_profile_id = auth.uid()
  or lower(company_email) = lower(coalesce(auth.jwt()->>'email', ''))
);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions for insert
with check (
  company_profile_id = auth.uid()
  or lower(company_email) = lower(coalesce(auth.jwt()->>'email', ''))
);

drop policy if exists "transactions_update_admin" on public.transactions;
create policy "transactions_update_admin"
on public.transactions for update
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_documents_select_own_or_admin" on storage.objects;
create policy "storage_documents_select_own_or_admin"
on storage.objects for select
using (
  bucket_id = 'documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "storage_documents_insert_own" on storage.objects;
create policy "storage_documents_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_documents_delete_own_or_admin" on storage.objects;
create policy "storage_documents_delete_own_or_admin"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "storage_images_public_read" on storage.objects;
create policy "storage_images_public_read"
on storage.objects for select
using (bucket_id = 'images');

drop policy if exists "storage_images_insert_own_or_admin" on storage.objects;
create policy "storage_images_insert_own_or_admin"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and (
    public.is_admin()
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

drop policy if exists "storage_images_update_own_or_admin" on storage.objects;
create policy "storage_images_update_own_or_admin"
on storage.objects for update
using (
  bucket_id = 'images'
  and (
    public.is_admin()
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
)
with check (
  bucket_id = 'images'
  and (
    public.is_admin()
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

drop policy if exists "storage_images_delete_own_or_admin" on storage.objects;
create policy "storage_images_delete_own_or_admin"
on storage.objects for delete
using (
  bucket_id = 'images'
  and (
    public.is_admin()
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

comment on table public.profiles is 'Perfis aplicacionais. O role e protegido por trigger; cliente comum nao pode promover contas para admin.';
comment on table public.documents is 'Documentos privados de contas. A leitura e limitada ao dono ou administrador; o estado accepted e revisto por admin.';
comment on table public.impact_measurements is 'Avaliacoes privadas ISP/IROD/ICS/SROI por donativo. Apenas administradores podem ler ou alterar.';
comment on table public.transactions is 'Transacoes Stripe persistentes associadas a donativos/relatorios, com reconciliacao e estado de fatura-recibo.';
