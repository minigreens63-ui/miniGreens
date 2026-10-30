"use client";

import { useState, useTransition } from "react";
import { X, Plus, Trash, ShieldCheck } from "@phosphor-icons/react";
import type { Database } from "@mobile/database";
import { PasswordInput } from "@/components/PasswordInput";
import {
  addAdmin,
  sendPasswordReset,
  setPasswordDirectly,
  removeAdmin,
} from "@/app/dashboard/(protected)/admins/actions";

type Admin = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "is_super_admin" | "created_at"
>;

export default function AdminsClient({
  admins,
  currentUserId,
}: {
  admins: Admin[];
  currentUserId: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "" });
  const [selected, setSelected] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDrawer() {
    setSelected(null);
    setNewPassword("");
    setMessage(null);
    setError(null);
  }

  function handleInvite() {
    if (!form.email.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addAdmin(form.email, form.fullName);
        setForm({ email: "", fullName: "" });
        setShowAdd(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not invite that admin.");
      }
    });
  }

  function handleSendReset(admin: Admin) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await sendPasswordReset(admin.email ?? "");
        setMessage(`Password reset email sent to ${admin.email}.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send the reset email.");
      }
    });
  }

  function handleSetPassword(admin: Admin) {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await setPasswordDirectly(admin.id, newPassword);
        setNewPassword("");
        setMessage("Password updated.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not set the password.");
      }
    });
  }

  function handleRemove(admin: Admin) {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await removeAdmin(admin.id);
        closeDrawer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove this admin.");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 animate-fade-up" style={{ "--i": 1 } as React.CSSProperties}>
        <p className="text-sm text-slate-500">{admins.length} admin{admins.length === 1 ? "" : "s"}</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.97]"
          style={{ backgroundColor: "#CAEF61", color: "#0A2416" }}
        >
          <Plus size={16} weight="bold" />
          Add Admin
        </button>
      </div>

      <div className="overflow-x-auto animate-fade-up" style={{ "--i": 2 } as React.CSSProperties}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Name", "Email", "Super Admin", "Added"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm">
                  No admins yet.
                </td>
              </tr>
            )}
            {admins.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                className="hover:bg-emerald-50/50 transition-colors duration-150 cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-slate-800">{a.full_name || "—"}</td>
                <td className="px-6 py-4 text-slate-600">{a.email}</td>
                <td className="px-6 py-4">
                  {a.is_super_admin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <ShieldCheck size={12} weight="fill" /> Super admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer: reset password / remove */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={closeDrawer} />
          <aside
            className="fixed right-0 top-0 h-full bg-white z-50 shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-y-auto"
            style={{ width: 400 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs text-slate-400">{selected.email}</p>
                <h2 className="text-base font-semibold text-[#0A2416] mt-0.5">{selected.full_name || "Admin"}</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-[0.97]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Reset password
                </p>
                <button
                  disabled={isPending}
                  onClick={() => handleSendReset(selected)}
                  className="w-full py-2 text-sm font-semibold rounded-xl bg-[#0A2416] text-white transition-all active:scale-[0.97] disabled:opacity-40"
                >
                  Email a reset link
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Sends {selected.email} a link to set their own new password. Prefer this —
                  it proves they're the one setting it.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Or set it directly
                </p>
                <PasswordInput
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  disabled={isPending || newPassword.length < 8}
                  onClick={() => handleSetPassword(selected)}
                  className="mt-2.5 w-full py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.97] disabled:opacity-40"
                >
                  Set password now
                </button>
              </div>

              <button
                disabled={isPending || selected.id === currentUserId}
                onClick={() => handleRemove(selected)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Trash size={15} />
                Remove Admin Access
              </button>
              {selected.id === currentUserId && (
                <p className="text-xs text-slate-400 text-center">You can&apos;t remove your own access.</p>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Add admin modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
                <h2 className="text-base font-semibold text-[#0A2416]">Add Admin</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-[0.97]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <input
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#3D7A52]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#3D7A52]"
                />
                <p className="text-xs text-slate-400">
                  They&apos;ll get an email invite to set their own password and sign in.
                </p>
                <button
                  disabled={isPending || !form.email.trim()}
                  onClick={handleInvite}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-40"
                  style={{ backgroundColor: "#CAEF61", color: "#0A2416" }}
                >
                  {isPending ? "Sending invite…" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
