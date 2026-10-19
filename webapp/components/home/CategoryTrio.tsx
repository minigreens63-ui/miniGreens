import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

type Tile = {
  eyebrow: string;
  title: string;
  blurb: string;
  image: string;
  imageClass: string;
  links: { label: string; href: string }[];
};

// The three customer categories from the MGC 2.0 brief. "Microgreen Drinks" maps to
// the cold-pressed juices line until a dedicated drinks range exists.
const TILES: Tile[] = [
  {
    eyebrow: "Cut to order",
    title: "Raw Microgreens",
    blurb: "Fresh trays for your meals, salads and bowls.",
    image: "/images/products/category-microgreens-sage.webp",
    imageClass: "object-cover",
    links: [{ label: "Shop Microgreens", href: "/shop?category=microgreens" }],
  },
  {
    eyebrow: "8 blends · caffeine-free",
    title: "Microgreen Tea Bags",
    blurb: "An easy daily way to enjoy your greens, one cup at a time.",
    image: "/images/products/category-tea-blends.webp",
    imageClass: "object-cover",
    links: [{ label: "Shop Tea Bags", href: "/shop?category=tea-blends" }],
  },
  {
    eyebrow: "For active lifestyles",
    title: "Microgreen Drinks",
    blurb: "Cold-pressed juices with a microgreen boost.",
    image: "/images/products/category-drinks-sage.webp",
    imageClass: "object-cover object-[65%_center]",
    links: [{ label: "Shop Juices", href: "/shop?category=juices" }],
  },
];

export function CategoryTrio() {
  return (
    <section className="bg-(--color-cream)">
      <div className="mx-auto max-w-7xl px-6 pb-4 pt-14 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
          What we grow
        </p>
        <h2 className="font-serif-display mt-2 text-3xl text-(--color-forest) sm:text-4xl">
          Three Ways to Get Your Greens
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TILES.map((t) => {
            const [primary, ...rest] = t.links;
            return (
              <div
                key={t.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(31,58,36,0.08)] transition-shadow hover:shadow-[0_8px_28px_rgba(31,58,36,0.16)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-(--color-cream-dark)">
                  <Image
                    src={t.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className={`${t.imageClass} transition-transform duration-500 group-hover:scale-105`}
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-leaf)">
                    {t.eyebrow}
                  </p>
                  <h3 className="font-serif-display mt-1.5 text-2xl text-(--color-forest)">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-(--color-forest)/70">{t.blurb}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {/* Stretched link: the whole tile goes to the primary destination. */}
                    <Link
                      href={primary.href}
                      className="inline-flex items-center gap-1.5 rounded-full bg-(--color-forest) px-4 py-2 text-[13px] font-semibold text-white transition-colors after:absolute after:inset-0 hover:bg-(--color-leaf)"
                    >
                      {primary.label}
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                    {rest.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-(--color-forest)/25 px-4 py-2 text-[13px] font-semibold text-(--color-forest) transition-colors hover:border-(--color-forest)"
                      >
                        {l.label}
                        <ArrowRight size={13} weight="bold" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
