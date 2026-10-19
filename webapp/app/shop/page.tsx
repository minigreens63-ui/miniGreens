import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Repeat } from "@phosphor-icons/react/dist/ssr";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { ShopFilterChips } from "@/components/ShopFilterChips";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { resolveProductImage } from "@/lib/productImages";
import { categoryCopy } from "@/lib/categories";
import { FOREST, Note, PAPER, TornEdge, TornPhoto, condensed, serif } from "@/components/story/primitives";

// Handwritten aside in the hero, per category.
const HERO_NOTES: Record<string, string[]> = {
  "tea-blends": ["Steep it.", "Sip it.", "Feel it."],
  microgreens: ["Cut the", "morning", "it ships."],
  juices: ["Pressed", "at dawn."],
};
const DEFAULT_NOTE = ["Grown with", "care, cut", "to order."];

export const metadata: Metadata = {
  title: "Shop Fresh Microgreens, Juices & Tea Blends | Mini Greens Company",
  description:
    "Order pesticide-free microgreens, cold-pressed juices and microgreen tea blends, harvested to order in Bangalore and delivered fresh.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 60;

type ProductRow = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  category_id: string | null;
  rating: number | null;
  review_count: number | null;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const supabase = createSupabasePublicClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, description")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("products")
      .select(
        "slug, name, description, price, original_price, images, category_id, rating, review_count",
      )
      .eq("is_available", true)
      .order("is_featured", { ascending: false })
      .order("name"),
  ]);

  const cats = categories ?? [];
  const catById = new Map(cats.map((c) => [c.id, c]));
  // Products in a category the admin has hidden are hidden with it.
  const rows = ((products ?? []) as ProductRow[]).filter(
    (p) => !p.category_id || catById.has(p.category_id),
  );
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  const chipCats = cats
    .filter((c) => rows.some((p) => p.category_id === c.id));

  const activeSlug = category && catBySlug.has(category) ? category : null;
  const byCategory = activeSlug
    ? rows.filter((p) => catById.get(p.category_id ?? "")?.slug === activeSlug)
    : rows;

  const query = search?.trim().toLowerCase();
  const visible = query
    ? byCategory.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description ?? "").toLowerCase().includes(query),
      )
    : byCategory;

  const copy = categoryCopy(activeSlug ? (catBySlug.get(activeSlug) ?? null) : null);

  const note = (activeSlug && HERO_NOTES[activeSlug]) || DEFAULT_NOTE;

  return (
    <div style={{ backgroundColor: PAPER }}>
      {/* Hero */}
      <section className="relative isolate min-h-[520px] overflow-hidden lg:min-h-[600px]">
        <Image
          src="/images/story/shop-hero.webp"
          alt="A rustic farm table of fresh microgreens and juices on a misty hillside at sunrise"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[70%_center] lg:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f1e3]/90 via-[#f6f1e3]/60 to-transparent lg:hidden" />
        <div
          className="absolute inset-0 -z-10 hidden lg:block"
          style={{ background: "radial-gradient(ellipse 36% 52% at 26% 42%, rgba(249,244,231,0.7), transparent 72%)" }}
        />

        <Note
          lines={note}
          className="right-[6vw] top-[14%] -rotate-[12deg] text-[2rem] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] lg:text-[2.4rem]"
        />

        <div className="relative px-6 pb-36 pt-14 md:px-10 lg:pl-[12vw] lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">{copy.eyebrow}</p>
          <h1
            className={`${serif.className} mt-2 max-w-3xl text-6xl font-bold leading-[0.95] lg:text-[5.25rem]`}
            style={{ ...condensed, color: FOREST }}
          >
            {copy.title}
            {copy.accent && (
              <>
                <br />
                {copy.accent}
              </>
            )}
          </h1>
          <p className="mt-5 max-w-[27rem] text-[15px] leading-relaxed text-[#2f352c]">{copy.blurb}</p>
          <a href="#products" className="group mt-8 inline-flex items-center gap-4">
            <span
              className="flex size-12 items-center justify-center rounded-full text-white transition-transform group-hover:translate-y-0.5"
              style={{ backgroundColor: FOREST }}
            >
              <ArrowDown size={20} weight="bold" />
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#1f2a1c]">
              Browse
              <br />
              the harvest
            </span>
          </a>
        </div>

        <TornEdge seed={41} className="-bottom-[3px]" />
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-20 pt-8 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ShopFilterChips categories={chipCats} active={activeSlug} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2b3327]/70">
            {visible.length} {visible.length === 1 ? "product" : "products"}
            {query ? ` for “${search}”` : ""}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 text-[15px] text-[#3a4135]">
            {query ? `No products match "${search}".` : "No products in this category yet."}
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {visible.map((product) => (
              <HomeProductCard
                key={product.slug}
                product={{
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  price: Number(product.price),
                  originalPrice:
                    product.original_price != null ? Number(product.original_price) : null,
                  image: resolveProductImage(product.slug, product.images),
                  rating: product.rating,
                  reviewCount: product.review_count,
                  category: catById.get(product.category_id ?? "")?.slug ?? null,
                  categoryName: catById.get(product.category_id ?? "")?.name ?? null,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Subscription nudge */}
      <section className="mx-auto max-w-6xl px-6 pb-28 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-x-6">
          <div className="relative lg:col-span-5">
            <TornPhoto
              src="/images/story/step-03-box.webp"
              alt="A kraft Mini Greens box packed with trays of fresh pea shoots"
              seed={83}
              tilt={-1.5}
            />
            <Note
              lines={["Same greens,", "every week."]}
              desktopOnly
              className="-bottom-20 -left-8 -rotate-[11deg] text-[#29321f]"
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="flex gap-5">
              <span
                className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: FOREST, boxShadow: `0 0 0 8px ${PAPER}` }}
              >
                <Repeat size={24} weight="fill" />
              </span>
              <div className="pt-1">
                <h2
                  className={`${serif.className} text-[2rem] font-semibold leading-tight`}
                  style={{ ...condensed, color: FOREST }}
                >
                  Never Run Out
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2b3327]">
                  Subscribe &amp; get it weekly
                </p>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#3a4135]">
                  Put your favourites on repeat. Harvested the morning it ships, delivered free, and
                  you can skip or cancel any week.
                </p>
                <Link
                  href="/subscriptions"
                  className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c4a26]"
                  style={{ backgroundColor: FOREST }}
                >
                  See Subscriptions
                  <ArrowRight size={15} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
