import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminsClient from "@/components/AdminsClient";

export default async function AdminsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user?.id ?? "")
    .single();

  if (!me?.is_super_admin) redirect("/dashboard");

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_super_admin, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  return (
    <div className="px-6 py-8 md:px-10 max-w-[1400px]">
      <div className="mb-8 animate-fade-up" style={{ "--i": 0 } as React.CSSProperties}>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#3D7A52] mb-1">
          Management
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2416]">Admins</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
        <AdminsClient admins={admins ?? []} currentUserId={user?.id ?? ""} />
      </div>
    </div>
  );
}
