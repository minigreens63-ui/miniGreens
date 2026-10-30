-- In-app account deletion (Apple Guideline 5.1.1(v) / Google Play account-deletion
-- policy). Product decision: anonymize, don't hard-delete — orders/order_items are
-- kept for business and tax-record retention, stripped of the PII that identifies
-- who placed them. Storage (partner-kyc files) and the auth.users row itself are
-- handled by the `delete-account` Edge Function, which has Storage + GoTrue Admin
-- API access this Postgres function does not.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Withdraw WhatsApp consent as an append-only log entry (DPDP Act 2023
  -- pattern already used by this table) rather than editing history. Its
  -- existing sync_whatsapp_opt_in trigger flips profiles.whatsapp_opt_in.
  insert into public.consent_log (profile_id, channel, granted, source, terms_version)
  values (v_uid, 'whatsapp', false, 'account_deletion', 'v1');

  -- Stop any future subscription deliveries/charges.
  update public.subscriptions
  set status = 'cancelled', cancelled_at = now()
  where profile_id = v_uid and status in ('active', 'paused');

  -- Anonymize the partner application, if any. KYC files themselves are
  -- removed from Storage by the Edge Function.
  update public.partners
  set business_name = 'Deleted Partner',
      contact_person = 'Deleted User',
      phone = '0000000000',
      address = null,
      kyc_documents = '[]'::jsonb
  where profile_id = v_uid;

  -- Scrub the address book. Past orders keep their delivery_address_id link,
  -- so this also scrubs what a historical order displays going forward --
  -- the intended effect of "anonymize" (amounts/products stay, identity doesn't).
  update public.addresses
  set full_name = 'Deleted User',
      phone = '0000000000',
      street = '[redacted]',
      apartment = null
  where profile_id = v_uid;

  -- Scrub the profile itself. orders/order_items/notifications stay intact,
  -- linked only by this now-anonymized id.
  update public.profiles
  set full_name = 'Deleted User',
      email = null,
      phone = null,
      avatar = null,
      date_of_birth = null,
      preferences = '{}',
      push_token = null,
      whatsapp_number = null,
      whatsapp_verified_at = null
  where id = v_uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
