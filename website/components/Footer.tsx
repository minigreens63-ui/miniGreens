import Link from "next/link";
import { ArrowRight, EnvelopeSimple, FacebookLogo, InstagramLogo, MapPin, Phone, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const CUSTOMER_CARE = [
  { label: "My Orders", href: "/orders" },
  { label: "Returns", href: "/returns" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="relative z-10 mx-auto max-w-7xl px-6 py-14 md:px-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
          <h3 className="font-display text-lg">Stay Updated</h3>
          <p className="mt-2 text-sm text-(--color-muted)">
            Get the latest offers &amp; updates straight to your inbox.
          </p>
          <form className="mt-4 flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-ink) p-1.5">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-transparent px-3 text-sm outline-none placeholder:text-(--color-muted)"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-olive) text-white"
            >
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>

        <div>
          <h4 className="font-medium text-(--color-sage)">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-(--color-muted)">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-(--color-cream)">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-(--color-sage)">Customer Care</h4>
          <ul className="mt-4 space-y-2 text-sm text-(--color-muted)">
            {CUSTOMER_CARE.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-(--color-cream)">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-(--color-sage)">Contact Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-(--color-muted)">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-(--color-sage)" /> +91 99803 44273
            </li>
            <li className="flex items-center gap-2">
              <EnvelopeSimple size={16} className="text-(--color-sage)" /> theminigreenscompany@gmail.com
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-(--color-sage)" />
              123 Green Farm Road, Wayanad, Kerala 673121
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-(--color-border) pt-6 text-sm text-(--color-muted) sm:flex-row">
        <p>© 2024 Mini Greens Company. All rights reserved.</p>
        <div className="flex gap-3">
          {[InstagramLogo, FacebookLogo, YoutubeLogo].map((Icon, i) => (
            <span
              key={i}
              className="flex size-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-cream)"
            >
              <Icon size={16} />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
