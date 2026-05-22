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
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists accepted boolean not null default false;
alter table public.documents add column if not exists reviewed_at timestamptz;
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
