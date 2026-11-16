-- Tighten live RLS and keep transaction payment state server-owned.
-- Existing records and table structures are preserved.

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions for insert
to authenticated
with check (
  company_profile_id = auth.uid()
  and status = 'pending'
  and payment_provider = 'stripe'
  and stripe_checkout_session_id is null
  and stripe_payment_intent_id is null
  and stripe_customer_id is null
  and stripe_receipt_url is null
  and invoice_receipt_status = 'pending'
  and invoice_receipt_number is null
  and invoice_receipt_file_url is null
  and invoice_receipt_updated_by is null
);

create or replace function public.prevent_client_transaction_status_change()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' and new.status is distinct from 'pending' then
      raise exception 'Transaction status is server managed';
    end if;
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      raise exception 'Transaction status is server managed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_server_managed_status on public.transactions;
create trigger transactions_server_managed_status
before insert or update of status on public.transactions
for each row execute function public.prevent_client_transaction_status_change();

drop policy if exists "System can insert notifications" on public.notifications;

drop policy if exists "Public can view institutions" on public.institutions;
drop policy if exists "Institutions can view own profile or admin" on public.institutions;
create policy "Institutions can view own profile or admin"
on public.institutions for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "Users can manage own documents" on public.documents;

alter function public.trigger_set_updated_at() set search_path = public, pg_temp;
revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
