"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@mobile/database";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export async function createProduct(product: ProductInsert) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("products").insert(product);
  revalidatePath("/dashboard/products");
}

export async function updateProduct(id: string, patch: ProductUpdate) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("products").update(patch).eq("id", id);
  revalidatePath("/dashboard/products");
}

// Products with real order/subscription history can't be hard-deleted: the
// stock ledger (stock_movements) and subscription_items both reference the
// product row without cascading, so the delete hits a foreign key violation
// (23503). In that case we hide the product from sale instead — same intent
// ("stop selling this"), without corrupting past orders' stock records.
export async function deleteProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      const { error: hideError } = await supabase
        .from("products")
        .update({ is_available: false })
        .eq("id", id);
      revalidatePath("/dashboard/products");
      return {
        error: hideError?.message ?? null,
        archivedInstead: !hideError,
      };
    }
    return { error: error.message, archivedInstead: false };
  }

  revalidatePath("/dashboard/products");
  return { error: null, archivedInstead: false };
}
