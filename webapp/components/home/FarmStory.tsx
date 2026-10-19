import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Drop, Leaf, Package, Plant, Scissors, Sparkle, Timer } from "@phosphor-icons/react/dist/ssr";
import { BRAND_CLAIM } from "@/lib/brand";

// Merges the old FarmToCup + WhyMicrogreens sections: one story, one shop CTA.

const STEPS = [
  { Icon: Drop, title: "Seed", note: "Non-GMO seeds" },
  { Icon: Plant, title: "Grow", note: "Clean spaces, MGC standards" },
  { Icon: Scissors, title: "Harvest", note: "Cut fresh to order" },
  { Icon: Package, title: "Deliver", note: "Straight to your door" },
];

const BENEFITS = [
  { Icon: Sparkle, label: "Nutrient-dense" },
  { Icon: Leaf, label: "Rich in vitamins" },
  { Icon: Drop, label: "Naturally low calorie" },
  { Icon: Timer, label: "Fresh, never stored" },
];

export function FarmStory() {
  return (
    <section>
      <div className="relative overflow-hidden bg-(--color-forest-deep)">
        <Image
          src="/images/home/farm-hands.webp"
          alt="Hands holding a freshly harvested clump of pea-shoot microgreens in the greenhouse"
          fill
          sizes="100vw"
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-(--color-forest-deep) via-(--color-forest-deep)/80 via-35% to-transparent to-65%" />

        <div className="relative mx-auto flex min-h-[400px] max-w-7xl flex-col justify-center px-6 py-14 text-white md:px-10">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-sun)">
              From seed to a brighter you
            </p>
            <h2 className="font-serif-display mt-3 text-4xl leading-[1.08] sm:text-5xl">
              From Our Farm
              <br />
              to Your Cup
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/85">
              Grown by MGC, {BRAND_CLAIM}, and our partner growers to one quality standard, then cut fresh and
              delivered at their peak. No middlemen. No long storage.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop?category=microgreens"
                className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
              >
                Shop Fresh Microgreens
                <ArrowRight size={15} weight="bold" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 md:px-10 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-leaf)">Seed to doorstep</h3>
            <ol className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {STEPS.map(({ Icon, title, note }) => (
                <li key={title} className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-(--color-forest) shadow-[0_2px_10px_rgba(31,58,36,0.08)]">
                    <Icon size={20} weight="light" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-(--color-forest)">{title}</span>
                    <span className="block text-xs leading-snug text-(--color-forest)/65">{note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:border-l lg:border-(--color-forest)/10 lg:pl-10">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-(--color-leaf)">
              Small plants, big benefits
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
              {BENEFITS.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-(--color-forest)">
                  <Icon size={18} weight="light" className="shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
