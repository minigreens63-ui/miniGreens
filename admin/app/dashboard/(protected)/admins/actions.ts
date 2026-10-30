"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PATH = "/dashboard/admins";

// Every action re-checks is_super_admin itself (not just the page/nav),
// since a direct POST could otherwise skip the UI-level gate.
async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) throw new Error("Only a super admin can do this.");
  return user;
}

export async function addAdmin(email: string, fullName: string) {
  await requireSuperAdmin();
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error("Email is required.");

  const adminClient = createSupabaseAdminClient();

  // inviteUserByEmail creates the auth user (if needed) and emails them a
  // link to set their own first password — nobody but the new admin ever
  // sees it.
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: { full_name: fullName.trim() },
    redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL ?? ""}/dashboard/reset-password`,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not invite that email.");

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ role: "admin", full_name: fullName.trim() || undefined })
    .eq("id", data.user.id);
  if (profileError) throw new Error(profileError.message);

  revalidatePath(PATH);
}

export async function sendPasswordReset(email: string) {
  await requireSuperAdmin();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL ?? ""}/dashboard/reset-password`,
  });
  if (error) throw new Error(error.message);

  revalidatePath(PATH);
}

export async function setPasswordDirectly(adminId: string, password: string) {
  await requireSuperAdmin();
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(adminId, { password });
  if (error) throw new Error(error.message);

  revalidatePath(PATH);
}

export async function removeAdmin(adminId: string) {
  const actor = await requireSuperAdmin();
  if (actor.id === adminId) throw new Error("You can't remove your own admin access.");

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ role: "customer", is_super_admin: false })
    .eq("id", adminId);
  if (error) throw new Error(error.message);

  revalidatePath(PATH);
}
