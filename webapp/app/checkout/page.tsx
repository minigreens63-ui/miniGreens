"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Gift, MapPin, Plus, Trash } from "@phosphor-icons/react";
import type { Database } from "@mobile/database";
import { useAuth } from "@/context/AuthContext";
import { useCartStore, cartSubtotal } from "@/store/useCartStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/skeletons/Skeleton";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
const NEW_ADDRESS = "new";

const DELIVERY_FEE = 35.49;

interface DeliveryDetails {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  zipCode: string;
  notes: string;
}

const EMPTY: DeliveryDetails = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  zipCode: "",
  notes: "",
};

const LEAD_TIME_DAYS = 7;

function estimatedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + LEAD_TIME_DAYS);
  return date.toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-xl border border-black/[0.07] bg-white px-4 py-3 text-sm text-(--color-forest) outline-none transition-colors placeholder:text-(--color-forest)/70 focus:border-(--color-forest)";
const labelClass = "mb-2 block text-xs font-semibold tracking-wide text-(--color-forest)/70 uppercase";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [details, setDetails] = useState<DeliveryDetails>(EMPTY);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressChoice, setAddressChoice] = useState<string>(NEW_ADDRESS);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const [isGift, setIsGift] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; phone: string | null } | null>(null);
  const [giftOccasion, setGiftOccasion] = useState("");
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientPhone, setGiftRecipientPhone] = useState("");
  const [giftRecipientAddress, setGiftRecipientAddress] = useState("");
  const [giftSenderName, setGiftSenderName] = useState("");
  const [giftSenderPhone, setGiftSenderPhone] = useState("");

  const subtotal = cartSubtotal(items);
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.amount, subtotal) : 0;
  const total = Math.max(subtotal - discountAmount + DELIVERY_FEE, 0);
  const usingSavedAddress = addressChoice !== NEW_ADDRESS;

  // Offer previously-saved addresses so returning users don't have to retype delivery
  // details every time.
  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("addresses")
      .select("*")
      .eq("profile_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        setAddresses(rows);
        if (rows.length > 0) setAddressChoice(rows[0].id);
      });
  }, [user]);

  // Own name/phone for the gift-sender fields, since gift mode hides the
  // address picker that would otherwise have filled these in.
  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {
    if (addressChoice === NEW_ADDRESS) return;
    const address = addresses.find((a) => a.id === addressChoice);
    if (!address) return;
    setDetails((prev) => ({
      ...prev,
      fullName: address.full_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      zipCode: address.zip_code,
    }));
  }, [addressChoice, addresses]);

  const update =
    (key: keyof DeliveryDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDetails((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    setCouponChecking(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: rpcError } = await supabase.rpc("validate_discount", {
      p_code: code,
      p_subtotal: subtotal,
    });
    setCouponChecking(false);
    if (rpcError) {
      setAppliedCoupon(null);
      setCouponError(rpcError.message);
      return;
    }
    if (!data || !data.valid) {
      setAppliedCoupon(null);
      setCouponError(data?.reason ?? "That coupon can't be applied.");
      return;
    }
    setAppliedCoupon({ code: data.code ?? code.toUpperCase(), amount: data.discount_amount ?? 0 });
    setCouponError(null);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  // Keep an applied coupon's discount in sync with the live subtotal, since
  // addresses/quantities can change while it's applied.
  useEffect(() => {
    if (!appliedCoupon) return;
    const code = appliedCoupon.code;
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase
      .rpc("validate_discount", { p_code: code, p_subtotal: subtotal })
      .then(({ data, error: rpcError }) => {
        if (cancelled || rpcError) return;
        if (!data || !data.valid) {
          setAppliedCoupon(null);
          setCouponError(data?.reason ?? "Coupon no longer applies to this order.");
          return;
        }
        const nextAmount = data.discount_amount ?? 0;
        setAppliedCoupon((prev) =>
          prev && prev.code === code && prev.amount !== nextAmount ? { code: prev.code, amount: nextAmount } : prev,
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function handleDeleteAddress(id: string) {
    if (!window.confirm("Remove this saved address?")) return;
    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("addresses").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (addressChoice === id) setAddressChoice(next[0]?.id ?? NEW_ADDRESS);
      return next;
    });
  }

  async function resolveAddressId(): Promise<string> {
    if (usingSavedAddress) return addressChoice;
    if (!user) throw new Error("Please sign in to continue.");

    const supabase = createSupabaseBrowserClient();
    const makeDefault = addresses.length === 0 || setAsDefault;

    if (setAsDefault && addresses.length > 0) {
      await supabase.from("addresses").update({ is_default: false }).eq("profile_id", user.id);
    }

    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        profile_id: user.id,
        label: "Delivery",
        full_name: details.fullName,
        phone: details.phone,
        street: details.street,
        apartment: null,
        city: details.city,
        state: "",
        zip_code: details.zipCode,
        is_default: makeDefault,
      })
      .select()
      .single();

    if (addressError || !address) {
      throw new Error(addressError?.message ?? "Could not save delivery address.");
    }
    return address.id;
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user || items.length === 0) return;
    if (isGift && (!giftRecipientName.trim() || !giftRecipientPhone.trim() || !giftRecipientAddress.trim())) {
      setError("Please add the recipient's name, phone and address for this gift.");
      return;
    }
    setPlacing(true);
    setError(null);

    let addressId: string | null = null;
    if (!isGift) {
      try {
        addressId = await resolveAddressId();
      } catch (err) {
        setPlacing(false);
        setError(err instanceof Error ? err.message : "Could not save delivery address.");
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();

    const orderNumber = `MG${Date.now().toString().slice(-8)}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        profile_id: user.id,
        status: "pending",
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        delivery_address_id: addressId,
        delivery_date: estimatedDeliveryDate(),
        delivery_time: null,
        notes: details.notes || null,
        order_type: "preorder",
        business_name: null,
        contact_person: null,
        business_phone: null,
        business_address: null,
        discount_code: appliedCoupon?.code ?? null,
        discount_amount: discountAmount,
        is_gift: isGift,
        gift_occasion: isGift ? giftOccasion.trim() || null : null,
        gift_recipient_name: isGift ? giftRecipientName.trim() : null,
        gift_recipient_phone: isGift ? giftRecipientPhone.trim() : null,
        gift_recipient_address: isGift ? giftRecipientAddress.trim() : null,
        gift_sender_name: isGift ? giftSenderName.trim() || profile?.full_name || null : null,
        gift_sender_phone: isGift ? giftSenderPhone.trim() || profile?.phone || null : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setPlacing(false);
      setError(orderError?.message ?? "Could not place order.");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
    );

    setPlacing(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    clearCart();
    setOrderId(order.id);
    setOrderTotal(Number(order.total));
  }

  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">Almost there</p>
          <h1 className="font-serif-display mt-3 text-4xl leading-[1.08] text-(--color-forest) sm:text-5xl">Checkout</h1>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-10 md:px-10">
        {orderId ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white p-8 text-center shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
            <CheckCircle size={44} weight="fill" className="mx-auto text-(--color-leaf)" />
            <h2 className="font-serif-display mt-5 text-2xl text-(--color-forest)">
              Pre-order placed
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-(--color-forest)/70">
              You won&apos;t be charged now. We&apos;ll notify you when it&apos;s confirmed for delivery.
            </p>
            <p className="mt-6 text-sm text-(--color-forest)">
              Total reserved: <span className="font-semibold">₹{orderTotal.toFixed(2)}</span>
            </p>
            <Link
              href="/orders"
              className="mt-6 inline-flex rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              View my orders
            </Link>
          </div>
        ) : authLoading ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_2px_14px_rgba(31,58,36,0.06)] md:p-8">
            <Skeleton className="h-6 w-40" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="mt-7 h-12 w-full rounded-full" />
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white p-10 text-center shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
            <p className="text-(--color-forest)/70">Sign in to continue to checkout.</p>
            <Link
              href="/login?redirect=/checkout"
              className="mt-6 inline-flex rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Sign in
            </Link>
          </div>
        ) : items.length === 0 ? (
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
          <form
            onSubmit={handlePlaceOrder}
            className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_2px_14px_rgba(31,58,36,0.06)] md:p-8"
          >
            <h2 className="font-serif-display text-2xl text-(--color-forest)">Delivery details</h2>
            <p className="mt-2 text-sm text-(--color-forest)/70">
              Pre-orders take about a week to prepare and deliver. We&apos;ll confirm your exact delivery slot over the phone.
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-black/[0.07] px-4 py-3.5">
              <Gift size={18} className="mt-0.5 shrink-0 text-(--color-forest)" />
              <label className="flex flex-1 cursor-pointer items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold text-(--color-forest)">Send this as a gift</span>
                  <span className="block text-sm text-(--color-forest)/70">
                    We&apos;ll deliver straight to the recipient and let you add an occasion.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-(--color-forest)"
                  checked={isGift}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGift(checked);
                    if (checked && !giftSenderName) setGiftSenderName(profile?.full_name ?? "");
                    if (checked && !giftSenderPhone) setGiftSenderPhone(profile?.phone ?? "");
                  }}
                />
              </label>
            </div>

            {isGift && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="giftOccasion">Occasion (optional)</label>
                  <input
                    id="giftOccasion"
                    className={inputClass}
                    value={giftOccasion}
                    onChange={(e) => setGiftOccasion(e.target.value)}
                    placeholder="e.g. Birthday"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="giftRecipientName">Recipient&apos;s name</label>
                  <input
                    id="giftRecipientName"
                    required
                    className={inputClass}
                    value={giftRecipientName}
                    onChange={(e) => setGiftRecipientName(e.target.value)}
                    placeholder="Who is this gift for?"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="giftRecipientPhone">Recipient&apos;s phone</label>
                  <input
                    id="giftRecipientPhone"
                    required
                    type="tel"
                    className={inputClass}
                    value={giftRecipientPhone}
                    onChange={(e) => setGiftRecipientPhone(e.target.value)}
                    placeholder="Their contact number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="giftRecipientAddress">Recipient&apos;s delivery address</label>
                  <textarea
                    id="giftRecipientAddress"
                    required
                    rows={2}
                    className={inputClass}
                    value={giftRecipientAddress}
                    onChange={(e) => setGiftRecipientAddress(e.target.value)}
                    placeholder="Where should we deliver the gift?"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="giftSenderName">Your name (sender)</label>
                  <input
                    id="giftSenderName"
                    className={inputClass}
                    value={giftSenderName}
                    onChange={(e) => setGiftSenderName(e.target.value)}
                    placeholder="So we know who it's from"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="giftSenderPhone">Your phone (sender)</label>
                  <input
                    id="giftSenderPhone"
                    type="tel"
                    className={inputClass}
                    value={giftSenderPhone}
                    onChange={(e) => setGiftSenderPhone(e.target.value)}
                    placeholder="In case we need to reach you"
                  />
                </div>
              </div>
            )}

            {!isGift && addresses.length > 0 && (
              <div className="mt-5 space-y-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      addressChoice === address.id
                        ? "border-(--color-forest) bg-(--color-cream)"
                        : "border-black/[0.07] hover:border-(--color-forest)/40"
                    }`}
                  >
                    <label className="flex flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="addressChoice"
                        className="mt-1 accent-(--color-forest)"
                        checked={addressChoice === address.id}
                        onChange={() => setAddressChoice(address.id)}
                      />
                      <MapPin size={16} className="mt-0.5 shrink-0 text-(--color-forest)" />
                      <span className="text-(--color-forest)">
                        <span className="flex items-center gap-2 font-medium">
                          {address.label}
                          {address.is_default && (
                            <span className="rounded-full bg-(--color-forest)/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-forest)">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="block text-(--color-forest)/70">
                          {address.street}, {address.city}, {address.state} {address.zip_code}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address.id)}
                      aria-label="Remove this address"
                      className="shrink-0 rounded-full p-1.5 text-(--color-forest)/40 transition-colors hover:bg-(--color-sale)/10 hover:text-(--color-sale)"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    addressChoice === NEW_ADDRESS
                      ? "border-(--color-forest) bg-(--color-cream)"
                      : "border-black/[0.07] hover:border-(--color-forest)/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    className="accent-(--color-forest)"
                    checked={addressChoice === NEW_ADDRESS}
                    onChange={() => setAddressChoice(NEW_ADDRESS)}
                  />
                  <Plus size={16} className="shrink-0 text-(--color-forest)" />
                  <span className="font-medium text-(--color-forest)">Add a new address</span>
                </label>
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {!isGift && !usingSavedAddress && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="fullName">Full name</label>
                    <input id="fullName" required className={inputClass} value={details.fullName} onChange={update("fullName")} placeholder="Riya Kapoor" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">Phone</label>
                    <input id="phone" required type="tel" className={inputClass} value={details.phone} onChange={update("phone")} placeholder="+91 98765 43210" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="street">Street address</label>
                    <input id="street" required className={inputClass} value={details.street} onChange={update("street")} placeholder="42 Green Park" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="city">City</label>
                    <input id="city" required className={inputClass} value={details.city} onChange={update("city")} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="zipCode">PIN code</label>
                    <input id="zipCode" required inputMode="numeric" className={inputClass} value={details.zipCode} onChange={update("zipCode")} placeholder="400001" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="notes">Delivery notes (optional)</label>
                <textarea id="notes" rows={3} className={inputClass} value={details.notes} onChange={update("notes")} placeholder="Ring the bell twice" />
              </div>
            </div>

            <div className="mt-6 border-t border-black/[0.07] pt-5">
              <label className={labelClass} htmlFor="couponCode">Coupon code</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-(--color-cream) px-4 py-3 text-sm">
                  <span className="font-semibold text-(--color-forest)">{appliedCoupon.code} applied</span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm font-semibold text-(--color-sale) hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="couponCode"
                    className={inputClass}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponChecking || !couponInput.trim()}
                    className="shrink-0 rounded-xl border border-(--color-forest)/20 px-5 text-sm font-semibold text-(--color-forest) transition-colors hover:border-(--color-forest) disabled:opacity-60"
                  >
                    {couponChecking ? "Checking..." : "Apply"}
                  </button>
                </div>
              )}
              {couponError && <p className="mt-2 text-sm text-(--color-sale)">{couponError}</p>}
            </div>

            <dl className="mt-6 space-y-2 border-t border-black/[0.07] pt-5 text-sm">
              <div className="flex justify-between text-(--color-forest)/70">
                <dt>Subtotal</dt>
                <dd>₹{subtotal.toFixed(2)}</dd>
              </div>
              {discountAmount > 0 && appliedCoupon && (
                <div className="flex justify-between text-(--color-leaf)">
                  <dt>Discount &middot; {appliedCoupon.code}</dt>
                  <dd>−₹{discountAmount.toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between text-(--color-forest)/70">
                <dt>Delivery</dt>
                <dd>₹{DELIVERY_FEE.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-(--color-forest)">
                <dt>Total</dt>
                <dd>₹{total.toFixed(2)}</dd>
              </div>
            </dl>

            {error && <p className="mt-4 text-sm text-(--color-sale)">{error}</p>}

            <button
              type="submit"
              disabled={placing}
              className="mt-7 w-full rounded-full bg-(--color-sun) px-7 py-4 font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark) disabled:opacity-60"
            >
              {placing ? "Placing pre-order..." : "Place pre-order"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
