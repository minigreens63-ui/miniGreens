import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Drop, Plant, ShieldCheck, Timer } from "@phosphor-icons/react/dist/ssr";
import { BRAND_CLAIM } from "@/lib/brand";

const POINTS = [
  {
    icon: Timer,
    label: "Cut the morning it ships",
    detail: "Harvested the day your box leaves us, never from cold storage.",
  },
  {
    icon: ShieldCheck,
    label: "No pesticides, ever",
    detail: "Grown indoors in clean media. No sprays, no chemical runoff.",
  },
  {
    icon: Drop,
    label: "Naturally caffeine-free",
    detail: "Every tea blend is microgreens and botanicals only, with no additives.",
  },
  {
    icon: Plant,
    label: "Grown to order",
    detail: "We plant against orders, so nothing sits in a warehouse.",
  },
];

export function WhyChooseUs() {
  return (
    <section id="story" className="bg-(--color-bg-muted)">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-6">
        <div className="relative mx-auto aspect-square w-full max-w-lg lg:max-w-none">
          <Image
            src="/images/dome-peashoot.webp"
            alt="Fresh pea shoot microgreens under a glass dome"
            fill
            loading="lazy"
            className="object-contain"
            sizes="(min-width: 1024px) 45vw, 90vw"
          />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-(--color-navy)/60">
            Why Mini Greens
          </p>
          <h2 className="font-display mt-1 text-3xl font-bold text-(--color-navy) sm:text-4xl">
            Fresher Than A Supermarket Shelf
          </h2>

          <p className="mt-5 max-w-md text-(--color-muted)">
            As {BRAND_CLAIM}, we keep it simple: no middlemen, no warehouse, no shelf life spent in transit. What we
            grow goes straight from our farm to your kitchen.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-(--color-navy) shadow-sm">
                  <Icon size={15} weight="bold" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-(--color-ink)">{label}</span>
                  <span className="block text-sm text-(--color-muted)">{detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-(--color-navy) px-7 py-3.5 font-semibold text-white transition-colors hover:bg-(--color-navy-dark)"
          >
            Our Story
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
