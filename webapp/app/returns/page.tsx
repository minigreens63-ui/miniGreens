import type { Metadata } from "next";
import { PageShell, Panel } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Returns & Refunds | Mini Greens Company",
  description:
    "Our returns and refund policy for our fresh tea blends.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <PageShell
      eyebrow="Customer Care"
      title="If It Isn't Right, We Make It Right"
      intro="Fresh produce can't be restocked, so we don't ask you to send anything back. If a box disappoints, tell us and we'll replace or refund it."
    >
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Tell Us Within 24 Hours">
          <p>
            Greens are at their best the day they arrive, so we need to hear
            about problems quickly. Message or call us within a day of delivery
            with your order number and a photo if you have one.
          </p>
          <p>
            We don&apos;t need the produce back. Please compost it rather than
            returning it to us.
          </p>
        </Panel>

        <Panel title="What You'll Get">
          <p>
            You choose: a replacement on your next delivery run, a credit
            applied to your account, or a full refund to your original payment
            method. Refunds are processed within three to five working days.
          </p>
          <p>
            For subscription boxes, we can also credit the affected week and
            push your billing date forward.
          </p>
        </Panel>

        <Panel title="What Isn't Covered">
          <p>
            We can&apos;t cover produce left outside in the heat after a successful
            delivery, or boxes reported more than seven days after arrival.
          </p>
          <p>
            If nobody was home and the delivery had to be aborted, get in touch
            and we&apos;ll usually reschedule at no cost the first time.
          </p>
        </Panel>

        <Panel title="Cancelling An Order">
          <p>
            Preorders can be cancelled free of charge until the evening before
            your delivery slot, because that&apos;s when we decide what to cut.
          </p>
          <p>
            Subscriptions can be skipped or cancelled at any time from your
            account, with no notice period and no cancellation fee.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
