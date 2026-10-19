import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coffee, Heart, Leaf, Truck } from "@phosphor-icons/react/dist/ssr";
import { ScriptNote } from "@/components/home/ScriptNote";
import { BRAND_CLAIM_SHORT } from "@/lib/brand";

const BADGES = [
  { Icon: Leaf, label: ["100%", "Plant-based"] },
  { Icon: Coffee, label: ["Caffeine-free", "Teas"] },
  { Icon: Heart, label: ["No Artificial", "Additives"] },
  { Icon: Truck, label: ["Freshly Cut &", "Delivered"] },
];

const HERO_SRC = "/images/hero/hero-flatlay-cream.webp";
const HERO_MOBILE_SRC = "/images/hero/hero-tube-mobile.webp";
const HERO_ALT = "Mini Greens Green Detox microgreen tea tube with a glass of tea and fresh microgreens";

export function HomeHero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-(--color-cream) pt-(--nav-h)"
      style={{ marginTop: "calc(-1 * (var(--nav-h) + 1px))" }}
    >
      {/* Desktop: full-bleed photo with the copy over its cream left side. */}
      <Image
        src={HERO_SRC}
        alt={HERO_ALT}
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-[70%_center] md:block"
      />
      <div className="absolute inset-0 hidden bg-linear-to-r from-(--color-cream) via-(--color-cream)/40 via-35% to-transparent to-60% md:block" />
      {/* Light fade under the transparent navbar so its links stay legible over the photo. */}
      <div className="absolute inset-x-0 top-0 hidden h-36 bg-linear-to-b from-white/60 to-transparent md:block" />

      <ScriptNote
        lines={["Wellness", "in every cup"]}
        className="absolute left-[40%] top-[24%] hidden xl:block"
      />

      {/* Mobile: product photo first, at full strength, then the copy. */}
      <div className="relative aspect-square md:hidden">
        <Image src={HERO_MOBILE_SRC} alt={HERO_ALT} fill priority sizes="100vw" className="object-cover object-[center_68%]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-(--color-cream) to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-6 pb-12 pt-2 md:min-h-[560px] md:px-10 md:py-16 lg:min-h-[600px]">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            {BRAND_CLAIM_SHORT}
          </p>
          <h1 className="font-serif-display mt-3 text-[2.75rem] leading-[1.02] text-(--color-forest) sm:text-6xl md:mt-4">
            A Greener
            <br />
            You, Naturally.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-(--color-forest)/75 md:mt-5">
            Fresh microgreens, microgreen tea bags and drinks, grown clean and delivered across
            Bengaluru. Real greens, one cup and one meal at a time.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 md:mt-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) shadow-sm transition-colors hover:bg-(--color-sun-dark)"
            >
              Shop Now
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/subscriptions/custom?frequency=weekly"
              className="inline-flex items-center gap-2 rounded-full border border-(--color-forest)/30 bg-white/60 px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:border-(--color-forest)"
            >
              Start a Subscription
            </Link>
          </div>

          <ul className="mt-9 grid w-max max-w-full grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-4 md:mt-10">
            {BADGES.map(({ Icon, label }) => (
              <li key={label.join(" ")} className="flex items-center gap-2 whitespace-nowrap text-xs leading-tight text-(--color-forest)/80">
                <Icon size={22} weight="light" className="shrink-0 text-(--color-forest)" />
                <span>
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
