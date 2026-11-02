-- Makes the staff order-notification email call out a birthday gift order at
-- a glance (subject line + a distinct 🎂 banner), not just a generic 🎁 "GIFT
-- ORDER — Birthday" line buried in the body.
--
-- This also moves the staff email off the notify-order-placed Edge Function
-- and onto the same direct net.http_post-to-Resend path already used for the
-- customer confirmation (20261102120000_customer_order_confirmation_email.sql)
-- — the Edge Function's code can't be redeployed from here (no working
-- Supabase CLI on this machine), so changing it in place wasn't an option.
-- The Edge Function itself is left deployed but unused; it can be removed in
-- a follow-up once this is confirmed working.
--
-- Requires a row in private.secrets with key = 'order_notify_to' (same value
-- as the ORDER_NOTIFY_TO Edge Function secret, mgc.bangalore@gmail.com).
-- Falls back to that address if the secret isn't set. Not inserted here —
-- see CREDENTIALS.md for the one-off SQL to seed it.

create or replace function public.notify_order_placed_email(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resend_key text;
  v_staff_to text;
  v_payload jsonb;
  v_customer_email text;
  v_customer_name text;
  v_is_gift boolean;
  v_occasion text;
  v_is_birthday boolean;
  v_order_number text;
  v_total_str text;
  v_address text;
  v_staff_subject text;
  v_staff_banner text;
  v_staff_html text;
  v_customer_subject text;
  v_customer_html text;
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

  select value into v_resend_key from private.secrets where key = 'resend_api_key';
  if v_resend_key is null then
    return;
  end if;

  v_is_gift := coalesce((v_payload->>'is_gift')::boolean, false);
  v_occasion := nullif(v_payload->>'gift_occasion', '');
  v_is_birthday := v_is_gift and v_occasion ilike 'birthday';
  v_order_number := v_payload->>'order_number';
  v_total_str := '&#8377;' || to_char((v_payload->>'total')::numeric, 'FM999999990.00');
  v_address := nullif(
    concat_ws(', ', v_payload->>'address_line', v_payload->>'address_city', v_payload->>'address_state'),
    ''
  );

  -- ── Staff notification ────────────────────────────────────────────────
  select coalesce(value, 'mgc.bangalore@gmail.com') into v_staff_to
  from private.secrets where key = 'order_notify_to';
  v_staff_to := coalesce(v_staff_to, 'mgc.bangalore@gmail.com');

  v_staff_subject := case
    when v_is_birthday then '🎂 Birthday gift order ' || v_order_number || ' — ' || v_total_str
    when v_is_gift and v_occasion is not null then '🎁 ' || v_occasion || ' gift order ' || v_order_number || ' — ' || v_total_str
    when v_is_gift then '🎁 Gift order ' || v_order_number || ' — ' || v_total_str
    else 'New order ' || v_order_number || ' — ' || v_total_str
  end;

  v_staff_banner := case when v_is_gift then
    '<p style="background:' || (case when v_is_birthday then '#FFE3EC;border:1px solid #F4A6C6' else '#FFF4CC;border:1px solid #E8C84A' end) ||
    ';border-radius:8px;padding:10px 14px;">' ||
    (case when v_is_birthday then '🎂 <b>BIRTHDAY GIFT ORDER</b>' else '🎁 <b>GIFT ORDER</b>' || (case when v_occasion is not null then ' — ' || v_occasion else '' end) end) ||
    '</p>' ||
    '<p><b>Recipient:</b> ' || coalesce(v_payload->>'gift_recipient_name', '—') || '<br>' ||
    '<b>Recipient phone:</b> ' || coalesce(v_payload->>'gift_recipient_phone', '—') || '<br>' ||
    '<b>Recipient address:</b> ' || coalesce(v_payload->>'gift_recipient_address', '—') || '</p>' ||
    '<p><b>Sender:</b> ' || coalesce(v_payload->>'gift_sender_name', v_payload->>'customer_name') || '<br>' ||
    '<b>Sender phone:</b> ' || coalesce(v_payload->>'gift_sender_phone', v_payload->>'customer_phone', '—') || '</p>'
  else '' end;

  v_staff_html :=
    '<h2>' || (case when v_is_birthday then '🎂 New birthday gift order: ' when v_is_gift then '🎁 New gift order placed: ' else 'New order placed: ' end) ||
    v_order_number || '</h2>' ||
    v_staff_banner ||
    '<p><b>Customer:</b> ' || coalesce(v_payload->>'customer_name', '—') || '<br>' ||
    '<b>Phone:</b> ' || coalesce(v_payload->>'customer_phone', '—') || '</p>' ||
    '<p><b>Total:</b> ' || v_total_str || ' (subtotal &#8377;' || to_char((v_payload->>'subtotal')::numeric, 'FM999999990.00') ||
    ' + delivery &#8377;' || to_char((v_payload->>'delivery_fee')::numeric, 'FM999999990.00') || ')<br>' ||
    '<b>Delivery date:</b> ' || coalesce(v_payload->>'delivery_date', '—') || '<br>' ||
    '<b>Delivery address:</b> ' || coalesce(v_address, '—') || '</p>' ||
    (case when coalesce(v_payload->>'notes', '') <> '' then '<p><b>Notes:</b> ' || (v_payload->>'notes') || '</p>' else '' end) ||
    '<p><a href="https://admin.minigreenscompany.com/dashboard/orders">View in admin dashboard</a></p>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_resend_key),
    body := jsonb_build_object(
      'from', 'MiniGreens Orders <orders@mail.minigreenscompany.com>',
      'to', jsonb_build_array(v_staff_to),
      'subject', v_staff_subject,
      'html', v_staff_html
    )
  );

  -- ── Customer confirmation (unchanged from the previous migration) ──────
  if v_customer_email is null then
    return;
  end if;

  v_customer_subject := case when v_is_gift
    then '🎁 Your gift order ' || v_order_number || ' is confirmed'
    else 'We''ve received your order ' || v_order_number
  end;

  v_customer_html :=
    '<p>Hi ' || coalesce(nullif(v_customer_name, ''), 'there') || ',</p>' ||
    '<p>Thanks for your order with MiniGreens! We''ve received order <b>' || v_order_number ||
    '</b> for ' || v_total_str || ', expected around ' || coalesce(v_payload->>'delivery_date', 'soon') || '.</p>' ||
    '<p><b>Our team will contact you shortly regarding your order.</b></p>' ||
    case when v_is_gift then
      '<p>This order is a gift' || (case when v_occasion is not null then ' for ' || v_occasion else '' end) ||
      ' for <b>' || coalesce(v_payload->>'gift_recipient_name', 'your recipient') ||
      '</b>, delivered to ' || coalesce(v_payload->>'gift_recipient_address', 'the address you gave us') ||
      '. We''ll keep it a surprise!</p>'
    else '' end ||
    '<p>&mdash; The MiniGreens Company</p>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_resend_key),
    body := jsonb_build_object(
      'from', 'MiniGreens Orders <orders@mail.minigreenscompany.com>',
      'to', jsonb_build_array(v_customer_email),
      'subject', v_customer_subject,
      'html', v_customer_html
    )
  );
exception when others then
  -- Never let an email failure break the order write that triggered it.
  null;
end;
$$;
