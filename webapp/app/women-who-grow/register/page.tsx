import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { SumamApplyForm } from "@/components/SumamApplyForm";

export const metadata: Metadata = {
  title: "Apply to Sumam | Mini Greens Company",
  description: "Apply to Sumam, Mini Greens Company's women entrepreneurship program.",
  alternates: { canonical: "/women-who-grow/register" },
};

export default function SumamRegisterPage() {
  return (
    <PageShell
      eyebrow="Women entrepreneurship"
      title="Apply to Sumam"
      intro="Fill in your details and attach your Aadhaar document. Our team will review your application and reach out to you shortly."
    >
      <div className="mx-auto max-w-2xl pb-16">
        <SumamApplyForm />
      </div>
    </PageShell>
  );
}
