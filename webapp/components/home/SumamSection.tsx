import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, HandHeart, Storefront } from "@phosphor-icons/react/dist/ssr";

// Pulls Sumam onto the homepage. Copy and claims are drawn from the
// /women-who-grow page itself, not new claims.

const CHIPS = [
  { Icon: HandHeart, label: "No platform fee" },
  { Icon: CheckCircle, label: "Starter kit + training" },
  { Icon: Storefront, label: "Sell with MGC" },
];

export function SumamSection() {
  return (
    <section className="bg-(--color-forest)">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 aspect-4/3 overflow-hidden rounded-3xl lg:order-1">
          <Image
            src="/images/women-who-grow/hero.webp"
            alt="A woman tending trays of fresh microgreens on a wooden shelf at home"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-sun)">
            Women entrepreneurship
          </p>
          <p className="font-serif-display mt-3 text-5xl leading-none text-white md:text-6xl">Sumam</p>
          <h2 className="font-serif-display mt-3 text-3xl leading-[1.1] text-white sm:text-4xl">
            When a woman earns, a family rises.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
            Sumam is MGC&apos;s women entrepreneurship program: a starter kit and training to grow microgreens at
            home, and a platform to sell them with us, keeping what you earn, with no platform fee.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3">
            {CHIPS.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              >
                <Icon size={16} weight="light" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/women-who-grow"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Learn About Sumam
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              Join Sumam
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
