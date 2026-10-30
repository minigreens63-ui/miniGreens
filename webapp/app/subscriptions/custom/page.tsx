"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Repeat, PencilSimple } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CheckoutForm, type DeliveryDetails } from "@/components/CheckoutForm";
import { VISIBLE_CATEGORY_SLUGS } from "@/lib/categories";

interface ProductOption {
  id: string;
  slug: string;
  name: string;
  price: number;
  unit: string | null;
}

export default function CustomSubscriptionPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [locked, setLocked] = useState(false);
  // Deep links from the homepage: `?frequency=weekly|monthly` presets the cadence and
  // `?product=<slug>` pre-selects one of that product. Kept for the login round-trip.
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(window.location.search);
    const freq = params.get("frequency");
    if (freq === "weekly" || freq === "monthly") setFrequency(freq);
    const preselect = params.get("product");

    const supabase = createSupabaseBrowserClient();
    supabase
      .from("categories")
      .select("id, slug")
      .in("slug", VISIBLE_CATEGORY_SLUGS)
      .then(async ({ data: cats }) => {
        const catIds = (cats ?? []).map((c) => c.id);
        const { data } = await supabase
          .from("products")
          .select("id, slug, name, price, unit, category_id")
          .eq("is_available", true)
          .in("category_id", catIds)
          .order("name");

        const rows = (data ?? []) as ProductOption[];
        setProducts(rows);
        const match = preselect ? rows.find((p) => p.slug === preselect) : undefined;
        if (match) setQuantities((prev) => (prev[match.id] ? prev : { ...prev, [match.id]: 1 }));
        setLoadingProducts(false);
      });
  }, []);

  const selectedEntries = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0),
    [quantities],
  );

  const subtotal = useMemo(
    () =>
      selectedEntries.reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === id);
        return sum + (product ? Number(product.price) * qty : 0);
      }, 0),
    [selectedEntries, products],
  );

  function adjustQty(id: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }

  async function handleConfirm(details: DeliveryDetails) {
    if (!user || selectedEntries.length === 0) return;
    const supabase = createSupabaseBrowserClient();

    if (details.dateOfBirth) {
      await supabase.from("profiles").update({ date_of_birth: details.dateOfBirth }).eq("id", user.id);
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        profile_id: user.id,
        plan_id: null,
        is_custom: true,
        custom_frequency: frequency,
        status: "active",
        address_id: details.addressId,
        next_delivery_date: details.deliveryDate || null,
        terms_accepted: details.termsAccepted,
        sms_whatsapp_consent: details.smsWhatsappConsent,
      })
      .select()
      .single();

    if (subError || !subscription) {
      throw new Error(subError?.message ?? "Could not start your subscription.");
    }

    const { error: itemsError } = await supabase.from("subscription_items").insert(
      selectedEntries.map(([productId, quantity]) => ({
        subscription_id: subscription.id,
        product_id: productId,
        quantity,
      })),
    );

    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  return (
    <div className="bg-(--color-cream)">
      <div className="border-b border-(--color-forest)/10">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            <Repeat size={16} weight="fill" />
            Build Your Own Subscription
          </p>
          <h1 className="font-serif-display mt-2 text-3xl text-(--color-forest) sm:text-4xl">
            Choose Exactly What You Need
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--color-forest)/70">
            Pick your products, set your quantities, and choose weekly or monthly delivery.
            Nothing is charged now — we confirm every order over the phone.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        {!user && !authLoading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-[0_4px_20px_rgba(31,58,36,0.08)]">
            <p className="text-(--color-forest)/70">Log in to build a custom subscription.</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/subscriptions/custom${search}`)}`}
              className="mt-6 inline-flex rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Log in
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.3fr]">
            <aside className="h-fit rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(31,58,36,0.08)] ring-1 ring-(--color-forest)/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-(--color-leaf)">
                <Repeat size={14} weight="fill" />
                {frequency === "weekly" ? "Weekly" : "Monthly"}
              </div>
              <h2 className="font-serif-display mt-2 text-2xl text-(--color-forest)">
                Your custom box
              </h2>

              {selectedEntries.length === 0 ? (
                <p className="mt-4 text-sm text-(--color-forest)/70">
                  No products selected yet — choose at least one to continue.
                </p>
              ) : (
                <ul className="mt-4 space-y-2 border-t border-(--color-forest)/10 pt-4 text-sm text-(--color-forest)/70">
                  {selectedEntries.map(([id, qty]) => {
                    const product = products.find((p) => p.id === id);
                    if (!product) return null;
                    return (
                      <li key={id} className="flex items-center justify-between gap-2">
                        <span>
                          {product.name} <span className="text-xs">× {qty}</span>
                        </span>
                        <span className="shrink-0 text-(--color-forest)">
                          ₹{(Number(product.price) * qty).toFixed(0)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-6 flex items-baseline justify-between border-t border-(--color-forest)/10 pt-5">
                <span className="text-sm text-(--color-forest)/70">
                  Billed {frequency === "weekly" ? "/ week" : "/ month"}
                </span>
                <span className="font-serif-display text-2xl text-(--color-forest)">₹{subtotal.toFixed(0)}</span>
              </div>

              {locked && (
                <button
                  onClick={() => setLocked(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-(--color-forest) underline underline-offset-4 hover:text-(--color-leaf)"
                >
                  <PencilSimple size={14} />
                  Edit selection
                </button>
              )}
            </aside>

            {!locked ? (
              <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(31,58,36,0.08)] ring-1 ring-(--color-forest)/10 md:p-8">
                <h2 className="font-serif-display text-2xl text-(--color-forest)">
                  1. Choose your products
                </h2>

                {loadingProducts ? (
                  <p className="mt-4 text-sm text-(--color-forest)/70">Loading products…</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {products.map((product) => {
                      const qty = quantities[product.id] ?? 0;
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
                            qty > 0 ? "border-(--color-forest) bg-(--color-cream)" : "border-(--color-forest)/15"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-(--color-forest)">{product.name}</p>
                            <p className="text-xs text-(--color-forest)/60">
                              ₹{Number(product.price).toFixed(0)} {product.unit ? `/ ${product.unit}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => adjustQty(product.id, -1)}
                              disabled={qty === 0}
                              aria-label={`Decrease ${product.name} quantity`}
                              className="flex size-8 items-center justify-center rounded-full border border-(--color-forest)/15 text-(--color-forest) transition-colors hover:border-(--color-forest) disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-5 text-center text-sm font-semibold text-(--color-forest)">{qty}</span>
                            <button
                              type="button"
                              onClick={() => adjustQty(product.id, 1)}
                              aria-label={`Increase ${product.name} quantity`}
                              className="flex size-8 items-center justify-center rounded-full border border-(--color-forest)/15 text-(--color-forest) transition-colors hover:border-(--color-forest)"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <h2 className="font-serif-display mt-8 text-2xl text-(--color-forest)">
                  2. Choose your frequency
                </h2>
                <div className="mt-4 flex gap-3">
                  {(["weekly", "monthly"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFrequency(option)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
                        frequency === option
                          ? "border-(--color-forest) bg-(--color-forest) text-white"
                          : "border-(--color-forest)/15 text-(--color-forest) hover:border-(--color-forest)"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={selectedEntries.length === 0}
                  onClick={() => setLocked(true)}
                  className="mt-8 w-full rounded-full bg-(--color-sun) px-7 py-4 font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark) disabled:opacity-40"
                >
                  Continue to delivery details
                </button>
              </div>
            ) : (
              <CheckoutForm
                submitLabel="Start subscription"
                dateLabel="First delivery date"
                confirmationTitle="Subscription started"
                confirmationBody={`Your custom ${frequency} box is set up. Nothing has been charged. We confirm each delivery before harvest.`}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
