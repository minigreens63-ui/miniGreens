import type { Metadata } from "next";
import { Clock, EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { PageShell, Panel } from "@/components/PageShell";

export const metadata: Metadata = { title: "Contact | Mini Greens Company" };

const DETAILS = [
  { icon: Phone, label: "Phone", value: "+91 99803 44273" },
  { icon: EnvelopeSimple, label: "Email", value: "theminigreenscompany@gmail.com" },
  { icon: MapPin, label: "Farm", value: "123 Green Farm Road, Wayanad, Kerala 673121" },
  { icon: Clock, label: "Hours", value: "Monday to Saturday, 7:00 – 18:00" },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Talk To The People"
      accent="Who Grow It"
      intro="No call centre, no ticket queue. Messages reach the same six people who seed, cut, and pack your order."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Reach Us">
          <ul className="space-y-5">
            {DETAILS.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-(--color-border) text-(--color-sage)">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-xs tracking-wide text-(--color-sage) uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-(--color-cream)">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Visiting The Farm">
          <p>
            We open the growing room to visitors most Saturday mornings between
            9:00 and 12:00. There&apos;s no charge and no booking system — just send
            us a note the week before so we know to expect you.
          </p>
          <p>
            For wholesale, café supply, or workplace subscriptions, email us
            with rough volumes and delivery days. We usually reply within one
            working day.
          </p>
          <p>
            Something wrong with an order? Call us. We&apos;d rather fix it the same
            day than have you fill in a form.
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
