"use client";

import { useState, useMemo, useTransition } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { Database } from "@mobile/database";
import { updateOrderStatus } from "@/app/dashboard/(protected)/orders/actions";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Database["public"]["Tables"]["order_items"]["Row"][];
  profiles: { full_name: string; email: string | null } | null;
  addresses: Database["public"]["Tables"]["addresses"]["Row"] | null;
};
type OrderStatus = OrderRow["status"];
type OrderType = OrderRow["order_type"];

// A business order's "customer" is the café/shop, not a profile — profiles.full_name
// is usually blank for a partner's business row, so read the columns the order
// actually carries instead of falling through to a profile that isn't the point of contact.
function customerLabel(o: OrderRow): string {
  if (o.order_type === "business") {
    return o.business_name || o.contact_person || "—";
  }
  return o.profiles?.full_name || o.profiles?.email || "—";
}

const TYPE_LABEL: Record<OrderType, string> = {
  standard: "Standard",
  business: "Business",
  preorder: "Preorder",
  subscription: "Subscription",
};

const STATUS_BADGE: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Processing", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  shipped: { label: "Shipped", classes: "bg-teal-50 text-teal-700 border-teal-200" },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", classes: "bg-red-50 text-red-700 border-red-200" },
};

type TabKey = "all" | OrderStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const tabCount = (orders: OrderRow[], key: TabKey) =>
  key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

export default function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [drawerStatus, setDrawerStatus] = useState<OrderStatus | "">("");
  const [isPending, startTransition] = useTransition();

  const typesPresent = useMemo(
    () => Array.from(new Set(orders.map((o) => o.order_type))) as OrderType[],
    [orders],
  );

  const filtered = useMemo(() => {
    let result = tab === "all" ? orders : orders.filter((o) => o.status === tab);
    if (typeFilter !== "all") {
      result = result.filter((o) => o.order_type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          customerLabel(o).toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, tab, typeFilter, search]);

  function openDrawer(order: OrderRow) {
    setSelectedOrder(order);
    setDrawerStatus(order.status);
  }

  function closeDrawer() {
    setSelectedOrder(null);
    setDrawerStatus("");
  }

  function saveStatus() {
    if (!selectedOrder || !drawerStatus) return;
    startTransition(async () => {
      await updateOrderStatus(selectedOrder.id, drawerStatus);
      setSelectedOrder({ ...selectedOrder, status: drawerStatus });
    });
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto animate-fade-up" style={{ "--i": 1 } as React.CSSProperties}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150
              ${tab === key
                ? "border-[#3D7A52] text-[#0A2416]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
          >
            {label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
              ${tab === key ? "bg-emerald-100 text-[#3D7A52]" : "bg-slate-100 text-slate-400"}`}>
              {tabCount(orders, key)}
            </span>
          </button>
        ))}
      </div>

      {/* Search + type filter */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-3 animate-fade-up" style={{ "--i": 2 } as React.CSSProperties}>
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders or customers…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none
              focus:ring-2 focus:ring-emerald-200 focus:border-[#3D7A52] transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {typesPresent.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors
                ${typeFilter === "all"
                  ? "bg-[#0A2416] border-[#0A2416] text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
            >
              All types
            </button>
            {typesPresent.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors
                  ${typeFilter === t
                    ? "bg-[#0A2416] border-[#0A2416] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto animate-fade-up" style={{ "--i": 3 } as React.CSSProperties}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Order Number", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                  No orders match your filters.
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const badge = STATUS_BADGE[o.status];
              const itemSummary = o.order_items
                .map((i) => `${i.product_name} ×${i.quantity}`)
                .join(", ");
              return (
                <tr
                  key={o.id}
                  onClick={() => openDrawer(o)}
                  className="hover:bg-emerald-50/50 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {o.order_number}
                    {o.oversold && (
                      <span
                        title="Confirming this order took stock below zero. Check inventory."
                        className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                      >
                        Oversold
                      </span>
                    )}
                    {o.order_type !== "standard" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {o.order_type}
                      </span>
                    )}
                    {o.is_gift && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pink-700">
                        🎁 Gift
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {customerLabel(o)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">
                    {itemSummary}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    ₹{o.total.toFixed(0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over drawer */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={closeDrawer}
          />
          <aside className="fixed right-0 top-0 h-full bg-white z-50 shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-y-auto"
            style={{ width: 400 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <p className="font-mono text-xs text-slate-400">{selectedOrder.order_number}</p>
                <h2 className="text-base font-semibold text-[#0A2416] mt-0.5">
                  {customerLabel(selectedOrder)}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-[0.97]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Status update */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Update Status
                </label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#3D7A52] transition-all"
                >
                  {(Object.keys(STATUS_BADGE) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_BADGE[s].label}
                    </option>
                  ))}
                </select>
                {drawerStatus !== selectedOrder.status && (
                  <button
                    onClick={saveStatus}
                    disabled={isPending}
                    className="mt-2 w-full py-2 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                    style={{ backgroundColor: "#CAEF61", color: "#0A2416" }}
                  >
                    {isPending ? "Saving..." : "Save Status"}
                  </button>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Items
                </p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 leading-tight">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-400">qty {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Delivery fee</p>
                  <p className="text-xs text-slate-500">₹{selectedOrder.delivery_fee.toFixed(0)}</p>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-400">
                      Discount{selectedOrder.discount_code ? ` · ${selectedOrder.discount_code}` : ""}
                    </p>
                    <p className="text-xs font-medium text-[#3D7A52]">
                      −₹{selectedOrder.discount_amount.toFixed(0)}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-bold text-[#0A2416]">Total</p>
                  <p className="text-sm font-bold text-[#0A2416]">₹{selectedOrder.total.toFixed(0)}</p>
                </div>
              </div>

              {/* Business contact (business orders only — no delivery_address_id) */}
              {selectedOrder.order_type === "business" && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Business Contact
                  </p>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-0.5">
                    <p className="font-medium">{selectedOrder.business_name ?? "—"}</p>
                    <p className="text-slate-500">{selectedOrder.contact_person}</p>
                    {selectedOrder.business_phone && (
                      <p className="text-slate-500">{selectedOrder.business_phone}</p>
                    )}
                    {selectedOrder.business_address && (
                      <p className="text-slate-500">{selectedOrder.business_address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Gift details */}
              {selectedOrder.is_gift && (
                <div>
                  <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-2">
                    🎁 Gift Order{selectedOrder.gift_occasion ? ` — ${selectedOrder.gift_occasion}` : ""}
                  </p>
                  <div className="rounded-xl bg-pink-50 border border-pink-100 px-4 py-3 text-sm text-slate-700 space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Recipient</p>
                      <p className="font-medium">{selectedOrder.gift_recipient_name ?? "—"}</p>
                      <p className="text-slate-500">{selectedOrder.gift_recipient_phone ?? "—"}</p>
                      <p className="text-slate-500">{selectedOrder.gift_recipient_address ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Sender</p>
                      <p className="font-medium">{selectedOrder.gift_sender_name ?? customerLabel(selectedOrder)}</p>
                      <p className="text-slate-500">{selectedOrder.gift_sender_phone ?? "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              {selectedOrder.addresses && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Delivery Address
                  </p>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-0.5">
                    <p className="font-medium">{selectedOrder.addresses.full_name}</p>
                    <p className="text-slate-500">{selectedOrder.addresses.phone}</p>
                    <p className="text-slate-500">
                      {selectedOrder.addresses.street}, {selectedOrder.addresses.city}{" "}
                      {selectedOrder.addresses.zip_code}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery window */}
              {(selectedOrder.delivery_date || selectedOrder.delivery_time) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Delivery Window
                  </p>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p>{selectedOrder.delivery_date}{selectedOrder.delivery_time ? ` · ${selectedOrder.delivery_time}` : ""}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Customer Notes
                  </p>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
