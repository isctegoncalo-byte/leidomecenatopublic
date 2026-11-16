alter table public.donations
  add column if not exists contract_reference text,
  add column if not exists institution_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists company_confirmed_amount numeric,
  add column if not exists institution_confirmed_amount numeric,
  add column if not exists rejected_by uuid references public.profiles(id) on delete set null,
  add column if not exists rejection_note text;

create unique index if not exists donations_contract_reference_uidx on public.donations(contract_reference) where contract_reference is not null;
create index if not exists donations_institution_profile_status_idx on public.donations(institution_profile_id, status, created_at desc);

alter table public.chat_threads
  add column if not exists institution_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists status text not null default 'open' check (status in ('open', 'closed'));
create unique index if not exists chat_threads_donation_uidx on public.chat_threads(donation_id) where donation_id is not null;
create index if not exists chat_threads_institution_profile_idx on public.chat_threads(institution_profile_id, updated_at desc);

alter table public.chat_messages add column if not exists sender_name text not null default '';
create index if not exists chat_messages_thread_created_idx on public.chat_messages(thread_id, created_at);

alter table public.donations enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users can view own donations" on public.donations;
drop policy if exists "Companies can insert donations" on public.donations;
drop policy if exists "Both parties can update donations" on public.donations;
drop policy if exists "donations_select_parties_admin" on public.donations;
create policy "donations_select_parties_admin" on public.donations for select to authenticated
using (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()) or public.is_admin());
drop policy if exists "donations_insert_company" on public.donations;
create policy "donations_insert_company" on public.donations for insert to authenticated
with check (
  company_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'empresa')
  and status in ('pending-company', 'pending-institution')
  and institution_confirmed is false
  and rejected_by is null
  and rejection_note is null
  and certificate_id is null
  and certificate_issued_at is null
);
drop policy if exists "donations_update_parties_admin" on public.donations;
create policy "donations_update_parties_admin" on public.donations for update to authenticated
using (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()) or public.is_admin())
with check (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()) or public.is_admin());
grant select, insert, update on public.donations to authenticated;
revoke all on public.donations from anon;

create or replace function public.guard_donation_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' or public.is_admin() then
    return new;
  end if;
  if uid is null then raise exception 'Authentication required'; end if;

  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    if (to_jsonb(new) - array['status','rejected_by','rejection_note','updated_at'])
       is distinct from (to_jsonb(old) - array['status','rejected_by','rejection_note','updated_at']) then
      raise exception 'A rejection cannot change other donation fields';
    end if;
    if old.company_id <> uid and old.institution_profile_id <> uid then
      raise exception 'Only a donation participant may reject it';
    end if;
    new.rejected_by := uid;
    new.updated_at := now();
    return new;
  end if;

  if old.company_id = uid then
    if (to_jsonb(new) - array['proof_file_name','proof_file_url','proof_file_size','company_invoice_file_name','company_invoice_file_url','company_invoice_file_size','company_confirmed','company_confirmed_amount','status','confirmed_at','updated_at'])
       is distinct from (to_jsonb(old) - array['proof_file_name','proof_file_url','proof_file_size','company_invoice_file_name','company_invoice_file_url','company_invoice_file_size','company_confirmed','company_confirmed_amount','status','confirmed_at','updated_at']) then
      raise exception 'Company may only update its evidence and confirmation';
    end if;
    if old.company_confirmed and not new.company_confirmed then raise exception 'Company confirmation cannot be withdrawn'; end if;
    if new.proof_file_url is not null and split_part(new.proof_file_url, '/', 1) <> uid::text then
      raise exception 'Company proof path must belong to uploader';
    end if;
    if new.company_invoice_file_url is not null and split_part(new.company_invoice_file_url, '/', 1) <> uid::text then
      raise exception 'Company invoice path must belong to uploader';
    end if;
  elsif old.institution_profile_id = uid then
    if (to_jsonb(new) - array['institution_receipt_file_name','institution_receipt_file_url','institution_receipt_file_size','institution_thank_you_message','institution_confirmed','institution_confirmed_amount','status','confirmed_at','updated_at'])
       is distinct from (to_jsonb(old) - array['institution_receipt_file_name','institution_receipt_file_url','institution_receipt_file_size','institution_thank_you_message','institution_confirmed','institution_confirmed_amount','status','confirmed_at','updated_at']) then
      raise exception 'Institution may only update its receipt and confirmation';
    end if;
    if old.institution_confirmed and not new.institution_confirmed then raise exception 'Institution confirmation cannot be withdrawn'; end if;
    if new.institution_receipt_file_url is not null and split_part(new.institution_receipt_file_url, '/', 1) <> uid::text then
      raise exception 'Institution receipt path must belong to uploader';
    end if;
  else
    raise exception 'Only a donation participant may update it';
  end if;

  new.status := case
    when new.company_confirmed and new.institution_confirmed then 'confirmed'
    when new.company_confirmed then 'pending-institution'
    else 'pending-company'
  end;
  if new.status = 'confirmed' and old.status <> 'confirmed' then new.confirmed_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists guard_donation_update on public.donations;
create trigger guard_donation_update before update on public.donations for each row execute function public.guard_donation_update();
revoke all on function public.guard_donation_update() from public, anon, authenticated;

create or replace function public.resolve_donation_institution()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.institution_profile_id is null and nullif(trim(new.institution_name), '') is not null then
    select p.id into new.institution_profile_id
    from public.profiles p
    where p.role = 'instituicao'
      and lower(trim(coalesce(p.institution_legal_name, p.name))) = lower(trim(new.institution_name))
    order by p.created_at desc limit 1;
  end if;
  if new.institution_profile_id is not null and not exists (
    select 1 from public.profiles p where p.id = new.institution_profile_id and p.role = 'instituicao'
  ) then
    raise exception 'Institution profile is invalid';
  end if;
  return new;
end;
$$;
drop trigger if exists resolve_donation_institution on public.donations;
create trigger resolve_donation_institution before insert on public.donations for each row execute function public.resolve_donation_institution();
revoke all on function public.resolve_donation_institution() from public, anon, authenticated;

drop policy if exists "Users can view chat threads" on public.chat_threads;
drop policy if exists "Users can insert chat threads" on public.chat_threads;
drop policy if exists "chat_threads_select_parties_admin" on public.chat_threads;
create policy "chat_threads_select_parties_admin" on public.chat_threads for select to authenticated
using (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()) or public.is_admin());
drop policy if exists "chat_threads_update_participants" on public.chat_threads;
create policy "chat_threads_update_participants" on public.chat_threads for update to authenticated
using (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()))
with check (company_id = (select auth.uid()) or institution_profile_id = (select auth.uid()));
grant select, update on public.chat_threads to authenticated;
revoke insert, delete on public.chat_threads from anon, authenticated;

create or replace function public.guard_chat_thread_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if public.is_admin() or current_setting('request.jwt.claim.role', true) = 'service_role' then return new; end if;
  if (to_jsonb(new) - array['status','updated_at']) is distinct from (to_jsonb(old) - array['status','updated_at']) then
    raise exception 'Participants may only change conversation status';
  end if;
  if old.status = 'closed' and new.status = 'open' then raise exception 'Closed conversations cannot be reopened by participants'; end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists guard_chat_thread_update on public.chat_threads;
create trigger guard_chat_thread_update before update on public.chat_threads for each row execute function public.guard_chat_thread_update();
revoke all on function public.guard_chat_thread_update() from public, anon, authenticated;

drop policy if exists "Users can view chat messages" on public.chat_messages;
drop policy if exists "Users can insert chat messages" on public.chat_messages;
drop policy if exists "chat_messages_select_parties_admin" on public.chat_messages;
create policy "chat_messages_select_parties_admin" on public.chat_messages for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.chat_threads t where t.id = thread_id
    and (t.company_id = (select auth.uid()) or t.institution_profile_id = (select auth.uid()))
));
drop policy if exists "chat_messages_insert_thread_participant" on public.chat_messages;
create policy "chat_messages_insert_thread_participant" on public.chat_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
      and p.role = sender_role and p.name = sender_name
  )
  and exists (
    select 1 from public.chat_threads t where t.id = thread_id
      and (t.company_id = (select auth.uid()) or t.institution_profile_id = (select auth.uid()))
      and t.status = 'open'
  )
);
grant select, insert on public.chat_messages to authenticated;
revoke all on public.chat_messages from anon;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "notifications_select_recipient_admin" on public.notifications;
create policy "notifications_select_recipient_admin" on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()) or public.is_admin());
drop policy if exists "notifications_update_read_only" on public.notifications;
create policy "notifications_update_read_only" on public.notifications for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));
grant select, update on public.notifications to authenticated;
revoke insert, delete on public.notifications from anon, authenticated;

create or replace function public.guard_notification_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (to_jsonb(new) - array['read']) is distinct from (to_jsonb(old) - array['read']) then
    raise exception 'Recipients may only mark their notification as read';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_notification_update on public.notifications;
create trigger guard_notification_update before update on public.notifications for each row execute function public.guard_notification_update();
revoke all on function public.guard_notification_update() from public, anon, authenticated;

create or replace function public.create_donation_conversation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.chat_threads(id, donation_id, company_id, institution_id, institution_profile_id, status, created_at, updated_at)
  values (new.id, new.id, new.company_id, new.institution_id, new.institution_profile_id, 'open', now(), now())
  on conflict (donation_id) where donation_id is not null do nothing;
  if new.company_id is not null then
    insert into public.chat_messages(thread_id, sender_id, sender_role, sender_name, body)
    select new.id, new.company_id, 'empresa', coalesce(p.name, new.company_name, 'Empresa'),
      'Conversa aberta para alinhar os detalhes do donativo.'
    from public.profiles p where p.id = new.company_id;
  end if;
  return new;
end;
$$;
drop trigger if exists create_donation_conversation on public.donations;
create trigger create_donation_conversation after insert on public.donations for each row execute function public.create_donation_conversation();
revoke all on function public.create_donation_conversation() from public, anon, authenticated;

create or replace function public.create_donation_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
declare company_role text := 'empresa';
begin
  if tg_op = 'INSERT' then
    insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
    values (new.company_id, company_role, new.company_name, 'donation-registered', 'Intenção de donativo registada',
      'A intenção de donativo foi guardada. A confirmação e os comprovativos ficam disponíveis na área privada.', new.id, 'Ver donativo', 'area-privada');
    if new.institution_profile_id is not null then
      insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
      values (new.institution_profile_id, 'instituicao', new.institution_name, 'donation-intent', 'Novo donativo para validação',
        'Foi registada uma intenção de donativo. Consulte os detalhes e os comprovativos na área privada.', new.id, 'Ver donativo', 'area-privada');
    end if;
    return new;
  end if;
  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    if new.rejected_by = new.company_id and new.institution_profile_id is not null then
      insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
      values (new.institution_profile_id, 'instituicao', new.institution_name, 'donation-rejected', 'Donativo rejeitado', coalesce(new.rejection_note, 'A empresa rejeitou o registo do donativo.'), new.id, 'Ver donativo', 'area-privada');
    elsif new.rejected_by = new.institution_profile_id and new.company_id is not null then
      insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
      values (new.company_id, 'empresa', new.company_name, 'donation-rejected', 'Donativo rejeitado', coalesce(new.rejection_note, 'A instituição rejeitou o registo do donativo.'), new.id, 'Ver donativo', 'area-privada');
    end if;
  elsif new.company_confirmed and not old.company_confirmed and new.institution_profile_id is not null then
    insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
    values (new.institution_profile_id, 'instituicao', new.institution_name, 'company-confirmed', 'Donativo confirmado pela empresa', 'A empresa confirmou o donativo e anexou os respetivos comprovativos.', new.id, 'Ver donativo', 'area-privada');
  elsif new.institution_confirmed and not old.institution_confirmed then
    insert into public.notifications(recipient_id, recipient_role, recipient_name, kind, title, body, related_proof_id, action_label, action_view)
    values (new.company_id, 'empresa', new.company_name, 'institution-confirmed', 'Donativo confirmado pela instituição', 'A instituição confirmou o donativo e registou o recibo.', new.id, 'Ver donativo', 'area-privada');
  end if;
  return new;
end;
$$;
drop trigger if exists create_donation_notifications on public.donations;
create trigger create_donation_notifications after insert or update on public.donations for each row execute function public.create_donation_notifications();
revoke all on function public.create_donation_notifications() from public, anon, authenticated;

drop policy if exists "documents_select_donation_participants" on public.documents;
create policy "documents_select_donation_participants" on public.documents for select to authenticated
using (
  category = 'donation-proof'
  and exists (select 1 from public.donations d where
    owner_id in (d.company_id, d.institution_profile_id)
    and storage_path in (d.proof_file_url, d.company_invoice_file_url, d.institution_receipt_file_url)
    and (d.company_id = (select auth.uid()) or d.institution_profile_id = (select auth.uid()) or public.is_admin())
  )
);
drop policy if exists "storage_documents_select_donation_participants" on storage.objects;
create policy "storage_documents_select_donation_participants" on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and exists (select 1 from public.donations d where
    name in (d.proof_file_url, d.company_invoice_file_url, d.institution_receipt_file_url)
    and (d.company_id = (select auth.uid()) or d.institution_profile_id = (select auth.uid()) or public.is_admin())
  )
);

comment on table public.donations is 'Donativos persistentes; os comprovativos ficam em Storage privado e as confirmações são limitadas por participante.';
comment on table public.chat_threads is 'Conversas persistentes ligadas a donativos; acesso limitado aos participantes e administradores.';
comment on table public.notifications is 'Notificações persistentes; criadas pelo servidor e só podem ser marcadas como lidas pelo destinatário.';
