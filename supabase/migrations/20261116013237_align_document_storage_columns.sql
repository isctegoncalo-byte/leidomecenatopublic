-- Align the live documents table with the private Storage upload implementation.
-- Keep the legacy file_url/file_size columns so existing consumers and data remain intact.
alter table public.documents add column if not exists storage_path text;
alter table public.documents add column if not exists public_url text;
alter table public.documents add column if not exists mime_type text;
alter table public.documents add column if not exists size bigint;
