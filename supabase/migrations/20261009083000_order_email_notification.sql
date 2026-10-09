-- Emails mgc.bangalore@gmail.com whenever a new order is placed, alongside the
-- existing push notification in notify_order_status_change(). Fired from the
-- same `orders` INSERT trigger, so order_items aren't guaranteed to exist yet
-- (they're inserted in a separate statement right after) — the email only
-- uses columns already present on orders/profiles/addresses at insert time,
-- same constraint the existing push notification already works within.
--
-- Requires a row in private.secrets with key = 'order_notify_webhook_secret',
-- matching the WEBHOOK_SECRET set on the notify-order-placed Edge Function
-- (`supabase secrets set WEBHOOK_SECRET=...`). Not inserted here — like the
-- Razorpay keys, actual secret values are never committed to this migration;
-- see CREDENTIALS.md for the one-off SQL to seed it.

create or replace function public.notify_order_placed_email(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_payload jsonb;
begin
  select value into v_secret from private.secrets where key = 'order_notify_webhook_secret';
  if v_secret is null then
    return;
  end if;

  select jsonb_build_object(
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
    'address_state', a.state
  )
  into v_payload
  from public.orders o
  join public.profiles p on p.id = o.profile_id
  left join public.addresses a on a.id = o.delivery_address_id
  where o.id = p_order_id;

  if v_payload is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://xdjpwulpkuykxrxqalrh.supabase.co/functions/v1/notify-order-placed',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := v_payload
  );
exception when others then
  -- Never let an email failure break the order write that triggered it.
  null;
end;
$$;

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_title text;
  v_body text;
begin
  if tg_op = 'INSERT' then
    perform public.notify_order_placed_email(new.id);
  end if;

  select push_token into v_token from public.profiles where id = new.profile_id;
  if v_token is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_title := 'Order placed';
    v_body := 'We received your order ' || new.order_number || '. We''ll notify you as it''s confirmed.';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    v_title := case new.status
      when 'confirmed' then 'Order confirmed'
      when 'processing' then 'Order is being prepared'
      when 'shipped' then 'Order shipped'
      when 'delivered' then 'Order delivered'
      when 'cancelled' then 'Order cancelled'
      else 'Order update'
    end;
    v_body := case new.status
      when 'confirmed' then 'Your order ' || new.order_number || ' has been confirmed.'
      when 'processing' then 'Your order ' || new.order_number || ' is being prepared.'
      when 'shipped' then 'Your order ' || new.order_number || ' is on its way!'
      when 'delivered' then 'Your order ' || new.order_number || ' has been delivered. Enjoy!'
      when 'cancelled' then 'Your order ' || new.order_number || ' was cancelled.'
      else 'Your order ' || new.order_number || ' status changed to ' || new.status || '.'
    end;
  else
    return new;
  end if;

  perform public.send_expo_push_notification(
    v_token, v_title, v_body,
    jsonb_build_object('type', 'order_status', 'order_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;
