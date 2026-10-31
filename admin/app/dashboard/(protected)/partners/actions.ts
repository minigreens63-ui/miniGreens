"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, KycDocument } from "@mobile/database";

type ProfileMatch = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "phone"
>;

const KYC_MAX_FILES = 5;
const KYC_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const KYC_ALLOWED_TYPES = /^image\/|^application\/pdf$/;

// Admin-initiated uploads go through the service-role client so they land in
// the partner's own uid-scoped storage folder regardless of who's logged
// in — the storage RLS policies only let a user write under their own uid
// (see 20260831000000_partner_kyc.sql), which an admin never is.
async function uploadKycFiles(profileId: string, files: File[]): Promise<{ docs: KycDocument[]; error: string | null }> {
  const usable = files.filter((f) => f.size > 0).slice(0, KYC_MAX_FILES);
  if (usable.length === 0) return { docs: [], error: null };

  const adminClient = createSupabaseAdminClient();
  const docs: KycDocument[] = [];
  const errors: string[] = [];

  for (const file of usable) {
    if (file.size > KYC_MAX_BYTES) {
      errors.push(`${file.name} is larger than 10MB.`);
      continue;
    }
    if (!KYC_ALLOWED_TYPES.test(file.type)) {
      errors.push(`${file.name} must be an image or PDF.`);
      continue;
    }
    const path = `${profileId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await adminClient.storage.from("partner-kyc").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }
    docs.push({ name: file.name, path, uploaded_at: new Date().toISOString() });
  }

  return { docs, error: errors.length > 0 ? errors.join(" ") : null };
}

// Lets an admin attach KYC documents to a partner who already has a
// profile_id (an invited partner before they've signed in, or any existing
// partner row). Used both at creation time and later from the review drawer.
export async function uploadPartnerKycFiles(profileId: string, formData: FormData) {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  return uploadKycFiles(profileId, files);
}

export async function addKycDocuments(partnerId: string, docs: KycDocument[]) {
  if (docs.length === 0) return { error: null };
  const supabase = await createSupabaseServerClient();
  const { data: partner, error: fetchError } = await supabase
    .from("partners")
    .select("kyc_documents")
    .eq("id", partnerId)
    .single();
  if (fetchError || !partner) return { error: fetchError?.message ?? "Partner not found." };

  const merged = [...(partner.kyc_documents as KycDocument[]), ...docs];
  const { error } = await supabase.from("partners").update({ kyc_documents: merged }).eq("id", partnerId);
  revalidatePath("/dashboard/partners");
  return { error: error?.message ?? null };
}

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
  kycDocuments?: KycDocument[];
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("partners").insert({
    profile_id: input.profileId,
    business_type: input.businessType,
    business_name: input.businessName,
    contact_person: input.contactPerson,
    phone: input.phone,
    address: input.address || null,
    kyc_documents: input.kycDocuments ?? [],
  });
  revalidatePath("/dashboard/partners");
  return { error: error?.message ?? null };
}

// For a partner who doesn't have an MGC account yet. Creates the auth user
// and emails them an invite link; the webapp/mobile app is passwordless
// (email OTP), so that link just signs them in and lands them on /welcome
// to finish their profile — no password-set step needed. Created as
// "pending" so the existing approve/reject drawer works unchanged.
export async function invitePartner(
  input: {
    email: string;
    fullName: string;
    businessType: Database["public"]["Tables"]["partners"]["Row"]["business_type"];
    businessName: string;
    contactPerson: string;
    phone: string;
    address?: string;
  },
  kycFormData?: FormData,
) {
  const trimmedEmail = input.email.trim().toLowerCase();
  if (!trimmedEmail) return { error: "Email is required.", warning: null };

  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: { full_name: input.fullName.trim() },
    redirectTo: `${process.env.NEXT_PUBLIC_WEBAPP_URL ?? ""}/welcome`,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Could not invite that email.", warning: null };
  }

  // The invited user's id only exists now, so KYC docs — which the admin
  // may already have in hand even though the partner hasn't signed in
  // yet — can only be uploaded after this point.
  let kycDocuments: KycDocument[] = [];
  let kycError: string | null = null;
  if (kycFormData) {
    const files = kycFormData.getAll("files").filter((f): f is File => f instanceof File);
    const result = await uploadKycFiles(data.user.id, files);
    kycDocuments = result.docs;
    kycError = result.error;
  }

  const { error: partnerError } = await adminClient.from("partners").insert({
    profile_id: data.user.id,
    business_type: input.businessType,
    business_name: input.businessName,
    contact_person: input.contactPerson,
    phone: input.phone,
    address: input.address || null,
    kyc_documents: kycDocuments,
  });
  if (partnerError) return { error: partnerError.message, warning: null };

  revalidatePath("/dashboard/partners");
  return { error: null, warning: kycError };
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
