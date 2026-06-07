-- Campos de revisão documental para a área admin.
-- Permite aceitar/rejeitar documentos com motivo, data, utilizador e histórico.

alter table public.documents add column if not exists review_status text not null default 'pending';
alter table public.documents add column if not exists review_note text;
alter table public.documents add column if not exists reviewed_by text;
alter table public.documents add column if not exists review_history jsonb not null default '[]'::jsonb;
alter table public.documents add column if not exists accepted boolean not null default false;
alter table public.documents add column if not exists reviewed_at timestamptz;

update public.documents
set review_status = case when accepted then 'accepted' else 'pending' end
where review_status is null or review_status = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_review_status_check'
      and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents
      add constraint documents_review_status_check
      check (review_status in ('pending', 'accepted', 'rejected'));
  end if;
end $$;

create index if not exists documents_review_status_idx on public.documents (review_status);
