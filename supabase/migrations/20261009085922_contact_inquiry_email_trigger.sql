-- Emails theminigreenscompany@gmail.com on every new contact-form submission,
-- via the existing notify-inquiry Edge Function. Originally meant to be wired
-- up as a Supabase Database Webhook from the dashboard, but that was never
-- configured — using a SQL trigger instead (same approach as
-- notify_order_placed_email) so it's version-controlled rather than a
-- dashboard-only setting.
--
-- Reuses the 'order_notify_webhook_secret' row in private.secrets: both
-- notify-inquiry and notify-order-placed share the same WEBHOOK_SECRET value
-- (set together via one `supabase secrets set` call), so one stored secret
-- covers both.

create or replace function public.notify_contact_message_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from private.secrets where key = 'order_notify_webhook_secret';
  if v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://xdjpwulpkuykxrxqalrh.supabase.co/functions/v1/notify-inquiry',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', jsonb_build_object(
        'id', new.id,
        'full_name', new.full_name,
        'email', new.email,
        'phone', new.phone,
        'reason', new.reason,
        'message', new.message
      )
    )
  );

  return new;
exception when others then
  -- Never let an email failure break the contact-form submission.
  return new;
end;
$$;

create trigger contact_messages_notify_email
  after insert on public.contact_messages
  for each row execute function public.notify_contact_message_email();
