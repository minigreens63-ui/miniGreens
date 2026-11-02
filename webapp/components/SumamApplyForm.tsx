"use client";

import { useState } from "react";
import { CheckCircle, PaperPlaneTilt, FileText, X } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-(--color-forest)/10 bg-(--color-cream) px-4 py-3 text-sm text-(--color-forest) outline-none transition-colors placeholder:text-(--color-forest)/40 focus:border-(--color-forest)/50 focus:bg-white";

const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-forest)/60";

const AADHAAR_ACCEPT = "image/*,application/pdf";
const AADHAAR_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export function SumamApplyForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aadhaar, setAadhaar] = useState<File | null>(null);

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(31,58,36,0.08)]">
        <CheckCircle size={44} weight="fill" className="text-(--color-leaf)" />
        <h3 className="font-serif-display mt-4 text-3xl text-(--color-forest)">Application received</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-(--color-forest)/70">
          Thank you for applying to Sumam. Our team will reach out to you shortly to guide you through the
          next steps.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);

        if (!aadhaar) {
          setError("Please attach your Aadhaar document.");
          return;
        }
        if (aadhaar.size > AADHAAR_MAX_BYTES) {
          setError("That file is larger than 10MB.");
          return;
        }

        setSubmitting(true);
        const form = e.currentTarget;
        const data = new FormData(form);
        const supabase = createSupabaseBrowserClient();

        const folder = crypto.randomUUID();
        const path = `${folder}/${aadhaar.name}`;
        const { error: uploadError } = await supabase.storage.from("sumam-documents").upload(path, aadhaar, {
          contentType: aadhaar.type || "application/octet-stream",
        });
        if (uploadError) {
          setSubmitting(false);
          setError("Couldn't upload your Aadhaar document. Please try again.");
          return;
        }

        const { error: insertError } = await supabase.from("sumam_applications").insert({
          full_name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          address: String(data.get("address") ?? ""),
          message: String(data.get("message") ?? "") || null,
          aadhaar_document: { name: aadhaar.name, path, uploaded_at: new Date().toISOString() },
        });

        setSubmitting(false);
        if (insertError) {
          setError("Couldn't submit your application. Please try again.");
          return;
        }
        setSent(true);
      }}
      className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(31,58,36,0.08)] md:p-10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">Apply to Sumam</p>
      <h2 className="font-serif-display mt-2 text-3xl text-(--color-forest)">Start Your Application</h2>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">Full name</label>
          <input id="name" name="name" required className={inputClass} placeholder="Riya Kapoor" />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" required type="email" className={inputClass} placeholder="riya@email.com" />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" required type="tel" className={inputClass} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Address</label>
          <input id="address" name="address" required className={inputClass} placeholder="City, State" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="message">Tell us a little about yourself (optional)</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className={inputClass}
            placeholder="Why would you like to join Sumam?"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Aadhaar document</label>
          {aadhaar ? (
            <div className="flex items-center gap-2 rounded-xl bg-(--color-cream) px-4 py-3 text-sm">
              <FileText size={18} className="shrink-0 text-(--color-leaf)" />
              <span className="flex-1 truncate text-(--color-forest)" title={aadhaar.name}>
                {aadhaar.name}
              </span>
              <button
                type="button"
                onClick={() => setAadhaar(null)}
                className="text-(--color-forest)/40 hover:text-(--color-sale)"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-(--color-forest)/25 bg-(--color-cream) px-4 py-4 text-sm font-medium text-(--color-forest)/70 transition-colors hover:border-(--color-forest)/50">
              Add Aadhaar (image or PDF)
              <input
                type="file"
                accept={AADHAAR_ACCEPT}
                className="hidden"
                onChange={(e) => setAadhaar(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="mt-1 text-xs text-(--color-forest)/40">Only your Aadhaar is required, up to 10MB.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-(--color-sale)">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 flex items-center gap-2 rounded-full bg-(--color-sun) px-7 py-3.5 text-sm font-semibold text-(--color-forest) shadow-sm transition-colors hover:bg-(--color-sun-dark) disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Application"}
        <PaperPlaneTilt size={16} weight="bold" />
      </button>
    </form>
  );
}
