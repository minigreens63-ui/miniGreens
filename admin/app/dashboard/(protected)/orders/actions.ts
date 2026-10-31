"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@mobile/database";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath("/dashboard/orders");
}

// A before-delete trigger (orders_release_before_delete, see
// 20260930120000_order_stock_ledger.sql) releases any stock this order was
// still holding before the row — and its order_items — cascade away.
export async function deleteOrder(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  revalidatePath("/dashboard/orders");
  return { error: error?.message ?? null };
}
