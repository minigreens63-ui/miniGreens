-- Replaces the plain-text order emails (both the customer confirmation and
-- the staff notification) with a branded HTML template: a forest-green
-- header carrying the MiniGreens wordmark, a white content card, a cream
-- footer, and a pill-shaped CTA button — matching the webapp's own palette
-- (see webapp/app/globals.css: --color-forest #1f3a24, --color-sun #f5c138,
-- --color-cream #f8f6ee). No external logo image is used (the webapp itself
-- has no hosted raster logo yet, only an inline SVG wordmark in the navbar,
-- and a missing/broken <img> would look worse than none) — the header is a
-- styled text wordmark instead, which also means it can never fail to load.
--
-- `public._order_email_wrap()` holds the shared shell so both emails built
-- in notify_order_placed_email() stay visually identical without
-- duplicating the HTML.

create or replace function public._order_email_wrap(
  p_eyebrow text,
  p_heading text,
  p_body_html text,
  p_cta_label text,
  p_cta_url text
) returns text
language sql
immutable
as $$
  select
    '<!doctype html><html><body style="margin:0;padding:0;background:#efeadb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' ||
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeadb;padding:32px 16px;"><tr><td align="center">' ||
    '<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d0;">' ||
    '<tr><td style="background:#1f3a24;padding:28px 32px;text-align:center;">' ||
    '<span style="font-size:20px;line-height:1;color:#f8f6ee;letter-spacing:0.06em;font-weight:700;">&#127793; MINI GREENS COMPANY</span>' ||
    '</td></tr>' ||
    '<tr><td style="padding:36px 32px 8px;">' ||
    '<div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#5f8a3c;margin:0 0 8px;">' || p_eyebrow || '</div>' ||
    '<h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;color:#1f3a24;font-family:Georgia,''Times New Roman'',serif;">' || p_heading || '</h1>' ||
    p_body_html ||
    (case when p_cta_url is not null then
      '<div style="text-align:center;margin:28px 0 8px;">' ||
      '<a href="' || p_cta_url || '" style="display:inline-block;background:#f5c138;color:#1f3a24;font-weight:700;padding:13px 32px;border-radius:999px;text-decoration:none;font-size:14px;">' || p_cta_label || '</a>' ||
      '</div>'
    else '' end) ||
    '</td></tr>' ||
    '<tr><td style="background:#f8f6ee;padding:22px 32px;text-align:center;border-top:1px solid #e5e0d0;">' ||
    '<div style="font-size:12px;color:#1f3a24;opacity:0.7;">MiniGreens Company &middot; Bengaluru, India</div>' ||
    '<div style="font-size:11px;color:#1f3a24;opacity:0.5;margin-top:4px;">India''s First Microgreens Brand</div>' ||
    '</td></tr>' ||
    '</table></td></tr></table></body></html>';
$$;

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
  v_staff_eyebrow text;
  v_staff_heading text;
  v_staff_banner text;
  v_staff_body text;
  v_staff_html text;
  v_customer_subject text;
  v_customer_body text;
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

  -- Subject is plain text (not HTML), so literal emoji characters are used
  -- directly rather than the &#...; entities the HTML body uses below.
  v_staff_subject := case
    when v_is_birthday then '🎂 Birthday gift order ' || v_order_number || ' — ' || replace(v_total_str, '&#8377;', '₹')
    when v_is_gift and v_occasion is not null then '🎁 ' || v_occasion || ' gift order ' || v_order_number || ' — ' || replace(v_total_str, '&#8377;', '₹')
    when v_is_gift then '🎁 Gift order ' || v_order_number || ' — ' || replace(v_total_str, '&#8377;', '₹')
    else 'New order ' || v_order_number || ' — ' || replace(v_total_str, '&#8377;', '₹')
  end;

  v_staff_eyebrow := case when v_is_birthday then 'Birthday gift order' when v_is_gift then 'Gift order' else 'New order' end;
  v_staff_heading := (case when v_is_birthday then '&#127874; ' when v_is_gift then '&#127873; ' else '' end) || v_order_number;

  v_staff_banner := case when v_is_gift then
    '<table role="presentation" width="100%" style="background:' || (case when v_is_birthday then '#FFE3EC' else '#FFF4CC' end) ||
    ';border:1px solid ' || (case when v_is_birthday then '#F4A6C6' else '#E8C84A' end) || ';border-radius:10px;margin:0 0 20px;">' ||
    '<tr><td style="padding:14px 16px;font-size:13px;color:#1f3a24;line-height:1.6;">' ||
    '<div style="font-weight:700;margin-bottom:6px;">' || (case when v_is_birthday then '&#127874; BIRTHDAY GIFT ORDER' else '&#127873; GIFT ORDER' || (case when v_occasion is not null then ' — ' || v_occasion else '' end) end) || '</div>' ||
    '<b>Recipient:</b> ' || coalesce(v_payload->>'gift_recipient_name', '—') || '<br>' ||
    '<b>Recipient phone:</b> ' || coalesce(v_payload->>'gift_recipient_phone', '—') || '<br>' ||
    '<b>Recipient address:</b> ' || coalesce(v_payload->>'gift_recipient_address', '—') || '<br><br>' ||
    '<b>Sender:</b> ' || coalesce(v_payload->>'gift_sender_name', v_payload->>'customer_name') || '<br>' ||
    '<b>Sender phone:</b> ' || coalesce(v_payload->>'gift_sender_phone', v_payload->>'customer_phone', '—') ||
    '</td></tr></table>'
  else '' end;

  v_staff_body :=
    v_staff_banner ||
    '<table role="presentation" width="100%" style="background:#f8f6ee;border-radius:10px;margin:0 0 20px;">' ||
    '<tr><td style="padding:16px 18px;font-size:13px;color:#1f3a24;line-height:1.8;">' ||
    '<b>Customer:</b> ' || coalesce(v_payload->>'customer_name', '—') || '<br>' ||
    '<b>Phone:</b> ' || coalesce(v_payload->>'customer_phone', '—') || '<br>' ||
    '<b>Total:</b> ' || v_total_str || ' (subtotal &#8377;' || to_char((v_payload->>'subtotal')::numeric, 'FM999999990.00') ||
    ' + delivery &#8377;' || to_char((v_payload->>'delivery_fee')::numeric, 'FM999999990.00') || ')<br>' ||
    '<b>Delivery date:</b> ' || coalesce(v_payload->>'delivery_date', '—') || '<br>' ||
    '<b>Delivery address:</b> ' || coalesce(v_address, '—') ||
    (case when coalesce(v_payload->>'notes', '') <> '' then '<br><b>Notes:</b> ' || (v_payload->>'notes') else '' end) ||
    '</td></tr></table>';

  v_staff_html := public._order_email_wrap(
    v_staff_eyebrow,
    v_staff_heading,
    v_staff_body,
    'View in admin dashboard',
    'https://admin.minigreenscompany.com/dashboard/orders'
  );

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

  -- ── Customer confirmation ────────────────────────────────────────────
  if v_customer_email is null then
    return;
  end if;

  v_customer_subject := case when v_is_gift
    then '🎁 Your gift order ' || v_order_number || ' is confirmed'
    else 'We''ve received your order ' || v_order_number
  end;

  v_customer_body :=
    '<p style="margin:0 0 16px;font-size:14px;color:#3a3a3a;line-height:1.6;">Hi ' || coalesce(nullif(v_customer_name, ''), 'there') || ', thanks for ordering with MiniGreens!</p>' ||
    '<table role="presentation" width="100%" style="background:#f8f6ee;border-radius:10px;margin:0 0 20px;">' ||
    '<tr><td style="padding:16px 18px;font-size:13px;color:#1f3a24;line-height:1.8;">' ||
    '<b>Order:</b> ' || v_order_number || '<br>' ||
    '<b>Total:</b> ' || v_total_str || '<br>' ||
    '<b>Expected around:</b> ' || coalesce(v_payload->>'delivery_date', 'soon') ||
    '</td></tr></table>' ||
    (case when v_is_gift then
      '<table role="presentation" width="100%" style="background:' || (case when v_is_birthday then '#FFE3EC' else '#FFF4CC' end) ||
      ';border:1px solid ' || (case when v_is_birthday then '#F4A6C6' else '#E8C84A' end) || ';border-radius:10px;margin:0 0 20px;">' ||
      '<tr><td style="padding:14px 16px;font-size:13px;color:#1f3a24;line-height:1.6;">' ||
      (case when v_is_birthday then '&#127874; ' else '&#127873; ' end) ||
      'This order is a gift' || (case when v_occasion is not null then ' for ' || v_occasion else '' end) ||
      ' for <b>' || coalesce(v_payload->>'gift_recipient_name', 'your recipient') ||
      '</b>, delivered to ' || coalesce(v_payload->>'gift_recipient_address', 'the address you gave us') ||
      '. We''ll keep it a surprise!' ||
      '</td></tr></table>'
    else '' end) ||
    '<p style="margin:0;font-size:14px;color:#1f3a24;font-weight:700;line-height:1.6;">Our team will contact you shortly regarding your order.</p>';

  v_customer_html := public._order_email_wrap(
    case when v_is_gift then 'Gift order confirmed' else 'Order confirmed' end,
    'Thanks for your order!',
    v_customer_body,
    'View my orders',
    'https://minigreenscompany.com/orders'
  );

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
