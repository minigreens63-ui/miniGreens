"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateSumamStatus(
  id: string,
  status: "pending" | "contacted" | "closed",
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("sumam_applications").update({ status }).eq("id", id);
  revalidatePath("/dashboard/sumam");
}

export async function deleteSumamApplication(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sumam_applications").delete().eq("id", id);
  revalidatePath("/dashboard/sumam");
  return { error: error?.message ?? null };
}
