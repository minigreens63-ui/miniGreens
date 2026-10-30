import Link from "next/link";
import {
  ArrowRight,
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  Plant,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";
import { BRAND_CLAIM_SHORT } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Tea Blends", href: "/shop" },
      { label: "Subscriptions", href: "/subscriptions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "Women Who Grow", href: "/women-who-grow" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "My Orders", href: "/orders" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Returns", href: "/returns" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/minigreenscompany?stkn=Z2xicDlsMTV3aDR2", Icon: InstagramLogo },
  { label: "YouTube", href: "https://youtube.com/@minigreenscompany?si=qGXg6oBTXMWQc8Ps", Icon: YoutubeLogo },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/mini-greens-company/", Icon: LinkedinLogo },
  { label: "X", href: "https://x.com/MiniGreencompay", Icon: XLogo },
  { label: "Email", href: "mailto:theminigreenscompany@gmail.com", Icon: EnvelopeSimple },
];

export function Footer() {
  return (
    <footer className="relative z-10 bg-(--color-forest-deep) text-white/80">
      <div className="mx-auto max-w-7xl px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 md:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1.4fr]">
          <div>
            <Logo width={116} color="#ffffff" accentColor="#ffffff" />
            <p className="mt-4 max-w-56 text-xs leading-relaxed text-white/60">
              {BRAND_CLAIM_SHORT}. Handpicked microgreen tea blends grown with care, delivered fresh to your doorstep.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-xs text-white/60">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-white">Join MGC</h4>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Birthday rewards, order tracking and subscriptions in one account.
            </p>
            {/* Hands the email to the sign-in page, which sends a one-time code. */}
            <form action="/login" method="get" className="mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 pl-4">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                aria-label="Email address"
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Create account"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-(--color-forest) transition-colors hover:bg-(--color-sun)"
              >
                <ArrowRight size={16} weight="bold" />
              </button>
            </form>
            <div className="mt-5 flex gap-5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-white/85 transition-colors hover:text-(--color-sun)"
                >
                  <Icon size={20} weight="fill" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© 2026 Mini Greens Company. All rights reserved.</p>
          <p className="flex items-center gap-2 text-sm text-white/85">
            <Plant size={20} weight="fill" className="text-[#9cc56b]" />
            Small Greens. Bigger Tomorrows
          </p>
        </div>
      </div>
    </footer>
  );
}
