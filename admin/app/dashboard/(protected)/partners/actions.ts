"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@mobile/database";

type ProfileMatch = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "phone"
>;

// The public "Become a Partner" apply form was removed from the webapp/mobile
// app, so this is now the only way a partner row gets created — the applicant
// still needs an existing MGC account (profile_id is a required FK), so admins
// look that account up by email/phone/name first, then create the partner
// row for it. Created as "pending" so the existing approve/reject drawer
// keeps working unchanged for admin-added partners too.
export async function searchProfilesForPartner(query: string): Promise<ProfileMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);
  return data ?? [];
}

export async function createPartner(input: {
  profileId: string;
  businessType: Database["public"]["Tables"]["partners"]["Row"]["business_type"];
  businessName: string;
  contactPerson: string;
  phone: string;
  address?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("partners").insert({
    profile_id: input.profileId,
    business_type: input.businessType,
    business_name: input.businessName,
    contact_person: input.contactPerson,
    phone: input.phone,
    address: input.address || null,
  });
  revalidatePath("/dashboard/partners");
  return { error: error?.message ?? null };
}

export async function approvePartner(partnerId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("partners").update({ status: "approved" }).eq("id", partnerId);
  revalidatePath("/dashboard/partners");
}

export async function rejectPartner(partnerId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("partners").update({ status: "rejected" }).eq("id", partnerId);
  revalidatePath("/dashboard/partners");
}

export async function updatePartnerFee(partnerId: string, feePercent: number) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("partners").update({ platform_fee_percent: feePercent }).eq("id", partnerId);
  revalidatePath("/dashboard/partners");
}

export async function updateKycStatus(
  partnerId: string,
  kycStatus: "pending" | "verified" | "rejected",
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("partners").update({ kyc_status: kycStatus }).eq("id", partnerId);
  revalidatePath("/dashboard/partners");
}
