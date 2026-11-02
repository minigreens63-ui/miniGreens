"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash } from "@phosphor-icons/react";
import type { Database } from "@mobile/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateSumamStatus, deleteSumamApplication } from "@/app/dashboard/(protected)/sumam/actions";

type Application = Database["public"]["Tables"]["sumam_applications"]["Row"];
type Status = Application["status"];

const STATUS_BADGE: Record<Status, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  contacted: { label: "Contacted", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  closed: { label: "Closed", classes: "bg-slate-100 text-slate-500 border-slate-200" },
};

type TabKey = "all" | Status;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

export default function SumamClient({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (tab === "all" ? applications : applications.filter((a) => a.status === tab)),
    [applications, tab],
  );

  function openDrawer(app: Application) {
    setSelected(app);
    setDeleteError(null);
  }

  function closeDrawer() {
    setSelected(null);
    setDeleteError(null);
  }

  function handleStatus(id: string, status: Status) {
    startTransition(async () => {
      await updateSumamStatus(id, status);
      setSelected((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    });
  }

  function handleDelete(app: Application) {
    if (!confirm(`Delete ${app.full_name}'s application? This can't be undone.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const { error } = await deleteSumamApplication(app.id);
      if (error) {
        setDeleteError(error);
        return;
      }
      closeDrawer();
      router.refresh();
    });
  }

  async function handleOpenDoc(path: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from("sumam-documents").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      alert("Could not open document: " + (error?.message ?? "unknown error"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 pt-4">
        <div className="flex gap-0 overflow-x-auto animate-fade-up" style={{ "--i": 1 } as React.CSSProperties}>
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
                {key === "all" ? applications.length : applications.filter((a) => a.status === key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto animate-fade-up" style={{ "--i": 2 } as React.CSSProperties}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Name", "Email", "Phone", "Document", "Status", "Applied"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                  No Sumam applications match your filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const badge = STATUS_BADGE[a.status];
              return (
                <tr
                  key={a.id}
                  onClick={() => openDrawer(a)}
                  className="hover:bg-emerald-50/50 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{a.full_name}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{a.email}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{a.phone}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {a.aadhaar_document ? "Uploaded" : "Missing"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(a.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={closeDrawer} />
          <aside
            className="fixed right-0 top-0 h-full bg-white z-50 shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-y-auto"
            style={{ width: 400 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs text-slate-400">Sumam application</p>
                <h2 className="text-base font-semibold text-[#0A2416] mt-0.5">{selected.full_name}</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-[0.97]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Applicant</p>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-1">
                  <p><span className="text-slate-400">Email:</span> {selected.email}</p>
                  <p><span className="text-slate-400">Phone:</span> {selected.phone}</p>
                  <p><span className="text-slate-400">Address:</span> {selected.address}</p>
                  {selected.message && <p><span className="text-slate-400">Message:</span> {selected.message}</p>}
                  <p>
                    <span className="text-slate-400">Status:</span>{" "}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[selected.status].classes}`}>
                      {STATUS_BADGE[selected.status].label}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Aadhaar Document</p>
                {!selected.aadhaar_document ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400">No document uploaded.</p>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex-1 truncate text-slate-700" title={selected.aadhaar_document.name}>
                      {selected.aadhaar_document.name}
                    </span>
                    <button
                      onClick={() => handleOpenDoc(selected.aadhaar_document!.path)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all active:scale-[0.97]"
                    >
                      Open
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Update status
                </label>
                <div className="flex gap-2">
                  <button
                    disabled={isPending || selected.status === "contacted"}
                    onClick={() => handleStatus(selected.id, "contacted")}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    Mark Contacted
                  </button>
                  <button
                    disabled={isPending || selected.status === "closed"}
                    onClick={() => handleStatus(selected.id, "closed")}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    Mark Closed
                  </button>
                </div>
              </div>

              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

              <button
                disabled={isPending}
                onClick={() => handleDelete(selected)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Trash size={15} />
                Delete Application
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
