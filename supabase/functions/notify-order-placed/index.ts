// Emails the MiniGreens team whenever a new order is placed, via Resend.
//
// Triggered by a direct pg_net call from the `notify_order_status_change()`
// trigger on public.orders (see supabase/migrations/*_order_email_notification.sql),
// not a Supabase Database Webhook — so the payload shape is whatever that
// trigger function sends, not the standard {type, record} webhook envelope.
// The call must include the header `x-webhook-secret: <WEBHOOK_SECRET>`.
//
// Secrets (supabase secrets set ...):
//   RESEND_API_KEY     Resend API key
//   WEBHOOK_SECRET      shared secret, same value stored in private.secrets
//                        as 'order_notify_webhook_secret'
//   ORDER_NOTIFY_TO     recipient inbox (default mgc.bangalore@gmail.com)
//   ORDER_NOTIFY_FROM   verified sender, e.g.
//                        "MiniGreens Orders <orders@mail.minigreenscompany.com>"

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (n: number) => `₹${Number(n ?? 0).toFixed(2)}`;

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const order = await req.json();
  if (!order?.order_number) return new Response("ignored", { status: 200 });

  const address = [order.address_line, order.address_city, order.address_state]
    .filter(Boolean)
    .join(", ");

  const html = `
    <h2>New order placed: ${esc(order.order_number)}</h2>
    <p><b>Customer:</b> ${esc(order.customer_name)}<br>
       <b>Phone:</b> ${esc(order.customer_phone ?? "—")}</p>
    <p><b>Total:</b> ${money(order.total)} (subtotal ${money(order.subtotal)} + delivery ${money(order.delivery_fee)})<br>
       <b>Delivery date:</b> ${esc(order.delivery_date ?? "—")}<br>
       <b>Delivery address:</b> ${esc(address || "—")}</p>
    ${order.notes ? `<p><b>Notes:</b> ${esc(order.notes)}</p>` : ""}
    <p><a href="https://admin.minigreenscompany.com/dashboard/orders">View in admin dashboard</a></p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `order-placed-${order.id}`,
    },
    body: JSON.stringify({
      from: Deno.env.get("ORDER_NOTIFY_FROM") ?? "MiniGreens Orders <onboarding@resend.dev>",
      to: [Deno.env.get("ORDER_NOTIFY_TO") ?? "mgc.bangalore@gmail.com"],
      subject: `New order ${order.order_number} — ${money(order.total)}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return new Response("send failed", { status: 502 });
  }
  return new Response("ok", { status: 200 });
});
