import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  EnvelopeSimple,
  MapPin,
  NavigationArrow,
  Phone,
  Plant,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "@/components/ContactForm";
import { ScriptNote } from "@/components/home/ScriptNote";

export const metadata: Metadata = {
  title: "Contact Mini Greens Company",
  description:
    "Get in touch with Mini Greens Company for orders, subscriptions, partnerships and farm visits.",
  alternates: { canonical: "/contact" },
};

const FARM_ADDRESS = "123 Green Farm Road, Wayanad, Kerala 673121";

const DETAILS = [
  { icon: Phone, label: "Call us", value: "+91 98765 43210", href: "tel:+919876543210" },
  {
    icon: EnvelopeSimple,
    label: "Email",
    value: "theminigreenscompany@gmail.com",
    href: "mailto:theminigreenscompany@gmail.com",
  },
  { icon: MapPin, label: "The farm", value: "Green Farm Road, Wayanad" },
  { icon: Clock, label: "Hours", value: "Mon – Sat, 7:00 – 18:00" },
];

export default function ContactPage() {
  const mapQuery = encodeURIComponent(FARM_ADDRESS);

  return (
    <div className="bg-(--color-cream)">
      {/* Intro */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
              Contact
            </p>
            <h1 className="font-serif-display mt-4 text-5xl leading-[1.04] text-(--color-forest) sm:text-6xl">
              Talk To The People
              <br />
              Who Grow It.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-(--color-forest)/75">
              No call centre, no ticket queue. Messages reach the same small team that seeds,
              cuts, and packs your order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#message"
                className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) shadow-sm transition-colors hover:bg-(--color-sun-dark)"
              >
                Send a Message
                <ArrowRight size={15} weight="bold" />
              </a>
              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2.5 rounded-full border border-(--color-forest)/30 bg-white/60 px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:border-(--color-forest)"
              >
                <Phone size={16} />
                Call the Farm
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[16/11] overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(31,58,36,0.12)]">
              <Image
                src="/images/journal/grow-room.webp"
                alt="Shelves of microgreen trays in the Mini Greens growing room"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_6px_24px_rgba(31,58,36,0.14)] sm:-left-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-(--color-forest) text-white">
                <Plant size={18} weight="fill" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-(--color-forest)">Replies within 1 day</span>
                <span className="block text-[11px] text-(--color-forest)/60">From the growing team</span>
              </span>
            </div>
            <ScriptNote
              lines={["We read", "every message"]}
              arrow="down"
              className="absolute -top-[4.5rem] right-6 hidden lg:block"
            />
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="border-y border-black/5 bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-7 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
          {DETAILS.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-cream) text-(--color-forest)">
                <Icon size={20} weight="light" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-forest)/55">
                  {label}
                </span>
                {href ? (
                  <a
                    href={href}
                    className="block break-all text-sm font-semibold text-(--color-forest) transition-colors hover:text-(--color-leaf)"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="block text-sm font-semibold text-(--color-forest)">{value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Form + visiting */}
      <section id="message" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 md:px-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.45fr_1fr]">
          <ContactForm />

          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-(--color-forest) p-8 text-white md:p-10">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/images/leaf-bg.webp')] bg-cover bg-center opacity-25 mix-blend-luminosity"
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-sun)">
                Come say hello
              </p>
              <h2 className="font-serif-display mt-2 text-3xl leading-[1.1]">Visiting the Farm</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                We open the growing room to visitors most Saturday mornings between 9:00 and
                12:00. No charge, no booking system. Just send us a note the week before so we
                know to expect you.
              </p>

              <div className="mt-8 border-t border-white/15 pt-8">
                <span className="flex size-11 items-center justify-center rounded-full border border-white/40">
                  <Storefront size={20} weight="light" />
                </span>
                <h3 className="mt-4 text-base font-semibold">Wholesale &amp; Workplaces</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  For wholesale, café supply, or workplace subscriptions, email us with rough
                  volumes and delivery days. We usually reply within one working day.
                </p>
                <a
                  href="mailto:theminigreenscompany@gmail.com"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun)"
                >
                  Email the Team
                  <ArrowRight size={15} weight="bold" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
          Find us
        </p>
        <h2 className="font-serif-display mt-2 text-3xl text-(--color-forest) sm:text-4xl">
          Where Your Greens Grow
        </h2>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-[0_4px_24px_rgba(31,58,36,0.08)]">
          <div className="relative h-80 w-full sm:h-96">
            <iframe
              title="Mini Greens Company farm location"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md sm:left-6 sm:top-6">
              <span className="flex size-7 items-center justify-center rounded-full bg-(--color-forest) text-white">
                <MapPin size={15} weight="fill" />
              </span>
              <span className="text-xs font-semibold text-(--color-forest) sm:text-sm">
                Mini Greens Farm, Wayanad
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center md:px-8">
            <p className="text-sm text-(--color-forest)/70">{FARM_ADDRESS}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-(--color-sun) px-5 py-2.5 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Get Directions
              <NavigationArrow size={15} weight="bold" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
