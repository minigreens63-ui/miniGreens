"use client";

import Image from "next/image";
import { productImageFit } from "@/lib/productImages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Minus, Plus, Trash } from "@phosphor-icons/react";
import { useCartStore, cartSubtotal } from "@/store/useCartStore";
import { displayName } from "@/lib/productCopy";

const DELIVERY_FEE = 35.49;

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = cartSubtotal(items);
  const total = items.length > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">Your Bag</p>
          <h1 className="font-serif-display mt-3 text-4xl leading-[1.08] text-(--color-forest) sm:text-5xl">Your Cart</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-(--color-forest)/70">
            Nothing sits in a warehouse. We harvest to order.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white p-10 text-center shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
            <p className="text-(--color-forest)/70">Your cart is empty.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Browse teas
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_minmax(0,1fr)]">
            <div className="space-y-4">
              {items.map((item) => {
                const name = displayName(item.name);
                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_2px_14px_rgba(31,58,36,0.06)]"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--color-cream)">
                      {item.image ? (
                        <Image src={item.image} alt={name} fill className={productImageFit(item.image)} sizes="64px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Leaf size={20} className="text-(--color-forest)/30" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-(--color-forest)">{name}</p>
                      <p className="text-sm text-(--color-forest)/70">₹{item.price} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="flex size-8 items-center justify-center rounded-full border border-black/[0.07] text-(--color-forest) transition-colors hover:border-(--color-forest)"
                      >
                        <Minus size={12} weight="bold" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="flex size-8 items-center justify-center rounded-full border border-black/[0.07] text-(--color-forest) transition-colors hover:border-(--color-forest)"
                      >
                        <Plus size={12} weight="bold" />
                      </button>
                    </div>

                    <p className="w-16 shrink-0 text-right font-semibold text-(--color-forest)">
                      ₹{item.price * item.quantity}
                    </p>

                    <button
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.07] text-(--color-forest)/70 transition-colors hover:border-(--color-sale) hover:text-(--color-sale)"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
              <h2 className="font-serif-display text-2xl text-(--color-forest)">Order Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-(--color-forest)/70">
                  <dt>Subtotal</dt>
                  <dd>₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-(--color-forest)/70">
                  <dt>Delivery</dt>
                  <dd>₹{DELIVERY_FEE.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-black/[0.07] pt-3 text-base font-semibold text-(--color-forest)">
                  <dt>Total</dt>
                  <dd>₹{total.toFixed(2)}</dd>
                </div>
              </dl>
              <button
                onClick={() => router.push("/checkout")}
                className="mt-6 w-full rounded-full bg-(--color-sun) px-7 py-4 font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
              >
                Proceed to checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
