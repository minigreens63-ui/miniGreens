-- Lets a customer send an order as a gift: the recipient's name/phone/address
-- become the delivery details, while the sender's own name/phone (who placed
-- and paid for the order) are recorded separately so support can tell the two
-- apart. Surfaced in the order-placed email notification and the admin orders
-- list/detail.

alter table public.orders
  add column is_gift boolean not null default false,
  add column gift_occasion text,
  add column gift_recipient_name text,
  add column gift_recipient_phone text,
  add column gift_recipient_address text,
  add column gift_sender_name text,
  add column gift_sender_phone text;

create index orders_is_gift_idx on public.orders (is_gift) where is_gift;

-- Carry the gift fields into the order-placed email payload (same function
-- from 20261009083000_order_email_notification.sql, extended in place).
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
    'address_state', a.state,
    'is_gift', o.is_gift,
    'gift_occasion', o.gift_occasion,
    'gift_recipient_name', o.gift_recipient_name,
    'gift_recipient_phone', o.gift_recipient_phone,
    'gift_recipient_address', o.gift_recipient_address,
    'gift_sender_name', coalesce(o.gift_sender_name, p.full_name),
    'gift_sender_phone', coalesce(o.gift_sender_phone, p.phone)
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
