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
  created_at timestamptz not null default now()
);

create index if not exists documents_owner_id_idx on public.documents (owner_id);

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

alter table public.profiles enable row level security;
alter table public.documents enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

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
