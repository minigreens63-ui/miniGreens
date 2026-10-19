import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Drop, Leaf, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const BADGES = [
  { icon: ShieldCheck, label: "100% Organic" },
  { icon: Drop, label: "Caffeine Optional" },
  { icon: Leaf, label: "Plastic Free" },
];

export function Hero() {
  return (
    <section className="bg-(--color-bg-muted)">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:py-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-(--color-navy)/10 px-4 py-1.5 text-xs font-semibold text-(--color-navy)">
            <Leaf size={14} weight="fill" />
            Microgreens in Every Cup
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.1] text-(--color-navy) sm:text-5xl lg:text-6xl">
            Our Most
            <br />
            Loved Greens
          </h1>

          <p className="mt-5 max-w-md text-(--color-muted)">
            Premium tea bags and fresh-cut microgreens grown with care, for a
            healthier, brighter you.
          </p>

          <div className="mt-6 flex flex-wrap gap-5">
            {BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-(--color-ink)">
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-(--color-navy) shadow-sm">
                  <Icon size={14} weight="bold" />
                </span>
                {label}
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-full bg-(--color-accent) px-7 py-3.5 font-semibold text-(--color-navy) transition-colors hover:bg-(--color-accent-dark)"
            >
              Shop Now
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-full border border-(--color-navy)/20 px-7 py-3.5 font-semibold text-(--color-navy) transition-colors hover:border-(--color-navy)"
            >
              Our Story
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-[3/2] w-full max-w-xl lg:max-w-none">
          <Image
            src="/images/tea-hero-website.webp"
            alt="A glass cup of microgreen tea beside a Mini Greens Microgreen Tea box"
            fill
            priority
            className="rounded-3xl object-cover shadow-xl"
            sizes="(min-width: 1024px) 52vw, 90vw"
          />
        </div>
      </div>
    </section>
  );
}
