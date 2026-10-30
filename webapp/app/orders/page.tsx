import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Database } from "@mobile/database";
import { PageShell } from "@/components/PageShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Orders | Mini Greens Company",
  robots: { index: false, follow: false },
};

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-(--color-cream-dark) text-(--color-forest)/60",
  confirmed: "bg-(--color-cream-dark) text-(--color-forest)/60",
  processing: "bg-(--color-leaf)/15 text-(--color-leaf)",
  shipped: "bg-(--color-leaf)/15 text-(--color-leaf)",
  delivered: "bg-(--color-forest)/10 text-(--color-forest)",
  cancelled: "bg-(--color-cream-dark) text-(--color-forest)/60 line-through",
};

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return (
    <PageShell
      eyebrow="My Orders"
      title="Everything You've Ordered So Far"
      intro="A record of every box we've cut for you, including anything currently on its way."
    >
      <div className="mb-6">
        <Link
          href="/subscriptions/manage"
          className="text-sm font-semibold text-(--color-forest) underline underline-offset-4 hover:text-(--color-leaf)"
        >
          Manage your subscriptions →
        </Link>
      </div>
      {(orders ?? []).length === 0 ? (
        <div className="rounded-2xl border border-black/[0.07] bg-white p-10 text-center shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
          <p className="text-(--color-forest)/70">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
          >
            Browse teas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(orders ?? []).map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_2px_14px_rgba(31,58,36,0.06)] transition-colors hover:border-(--color-forest)/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif-display text-xl text-(--color-forest)">
                      {order.order_number}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-(--color-forest)/60">
                    Placed{" "}
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {order.delivery_date &&
                      ` · Delivery ${order.delivery_date}${order.delivery_time ? `, ${order.delivery_time}` : ""}`}
                  </p>
                  <p className="mt-3 text-sm text-(--color-forest)/80">
                    {order.order_items.map((i) => `${i.quantity} × ${i.product_name}`).join(", ")}
                  </p>
                </div>
                <p className="font-display text-2xl font-semibold text-(--color-forest)">₹{Number(order.total).toFixed(0)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
