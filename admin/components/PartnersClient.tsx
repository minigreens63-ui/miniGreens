"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";
import type { Database, KycDocument, KycStatus } from "@mobile/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  approvePartner,
  rejectPartner,
  updatePartnerFee,
  updateKycStatus,
  createPartner,
  searchProfilesForPartner,
} from "@/app/dashboard/(protected)/partners/actions";

type Partner = Database["public"]["Tables"]["partners"]["Row"];
type PartnerStatus = Partner["status"];

const KYC_BADGE: Record<KycStatus, { label: string; classes: string }> = {
  pending: { label: "KYC pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "KYC verified", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "KYC rejected", classes: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_BADGE: Record<PartnerStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", classes: "bg-red-50 text-red-700 border-red-200" },
};

const BUSINESS_TYPE_LABELS: Record<Partner["business_type"], string> = {
  individual: "Individual Partner",
  women: "Women Partner",
  cafe: "Café",
  restaurant: "Restaurant",
  shop: "Shop",
  fitness_wellness: "Fitness/Wellness Partner",
  community: "Community Partner",
};

type TabKey = "all" | PartnerStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

type ProfileMatch = { id: string; full_name: string; email: string | null; phone: string | null };

const BUSINESS_TYPE_OPTIONS: Partner["business_type"][] = [
  "individual",
  "women",
  "cafe",
  "restaurant",
  "shop",
  "fitness_wellness",
  "community",
];

function AddPartnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [profile, setProfile] = useState<ProfileMatch | null>(null);
  const [businessType, setBusinessType] = useState<Partner["business_type"]>("individual");
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(value: string) {
    setQuery(value);
    setProfile(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const matches = await searchProfilesForPartner(value);
    setSearching(false);
    setResults(matches);
  }

  function pickProfile(p: ProfileMatch) {
    setProfile(p);
    setResults([]);
    setQuery(p.full_name);
    if (!contactPerson) setContactPerson(p.full_name);
    if (!phone && p.phone) setPhone(p.phone);
  }

  function handleSubmit() {
    if (!profile || !businessName.trim() || !contactPerson.trim() || !phone.trim()) {
      setError("Pick an account and fill business name, contact person and phone.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: createError } = await createPartner({
        profileId: profile.id,
        businessType,
        businessName: businessName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      if (createError) {
        setError(createError);
        return;
      }
      onCreated();
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0A2416]">Add Partner</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              MGC account (search by name, email or phone)
            </label>
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search existing accounts..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            {searching && <p className="mt-1 text-xs text-slate-400">Searching...</p>}
            {results.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickProfile(p)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50/50"
                    >
                      <span className="font-medium text-slate-800">{p.full_name}</span>{" "}
                      <span className="text-slate-400 text-xs">{p.email ?? p.phone ?? ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {profile && (
              <p className="mt-2 text-xs text-emerald-700">
                Selected: {profile.full_name} ({profile.email ?? profile.phone})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Business type
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as Partner["business_type"])}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {BUSINESS_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Business / grower name
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Contact person
              </label>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Address (optional)
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={isPending}
            onClick={handleSubmit}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[#0A2416] text-white transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add Partner"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function PartnersClient({ partners }: { partners: Partner[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [feeInput, setFeeInput] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (tab === "all" ? partners : partners.filter((p) => p.status === tab)),
    [partners, tab],
  );

  function openDrawer(partner: Partner) {
    setSelected(partner);
    setFeeInput(String(partner.platform_fee_percent));
  }

  function closeDrawer() {
    setSelected(null);
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      await approvePartner(id);
      closeDrawer();
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectPartner(id);
      closeDrawer();
    });
  }

  function handleSaveFee(id: string) {
    const fee = Number(feeInput);
    if (Number.isNaN(fee) || fee < 0 || fee > 100) return;
    startTransition(async () => {
      await updatePartnerFee(id, fee);
    });
  }

  function handleKycStatus(id: string, status: KycStatus) {
    startTransition(async () => {
      await updateKycStatus(id, status);
      setSelected((cur) => (cur && cur.id === id ? { ...cur, kyc_status: status } : cur));
    });
  }

  async function handleOpenDoc(path: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from("partner-kyc").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      alert("Could not open document: " + (error?.message ?? "unknown error"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <>
      {/* Tabs + Add Partner */}
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
              {key === "all" ? partners.length : partners.filter((p) => p.status === key).length}
            </span>
          </button>
        ))}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="shrink-0 rounded-xl bg-[#0A2416] px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.97]"
        >
          + Add Partner
        </button>
      </div>

      {addOpen && (
        <AddPartnerModal
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto animate-fade-up" style={{ "--i": 2 } as React.CSSProperties}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Business", "Type", "Contact", "Phone", "Fee", "Status", "Applied"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                  No partner applications match your filters.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const badge = STATUS_BADGE[p.status];
              return (
                <tr
                  key={p.id}
                  onClick={() => openDrawer(p)}
                  className="hover:bg-emerald-50/50 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{p.business_name}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{BUSINESS_TYPE_LABELS[p.business_type]}</td>
                  <td className="px-6 py-4 text-slate-600">{p.contact_person}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{p.phone}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{Number(p.platform_fee_percent)}%</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(p.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
                <p className="text-xs text-slate-400">{BUSINESS_TYPE_LABELS[selected.business_type]}</p>
                <h2 className="text-base font-semibold text-[#0A2416] mt-0.5">{selected.business_name}</h2>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Application</p>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-1">
                  <p><span className="text-slate-400">Contact:</span> {selected.contact_person}</p>
                  <p><span className="text-slate-400">Phone:</span> {selected.phone}</p>
                  {selected.address && <p><span className="text-slate-400">Address:</span> {selected.address}</p>}
                  <p>
                    <span className="text-slate-400">Status:</span>{" "}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[selected.status].classes}`}>
                      {STATUS_BADGE[selected.status].label}
                    </span>
                  </p>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => handleApprove(selected.id)}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                    style={{ backgroundColor: "#CAEF61", color: "#0A2416" }}
                  >
                    Approve
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleReject(selected.id)}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97] disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">KYC Documents</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${KYC_BADGE[selected.kyc_status].classes}`}>
                    {KYC_BADGE[selected.kyc_status].label}
                  </span>
                </div>
                {selected.kyc_documents.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400">No documents uploaded.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selected.kyc_documents.map((doc: KycDocument) => (
                      <li key={doc.path} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="flex-1 truncate text-slate-700" title={doc.name}>{doc.name}</span>
                        <button
                          onClick={() => handleOpenDoc(doc.path)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-all active:scale-[0.97]"
                        >
                          Open
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    disabled={isPending || selected.kyc_status === "verified"}
                    onClick={() => handleKycStatus(selected.id, "verified")}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    Verify KYC
                  </button>
                  <button
                    disabled={isPending || selected.kyc_status === "rejected"}
                    onClick={() => handleKycStatus(selected.id, "rejected")}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    Reject KYC
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Platform Fee %
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
                      focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#3D7A52] transition-all"
                  />
                  <button
                    disabled={isPending || feeInput === String(selected.platform_fee_percent)}
                    onClick={() => handleSaveFee(selected.id)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#0A2416] text-white transition-all active:scale-[0.97] disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
                {selected.business_type === "women" && (
                  <p className="mt-2 text-xs text-slate-400">Women Partners default to 0% platform fee.</p>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
