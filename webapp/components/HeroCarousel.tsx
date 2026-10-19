"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

type Slide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    image: "/images/hero/hero-kitchen-pour.webp",
    alt: "Pouring fresh microgreen tea beside a Mini Greens kraft tube on a sunlit kitchen counter",
    eyebrow: "Brewed Fresh Daily",
    title: "Poured Fresh, Every Morning",
    description:
      "Steep our Green Detox microgreen tea and start the day clean, calm, and caffeine-free.",
  },
  {
    image: "/images/hero/hero-green-shadow.webp",
    alt: "Mini Greens microgreen tea tube on a marble pedestal against a deep green shadowed wall",
    eyebrow: "Microgreens in Every Cup",
    title: "Our Most Loved Greens",
    description:
      "Premium microgreen tea blends grown with care, for a healthier, brighter you.",
  },
  {
    image: "/images/hero/hero-flatlay-cream.webp",
    alt: "Mini Greens tube surrounded by fresh pea, radish, broccoli and sunflower microgreens on a cream flat lay",
    eyebrow: "Nourish. Sip. Thrive.",
    title: "Small Greens, Big Benefits",
    description:
      "Pea, radish, broccoli and sunflower microgreens, sun-dried and blended into every teabag.",
  },
  {
    image: "/images/hero/hero-stone-steps.webp",
    alt: "Mini Greens tube displayed on stone steps surrounded by potted microgreens",
    eyebrow: "Farm To Cup",
    title: "Rooted In Nature",
    description:
      "Grown clean, cut fresh, and delivered straight to your door. No middlemen, no shortcuts.",
  },
];

const AUTOPLAY_MS = 6000;

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-(--color-bg-muted)">
      <div className="relative aspect-[16/9] w-full sm:aspect-[16/7]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== active}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
              sizes="100vw"
            />

            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
                <div className="max-w-md">
                  <p className="mb-3 inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-(--color-navy) backdrop-blur-sm">
                    {slide.eyebrow}
                  </p>
                  <h1 className="font-display text-3xl font-bold leading-[1.1] text-(--color-navy) drop-shadow-sm sm:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-sm text-sm text-(--color-ink) sm:text-base">
                    {slide.description}
                  </p>
                  <div className="mt-7 flex gap-4">
                    <Link
                      href="/shop"
                      className="flex items-center gap-2 rounded-full bg-(--color-accent) px-6 py-3 text-sm font-semibold text-(--color-navy) transition-colors hover:bg-(--color-accent-dark) sm:px-7 sm:py-3.5 sm:text-base"
                    >
                      Shop Now
                      <ArrowRight size={16} weight="bold" />
                    </Link>
                    <Link
                      href="/about"
                      className="flex items-center gap-2 rounded-full border border-(--color-navy)/30 bg-white/70 px-6 py-3 text-sm font-semibold text-(--color-navy) backdrop-blur-sm transition-colors hover:border-(--color-navy) sm:px-7 sm:py-3.5 sm:text-base"
                    >
                      Our Story
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-(--color-navy)" : "w-2 bg-(--color-navy)/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
