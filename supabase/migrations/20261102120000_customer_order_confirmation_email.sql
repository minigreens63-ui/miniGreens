-- Emails the customer who placed an order (regular or gift) confirming it was
-- received and that the team will be in touch — complements the existing
-- staff-facing email (20261009083000_order_email_notification.sql /
-- 20261028000100_gift_orders.sql), which this still sends unchanged. The
-- customer email is sent via a second, independent net.http_post straight to
-- Resend (no Edge Function involved, so nothing new needs deploying), reusing
-- the private.secrets pattern already used for the Razorpay key.
--
-- Fires for every order on every client (webapp, mobile) since it's wired
-- into the same `orders` INSERT trigger as the staff email and the push
-- notification — not duplicated per-client.
--
-- Requires a row in private.secrets with key = 'resend_api_key' (the same
-- value already set as the RESEND_API_KEY Edge Function secret). Not
-- inserted here — see CREDENTIALS.md for the one-off SQL to seed it.

create or replace function public.notify_order_placed_email(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_resend_key text;
  v_payload jsonb;
  v_customer_email text;
  v_customer_name text;
  v_subject text;
  v_html text;
begin
  select
    jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'subtotal', o.subtotal,
      'delivery_fee', o.delivery_fee,
      'total', o.total,
      'delivery_date', o.delivery_date,
      'notes', o.notes,
      'customer_name', coalesce(a.full_name, p.full_name),
      'customer_phone', coalesce(a.phone, p.phone),
      'address_line', a.street,
      'address_city', a.city,
      'address_state', a.state,
      'is_gift', o.is_gift,
      'gift_occasion', o.gift_occasion,
      'gift_recipient_name', o.gift_recipient_name,
      'gift_recipient_phone', o.gift_recipient_phone,
      'gift_recipient_address', o.gift_recipient_address,
      'gift_sender_name', coalesce(o.gift_sender_name, p.full_name),
      'gift_sender_phone', coalesce(o.gift_sender_phone, p.phone)
    ),
    p.email,
    p.full_name
  into v_payload, v_customer_email, v_customer_name
  from public.orders o
  join public.profiles p on p.id = o.profile_id
  left join public.addresses a on a.id = o.delivery_address_id
  where o.id = p_order_id;

  if v_payload is null then
    return;
  end if;

  -- Staff notification (unchanged, via the notify-order-placed Edge Function).
  select value into v_secret from private.secrets where key = 'order_notify_webhook_secret';
  if v_secret is not null then
    perform net.http_post(
      url := 'https://xdjpwulpkuykxrxqalrh.supabase.co/functions/v1/notify-order-placed',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      body := v_payload
    );
  end if;

  -- Customer confirmation, sent directly to Resend.
  select value into v_resend_key from private.secrets where key = 'resend_api_key';
  if v_resend_key is null or v_customer_email is null then
    return;
  end if;

  v_subject := case when coalesce((v_payload->>'is_gift')::boolean, false)
    then '🎁 Your gift order ' || (v_payload->>'order_number') || ' is confirmed'
    else 'We''ve received your order ' || (v_payload->>'order_number')
  end;

  v_html :=
    '<p>Hi ' || coalesce(nullif(v_customer_name, ''), 'there') || ',</p>' ||
    '<p>Thanks for your order with MiniGreens! We''ve received order <b>' || (v_payload->>'order_number') ||
    '</b> for &#8377;' || to_char((v_payload->>'total')::numeric, 'FM999999990.00') ||
    ', expected around ' || coalesce(v_payload->>'delivery_date', 'soon') || '.</p>' ||
    '<p><b>Our team will contact you shortly regarding your order.</b></p>' ||
    case when coalesce((v_payload->>'is_gift')::boolean, false) then
      '<p>This order is a gift' ||
      (case when coalesce(v_payload->>'gift_occasion', '') <> ''
        then ' for ' || (v_payload->>'gift_occasion') else '' end) ||
      ' for <b>' || coalesce(v_payload->>'gift_recipient_name', 'your recipient') ||
      '</b>, delivered to ' || coalesce(v_payload->>'gift_recipient_address', 'the address you gave us') ||
      '. We''ll keep it a surprise!</p>'
    else '' end ||
    '<p>&mdash; The MiniGreens Company</p>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_resend_key
    ),
    body := jsonb_build_object(
      'from', 'MiniGreens Orders <orders@mail.minigreenscompany.com>',
      'to', jsonb_build_array(v_customer_email),
      'subject', v_subject,
      'html', v_html
    )
  );
exception when others then
  -- Never let an email failure break the order write that triggered it.
  null;
end;
$$;
