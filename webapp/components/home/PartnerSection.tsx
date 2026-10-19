import Image from "next/image";
import Link from "next/link";
import { ArrowRight, House, Handshake, Plant, Users } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { BRAND_CLAIM } from "@/lib/brand";

// "Become an MGC Partner" pitch from the MGC 2.0 brief.

const STEPS = [
  { title: "You Grow", body: "Fresh microgreens from your home, farm or space, following MGC's growing practices." },
  { title: "We Connect", body: "Our platform brings your greens to customers, restaurants and businesses." },
  { title: "We Help You Sell", body: "We bring the orders, so you spend your time growing, not hunting for buyers." },
  { title: "You Earn", body: "You supply and earn from your sales. MGC earns a small platform fee." },
];

const WHO: { title: string; body: string; icon: PhosphorIcon }[] = [
  { title: "Women entrepreneurs", body: "An extra source of income, grown from your own home.", icon: Handshake },
  { title: "Small farmers", body: "Add microgreens to your land, and we help find the buyers.", icon: Plant },
  { title: "Senior citizens", body: "Stay active and productive, on a schedule that suits you.", icon: Users },
  { title: "Homemakers & home growers", body: "Start small with a tray on your balcony or in a spare room.", icon: House },
];

export function PartnerSection() {
  return (
    <section className="relative overflow-hidden bg-(--color-forest) text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-sun)">MGC Partner Network</p>
          <h2 className="font-serif-display mt-3 text-4xl leading-[1.08] sm:text-5xl">
            Grow With Us.
            <br />
            We&apos;ll Help You Reach the Market.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
            Join {BRAND_CLAIM}. You don&apos;t need a large farm to become a grower. With the right knowledge and a reliable
            marketplace, microgreens can be grown in homes and small spaces, and many small growers can
            serve a larger market together.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Who can become a partner">
            {WHO.map(({ title, body, icon: Icon }) => (
              <li key={title}>
                <Link
                  href="/partner/apply"
                  className="group flex h-full gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-5 transition-colors hover:border-(--color-sun)/60 hover:bg-white/[0.1]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--color-sun) text-(--color-forest)">
                    <Icon size={22} weight="fill" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-white/75">{body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/partner/apply"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Become a Partner
              <ArrowRight size={15} weight="bold" />
            </Link>
            <p className="font-script text-2xl text-white/85">You Grow. We Connect. Together, We Grow.</p>
          </div>
        </div>

        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src="/images/journal/grow-room.webp"
              alt="Shelves of microgreen trays growing under soft lights in a bright room"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-white/[0.07] p-4">
                <p className="flex items-center gap-2.5">
                  <span className="font-display flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold text-(--color-forest)">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold">{s.title}</span>
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/75">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
