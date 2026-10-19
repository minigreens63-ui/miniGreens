import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, Flask, Plant } from "@phosphor-icons/react/dist/ssr";
import { JOURNAL_POSTS } from "@/lib/journal";
import { JournalGrid } from "@/components/journal/JournalGrid";
import { ScriptNote } from "@/components/home/ScriptNote";

export const metadata: Metadata = {
  title: "The Journal: Microgreens Guides & Farm Stories | Mini Greens Company",
  description:
    "Practical guides on microgreens nutrition, storage and recipes, plus stories from our indoor farm in Bangalore.",
  alternates: { canonical: "/blog" },
};

const THEMES = [
  { Icon: Flask, title: "Nutrition", note: "What the research says" },
  { Icon: BookOpenText, title: "Kitchen", note: "Recipes & storage tips" },
  { Icon: Plant, title: "Farm", note: "Life in the growing room" },
];

export default function BlogPage() {
  const [featured] = JOURNAL_POSTS;

  return (
    <div className="bg-(--color-cream)">
      {/* Intro */}
      <section className="relative overflow-hidden">
        <ScriptNote
          lines={["Stories from", "the farm"]}
          className="absolute right-[8%] top-14 hidden lg:block"
        />
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 md:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            The Journal
          </p>
          <h1 className="font-serif-display mt-4 max-w-2xl text-5xl leading-[1.04] text-(--color-forest) sm:text-6xl">
            Notes From The
            <br />
            Growing Room
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-(--color-forest)/75">
            Recipes, research, and the occasional honest account of what went wrong in the
            greenhouse this month.
          </p>
        </div>
      </section>

      {/* Featured story */}
      <section className="mx-auto max-w-7xl px-6 md:px-10">
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid overflow-hidden rounded-3xl bg-white shadow-[0_4px_24px_rgba(31,58,36,0.08)] lg:grid-cols-[1.25fr_1fr]"
        >
          <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
            <Image
              src={featured.image}
              alt={featured.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute left-5 top-5 rounded-full bg-(--color-forest) px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Featured story
            </span>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
              {featured.category}
            </p>
            <h2 className="font-serif-display mt-3 text-3xl leading-[1.12] text-(--color-forest) sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-(--color-forest)/75">{featured.excerpt}</p>
            <p className="mt-6 text-[11px] font-medium uppercase tracking-wider text-(--color-forest)/55">
              {featured.date} · {featured.readTime}
            </p>
          </div>
        </Link>
      </section>

      {/* What we write about */}
      <section className="mt-12 border-y border-black/5 bg-white">
        <ul className="mx-auto grid max-w-7xl gap-6 px-6 py-7 sm:grid-cols-3 md:px-10">
          {THEMES.map(({ Icon, title, note }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-cream) text-(--color-forest)">
                <Icon size={20} weight="light" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-(--color-forest)">{title}</span>
                <span className="block text-[11px] text-(--color-forest)/60">{note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* All stories */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <JournalGrid posts={JOURNAL_POSTS} featuredSlug={featured.slug} />
      </section>

      {/* Closing band */}
      <section className="relative overflow-hidden bg-(--color-forest)">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[url('/images/leaf-bg.webp')] bg-cover bg-center opacity-25 mix-blend-luminosity"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 text-white md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-sun)">
              From the page to your plate
            </p>
            <h2 className="font-serif-display mt-2 text-3xl leading-[1.1] sm:text-4xl">
              Taste What We Write About.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/75">
              Fresh microgreens and microgreen teas, harvested the morning they reach you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-sun) px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-sun-dark)"
            >
              Shop Greens
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-(--color-forest) transition-colors hover:bg-(--color-cream)"
            >
              See Subscriptions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
